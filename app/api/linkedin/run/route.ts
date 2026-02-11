import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { canvasNodes, knowledgeChunks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { LinkedInAgent } from "@/lib/agents/linkedin-agent";

// Manually trigger LinkedIn campaign
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { agentId } = body;

        if (!agentId) {
            return NextResponse.json(
                { error: "Agent ID required" },
                { status: 400 }
            );
        }

        // Get agent configuration
        const agent = await db
            .select()
            .from(canvasNodes)
            .where(and(eq(canvasNodes.id, agentId), eq(canvasNodes.userId, userId)))
            .limit(1);

        if (agent.length === 0) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        const config = agent[0].config as any;

        if (!config.linkedInEmail || !config.savedSearchUrl) {
            return NextResponse.json(
                { error: "LinkedIn not configured for this agent" },
                { status: 400 }
            );
        }

        // Load knowledge base
        const knowledgeBase: string[] = [];
        if (config.knowledgeBase && config.knowledgeBase.length > 0) {
            const chunks = await db
                .select()
                .from(knowledgeChunks)
                .where(eq(knowledgeChunks.sourceId, config.knowledgeBase[0]))
                .limit(10); // Limit to 10 chunks for context

            knowledgeBase.push(...chunks.map((c) => c.content));
        }

        // Initialize LinkedIn agent
        const linkedInAgent = new LinkedInAgent(
            {
                email: config.linkedInEmail,
                password: config.linkedInPassword,
                sessionCookie: config.linkedInSessionCookie,
            },
            process.env.PROXY_URL
        );

        // Run campaign in background
        // In production, use a job queue like BullMQ
        runCampaignInBackground(
            linkedInAgent,
            config.savedSearchUrl,
            knowledgeBase,
            config.dailyTaskLimit || 50,
            userId,
            agentId
        );

        return NextResponse.json({
            success: true,
            message: "LinkedIn campaign started in background",
        });
    } catch (error: any) {
        console.error("Error running LinkedIn campaign:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// Run campaign in background (non-blocking)
async function runCampaignInBackground(
    agent: LinkedInAgent,
    savedSearchUrl: string,
    knowledgeBase: string[],
    dailyLimit: number,
    userId: string,
    agentId: string
): Promise<void> {
    try {
        const results = await agent.runCampaign(
            savedSearchUrl,
            knowledgeBase,
            dailyLimit
        );

        // Save results to database
        // (Implementation similar to cron job)
        console.log(
            `Campaign completed for ${userId}: ${results.filter((r) => r.success).length}/${results.length} successful`
        );
    } catch (error) {
        console.error("Background campaign error:", error);
    }
}
