import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const LIFETIME_LIMIT = 100;

// GET - Get remaining lifetime spots
export async function GET(req: NextRequest) {
    try {
        // Count users with lifetime plan
        const lifetimeUsers = await db
            .select()
            .from(users)
            .where(eq(users.plan, "lifetime"));

        const claimed = lifetimeUsers.length;
        const remaining = Math.max(0, LIFETIME_LIMIT - claimed);

        return NextResponse.json({
            total: LIFETIME_LIMIT,
            claimed,
            remaining,
            available: remaining > 0,
        });
    } catch (error: any) {
        console.error("Error fetching lifetime spots:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
