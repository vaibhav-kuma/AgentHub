import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
    const user = await currentUser();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {user?.firstName || "there"}!
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage your AI agent teams and workflows
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2">Teams</h3>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground mt-1">Active teams</p>
                </div>

                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2">Agents</h3>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground mt-1">Total agents</p>
                </div>

                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2">Messages</h3>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground mt-1">This month</p>
                </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">1</span>
                        </div>
                        <div>
                            <p className="font-medium">Create your first team</p>
                            <p className="text-sm text-muted-foreground">Organize your AI agents into teams</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">2</span>
                        </div>
                        <div>
                            <p className="font-medium">Add AI agents</p>
                            <p className="text-sm text-muted-foreground">Configure agents with specific roles and capabilities</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">3</span>
                        </div>
                        <div>
                            <p className="font-medium">Start collaborating</p>
                            <p className="text-sm text-muted-foreground">Let your agent team work together</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
