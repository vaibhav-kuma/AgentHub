"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { AgentSidebar } from "@/components/canvas/agent-sidebar";
import { CanvasArea } from "@/components/canvas/canvas-area";
import { ConfigSidebar } from "@/components/canvas/config-sidebar";
import { AgentCard } from "@/components/canvas/agent-card";
import { useCanvasState } from "@/hooks/use-canvas-state";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";

export interface CanvasNode {
    id: string;
    agentType: string;
    position: { x: number; y: number };
    isActive?: boolean;
    config: {
        agentName?: string;
        goal?: string;
        tone?: string;
        customTone?: string;
        icp?: string;
        icpTitle?: string;
        icpCompanySize?: string;
        icpIndustry?: string;
        knowledgeBase?: string[];
        schedule?: string;
        scheduleStart?: string;
        scheduleEnd?: string;
        dailyTaskLimit?: number;
        dailyApiLimit?: number;
        model?: string;
        temperature?: number;
        requireApproval?: boolean;
    };
}

export default function DashboardPage() {
    const { nodes, setNodes, isLoading, isSaving } = useCanvasState();
    const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;
        setActiveId(null);

        if (!over) return;

        // If dragging from sidebar to canvas
        if (over.id === "canvas" && typeof active.id === "string" && active.id.startsWith("agent-")) {
            const agentType = active.id.replace("agent-", "");
            const canvasRect = document.getElementById("canvas")?.getBoundingClientRect();

            if (canvasRect) {
                const newNode: CanvasNode = {
                    id: uuidv4(),
                    agentType,
                    position: {
                        x: event.activatorEvent ? (event.activatorEvent as PointerEvent).clientX - canvasRect.left - 100 : 100,
                        y: event.activatorEvent ? (event.activatorEvent as PointerEvent).clientY - canvasRect.top - 50 : 100,
                    },
                    config: {},
                };
                setNodes([...nodes, newNode]);
            }
        }

        // If dragging existing node on canvas
        if (typeof active.id === "string" && active.id.startsWith("node-")) {
            const nodeId = active.id.replace("node-", "");
            setNodes(nodes.map(node =>
                node.id === nodeId
                    ? { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } }
                    : node
            ));
        }
    };

    const handleNodeClick = (node: CanvasNode) => {
        setSelectedNode(node);
    };

    const handleConfigUpdate = (config: CanvasNode["config"]) => {
        if (selectedNode) {
            setNodes(nodes.map(node =>
                node.id === selectedNode.id ? { ...node, config } : node
            ));
            setSelectedNode({ ...selectedNode, config });
        }
    };

    const handleDeleteNode = (nodeId: string) => {
        setNodes(nodes.filter(node => node.id !== nodeId));
        if (selectedNode?.id === nodeId) {
            setSelectedNode(null);
        }
    };

    const activeAgent = activeId?.startsWith("agent-") ? activeId.replace("agent-", "") : null;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading canvas...</p>
                </div>
            </div>
        );
    }

    const handleToggleNode = (nodeId: string, isActive: boolean) => {
        setNodes(nodes.map(node =>
            node.id === nodeId ? { ...node, isActive } : node
        ));
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* Left Sidebar - Agent Templates */}
                <AgentSidebar />

                {/* Canvas Area */}
                <CanvasArea
                    nodes={nodes}
                    onNodeClick={handleNodeClick}
                    selectedNodeId={selectedNode?.id}
                    onDeleteNode={handleDeleteNode}
                    onToggleNode={handleToggleNode}
                    isSaving={isSaving}
                />

                {/* Right Sidebar - Configuration */}
                {selectedNode && (
                    <ConfigSidebar
                        node={selectedNode}
                        onConfigUpdate={handleConfigUpdate}
                        onClose={() => setSelectedNode(null)}
                    />
                )}

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeAgent && (
                        <div className="opacity-50">
                            <AgentCard agentType={activeAgent} isDragging />
                        </div>
                    )}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
