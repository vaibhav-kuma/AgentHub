"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    Check,
    Zap,
    Sparkles,
    Crown,
    Rocket,
    Instagram,
    Infinity,
    Loader2,
    TrendingUp,
} from "lucide-react";

const plans = [
    {
        id: "starter",
        name: "Starter",
        price: 99,
        priceId: "price_starter_monthly",
        icon: Rocket,
        gradient: "from-blue-500 to-cyan-500",
        description: "Perfect for solopreneurs testing AI outreach",
        features: [
            "3 AI agents",
            "LinkedIn + Email + Twitter",
            "1,000 contacts/month",
            "Basic analytics",
            "Email support",
        ],
        limits: {
            agents: 3,
            contacts: 1000,
            channels: ["linkedin", "email", "twitter"],
        },
    },
    {
        id: "pro",
        name: "Pro",
        price: 299,
        priceId: "price_pro_monthly",
        icon: Zap,
        gradient: "from-purple-500 to-pink-500",
        description: "For growing teams scaling outreach",
        popular: true,
        features: [
            "10 AI agents",
            "All channels + Instagram",
            "10,000 contacts/month",
            "Advanced analytics & ROI",
            "Zapier/Make integrations",
            "Priority support",
            "Custom templates",
        ],
        limits: {
            agents: 10,
            contacts: 10000,
            channels: ["linkedin", "email", "twitter", "instagram"],
        },
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: 999,
        priceId: "price_enterprise_monthly",
        icon: Crown,
        gradient: "from-orange-500 to-red-500",
        description: "For agencies running at scale",
        features: [
            "Unlimited agents",
            "All channels",
            "Unlimited contacts",
            "White-label solution",
            "Custom domain",
            "Dedicated account manager",
            "Custom integrations",
            "99.9% SLA",
        ],
        limits: {
            agents: -1, // unlimited
            contacts: -1,
            channels: ["linkedin", "email", "twitter", "instagram", "all"],
        },
    },
];

export default function PricingPage() {
    const { user } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

    const handleSubscribe = async (priceId: string, planId: string) => {
        if (!user) {
            router.push("/sign-in");
            return;
        }

        setLoading(planId);

        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceId,
                    planId,
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
            alert("Failed to start checkout. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
                        <Sparkles className="h-4 w-4" />
                        Simple, Transparent Pricing
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
                        Choose Your{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Growth Plan
                        </span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                        Start generating leads on autopilot. Cancel anytime.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === "monthly"
                                    ? "bg-blue-500 text-white shadow-lg"
                                    : "text-slate-600 dark:text-slate-400"
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("annual")}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === "annual"
                                    ? "bg-blue-500 text-white shadow-lg"
                                    : "text-slate-600 dark:text-slate-400"
                                }`}
                        >
                            Annual
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-xs">
                                Save 20%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Lifetime Deal Banner */}
                <div className="mb-12">
                    <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Crown className="h-6 w-6" />
                                    <span className="text-sm font-semibold uppercase tracking-wide">
                                        🔥 Limited Time Offer
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold mb-2">
                                    Lifetime Deal - $499 One-Time
                                </h3>
                                <p className="text-white/90 mb-4">
                                    Get unlimited access forever. Only for the first 100 users.
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm">
                                        <p className="text-sm text-white/80">Spots Remaining</p>
                                        <p className="text-2xl font-bold">47/100</p>
                                    </div>
                                    <div className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm">
                                        <p className="text-sm text-white/80">You Save</p>
                                        <p className="text-2xl font-bold">$3,089/year</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push("/claim-lifetime")}
                                className="px-8 py-4 rounded-xl bg-white text-orange-600 font-bold text-lg hover:bg-slate-100 transition-all shadow-2xl hover:scale-105"
                            >
                                Claim Lifetime Deal →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const price = billingCycle === "annual" ? Math.floor(plan.price * 0.8) : plan.price;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-white dark:bg-slate-900 rounded-2xl border-2 overflow-hidden transition-all hover:scale-105 ${plan.popular
                                        ? "border-blue-500 shadow-2xl shadow-blue-500/20"
                                        : "border-slate-200 dark:border-slate-800 shadow-xl"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-bl-lg">
                                        MOST POPULAR
                                    </div>
                                )}

                                {/* Header */}
                                <div className={`bg-gradient-to-r ${plan.gradient} p-8 text-white`}>
                                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-white/90 text-sm mb-6">{plan.description}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold">${price}</span>
                                        <span className="text-white/80">/month</span>
                                    </div>
                                    {billingCycle === "annual" && (
                                        <p className="text-white/70 text-sm mt-2">
                                            Billed ${price * 12}/year
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                <div className="p-8">
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                </div>
                                                <span className="text-slate-700 dark:text-slate-300 text-sm">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleSubscribe(plan.priceId, plan.id)}
                                        disabled={loading === plan.id}
                                        className={`w-full py-4 rounded-xl font-semibold transition-all ${plan.popular
                                                ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                                            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                                    >
                                        {loading === plan.id ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>Get Started</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Can I cancel anytime?",
                                a: "Yes! Cancel anytime with one click. No questions asked.",
                            },
                            {
                                q: "What happens to my agents if I downgrade?",
                                a: "Your agents will be paused but not deleted. Upgrade anytime to reactivate them.",
                            },
                            {
                                q: "Do you offer refunds?",
                                a: "Yes, we offer a 14-day money-back guarantee on all plans.",
                            },
                            {
                                q: "Can I upgrade or downgrade later?",
                                a: "Absolutely! Change your plan anytime. You'll be charged the prorated difference.",
                            },
                        ].map((faq, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800"
                            >
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                    {faq.q}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-16 text-center">
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Trusted by 1,000+ businesses worldwide
                    </p>
                    <div className="flex items-center justify-center gap-8 flex-wrap opacity-50">
                        <div className="text-2xl font-bold text-slate-400">Stripe</div>
                        <div className="text-2xl font-bold text-slate-400">Secure</div>
                        <div className="text-2xl font-bold text-slate-400">256-bit SSL</div>
                        <div className="text-2xl font-bold text-slate-400">GDPR</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
