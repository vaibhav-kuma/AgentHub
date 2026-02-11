import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
});

// POST - Create Stripe Checkout Session
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { priceId, planId } = body;

        if (!priceId || !planId) {
            return NextResponse.json(
                { error: "Price ID and Plan ID required" },
                { status: 400 }
            );
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: planId === "lifetime" ? "payment" : "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
            metadata: {
                userId,
                planId,
            },
            client_reference_id: userId,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
