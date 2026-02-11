"use client";

import React, { useState, useEffect } from "react";
import {
    Slack,
    MessageSquare,
    Github,
    Zap,
    Plus,
    CheckCircle2,
    Loader2,
    ExternalLink,
    AlertCircle,
    Info
} from "lucide-react";

const availableIntegrations = [
    {
        id: "slack",
        name: "Slack",
        description: "Receive real-time notifications when a new lead is generated or a meeting is booked.",
        icon: Slack,
        color: "text-[#4A154B]",
        bg: "bg-[#4A154B]/5",
        status: "available",
    },
    {
        id: "zapier",
        name: "Zapier",
        description: "Connect AgentHub to 5,000+ apps. Trigger workflows when outreach events happen.",
        icon: Zap,
        color: "text-[#FF4A00]",
        bg: "bg-[#FF4A00]/5",
        status: "available",
    },
    {
        id: "discord",
        name: "Discord",
        description: "Send campaign updates and positive reply alerts to your Discord channels.",
        icon: MessageSquare,
        color: "text-[#5865F2]",
        bg: "bg-[#5865F2]/5",
        status: "available",
    },
    {
        id: "github",
        name: "GitHub",
        description: "Sync repository data to your knowledge base to train technical support agents.",
        icon: Github,
        color: "text-[#181717]",
        bg: "bg-[#181717]/5",
        status: "coming-soon",
    }
];

export default function IntegrationsPage() {
    const [connectedIntegrations, setConnectedIntegrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState<string | null>(null);

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/integrations");
            const data = await response.json();
            setConnectedIntegrations(data.integrations || []);
        } catch (error) {
            console.error("Error fetching integrations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async (type: string, name: string) => {
        try {
            setIsConnecting(type);
            const response = await fetch("/api/integrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    type,
                    credentials: { mock: true },
                    config: {}
                })
            });

            if (response.ok) {
                const data = await response.json();
                setConnectedIntegrations([...connectedIntegrations, data.integration]);
            }
        } catch (error) {
            console.error("Error connecting integration:", error);
        } finally {
            setIsConnecting(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    App Integrations
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Connect your favorite tools to automate your outreach and sync data across platforms.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableIntegrations.map((app) => {
                    const isConnected = connectedIntegrations.some(i => i.type === app.id);
                    const isComingSoon = app.status === "coming-soon";

                    return (
                        <div
                            key={app.id}
                            className={`group bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all ${isConnected
                                    ? "border-green-500/50 shadow-green-500/5 shadow-lg"
                                    : isComingSoon
                                        ? "border-slate-100 dark:border-slate-800 opacity-75"
                                        : "border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-xl"
                                }`}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${app.bg}`}>
                                    <app.icon className={`h-8 w-8 ${app.color}`} />
                                </div>
                                {isConnected ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 text-xs font-bold uppercase tracking-wider">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Connected
                                    </span>
                                ) : isComingSoon ? (
                                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        Soon
                                    </span>
                                ) : null}
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                {app.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                {app.description}
                            </p>

                            <div className="flex items-center gap-2">
                                {!isComingSoon && !isConnected && (
                                    <button
                                        onClick={() => handleConnect(app.id, app.name)}
                                        disabled={isConnecting === app.id}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                                    >
                                        {isConnecting === app.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                        Connect {app.name}
                                    </button>
                                )}

                                {isConnected && (
                                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                        Configure
                                    </button>
                                )}

                                {isComingSoon && (
                                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed">
                                        Join Waitlist
                                    </button>
                                )}

                                <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all">
                                    <ExternalLink className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 flex gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                        Looking for a specific integration?
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                        We're constantly adding new integrations. If you need a custom integration, you can use our <a href="/app/webhooks" className="font-bold underline">Webhooks</a> or contact our enterprise support team.
                    </p>
                </div>
            </div>
        </div>
    );
}
