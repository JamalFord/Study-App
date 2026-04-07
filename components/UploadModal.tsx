"use client";

import { useState, useRef, DragEvent } from "react";
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (data: {
    flashcards: any[];
    mcQuestions: any[];
    fileName: string;
    textPreview: string;
  }) => void;
}

type UploadState = "idle" | "uploading" | "processing" | "success" | "error";

export default function UploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (f: File) => {
    setError("");
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be less than 10MB.");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadState("uploading");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadState("processing");

      const response = await fetch("/api/extract-and-generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadState("success");

      // Small delay so user sees success state
      setTimeout(() => {
        onUploadComplete(data);
        handleReset();
      }, 1000);
    } catch (err) {
      setUploadState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadState("idle");
    setError("");
    setIsDragging(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Upload Document
          </h2>
          <button
            onClick={handleClose}
            className="btn-ghost p-2 rounded-lg"
            id="close-upload-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        {uploadState === "idle" && (
          <>
            <div
              className={`drop-zone ${isDragging ? "active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-file-input"
              />
              <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--foreground-muted)]" />
              <p className="text-[var(--foreground)] font-medium mb-1">
                {file ? file.name : "Drop your PDF here"}
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                  : "or click to browse • Max 10MB"}
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)]">
                <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-sm text-[var(--foreground)] truncate flex-1">
                  {file.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-[var(--foreground-muted)] hover:text-[var(--error)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Processing State */}
        {(uploadState === "uploading" || uploadState === "processing") && (
          <div className="text-center py-10">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-400 animate-spin" />
            <p className="text-[var(--foreground)] font-medium mb-2">
              {uploadState === "uploading"
                ? "Uploading PDF..."
                : "AI is generating your study materials..."}
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              {uploadState === "processing"
                ? "Creating 10 flashcards and 5 quiz questions"
                : "This may take a moment"}
            </p>
            <div className="progress-bar mt-6 max-w-xs mx-auto">
              <div
                className="progress-fill animate-shimmer"
                style={{ width: uploadState === "uploading" ? "30%" : "70%" }}
              />
            </div>
          </div>
        )}

        {/* Success State */}
        {uploadState === "success" && (
          <div className="text-center py-10">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
            <p className="text-[var(--foreground)] font-medium">
              Study materials generated!
            </p>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Redirecting to your study session...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 mt-4 p-3 rounded-lg bg-[var(--error-bg)] border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-[var(--error)] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {/* Actions */}
        {uploadState === "idle" && (
          <div className="flex gap-3 mt-6">
            <button onClick={handleClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file}
              className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              id="generate-button"
            >
              Generate Study Materials
            </button>
          </div>
        )}

        {uploadState === "error" && (
          <div className="flex gap-3 mt-6">
            <button onClick={handleClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={handleReset} className="btn-primary flex-1">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
