"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  color?: "primary" | "accent" | "success";
}

const colorMap = {
  primary: {
    gradient: "from-indigo-500/20 to-purple-500/20",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
    glow: "shadow-indigo-500/10",
  },
  accent: {
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/20",
    text: "text-amber-400",
    glow: "shadow-amber-500/10",
  },
  success: {
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
};

export default function StatsCard({
  icon,
  value,
  label,
  trend,
  color = "primary",
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`glass glass-hover p-5 bg-gradient-to-br ${colors.gradient} border ${colors.border}`}
    >
      <div className="flex items-start justify-between">
        <div className={`${colors.text}`}>{icon}</div>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold text-[var(--foreground)]">{value}</p>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">{label}</p>
      </div>
    </div>
  );
}
