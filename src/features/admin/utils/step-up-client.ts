"use client";

export function redirectToAdminStepUp(nextPath: unknown): boolean {
  if (typeof window === "undefined" || typeof nextPath !== "string") return false;
  try {
    const target = new URL(nextPath, window.location.origin);
    if (target.origin !== window.location.origin || target.pathname !== "/admin/security/step-up") return false;
    window.location.assign(target.toString());
    return true;
  } catch {
    return false;
  }
}
