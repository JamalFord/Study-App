"use client";

import { useState } from "react";
import { ChevronRight, CheckCircle, XCircle, Trophy } from "lucide-react";
import { MCQuestion } from "@/lib/types";

interface MCQViewerProps {
  questions: MCQuestion[];
}

export default function MCQViewer({ questions }: MCQViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--foreground-muted)]">No questions available.</p>
      </div>
    );
  }

  const question = questions[currentIndex];
  const progress = ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100;

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setShowResult(true);

    const isCorrect = selectedOption === question.correctIndex;
    if (isCorrect) setScore((prev) => prev + 1);
    setAnswers((prev) => [...prev, isCorrect]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto animate-fade-in-up">
        <div className="glass p-8 text-center border border-[var(--surface-border)]">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Quiz Complete!
          </h3>
          <p className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent my-4">
            {percentage}%
          </p>
          <p className="text-[var(--foreground-muted)] mb-6">
            You got {score} out of {questions.length} correct
          </p>

          {/* Answer breakdown */}
          <div className="flex justify-center gap-2 mb-6">
            {answers.map((correct, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  correct
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelectedOption(null);
              setShowResult(false);
              setScore(0);
              setIsComplete(false);
              setAnswers([]);
            }}
            className="btn-primary"
            id="retake-quiz-button"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--foreground-muted)]">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-[var(--foreground-muted)]">
            Score: {score}/{currentIndex + (showResult ? 1 : 0)}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="glass p-6 mb-4 border border-[var(--surface-border)]">
        <p className="text-lg font-medium text-[var(--foreground)] leading-relaxed">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => {
          let optionClasses =
            "w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ";

          if (showResult) {
            if (index === question.correctIndex) {
              optionClasses +=
                "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
            } else if (index === selectedOption) {
              optionClasses +=
                "bg-red-500/10 border-red-500/30 text-red-300";
            } else {
              optionClasses +=
                "bg-[var(--surface)] border-[var(--surface-border)] text-[var(--foreground-muted)] opacity-50";
            }
          } else {
            optionClasses +=
              selectedOption === index
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                : "bg-[var(--surface)] border-[var(--surface-border)] text-[var(--foreground)] hover:border-indigo-500/30 hover:bg-[var(--surface-hover)] cursor-pointer";
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              className={optionClasses}
              disabled={showResult}
              id={`option-${index}-button`}
            >
              <span className="w-7 h-7 rounded-full border border-current/30 flex items-center justify-center text-sm font-medium shrink-0 mt-0.5">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-sm leading-relaxed pt-1">{option}</span>
              {showResult && index === question.correctIndex && (
                <CheckCircle className="w-5 h-5 ml-auto text-emerald-400 shrink-0 mt-1" />
              )}
              {showResult &&
                index === selectedOption &&
                index !== question.correctIndex && (
                  <XCircle className="w-5 h-5 ml-auto text-red-400 shrink-0 mt-1" />
                )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showResult && (
        <div className="animate-fade-in glass p-4 mb-6 border border-indigo-500/20 bg-indigo-500/5">
          <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
            <span className="text-indigo-400 font-medium">Explanation: </span>
            {question.explanation}
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            id="submit-answer-button"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn-primary flex items-center gap-2"
            id="next-question-button"
          >
            {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
