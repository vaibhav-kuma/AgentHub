import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getDbUser } from "@/lib/db/auth-utils";

// POST - Mark message as read
export async function POST(req: NextRequest) {
    try {
        const user = await getDbUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { messageId } = body;

        if (!messageId) {
            return NextResponse.json(
                { error: "Message ID required" },
                { status: 400 }
            );
        }

        await db
            .update(messages)
            .set({
                isRead: true,
                updatedAt: new Date(),
            })
            .where(and(eq(messages.id, messageId), eq(messages.userId, user.id)));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error marking message as read:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
