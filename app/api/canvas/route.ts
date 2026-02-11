import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { canvasNodes, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Fetch all canvas nodes for the current user
export async function GET(req: NextRequest) {
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

        const nodes = await db
            .select()
            .from(canvasNodes)
            .where(
                and(
                    eq(canvasNodes.userId, user.id),
                    eq(canvasNodes.isActive, true)
                )
            );

        return NextResponse.json({ nodes });
    } catch (error: any) {
        console.error("Error fetching canvas nodes:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create or update canvas nodes
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
        const { nodes } = body;

        if (!nodes || !Array.isArray(nodes)) {
            return NextResponse.json({ error: "Invalid nodes data" }, { status: 400 });
        }

        // Deactivate all existing nodes first (soft delete)
        await db
            .update(canvasNodes)
            .set({ isActive: false })
            .where(eq(canvasNodes.userId, user.id));

        // Upsert new nodes
        for (const node of nodes) {
            await db
                .insert(canvasNodes)
                .values({
                    id: node.id, // Using frontend UUID
                    userId: user.id,
                    agentType: node.agentType,
                    position: node.position,
                    config: node.config || {},
                    isActive: true,
                })
                .onConflictDoUpdate({
                    target: canvasNodes.id,
                    set: {
                        position: node.position,
                        config: node.config || {},
                        isActive: true,
                    },
                });
        }

        return NextResponse.json({ success: true, count: nodes.length });
    } catch (error: any) {
        console.error("Error saving canvas nodes:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a specific canvas node
export async function DELETE(req: NextRequest) {
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

        const { searchParams } = new URL(req.url);
        const nodeId = searchParams.get("nodeId");

        if (!nodeId) {
            return NextResponse.json({ error: "Node ID required" }, { status: 400 });
        }

        await db
            .delete(canvasNodes)
            .where(
                and(
                    eq(canvasNodes.id, nodeId),
                    eq(canvasNodes.userId, user.id)
                )
            );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting canvas node:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
