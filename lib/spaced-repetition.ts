import { supermemo, SuperMemoItem, SuperMemoGrade } from "supermemo";
import { Flashcard, QualityGrade } from "./types";

/**
 * Calculate next review based on SM-2 algorithm using the supermemo package.
 * Maps quality grade (0-5) to SM-2 and returns updated flashcard data.
 */
export function calculateNextReview(
  flashcard: Flashcard,
  quality: QualityGrade
): Flashcard {
  const item: SuperMemoItem = {
    interval: flashcard.interval,
    repetition: flashcard.repetitions,
    efactor: flashcard.easinessFactor,
  };

  const result = supermemo(item, quality as SuperMemoGrade);

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + result.interval);

  return {
    ...flashcard,
    interval: result.interval,
    repetitions: result.repetition,
    easinessFactor: result.efactor,
    nextReviewDate: nextDate.toISOString(),
  };
}

/**
 * Get cards that are due for review (nextReviewDate <= now).
 * Cards that have never been reviewed are always included.
 */
export function getDueCards(flashcards: Flashcard[]): Flashcard[] {
  const now = new Date().toISOString();
  return flashcards.filter((card) => {
    if (!card.nextReviewDate) return true; // Never reviewed
    return card.nextReviewDate <= now;
  });
}

/**
 * Sort cards by priority:
 * 1. Cards with lowest easiness factor (hardest) first
 * 2. Most overdue cards first
 * 3. Never-reviewed cards first
 */
export function sortByPriority(flashcards: Flashcard[]): Flashcard[] {
  const now = new Date().getTime();

  return [...flashcards].sort((a, b) => {
    // Never-reviewed cards come first
    if (!a.nextReviewDate && b.nextReviewDate) return -1;
    if (a.nextReviewDate && !b.nextReviewDate) return 1;
    if (!a.nextReviewDate && !b.nextReviewDate) return 0;

    // Then sort by overdue amount (most overdue first)
    const aOverdue = now - new Date(a.nextReviewDate).getTime();
    const bOverdue = now - new Date(b.nextReviewDate).getTime();

    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    // Finally by easiness factor (hardest first)
    return a.easinessFactor - b.easinessFactor;
  });
}

/**
 * Initialize SM-2 defaults for a new flashcard
 */
export function initializeFlashcardSM2(
  card: Omit<Flashcard, "easinessFactor" | "interval" | "repetitions" | "nextReviewDate">
): Flashcard {
  return {
    ...card,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(), // Due immediately
  };
}
