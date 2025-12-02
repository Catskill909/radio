"use client";

import { useState, useRef } from "react";
import { Download, Upload, AlertTriangle, Loader2 } from "lucide-react";
import { importData } from "@/app/actions/import-data";

export default function DataManagement() {
    const [isImporting, setIsImporting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setShowConfirm(true);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setIsImporting(true);
        setStatus(null);
        setShowConfirm(false);

        const formData = new FormData();
        formData.append("file", selectedFile);

        const result = await importData(formData);

        if (result.success) {
            setStatus({ type: 'success', message: result.message || "Import successful!" });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
            setStatus({ type: 'error', message: result.error || "Import failed." });
        }

        setIsImporting(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    Data Management
                </h2>
                <p className="text-gray-400 mb-6">
                    Export your shows and schedule to back them up, or import data from another instance.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Export Button */}
                    <a
                        href="/api/export"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                    >
                        <Download className="w-4 h-4" />
                        Export All Data
                    </a>

                    {/* Import Button */}
                    <div className="relative">
                        <input
                            type="file"
                            accept=".zip"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-900/50 rounded-lg transition-colors w-full sm:w-auto"
                        >
                            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            Import Data (Replace All)
                        </button>
                    </div>
                </div>

                {/* Status Message */}
                {status && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-900/20 text-green-300 border border-green-900/50' : 'bg-red-900/20 text-red-300 border border-red-900/50'}`}>
                        {status.message}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <AlertTriangle className="w-8 h-8" />
                            <h3 className="text-xl font-bold">Warning: Replace All</h3>
                        </div>

                        <p className="text-gray-300 mb-4">
                            You are about to import <strong>{selectedFile?.name}</strong>.
                        </p>

                        <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-lg mb-6">
                            <p className="text-red-200 text-sm font-medium">
                                This action will PERMANENTLY DELETE all existing Shows and Schedule Slots on this station.
                            </p>
                            <p className="text-red-300/70 text-xs mt-2">
                                Station settings and streams will not be affected.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    setSelectedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Yes, Replace Everything
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
