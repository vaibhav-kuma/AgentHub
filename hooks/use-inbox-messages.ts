"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);

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

export function useInboxMessages() {
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load messages from API
    const loadMessages = useCallback(async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const response = await fetch("/api/inbox/messages");

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
                throw new Error(errorData.error || "Failed to load messages");
            }

            const data = await response.json();
            setMessages(data.messages || []);
            setError(null);
        } catch (err: any) {
            console.error("Error loading messages:", err);

            // Check if it's a database configuration error
            if (err.message?.includes("DATABASE_URL") || err.message?.includes("Unauthorized")) {
                setError("Database not configured. Please set up your database connection.");
                setMessages([]); // Set empty messages array
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!user) return;

        loadMessages();

        // Subscribe to Supabase real-time
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

        const channel = supabase
            .channel("inbox-messages")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "messages",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log("Real-time update:", payload);

                    if (payload.eventType === "INSERT") {
                        // Add new message
                        setMessages((prev) => [...prev, payload.new as Message]);
                    } else if (payload.eventType === "UPDATE") {
                        // Update existing message
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === payload.new.id ? (payload.new as Message) : msg
                            )
                        );
                    } else if (payload.eventType === "DELETE") {
                        // Remove deleted message
                        setMessages((prev) =>
                            prev.filter((msg) => msg.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, loadMessages]);

    // Send reply (human or AI)
    const sendReply = useCallback(
        async (threadId: string, content: string, useAI: boolean = false) => {
            try {
                const response = await fetch("/api/inbox/reply", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        threadId,
                        content,
                        useAI,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to send reply");
                }

                const data = await response.json();
                return data;
            } catch (error) {
                console.error("Error sending reply:", error);
                throw error;
            }
        },
        []
    );

    // Mark message as read
    const markAsRead = useCallback(async (messageId: string) => {
        try {
            const response = await fetch("/api/inbox/mark-read", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messageId }),
            });

            if (!response.ok) {
                throw new Error("Failed to mark as read");
            }

            // Update local state
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === messageId ? { ...msg, isRead: true } : msg
                )
            );
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    }, []);

    // Archive message
    const archiveMessage = useCallback(async (messageId: string) => {
        try {
            const response = await fetch("/api/inbox/archive", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messageId }),
            });

            if (!response.ok) {
                throw new Error("Failed to archive message");
            }

            // Remove from local state
            setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        } catch (error) {
            console.error("Error archiving message:", error);
        }
    }, []);

    // Approve message
    const approveMessage = useCallback(async (messageId: string, content?: string) => {
        try {
            const response = await fetch("/api/inbox/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messageId, content }),
            });

            if (!response.ok) {
                throw new Error("Failed to approve message");
            }

            const data = await response.json();

            // Update local state
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === messageId ? { ...msg, ...data.message, isApproved: true } : msg
                )
            );
        } catch (error) {
            console.error("Error approving message:", error);
            throw error;
        }
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendReply,
        markAsRead,
        archiveMessage,
        approveMessage,
        refresh: loadMessages,
    };
}
