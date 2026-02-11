import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { canvasNodes } from "@/lib/db/schema";
import { agentTemplates } from "@/lib/data/agent-templates";
import { getDbUser } from "@/lib/db/auth-utils";

// POST - Deploy agent template
export async function POST(req: NextRequest) {
    try {
        const user = await getDbUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { templateId } = body;

        if (!templateId) {
            return NextResponse.json(
                { error: "Template ID required" },
                { status: 400 }
            );
        }

        // Find template
        const template = agentTemplates.find((t) => t.id === templateId);

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Create all agents from template
        const createdAgents = [];
        let xOffset = 100;
        const yOffset = 100;

        for (const agentTemplate of template.agents) {
            const agent = await db
                .insert(canvasNodes)
                .values({
                    userId: user.id,
                    agentType: agentTemplate.type,
                    position: {
                        x: xOffset,
                        y: yOffset,
                    },
                    config: {
                        agentName: agentTemplate.name,
                        goal: agentTemplate.goal,
                        tone: agentTemplate.tone,
                        channel: agentTemplate.channel,
                        dailyTaskLimit: agentTemplate.dailyLimit,
                        dailyApiLimit: agentTemplate.dailyLimit * 4,
                        model: "claude-3-5-sonnet-20241022",
                        temperature: 60,
                        schedule: "24/7",
                        // User needs to connect these
                        linkedInConnected: false,
                        emailConnected: false,
                        twitterConnected: false,
                        instagramConnected: false,
                    },
                    isActive: false, // Will be activated after user connects channels
                })
                .returning();

            createdAgents.push(agent[0]);

            // Offset next agent
            xOffset += 300;
            if (xOffset > 1000) {
                xOffset = 100;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Deployed ${template.name} with ${createdAgents.length} agents`,
            agents: createdAgents,
            template: {
                id: template.id,
                name: template.name,
                agentCount: template.agents.length,
            },
        });
    } catch (error: any) {
        console.error("Error deploying template:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
