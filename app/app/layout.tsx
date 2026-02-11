import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppHeader } from "@/components/app/app-header";
import { MobileSidebar } from "@/components/app/mobile-sidebar";
import { DatabaseWarning } from "@/components/database-warning";

export default async function AppLayout({
    children,
}: {
    children: ReactNode;
}) {
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Desktop Sidebar */}
            <AppSidebar />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <AppHeader />
                <main className="flex-1 overflow-y-auto">
                    <div className="h-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar */}
            <MobileSidebar />

            {/* Database Warning - Only shows if DATABASE_URL is not set */}
            {!process.env.DATABASE_URL && <DatabaseWarning />}
        </div>
    );
}
