import cron from "node-cron";
import { TwitterDMAgent } from "../agents/twitter-agent";
import { db } from "../db";
import { canvasNodes, messages, knowledgeChunks, prospects } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { AnalyticsService } from "../services/analytics-service";

interface TwitterJob {
    userId: string;
    agentId: string;
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
    targetAccounts: string[];
    dailyLimit: number;
    knowledgeBase: string[];
    schedule: string;
    requireApproval: boolean;
}

export class TwitterCronRunner {
    private jobs: Map<string, cron.ScheduledTask> = new Map();

    constructor() { }

    /**
     * Start all scheduled Twitter jobs from database
     */
    async startAll(): Promise<void> {
        console.log("Starting Twitter cron jobs...");

        try {
            const agents = await db
                .select()
                .from(canvasNodes)
                .where(
                    and(
                        eq(canvasNodes.agentType, "Twitter Agent"),
                        eq(canvasNodes.isActive, true)
                    )
                );

            for (const agent of agents) {
                const config = agent.config as any;

                if (config.twitterAppKey && config.twitterAccessToken && config.targetAccounts) {
                    await this.scheduleJob({
                        userId: agent.userId,
                        agentId: agent.id,
                        appKey: config.twitterAppKey,
                        appSecret: config.twitterAppSecret,
                        accessToken: config.twitterAccessToken,
                        accessSecret: config.twitterAccessSecret,
                        targetAccounts: config.targetAccounts,
                        dailyLimit: config.dailyTaskLimit || 50,
                        knowledgeBase: config.knowledgeBase || [],
                        schedule: config.schedule || "24/7",
                        requireApproval: config.requireApproval || false,
                    });
                }
            }

            console.log(`Scheduled ${this.jobs.size} Twitter agents`);
        } catch (error) {
            console.error("Error starting twitter cron jobs:", error);
        }
    }

    /**
     * Synchronize a specific job (start/stop) based on dynamic state
     */
    async syncJob(agentId: string): Promise<void> {
        try {
            const [agent] = await db
                .select()
                .from(canvasNodes)
                .where(eq(canvasNodes.id, agentId));

            if (!agent || !agent.isActive || agent.agentType !== "Twitter Agent") {
                this.jobs.forEach((task, id) => {
                    if (id.includes(agentId)) {
                        task.stop();
                        this.jobs.delete(id);
                        console.log(`Stopped Twitter job for agent ${agentId}`);
                    }
                });
                return;
            }

            const config = agent.config as any;
            if (config.twitterAppKey && config.twitterAccessToken && config.targetAccounts) {
                await this.scheduleJob({
                    userId: agent.userId,
                    agentId: agent.id,
                    appKey: config.twitterAppKey,
                    appSecret: config.twitterAppSecret,
                    accessToken: config.twitterAccessToken,
                    accessSecret: config.twitterAccessSecret,
                    targetAccounts: config.targetAccounts,
                    dailyLimit: config.dailyTaskLimit || 50,
                    knowledgeBase: config.knowledgeBase || [],
                    schedule: config.schedule || "24/7",
                    requireApproval: config.requireApproval || false,
                });
                console.log(`Synced/Started Twitter job for agent ${agentId}`);
            }
        } catch (error) {
            console.error(`Error syncing Twitter job ${agentId}:`, error);
        }
    }

    async scheduleJob(job: TwitterJob): Promise<void> {
        const jobId = `twitter-${job.userId}-${job.agentId}`;

        if (this.jobs.has(jobId)) {
            this.jobs.get(jobId)?.stop();
            this.jobs.delete(jobId);
        }

        let cronSchedule: string;
        if (job.schedule === "24/7") {
            cronSchedule = "0 */8 * * *"; // Every 8 hours
        } else if (job.schedule === "business-hours") {
            cronSchedule = "0 11,16 * * 1-5";
        } else {
            const [hour, minute] = (job.schedule.split(":") || ["11", "0"]).map(Number);
            cronSchedule = `${minute} ${hour} * * *`;
        }

        const task = cron.schedule(cronSchedule, async () => {
            await this.runJob(job);
        });

        this.jobs.set(jobId, task);
    }

    private async runJob(job: TwitterJob): Promise<void> {
        console.log(`Running Twitter agent for user ${job.userId}`);
        const agent = new TwitterDMAgent({
            appKey: job.appKey,
            appSecret: job.appSecret,
            accessToken: job.accessToken,
            accessSecret: job.accessSecret,
        });

        try {
            const knowledgeBase = await this.loadKnowledgeBase(job.knowledgeBase);

            const results = await agent.runCampaign(
                job.targetAccounts,
                knowledgeBase,
                { goal: "Engage with industry leaders", tone: "friendly" },
                job.dailyLimit
            );

            await this.saveResults(job.userId, job.agentId, results, job.requireApproval);
        } catch (error) {
            console.error(`Error running twitter job:`, error);
        }
    }

    private async loadKnowledgeBase(sourceIds: string[]): Promise<string[]> {
        if (!sourceIds || sourceIds.length === 0) return [];
        const chunks = await db.select().from(knowledgeChunks).where(eq(knowledgeChunks.sourceId, sourceIds[0]));
        return chunks.map((chunk) => chunk.content);
    }

    private async saveResults(userId: string, agentId: string, results: any[], requireApproval: boolean = false): Promise<void> {
        for (const result of results) {
            if (result.success) {
                // Save to messages table for inbox
                await db.insert(messages).values({
                    agentId,
                    userId,
                    channel: "twitter",
                    role: "assistant",
                    content: `Sent Twitter DM to ${result.user.username}\n\nMessage: ${result.message}`,
                    status: requireApproval ? "pending_approval" : "sent",
                    needsApproval: requireApproval,
                    isApproved: !requireApproval,
                    metadata: { type: "twitter_outreach", status: "sent", username: result.user.username },
                });

                // Sync with Prospects table (CRM)
                try {
                    await db.insert(prospects).values({
                        userId,
                        name: result.user.name || result.user.username,
                        profileUrl: `https://twitter.com/${result.user.username}`,
                        channel: "twitter",
                        status: "engaged",
                        lastInteractionAt: new Date(),
                        metadata: {
                            username: result.user.username,
                            agentId
                        }
                    }).onConflictDoUpdate({
                        target: prospects.profileUrl,
                        set: {
                            lastInteractionAt: new Date(),
                            status: "engaged",
                            updatedAt: new Date()
                        }
                    });
                } catch (crmError) {
                    console.error("Error syncing twitter prospect:", crmError);
                }

                // Trigger Workflow Engine
                try {
                    const { WorkflowService } = await import("../services/workflow-service");
                    await WorkflowService.triggerNext(agentId, userId, "dm_sent", {
                        username: result.user.username,
                        platform: 'twitter',
                        message: result.message
                    });
                } catch (workflowError) {
                    console.error("Error triggering workflow:", workflowError);
                }

                await AnalyticsService.logMessageSent(userId, agentId, "twitter");
                await AnalyticsService.logLead(userId, agentId, "twitter");
            }
        }
    }

    stopAll(): void {
        this.jobs.forEach((task) => task.stop());
        this.jobs.clear();
    }
}

let twitterRunner: TwitterCronRunner | null = null;
export function getTwitterRunner(): TwitterCronRunner {
    if (!twitterRunner) twitterRunner = new TwitterCronRunner();
    return twitterRunner;
}
