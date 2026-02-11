"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Linkedin,
    Twitter,
    Mail,
    Instagram,
    Bot,
    User,
    Send,
    Sparkles,
    Check,
    CheckCheck,
    Clock,
    Search,
    Filter,
    Star,
    Archive,
    Trash2,
    MoreVertical,
    Loader2,
    Zap,
} from "lucide-react";
import { useInboxMessages } from "@/hooks/use-inbox-messages";
import { formatDistanceToNow } from "date-fns";

interface Message {
    id: string;
    channel: "linkedin" | "twitter" | "email" | "instagram" | "internal";
    role: "user" | "assistant" | "system";
    content: string;
    senderName?: string;
    senderEmail?: string;
    senderProfileUrl?: string;
    agentId?: string;
    threadId?: string;
    status: string;
    isRead: boolean;
    needsApproval?: boolean;
    isApproved?: boolean;
    createdAt: Date;
    metadata?: any;
}

const channelIcons = {
    linkedin: { icon: Linkedin, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10" },
    twitter: { icon: Twitter, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
    email: { icon: Mail, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-500/10" },
    instagram: { icon: Instagram, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-500/10" },
    internal: { icon: Bot, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-500/10" },
};

export default function InboxPage() {
    const { user } = useUser();
    const { messages, isLoading, sendReply, markAsRead, refresh, approveMessage } = useInboxMessages();

    const [selectedThread, setSelectedThread] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "unread" | "approvals" | "starred" | "linkedin" | "twitter" | "email">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [replyMode, setReplyMode] = useState<"human" | "ai" | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [editingApprovalId, setEditingApprovalId] = useState<string | null>(null);
    const [approvalContent, setApprovalContent] = useState("");

    const handleApprove = async (messageId: string, content?: string) => {
        try {
            await approveMessage(messageId, content);
            setEditingApprovalId(null);
            setApprovalContent("");
        } catch (error) {
            console.error("Failed to approve message:", error);
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Group messages by thread
    const threads = messages.reduce((acc, msg) => {
        const threadId = msg.threadId || msg.id;
        if (!acc[threadId]) {
            acc[threadId] = [];
        }
        acc[threadId].push(msg);
        return acc;
    }, {} as Record<string, Message[]>);

    // Get thread list (sorted by latest message)
    const threadList = Object.entries(threads)
        .map(([threadId, msgs]) => ({
            threadId,
            messages: msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
            latestMessage: msgs[msgs.length - 1],
            unreadCount: msgs.filter(m => !m.isRead).length,
        }))
        .sort((a, b) => new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime());

    // Filter threads
    const filteredThreads = threadList.filter(thread => {
        if (filter === "unread" && thread.unreadCount === 0) return false;
        if (filter === "approvals" && !thread.messages.some(m => m.needsApproval && !m.isApproved)) return false;
        if (filter === "starred") return false; // TODO: Implement starred
        if (filter !== "all" && filter !== "approvals" && filter !== "unread" && thread.latestMessage.channel !== filter) return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                thread.latestMessage.content.toLowerCase().includes(query) ||
                thread.latestMessage.senderName?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Get selected thread messages
    const selectedMessages = selectedThread ? threads[selectedThread] : [];

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedMessages]);

    // Mark as read when thread is opened
    useEffect(() => {
        if (selectedThread && selectedMessages.length > 0) {
            const unreadMessages = selectedMessages.filter(m => !m.isRead);
            unreadMessages.forEach(msg => markAsRead(msg.id));
        }
    }, [selectedThread]);

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedThread) return;

        setIsReplying(true);

        try {
            await sendReply(selectedThread, replyText, replyMode === "ai");
            setReplyText("");
            setReplyMode(null);
        } catch (error) {
            console.error("Error sending reply:", error);
        } finally {
            setIsReplying(false);
        }
    };

    const handleContinueWithAI = async () => {
        if (!selectedThread) return;

        setReplyMode("ai");
        setIsReplying(true);

        try {
            // AI will generate and send reply automatically
            await sendReply(selectedThread, "", true);
            setReplyMode(null);
        } catch (error) {
            console.error("Error with AI reply:", error);
        } finally {
            setIsReplying(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading inbox...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950">
            {/* Thread List */}
            <div className="w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {[
                            { id: "all", label: "All", icon: null },
                            { id: "unread", label: "Unread", icon: null },
                            { id: "linkedin", label: "LinkedIn", icon: Linkedin },
                            { id: "twitter", label: "Twitter", icon: Twitter },
                            { id: "email", label: "Email", icon: Mail },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filter === f.id
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    }`}
                            >
                                {f.icon && <f.icon className="h-3 w-3" />}
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Thread List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredThreads.length === 0 ? (
                        <div className="p-8 text-center">
                            <Mail className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">No messages found</p>
                        </div>
                    ) : (
                        filteredThreads.map((thread) => {
                            const msg = thread.latestMessage;
                            const ChannelIcon = channelIcons[msg.channel].icon;
                            const isSelected = selectedThread === thread.threadId;

                            return (
                                <button
                                    key={thread.threadId}
                                    onClick={() => setSelectedThread(thread.threadId)}
                                    className={`w-full p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left ${isSelected ? "bg-blue-50 dark:bg-blue-500/10 border-l-4 border-l-blue-500" : ""
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Channel Icon */}
                                        <div className={`h-10 w-10 rounded-lg ${channelIcons[msg.channel].bg} flex items-center justify-center flex-shrink-0`}>
                                            <ChannelIcon className={`h-5 w-5 ${channelIcons[msg.channel].color}`} />
                                        </div>

                                        {/* Message Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className={`text-sm font-semibold ${!msg.isRead ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                                                    {msg.senderName || "Unknown"}
                                                </h3>
                                                <span className="text-xs text-slate-500">
                                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className={`text-sm line-clamp-2 ${!msg.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-500"}`}>
                                                {msg.content}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {thread.unreadCount > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium">
                                                        {thread.unreadCount}
                                                    </span>
                                                )}
                                                {msg.metadata?.agentName && (
                                                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-medium flex items-center gap-1">
                                                        <Bot className="h-3 w-3" />
                                                        {msg.metadata.agentName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                {!selectedThread ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-10 w-10 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                Select a conversation
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Choose a message from the list to view the full conversation
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Thread Header */}
                        <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg ${channelIcons[selectedMessages[0]?.channel].bg} flex items-center justify-center`}>
                                    {React.createElement(channelIcons[selectedMessages[0]?.channel].icon, {
                                        className: `h-5 w-5 ${channelIcons[selectedMessages[0]?.channel].color}`,
                                    })}
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {selectedMessages[0]?.senderName || "Unknown"}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {selectedMessages[0]?.senderEmail || selectedMessages[0]?.channel}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <Archive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <Trash2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {selectedMessages.map((msg) => {
                                const isUser = msg.role === "user";
                                const isAgent = msg.role === "assistant";

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser
                                            ? "bg-blue-500"
                                            : isAgent
                                                ? "bg-gradient-to-br from-purple-500 to-pink-500"
                                                : "bg-slate-300 dark:bg-slate-700"
                                            }`}>
                                            {isUser ? (
                                                <User className="h-4 w-4 text-white" />
                                            ) : isAgent ? (
                                                <Bot className="h-4 w-4 text-white" />
                                            ) : (
                                                <span className="text-xs font-medium text-white">
                                                    {msg.senderName?.[0] || "?"}
                                                </span>
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`flex-1 max-w-2xl ${isUser ? "flex flex-col items-end" : ""}`}>
                                            <div className={`rounded-2xl px-4 py-3 ${isUser
                                                ? "bg-blue-500 text-white"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                                                } ${msg.needsApproval && !msg.isApproved ? "border-2 border-amber-500/50" : ""}`}>
                                                {!isUser && msg.senderName && (
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                            {msg.senderName}
                                                        </p>
                                                        {msg.needsApproval && !msg.isApproved && (
                                                            <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                <Clock className="h-2 w-2" />
                                                                Pending Approval
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {editingApprovalId === msg.id ? (
                                                    <textarea
                                                        value={approvalContent}
                                                        onChange={(e) => setApprovalContent(e.target.value)}
                                                        className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 min-h-[100px] resize-none"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                        {msg.content}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Approval Actions */}
                                            {msg.needsApproval && !msg.isApproved && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    {editingApprovalId === msg.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(msg.id, approvalContent)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors shadow-sm"
                                                            >
                                                                <Check className="h-3 w-3" />
                                                                Send Approved
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingApprovalId(null)}
                                                                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(msg.id)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors shadow-sm"
                                                            >
                                                                <Check className="h-3 w-3" />
                                                                Approve & Send
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingApprovalId(msg.id);
                                                                    setApprovalContent(msg.content);
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                                            >
                                                                <Sparkles className="h-3 w-3" />
                                                                Edit Draft
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Metadata */}
                                            <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                {isUser && msg.status === "read" && (
                                                    <CheckCheck className="h-3 w-3 text-blue-500" />
                                                )}
                                                {isUser && msg.status === "delivered" && (
                                                    <Check className="h-3 w-3 text-slate-400" />
                                                )}
                                                {isUser && msg.status === "sent" && (
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Input */}
                        <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                            {replyMode === null ? (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setReplyMode("human")}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-slate-700 dark:text-slate-300 font-medium"
                                    >
                                        <User className="h-5 w-5" />
                                        Reply as Human
                                    </button>
                                    <button
                                        onClick={handleContinueWithAI}
                                        disabled={isReplying}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all text-white font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isReplying ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-5 w-5" />
                                        )}
                                        Continue with AI
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Mode Indicator */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {replyMode === "ai" ? (
                                                <>
                                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                        <Sparkles className="h-3 w-3 text-white" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        AI Reply
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                        <User className="h-3 w-3 text-white" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        Human Reply
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setReplyMode(null)}
                                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    {/* Input */}
                                    <div className="flex gap-2">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={replyMode === "ai" ? "AI will generate a reply..." : "Type your message..."}
                                            rows={3}
                                            disabled={replyMode === "ai"}
                                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm disabled:opacity-50"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey && replyMode === "human") {
                                                    e.preventDefault();
                                                    handleSendReply();
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleSendReply}
                                            disabled={isReplying || (replyMode === "human" && !replyText.trim())}
                                            className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isReplying ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Send className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
