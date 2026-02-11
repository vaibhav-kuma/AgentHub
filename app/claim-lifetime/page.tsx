"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    Crown,
    Check,
    Zap,
    Infinity,
    TrendingUp,
    Users,
    Sparkles,
    Loader2,
    Lock,
    Clock,
} from "lucide-react";

export default function ClaimLifetimePage() {
    const { user } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [spotsRemaining, setSpotsRemaining] = useState(47);
    const [timeLeft, setTimeLeft] = useState({
        hours: 23,
        minutes: 45,
        seconds: 30,
    });

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
                } else if (prev.hours > 0) {
                    return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Fetch spots remaining
    useEffect(() => {
        const fetchSpots = async () => {
            try {
                const response = await fetch("/api/lifetime/spots");
                const data = await response.json();
                setSpotsRemaining(data.remaining);
            } catch (error) {
                console.error("Error fetching spots:", error);
            }
        };

        fetchSpots();
        const interval = setInterval(fetchSpots, 10000); // Update every 10s

        return () => clearInterval(interval);
    }, []);

    const handleClaim = async () => {
        if (!user) {
            router.push("/sign-in");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceId: "price_lifetime_deal",
                    planId: "lifetime",
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else if (data.error) {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
            alert("Failed to start checkout. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (spotsRemaining <= 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                        <Lock className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                        Lifetime Deal Sold Out
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        All 100 lifetime spots have been claimed. Check out our monthly plans instead!
                    </p>
                    <button
                        onClick={() => router.push("/pricing")}
                        className="px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all"
                    >
                        View Pricing Plans
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Urgency Banner */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white text-center mb-8 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="h-5 w-5 animate-pulse" />
                        <span className="font-semibold">OFFER EXPIRES IN:</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-3xl font-bold">
                        <div>
                            <span>{String(timeLeft.hours).padStart(2, "0")}</span>
                            <span className="text-sm block text-white/80">Hours</span>
                        </div>
                        <span>:</span>
                        <div>
                            <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
                            <span className="text-sm block text-white/80">Minutes</span>
                        </div>
                        <span>:</span>
                        <div>
                            <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
                            <span className="text-sm block text-white/80">Seconds</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Offer Details */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 text-sm font-medium mb-4">
                            <Crown className="h-4 w-4" />
                            Limited to First 100 Users Only
                        </div>

                        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
                            Lifetime Access
                            <br />
                            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                                $499 One-Time
                            </span>
                        </h1>

                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                            Pay once, use forever. No monthly fees. Ever.
                        </p>

                        {/* Spots Remaining */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-orange-500 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    Spots Remaining
                                </span>
                                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                    {spotsRemaining}/100
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all duration-500"
                                    style={{ width: `${(spotsRemaining / 100) * 100}%` }}
                                />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                {100 - spotsRemaining} users have already claimed their spot
                            </p>
                        </div>

                        {/* What's Included */}
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            What's Included
                        </h3>
                        <ul className="space-y-3 mb-8">
                            {[
                                "Unlimited AI agents",
                                "All channels (LinkedIn, Email, Twitter, Instagram)",
                                "Unlimited contacts",
                                "White-label solution",
                                "Custom domain",
                                "Priority support forever",
                                "All future updates included",
                                "No monthly fees ever",
                            ].map((feature, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Social Proof */}
                        <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-6 border border-blue-200 dark:border-blue-500/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white dark:border-slate-900"
                                        />
                                    ))}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        53 users claimed in the last 24 hours
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Join them before it's too late
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Pricing Comparison */}
                    <div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-8 shadow-2xl sticky top-8">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                                Compare Plans
                            </h3>

                            {/* Lifetime vs Monthly */}
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                    <div>
                                        <p className="font-semibold">Lifetime Deal</p>
                                        <p className="text-sm text-white/80">Pay once, use forever</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold">$499</p>
                                        <p className="text-sm text-white/80">One-time</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            Enterprise Plan
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Same features, monthly
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                            $999
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">/month</p>
                                    </div>
                                </div>
                            </div>

                            {/* Savings Breakdown */}
                            <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-6 border border-green-200 dark:border-green-500/20 mb-8">
                                <h4 className="font-semibold text-green-900 dark:text-green-300 mb-4">
                                    💰 Your Savings
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                                        <span>Year 1:</span>
                                        <span className="font-semibold">Save $11,489</span>
                                    </div>
                                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                                        <span>Year 2:</span>
                                        <span className="font-semibold">Save $11,988</span>
                                    </div>
                                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                                        <span>Year 3:</span>
                                        <span className="font-semibold">Save $11,988</span>
                                    </div>
                                    <div className="border-t border-green-200 dark:border-green-500/20 pt-2 mt-2">
                                        <div className="flex justify-between text-green-900 dark:text-green-300 font-bold">
                                            <span>Total 3-Year Savings:</span>
                                            <span>$35,465</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={handleClaim}
                                disabled={loading}
                                className="w-full py-5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Crown className="h-6 w-6" />
                                        Claim Lifetime Access Now
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                                🔒 Secure payment via Stripe • 14-day money-back guarantee
                            </p>
                        </div>
                    </div>
                </div>

                {/* Testimonials */}
                <div className="mt-16">
                    <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-8">
                        What Lifetime Members Say
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                name: "Sarah Chen",
                                role: "SaaS Founder",
                                text: "Best investment I've made. Already generated $50K in revenue from the leads.",
                            },
                            {
                                name: "Mike Rodriguez",
                                role: "Agency Owner",
                                text: "Paid for itself in the first month. Now I'm saving $999/month forever.",
                            },
                            {
                                name: "Emily Watson",
                                role: "Creator",
                                text: "Landed 3 sponsorship deals worth $30K total. This is a no-brainer.",
                            },
                        ].map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800"
                            >
                                <p className="text-slate-700 dark:text-slate-300 mb-4">
                                    "{testimonial.text}"
                                </p>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {testimonial.name}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {testimonial.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
