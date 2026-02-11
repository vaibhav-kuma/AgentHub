import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { integrations, users, teams } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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

        // Find user's team (default to first one)
        const team = await db.query.teams.findFirst({
            where: eq(teams.ownerId, user.id),
        });

        if (!team) {
            return NextResponse.json({ integrations: [] });
        }

        const userIntegrations = await db
            .select()
            .from(integrations)
            .where(eq(integrations.teamId, team.id));

        return NextResponse.json({ integrations: userIntegrations });
    } catch (error: any) {
        console.error("Error fetching integrations:", error);
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

        const team = await db.query.teams.findFirst({
            where: eq(teams.ownerId, user.id),
        });

        if (!team) {
            return NextResponse.json({ error: "No team found" }, { status: 404 });
        }

        const body = await req.json();
        const { name, type, credentials, config } = body;

        const [integration] = await db
            .insert(integrations)
            .values({
                teamId: team.id,
                name,
                type,
                credentials: credentials || {},
                config: config || {},
                isActive: true,
            })
            .returning();

        return NextResponse.json({ integration });
    } catch (error: any) {
        console.error("Error creating integration:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
