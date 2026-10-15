"use client";

import Image from "next/image";
import { useState } from "react";

type Props = { src?: string | null; alt: string };

/** Keeps profile cards readable when third-party avatar URLs expire or reject image optimization. */
export function ResilientProfileImage({ src, alt }: Props) {
  const [failed, setFailed] = useState(false);
  const source = !failed && src?.trim() ? src.trim() : "/branding/logo-gold.png";

  return (
    <Image
      src={source}
      alt={alt}
      fill
      sizes="(max-width: 1024px) 100vw, 50vw"
      className={source === "/branding/logo-gold.png" ? "object-contain p-8 opacity-90" : "object-contain p-8"}
      onError={() => {
        if (!failed) setFailed(true);
      }}
      unoptimized={source !== "/branding/logo-gold.png"}
    />
  );
}
