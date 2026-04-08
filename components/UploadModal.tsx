"use client";

import { useState, useRef, useEffect, DragEvent } from "react";
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (docsData: Array<{
    flashcards: any[];
    mcQuestions: any[];
    crQuestions?: any[];
    fileName: string;
    textPreview: string;
  }>) => Promise<Array<{ id: string; fileName: string }>>;
}

type UploadState = "idle" | "uploading" | "processing" | "success" | "error";

interface FileItem {
  id: string; // unique internal id
  file: File;
  status: "idle" | "processing" | "success" | "error";
  data?: any;
  error?: string;
}

export default function UploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: UploadModalProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [globalError, setGlobalError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [createdDocuments, setCreatedDocuments] = useState<Array<{ id: string; fileName: string }>>([]);
  
  // Settings
  const [numFlashcards, setNumFlashcards] = useState(10);
  const [numMCQs, setNumMCQs] = useState(5);
  const [numCRQs, setNumCRQs] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("pdfjs-dist").then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      });
    }
  }, []);

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
    if (e.dataTransfer.files?.length) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    setGlobalError("");
    const newFileItems = newFiles.map((file) => {
      let initialStatus: "idle" | "error" = "idle";
      let errorMsg: string | undefined = undefined;

      if (file.type !== "application/pdf") {
        initialStatus = "error";
        errorMsg = "Not a valid PDF file.";
      } else if (file.size > 10 * 1024 * 1024) {
        initialStatus = "error";
        errorMsg = "Exceeds 10MB limit. Try compressing or splitting.";
      }

      return {
        id: Math.random().toString(36).substring(7),
        file,
        status: initialStatus,
        error: errorMsg,
      };
    });

    setFiles((prev) => [...prev, ...newFileItems]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploadState("uploading");
    setGlobalError("");

    let hasError = false;

    for (let i = 0; i < files.length; i++) {
      const currentFile = files[i];
      if (currentFile.status === "success" || currentFile.error?.includes("10MB")) continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "processing", error: undefined } : f
        )
      );

      try {
        // --- Client-Side PDF Text Extraction ---
        let extractedText = "";
        try {
          const pdfjs = await import("pdfjs-dist");
          const arrayBuffer = await currentFile.file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            // @ts-expect-error - pdfjs items missing types
            const pageText = textContent.items.map((item) => item.str).join(" ");
            extractedText += pageText + "\n";
          }
        } catch (pdfErr) {
          console.error("PDF extraction error:", pdfErr);
          throw new Error("Failed to extract text from PDF in browser.");
        }

        const formData = new FormData();
        formData.append("extractedText", extractedText);
        formData.append("fileName", currentFile.file.name);
        formData.append("numFlashcards", numFlashcards.toString());
        formData.append("numMCQs", numMCQs.toString());
        formData.append("numCRQs", numCRQs.toString());

        const response = await fetch("/api/extract-and-generate", {
          method: "POST",
          body: formData,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (response.status === 503 || response.status === 504 || response.status === 500) {
            throw new Error("The APIs are busy, please try again later.");
          }
          throw new Error(data.error || "Generation failed. Please try again.");
        }

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "success", data } : f
          )
        );
      } catch (err) {
        hasError = true;
        let errorMessage = "Something went wrong";
        if (err instanceof Error) {
          // If it's an explicit error string or fetch failure
          errorMessage = err.message === "Failed to fetch" ? "Network error: The APIs are busy, please try again." : err.message;
        }
        
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  error: errorMessage,
                }
              : f
          )
        );
      }
    }

    setFiles((currentFiles) => {
      const allSuccess = currentFiles.every((f) => f.status === "success");
      if (allSuccess) {
        saveAll(currentFiles);
      } else {
        setUploadState("error");
        setGlobalError("Some files failed to process. You can retry them.");
      }
      return currentFiles;
    });
  };

  const saveAll = async (currentFiles: FileItem[]) => {
    setUploadState("processing");
    const successfulData = currentFiles
      .filter((f) => f.status === "success" && f.data)
      .map((f) => f.data);
      
    if (successfulData.length > 0) {
      const createdDocs = await onUploadComplete(successfulData);
      setCreatedDocuments(createdDocs);
      setUploadState("success");
    } else {
      setUploadState("idle");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setUploadState("idle");
    setGlobalError("");
    setIsDragging(false);
    setCreatedDocuments([]);
  };

  const handleClose = () => {
    if (uploadState === "processing" || uploadState === "uploading") return; 
    handleReset();
    onClose();
  };

  const handleStudyDoc = (docId: string) => {
    handleReset();
    onClose();
    router.push(`/study/${docId}`);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {uploadState === "success" ? "Upload Complete!" : "Upload Documents"}
          </h2>
          <button
            onClick={handleClose}
            className="btn-ghost p-2 rounded-lg disabled:opacity-50"
            disabled={uploadState === "processing" || uploadState === "uploading"}
            id="close-upload-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone & File List */}
        {(uploadState === "idle" || uploadState === "error") && (
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
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-file-input"
              />
              <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--foreground-muted)]" />
              <p className="text-[var(--foreground)] font-medium mb-1">
                Drop PDF files here
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                or click to browse • Max 10MB per file
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                {files.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      fileItem.status === "error"
                        ? "bg-[var(--error-bg)] border-red-500/20"
                        : fileItem.status === "success"
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-[var(--surface)] border-[var(--surface-border)]"
                    }`}
                  >
                    {fileItem.status === "error" ? (
                      <AlertCircle className="w-5 h-5 text-[var(--error)] shrink-0" />
                    ) : fileItem.status === "success" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--foreground)] truncate">
                        {fileItem.file.name}
                      </p>
                      {fileItem.error && (
                        <p className="text-xs text-[var(--error)] truncate">
                          {fileItem.error}
                        </p>
                      )}
                    </div>
                    
                    {fileItem.status !== "success" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(fileItem.id);
                        }}
                        className="text-[var(--foreground-muted)] hover:text-[var(--error)] transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Advanced Settings */}
            <div className="mt-6 border-t border-[var(--surface-border)] pt-4">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="text-sm font-medium text-[var(--foreground)] flex items-center justify-between w-full hover:text-indigo-400 transition-colors"
                type="button"
              >
                Generation Settings
                <span className="text-xs text-[var(--foreground-muted)]">{showSettings ? "Hide" : "Show"}</span>
              </button>
              
              {showSettings && (
                <div className="mt-4 space-y-4 text-sm animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[var(--foreground)]">
                      <span>Flashcards</span>
                      <span className="font-medium text-indigo-400">{numFlashcards}</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" 
                      value={numFlashcards} onChange={(e) => setNumFlashcards(parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[var(--foreground)]">
                      <span>Multiple Choice</span>
                      <span className="font-medium text-purple-400">{numMCQs}</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" 
                      value={numMCQs} onChange={(e) => setNumMCQs(parseInt(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[var(--foreground)]">
                      <span>Constructed Response</span>
                      <span className="font-medium text-emerald-400">{numCRQs}</span>
                    </div>
                    <input 
                      type="range" min="0" max="10" 
                      value={numCRQs} onChange={(e) => setNumCRQs(parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  {numFlashcards === 0 && numMCQs === 0 && numCRQs === 0 && (
                     <p className="text-xs text-red-400 mt-2">You must select at least 1 study material to generate.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Processing State */}
        {(uploadState === "uploading" || uploadState === "processing") && (
          <div className="text-center py-10">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-400 animate-spin" />
            <p className="text-[var(--foreground)] font-medium mb-2">
              {uploadState === "uploading"
                ? `Processing files... (${files.filter(f => f.status === 'success').length} / ${files.length})`
                : "Saving to your dashboard..."}
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              {uploadState === "processing"
                ? "Almost done!"
                : "Generating study materials systematically to ensure quality."}
            </p>
            <div className="progress-bar mt-6 max-w-xs mx-auto">
              <div
                className="progress-fill animate-shimmer"
                style={{
                  width: uploadState === "processing" ? "90%" : `${Math.max(10, (files.filter(f => f.status === 'success' || f.status === 'error').length / files.length) * 100)}%`
                }}
              />
            </div>
            
            {/* Show processing list */}
            <div className="mt-8 space-y-2 text-left max-h-32 overflow-y-auto w-full max-w-sm mx-auto">
                {files.map((fileItem) => (
                  <div key={fileItem.id} className="flex items-center gap-2 text-sm">
                     {fileItem.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0"/>}
                     {fileItem.status === 'error' && <AlertCircle className="w-4 h-4 text-[var(--error)] shrink-0"/>}
                     {fileItem.status === 'processing' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0"/>}
                     {fileItem.status === 'idle' && <div className="w-4 h-4 rounded-full border border-[var(--surface-border)] shrink-0"/>}
                     <span className="truncate text-[var(--foreground-muted)]">{fileItem.file.name}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Success / Selection State */}
        {uploadState === "success" && (
          <div className="py-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
              <p className="text-[var(--foreground)] font-medium">
                Success! Generated {createdDocuments.length} study {createdDocuments.length === 1 ? 'document' : 'documents'}.
              </p>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                Which one would you like to study first?
              </p>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6 px-1">
              {createdDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleStudyDoc(doc.id)}
                  className="w-full text-left p-4 rounded-xl border border-[var(--surface-border)] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span className="font-medium text-[var(--foreground)] truncate">
                      {doc.fileName}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Global Error */}
        {globalError && (
          <div className="flex items-start gap-3 mt-4 p-3 rounded-lg bg-[var(--error-bg)] border border-red-500/20">
             <AlertCircle className="w-5 h-5 text-[var(--error)] shrink-0 mt-0.5" />
             <p className="text-sm text-[var(--error)]">{globalError}</p>
          </div>
        )}

        {/* Actions */}
        {(uploadState === "idle" || uploadState === "error") && (
          <div className="flex gap-3 mt-6">
            <button onClick={handleClose} className="btn-secondary flex-1">
               Cancel
            </button>
            <button
               onClick={handleUpload}
               disabled={files.length === 0 || files.every(f => f.status === 'success') || (numFlashcards === 0 && numMCQs === 0 && numCRQs === 0)}
               className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
               id="generate-button"
            >
               {uploadState === "error" ? "Retry Failed" : "Generate Study Materials"}
            </button>
          </div>
        )}
        
        {uploadState === "success" && (
          <div className="flex gap-3 mt-2">
            <button onClick={handleClose} className="btn-secondary w-full">
               Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
