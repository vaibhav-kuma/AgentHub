"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Bot,
    Inbox,
    Settings,
    Plus,
    X,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import type { User } from "@clerk/nextjs/server";
import { useEffect, useState } from "react";

const navigation = [
    {
        name: "Dashboard",
        href: "/app/dashboard",
        icon: LayoutDashboard,
        color: "text-blue-500",
    },
    {
        name: "Agents",
        href: "/app/agents",
        icon: Bot,
        color: "text-purple-500",
    },
    {
        name: "Inbox",
        href: "/app/inbox",
        icon: Inbox,
        color: "text-pink-500",
        badge: "3",
    },
    {
        name: "Settings",
        href: "/app/settings",
        icon: Settings,
        color: "text-slate-500",
    },
];

export function MobileSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Listen for mobile menu button clicks
    useEffect(() => {
        const handleMenuClick = () => setIsOpen(true);
        window.addEventListener("mobile-menu-open", handleMenuClick);
        return () => window.removeEventListener("mobile-menu-open", handleMenuClick);
    }, []);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 lg:hidden transform transition-transform">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
                    <Link href="/app/dashboard" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                            AgentHub
                        </span>
                    </Link>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                                    isActive
                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? item.color : "")} />
                                <span className="flex-1">{item.name}</span>
                                {item.badge && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-semibold">
                                        {item.badge}
                                    </span>
                                )}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}

                    {/* Quick Actions */}
                    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all">
                            <Plus className="h-5 w-5" />
                            <span>New Agent</span>
                        </button>
                    </div>
                </nav>

                {/* Upgrade Card */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 dark:border-blue-500/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                Upgrade to Pro
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                            Unlock unlimited agents and advanced features.
                        </p>
                        <button className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-1">
                            Upgrade Now
                            <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
