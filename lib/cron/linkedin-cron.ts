import cron from "node-cron";
import { LinkedInAgent } from "../agents/linkedin-agent";
import { db } from "../db";
import { canvasNodes, messages, knowledgeChunks, prospects } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { AnalyticsService } from "../services/analytics-service";

interface AgentJob {
    userId: string;
    agentId: string;
    linkedInEmail: string;
    linkedInPassword: string;
    linkedInSessionCookie?: string;
    savedSearchUrl: string;
    dailyLimit: number;
    knowledgeBase: string[];
    schedule: string;
    requireApproval: boolean;
}

/**
 * LinkedIn Agent Cron Job Runner
 * Runs on Render.com as a background worker
 */
export class LinkedInCronRunner {
    private jobs: Map<string, cron.ScheduledTask> = new Map();
    private proxyList: string[] = [];
    private currentProxyIndex: number = 0;

    constructor() {
        this.loadProxies();
    }

    /**
     * Load proxy list from environment
     */
    private loadProxies(): void {
        const proxies = process.env.PROXY_LIST?.split(",") || [];
        this.proxyList = proxies.filter((p) => p.trim().length > 0);
        console.log(`Loaded ${this.proxyList.length} proxies`);
    }

    /**
     * Get next proxy (round-robin)
     */
    private getNextProxy(): string | undefined {
        if (this.proxyList.length === 0) return undefined;

        const proxy = this.proxyList[this.currentProxyIndex];
        this.currentProxyIndex =
            (this.currentProxyIndex + 1) % this.proxyList.length;
        return proxy;
    }

    /**
     * Start all scheduled jobs from database
     */
    async startAll(): Promise<void> {
        console.log("Starting LinkedIn cron jobs...");

        try {
            // Fetch all active LinkedIn agents from database
            const agents = await db
                .select()
                .from(canvasNodes)
                .where(
                    and(
                        eq(canvasNodes.agentType, "SDR"),
                        eq(canvasNodes.isActive, true)
                    )
                );

            for (const agent of agents) {
                const config = agent.config as any;

                // Only schedule if LinkedIn credentials are configured
                if (
                    config.linkedInEmail &&
                    config.linkedInPassword &&
                    config.savedSearchUrl
                ) {
                    await this.scheduleJob({
                        userId: agent.userId,
                        agentId: agent.id,
                        linkedInEmail: config.linkedInEmail,
                        linkedInPassword: config.linkedInPassword,
                        linkedInSessionCookie: config.linkedInSessionCookie,
                        savedSearchUrl: config.savedSearchUrl,
                        dailyLimit: config.dailyTaskLimit || 50,
                        knowledgeBase: config.knowledgeBase || [],
                        schedule: config.schedule || "24/7",
                        requireApproval: config.requireApproval || false,
                    });
                }
            }

            console.log(`Scheduled ${this.jobs.size} LinkedIn agents`);
        } catch (error) {
            console.error("Error starting cron jobs:", error);
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

            if (!agent || !agent.isActive) {
                // If agent is deleted or deactivated, stop the job
                this.jobs.forEach((task, id) => {
                    if (id.includes(agentId)) {
                        task.stop();
                        this.jobs.delete(id);
                        console.log(`Stopped LinkedIn job for agent ${agentId}`);
                    }
                });
                return;
            }

            // If active, ensure it's scheduled with latest config
            const config = agent.config as any;
            if (config.linkedInEmail && config.linkedInPassword && config.savedSearchUrl) {
                await this.scheduleJob({
                    userId: agent.userId,
                    agentId: agent.id,
                    linkedInEmail: config.linkedInEmail,
                    linkedInPassword: config.linkedInPassword,
                    linkedInSessionCookie: config.linkedInSessionCookie,
                    savedSearchUrl: config.savedSearchUrl,
                    dailyLimit: config.dailyTaskLimit || 50,
                    knowledgeBase: config.knowledgeBase || [],
                    schedule: config.schedule || "24/7",
                    requireApproval: config.requireApproval || false,
                });
                console.log(`Synced/Started LinkedIn job for agent ${agentId}`);
            }
        } catch (error) {
            console.error(`Error syncing LinkedIn job ${agentId}:`, error);
        }
    }

    /**
     * Schedule a single job
     */
    async scheduleJob(job: AgentJob): Promise<void> {
        const jobId = `${job.userId}-${job.agentId}`;

        // Stop existing job if any
        if (this.jobs.has(jobId)) {
            this.jobs.get(jobId)?.stop();
            this.jobs.delete(jobId);
        }

        // Determine cron schedule
        let cronSchedule: string;

        if (job.schedule === "24/7") {
            // Run every 6 hours
            cronSchedule = "0 */6 * * *";
        } else if (job.schedule === "business-hours") {
            // Run at 9 AM and 2 PM on weekdays
            cronSchedule = "0 9,14 * * 1-5";
        } else {
            // Custom schedule - run once daily at specified start time
            // Parse time from config (format: "HH:mm")
            const [hour, minute] = (job.schedule.split(":") || ["9", "0"]).map(
                Number
            );
            cronSchedule = `${minute} ${hour} * * *`;
        }

        console.log(`Scheduling job ${jobId} with cron: ${cronSchedule}`);

        // Create cron job
        const task = cron.schedule(cronSchedule, async () => {
            await this.runJob(job);
        });

        this.jobs.set(jobId, task);
    }

