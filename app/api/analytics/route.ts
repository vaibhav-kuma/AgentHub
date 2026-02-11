import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/db/webhook-schema";
import { messages } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getDbUser } from "@/lib/db/auth-utils";

// GET - Get analytics data
export async function GET(req: NextRequest) {
    try {
        const user = await getDbUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "30"; // days
        const agentId = searchParams.get("agentId");

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Build query conditions
        let conditions = [
            eq(analyticsEvents.userId, user.id),
            gte(analyticsEvents.createdAt, startDate),
        ];

        if (agentId) {
            conditions.push(eq(analyticsEvents.agentId, agentId));
        }

        // Get all analytics events
        const events = await db
            .select()
            .from(analyticsEvents)
            .where(and(...conditions));

        // Calculate metrics
        const leadsGenerated = events.filter(
            (e) => e.eventType === "lead_generated"
        ).length;

        const messagesSent = events.filter(
            (e) => e.eventType === "message_sent"
        ).length;

        const repliesReceived = events.filter(
            (e) => e.eventType === "reply_received"
        ).length;

        const positiveReplies = events.filter(
            (e) =>
                e.eventType === "reply_received" &&
                e.metadata?.sentiment === "positive"
        ).length;

        const meetingsBooked = events.filter(
            (e) => e.eventType === "meeting_booked"
        ).length;

        // Calculate rates
        const replyRate =
            messagesSent > 0 ? (repliesReceived / messagesSent) * 100 : 0;
        const positiveReplyRate =
            repliesReceived > 0 ? (positiveReplies / repliesReceived) * 100 : 0;
        const meetingBookingRate =
            repliesReceived > 0 ? (meetingsBooked / repliesReceived) * 100 : 0;

        // ROI Calculation
        const monthlyAgentCost = 299; // $299/month
        const humanSalaryCost = 20000 / 12; // $20K/year = ~$1,667/month
        const monthlySavings = humanSalaryCost - monthlyAgentCost;
        const roi = ((monthlySavings / monthlyAgentCost) * 100).toFixed(0);

        // Cost per meeting
        const costPerMeeting =
            meetingsBooked > 0 ? monthlyAgentCost / meetingsBooked : 0;

        // Group events by date for chart
        const eventsByDate = events.reduce((acc, event) => {
            const date = new Date(event.createdAt).toISOString().split("T")[0];
            if (!acc[date]) {
                acc[date] = {
                    date,
                    leads: 0,
                    messages: 0,
                    replies: 0,
                    meetings: 0,
                };
            }

            if (event.eventType === "lead_generated") acc[date].leads++;
            if (event.eventType === "message_sent") acc[date].messages++;
            if (event.eventType === "reply_received") acc[date].replies++;
            if (event.eventType === "meeting_booked") acc[date].meetings++;

            return acc;
        }, {} as Record<string, any>);

        const chartData = Object.values(eventsByDate).sort(
            (a: any, b: any) => a.date.localeCompare(b.date)
        );

        // Group by channel
        const eventsByChannel = events.reduce((acc, event) => {
            const channel = event.channel;
            if (!acc[channel]) {
                acc[channel] = {
                    channel,
                    leads: 0,
                    messages: 0,
                    replies: 0,
                    meetings: 0,
                };
            }

            if (event.eventType === "lead_generated") acc[channel].leads++;
            if (event.eventType === "message_sent") acc[channel].messages++;
            if (event.eventType === "reply_received") acc[channel].replies++;
            if (event.eventType === "meeting_booked") acc[channel].meetings++;

            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json({
            summary: {
                leadsGenerated,
                messagesSent,
                repliesReceived,
                positiveReplies,
                meetingsBooked,
                replyRate: replyRate.toFixed(1),
                positiveReplyRate: positiveReplyRate.toFixed(1),
                meetingBookingRate: meetingBookingRate.toFixed(1),
                costPerMeeting: costPerMeeting.toFixed(2),
            },
            roi: {
                monthlyAgentCost,
                humanSalaryCost: humanSalaryCost.toFixed(0),
                monthlySavings: monthlySavings.toFixed(0),
                roi,
                annualSavings: (monthlySavings * 12).toFixed(0),
            },
            chartData,
            channelBreakdown: Object.values(eventsByChannel),
            period: parseInt(period),
        });
    } catch (error: any) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
