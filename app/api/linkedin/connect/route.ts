import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { canvasNodes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCronRunner } from "@/lib/cron/linkedin-cron";

// Connect LinkedIn account (store credentials)
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            agentId,
            linkedInEmail,
            linkedInPassword,
            linkedInSessionCookie,
            savedSearchUrl,
        } = body;

        if (!agentId || !linkedInEmail || !savedSearchUrl) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Update agent configuration
        const agent = await db
            .select()
            .from(canvasNodes)
            .where(and(eq(canvasNodes.id, agentId), eq(canvasNodes.userId, userId)))
            .limit(1);

        if (agent.length === 0) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        const currentConfig = agent[0].config as any;

        await db
            .update(canvasNodes)
            .set({
                config: {
                    ...currentConfig,
                    linkedInEmail,
                    linkedInPassword,
                    linkedInSessionCookie,
                    savedSearchUrl,
                    linkedInConnected: true,
                    linkedInConnectedAt: new Date().toISOString(),
                },
                updatedAt: new Date(),
            })
            .where(eq(canvasNodes.id, agentId));

        // Schedule the cron job
        const cronRunner = getCronRunner();
        await cronRunner.scheduleJob({
            userId,
            agentId,
            linkedInEmail,
            linkedInPassword,
            linkedInSessionCookie,
            savedSearchUrl,
            dailyLimit: currentConfig.dailyTaskLimit || 50,
            knowledgeBase: currentConfig.knowledgeBase || [],
            schedule: currentConfig.schedule || "24/7",
        });

        return NextResponse.json({
            success: true,
            message: "LinkedIn account connected and agent scheduled",
        });
    } catch (error: any) {
        console.error("Error connecting LinkedIn:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// Disconnect LinkedIn account
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const agentId = searchParams.get("agentId");

        if (!agentId) {
            return NextResponse.json(
                { error: "Agent ID required" },
                { status: 400 }
            );
        }

        // Update agent configuration
        const agent = await db
            .select()
            .from(canvasNodes)
            .where(and(eq(canvasNodes.id, agentId), eq(canvasNodes.userId, userId)))
            .limit(1);

        if (agent.length === 0) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        const currentConfig = agent[0].config as any;

        await db
            .update(canvasNodes)
            .set({
                config: {
                    ...currentConfig,
                    linkedInEmail: undefined,
                    linkedInPassword: undefined,
                    linkedInSessionCookie: undefined,
                    savedSearchUrl: undefined,
                    linkedInConnected: false,
                },
                updatedAt: new Date(),
            })
            .where(eq(canvasNodes.id, agentId));

        // Stop the cron job
        const cronRunner = getCronRunner();
        cronRunner.stopJob(userId, agentId);

        return NextResponse.json({
            success: true,
            message: "LinkedIn account disconnected",
        });
    } catch (error: any) {
        console.error("Error disconnecting LinkedIn:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// Get LinkedIn connection status
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const agentId = searchParams.get("agentId");

        if (!agentId) {
            return NextResponse.json(
                { error: "Agent ID required" },
                { status: 400 }
            );
        }

        const agent = await db
            .select()
            .from(canvasNodes)
            .where(and(eq(canvasNodes.id, agentId), eq(canvasNodes.userId, userId)))
            .limit(1);

        if (agent.length === 0) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        const config = agent[0].config as any;

        return NextResponse.json({
            connected: config.linkedInConnected || false,
            email: config.linkedInEmail || null,
            savedSearchUrl: config.savedSearchUrl || null,
            connectedAt: config.linkedInConnectedAt || null,
        });
    } catch (error: any) {
        console.error("Error getting LinkedIn status:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
