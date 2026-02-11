import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/webhook-schema";
import { users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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

        const userWebhooks = await db
            .select()
            .from(webhooks)
            .where(eq(webhooks.userId, user.id))
            .orderBy(desc(webhooks.createdAt));

        return NextResponse.json({ webhooks: userWebhooks });
    } catch (error: any) {
        console.error("Error fetching webhooks:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

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
        const { name, url, events, integrationType } = body;

        const [webhook] = await db
            .insert(webhooks)
            .values({
                userId: user.id,
                name,
                url,
                events: events || [],
                integrationType: integrationType || "custom",
                isActive: true,
            })
            .returning();

        return NextResponse.json({ webhook });
    } catch (error: any) {
        console.error("Error creating webhook:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
