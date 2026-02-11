import postgres from "postgres";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined in .env.local");
    process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function setup() {
    try {
        console.log("🚀 Starting database setup...");

        const schemaSql = fs.readFileSync(
            path.join(process.cwd(), "supabase-schema.sql"),
            "utf8"
        );

        console.log("📜 Executing schema...");
        await sql.unsafe(schemaSql);

        console.log("✅ Database setup complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Database setup failed:");
        console.error(error);
        process.exit(1);
    }
}

setup();
