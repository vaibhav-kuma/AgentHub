"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bot, Sparkles, Zap, Shield, Users, ChevronRight } from "lucide-react";

export function MarketingPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Add to waitlist
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">AgentHub</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/sign-in"
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/sign-up"
                            className="px-4 py-2 rounded-lg bg-white text-slate-950 text-sm font-medium hover:bg-slate-100 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-3xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8">
                            <Sparkles className="h-4 w-4" />
                            <span>Powered by Claude 3.5 Sonnet</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                            Build Your AI
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Agent Dream Team
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                            Create, orchestrate, and deploy AI agents that work together seamlessly.
                            The future of productivity is here.
                        </p>

                        {/* Waitlist Form */}
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 group"
                                >
                                    Join Waitlist
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        ) : (
                            <div className="max-w-md mx-auto mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                <p className="text-green-400">✓ You're on the list! We'll be in touch soon.</p>
                            </div>
                        )}

                        <p className="text-sm text-slate-500">
                            No credit card required • Free tier available
                        </p>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto">
                        <FeatureCard
                            icon={<Zap className="h-6 w-6" />}
                            title="Lightning Fast"
                            description="Deploy AI agents in seconds, not hours. Built for speed and efficiency."
                        />
                        <FeatureCard
                            icon={<Shield className="h-6 w-6" />}
                            title="Enterprise Ready"
                            description="Bank-level security with SOC 2 compliance and end-to-end encryption."
                        />
                        <FeatureCard
                            icon={<Users className="h-6 w-6" />}
                            title="Team Collaboration"
                            description="Work together with your team to build and manage agent workflows."
                        />
                    </div>

                    {/* Social Proof */}
                    <div className="mt-24 text-center">
                        <p className="text-sm text-slate-500 mb-6">Trusted by teams at</p>
                        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
                            {["Acme Corp", "TechStart", "InnovateLab", "FutureAI", "CloudScale"].map((company) => (
                                <div key={company} className="text-slate-600 font-semibold text-lg">
                                    {company}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-20 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to supercharge your workflow?
                    </h2>
                    <p className="text-xl text-slate-400 mb-8">
                        Join thousands of teams already using AgentHub
                    </p>
                    <Link
                        href="/sign-up"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all group"
                    >
                        Get Started Free
                        <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-slate-400 text-sm">© 2025 AgentHub. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-400">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Docs</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
