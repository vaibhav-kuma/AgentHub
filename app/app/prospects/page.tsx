import { db } from "@/lib/db";
import { prospects, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
    Users,
    Mail,
    Phone,
    MapPin,
    ExternalLink,
    MoreHorizontal,
    Search,
    Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default async function ProspectsPage() {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        redirect("/sign-in");
    }

    const user = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
    });

    if (!user) {
        return <div>User not found. Please sync your account.</div>;
    }

    const allProspects = await db
        .select()
        .from(prospects)
        .where(eq(prospects.userId, user.id))
        .orderBy(desc(prospects.lastInteractionAt));

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Prospects</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage your leads and engaged prospects across all channels.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </Button>
                    <Button className="gap-2">
                        <Users className="h-4 w-4" />
                        Export Leads
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total Prospects", value: allProspects.length, color: "bg-blue-500" },
                    { label: "Engaged", value: allProspects.filter(p => p.status === 'engaged').length, color: "bg-purple-500" },
                    { label: "Converted", value: allProspects.filter(p => p.status === 'converted').length, color: "bg-emerald-500" },
                    { label: "Rejected", value: allProspects.filter(p => p.status === 'rejected').length, color: "bg-slate-500" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`h-2 w-2 rounded-full ${stat.color}`} />
                            <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter/Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-t-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, company, or email..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    {["All", "LinkedIn", "Twitter", "Email", "Instagram"].map((channel) => (
                        <button key={channel} className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap">
                            {channel}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prospects Table */}
            <div className="bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800 rounded-b-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Prospect</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Channel</th>
                            <th className="px-6 py-4">Last interaction</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {allProspects.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="h-8 w-8 text-slate-300 mb-2" />
                                        <p className="font-medium text-slate-900 dark:text-white">No prospects found</p>
                                        <p className="text-sm">Engage with leads using your agents to see them here.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            allProspects.map((prospect) => (
                                <tr key={prospect.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center font-bold text-blue-600">
                                                {prospect.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{prospect.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span>{prospect.company || "Unknown Company"}</span>
                                                    {prospect.profileUrl && (
                                                        <a href={prospect.profileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                            ${prospect.status === 'engaged' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                                                prospect.status === 'converted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                                            {prospect.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 capitalize text-slate-600 dark:text-slate-400">
                                            <div className="h-6 w-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <Bot className="h-3 w-3" />
                                            </div>
                                            {prospect.channel}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {prospect.lastInteractionAt ? (
                                            <span title={prospect.lastInteractionAt.toLocaleString()}>
                                                {formatDistanceToNow(prospect.lastInteractionAt)} ago
                                            </span>
                                        ) : "Never"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem className="gap-2 focus:bg-blue-50 focus:text-blue-600">
                                                    <Mail className="h-4 w-4" />
                                                    Email Prospect
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2">
                                                    <Phone className="h-4 w-4" />
                                                    Add Phone
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    Update Location
                                                </DropdownMenuItem>
                                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                                <DropdownMenuItem className="gap-2 text-rose-500 focus:bg-rose-50 focus:text-rose-600">
                                                    Archive Prospect
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
