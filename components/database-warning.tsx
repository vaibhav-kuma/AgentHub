"use client";

import { AlertCircle, Database, ExternalLink } from "lucide-react";
import { useState } from "react";

export function DatabaseWarning() {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div className="fixed bottom-4 right-4 max-w-md bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <Database className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4" />
                        <h3 className="font-semibold text-sm">Database Not Configured</h3>
                    </div>
                    <p className="text-xs text-white/90 mb-3">
                        Some features are disabled. Using browser storage as fallback.
                    </p>
                    <div className="flex items-center gap-2">
                        <a
                            href="/QUICK_SETUP.md"
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <ExternalLink className="h-3 w-3" />
                            Setup Guide
                        </a>
                        <button
                            onClick={() => setDismissed(true)}
                            className="text-xs text-white/80 hover:text-white px-2 py-1"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
