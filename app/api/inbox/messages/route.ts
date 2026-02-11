import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getDbUser } from "@/lib/db/auth-utils";

// GET - Fetch all messages for the current user
export async function GET(req: NextRequest) {
    try {
        const user = await getDbUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.userId, user.id))
            .orderBy(desc(messages.createdAt))
            .limit(500); // Limit to last 500 messages

        return NextResponse.json({ messages: userMessages });
    } catch (error: any) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
