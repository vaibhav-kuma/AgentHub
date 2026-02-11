import { pgTable, text, timestamp, uuid, jsonb, boolean, integer, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (synced with Clerk)
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: text('clerk_id').notNull().unique(),
    email: text('email').notNull().unique(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    imageUrl: text('image_url'),
    plan: text('plan').default('free'),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripePriceId: text('stripe_price_id'),
    planLimits: jsonb('plan_limits'),
    settings: jsonb('settings').$type<{
        notifications?: {
            agentCompletions?: boolean;
            teamUpdates?: boolean;
            weeklyReports?: boolean;
            marketingEmails?: boolean;
        };
        theme?: 'light' | 'dark' | 'system';
        accentColor?: string;
        security?: {
            twoFactor?: boolean;
            sessionTimeout?: boolean;
        };
        bio?: string;
    }>(),
    subscriptionStatus: text('subscription_status'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teams table
export const teams = pgTable('teams', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    settings: jsonb('settings').$type<{
        maxAgents?: number;
        defaultModel?: string;
        [key: string]: any;
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Agents table
export const agents = pgTable('agents', {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    role: text('role').notNull(), // e.g., "researcher", "writer", "analyst"
    description: text('description'),
    systemPrompt: text('system_prompt').notNull(),
    model: text('model').notNull().default('claude-3-5-sonnet-20241022'),
    temperature: integer('temperature').default(70), // stored as 0-100, divide by 100 for API
    maxTokens: integer('max_tokens').default(4096),
    tools: jsonb('tools').$type<string[]>().default([]),
    isActive: boolean('is_active').default(true).notNull(),
    metadata: jsonb('metadata').$type<{
        avatar?: string;
        color?: string;
        [key: string]: any;
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table (Unified Inbox)
export const messages = pgTable('messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Channel info
    channel: text('channel').notNull(), // 'linkedin', 'twitter', 'email', 'instagram', 'internal'
    channelMessageId: text('channel_message_id'), // External message ID

    // Thread info
    threadId: text('thread_id'), // Group related messages
    parentMessageId: uuid('parent_message_id'),

    // Message content
    role: text('role').notNull(), // 'user', 'assistant', 'system'
    content: text('content').notNull(),

    // Sender/Recipient info
    senderName: text('sender_name'),
    senderEmail: text('sender_email'),
    senderProfileUrl: text('sender_profile_url'),
    recipientName: text('recipient_name'),

    // Status
    status: text('status').default('sent'), // 'sent', 'delivered', 'read', 'replied', 'failed', 'archived', 'pending_approval'
    isRead: boolean('is_read').default(false),
    needsApproval: boolean('needs_approval').default(false),
    isApproved: boolean('is_approved').default(false),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),

    // Metadata
    metadata: jsonb('metadata').$type<{
        tokens?: number;
        model?: string;
        prospectName?: string;
        profileUrl?: string;
        platform?: string;
        attachments?: any[];
        [key: string]: any;
    }>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    parentReference: foreignKey({
        columns: [table.parentMessageId],
        foreignColumns: [table.id],
    }),
}));

// Knowledge Bases table
export const knowledgeBases = pgTable('knowledge_bases', {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    type: text('type').notNull(), // 'document', 'url', 'api', 'database'
    content: text('content'),
    metadata: jsonb('metadata').$type<{
        fileUrl?: string;
        fileSize?: number;
        mimeType?: string;
        embedding?: number[];
        [key: string]: any;
    }>(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Integrations table
export const integrations = pgTable('integrations', {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'slack', 'discord', 'github', 'notion', etc.
    credentials: jsonb('credentials').$type<{
        apiKey?: string;
        accessToken?: string;
        refreshToken?: string;
        webhookUrl?: string;
        [key: string]: any;
    }>(),
    config: jsonb('config').$type<{
        [key: string]: any;
    }>(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Team Invitations table
export const teamInvitations = pgTable('team_invitations', {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').notNull().default('member'), // 'admin', 'member'
    token: text('token').notNull().unique(),
    status: text('status').default('pending'), // 'pending', 'accepted', 'expired'
    invitedBy: uuid('invited_by').notNull().references(() => users.id),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Team Members table
export const teamMembers = pgTable('team_members', {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'), // 'admin', 'member', 'viewer'
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Canvas Nodes table (for drag-and-drop canvas)
export const canvasNodes = pgTable('canvas_nodes', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
    agentType: text('agent_type').notNull(), // 'SDR', 'Support', 'Content Writer', etc.
    position: jsonb('position').$type<{
        x: number;
        y: number;
    }>().notNull(),
    config: jsonb('config').$type<{
        goal?: string;
        tone?: string;
        icp?: string;
        knowledgeBase?: string[];
        model?: string;
        temperature?: number;
        [key: string]: any;
    }>().default({}),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Canvas Edges table (connections between nodes)
export const canvasEdges = pgTable('canvas_edges', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    sourceNodeId: uuid('source_node_id').notNull().references(() => canvasNodes.id, { onDelete: 'cascade' }),
    targetNodeId: uuid('target_node_id').notNull().references(() => canvasNodes.id, { onDelete: 'cascade' }),
    type: text('type').default('smoothstep'), // 'smoothstep', 'step', 'straight'
    metadata: jsonb('metadata').$type<{
        triggerCondition?: string; // e.g., 'on_reply', 'on_conversion', 'on_error'
        [key: string]: any;
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Knowledge Sources table
export const knowledgeSources = pgTable('knowledge_sources', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'url', 'file', 'notion'
    url: text('url'),
    fileName: text('file_name'),
    fileSize: integer('file_size'),
    status: text('status').default('processed'), // 'pending', 'processing', 'processed', 'failed'
    chunkCount: integer('chunk_count').default(0),
    metadata: jsonb('metadata').$type<{
        [key: string]: any;
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Knowledge Chunks table (for scraped/uploaded content)
export const knowledgeChunks = pgTable('knowledge_chunks', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    sourceId: text('source_id').notNull(), // Reference to knowledge source
    sourceType: text('source_type').notNull(), // 'url', 'file', 'notion', 'gdocs'
    sourceUrl: text('source_url'),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    embedding: jsonb('embedding').$type<number[]>(), // Vector embedding (future)
    metadata: jsonb('metadata').$type<{
        title?: string;
        description?: string;
        fileName?: string;
        fileSize?: number;
        [key: string]: any;
    }>(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Prospects table (CRM)
export const prospects = pgTable('prospects', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    title: text('title'),
    company: text('company'),
    location: text('location'),
    profileUrl: text('profile_url').unique(),
    channel: text('channel'), // 'linkedin', 'twitter', 'email', 'instagram'
    status: text('status').default('lead'), // 'lead', 'engaged', 'converted', 'rejected'
    notes: text('notes'),
    metadata: jsonb('metadata').$type<{
        [key: string]: any;
    }>(),
    lastInteractionAt: timestamp('last_interaction_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    teams: many(teams),
    messages: many(messages),
    teamMemberships: many(teamMembers),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
    owner: one(users, {
        fields: [teams.ownerId],
        references: [users.id],
    }),
    agents: many(agents),
    messages: many(messages),
    knowledgeBases: many(knowledgeBases),
    knowledgeBases: many(knowledgeBases),
    integrations: many(integrations),
    members: many(teamMembers),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
    team: one(teams, {
        fields: [agents.teamId],
        references: [teams.id],
    }),
    messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
    team: one(teams, {
        fields: [messages.teamId],
        references: [teams.id],
    }),
    agent: one(agents, {
        fields: [messages.agentId],
        references: [agents.id],
    }),
    user: one(users, {
        fields: [messages.userId],
        references: [users.id],
    }),
}));

export const knowledgeBasesRelations = relations(knowledgeBases, ({ one }) => ({
    team: one(teams, {
        fields: [knowledgeBases.teamId],
        references: [teams.id],
    }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
    team: one(teams, {
        fields: [integrations.teamId],
        references: [teams.id],
    }),
}));

export const canvasNodesRelations = relations(canvasNodes, ({ one }) => ({
    user: one(users, {
        fields: [canvasNodes.userId],
        references: [users.id],
    }),
    team: one(teams, {
        fields: [canvasNodes.teamId],
        references: [teams.id],
    }),
}));

export const canvasEdgesRelations = relations(canvasEdges, ({ one }) => ({
    user: one(users, {
        fields: [canvasEdges.userId],
        references: [users.id],
    }),
    sourceNode: one(canvasNodes, {
        fields: [canvasEdges.sourceNodeId],
        references: [canvasNodes.id],
    }),
    targetNode: one(canvasNodes, {
        fields: [canvasEdges.targetNodeId],
        references: [canvasNodes.id],
    }),
}));

export const prospectsRelations = relations(prospects, ({ one }) => ({
    user: one(users, {
        fields: [prospects.userId],
        references: [users.id],
    }),
    team: one(teams, {
        fields: [prospects.teamId],
        references: [teams.id],
    }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
    team: one(teams, {
        fields: [teamMembers.teamId],
        references: [teams.id],
    }),
    user: one(users, {
        fields: [teamMembers.userId],
        references: [users.id],
    }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type NewKnowledgeBase = typeof knowledgeBases.$inferInsert;

export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;

export type CanvasNode = typeof canvasNodes.$inferSelect;
export type NewCanvasNode = typeof canvasNodes.$inferInsert;

export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type NewKnowledgeChunk = typeof knowledgeChunks.$inferInsert;

export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;

export type CanvasEdge = typeof canvasEdges.$inferSelect;
export type NewCanvasEdge = typeof canvasEdges.$inferInsert;
