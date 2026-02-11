"use client";

import { UserButton } from "@clerk/nextjs";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function Header() {
    const { theme, setTheme } = useTheme();

    return (
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-md p-2 hover:bg-accent transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === "dark" ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </button>

                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "h-9 w-9",
                        },
                    }}
                />
            </div>
        </header>
    );
}
