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
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
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

  // Search & Pagination & Bulk Select
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const ITEMS_PER_PAGE = 9;

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

  const handleUploadComplete = async (docsData: Array<{
    flashcards: any[];
    mcQuestions: any[];
    crQuestions?: any[];
    fileName: string;
    textPreview: string;
  }>): Promise<Array<{ id: string; fileName: string }>> => {
    if (!user) return [];

    try {
      const createdDocs = [];
      for (const data of docsData) {
        const docSetPayload: Omit<DocumentSet, "id"> = {
          userId: user.uid,
          fileName: data.fileName,
          uploadedAt: new Date().toISOString(),
          flashcards: data.flashcards,
          mcQuestions: data.mcQuestions,
          textPreview: data.textPreview,
        };
        if (data.crQuestions && data.crQuestions.length > 0) {
          docSetPayload.crQuestions = data.crQuestions;
        }
        const docId = await saveDocumentSet(user.uid, docSetPayload);
        createdDocs.push({ id: docId, fileName: data.fileName });
      }

      await loadDashboard();
      return createdDocs;
    } catch (error) {
      console.error("Error saving document:", error);
      return [];
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!user || selectedIds.size === 0) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} documents?`);
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      const { deleteDocumentSet } = await import("@/lib/firestore");
      for (const id of Array.from(selectedIds)) {
        await deleteDocumentSet(user.uid, id);
      }
      setSelectedIds(new Set());
      setIsSelectMode(false);
      await loadDashboard();
    } catch (error) {
      console.error("Failed to perform bulk delete:", error);
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2 shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Your Documents
          </h2>
          {documents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              
              {isSelectMode ? (
                 <div className="flex gap-2 items-center w-full sm:w-auto">
                   <button 
                     onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }} 
                     className="btn-secondary text-sm px-3 py-2 h-auto flex-1 sm:flex-none"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={() => {
                       if (selectedIds.size === documents.length) {
                         setSelectedIds(new Set());
                       } else {
                         setSelectedIds(new Set(documents.map(d => d.id)));
                       }
                     }} 
                     className="btn-secondary text-sm px-3 py-2 h-auto flex-1 sm:flex-none whitespace-nowrap"
                   >
                     {selectedIds.size === documents.length ? "Deselect All" : "Select All"}
                   </button>
                   <button 
                     onClick={handleBulkDelete} 
                     disabled={selectedIds.size === 0} 
                     className="btn-primary text-sm px-3 py-2 h-auto bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 flex gap-2 items-center flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                   >
                     <Trash2 className="w-4 h-4"/> Delete {selectedIds.size}
                   </button>
                 </div>
              ) : (
                <button 
                  onClick={() => setIsSelectMode(true)} 
                  className="btn-secondary text-sm px-4 py-2 h-auto whitespace-nowrap hidden sm:flex"
                >
                  Select
                </button>
              )}

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] text-sm rounded-lg pl-9 pr-4 py-2 border border-[var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="glass p-12 text-center border border-[var(--surface-border)]">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--foreground-muted)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No documents found
            </h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              {searchQuery ? "Try adjusting your search query." : "Upload your first PDF to start generating study materials."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="btn-primary inline-flex items-center gap-2"
                id="empty-state-upload-button"
              >
                <Plus className="w-4 h-4" />
                Upload Your First PDF
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children mb-8">
              {paginatedDocuments.map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc}
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.has(doc.id)}
                  onToggleSelect={handleToggleSelect} 
                  onRename={async (id, newName) => {
                    if (!user) return;
                    const { renameDocument } = await import("@/lib/firestore");
                    const finalName = newName.toLowerCase().endsWith(".pdf") ? newName : `${newName}.pdf`;
                    await renameDocument(user.uid, id, finalName);
                    await loadDashboard(); // refresh
                  }}
                  onDelete={async (id) => {
                    if (!user) return;
                    const { deleteDocumentSet } = await import("@/lib/firestore");
                    await deleteDocumentSet(user.uid, id);
                    await loadDashboard();
                  }}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-[var(--foreground-muted)]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
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
