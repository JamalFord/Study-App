"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Plus,
  Flame,
  Brain,
  Target,
  BookOpen,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import DocumentCard from "@/components/DocumentCard";
import UploadModal from "@/components/UploadModal";
import { DocumentSet } from "@/lib/types";
import {
  getDocumentSets,
  saveDocumentSet,
  getUserProfile,
  updateStudyStreak,
  getRecentSessions,
  updateUserProfile,
} from "@/lib/firestore";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentSet[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [todayReviewed, setTodayReviewed] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Load documents
      const docs = await getDocumentSets(user.uid);
      setDocuments(docs);

      // Count total cards
      const total = docs.reduce((sum, d) => sum + d.flashcards.length, 0);
      setTotalCards(total);

      // Load profile for streak
      const profile = await getUserProfile(user.uid);
      setStreak(profile?.streakCount || 0);

      // Load today's sessions
      const today = new Date().toISOString().split("T")[0];
      const sessions = await getRecentSessions(user.uid, 1);
      if (sessions.length > 0 && sessions[0].date === today) {
        setTodayReviewed(sessions[0].cardsReviewed);
      }

      // Init profile if needed
      if (!profile) {
        await updateUserProfile(user.uid, {
          displayName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          streakCount: 0,
          lastStudyDate: "",
        });
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = async (data: {
    flashcards: any[];
    mcQuestions: any[];
    fileName: string;
    textPreview: string;
  }) => {
    if (!user) return;

    try {
      const docId = await saveDocumentSet(user.uid, {
        userId: user.uid,
        fileName: data.fileName,
        uploadedAt: new Date().toISOString(),
        flashcards: data.flashcards,
        mcQuestions: data.mcQuestions,
        textPreview: data.textPreview,
      });

      setIsUploadOpen(false);
      router.push(`/study/${docId}`);
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Welcome back, {user?.displayName?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Ready to study? Upload a new document or continue where you left
              off.
            </p>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn-primary flex items-center gap-2"
            id="upload-button"
          >
            <Plus className="w-4 h-4" />
            Upload PDF
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatsCard
            icon={<Flame className="w-6 h-6" />}
            value={streak}
            label="Day Streak"
            color="accent"
          />
          <StatsCard
            icon={<Brain className="w-6 h-6" />}
            value={totalCards}
            label="Total Flashcards"
            color="primary"
          />
          <StatsCard
            icon={<Target className="w-6 h-6" />}
            value={todayReviewed}
            label="Reviewed Today"
            color="success"
          />
        </div>

        {/* Documents */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Your Documents
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="glass p-12 text-center border border-[var(--surface-border)]">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--foreground-muted)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No documents yet
            </h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Upload your first PDF to start generating study materials.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
              id="empty-state-upload-button"
            >
              <Plus className="w-4 h-4" />
              Upload Your First PDF
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
