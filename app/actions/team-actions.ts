'use server';

import { db } from "@/lib/db";
import { teamInvitations, teams, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function inviteMember(formData: FormData) {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const email = formData.get("email") as string;
    const role = formData.get("role") as string || "member";

    if (!email) return { error: "Email is required" };

    try {
        // Get user's team (MVP: single team owned by user)
        const userRec = await db.query.users.findFirst({
            where: eq(users.clerkId, userId),
        });

        if (!userRec) return { error: "User not found" };

        const team = await db.query.teams.findFirst({
            where: eq(teams.ownerId, userRec.id),
        });

        if (!team) return { error: "Team not found" };

        // generate token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await db.insert(teamInvitations).values({
            teamId: team.id,
            email,
            role,
            token,
            invitedBy: userRec.id,
            expiresAt,
            status: 'pending'
        });

        revalidatePath("/app/teams");
        return { success: true };
    } catch (error) {
        console.error("Invite error:", error);
        return { error: "Failed to send invitation" };
    }
}

export async function cancelInvitation(invitationId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    try {
        await db.delete(teamInvitations).where(eq(teamInvitations.id, invitationId));
        revalidatePath("/app/teams");
        return { success: true };
    } catch (error) {
        console.error("Cancel invitation error:", error);
        return { error: "Failed to cancel invitation" };
    }
}
