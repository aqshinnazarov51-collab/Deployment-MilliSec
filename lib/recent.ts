import "server-only";

export type RecentCourse = {
  courseId: string;
  courseTitle: string;
  viewedAt: number;
};

export function serialize(value: RecentCourse) {
  return JSON.stringify(value);
}

export function deserialize(str: string) {
  const value: unknown = JSON.parse(str);
  if (!value || typeof value !== "object") return null;

  const recent = value as Partial<RecentCourse>;
  if (typeof recent.courseId !== "string" || recent.courseId.length > 100 ||
      typeof recent.courseTitle !== "string" || recent.courseTitle.length > 200 ||
      typeof recent.viewedAt !== "number" || !Number.isFinite(recent.viewedAt)) {
    return null;
  }

  return { courseId: recent.courseId, courseTitle: recent.courseTitle, viewedAt: recent.viewedAt };
}
