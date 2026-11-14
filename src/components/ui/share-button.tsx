"use client";

import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShareButtonProps = {
  title: string;
  text: string;
  label: string;
  sharedLabel: string;
  copiedLabel: string;
  errorLabel: string;
};

type ShareStatus = "idle" | "shared" | "copied" | "error";

export function ShareButton({
  title,
  text,
  label,
  sharedLabel,
  copiedLabel,
  errorLabel,
}: ShareButtonProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");

  const handleShare = async () => {
    setStatus("idle");
    const url = window.location.href;
    const clipboardText = [text.trim(), url].filter(Boolean).join("\n\n");

    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({ title, text, url, dialogTitle: title });
      } else if (typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
      } else if (typeof navigator.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(clipboardText);
        setStatus("copied");
        return;
      } else {
        throw new Error("No supported share or clipboard API is available.");
      }

      setStatus("shared");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      try {
        if (typeof navigator.clipboard?.writeText !== "function") {
          throw new Error("Clipboard API is unavailable.");
        }
        await navigator.clipboard.writeText(clipboardText);
        setStatus("copied");
      } catch {
        setStatus("error");
      }
    }
  };

  const statusMessage =
    status === "shared"
      ? sharedLabel
      : status === "copied"
        ? copiedLabel
        : status === "error"
          ? errorLabel
          : null;

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleShare}>
        <Share2 className="h-4 w-4" />
        {label}
      </Button>
      {statusMessage ? (
        <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {statusMessage}
        </span>
      ) : null}
    </div>
  );
}
