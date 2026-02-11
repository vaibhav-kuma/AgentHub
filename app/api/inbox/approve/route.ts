import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const { messageId, content } = body;

        if (!messageId) {
            return NextResponse.json({ error: "Message ID required" }, { status: 400 });
        }

        // Update message: mark as approved and potentially update content
        const updateData: any = {
            isApproved: true,
            approvedBy: user.id,
            approvedAt: new Date(),
            status: "sent",
        };

        if (content) {
            updateData.content = content;
        }

        const updatedMessage = await db
            .update(messages)
            .set(updateData)
            .where(
                and(
                    eq(messages.id, messageId),
                    eq(messages.userId, user.id)
                )
            )
            .returning();

        return NextResponse.json({ success: true, message: updatedMessage[0] });
    } catch (error: any) {
        console.error("Error approving message:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
