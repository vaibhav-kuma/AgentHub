"use client";

import { Bot, Headphones, FileText, Search, Calendar, Users } from "lucide-react";

const agentConfig = {
    "SDR": {
        name: "SDR Agent",
        description: "Outbound sales & lead generation",
        icon: Users,
        color: "from-blue-500 to-cyan-500",
    },
    "Support": {
        name: "Support Agent",
        description: "Customer support & ticketing",
        icon: Headphones,
        color: "from-purple-500 to-pink-500",
    },
    "Content Writer": {
        name: "Content Writer",
        description: "Blog posts & marketing copy",
        icon: FileText,
        color: "from-green-500 to-emerald-500",
    },
    "Lead Researcher": {
        name: "Lead Researcher",
        description: "Market research & analysis",
        icon: Search,
        color: "from-orange-500 to-red-500",
    },
    "Meeting Booker": {
        name: "Meeting Booker",
        description: "Schedule & coordinate meetings",
        icon: Calendar,
        color: "from-indigo-500 to-purple-500",
    },
    "Recruiter": {
        name: "Recruiter",
        description: "Candidate sourcing & screening",
        icon: Bot,
        color: "from-yellow-500 to-orange-500",
    },
};

interface AgentCardProps {
    agentType: string;
    isDragging?: boolean;
    isOnCanvas?: boolean;
    isSelected?: boolean;
    isActive?: boolean;
    onToggle?: (active: boolean) => void;
}

export function AgentCard({ agentType, isDragging, isOnCanvas, isSelected, isActive, onToggle }: AgentCardProps) {
    const config = agentConfig[agentType as keyof typeof agentConfig] || {
        name: agentType,
        description: "AI Agent",
        icon: Bot,
        color: "from-slate-500 to-slate-600",
    };

    const Icon = config.icon;

    if (isOnCanvas) {
        return (
            <div
                className={`group relative w-48 p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg"
                    }`}
            >
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center mb-3`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                    {config.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {config.description}
                </p>

                {/* Status Indicator / Toggle */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle?.(!isActive);
                    }}
                    className={`absolute top-2 right-2 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 transition-all flex items-center justify-center shadow-lg ${isActive ? "bg-green-500 scale-110" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                    title={isActive ? "Deactivate Agent" : "Activate Agent"}
                >
                    <div className={`h-1.5 w-1.5 rounded-full bg-white ${isActive ? "animate-pulse" : ""}`} />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all ${isDragging ? "shadow-xl scale-105" : ""
                }`}
        >
            <div className="flex items-start gap-3">
                <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                        {config.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {config.description}
                    </p>
                </div>
            </div>
        </div>
    );
}
