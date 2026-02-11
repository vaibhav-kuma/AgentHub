"use client";

import React, { useState, useEffect } from "react";
import {
    FileText,
    Globe,
    Trash2,
    Plus,
    Search,
    Loader2,
    Database,
    LayoutGrid,
    List,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AddSourceDialog } from "@/components/knowledge/add-source-dialog";

interface KnowledgeSource {
    id: string;
    name: string;
    type: "url" | "file" | "notion";
    url?: string;
    fileName?: string;
    fileSize?: number;
    status: string;
    chunkCount: number;
    createdAt: string;
}

export default function KnowledgePage() {
    const [sources, setSources] = useState<KnowledgeSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/knowledge/sources");
            const data = await response.json();
            setSources(data.sources || []);
        } catch (error) {
            console.error("Error fetching sources:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this knowledge source? This will also remove all associated training data.")) return;

        try {
            setIsDeleting(id);
            const response = await fetch(`/api/knowledge/sources?id=${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setSources(sources.filter((s) => s.id !== id));
            }
        } catch (error) {
            console.error("Error deleting source:", error);
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredSources = sources.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatSize = (bytes?: number) => {
        if (!bytes) return "0 KB";
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        Knowledge Base
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Manage the data used to train and ground your AI agents.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search sources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none w-64"
                        />
                    </div>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-500" : "text-slate-500"}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-500" : "text-slate-500"}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                    <AddSourceDialog onSourceAdded={fetchSources} />
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Loading knowledge sources...</p>
                </div>
            ) : filteredSources.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Database className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        No knowledge sources found
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                        Upload files or scrape URLs from the dashboard or agent configuration to populate your knowledge base.
                    </p>
                </div>
            ) : viewMode === "list" ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Source</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Chunks</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Created</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredSources.map((source) => (
                                <tr key={source.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${source.type === "url" ? "bg-blue-50 dark:bg-blue-500/10" : "bg-purple-50 dark:bg-purple-500/10"}`}>
                                                {source.type === "url" ? (
                                                    <Globe className={`h-4 w-4 ${source.type === "url" ? "text-blue-500" : "text-purple-500"}`} />
                                                ) : (
                                                    <FileText className="h-4 w-4 text-purple-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[300px]" title={source.name}>
                                                    {source.name}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate max-w-[300px]">
                                                    {source.type === "url" ? source.url : formatSize(source.fileSize)}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                                            {source.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                                                {source.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                            {source.chunkCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {formatDistanceToNow(new Date(source.createdAt), { addSuffix: true })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(source.id)}
                                            disabled={isDeleting === source.id}
                                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            {isDeleting === source.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSources.map((source) => (
                        <div key={source.id} className="group relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-lg shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${source.type === "url" ? "bg-blue-50 dark:bg-blue-500/10" : "bg-purple-50 dark:bg-purple-500/10"}`}>
                                    {source.type === "url" ? (
                                        <Globe className={`h-6 w-6 ${source.type === "url" ? "text-blue-500" : "text-purple-500"}`} />
                                    ) : (
                                        <FileText className="h-6 w-6 text-purple-500" />
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(source.id)}
                                    disabled={isDeleting === source.id}
                                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                    {isDeleting === source.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate" title={source.name}>
                                {source.name}
                            </h3>
                            <p className="text-xs text-slate-500 mb-4 truncate">
                                {source.type === "url" ? source.url : formatSize(source.fileSize)}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5">
                                    <Database className="h-3 w-3 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        {source.chunkCount} Chunks
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {formatDistanceToNow(new Date(source.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
