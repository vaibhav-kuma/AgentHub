#!/usr/bin/env node

/**
 * LinkedIn Worker Entry Point
 * Runs on Render.com as a background worker
 * Handles LinkedIn automation tasks from the queue
 */

import { startCronRunner, stopCronRunner } from "../lib/cron/linkedin-cron";

async function main() {
    console.log("Starting LinkedIn Worker...");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Proxy configured:", !!process.env.PROXY_URL);

    try {
        // Start the cron runner
        await startCronRunner();

        console.log("LinkedIn Worker started successfully");
        console.log("Waiting for scheduled jobs...");

        // Keep process alive
        process.on("SIGTERM", async () => {
            console.log("SIGTERM received, shutting down gracefully...");
            stopCronRunner();
            process.exit(0);
        });

        process.on("SIGINT", async () => {
            console.log("SIGINT received, shutting down gracefully...");
            stopCronRunner();
            process.exit(0);
        });
    } catch (error) {
        console.error("Fatal error starting worker:", error);
        process.exit(1);
    }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    stopCronRunner();
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled rejection at:", promise, "reason:", reason);
});

// Start the worker
main();
