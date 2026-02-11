"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    Rocket,
    Briefcase,
    Video,
    ShoppingBag,
    DollarSign,
    Search,
    Filter,
    Check,
    Loader2,
    Sparkles,
    TrendingUp,
    Users,
    Calendar,
    Zap,
} from "lucide-react";
import { agentTemplates, type AgentTemplate } from "@/lib/data/agent-templates";

const categoryIcons: Record<string, any> = {
    SaaS: Rocket,
    Agency: Briefcase,
    Creator: Video,
    Ecommerce: ShoppingBag,
    Fundraising: DollarSign,
    Sales: TrendingUp,
    "Real Estate": "🏠",
    Coaching: "🎯",
    Marketing: Zap,
    Content: "📧",
    Mobile: "📱",
    Consulting: "💡",
    Events: "🎫",
    Freelance: "✍️",
    Community: Users,
    Education: "🎓",
    Partnerships: "🤜🤛",
    PR: "📰",
};

export default function AgentTemplatesPage() {
    const { user } = useUser();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [deployingTemplate, setDeployingTemplate] = useState<string | null>(null);

    // Get unique categories
    const categories = ["all", ...Array.from(new Set(agentTemplates.map((t) => t.category)))];

    // Filter templates
    const filteredTemplates = agentTemplates.filter((template) => {
        const matchesSearch =
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === "all" || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Deploy template
    const handleUseTemplate = async (template: AgentTemplate) => {
        if (!user) return;

        setDeployingTemplate(template.id);

        try {
            const response = await fetch("/api/templates/deploy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    templateId: template.id,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to deploy template");
            }

            const data = await response.json();

            // Redirect to dashboard
            router.push("/app/dashboard");
        } catch (error) {
            console.error("Error deploying template:", error);
            alert("Failed to deploy template. Please try again.");
        } finally {
            setDeployingTemplate(null);
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto p-8 space-y-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
                        <Sparkles className="h-4 w-4" />
                        20 Pre-Made Agent Teams
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                        Launch Your AI Team in{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            2 Minutes
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Choose a template, connect LinkedIn/Email, and start generating leads automatically
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category
                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                                    }`}
                            >
                                {category === "all" ? "All Templates" : category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Top 5 Viral Templates */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            🔥 Top 5 Viral Templates
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {agentTemplates.slice(0, 5).map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                isDeploying={deployingTemplate === template.id}
                                onDeploy={() => handleUseTemplate(template)}
                                featured
                            />
                        ))}
                    </div>
                </div>

                {/* All Templates */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                        All Templates ({filteredTemplates.length})
                    </h2>

                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-600 dark:text-slate-400">
                                No templates found. Try a different search or category.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.slice(5).map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    isDeploying={deployingTemplate === template.id}
                                    onDeploy={() => handleUseTemplate(template)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface TemplateCardProps {
    template: AgentTemplate;
    isDeploying: boolean;
    onDeploy: () => void;
    featured?: boolean;
}

function TemplateCard({ template, isDeploying, onDeploy, featured }: TemplateCardProps) {
    const [showAgents, setShowAgents] = useState(false);

    return (
        <div
            className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-2xl transition-all ${featured ? "shadow-xl" : "shadow-lg"
                }`}
        >
            {/* Header */}
            <div className={`bg-gradient-to-r ${template.gradient} p-6 text-white`}>
                <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{template.icon}</div>
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
                        {template.category}
                    </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                <p className="text-white/90 text-sm">{template.description}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg Leads</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {template.metrics.avgLeads}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Meetings</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {template.metrics.avgMeetings}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Revenue</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {template.metrics.avgRevenue}
                    </p>
                </div>
            </div>

            {/* Agents */}
            <div className="p-6 space-y-3">
                <button
                    onClick={() => setShowAgents(!showAgents)}
                    className="w-full flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <span>{template.agents.length} Agents Included</span>
                    <span className="text-blue-500">{showAgents ? "Hide" : "Show"}</span>
                </button>

                {showAgents && (
                    <div className="space-y-2">
                        {template.agents.map((agent, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                            >
                                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {agent.name}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                                        {agent.goal}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                            {agent.channel}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {agent.dailyLimit}/day
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="p-6 pt-0">
                <button
                    onClick={onDeploy}
                    disabled={isDeploying}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDeploying ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Deploying...
                        </>
                    ) : (
                        <>
                            <Zap className="h-5 w-5" />
                            Use This Team
                        </>
                    )}
                </button>
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Ready in 2 minutes • Just connect LinkedIn/Email
                </p>
            </div>
        </div>
    );
}
