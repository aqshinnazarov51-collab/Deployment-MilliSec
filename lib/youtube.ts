function seconds(value: string): number | undefined {
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match || !match[0]) return undefined;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

export function youtubeEmbedUrl(value: string): string {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const id = host === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0]
      : url.pathname.startsWith("/shorts/")
        ? url.pathname.split("/")[2]
        : url.searchParams.get("v") ?? url.pathname.match(/^\/embed\/([^/]+)/)?.[1];
    if (!id) return value;
    const start = seconds(url.searchParams.get("t") ?? url.searchParams.get("start") ?? "");
    return `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`;
  } catch {
    return value;
  }
}
