import { TwitterApi } from "twitter-api-v2";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface TwitterCredentials {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
}

interface TwitterUser {
    id: string;
    username: string;
    name: string;
    description?: string;
    profileUrl: string;
}

export class TwitterDMAgent {
    private client: TwitterApi;

    constructor(credentials: TwitterCredentials) {
        this.client = new TwitterApi({
            appKey: credentials.appKey,
            appSecret: credentials.appSecret,
            accessToken: credentials.accessToken,
            accessSecret: credentials.accessSecret,
        });
    }

    /**
     * Get users who engaged with target accounts
     */
    async getEngagedUsers(
        targetAccounts: string[],
        engagementType: "likes" | "retweets" | "replies" = "likes"
    ): Promise<TwitterUser[]> {
        const engagedUsers: TwitterUser[] = [];

        try {
            for (const account of targetAccounts) {
                // Get recent tweets from target account
                const tweets = await this.client.v2.userTimeline(account, {
                    max_results: 10,
                });

                for (const tweet of tweets.data.data || []) {
                    if (engagementType === "likes") {
                        // Get users who liked the tweet
                        const likers = await this.client.v2.tweetLikedBy(tweet.id, {
                            max_results: 20,
                        });

                        for (const user of likers.data || []) {
                            engagedUsers.push({
                                id: user.id,
                                username: user.username,
                                name: user.name,
                                description: user.description,
                                profileUrl: `https://twitter.com/${user.username}`,
                            });
                        }
                    } else if (engagementType === "retweets") {
                        // Get users who retweeted
                        const retweeters = await this.client.v2.tweetRetweetedBy(tweet.id, {
                            max_results: 20,
                        });

                        for (const user of retweeters.data || []) {
                            engagedUsers.push({
                                id: user.id,
                                username: user.username,
                                name: user.name,
                                description: user.description,
                                profileUrl: `https://twitter.com/${user.username}`,
                            });
                        }
                    }
                }
            }

            // Remove duplicates
            const uniqueUsers = Array.from(
                new Map(engagedUsers.map((user) => [user.id, user])).values()
            );

            return uniqueUsers;
        } catch (error) {
            console.error("Error getting engaged users:", error);
            return [];
        }
    }

    /**
     * Generate personalized DM using Claude
     */
    async generateDM(
        user: TwitterUser,
        knowledgeBase: string[],
        agentConfig: any
    ): Promise<string> {
        const context = knowledgeBase.join("\n\n");

        const prompt = `You are a sales professional writing a personalized Twitter DM.

User Information:
- Name: ${user.name}
- Username: @${user.username}
- Bio: ${user.description || "N/A"}

Company/Product Context:
${context}

Agent Configuration:
- Goal: ${agentConfig.goal || "Start a conversation"}
- Tone: ${agentConfig.tone || "friendly"}

Write a personalized Twitter DM that:
1. References their recent engagement or bio
2. Is conversational and friendly (not salesy)
3. Provides value or insight
4. Ends with a soft question
5. Is concise (max 280 characters)
6. Sounds natural

DM:`;

        try {
            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 300,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

            const message =
                response.content[0].type === "text" ? response.content[0].text : "";

            // Ensure message is under 280 characters (DM limit)
            return message.substring(0, 280);
        } catch (error) {
            console.error("Error generating DM:", error);
            return `Hey ${user.name.split(" ")[0]}, saw you engaging with some interesting content. Would love to connect!`;
        }
    }

    /**
     * Send DM to user
     */
    async sendDM(
        userId: string,
        message: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            await this.client.v2.sendDmToParticipant(userId, {
                text: message,
            });

            return { success: true };
        } catch (error: any) {
            console.error("Error sending DM:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if user follows us (to avoid spam)
     */
    async isFollower(userId: string): Promise<boolean> {
        try {
            const me = await this.client.v2.me();
            const followers = await this.client.v2.followers(me.data.id, {
                max_results: 1000,
            });

            return followers.data.some((follower) => follower.id === userId);
        } catch (error) {
            console.error("Error checking follower status:", error);
            return false;
        }
    }

    /**
     * Run Twitter DM campaign
     */
    async runCampaign(
        targetAccounts: string[],
        knowledgeBase: string[],
        agentConfig: any,
        dailyLimit: number = 50
    ): Promise<Array<{ user: TwitterUser; success: boolean; error?: string }>> {
        const results: Array<{
            user: TwitterUser;
            success: boolean;
            error?: string;
        }> = [];

        try {
            // Get engaged users
            const engagedUsers = await this.getEngagedUsers(targetAccounts);
            console.log(`Found ${engagedUsers.length} engaged users`);

            // Limit to daily quota
            const usersToContact = engagedUsers.slice(0, dailyLimit);

            for (const user of usersToContact) {
                try {
                    // Check if they follow us (optional - reduces spam risk)
                    const isFollower = await this.isFollower(user.id);

                    if (!isFollower) {
                        console.log(`Skipping ${user.username} - not a follower`);
                        continue;
                    }

                    // Generate personalized DM
                    const message = await this.generateDM(user, knowledgeBase, agentConfig);

                    // Send DM
                    const result = await this.sendDM(user.id, message);

                    results.push({
                        user,
                        success: result.success,
                        error: result.error,
                    });

                    // Random delay between DMs (5-15 minutes)
                    if (usersToContact.indexOf(user) < usersToContact.length - 1) {
                        await this.delay(300000, 900000);
                    }
                } catch (error: any) {
                    results.push({
                        user,
                        success: false,
                        error: error.message,
                    });
                }
            }
        } catch (error) {
            console.error("Campaign error:", error);
        }

        return results;
    }

    /**
     * Monitor DM inbox for replies
     */
    async monitorInbox(): Promise<Array<{ userId: string; message: string }>> {
        try {
            const events = await this.client.v2.listDmEvents();
            const messages: Array<{ userId: string; message: string }> = [];

            for await (const event of events) {
                if (event.event_type === "MessageCreate") {
                    messages.push({
                        userId: event.sender_id || "",
                        message: event.text || "",
                    });
                }
            }

            return messages;
        } catch (error) {
            console.error("Error monitoring inbox:", error);
            return [];
        }
    }

    /**
     * Random delay helper
     */
    private async delay(min: number, max: number): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}
