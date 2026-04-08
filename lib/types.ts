export interface Flashcard {
  id: string;
  front: string;
  back: string;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string; // ISO date string
}

export interface MCQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CRQuestion {
  id: string;
  question: string;
  sampleAnswer: string;
  keyConcepts: string[];
}

export interface DocumentSet {
  id: string;
  userId: string;
  fileName: string;
  uploadedAt: string; // ISO date string
  flashcards: Flashcard[];
  mcQuestions: MCQuestion[];
  crQuestions?: CRQuestion[];
  textPreview: string; // first 200 chars of extracted text
}

export interface StudySession {
  date: string; // YYYY-MM-DD
  cardsReviewed: number;
  correctCount: number;
  timestamp: string; // ISO date string
}

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  streakCount: number;
  lastStudyDate: string; // YYYY-MM-DD
}

// SM-2 quality grades mapped to user-friendly labels
export type QualityGrade = 0 | 1 | 2 | 3 | 4 | 5;

export const QUALITY_LABELS: Record<QualityGrade, string> = {
  0: "Blackout",
  1: "Wrong",
  2: "Hard",
  3: "Difficult",
  4: "Good",
  5: "Easy",
};
