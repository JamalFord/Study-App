"use client";

import Link from "next/link";
import { FileText, Brain, HelpCircle, Clock } from "lucide-react";
import { DocumentSet } from "@/lib/types";

interface DocumentCardProps {
  doc: DocumentSet;
}

export default function DocumentCard({ doc }: DocumentCardProps) {
  const uploadDate = new Date(doc.uploadedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const dueCards = doc.flashcards.filter((card) => {
    if (!card.nextReviewDate) return true;
    return new Date(card.nextReviewDate) <= new Date();
  }).length;

  return (
    <Link href={`/study/${doc.id}`}>
      <div className="glass glass-hover p-5 h-full group cursor-pointer">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-indigo-400 transition-colors">
              {doc.fileName.replace(".pdf", "")}
            </h3>
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
    </Link>
  );
}
