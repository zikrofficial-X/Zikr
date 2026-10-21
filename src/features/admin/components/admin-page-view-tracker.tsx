"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AdminPageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname?.startsWith("/admin")) return;
    void fetch("/api/admin/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);
  return null;
}
