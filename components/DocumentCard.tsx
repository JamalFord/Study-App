"use client";

import Link from "next/link";
import { FileText, Brain, HelpCircle, Clock, Pencil, Check, X } from "lucide-react";
import { DocumentSet } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DocumentCardProps {
  doc: DocumentSet;
  onRename?: (id: string, newName: string) => Promise<void>;
}

export default function DocumentCard({ doc, onRename }: DocumentCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(doc.fileName.replace(".pdf", ""));
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadDate = new Date(doc.uploadedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const dueCards = doc.flashcards.filter((card) => {
    if (!card.nextReviewDate) return true;
    return new Date(card.nextReviewDate) <= new Date();
  }).length;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!editName.trim() || editName === doc.fileName.replace(".pdf", "")) {
      setIsEditing(false);
      setEditName(doc.fileName.replace(".pdf", ""));
      return;
    }

    try {
      setIsSaving(true);
      if (onRename) {
        await onRename(doc.id, editName.trim());
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to rename:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(false);
    setEditName(doc.fileName.replace(".pdf", ""));
  };

  return (
    <div 
      className="glass glass-hover p-5 h-full group cursor-pointer relative"
      onClick={() => {
        if (!isEditing) router.push(`/study/${doc.id}`);
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <form onSubmit={handleSave} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isSaving}
                className="w-full bg-[var(--surface)] text-[var(--foreground)] px-2 py-1 text-sm rounded border border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button 
                type="submit" 
                disabled={isSaving}
                className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors shrink-0 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={handleCancel}
                disabled={isSaving}
                className="p-1.5 bg-[var(--surface-border)] text-[var(--foreground-muted)] rounded hover:text-[var(--foreground)] transition-colors shrink-0 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 group/title">
              <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-indigo-400 transition-colors">
                {doc.fileName.replace(".pdf", "")}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover/title:opacity-100 p-1 text-[var(--foreground-muted)] hover:text-indigo-400 transition-all rounded hover:bg-indigo-500/10"
                aria-label="Rename document"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {uploadDate}
          </p>
        </div>
      </div>

      {/* Preview */}
      {doc.textPreview && (
        <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 mb-4 leading-relaxed">
          {doc.textPreview}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Brain className="w-3.5 h-3.5" />
          <span>{doc.flashcards.length} cards</span>
        </div>
        <div className="flex items-center gap-1.5 text-purple-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{doc.mcQuestions.length} MCQs</span>
        </div>
        {dueCards > 0 && (
          <div className="ml-auto flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
            <span>{dueCards} due</span>
          </div>
        )}
      </div>
    </div>
  );
}
