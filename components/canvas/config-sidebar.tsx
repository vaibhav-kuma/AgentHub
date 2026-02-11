"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
    X,
    Save,
    Sparkles,
    MessageSquare,
    Target,
    Users,
    Database,
    Sliders,
    Clock,
    Zap,
    Upload,
    Link2,
    FileText,
    Loader2,
    CheckCircle2,
    Building2,
    Briefcase,
    Factory,
} from "lucide-react";
import type { CanvasNode } from "@/app/app/dashboard/page";

interface ConfigSidebarProps {
    node: CanvasNode;
    onConfigUpdate: (config: CanvasNode["config"]) => void;
    onClose: () => void;
}

interface KnowledgeSource {
    id: string;
    type: "url" | "file" | "notion" | "gdocs";
    name: string;
    url?: string;
    status: "pending" | "processing" | "completed" | "error";
    chunks?: number;
}

export function ConfigSidebar({ node, onConfigUpdate, onClose }: ConfigSidebarProps) {
    const [config, setConfig] = useState(node.config);
    const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
    const [urlInput, setUrlInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSave = () => {
        onConfigUpdate({
            ...config,
            knowledgeBase: knowledgeSources.map(s => s.id),
        });
    };

    const handleChange = (field: string, value: any) => {
        setConfig({ ...config, [field]: value });
    };

    // Handle URL/Notion link submission
    const handleAddUrl = async () => {
        if (!urlInput.trim()) return;

        const newSource: KnowledgeSource = {
            id: Date.now().toString(),
            type: urlInput.includes("notion.so") ? "notion" : urlInput.includes("docs.google.com") ? "gdocs" : "url",
            name: urlInput,
            url: urlInput,
            status: "pending",
        };

        setKnowledgeSources([...knowledgeSources, newSource]);
        setUrlInput("");

        // Trigger background scraping
        await processKnowledgeSource(newSource);
    };

    // Process knowledge source (scrape & chunk)
    const processKnowledgeSource = async (source: KnowledgeSource) => {
        setIsProcessing(true);

        // Update status to processing
        setKnowledgeSources(prev =>
            prev.map(s => s.id === source.id ? { ...s, status: "processing" } : s)
        );

        try {
            const response = await fetch("/api/knowledge/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: source.url,
                    type: source.type,
                    sourceId: source.id,
                }),
            });

            if (!response.ok) throw new Error("Scraping failed");

            const data = await response.json();

            // Update status to completed
            setKnowledgeSources(prev =>
                prev.map(s =>
                    s.id === source.id
                        ? { ...s, status: "completed", chunks: data.chunks }
                        : s
                )
            );
        } catch (error) {
            console.error("Error processing knowledge source:", error);
            setKnowledgeSources(prev =>
                prev.map(s => s.id === source.id ? { ...s, status: "error" } : s)
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle file upload
    const onDrop = async (acceptedFiles: File[]) => {
        for (const file of acceptedFiles) {
            const newSource: KnowledgeSource = {
                id: Date.now().toString(),
                type: "file",
                name: file.name,
                status: "pending",
            };

            setKnowledgeSources(prev => [...prev, newSource]);

            // Upload file
            const formData = new FormData();
            formData.append("file", file);
            formData.append("sourceId", newSource.id);

            try {
                setIsProcessing(true);
                setKnowledgeSources(prev =>
                    prev.map(s => s.id === newSource.id ? { ...s, status: "processing" } : s)
                );

                const response = await fetch("/api/knowledge/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) throw new Error("Upload failed");

                const data = await response.json();

                setKnowledgeSources(prev =>
                    prev.map(s =>
                        s.id === newSource.id
                            ? { ...s, status: "completed", chunks: data.chunks }
                            : s
                    )
                );
            } catch (error) {
                console.error("Error uploading file:", error);
                setKnowledgeSources(prev =>
                    prev.map(s => s.id === newSource.id ? { ...s, status: "error" } : s)
                );
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "text/plain": [".txt"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        },
    });

    const removeSource = (id: string) => {
        setKnowledgeSources(prev => prev.filter(s => s.id !== id));
    };

    return (
        <div className="w-[420px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Configure Agent
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {node.agentType}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${node.isActive ? "bg-green-500/10 text-green-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}>
                        {node.isActive ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>

            {/* Configuration Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Agent Name */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white mb-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        Agent Name
                    </label>
                    <input
                        type="text"
                        value={config.agentName || ""}
                        onChange={(e) => handleChange("agentName", e.target.value)}
                        placeholder={`My ${node.agentType}`}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                </div>

                {/* Goal / Main Task */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white mb-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        Goal / Main Task
                    </label>
                    <textarea
                        value={config.goal || ""}
                        onChange={(e) => handleChange("goal", e.target.value)}
                        placeholder="What should this agent accomplish? Be specific..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                    />
                </div>

                {/* Target ICP */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                        <Users className="h-4 w-4 text-green-500" />
                        Target ICP (Ideal Customer Profile)
                    </label>

                    <div>
                        <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                            Job Title
                        </label>
                        <input
                            type="text"
                            value={config.icpTitle || ""}
                            onChange={(e) => handleChange("icpTitle", e.target.value)}
                            placeholder="e.g., VP of Sales, Marketing Director"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                            Company Size
                        </label>
                        <select
                            value={config.icpCompanySize || ""}
                            onChange={(e) => handleChange("icpCompanySize", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        >
                            <option value="">Select size...</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501-1000">501-1000 employees</option>
                            <option value="1000+">1000+ employees</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                            Industry
                        </label>
                        <input
                            type="text"
                            value={config.icpIndustry || ""}
                            onChange={(e) => handleChange("icpIndustry", e.target.value)}
                            placeholder="e.g., SaaS, E-commerce, Healthcare"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        />
                    </div>
                </div>

                {/* Tone of Voice */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white mb-2">
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                        Tone of Voice
                    </label>
                    <select
                        value={config.tone || "professional"}
                        onChange={(e) => handleChange("tone", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm mb-2"
                    >
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="casual">Casual</option>
                        <option value="formal">Formal</option>
                        <option value="enthusiastic">Enthusiastic</option>
                        <option value="custom">Custom...</option>
                    </select>

                    {config.tone === "custom" && (
                        <input
                            type="text"
                            value={config.customTone || ""}
                            onChange={(e) => handleChange("customTone", e.target.value)}
                            placeholder="Describe your custom tone..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        />
                    )}
                </div>

                {/* Knowledge Base */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white mb-3">
                        <Database className="h-4 w-4 text-orange-500" />
                        Knowledge Base
                    </label>

                    {/* URL Input */}
                    <div className="space-y-2 mb-3">
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="Paste Notion link, website URL, or Google Docs..."
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                onKeyPress={(e) => e.key === "Enter" && handleAddUrl()}
                            />
                            <button
                                onClick={handleAddUrl}
                                disabled={!urlInput.trim() || isProcessing}
                                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Link2 className="h-4 w-4" />
                                Add
                            </button>
                        </div>
                    </div>

                    {/* File Upload Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${isDragActive
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                            }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                            {isDragActive ? "Drop files here..." : "Drag & drop PDFs, docs here"}
                        </p>
                        <p className="text-xs text-slate-500">or click to browse</p>
                    </div>

                    {/* Knowledge Sources List */}
                    {knowledgeSources.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {knowledgeSources.map((source) => (
                                <div
                                    key={source.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {source.type === "file" ? (
                                            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        ) : (
                                            <Link2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-900 dark:text-white truncate">
                                                {source.name}
                                            </p>
                                            {source.status === "completed" && source.chunks && (
                                                <p className="text-xs text-slate-500">
                                                    {source.chunks} chunks processed
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {source.status === "processing" && (
                                            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                                        )}
                                        {source.status === "completed" && (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        )}
                                        {source.status === "error" && (
                                            <span className="text-xs text-red-500">Error</span>
                                        )}
                                        <button
                                            onClick={() => removeSource(source.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Schedule */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white mb-2">
                        <Clock className="h-4 w-4 text-indigo-500" />
                        Schedule
                    </label>
                    <select
                        value={config.schedule || "24/7"}
                        onChange={(e) => handleChange("schedule", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm mb-2"
                    >
                        <option value="24/7">Run 24/7</option>
                        <option value="business-hours">Business Hours (9 AM - 5 PM)</option>
                        <option value="custom">Custom Hours...</option>
                    </select>

                    {config.schedule === "custom" && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    value={config.scheduleStart || "09:00"}
                                    onChange={(e) => handleChange("scheduleStart", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    value={config.scheduleEnd || "17:00"}
                                    onChange={(e) => handleChange("scheduleEnd", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Daily Limits */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white mb-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Daily Limits
                    </label>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                                Max Tasks per Day
                            </label>
                            <input
                                type="number"
                                value={config.dailyTaskLimit || 100}
                                onChange={(e) => handleChange("dailyTaskLimit", parseInt(e.target.value))}
                                min="1"
                                max="1000"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                                Max API Calls per Day
                            </label>
                            <input
                                type="number"
                                value={config.dailyApiLimit || 500}
                                onChange={(e) => handleChange("dailyApiLimit", parseInt(e.target.value))}
                                min="1"
                                max="5000"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Human-in-the-Loop */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                    <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-amber-500" />
                            <div>
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                                    Manual Approval
                                </p>
                                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                    Review AI messages before they are sent
                                </p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.requireApproval || false}
                            onChange={(e) => handleChange("requireApproval", e.target.checked)}
                            className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                    </label>
                </div>

                {/* Model Settings */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white mb-2">
                        <Sliders className="h-4 w-4 text-pink-500" />
                        Model Settings
                    </label>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                                Model
                            </label>
                            <select
                                value={config.model || "claude-3-5-sonnet"}
                                onChange={(e) => handleChange("model", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                            >
                                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Recommended)</option>
                                <option value="claude-3-opus">Claude 3 Opus (Most Capable)</option>
                                <option value="claude-3-haiku">Claude 3 Haiku (Fastest)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                                Temperature: {config.temperature || 70}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={config.temperature || 70}
                                onChange={(e) => handleChange("temperature", parseInt(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>Precise</span>
                                <span>Creative</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="h-4 w-4" />
                    {isProcessing ? "Processing..." : "Save Configuration"}
                </button>
                <button
                    onClick={onClose}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm font-medium"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
