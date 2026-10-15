function seconds(value: string): number | undefined {
  if (/^\d+$/.test(value)) {
    const result = Number(value);
    return Number.isSafeInteger(result) && result > 0 && result <= 86_400 ? result : undefined;
  }

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match || !match[0]) return undefined;
  const result = Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  return Number.isSafeInteger(result) && result > 0 && result <= 86_400 ? result : undefined;
}

function parseYouTubeVideo(value: string) {
  if (!value || value.length > 2048) return null;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port) return null;

    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    let id: string | null = null;

    if (host === "youtu.be" && parts.length === 1) {
      id = parts[0];
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (parts.length === 2 && ["embed", "shorts", "live"].includes(parts[0])) id = parts[1];
    } else if (["youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host) && parts.length === 2 && parts[0] === "embed") {
      id = parts[1];
    }

    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    const start = seconds(url.searchParams.get("t") ?? url.searchParams.get("start") ?? "");
    return { id, start };
  } catch {
    return null;
  }
}

export function isSupportedYouTubeUrl(value: string) {
  return parseYouTubeVideo(value) !== null;
}

export function youtubeEmbedUrl(value: string): string {
  const video = parseYouTubeVideo(value);
  if (!video) return "";
  return `https://www.youtube-nocookie.com/embed/${video.id}${video.start ? `?start=${video.start}` : ""}`;
}
