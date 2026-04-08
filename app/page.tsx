"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BookOpen,
  Upload,
  Brain,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            StudyForge
          </span>
        </div>
        <button
          onClick={signInWithGoogle}
          className="btn-secondary text-sm"
          id="sign-in-top-button"
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="animate-fade-in-up">


          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--foreground)] leading-[1.1] mb-6">
            Study smarter,
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              not harder
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your lecture slides and generate flashcards and quizzes
            instantly. Track your progress with spaced repetition.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={signInWithGoogle}
              className="btn-primary text-lg px-8 py-4 flex items-center gap-3 w-full sm:w-auto justify-center"
              id="get-started-button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Get Started with Google
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {[
            {
              icon: <Upload className="w-7 h-7" />,
              title: "Upload PDF",
              desc: "Drop your lecture slides, syllabus, or notes. We extract the text instantly.",
              gradient: "from-indigo-500/20 to-blue-500/20",
              border: "border-indigo-500/20",
              iconColor: "text-indigo-400",
            },
            {
              icon: <Brain className="w-7 h-7" />,
              title: "Instant Study Materials",
              desc: "Automatically extracts 10 flashcards and 5 quiz questions tailored to your content.",
              gradient: "from-purple-500/20 to-pink-500/20",
              border: "border-purple-500/20",
              iconColor: "text-purple-400",
            },
            {
              icon: <TrendingUp className="w-7 h-7" />,
              title: "Spaced Repetition",
              desc: "SM-2 algorithm surfaces cards you struggle with more often. Build lasting memory.",
              gradient: "from-amber-500/20 to-orange-500/20",
              border: "border-amber-500/20",
              iconColor: "text-amber-400",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`glass glass-hover p-7 bg-gradient-to-br ${feature.gradient} border ${feature.border}`}
            >
              <div className={`${feature.iconColor} mb-4`}>{feature.icon}</div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <h2 className="text-3xl font-bold text-center text-[var(--foreground)] mb-16">
          How it works
        </h2>
        <div className="space-y-8">
          {[
            { step: "01", title: "Upload your PDF", desc: "Lecture slides, textbook chapters, or syllabi", icon: <Upload className="w-5 h-5" /> },
            { step: "02", title: "Generate study sets", desc: "Flashcards and MCQs crafted from your content", icon: <Zap className="w-5 h-5" /> },
            { step: "03", title: "Study with spaced repetition", desc: "Cards you miss come back more often", icon: <Brain className="w-5 h-5" /> },
            { step: "04", title: "Track your progress", desc: "Dashboard with streaks, accuracy, and growth", icon: <TrendingUp className="w-5 h-5" /> },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-5 glass p-5 border border-[var(--surface-border)]"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                {item.icon}
              </div>
              <div>
                <span className="text-xs text-indigo-400 font-mono uppercase tracking-wider">
                  Step {item.step}
                </span>
                <h3 className="text-base font-semibold text-[var(--foreground)] mt-1">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20 text-center">
        <div className="glass p-10 border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-3">
            Ready to ace your exams?
          </h2>
          <p className="text-[var(--foreground-secondary)] mb-6">
            Start generating study materials in seconds.
          </p>
          <button
            onClick={signInWithGoogle}
            className="btn-primary text-lg px-8 py-4 flex items-center gap-2 mx-auto"
            id="cta-get-started-button"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--surface-border)] py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[var(--foreground-muted)]">
          © {new Date().getFullYear()} StudyForge. Built with AI.
        </div>
      </footer>
    </div>
  );
}
