#!/usr/bin/env node

/**
 * LinkedIn Cron Job
 * Runs once per execution on Render.com cron service
 * Processes all scheduled LinkedIn campaigns
 */

import { LinkedInCronRunner } from "../lib/cron/linkedin-cron";

async function main() {
    console.log("=".repeat(60));
    console.log("LinkedIn Cron Job Started");
    console.log("Time:", new Date().toISOString());
    console.log("=".repeat(60));

    const runner = new LinkedInCronRunner();

    try {
        // Load and run all scheduled jobs
        await runner.startAll();

        console.log("All jobs completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("Fatal error in cron job:", error);
        process.exit(1);
    }
}

// Run the job
main();
