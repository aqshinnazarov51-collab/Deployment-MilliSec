export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;

  try {
    const parsedOrigin = new URL(origin);
    if ((parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") ||
        parsedOrigin.username || parsedOrigin.password || parsedOrigin.pathname !== "/" ||
        parsedOrigin.search || parsedOrigin.hash) {
      return false;
    }

    const requestUrl = new URL(request.url);
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
    const expectedProtocol = forwardedProtocol ? `${forwardedProtocol}:` : requestUrl.protocol;
    if (parsedOrigin.protocol !== expectedProtocol) return false;

    const hosts = [
      request.headers.get("host"),
      request.headers.get("x-forwarded-host"),
    ]
      .flatMap((value) => value ? value.split(",") : [])
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (!hosts.length) hosts.push(requestUrl.host.toLowerCase());

    return hosts.includes(parsedOrigin.host.toLowerCase());
  } catch {
    return false;
  }
}
