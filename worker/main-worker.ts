#!/usr/bin/env node

import { startCronRunner as startLinkedIn, stopCronRunner as stopLinkedIn, getCronRunner as getLinkedInRunner } from "../lib/cron/linkedin-cron";
import { getEmailRunner } from "../lib/cron/email-cron";
import { getTwitterRunner } from "../lib/cron/twitter-cron";
import { getInstagramRunner } from "../lib/cron/instagram-cron";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Supabase for Real-time watching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
    console.log("🚀 Starting AgentHub Background Workers...");

    if (!supabaseUrl || !supabaseKey) {
        console.warn("⚠️ Supabase credentials missing. Real-time dynamic sync will be disabled.");
    }

    try {
        // 1. Initialize all runners and load existing active jobs
        console.log("Initializing workers...");
        await startLinkedIn();
        await getEmailRunner().startAll();
        await getTwitterRunner().startAll();
        await getInstagramRunner().startAll();

        // 2. Setup Real-time listener for dynamic sync
        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);

            console.log("📡 Listening for real-time canvas updates...");

            supabase
                .channel('canvas-sync')
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: 'canvas_nodes'
                    },
                    async (payload) => {
                        console.log("Change detected in canvas_nodes:", payload.eventType);

                        const agentId = (payload.new as any)?.id || (payload.old as any)?.id;
                        if (!agentId) return;

                        // Sync across all runners
                        await Promise.all([
                            getLinkedInRunner().syncJob(agentId),
                            getEmailRunner().syncJob(agentId),
                            getTwitterRunner().syncJob(agentId),
                            getInstagramRunner().syncJob(agentId)
                        ]);
                    }
                )
                .subscribe();
        }

        console.log("✅ All workers initialized and watching for jobs.");

        // Graceful Shutdown
        const shutdown = () => {
            console.log("Stopping all workers...");
            stopLinkedIn();
            getEmailRunner().stopAll();
            getTwitterRunner().stopAll();
            getInstagramRunner().stopAll();
            process.exit(0);
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);

    } catch (error) {
        console.error("❌ Fatal error in background worker:", error);
        process.exit(1);
    }
}

main();
