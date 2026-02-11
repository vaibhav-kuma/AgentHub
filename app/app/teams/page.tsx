import { db } from "@/lib/db";
import { teams, users, teamInvitations, teamMembers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
    Users,
    Mail,
    Shield,
    MoreHorizontal,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteMemberDialog } from "@/components/teams/invite-dialog";
import { cancelInvitation } from "@/app/actions/team-actions";

export default async function TeamsPage() {
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/sign-in");

    const user = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
    });

    if (!user) return <div>User not found.</div>;

    // Fetch user's team (MVP: assumes user owns a team)
    const userTeams = await db
        .select()
        .from(teams)
        .where(eq(teams.ownerId, user.id));

    const currentTeam = userTeams[0];

    if (!currentTeam) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold">No Team Found</h1>
                <p>You haven't created a team yet.</p>
                {/* Add Create Team button here if needed */}
            </div>
        );
    }

    // Fetch team members
    // Note: This requires the teamMembers table and relations to be set up in schema
    const teamMembersList = await db.query.teamMembers.findMany({
        where: eq(teamMembers.teamId, currentTeam.id),
        with: {
            user: true
        }
    });

    // Combine Owner and Members
    const members = [
        {
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            email: user.email,
            role: 'Owner',
            status: 'Active',
            imageUrl: user.imageUrl
        },
        ...teamMembersList.map(tm => ({
            id: tm.user.id,
            name: `${tm.user.firstName || ''} ${tm.user.lastName || ''}`.trim() || tm.user.email,
            email: tm.user.email,
            role: tm.role,
            status: 'Active',
            imageUrl: tm.user.imageUrl
        }))
    ];

    // Fetch pending invitations
    const pendingInvitations = await db
        .select()
        .from(teamInvitations)
        .where(eq(teamInvitations.teamId, currentTeam.id))
        .orderBy(desc(teamInvitations.createdAt));

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Team Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage your team members and collaborator invitations.
                    </p>
                </div>
                <InviteMemberDialog />
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Members Section */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            Active Members
                        </h2>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                            {members.length} member{members.length !== 1 && 's'}
                        </span>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3">Member</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {members.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 overflow-hidden">
                                                {member.imageUrl ? (
                                                    <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    member.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 capitalize">
                                            <Shield className="h-3 w-3" />
                                            {member.role}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider dark:bg-emerald-900/40 dark:text-emerald-300">
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {member.role !== 'Owner' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="text-rose-500">Remove Member</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Invitations Section */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Mail className="h-4 w-4 text-purple-500" />
                            Pending Invitations
                        </h2>
                    </div>
                    <div className="p-0">
                        {pendingInvitations.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Clock className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm font-medium">No pending invitations</p>
                                <p className="text-xs mt-1">Invite collaborators to join your team.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Sent</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {pendingInvitations.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                {inv.email}
                                            </td>
                                            <td className="px-6 py-4 capitalize">{inv.role}</td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {inv.createdAt.toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <form action={async () => {
                                                    'use server';
                                                    await cancelInvitation(inv.id);
                                                }}>
                                                    <button type="submit" className="text-xs font-semibold text-rose-500 hover:text-rose-600 px-3 py-1 bg-rose-50 dark:bg-rose-900/20 rounded-md transition-all">
                                                        Cancel
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
