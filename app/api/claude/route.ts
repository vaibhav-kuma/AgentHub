import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { messages, systemPrompt, model = "claude-3-5-sonnet-20241022", temperature = 0.7, maxTokens = 4096 } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
        }

        const response = await anthropic.messages.create({
            model,
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt,
            messages,
        });

        return NextResponse.json({
            content: response.content,
            usage: response.usage,
            model: response.model,
            id: response.id,
        });
    } catch (error: any) {
        console.error("Claude API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
