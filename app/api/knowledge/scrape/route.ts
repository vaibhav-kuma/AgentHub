import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { users, knowledgeChunks, knowledgeSources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { VectorService } from "@/lib/services/vector-service";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Scrape and chunk content from URL
export async function POST(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find database user
        const user = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { url, type, sourceId } = body;

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Fetch the webpage
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AgentHub/1.0; +https://agenthub.com)",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();

        // Parse HTML with Cheerio
        const $ = cheerio.load(html);

        // Remove script, style, and other non-content elements
        $("script, style, nav, header, footer, aside, iframe, noscript").remove();

        // Extract main content
        let content = "";

        // Try to find main content area
        const mainContent =
            $("main").text() ||
            $("article").text() ||
            $('[role="main"]').text() ||
            $(".content").text() ||
            $(".main-content").text() ||
            $("body").text();

        content = mainContent
            .replace(/\s+/g, " ") // Replace multiple spaces with single space
            .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
            .trim();

        if (!content || content.length < 100) {
            return NextResponse.json(
                { error: "Could not extract meaningful content from URL" },
                { status: 400 }
            );
        }

        // Extract metadata
        const title = $("title").text() || $("h1").first().text() || "Untitled";
        const description =
            $('meta[name="description"]').attr("content") ||
            $('meta[property="og:description"]').attr("content") ||
            "";

        // Chunk the content (split into ~1000 character chunks)
        const chunks = chunkText(content, 1000);

        // Generate embeddings for each chunk using VectorService
        const processedChunks = await Promise.all(
            chunks.map(async (chunk, index) => {
                const embedding = await VectorService.generateEmbedding(chunk);
                return {
                    index,
                    content: chunk,
                    embedding,
                    metadata: {
                        source: url,
                        sourceId,
                        title,
                        description,
                        type,
                    },
                };
            })
        );

        // Store knowledge source
        const [source] = await db.insert(knowledgeSources).values({
            userId: user.id,
            name: title,
            type: "url",
            url,
            status: "processed",
            chunkCount: processedChunks.length,
            metadata: { description },
        }).returning();

        const actualSourceId = sourceId || source.id;

        // Store chunks in database
        await db.insert(knowledgeChunks).values(
            processedChunks.map(chunk => ({
                userId: user.id,
                sourceId: actualSourceId,
                sourceType: type || "url",
                sourceUrl: url,
                chunkIndex: chunk.index,
                content: chunk.content,
                embedding: chunk.embedding,
                metadata: chunk.metadata,
                isActive: true,
            }))
        );

        return NextResponse.json({
            success: true,
            chunks: processedChunks.length,
            title,
            description,
            contentLength: content.length,
        });
    } catch (error: any) {
        console.error("Scraping error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to scrape content" },
            { status: 500 }
        );
    }
}

// Helper function to chunk text
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let currentChunk = "";

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += sentence;
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}
