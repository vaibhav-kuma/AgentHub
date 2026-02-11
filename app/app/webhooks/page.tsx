"use client";

import React, { useState, useEffect } from "react";
import {
    Zap,
    Plus,
    Trash2,
    ExternalLink,
    CheckCircle2,
    Loader2,
    Copy,
    Globe,
    Activity,
    AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Webhook {
    id: string;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    createdAt: string;
}

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [newName, setNewName] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [selectedEvents, setSelectedEvents] = useState<string[]>(["lead_generated"]);

    const availableEvents = [
        { id: "lead_generated", label: "Lead Generated", description: "Triggered when a new prospect is found or connection sent." },
        { id: "message_sent", label: "Message Sent", description: "Triggered whenever an agent sends an outreach message." },
        { id: "reply_received", label: "Reply Received", description: "Triggered when a prospect replies to your outreach." },
        { id: "meeting_booked", label: "Meeting Booked", description: "Triggered when an agent successfully schedules a call." }
    ];

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const fetchWebhooks = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/webhooks");
            const data = await response.json();
            setWebhooks(data.webhooks || []);
        } catch (error) {
            console.error("Error fetching webhooks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName || !newUrl) return;

        try {
            setIsCreating(true);
            const response = await fetch("/api/webhooks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    url: newUrl,
                    events: selectedEvents
                })
            });

            if (response.ok) {
                const data = await response.json();
                setWebhooks([data.webhook, ...webhooks]);
                setShowCreateModal(false);
                setNewName("");
                setNewUrl("");
            }
        } catch (error) {
            console.error("Error creating webhook:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const toggleEvent = (eventId: string) => {
        if (selectedEvents.includes(eventId)) {
            setSelectedEvents(selectedEvents.filter(e => e !== eventId));
        } else {
            setSelectedEvents([...selectedEvents, eventId]);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Outgoing Webhooks
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Trigger external workflows in Zapier, Make, or your own server when events happen.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                    <Plus className="h-4 w-4" />
                    New Webhook
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                </div>
            ) : webhooks.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No webhooks yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Create your first webhook to start sending data to your external tools.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition-all"
                    >
                        Get Started
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {webhooks.map((webhook) => (
                        <div key={webhook.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/50 transition-all shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Globe className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                        {webhook.name}
                                        {webhook.isActive && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                                    </h3>
                                    <p className="text-sm text-slate-400 font-mono truncate max-w-md mb-3">
                                        {webhook.url}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {webhook.events.map(event => (
                                            <span key={event} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                                {event.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden md:block">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                    <p className="text-sm font-bold text-green-500">Active</p>
                                </div>
                                <div className="text-right hidden md:block">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Created</p>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {formatDistanceToNow(new Date(webhook.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 transition-all">
                                        <Activity className="h-4 w-4" />
                                    </button>
                                    <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create Webhook</h2>
                            <p className="text-slate-500 mb-8">Configure your new outgoing webhook.</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                                        Friendly Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Zapier Main Hook"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                                        Destination URL
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://hooks.zapier.com/..."
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">
                                        Events Trigger
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {availableEvents.map(event => (
                                            <button
                                                key={event.id}
                                                onClick={() => toggleEvent(event.id)}
                                                className={`text-left p-4 rounded-2xl border transition-all ${selectedEvents.includes(event.id)
                                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/5"
                                                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-sm text-slate-900 dark:text-white">{event.label}</span>
                                                    {selectedEvents.includes(event.id) && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                                    {event.description}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-6 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !newName || !newUrl || selectedEvents.length === 0}
                                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition-all disabled:opacity-50 shadow-lg"
                            >
                                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                                Create Webhook
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
