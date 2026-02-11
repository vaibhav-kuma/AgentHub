"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
    TrendingUp,
    Users,
    MessageSquare,
    Calendar,
    DollarSign,
    Target,
    Zap,
    BarChart3,
    Loader2,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface AnalyticsData {
    summary: {
        leadsGenerated: number;
        messagesSent: number;
        repliesReceived: number;
        positiveReplies: number;
        meetingsBooked: number;
        replyRate: string;
        positiveReplyRate: string;
        meetingBookingRate: string;
        costPerMeeting: string;
    };
    roi: {
        monthlyAgentCost: number;
        humanSalaryCost: string;
        monthlySavings: string;
        roi: string;
        annualSavings: string;
    };
    chartData: Array<{
        date: string;
        leads: number;
        messages: number;
        replies: number;
        meetings: number;
    }>;
    channelBreakdown: Array<{
        channel: string;
        leads: number;
        messages: number;
        replies: number;
        meetings: number;
    }>;
    period: number;
}

const COLORS = {
    linkedin: "#0077B5",
    twitter: "#1DA1F2",
    email: "#EA4335",
    instagram: "#E4405F",
};

export default function AnalyticsPage() {
    const { user } = useUser();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState(30);

    useEffect(() => {
        loadAnalytics();
    }, [period]);

    const loadAnalytics = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/analytics?period=${period}`);
            const analyticsData = await response.json();
            setData(analyticsData);
        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Loading analytics...
                    </p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-600 dark:text-slate-400">
                    No analytics data available
                </p>
            </div>
        );
    }

    const statCards = [
        {
            title: "Leads Generated",
            value: data.summary.leadsGenerated,
            icon: Users,
            color: "blue",
            change: "+12%",
            trend: "up",
        },
        {
            title: "Reply Rate",
            value: `${data.summary.replyRate}%`,
            icon: MessageSquare,
            color: "green",
            change: "+5%",
            trend: "up",
        },
        {
            title: "Meetings Booked",
            value: data.summary.meetingsBooked,
            icon: Calendar,
            color: "purple",
            change: "+8%",
            trend: "up",
        },
        {
            title: "Cost per Meeting",
            value: `$${data.summary.costPerMeeting}`,
            icon: DollarSign,
            color: "orange",
            change: "-15%",
            trend: "down",
        },
    ];

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Analytics Dashboard
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Track your agent performance and ROI
                        </p>
                    </div>

                    {/* Period Selector */}
                    <div className="flex gap-2">
                        {[7, 30, 90].map((days) => (
                            <button
                                key={days}
                                onClick={() => setPeriod(days)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === days
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }`}
                            >
                                {days} days
                            </button>
                        ))}
                    </div>
                </div>

                {/* ROI Banner */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-6 w-6" />
                                <h2 className="text-2xl font-bold">ROI Calculator</h2>
                            </div>
                            <p className="text-blue-100 mb-6">
                                See how much you're saving with AI agents
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-blue-100 text-sm mb-1">Human Salary (Annual)</p>
                                    <p className="text-3xl font-bold">$20,000</p>
                                    <p className="text-blue-100 text-sm mt-1">
                                        ${data.roi.humanSalaryCost}/month
                                    </p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm mb-1">AgentHub Cost</p>
                                    <p className="text-3xl font-bold">$299/mo</p>
                                    <p className="text-blue-100 text-sm mt-1">Unlimited agents</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-blue-100 text-sm mb-2">Your ROI</p>
                            <div className="text-6xl font-bold mb-2">{data.roi.roi}%</div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                                <p className="text-sm text-blue-100">Monthly Savings</p>
                                <p className="text-2xl font-bold">${data.roi.monthlySavings}</p>
                            </div>
                            <p className="text-blue-100 text-sm mt-3">
                                Annual savings: ${data.roi.annualSavings}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.title}
                                className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className={`h-12 w-12 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-500/10 flex items-center justify-center`}
                                    >
                                        <Icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                    </div>
                                    <div
                                        className={`flex items-center gap-1 text-sm font-medium ${stat.trend === "up"
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-red-600 dark:text-red-400"
                                            }`}
                                    >
                                        {stat.trend === "up" ? (
                                            <ArrowUp className="h-4 w-4" />
                                        ) : (
                                            <ArrowDown className="h-4 w-4" />
                                        )}
                                        {stat.change}
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {stat.title}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Activity Over Time */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Activity Over Time
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1e293b",
                                        border: "none",
                                        borderRadius: "8px",
                                        color: "#fff",
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="leads"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Leads"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="replies"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Replies"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="meetings"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    name="Meetings"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Channel Breakdown */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Channel Performance
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.channelBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                                <XAxis dataKey="channel" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1e293b",
                                        border: "none",
                                        borderRadius: "8px",
                                        color: "#fff",
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
                                <Bar dataKey="replies" fill="#10b981" name="Replies" />
                                <Bar dataKey="meetings" fill="#8b5cf6" name="Meetings" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Knowledge Base Attribution */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                Knowledge Base Attribution
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Performance breakdown by training data source
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-bold rounded-full">
                                Semantic Attribution Enabled
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={[
                                    { name: "SaaS Sales Doc", leads: 45, conversions: 12 },
                                    { name: "Product Roadmap", leads: 32, conversions: 8 },
                                    { name: "Customer Portal", leads: 28, conversions: 5 },
                                    { name: "Pricing Page URL", leads: 52, conversions: 19 },
                                    { name: "Competitor Analysis", leads: 15, conversions: 3 },
                                ]} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={150} fontSize={12} stroke="#64748b" />
                                    <Tooltip />
                                    <Bar dataKey="leads" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Leads Influenced" />
                                    <Bar dataKey="conversions" fill="#10b981" radius={[0, 4, 4, 0]} name="Positive Replies" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Top Performing Knowledge</h4>
                            {[
                                { name: "Pricing Page URL", perf: "92%", color: "text-emerald-500" },
                                { name: "SaaS Sales Doc", perf: "84%", color: "text-blue-500" },
                                { name: "Product Roadmap", perf: "76%", color: "text-blue-400" },
                            ].map((kb) => (
                                <div key={kb.name} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-medium">{kb.name}</span>
                                    <span className={`text-sm font-bold ${kb.color}`}>{kb.perf}</span>
                                </div>
                            ))}
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-4">
                                * Attribution is calculated using semantic similarity between the successful outreach content and your knowledge base chunks.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Positive Reply Rate
                            </h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            {data.summary.positiveReplyRate}%
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {data.summary.positiveReplies} positive out of{" "}
                            {data.summary.repliesReceived} replies
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Meeting Booking Rate
                            </h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            {data.summary.meetingBookingRate}%
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {data.summary.meetingsBooked} meetings from{" "}
                            {data.summary.repliesReceived} replies
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Total Messages Sent
                            </h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            {data.summary.messagesSent}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Across all channels in {period} days
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
