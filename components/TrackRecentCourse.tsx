"use client";
import { useEffect } from "react";

export function TrackRecentCourse({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  useEffect(() => {
    fetch("/api/recent-course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, courseTitle }),
    }).catch(() => {});
  }, [courseId, courseTitle]);

  return null;
}
