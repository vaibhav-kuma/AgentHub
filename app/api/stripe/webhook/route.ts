import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// POST - Handle Stripe Webhooks
export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("stripe-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "No signature provided" },
                { status: 400 }
            );
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error("Webhook signature verification failed:", err.message);
            return NextResponse.json(
                { error: `Webhook Error: ${err.message}` },
                { status: 400 }
            );
        }

        // Handle the event
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                console.log("Payment succeeded for invoice:", invoice.id);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                console.log("Payment failed for invoice:", invoice.id);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook handler error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId || session.client_reference_id;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
        console.error("Missing userId or planId in session metadata");
        return;
    }

    // Determine plan limits
    const planLimits = getPlanLimits(planId);

    // Update user subscription in database
    await db
        .update(users)
        .set({
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            stripePriceId: session.metadata?.priceId,
            plan: planId,
            planLimits: planLimits,
            subscriptionStatus: "active",
            updatedAt: new Date(),
        })
        .where(eq(users.clerkId, userId));

    console.log(`Subscription activated for user ${userId} on plan ${planId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;

    if (!userId) {
        console.error("Missing userId in subscription metadata");
        return;
    }

    const status = subscription.status;

    await db
        .update(users)
        .set({
            subscriptionStatus: status,
            updatedAt: new Date(),
        })
        .where(eq(users.clerkId, userId));

    console.log(`Subscription updated for user ${userId}: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;

    if (!userId) {
        console.error("Missing userId in subscription metadata");
        return;
    }

    // Downgrade to free plan
    await db
        .update(users)
        .set({
            plan: "free",
            planLimits: getPlanLimits("free"),
            subscriptionStatus: "canceled",
            updatedAt: new Date(),
        })
        .where(eq(users.clerkId, userId));

    console.log(`Subscription canceled for user ${userId}`);
}

function getPlanLimits(planId: string) {
    const limits: Record<string, any> = {
        free: {
            agents: 1,
            contacts: 100,
            channels: ["linkedin"],
        },
        starter: {
            agents: 3,
            contacts: 1000,
            channels: ["linkedin", "email", "twitter"],
        },
        pro: {
            agents: 10,
            contacts: 10000,
            channels: ["linkedin", "email", "twitter", "instagram"],
        },
        enterprise: {
            agents: -1, // unlimited
            contacts: -1,
            channels: ["linkedin", "email", "twitter", "instagram", "all"],
            whiteLabel: true,
        },
        lifetime: {
            agents: -1,
            contacts: -1,
            channels: ["linkedin", "email", "twitter", "instagram", "all"],
            whiteLabel: true,
            lifetime: true,
        },
    };

    return limits[planId] || limits.free;
}
