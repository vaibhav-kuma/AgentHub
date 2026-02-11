"use client";

import { useDraggable } from "@dnd-kit/core";
import { AgentCard } from "./agent-card";
import { Sparkles } from "lucide-react";

const agentTypes = [
    { id: "SDR", name: "SDR Agent", description: "Outbound sales & lead generation", color: "from-blue-500 to-cyan-500" },
    { id: "Support", name: "Support Agent", description: "Customer support & ticketing", color: "from-purple-500 to-pink-500" },
    { id: "Content Writer", name: "Content Writer", description: "Blog posts & marketing copy", color: "from-green-500 to-emerald-500" },
    { id: "Lead Researcher", name: "Lead Researcher", description: "Market research & analysis", color: "from-orange-500 to-red-500" },
    { id: "Meeting Booker", name: "Meeting Booker", description: "Schedule & coordinate meetings", color: "from-indigo-500 to-purple-500" },
    { id: "Recruiter", name: "Recruiter", description: "Candidate sourcing & screening", color: "from-yellow-500 to-orange-500" },
];

export function AgentSidebar() {
    return (
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Agent Templates
                    </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Drag agents to the canvas to get started
                </p>
            </div>

            {/* Agent Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {agentTypes.map((agent) => (
                    <DraggableAgentCard key={agent.id} agent={agent} />
                ))}
            </div>

            {/* Footer Tip */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    💡 <span className="font-medium">Tip:</span> Click on any agent node to configure its goal, tone, and knowledge base.
                </p>
            </div>
        </div>
    );
}

function DraggableAgentCard({ agent }: { agent: typeof agentTypes[0] }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `agent-${agent.id}`,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50" : ""}`}
        >
            <AgentCard agentType={agent.id} />
        </div>
    );
}
