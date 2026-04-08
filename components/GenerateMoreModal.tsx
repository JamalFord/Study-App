"use client";

import { useState } from "react";
import { X, Loader2, PlusCircle, AlertCircle } from "lucide-react";

interface GenerateMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedText?: string;
  fileName: string;
  onGenerate: (newMaterials: {
    flashcards: any[];
    mcQuestions: any[];
    crQuestions?: any[];
  }) => Promise<void>;
}

export default function GenerateMoreModal({
  isOpen,
  onClose,
  extractedText,
  fileName,
  onGenerate,
}: GenerateMoreModalProps) {
  const [numFlashcards, setNumFlashcards] = useState(5);
  const [numMCQs, setNumMCQs] = useState(0);
  const [numCRQs, setNumCRQs] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!extractedText) return;
    if (numFlashcards === 0 && numMCQs === 0 && numCRQs === 0) {
      setError("Please select at least 1 item to generate.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("extractedText", extractedText);
      formData.append("fileName", fileName);
      formData.append("numFlashcards", numFlashcards.toString());
      formData.append("numMCQs", numMCQs.toString());
      formData.append("numCRQs", numCRQs.toString());

      const response = await fetch("/api/extract-and-generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed.");
      }

      await onGenerate({
        flashcards: data.flashcards || [],
        mcQuestions: data.mcQuestions || [],
        crQuestions: data.crQuestions || [],
      });

      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={!isGenerating ? onClose : undefined}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            Generate More Materials
          </h2>
          <button
            onClick={onClose}
            className="btn-ghost p-2 rounded-lg disabled:opacity-50"
            disabled={isGenerating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!extractedText ? (
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Legacy Document Detected</h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              This document was uploaded before the "Generate More" feature was released, so its raw text wasn't saved to your database. Please re-upload the original PDF to generate more materials!
            </p>
            <button onClick={onClose} className="btn-secondary w-full">Close</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--foreground-secondary)] mb-6">
              Add more flashcards, multiple choice questions, or constructed response questions to <strong>{fileName}</strong>.
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[var(--foreground)]">
                  <span className="font-medium text-sm">Flashcards</span>
                  <span className="font-medium text-indigo-400">{numFlashcards}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={numFlashcards}
                  onChange={(e) => setNumFlashcards(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[var(--foreground)]">
                  <span className="font-medium text-sm">Multiple Choice</span>
                  <span className="font-medium text-purple-400">{numMCQs}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={numMCQs}
                  onChange={(e) => setNumMCQs(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[var(--foreground)]">
                  <span className="font-medium text-sm">Constructed Response</span>
                  <span className="font-medium text-emerald-400">{numCRQs}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={numCRQs}
                  onChange={(e) => setNumCRQs(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button 
                onClick={onClose} 
                className="btn-secondary flex-1" 
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={isGenerating || (numFlashcards === 0 && numMCQs === 0 && numCRQs === 0)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate New Items"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
