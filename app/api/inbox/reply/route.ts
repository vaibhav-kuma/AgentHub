import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { messages, canvasNodes, knowledgeChunks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { getDbUser } from "@/lib/db/auth-utils";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST - Send reply (human or AI-generated)
export async function POST(req: NextRequest) {
    try {
        const user = await getDbUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { threadId, content, useAI } = body;

        if (!threadId) {
            return NextResponse.json(
                { error: "Thread ID required" },
                { status: 400 }
            );
        }

        // Get thread messages for context
        const threadMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.threadId, threadId))
            .orderBy(messages.createdAt);

        if (threadMessages.length === 0) {
            return NextResponse.json(
                { error: "Thread not found" },
                { status: 404 }
            );
        }

        const firstMessage = threadMessages[0];
        let replyContent = content;

        // Generate AI reply if requested
        if (useAI) {
            // Get agent configuration
            const agent = firstMessage.agentId
                ? await db
                    .select()
                    .from(canvasNodes)
                    .where(eq(canvasNodes.id, firstMessage.agentId))
                    .limit(1)
                : [];

            const agentConfig = agent[0]?.config as any;

            // Load knowledge base
            const knowledgeBase: string[] = [];
            if (agentConfig?.knowledgeBase && agentConfig.knowledgeBase.length > 0) {
                const chunks = await db
                    .select()
                    .from(knowledgeChunks)
                    .where(eq(knowledgeChunks.sourceId, agentConfig.knowledgeBase[0]))
                    .limit(10);

                knowledgeBase.push(...chunks.map((c) => c.content));
            }

            // Build conversation context
            const conversationContext = threadMessages
                .map(
                    (msg) =>
                        `${msg.role === "user" ? "Prospect" : "You"}: ${msg.content}`
                )
                .join("\n\n");

            // Generate reply with Claude
            const prompt = `You are a sales professional continuing a conversation.

Previous conversation:
${conversationContext}

Company/Product Context:
${knowledgeBase.join("\n\n") || "N/A"}

Agent Configuration:
- Goal: ${agentConfig?.goal || "N/A"}
- Tone: ${agentConfig?.tone || "professional"}
- ICP: ${agentConfig?.icpTitle || "N/A"} at ${agentConfig?.icpIndustry || "N/A"}

Generate a natural, helpful reply that:
1. Addresses their last message
2. Provides value
3. Moves the conversation forward
4. Matches the specified tone
5. Is concise (2-3 sentences max)

Reply:`;

            try {
                const response = await anthropic.messages.create({
                    model: agentConfig?.model || "claude-3-5-sonnet-20241022",
                    max_tokens: 500,
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                });

                replyContent =
                    response.content[0].type === "text"
                        ? response.content[0].text
                        : "Thank you for your message. I'll get back to you soon.";
            } catch (error) {
                console.error("Error generating AI reply:", error);
                replyContent =
                    "Thank you for your message. I'll get back to you soon.";
            }
        }

        // Save reply to database
        const newMessage = await db
            .insert(messages)
            .values({
                userId: user.id,
                agentId: firstMessage.agentId,
                channel: firstMessage.channel,
                threadId,
                role: "assistant",
                content: replyContent,
                status: "sent",
                isRead: true,
                metadata: {
                    generatedByAI: useAI,
                    model: useAI ? "claude-3-5-sonnet" : undefined,
                },
            })
            .returning();

        // TODO: Actually send the message via the appropriate channel
        // (LinkedIn, Twitter, Email, etc.)

        return NextResponse.json({
            success: true,
            message: newMessage[0],
        });
    } catch (error: any) {
        console.error("Error sending reply:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
