"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Globe, Plus, Loader2, FileText, Link as LinkIcon, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface AddSourceDialogProps {
    onSourceAdded: () => void;
}

export function AddSourceDialog({ onSourceAdded }: AddSourceDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("file");
    const [url, setUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setError(null);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'text/plain': ['.txt', '.md'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        }
    });

    const handleUpload = async () => {
        if (!file) return;

        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/knowledge/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            setOpen(false);
            setFile(null);
            onSourceAdded();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScrape = async () => {
        if (!url) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/knowledge/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, type: "url" }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Scrape failed");
            }

            setOpen(false);
            setUrl("");
            onSourceAdded();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Add Source
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Knowledge Source</DialogTitle>
                    <DialogDescription>
                        Upload documents or scrape websites to train your agents.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="file" className="gap-2">
                            <Upload className="h-4 w-4" />
                            File Upload
                        </TabsTrigger>
                        <TabsTrigger value="url" className="gap-2">
                            <Globe className="h-4 w-4" />
                            Website URL
                        </TabsTrigger>
                    </TabsList>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <TabsContent value="file" className="space-y-4">
                        <div
                            {...getRootProps()}
                            className={`
                                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                                ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
                            `}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {file ? file.name : "Click to upload or drag and drop"}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {file ? `${(file.size / 1024).toFixed(1)} KB` : "PDF, DOCX, TXT up to 10MB"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || isLoading}
                            className="w-full"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload Document
                        </Button>
                    </TabsContent>

                    <TabsContent value="url" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">Website URL</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="url"
                                    placeholder="https://example.com/blog/article"
                                    className="pl-10"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                We'll scrape the main content of the page and split it into chunks.
                            </p>
                        </div>
                        <Button
                            onClick={handleScrape}
                            disabled={!url || isLoading}
                            className="w-full"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Scrape URL
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
