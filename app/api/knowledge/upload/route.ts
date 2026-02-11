import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
const pdf = require("pdf-parse");
import mammoth from "mammoth";
import { db } from "@/lib/db";
import { users, knowledgeChunks, knowledgeSources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { VectorService } from "@/lib/services/vector-service";

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

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const sourceId = formData.get("sourceId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create temporary file path
        const tempDir = join(process.cwd(), "tmp");
        const tempFilePath = join(tempDir, `${sourceId}-${file.name}`);

        // Save file temporarily
        await writeFile(tempFilePath, buffer);

        let content = "";
        const fileType = file.type;

        try {
            // Process based on file type
            if (fileType === "text/plain") {
                content = buffer.toString("utf-8");
            } else if (fileType === "application/pdf") {
                const pdfData = await pdf(buffer);
                content = pdfData.text;
            } else if (
                fileType === "application/msword" ||
                fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ) {
                const docData = await mammoth.extractRawText({ buffer });
                content = docData.value;
            } else {
                throw new Error("Unsupported file type: " + fileType);
            }

            // Chunk the content
            const chunks = chunkText(content, 1000);

            // Clean up temp file
            await unlink(tempFilePath);

            // Store knowledge source
            const [source] = await db.insert(knowledgeSources).values({
                userId: user.id,
                name: file.name,
                type: "file",
                fileName: file.name,
                fileSize: file.size,
                status: "processed",
                chunkCount: chunks.length,
                metadata: { fileType: file.type },
            }).returning();

            const actualSourceId = sourceId || source.id;

            // Generate embeddings for all chunks
            const processedChunks = await Promise.all(
                chunks.map(async (chunk, index) => {
                    const embedding = await VectorService.generateEmbedding(chunk);
                    return {
                        userId: user.id,
                        sourceId: actualSourceId,
                        sourceType: "file",
                        chunkIndex: index,
                        content: chunk,
                        embedding,
                        metadata: {
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type,
                        },
                        isActive: true,
                    };
                })
            );

            // Store chunks in database
            await db.insert(knowledgeChunks).values(processedChunks);

            return NextResponse.json({
                success: true,
                chunks: chunks.length,
                fileName: file.name,
                fileSize: file.size,
                contentLength: content.length,
            });
        } catch (processingError: any) {
            // Clean up temp file on error
            try {
                await unlink(tempFilePath);
            } catch { }

            throw processingError;
        }
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process file" },
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
