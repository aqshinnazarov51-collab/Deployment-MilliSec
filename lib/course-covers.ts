import { getCatalogContent } from "@/lib/catalog-content";

export const courseCoverChoices = [
  { label: "Programming workspace", url: "⌘|#edf0ff" },
  { label: "Web development", url: "</>|#e6f6f0" },
  { label: "DevOps", url: "▦|#e9f5ff" },
  { label: "Mobile development", url: "▣|#f1eaff" },
] as const;

export function getCourseCover(slug: string) {
  return getCatalogContent(slug)?.cover ?? "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=85";
}
