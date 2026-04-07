"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { LogOut, BookOpen, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--surface-border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              StudyForge
            </span>
          </Link>

          {/* Right side */}
          {user && (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="btn-ghost flex items-center gap-2 text-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="flex items-center gap-3 pl-4 border-l border-[var(--surface-border)]">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-8 h-8 rounded-full ring-2 ring-[var(--surface-border)]"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="text-sm text-[var(--foreground-secondary)] hidden sm:block">
                  {user.displayName?.split(" ")[0]}
                </span>
                <button
                  onClick={signOut}
                  className="btn-ghost p-2"
                  title="Sign out"
                  id="sign-out-button"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
