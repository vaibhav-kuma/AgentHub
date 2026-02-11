"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Bot,
    MessageSquare,
    Database,
    Puzzle,
    Settings,
} from "lucide-react";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Prospects",
        icon: Users,
        href: "/dashboard/prospects",
        color: "text-violet-500",
    },
    {
        label: "Teams",
        icon: Users,
        href: "/dashboard/teams",
        color: "text-indigo-500",
    },
    {
        label: "Agents",
        icon: Bot,
        href: "/dashboard/agents",
        color: "text-pink-500",
    },
    {
        label: "Messages",
        icon: MessageSquare,
        href: "/dashboard/messages",
        color: "text-orange-500",
    },
    {
        label: "Knowledge",
        icon: Database,
        href: "/dashboard/knowledge",
        color: "text-emerald-500",
    },
    {
        label: "Integrations",
        icon: Puzzle,
        href: "/dashboard/integrations",
        color: "text-blue-500",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/dashboard/settings",
        color: "text-slate-500",
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">AgentHub</span>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {routes.map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                            pathname === route.href
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground"
                        )}
                    >
                        <route.icon className={cn("h-5 w-5", route.color)} />
                        {route.label}
                    </Link>
                ))}
            </nav>

            <div className="border-t p-4">
                <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-600/10 p-4">
                    <p className="text-sm font-semibold mb-1">Upgrade to Pro</p>
                    <p className="text-xs text-muted-foreground mb-3">
                        Unlock unlimited agents and advanced features
                    </p>
                    <button className="w-full rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </div>
    );
}
