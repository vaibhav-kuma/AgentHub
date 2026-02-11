"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import type { CanvasNode } from "@/app/app/dashboard/page";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);

export function useCanvasState() {
    const { user } = useUser();
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load canvas state from API
    const loadNodes = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/canvas");

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
                throw new Error(errorData.error || "Failed to load canvas");
            }

            const data = await response.json();
            setNodes(data.nodes || []);
            setError(null);
        } catch (err: any) {
            console.error("Error loading canvas:", err);

            // Check if it's a database configuration error
            if (err.message?.includes("DATABASE_URL") || err.message?.includes("Unauthorized")) {
                setError("Database not configured. Using local storage only.");
            } else {
                setError(err.message);
            }

            // Fallback to localStorage
            try {
                const saved = localStorage.getItem("canvas-nodes");
                if (saved) {
                    setNodes(JSON.parse(saved));
                    console.log("Loaded canvas from localStorage");
                }
            } catch (storageErr) {
                console.error("Error loading from localStorage:", storageErr);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save canvas state to API
    const saveNodes = useCallback(async (nodesToSave: CanvasNode[]) => {
        try {
            setIsSaving(true);

            const response = await fetch("/api/canvas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nodes: nodesToSave }),
            });

            if (!response.ok) {
                throw new Error("Failed to save canvas");
            }

            // Also save to localStorage as backup
            localStorage.setItem("canvas-nodes", JSON.stringify(nodesToSave));
            setError(null);
        } catch (err: any) {
            console.error("Error saving canvas:", err);
            setError(err.message);
            // Fallback to localStorage only
            localStorage.setItem("canvas-nodes", JSON.stringify(nodesToSave));
        } finally {
            setTimeout(() => setIsSaving(false), 500);
        }
    }, []);

    // Auto-save when nodes change
    useEffect(() => {
        if (!isLoading && nodes.length >= 0) {
            const timer = setTimeout(() => {
                saveNodes(nodes);
            }, 1000); // Debounce for 1 second

            return () => clearTimeout(timer);
        }
    }, [nodes, isLoading, saveNodes]);

    // Load on mount
    useEffect(() => {
        loadNodes();
    }, [loadNodes]);

    // Real-time sync with Supabase
    useEffect(() => {
        if (!user || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;

        const channel = supabase
            .channel(`canvas-nodes-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "canvas_nodes",
                    // Note: This relies on the DB user ID being mapped or Clerk ID being used in DB.
                    // Given the project structure, we use Clerk ID if mapped to user_id in DB,
                    // but since schema says UUID, this might need a DB user ID lookup.
                    // For now, we'll try to listen for updates and reload.
                },
                (payload) => {
                    console.log("Canvas real-time update:", payload);
                    loadNodes();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, loadNodes]);

    return {
        nodes,
        setNodes,
        isLoading,
        isSaving,
        error,
        reload: loadNodes,
    };
}
