import cron from "node-cron";
import { ColdEmailAgent } from "../agents/email-agent";
import { db } from "../db";
import { canvasNodes, messages, knowledgeChunks, prospects } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { AnalyticsService } from "../services/analytics-service";

interface EmailJob {
    userId: string;
    agentId: string;
    fromEmail: string;
    fromName: string;
    prospectList: any[]; // List of prospects from config
    knowledgeBase: string[];
    schedule: string;
    dailyLimit: number;
    requireApproval: boolean;
}

export class EmailCronRunner {
    private jobs: Map<string, cron.ScheduledTask> = new Map();

    constructor() { }

    /**
     * Start all scheduled email jobs from database
     */
    async startAll(): Promise<void> {
        console.log("Starting Email cron jobs...");

        try {
            const agents = await db
                .select()
                .from(canvasNodes)
                .where(
                    and(
                        eq(canvasNodes.agentType, "Email SDR"),
                        eq(canvasNodes.isActive, true)
                    )
                );

            for (const agent of agents) {
                const config = agent.config as any;

                if (config.fromEmail && config.prospects) {
                    await this.scheduleJob({
                        userId: agent.userId,
                        agentId: agent.id,
                        fromEmail: config.fromEmail,
                        fromName: config.agentName || "AI Agent",
                        prospectList: config.prospects,
                        dailyLimit: config.dailyTaskLimit || 50,
                        knowledgeBase: config.knowledgeBase || [],
                        schedule: config.schedule || "24/7",
                        requireApproval: config.requireApproval || false,
                    });
                }
            }

            console.log(`Scheduled ${this.jobs.size} Email agents`);
        } catch (error) {
            console.error("Error starting email cron jobs:", error);
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

            if (!agent || !agent.isActive || agent.agentType !== "Email SDR") {
                this.jobs.forEach((task, id) => {
                    if (id.includes(agentId)) {
                        task.stop();
                        this.jobs.delete(id);
                        console.log(`Stopped Email job for agent ${agentId}`);
                    }
                });
                return;
            }

            const config = agent.config as any;
            if (config.fromEmail && config.prospects) {
                await this.scheduleJob({
                    userId: agent.userId,
                    agentId: agent.id,
                    fromEmail: config.fromEmail,
                    fromName: config.agentName || "AI Agent",
                    prospectList: config.prospects,
                    dailyLimit: config.dailyTaskLimit || 50,
                    knowledgeBase: config.knowledgeBase || [],
                    schedule: config.schedule || "24/7",
                    requireApproval: config.requireApproval || false,
                });
                console.log(`Synced/Started Email job for agent ${agentId}`);
            }
        } catch (error) {
            console.error(`Error syncing Email job ${agentId}:`, error);
        }
    }

    async scheduleJob(job: EmailJob): Promise<void> {
        const jobId = `email-${job.userId}-${job.agentId}`;

        if (this.jobs.has(jobId)) {
            this.jobs.get(jobId)?.stop();
            this.jobs.delete(jobId);
        }

        let cronSchedule: string;
        if (job.schedule === "24/7") {
            cronSchedule = "0 */4 * * *"; // Every 4 hours
        } else if (job.schedule === "business-hours") {
            cronSchedule = "0 10,15 * * 1-5";
        } else {
            const [hour, minute] = (job.schedule.split(":") || ["10", "0"]).map(Number);
            cronSchedule = `${minute} ${hour} * * *`;
        }

        const task = cron.schedule(cronSchedule, async () => {
            await this.runJob(job);
        });

        this.jobs.set(jobId, task);
    }

    private async runJob(job: EmailJob): Promise<void> {
        console.log(`Running Email agent for user ${job.userId}`);
        const agent = new ColdEmailAgent();

        try {
            const knowledgeBase = await this.loadKnowledgeBase(job.knowledgeBase);

            // In a real scenario, we'd pick a subset of prospects to stay under daily limit
            const prospectsToProcess = job.prospectList.slice(0, job.dailyLimit);

            const results = await agent.runCampaign({
                fromEmail: job.fromEmail,
                fromName: job.fromName,
                subject: "Quick question", // Default, agent will personalize
                prospects: prospectsToProcess,
                knowledgeBase,
                agentConfig: {
                    goal: "Generate interest",
                    tone: "professional"
                }
            });

            await this.saveResults(job.userId, job.agentId, results, job.requireApproval);
        } catch (error) {
            console.error(`Error running email job:`, error);
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
                    channel: "email",
                    role: "assistant",
                    content: `Sent email to ${result.prospect.email}\n\nSubject: ${result.subject}\n\nMessage: ${result.emailBody}`,
                    status: requireApproval ? "pending_approval" : "sent",
                    needsApproval: requireApproval,
                    isApproved: !requireApproval,
                    metadata: { type: "email_outreach", status: "sent" },
                });

                // Sync with Prospects table (CRM)
                try {
                    await db.insert(prospects).values({
                        userId,
                        name: result.prospect.name || result.prospect.email,
                        email: result.prospect.email,
                        channel: "email",
                        status: "engaged",
                        lastInteractionAt: new Date(),
                        metadata: {
                            subject: result.subject,
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
                    console.error("Error syncing email prospect:", crmError);
                }

                // Trigger Workflow Engine
                try {
                    const { WorkflowService } = await import("../services/workflow-service");
                    await WorkflowService.triggerNext(agentId, userId, "email_sent", {
                        prospectName: result.prospect.name,
                        email: result.prospect.email,
                        subject: result.subject
                    });
                } catch (workflowError) {
                    console.error("Error triggering workflow:", workflowError);
                }

                await AnalyticsService.logMessageSent(userId, agentId, "email");
                await AnalyticsService.logLead(userId, agentId, "email");
            }
        }
    }

    stopAll(): void {
        this.jobs.forEach((task) => task.stop());
        this.jobs.clear();
    }
}

let emailRunner: EmailCronRunner | null = null;
export function getEmailRunner(): EmailCronRunner {
    if (!emailRunner) emailRunner = new EmailCronRunner();
    return emailRunner;
}
