"use client";

import { UserButton } from "@clerk/nextjs";
import { Moon, Sun, Menu, Search, Bell, Command } from "lucide-react";
import { useTheme } from "next-themes";
import type { User } from "@clerk/nextjs/server";
import { useState } from "react";

export function AppHeader() {
    const { theme, setTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
            <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </button>

                    {/* Search */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-w-[300px] group hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search agents, teams, messages..."
                            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none"
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <Command className="h-3 w-3" />K
                        </kbd>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2">
                    {/* Mobile Search */}
                    <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Search className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </button>

                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? (
                            <Sun className="h-5 w-5 text-slate-400" />
                        ) : (
                            <Moon className="h-5 w-5 text-slate-600" />
                        )}
                    </button>

                    {/* User Button */}
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "h-9 w-9 rounded-lg",
                                userButtonPopoverCard: "rounded-xl shadow-xl",
                            },
                        }}
                    />
                </div>
            </div>
        </header>
    );
}