    /**
     * Run a single job
     */
    private async runJob(job: AgentJob): Promise<void> {
        console.log(
            `Running LinkedIn agent for user ${job.userId} at ${new Date().toISOString()}`
        );

        const proxy = this.getNextProxy();
        const agent = new LinkedInAgent(
            {
                email: job.linkedInEmail,
                password: job.linkedInPassword,
                sessionCookie: job.linkedInSessionCookie,
            },
            proxy
        );

        try {
            // Load knowledge base from database
            const knowledgeBase = await this.loadKnowledgeBase(job.knowledgeBase);

            // Run campaign
            const results = await agent.runCampaign(
                job.savedSearchUrl,
                knowledgeBase,
                job.dailyLimit,
                job.userId,
                job.knowledgeBase
            );

            // Save results to database
            await this.saveResults(job.userId, job.agentId, results, job.requireApproval);

            console.log(
                `Completed job for ${job.userId}: ${results.filter((r) => r.success).length}/${results.length} successful`
            );
        } catch (error) {
            console.error(`Error running job for ${job.userId}:`, error);

            // Log error to database
            await this.logError(job.userId, job.agentId, error as Error);
        }
    }

    /**
     * Load knowledge base content from database
     */
    private async loadKnowledgeBase(sourceIds: string[]): Promise<string[]> {
        if (!sourceIds || sourceIds.length === 0) return [];

        try {
            const chunks = await db
                .select()
                .from(knowledgeChunks)
                .where(eq(knowledgeChunks.sourceId, sourceIds[0])); // Simplified - in production, handle multiple sources

            return chunks.map((chunk) => chunk.content);
        } catch (error) {
            console.error("Error loading knowledge base:", error);
            return [];
        }
    }

    /**
     * Save outreach results to database
     */
    private async saveResults(
        userId: string,
        agentId: string,
        results: any[],
        requireApproval: boolean = false
    ): Promise<void> {
        try {
            for (const result of results) {
                if (result.success) {
                    // Save to messages table for inbox
                    await db.insert(messages).values({
                        teamId: null, // Will be set if user has a team
                        agentId,
                        userId,
                        channel: "linkedin",
                        role: "assistant",
                        content: `Sent connection request to ${result.prospectName}\n\nMessage: ${result.message}\n\nProfile: ${result.profileUrl}`,
                        status: requireApproval ? "pending_approval" : "sent",
                        needsApproval: requireApproval,
                        isApproved: !requireApproval,
                        metadata: {
                            type: "linkedin_outreach",
                            prospectName: result.prospectName,
                            profileUrl: result.profileUrl,
                            status: "sent",
                        },
                    });

                    // Sync with Prospects table (CRM)
                    try {
                        await db.insert(prospects).values({
                            userId,
                            name: result.prospectName,
                            profileUrl: result.profileUrl,
                            channel: "linkedin",
                            status: "engaged",
                            lastInteractionAt: new Date(),
                            metadata: {
                                lastMessage: result.message,
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
                        console.error("Error syncing with prospects table:", crmError);
                    }

                    // Trigger Workflow Engine
                    try {
                        const { WorkflowService } = await import("../services/workflow-service");
                        await WorkflowService.triggerNext(agentId, userId, "connection_sent", {
                            prospectName: result.prospectName,
                            profileUrl: result.profileUrl,
                            message: result.message
                        });
                    } catch (workflowError) {
                        console.error("Error triggering workflow:", workflowError);
                    }

                    // Log analytics events
                    await AnalyticsService.logMessageSent(userId, agentId, "linkedin", {
                        prospectName: result.prospectName,
                    });

                    // Treat every successful connection request as a "lead generated"
                    await AnalyticsService.logLead(userId, agentId, "linkedin", {
                        prospectName: result.prospectName,
                    });
                }
            }
        } catch (error) {
            console.error("Error saving results:", error);
        }
    }

    /**
     * Log error to database
     */
    private async logError(
        userId: string,
        agentId: string,
        error: Error
    ): Promise<void> {
        try {
            await db.insert(messages).values({
                teamId: null,
                agentId,
                userId,
                channel: "linkedin",
                role: "system",
                content: `LinkedIn agent error: ${error.message}`,
                metadata: {
                    type: "error",
                    error: error.message,
                    stack: error.stack,
                },
            });
        } catch (err) {
            console.error("Error logging error:", err);
        }
    }

    /**
     * Stop all jobs
     */
    stopAll(): void {
        console.log("Stopping all cron jobs...");
        this.jobs.forEach((task) => task.stop());
        this.jobs.clear();
    }

    /**
     * Stop a specific job
     */
    stopJob(userId: string, agentId: string): void {
        const jobId = `${userId}-${agentId}`;
        const task = this.jobs.get(jobId);
        if (task) {
            task.stop();
            this.jobs.delete(jobId);
            console.log(`Stopped job ${jobId}`);
        }
    }
}

// Singleton instance
let cronRunner: LinkedInCronRunner | null = null;

/**
 * Get or create cron runner instance
 */
export function getCronRunner(): LinkedInCronRunner {
    if (!cronRunner) {
        cronRunner = new LinkedInCronRunner();
    }
    return cronRunner;
}

/**
 * Start cron runner (call this in your server startup)
 */
export async function startCronRunner(): Promise<void> {
    const runner = getCronRunner();
    await runner.startAll();
}

/**
 * Stop cron runner (call this on server shutdown)
 */
export function stopCronRunner(): void {
    if (cronRunner) {
        cronRunner.stopAll();
        cronRunner = null;
    }
}
