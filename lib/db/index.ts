import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL is not defined. Database features will be disabled.');
    console.warn('📖 See QUICK_SETUP.md for setup instructions.');
}

// Create a dummy client if DATABASE_URL is not defined
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/dummy';

// Disable prefetch as it's not supported for "Transaction" pool mode
const client = postgres(connectionString, {
    prepare: false,
    // Don't actually connect if using dummy URL
    max: process.env.DATABASE_URL ? undefined : 0,
    idle_timeout: process.env.DATABASE_URL ? undefined : 0,
});

export const db = drizzle(client, { schema });
