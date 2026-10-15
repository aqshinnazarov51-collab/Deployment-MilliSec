"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";

function profilePhotoSource(value: string | null | undefined) {
  if (!value) return "";
  const localMatch = value.match(/^\/(?:api\/)?uploads\/([a-f0-9-]{36}\.(?:jpg|png|webp|gif))$/i);
  if (localMatch) return `/api/uploads/${localMatch[1]}`;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.href : "";
  } catch {
    return "";
  }
}

export function AvatarUpload({ initialUrl, name }: { initialUrl: string | null; name: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(() => profilePhotoSource(initialUrl));
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Choose an image under 2 MB.");
      setMessageIsError(true);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    setImageFailed(false);
    setMessage("Uploading…");
    setMessageIsError(false);

    try {
      const data = new FormData();
      data.set("avatar", file);
      const response = await fetch("/api/upload/avatar", { method: "POST", body: data });
      const result = await response.json().catch(() => ({} as { error?: string; url?: string }));
      URL.revokeObjectURL(preview);
      if (!response.ok) throw new Error(result.error ?? `Upload failed (HTTP ${response.status}). Please try again.`);
      const safeUrl = typeof result.url === "string" ? profilePhotoSource(result.url) : "";
      if (!safeUrl.startsWith("/api/uploads/")) throw new Error("The server returned an invalid upload response. Please try again.");

      setUrl(`${safeUrl}?v=${Date.now()}`);
      setImageFailed(false);
      setMessage("Photo saved");
      setMessageIsError(false);
    } catch (error) {
      URL.revokeObjectURL(preview);
      setUrl(profilePhotoSource(initialUrl));
      setImageFailed(false);
      setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
      setMessageIsError(true);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setMessage("Removing…");
    setMessageIsError(false);
    try {
      const response = await fetch("/api/upload/avatar", { method: "DELETE" });
      const result = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(result.error ?? "Could not remove photo");
      setUrl("");
      setImageFailed(false);
      setMessage("Photo removed");
      setMessageIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove photo");
      setMessageIsError(true);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 15, margin: "16px 0 24px" }}>
      <div style={{ width: 74, height: 74, flex: "0 0 74px", borderRadius: "50%", background: "#edf0ff", overflow: "hidden", display: "grid", placeItems: "center", fontSize: 22, color: "var(--brand)", fontWeight: 800 }}>
        {url && !imageFailed ? <img src={url} alt="" onError={() => setImageFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
      </div>
      <div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="button button-outline button-small" onClick={() => inputRef.current?.click()}>
            <Camera size={14} /> Change photo
          </button>
          {url && <button type="button" className="icon-button" aria-label="Remove photo" onClick={remove}><Trash2 size={14} /></button>}
        </div>
        <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => upload(event.target.files?.[0])} />
        <div role={messageIsError ? "alert" : "status"} aria-live={messageIsError ? "assertive" : "polite"} className="small-note" style={{ marginTop: 5 }}>{message || "JPG, PNG, WebP or GIF · up to 2 MB"}</div>
      </div>
    </div>
  );
}
