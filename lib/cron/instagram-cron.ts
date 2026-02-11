import cron from "node-cron";
import { InstagramDMAgent } from "../agents/instagram-agent";
import { db } from "../db";
import { canvasNodes, messages, knowledgeChunks, prospects } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { AnalyticsService } from "../services/analytics-service";

interface InstagramJob {
    userId: string;
    agentId: string;
    accessToken: string;
    instagramBusinessAccountId: string;
    dailyLimit: number;
    knowledgeBase: string[];
    schedule: string;
    requireApproval: boolean;
}

export class InstagramCronRunner {
    private jobs: Map<string, cron.ScheduledTask> = new Map();

    constructor() { }

    /**
     * Start all scheduled Instagram jobs from database
     */
    async startAll(): Promise<void> {
        console.log("Starting Instagram cron jobs...");

        try {
            const agents = await db
                .select()
                .from(canvasNodes)
                .where(
                    and(
                        eq(canvasNodes.agentType, "Instagram Agent"),
                        eq(canvasNodes.isActive, true)
                    )
                );

            for (const agent of agents) {
                const config = agent.config as any;

                if (config.instagramAccessToken && config.instagramBusinessAccountId) {
                    await this.scheduleJob({
                        userId: agent.userId,
                        agentId: agent.id,
                        accessToken: config.instagramAccessToken,
                        instagramBusinessAccountId: config.instagramBusinessAccountId,
                        dailyLimit: config.dailyTaskLimit || 50,
                        knowledgeBase: config.knowledgeBase || [],
                        schedule: config.schedule || "24/7",
                        requireApproval: config.requireApproval || false,
                    });
                }
            }

            console.log(`Scheduled ${this.jobs.size} Instagram agents`);
        } catch (error) {
            console.error("Error starting instagram cron jobs:", error);
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

            if (!agent || !agent.isActive || agent.agentType !== "Instagram Agent") {
                this.jobs.forEach((task, id) => {
                    if (id.includes(agentId)) {
                        task.stop();
                        this.jobs.delete(id);
                        console.log(`Stopped Instagram job for agent ${agentId}`);
                    }
                });
                return;
            }

            const config = agent.config as any;
            if (config.instagramAccessToken && config.instagramBusinessAccountId) {
                await this.scheduleJob({
                    userId: agent.userId,
                    agentId: agent.id,
                    accessToken: config.instagramAccessToken,
                    instagramBusinessAccountId: config.instagramBusinessAccountId,
                    dailyLimit: config.dailyTaskLimit || 50,
                    knowledgeBase: config.knowledgeBase || [],
                    schedule: config.schedule || "24/7",
                    requireApproval: config.requireApproval || false,
                });
                console.log(`Synced/Started Instagram job for agent ${agentId}`);
            }
        } catch (error) {
            console.error(`Error syncing Instagram job ${agentId}:`, error);
        }
    }

    async scheduleJob(job: InstagramJob): Promise<void> {
        const jobId = `instagram-${job.userId}-${job.agentId}`;

        if (this.jobs.has(jobId)) {
            this.jobs.get(jobId)?.stop();
            this.jobs.delete(jobId);
        }

        let cronSchedule: string;
        if (job.schedule === "24/7") {
            cronSchedule = "0 */12 * * *"; // Every 12 hours
        } else if (job.schedule === "business-hours") {
            cronSchedule = "0 12,17 * * 1-5";
        } else {
            const [hour, minute] = (job.schedule.split(":") || ["12", "0"]).map(Number);
            cronSchedule = `${minute} ${hour} * * *`;
        }

        const task = cron.schedule(cronSchedule, async () => {
            await this.runJob(job);
        });

        this.jobs.set(jobId, task);
    }

    private async runJob(job: InstagramJob): Promise<void> {
        console.log(`Running Instagram agent for user ${job.userId}`);
        const agent = new InstagramDMAgent({
            accessToken: job.accessToken,
            instagramBusinessAccountId: job.instagramBusinessAccountId,
        });

        try {
            const knowledgeBase = await this.loadKnowledgeBase(job.knowledgeBase);

            const results = await agent.runCampaign(
                knowledgeBase,
                { goal: "Engage with fans", tone: "casual" },
                job.dailyLimit
            );

            await this.saveResults(job.userId, job.agentId, results, job.requireApproval);
        } catch (error) {
            console.error(`Error running instagram job:`, error);
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
                    channel: "instagram",
                    role: "assistant",
                    content: `Sent Instagram DM to ${result.user.username}\n\nMessage: ${result.message}`,
                    status: requireApproval ? "pending_approval" : "sent",
                    needsApproval: requireApproval,
                    isApproved: !requireApproval,
                    metadata: { type: "instagram_outreach", status: "sent", username: result.user.username },
                });

                // Sync with Prospects table (CRM)
                try {
                    await db.insert(prospects).values({
                        userId,
                        name: result.user.name || result.user.username,
                        profileUrl: `https://instagram.com/${result.user.username}`,
                        channel: "instagram",
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
                    console.error("Error syncing instagram prospect:", crmError);
                }

                // Trigger Workflow Engine
                try {
                    const { WorkflowService } = await import("../services/workflow-service");
                    await WorkflowService.triggerNext(agentId, userId, "dm_sent", {
                        username: result.user.username,
                        platform: 'instagram',
                        message: result.message
                    });
                } catch (workflowError) {
                    console.error("Error triggering workflow:", workflowError);
                }

                await AnalyticsService.logMessageSent(userId, agentId, "instagram");
                await AnalyticsService.logLead(userId, agentId, "instagram");
            }
        }
    }

    stopAll(): void {
        this.jobs.forEach((task) => task.stop());
        this.jobs.clear();
    }
}

let instagramRunner: InstagramCronRunner | null = null;
export function getInstagramRunner(): InstagramCronRunner {
    if (!instagramRunner) instagramRunner = new InstagramCronRunner();
    return instagramRunner;
}
