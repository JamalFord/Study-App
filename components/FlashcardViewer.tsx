"use client";

import { useState } from "react";
import { RotateCcw, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Flashcard, QualityGrade } from "@/lib/types";

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onGrade: (cardId: string, quality: QualityGrade) => void;
}

const gradeButtons: { quality: QualityGrade; label: string; color: string }[] = [
  { quality: 0, label: "Again", color: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" },
  { quality: 2, label: "Hard", color: "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30" },
  { quality: 3, label: "Good", color: "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30" },
  { quality: 5, label: "Easy", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30" },
];

export default function FlashcardViewer({ flashcards, onGrade }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [gradedCards, setGradedCards] = useState<Set<string>>(new Set());

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--foreground-muted)]">No flashcards available.</p>
      </div>
    );
  }

  const card = flashcards[currentIndex];
  const progress = ((gradedCards.size) / flashcards.length) * 100;

  const handleGrade = (quality: QualityGrade) => {
    onGrade(card.id, quality);
    setGradedCards((prev) => new Set([...prev, card.id]));
    setIsFlipped(false);

    // Move to next card
    if (currentIndex < flashcards.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
    }
  };

  const goToCard = (direction: "prev" | "next") => {
    setIsFlipped(false);
    setTimeout(() => {
      if (direction === "prev" && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (direction === "next" && currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }, 150);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--foreground-muted)]">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          <span className="text-sm text-[var(--foreground-muted)]">
            {gradedCards.size} reviewed
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="flashcard-container mb-6 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ height: "320px" }}
      >
        <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
          {/* Front */}
          <div className="flashcard-front glass border border-[var(--surface-border)]">
            <div className="text-center">
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-medium mb-4 block">
                Question
              </span>
              <p className="text-xl font-medium text-[var(--foreground)] leading-relaxed">
                {card.front}
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-6">
                Click to reveal answer
              </p>
            </div>
          </div>

          {/* Back */}
          <div className="flashcard-back glass border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
            <div className="text-center">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-medium mb-4 block">
                Answer
              </span>
              <p className="text-lg text-[var(--foreground)] leading-relaxed">
                {card.back}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => goToCard("prev")}
          disabled={currentIndex === 0}
          className="btn-ghost p-2 disabled:opacity-30"
          id="prev-card-button"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="btn-ghost p-2"
          title="Flip card"
          id="flip-card-button"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => goToCard("next")}
          disabled={currentIndex === flashcards.length - 1}
          className="btn-ghost p-2 disabled:opacity-30"
          id="next-card-button"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Grade Buttons — only show when flipped */}
      {isFlipped && (
        <div className="animate-fade-in">
          <p className="text-sm text-center text-[var(--foreground-muted)] mb-3">
            How well did you know this?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {gradeButtons.map(({ quality, label, color }) => (
              <button
                key={quality}
                onClick={() => handleGrade(quality)}
                className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${color}`}
                id={`grade-${label.toLowerCase()}-button`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completion */}
      {gradedCards.size === flashcards.length && (
        <div className="animate-fade-in text-center mt-8 glass p-6 border border-emerald-500/20">
          <Check className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
          <p className="text-lg font-semibold text-[var(--foreground)]">
            Session Complete!
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            You reviewed all {flashcards.length} cards.
          </p>
        </div>
      )}
    </div>
  );
}
