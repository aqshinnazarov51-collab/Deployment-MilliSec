"use client";

import { useEffect, useState } from "react";
import { Flame, Target } from "lucide-react";

type HabitStats = {
  today: number;
  currentStreak: number;
  bestStreak: number;
  week: { label: string; count: number }[];
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function LearningHabitCard({ completedAt }: { completedAt: string[] }) {
  const [stats, setStats] = useState<HabitStats | null>(null);

  useEffect(() => {
    const counts = new Map<string, number>();
    for (const value of completedAt) {
      const key = dateKey(new Date(value));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const today = new Date();
    const todayKey = dateKey(today);
    const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (!counts.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
    let currentStreak = 0;
    while (counts.has(dateKey(cursor))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const keys = [...counts.keys()].sort();
    let bestStreak = 0;
    let running = 0;
    let previous: Date | null = null;
    for (const key of keys) {
      const [year, month, day] = key.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      if (previous) {
        const next = new Date(previous);
        next.setDate(next.getDate() + 1);
        running = dateKey(next) === key ? running + 1 : 1;
      } else running = 1;
      bestStreak = Math.max(bestStreak, running);
      previous = date;
    }

    const week = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
      return { label: date.toLocaleDateString("en-US", { weekday: "short" }), count: counts.get(dateKey(date)) ?? 0 };
    });
    setStats({ today: counts.get(todayKey) ?? 0, currentStreak, bestStreak, week });
  }, [completedAt]);

  const todayCount = stats?.today ?? 0;
  return (
    <section className="panel" aria-label="Daily learning goal and streak">
      <div className="eyebrow"><Target size={14} /> Your learning habit</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 22, alignItems: "center", marginTop: 12 }}>
        <div>
          <strong style={{ display: "block", fontSize: 15 }}>Daily goal: finish one lesson</strong>
          <p className="small-note" style={{ margin: "4px 0 9px" }}>{todayCount} of 1 lesson completed today</p>
          <div className="progress-track" style={{ height: 9, marginTop: 0 }}>
            <span style={{ width: `${Math.min(100, todayCount * 100)}%` }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={25} color="#e28a43" />
            <div><strong style={{ display: "block", fontSize: 18 }}>{stats?.currentStreak ?? 0} day{stats?.currentStreak === 1 ? "" : "s"}</strong><span className="small-note">Current streak</span></div>
          </div>
          <div style={{ textAlign: "right" }}><strong style={{ display: "block", fontSize: 16 }}>{stats?.bestStreak ?? 0} days</strong><span className="small-note">Best streak</span></div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 9, marginTop: 16, justifyContent: "space-between" }} aria-label="Completed lessons in the last seven days">
        {(stats?.week ?? Array.from({ length: 7 }, (_, index) => ({ label: "···", count: 0 }))).map((day, index) => (
          <div key={`${day.label}-${index}`} title={`${day.label}: ${day.count} lessons`} style={{ display: "grid", justifyItems: "center", gap: 4 }}>
            <span style={{ width: 27, height: 27, borderRadius: 9, display: "grid", placeItems: "center", background: day.count ? "#dff5e9" : "var(--wash)", color: day.count ? "#30865b" : "var(--muted)", fontSize: 11, fontWeight: 700 }}>{day.count || "·"}</span>
            <span className="small-note" style={{ fontSize: 9 }}>{day.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
