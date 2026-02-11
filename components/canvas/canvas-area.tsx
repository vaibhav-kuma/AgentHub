"use client";

import { useDroppable, useDraggable } from "@dnd-kit/core";
import { AgentCard } from "./agent-card";
import { Trash2, Save, Grid3x3 } from "lucide-react";
import type { CanvasNode } from "@/app/app/dashboard/page";

interface CanvasAreaProps {
    nodes: CanvasNode[];
    onNodeClick: (node: CanvasNode) => void;
    selectedNodeId?: string;
    onDeleteNode: (nodeId: string) => void;
    onToggleNode: (nodeId: string, isActive: boolean) => void;
    isSaving: boolean;
}

export function CanvasArea({ nodes, onNodeClick, selectedNodeId, onDeleteNode, onToggleNode, isSaving }: CanvasAreaProps) {
    const { setNodeRef } = useDroppable({
        id: "canvas",
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Canvas Header */}
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <Grid3x3 className="h-5 w-5 text-slate-400" />
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Agent Canvas
                    </h1>
                    <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {nodes.length} {nodes.length === 1 ? "agent" : "agents"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {isSaving && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Save className="h-4 w-4 animate-pulse" />
                            <span>Saving...</span>
                        </div>
                    )}
                    {!isSaving && nodes.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <Save className="h-4 w-4" />
                            <span>Saved</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={setNodeRef}
                id="canvas"
                className="flex-1 relative overflow-auto bg-slate-50 dark:bg-slate-950"
                style={{
                    backgroundImage: `
            radial-gradient(circle, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
            radial-gradient(circle, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
          `,
                    backgroundSize: "24px 24px",
                    backgroundPosition: "0 0, 12px 12px",
                }}
            >
                {/* Empty State */}
                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                                <Grid3x3 className="h-8 w-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                Your canvas is empty
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Drag an agent from the left sidebar to get started building your AI team
                            </p>
                        </div>
                    </div>
                )}

                {/* Nodes */}
                {nodes.map((node) => (
                    <CanvasNode
                        key={node.id}
                        node={node}
                        isSelected={selectedNodeId === node.id}
                        onClick={() => onNodeClick(node)}
                        onDelete={() => onDeleteNode(node.id)}
                        onToggle={(active) => onToggleNode(node.id, active)}
                    />
                ))}
            </div>
        </div>
    );
}

function CanvasNode({
    node,
    isSelected,
    onClick,
    onDelete,
    onToggle,
}: {
    node: CanvasNode;
    isSelected: boolean;
    onClick: () => void;
    onDelete: () => void;
    onToggle: (active: boolean) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `node-${node.id}`,
    });

    const style = {
        position: "absolute" as const,
        left: node.position.x,
        top: node.position.y,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isSelected ? 50 : isDragging ? 100 : 10,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <div className="relative group">
                <div onClick={onClick}>
                    <AgentCard
                        agentType={node.agentType}
                        isOnCanvas
                        isSelected={isSelected}
                        isActive={node.isActive}
                        onToggle={onToggle}
                    />
                </div>

                {/* Delete Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                >
                    <Trash2 className="h-3 w-3" />
                </button>

                {/* Config Indicator */}
                {node.config.goal && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-medium shadow-lg">
                        Configured
                    </div>
                )}
            </div>
        </div>
    );
}
