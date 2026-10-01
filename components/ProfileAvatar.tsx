"use client";

import { useState } from "react";

export function ProfileAvatar({ src, name, className }: { src: string | null | undefined; name: string; className: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className={className}>
      {src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : initials}
    </span>
  );
}
