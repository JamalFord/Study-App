"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Brain, HelpCircle, Loader2, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import FlashcardViewer from "@/components/FlashcardViewer";
import MCQViewer from "@/components/MCQViewer";
import CRQViewer from "@/components/CRQViewer";
import { DocumentSet, QualityGrade } from "@/lib/types";
import {
  getDocumentSet,
  updateFlashcardProgress,
  recordStudySession,
  updateStudyStreak,
} from "@/lib/firestore";
import {
  calculateNextReview,
  getDueCards,
  sortByPriority,
} from "@/lib/spaced-repetition";
import Link from "next/link";

type StudyTab = "flashcards" | "mcq" | "crq";

export default function StudyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const docId = params.docId as string;

  const [docSet, setDocSet] = useState<DocumentSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StudyTab>("flashcards");
  const [reviewCount, setReviewCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && docId) {
      loadDocument();
    }
  }, [user, docId]);

  const loadDocument = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const doc = await getDocumentSet(user.uid, docId);
      if (doc) {
        setDocSet(doc);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error loading document:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlashcardGrade = async (
    cardId: string,
    quality: QualityGrade
  ) => {
    if (!user || !docSet) return;

    const updatedFlashcards = docSet.flashcards.map((card) => {
      if (card.id === cardId) {
        return calculateNextReview(card, quality);
      }
      return card;
    });

    // Track stats
    setReviewCount((prev) => prev + 1);
    if (quality >= 3) setCorrectCount((prev) => prev + 1);

    // Update local state
    setDocSet({ ...docSet, flashcards: updatedFlashcards });

    // Persist to Firestore
    try {
      await updateFlashcardProgress(user.uid, docId, updatedFlashcards);

      // Record session
      const today = new Date().toISOString().split("T")[0];
      await recordStudySession(user.uid, {
        date: today,
        cardsReviewed: reviewCount + 1,
        correctCount: quality >= 3 ? correctCount + 1 : correctCount,
        timestamp: new Date().toISOString(),
      });

      // Update streak
      await updateStudyStreak(user.uid);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!docSet) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--foreground-muted)]">Document not found.</p>
        </div>
      </div>
    );
  }

  // Get due cards sorted by priority for flashcard mode
  const dueCards = sortByPriority(getDueCards(docSet.flashcards));
  const allCards = sortByPriority(docSet.flashcards);
  const displayCards = dueCards.length > 0 ? dueCards : allCards;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="btn-ghost p-2" id="back-to-dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {docSet.fileName.replace(".pdf", "")}
            </h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              {dueCards.length} cards due •{" "}
              {docSet.flashcards?.length || 0} total flashcards •{" "}
              {docSet.mcQuestions?.length || 0} MCQs
              {(docSet.crQuestions?.length || 0) > 0 && ` • ${docSet.crQuestions!.length} CRQs`}
            </p>
          </div>
        </div>

        <div className="flex gap-1 p-1 glass mb-8 w-fit border border-[var(--surface-border)] overflow-x-auto">
          {docSet.flashcards && docSet.flashcards.length > 0 && (
            <button
              onClick={() => setActiveTab("flashcards")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "flashcards"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-transparent"
              }`}
              id="flashcards-tab"
            >
              <Brain className="w-4 h-4" />
              Flashcards
            </button>
          )}
          {docSet.mcQuestions && docSet.mcQuestions.length > 0 && (
            <button
              onClick={() => setActiveTab("mcq")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "mcq"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-transparent"
              }`}
              id="mcq-tab"
            >
              <HelpCircle className="w-4 h-4" />
              Multiple Choice
            </button>
          )}
          {docSet.crQuestions && docSet.crQuestions.length > 0 && (
            <button
              onClick={() => setActiveTab("crq")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "crq"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-transparent"
              }`}
              id="crq-tab"
            >
              <FileText className="w-4 h-4" />
              Constructed Response
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === "flashcards" && docSet.flashcards && docSet.flashcards.length > 0 && (
          <FlashcardViewer
            flashcards={displayCards}
            onGrade={handleFlashcardGrade}
          />
        )}
        {activeTab === "mcq" && docSet.mcQuestions && docSet.mcQuestions.length > 0 && (
          <MCQViewer questions={docSet.mcQuestions} />
        )}
        {activeTab === "crq" && docSet.crQuestions && docSet.crQuestions.length > 0 && (
          <CRQViewer questions={docSet.crQuestions} />
        )}
      </main>
    </div>
  );
}
