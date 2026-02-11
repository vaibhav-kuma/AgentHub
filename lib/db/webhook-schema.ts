import { pgTable, uuid, text, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { users, agents } from "./schema";

// Webhooks table
export const webhooks = pgTable('webhooks', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    url: text('url').notNull(),
    secret: text('secret'),

    // Trigger events
    events: jsonb('events').$type<string[]>().notNull(), // ['new_lead', 'meeting_booked', 'positive_reply']

    // Integration type
    integrationType: text('integration_type'), // 'zapier', 'make', 'custom'

    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Webhook logs table
export const webhookLogs = pgTable('webhook_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    webhookId: uuid('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),

    event: text('event').notNull(),
    payload: jsonb('payload').notNull(),

    status: text('status').notNull(), // 'success', 'failed', 'pending'
    statusCode: integer('status_code'),
    response: text('response'),
    error: text('error'),

    attemptCount: integer('attempt_count').default(1).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Analytics events table
export const analyticsEvents = pgTable('analytics_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'cascade' }),

    eventType: text('event_type').notNull(), // 'lead_generated', 'reply_received', 'meeting_booked', 'message_sent'
    channel: text('channel').notNull(), // 'linkedin', 'email', 'twitter', 'instagram'

    metadata: jsonb('metadata').$type<{
        prospectName?: string;
        prospectEmail?: string;
        prospectCompany?: string;
        messageId?: string;
        sentiment?: 'positive' | 'neutral' | 'negative';
        [key: string]: any;
    }>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
