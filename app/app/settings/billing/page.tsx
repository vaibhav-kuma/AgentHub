import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
    CreditCard,
    CheckCircle2,
    Zap,
    History,
    ExternalLink,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeButton, ManageSubscriptionButton } from "@/components/billing/billing-buttons";

export default async function BillingPage() {
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/sign-in");

    const user = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
    });

    if (!user) return <div>User not found.</div>;

    const plans = [
        {
            name: "Free",
            price: "$0",
            description: "Perfect for exploring AgentHub.",
            features: ["2 Agents", "Limited Scrapes", "Basic Analytics"],
            isCurrent: user.plan === "free" || !user.plan,
            priceId: "",
        },
        {
            name: "Pro",
            price: "$49",
            description: "Scale your outreach with advanced agents.",
            features: ["Unlimited Agents", "Unlimited Scrapes", "Real-time Sync", "Team Support"],
            isCurrent: user.plan === "pro",
            popular: true,
            priceId: "price_pro_monthly",
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "For agencies and large scale businesses.",
            features: ["Dedicated Support", "Custom Workflows", "API Access", "SSO"],
            isCurrent: user.plan === "enterprise",
            priceId: "price_enterprise",
        },
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl font-bold">Billing & Subscription</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage your plan, payment methods, and billing history.
                </p>
            </div>

            {/* Current Status */}
            <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Current Plan</p>
                            <h2 className="text-2xl font-bold capitalize">{user.plan || "Free"} Plan</h2>
                        </div>
                        <div className="ml-auto">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                ${user.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'}`}>
                                {user.subscriptionStatus || "Active"}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        Your next billing date is January 25, 2026. Your currently subscribed to the {user.plan || "free"} plan which includes core automation features.
                    </p>
                    <div className="flex gap-3">
                        <ManageSubscriptionButton />
                        <Button variant="outline">View Invoices</Button>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 rounded-2xl text-white">
                    <div className="flex flex-col h-full">
                        <div className="mb-4">
                            <CreditCard className="h-8 w-8 text-blue-100 mb-4" />
                            <h3 className="font-bold text-lg">Payment Method</h3>
                            <p className="text-sm text-blue-100 mt-1">Visa ending in 4242</p>
                        </div>
                        <div className="mt-auto">
                            <Button variant="ghost" className="text-white hover:bg-white/10 w-full justify-between px-0">
                                <span>Update Method</span>
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Selector */}
            <div className="mb-12">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    Available Plans
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`relative p-8 rounded-2xl border transition-all
                            ${plan.isCurrent ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'}
                            ${plan.popular ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}`}>
                            {plan.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                                    Most Popular
                                </span>
                            )}
                            <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-3xl font-black">{plan.price}</span>
                                <span className="text-slate-500 text-sm">{plan.name !== 'Enterprise' && '/month'}</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-6">{plan.description}</p>
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <UpgradeButton
                                priceId={plan.priceId}
                                planName={plan.name}
                                currentPlan={user.plan || 'free'}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Billing History */}
            <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <History className="h-5 w-5 text-purple-500" />
                    Billing History
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Invoice</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {[
                                { id: "INV-001", status: "Paid", amount: "$49.00", date: "Dec 25, 2025" },
                                { id: "INV-002", status: "Paid", amount: "$49.00", date: "Nov 25, 2025" },
                                { id: "INV-003", status: "Paid", amount: "$49.00", date: "Oct 25, 2025" },
                            ].map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium">{inv.id}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{inv.amount}</td>
                                    <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                                    <td className="px-6 py-4 text-right underline text-blue-500 hover:text-blue-600 cursor-pointer">
                                        Download
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
