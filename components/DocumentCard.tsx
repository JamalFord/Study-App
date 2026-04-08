"use client";

import Link from "next/link";
import { FileText, Brain, HelpCircle, Clock, Pencil, Check, X, Trash2 } from "lucide-react";
import { DocumentSet } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DocumentCardProps {
  doc: DocumentSet;
  onRename?: (id: string, newName: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export default function DocumentCard({ doc, onRename, onDelete, isSelectMode, isSelected, onToggleSelect }: DocumentCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(doc.fileName.replace(".pdf", ""));
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsDeleting(true);
      if (onDelete) await onDelete(doc.id);
    } catch(err) {
      console.error("Failed to delete", err);
      setIsDeleting(false);
    }
  };

  const handleDisplayClick = () => {
    if (isSelectMode) {
      onToggleSelect?.(doc.id);
      return;
    }
    if (!isEditing && !isConfirmingDelete && !isDeleting) {
      router.push(`/study/${doc.id}`);
    }
  };

  if (isDeleting) {
    return (
      <div className="glass p-5 h-full opacity-50 flex items-center justify-center relative">
        <div className="flex flex-col items-center gap-2">
          <Trash2 className="w-6 h-6 text-red-500 animate-pulse" />
          <span className="text-sm font-medium text-[var(--foreground-muted)]">Deleting...</span>
        </div>
      </div>
    );
  }

  if (isConfirmingDelete) {
    return (
      <div className="glass p-5 h-full border border-red-500/30 flex flex-col justify-center items-center relative gap-4 cursor-default">
        <h3 className="text-[var(--foreground)] font-medium text-center">Delete this document?</h3>
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={handleConfirmDelete}
            className="flex-1 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-sm font-medium transition-colors border border-red-500/20"
          >
            Yes, delete
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsConfirmingDelete(false);
            }}
            className="flex-1 px-3 py-2 bg-[var(--surface-border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-hover)] text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`glass p-5 h-full group cursor-pointer relative transition-all ${
        isSelectMode && isSelected 
          ? 'border-indigo-500 bg-indigo-500/10' 
          : 'glass-hover'
      }`}
      onClick={handleDisplayClick}
    >
      {/* Select Mode Checkbox */}
      {isSelectMode && (
        <div className={`absolute top-4 right-4 z-10 w-5 h-5 rounded flex items-center justify-center transition-colors border ${
          isSelected 
            ? 'bg-indigo-500 border-indigo-500' 
            : 'bg-[var(--surface)] border-[var(--foreground-muted)] opacity-50'
        }`}>
          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      )}

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
            <div className="flex items-center gap-2 group/title mr-6">
              <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-indigo-400 transition-colors">
                {doc.fileName.replace(".pdf", "")}
              </h3>
              {!isSelectMode && (
                <div className="opacity-0 group-hover/title:opacity-100 flex items-center gap-1 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="p-1 text-[var(--foreground-muted)] hover:text-indigo-400 rounded hover:bg-indigo-500/10"
                    aria-label="Rename document"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="p-1 text-[var(--foreground-muted)] hover:text-red-400 rounded hover:bg-red-500/10"
                    aria-label="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
