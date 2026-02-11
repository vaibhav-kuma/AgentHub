import axios from "axios";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface InstagramCredentials {
    accessToken: string;
    instagramBusinessAccountId: string;
}

interface InstagramUser {
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
}

interface InstagramMessage {
    id: string;
    from: { id: string; username: string };
    message: string;
    timestamp: string;
}

export class InstagramDMAgent {
    private accessToken: string;
    private accountId: string;
    private baseUrl = "https://graph.facebook.com/v18.0";

    constructor(credentials: InstagramCredentials) {
        this.accessToken = credentials.accessToken;
        this.accountId = credentials.instagramBusinessAccountId;
    }

    /**
     * Get users who engaged with recent posts
     */
    async getEngagedUsers(
        postLimit: number = 10
    ): Promise<InstagramUser[]> {
        const engagedUsers: InstagramUser[] = [];

        try {
            // Get recent media
            const mediaResponse = await axios.get(
                `${this.baseUrl}/${this.accountId}/media`,
                {
                    params: {
                        access_token: this.accessToken,
                        fields: "id,caption,like_count,comments_count",
                        limit: postLimit,
                    },
                }
            );

            const media = mediaResponse.data.data || [];

            for (const post of media) {
                // Get users who liked the post
                try {
                    const likesResponse = await axios.get(
                        `${this.baseUrl}/${post.id}/likes`,
                        {
                            params: {
                                access_token: this.accessToken,
                                fields: "id,username",
                                limit: 50,
                            },
                        }
                    );

                    for (const user of likesResponse.data.data || []) {
                        engagedUsers.push({
                            id: user.id,
                            username: user.username,
                        });
                    }
                } catch (error) {
                    console.error(`Error getting likes for post ${post.id}:`, error);
                }

                // Get users who commented
                try {
                    const commentsResponse = await axios.get(
                        `${this.baseUrl}/${post.id}/comments`,
                        {
                            params: {
                                access_token: this.accessToken,
                                fields: "from{id,username}",
                                limit: 50,
                            },
                        }
                    );

                    for (const comment of commentsResponse.data.data || []) {
                        if (comment.from) {
                            engagedUsers.push({
                                id: comment.from.id,
                                username: comment.from.username,
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error getting comments for post ${post.id}:`, error);
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
     * Get user profile info
     */
    async getUserProfile(userId: string): Promise<InstagramUser | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/${userId}`, {
                params: {
                    access_token: this.accessToken,
                    fields: "id,username,name,profile_picture_url",
                },
            });

            return {
                id: response.data.id,
                username: response.data.username,
                name: response.data.name,
                profilePictureUrl: response.data.profile_picture_url,
            };
        } catch (error) {
            console.error("Error getting user profile:", error);
            return null;
        }
    }

    /**
     * Generate personalized DM using Claude
     */
    async generateDM(
        user: InstagramUser,
        knowledgeBase: string[],
        agentConfig: any
    ): Promise<string> {
        const context = knowledgeBase.join("\n\n");

        const prompt = `You are a sales professional writing a personalized Instagram DM.

User Information:
- Username: @${user.username}
- Name: ${user.name || "N/A"}

Company/Product Context:
${context}

Agent Configuration:
- Goal: ${agentConfig.goal || "Start a conversation"}
- Tone: ${agentConfig.tone || "friendly"}

Write a personalized Instagram DM that:
1. References their recent engagement with your content
2. Is friendly and conversational
3. Provides value or insight
4. Ends with a soft question
5. Is concise (max 1000 characters)
6. Sounds natural and authentic

DM:`;

        try {
            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 500,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

            const message =
                response.content[0].type === "text" ? response.content[0].text : "";

            return message.substring(0, 1000);
        } catch (error) {
            console.error("Error generating DM:", error);
            return `Hey ${user.name || user.username}! Thanks for engaging with our content. Would love to connect!`;
        }
    }

    /**
     * Send DM to user
     */
    async sendDM(
        recipientId: string,
        message: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/me/messages`,
                {
                    recipient: { id: recipientId },
                    message: { text: message },
                },
                {
                    params: {
                        access_token: this.accessToken,
                    },
                }
            );

            return { success: true };
        } catch (error: any) {
            console.error("Error sending DM:", error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }

    /**
     * Get inbox messages
     */
    async getInboxMessages(limit: number = 50): Promise<InstagramMessage[]> {
        try {
            const response = await axios.get(
                `${this.baseUrl}/${this.accountId}/conversations`,
                {
                    params: {
                        access_token: this.accessToken,
                        fields: "id,messages{id,from,message,created_time}",
                        limit,
                    },
                }
            );

            const messages: InstagramMessage[] = [];

            for (const conversation of response.data.data || []) {
                for (const msg of conversation.messages?.data || []) {
                    messages.push({
                        id: msg.id,
                        from: msg.from,
                        message: msg.message,
                        timestamp: msg.created_time,
                    });
                }
            }

            return messages;
        } catch (error) {
            console.error("Error getting inbox messages:", error);
            return [];
        }
    }

    /**
     * Run Instagram DM campaign
     */
    async runCampaign(
        knowledgeBase: string[],
        agentConfig: any,
        dailyLimit: number = 50
    ): Promise<Array<{ user: InstagramUser; success: boolean; error?: string }>> {
        const results: Array<{
            user: InstagramUser;
            success: boolean;
            error?: string;
        }> = [];

        try {
            // Get engaged users
            const engagedUsers = await this.getEngagedUsers();
            console.log(`Found ${engagedUsers.length} engaged users`);

            // Limit to daily quota
            const usersToContact = engagedUsers.slice(0, dailyLimit);

            for (const user of usersToContact) {
                try {
                    // Get full profile
                    const profile = await this.getUserProfile(user.id);
                    if (!profile) {
                        console.log(`Skipping ${user.username} - couldn't fetch profile`);
                        continue;
                    }

                    // Generate personalized DM
                    const message = await this.generateDM(
                        profile,
                        knowledgeBase,
                        agentConfig
                    );

                    // Send DM
                    const result = await this.sendDM(user.id, message);

                    results.push({
                        user: profile,
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
     * Monitor inbox for new messages
     */
    async monitorInbox(): Promise<InstagramMessage[]> {
        try {
            return await this.getInboxMessages(20);
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
