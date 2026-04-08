import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { DocumentSet, Flashcard, StudySession, UserProfile } from "./types";

// ── Document Sets ──────────────────────────────────────────

export async function saveDocumentSet(
  userId: string,
  docSet: Omit<DocumentSet, "id">
): Promise<string> {
  const docRef = doc(collection(getFirebaseDb(), "users", userId, "documents"));
  await setDoc(docRef, {
    ...docSet,
    uploadedAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getDocumentSets(
  userId: string
): Promise<DocumentSet[]> {
  const q = query(
    collection(getFirebaseDb(), "users", userId, "documents"),
    orderBy("uploadedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as DocumentSet[];
}

export async function getDocumentSet(
  userId: string,
  docId: string
): Promise<DocumentSet | null> {
  const docRef = doc(getFirebaseDb(), "users", userId, "documents", docId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as DocumentSet;
}

export async function renameDocument(
  userId: string,
  docId: string,
  newName: string
): Promise<void> {
  const docRef = doc(getFirebaseDb(), "users", userId, "documents", docId);
  await updateDoc(docRef, { fileName: newName });
}

export async function deleteDocumentSet(
  userId: string,
  docId: string
): Promise<void> {
  const docRef = doc(getFirebaseDb(), "users", userId, "documents", docId);
  await deleteDoc(docRef);
}

// ── Flashcard Progress ──────────────────────────────────────

export async function updateFlashcardProgress(
  userId: string,
  docId: string,
  updatedFlashcards: Flashcard[]
): Promise<void> {
  const docRef = doc(getFirebaseDb(), "users", userId, "documents", docId);
  await updateDoc(docRef, { flashcards: updatedFlashcards });
}

// ── Study Sessions ──────────────────────────────────────────

export async function recordStudySession(
  userId: string,
  session: StudySession
): Promise<void> {
  const docRef = doc(getFirebaseDb(), "users", userId, "sessions", session.date);
  await setDoc(docRef, session, { merge: true });
}

export async function getRecentSessions(
  userId: string,
  count: number = 30
): Promise<StudySession[]> {
  const q = query(
    collection(getFirebaseDb(), "users", userId, "sessions"),
    orderBy("date", "desc"),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data()) as StudySession[];
}

// ── User Profile & Streak ───────────────────────────────────

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const docRef = doc(getFirebaseDb(), "users", userId, "profile", "main");
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  const docRef = doc(getFirebaseDb(), "users", userId, "profile", "main");
  await setDoc(docRef, profile, { merge: true });
}

export async function updateStudyStreak(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const profile = await getUserProfile(userId);

  if (!profile) {
    // First time studying
    await updateUserProfile(userId, {
      streakCount: 1,
      lastStudyDate: today,
    });
    return 1;
  }

  const lastDate = profile.lastStudyDate;
  if (lastDate === today) {
    // Already studied today
    return profile.streakCount;
  }

  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;
  if (lastDate === yesterdayStr) {
    newStreak = profile.streakCount + 1;
  } else {
    newStreak = 1; // Streak broken
  }

  await updateUserProfile(userId, {
    streakCount: newStreak,
    lastStudyDate: today,
  });

  return newStreak;
}
