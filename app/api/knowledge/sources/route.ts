import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { knowledgeSources, knowledgeChunks, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET - Fetch all knowledge sources for the user
export async function GET(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const sources = await db
            .select()
            .from(knowledgeSources)
            .where(eq(knowledgeSources.userId, user.id))
            .orderBy(desc(knowledgeSources.createdAt));

        return NextResponse.json({ sources });
    } catch (error: any) {
        console.error("Error fetching knowledge sources:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a knowledge source and its chunks
export async function DELETE(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const sourceId = searchParams.get("id");

        if (!sourceId) {
            return NextResponse.json({ error: "Source ID required" }, { status: 400 });
        }

        // Delete chunks first
        await db
            .delete(knowledgeChunks)
            .where(
                and(
                    eq(knowledgeChunks.sourceId, sourceId),
                    eq(knowledgeChunks.userId, user.id)
                )
            );

        // Delete source
        await db
            .delete(knowledgeSources)
            .where(
                and(
                    eq(knowledgeSources.id, sourceId),
                    eq(knowledgeSources.userId, user.id)
                )
            );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting knowledge source:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
