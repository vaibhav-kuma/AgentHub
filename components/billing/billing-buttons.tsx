'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface UpgradeButtonProps {
    priceId: string;
    planName: string;
    currentPlan: string;
}

export function UpgradeButton({ priceId, planName, currentPlan }: UpgradeButtonProps) {
    const [loading, setLoading] = useState(false);
    const isCurrent = currentPlan?.toLowerCase() === planName.toLowerCase();

    const handleUpgrade = async () => {
        if (isCurrent) return;
        setLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, planId: planName.toLowerCase() })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Error: " + (data.error || "Failed to start checkout"));
            }
        } catch (e) {
            console.error(e);
            alert("Upgrade failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleUpgrade}
            disabled={isCurrent || loading}
            className={`w-full py-6 rounded-xl font-bold transition-all
                ${isCurrent ? 'bg-slate-100 text-slate-500 cursor-default' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}
        >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : (isCurrent ? 'Current Plan' : `Upgrade to ${planName}`)}
        </Button>
    );
}

export function ManageSubscriptionButton() {
    const [loading, setLoading] = useState(false);

    const handleManage = async () => {
        setLoading(true);
        // Placeholder for portal redirect
        alert("Redirecting to Stripe Customer Portal...");
        // In real impl:
        // const res = await fetch('/api/stripe/portal', { method: 'POST' });
        // const data = await res.json();
        // if(data.url) window.location.href = data.url;
        setLoading(false);
    };

    return (
        <Button onClick={handleManage} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Manage Subscription"}
        </Button>
    );
}
