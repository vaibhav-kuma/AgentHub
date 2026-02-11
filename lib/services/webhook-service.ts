import axios from "axios";
import crypto from "crypto";
import { db } from "@/lib/db";
import { webhooks, webhookLogs, analyticsEvents } from "@/lib/db/webhook-schema";
import { eq, and } from "drizzle-orm";

export type WebhookEvent = "new_lead" | "meeting_booked" | "positive_reply" | "message_sent";

interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: {
        prospectName?: string;
        prospectEmail?: string;
        prospectCompany?: string;
        prospectTitle?: string;
        channel: string;
        message?: string;
        sentiment?: "positive" | "neutral" | "negative";
        agentId?: string;
        agentName?: string;
        [key: string]: any;
    };
}

export class WebhookService {
    /**
     * Trigger webhooks for an event
     */
    static async trigger(
        userId: string,
        event: WebhookEvent,
        data: WebhookPayload["data"]
    ): Promise<void> {
        try {
            // Get all active webhooks for this user that listen to this event
            const userWebhooks = await db
                .select()
                .from(webhooks)
                .where(
                    and(
                        eq(webhooks.userId, userId),
                        eq(webhooks.isActive, true)
                    )
                );

            const relevantWebhooks = userWebhooks.filter((webhook) =>
                webhook.events.includes(event)
            );

            if (relevantWebhooks.length === 0) {
                console.log(`No webhooks configured for event: ${event}`);
                return;
            }

            // Log analytics event
            await db.insert(analyticsEvents).values({
                userId,
                agentId: data.agentId,
                eventType: this.mapEventToAnalyticsType(event),
                channel: data.channel,
                metadata: {
                    prospectName: data.prospectName,
                    prospectEmail: data.prospectEmail,
                    prospectCompany: data.prospectCompany,
                    sentiment: data.sentiment,
                },
            });

            // Trigger each webhook
            const payload: WebhookPayload = {
                event,
                timestamp: new Date().toISOString(),
                data,
            };

            for (const webhook of relevantWebhooks) {
                this.sendWebhook(webhook.id, webhook.url, webhook.secret || undefined, payload);
            }
        } catch (error) {
            console.error("Error triggering webhooks:", error);
        }
    }

    /**
     * Send webhook to URL
     */
    private static async sendWebhook(
        webhookId: string,
        url: string,
        secret: string | undefined,
        payload: WebhookPayload,
        attemptCount: number = 1
    ): Promise<void> {
        try {
            // Generate signature if secret is provided
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                "User-Agent": "AgentHub-Webhooks/1.0",
            };

            if (secret) {
                const signature = crypto
                    .createHmac("sha256", secret)
                    .update(JSON.stringify(payload))
                    .digest("hex");
                headers["X-AgentHub-Signature"] = signature;
            }

            // Send webhook
            const response = await axios.post(url, payload, {
                headers,
                timeout: 10000, // 10 second timeout
            });

            // Log success
            await db.insert(webhookLogs).values({
                webhookId,
                event: payload.event,
                payload: payload as any,
                status: "success",
                statusCode: response.status,
                response: JSON.stringify(response.data),
                attemptCount,
            });
        } catch (error: any) {
            console.error(`Webhook delivery failed (attempt ${attemptCount}):`, error);

            // Log failure
            await db.insert(webhookLogs).values({
                webhookId,
                event: payload.event,
                payload: payload as any,
                status: "failed",
                statusCode: error.response?.status,
                error: error.message,
                attemptCount,
            });

            // Retry up to 3 times with exponential backoff
            if (attemptCount < 3) {
                const delay = Math.pow(2, attemptCount) * 1000; // 2s, 4s, 8s
                setTimeout(() => {
                    this.sendWebhook(webhookId, url, secret, payload, attemptCount + 1);
                }, delay);
            }
        }
    }

    /**
     * Map webhook event to analytics event type
     */
    private static mapEventToAnalyticsType(event: WebhookEvent): string {
        const mapping: Record<WebhookEvent, string> = {
            new_lead: "lead_generated",
            meeting_booked: "meeting_booked",
            positive_reply: "reply_received",
            message_sent: "message_sent",
        };
        return mapping[event] || event;
    }

    /**
     * Test webhook
     */
    static async test(webhookId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const webhook = await db
                .select()
                .from(webhooks)
                .where(eq(webhooks.id, webhookId))
                .limit(1);

            if (webhook.length === 0) {
                return { success: false, error: "Webhook not found" };
            }

            const testPayload: WebhookPayload = {
                event: "new_lead",
                timestamp: new Date().toISOString(),
                data: {
                    prospectName: "Test Prospect",
                    prospectEmail: "test@example.com",
                    prospectCompany: "Test Company",
                    channel: "test",
                    message: "This is a test webhook",
                },
            };

            await this.sendWebhook(
                webhook[0].id,
                webhook[0].url,
                webhook[0].secret || undefined,
                testPayload
            );

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
