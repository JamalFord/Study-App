"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, ChevronDown, Loader2, Send, Text } from "lucide-react";
import { CRQuestion } from "@/lib/types";

interface CRQViewerProps {
  questions: CRQuestion[];
}

export default function CRQViewer({ questions }: CRQViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  
  // Grading State
  const [userResponse, setUserResponse] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [feedback, setFeedback] = useState<{score: number, feedback: string, missingConcepts: string[]} | null>(null);
  const [error, setError] = useState("");

  if (!questions || questions.length === 0) {
    return (
      <div className="glass p-12 text-center border border-[var(--surface-border)]">
        <p className="text-[var(--foreground-muted)]">
          No constructed response questions available.
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((p) => p + 1);
      resetState();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((p) => p - 1);
      resetState();
    }
  };

  const resetState = () => {
    setIsRevealed(false);
    setUserResponse("");
    setFeedback(null);
    setError("");
  };

  const handleGrade = async () => {
    if (!userResponse.trim()) {
      setError("Please write an answer before grading.");
      return;
    }
    
    setError("");
    setIsGrading(true);
    try {
      const response = await fetch("/api/grade-crq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.question,
          sampleAnswer: currentQ.sampleAnswer,
          keyConcepts: currentQ.keyConcepts,
          userResponse: userResponse,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get grading feedback.");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setFeedback(data);
      setIsRevealed(true); // Always reveal true answers when graded
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grading failed.");
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--foreground-muted)]">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Question Card */}
        <div className="glass p-6 sm:p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
          <h3 className="text-lg font-medium text-[var(--foreground)] leading-relaxed">
            {currentQ.question}
          </h3>
        </div>

        {!isRevealed ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="relative">
              <Text className="absolute left-4 top-4 w-5 h-5 text-[var(--foreground-muted)]" />
              <textarea
                value={userResponse}
                onChange={(e) => {
                  setUserResponse(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Type your answer here..."
                className="w-full h-32 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl resize-none pl-12 pr-4 py-4 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            
            {error && (
              <p className="text-sm text-[var(--error)] animate-in fade-in">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGrade}
                disabled={isGrading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              >
                {isGrading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Grading with AI...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Grade My Answer</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setIsRevealed(true);
                  setError("");
                }}
                disabled={isGrading}
                className="btn-secondary flex-1 border-dashed border-[var(--surface-border)] hover:bg-[var(--surface)] py-3"
              >
                I don't know, Reveal Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
            
            {/* AI Grading Results */}
            {feedback && (
              <div className="glass p-6 border border-indigo-500/30 bg-indigo-500/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                    AI Professor Feedback
                  </h4>
                  <div className="flex items-center gap-2">
                     <span className={`text-xl font-bold ${feedback.score >= 8 ? 'text-emerald-400' : feedback.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                       {feedback.score}
                     </span>
                     <span className="text-[var(--foreground-muted)] text-sm">/ 10</span>
                  </div>
                </div>
                
                <p className="text-[var(--foreground)] leading-relaxed mb-4">
                  {feedback.feedback}
                </p>

                {feedback.missingConcepts && feedback.missingConcepts.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h5 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                       Missing Concepts
                    </h5>
                    <ul className="space-y-1">
                      {feedback.missingConcepts.map((concept, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-[var(--foreground)]">
                          <span className="text-red-400">•</span>
                          {concept}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Key Concepts */}
            <div className="glass p-6 border border-[var(--surface-border)]">
              <h4 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Key Concepts to Include
              </h4>
              <ul className="space-y-3">
                {currentQ.keyConcepts.map((concept, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-[var(--foreground)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{concept}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Answer */}
            <div className="glass p-6 bg-emerald-500/5 border border-emerald-500/20">
              <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                Sample Optimal Answer
              </h4>
              <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                {currentQ.sampleAnswer}
              </p>
            </div>
            
            {currentIndex < questions.length - 1 && (
               <button
                 onClick={handleNext}
                 className="w-full btn-primary"
               >
                 Next Question
               </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
