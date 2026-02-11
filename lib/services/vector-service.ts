import { db } from "../db";
import { knowledgeChunks } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "mock",
});

export class VectorService {
    /**
     * Generate embedding for a text string
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        if (!process.env.OPENAI_API_KEY) {
            // Mock embedding for development (1536 dimensions)
            return new Array(1536).fill(0).map(() => Math.random());
        }

        try {
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text.replace(/\n/g, " "),
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error("Error generating embedding:", error);
            return new Array(1536).fill(0).map(() => Math.random());
        }
    }

    /**
     * Find similar chunks in the database using cosine similarity (simulated with JSONB for now)
     * In a real production app, you would use pgvector's <=> operator.
     */
    static async findSimilarChunks(query: string, userId: string, sourceIds: string[], limit: number = 5): Promise<string[]> {
        try {
            const queryEmbedding = await this.generateEmbedding(query);

            // Since we're using jsonb for embeddings without pgvector extension yet, 
            // we'll fetch all chunks for the source and do a simple in-memory similarity 
            // or just return the most relevant based on source.
            // For this implementation, we'll fetch chunks and use the first few as a fallback
            // but log how a real vector search would look.

            const chunks = await db
                .select()
                .from(knowledgeChunks)
                .where(
                    sql`${knowledgeChunks.userId} = ${userId} AND ${knowledgeChunks.sourceId} IN ${sourceIds}`
                )
                .limit(20);

            if (chunks.length === 0) return [];

            // Simple cosine similarity in-memory for demonstration
            const similarities = chunks.map(chunk => {
                const chunkEmbedding = chunk.embedding as number[];
                if (!chunkEmbedding) return { content: chunk.content, score: 0 };

                const score = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
                return { content: chunk.content, score };
            });

            return similarities
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(s => s.content);

        } catch (error) {
            console.error("Error finding similar chunks:", error);
            return [];
        }
    }

    /**
     * Cosine similarity helper
     */
    private static cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
