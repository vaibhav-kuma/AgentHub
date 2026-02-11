import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/db/webhook-schema";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type AnalyticsEventType =
    | "lead_generated"
    | "message_sent"
    | "reply_received"
    | "meeting_booked"
    | "error";

export type OutreachChannel = "linkedin" | "email" | "twitter" | "instagram" | "internal";

export class AnalyticsService {
    /**
     * Log an analytics event to the database
     */
    static async logEvent({
        userId,
        agentId,
        eventType,
        channel,
        metadata = {},
    }: {
        userId: string;
        agentId?: string;
        eventType: AnalyticsEventType;
        channel: OutreachChannel;
        metadata?: any;
    }) {
        try {
            await db.insert(analyticsEvents).values({
                userId,
                agentId,
                eventType,
                channel,
                metadata,
                createdAt: new Date(),
            });
            console.log(`[Analytics] Logged ${eventType} for user ${userId} on ${channel}`);
        } catch (error) {
            console.error("[Analytics] Error logging event:", error);
        }
    }

    /**
     * Log a lead generated event
     */
    static async logLead(userId: string, agentId: string, channel: OutreachChannel, metadata?: any) {
        return this.logEvent({ userId, agentId, eventType: "lead_generated", channel, metadata });
    }

    /**
     * Log a message sent event
     */
    static async logMessageSent(userId: string, agentId: string, channel: OutreachChannel, metadata?: any) {
        return this.logEvent({ userId, agentId, eventType: "message_sent", channel, metadata });
    }

    /**
     * Log a reply received event
     */
    static async logReplyReceived(userId: string, agentId: string, channel: OutreachChannel, metadata?: any) {
        return this.logEvent({ userId, agentId, eventType: "reply_received", channel, metadata });
    }

    /**
     * Log a meeting booked event
     */
    static async logMeetingBooked(userId: string, agentId: string, channel: OutreachChannel, metadata?: any) {
        return this.logEvent({ userId, agentId, eventType: "meeting_booked", channel, metadata });
    }
}
