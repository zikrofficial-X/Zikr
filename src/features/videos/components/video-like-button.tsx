"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type LikeState = {
  likeCount: number;
  viewerLiked: boolean;
  authenticated: boolean;
};

type Props = { videoId: string };

export function VideoLikeButton({ videoId }: Props) {
  const [state, setState] = useState<LikeState>({
    likeCount: 0,
    viewerLiked: false,
    authenticated: false,
  });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/videos/" + encodeURIComponent(videoId) + "/like", {
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "تعذر تحميل الإعجابات.");
    setState({
      likeCount: Number(payload.likeCount ?? 0),
      viewerLiked: payload.viewerLiked === true,
      authenticated: payload.authenticated === true,
    });
  }, [videoId]);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal)
      .catch((error) => {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : "تعذر تحميل الإعجابات.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refresh]);

  const toggleLike = async () => {
    if (!state.authenticated) {
      setMessage("سجّل الدخول أولًا لتسجيل إعجابك بهذا الفيديو.");
      return;
    }
    if (pending) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/videos/" + encodeURIComponent(videoId) + "/like", {
        method: state.viewerLiked ? "DELETE" : "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "تعذر تحديث الإعجاب.");
      setState({
        likeCount: Number(payload.likeCount ?? 0),
        viewerLiked: payload.viewerLiked === true,
        authenticated: payload.authenticated === true,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تحديث الإعجاب.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void toggleLike()}
        disabled={loading || pending}
        aria-pressed={state.viewerLiked}
        className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 px-4 py-2 text-sm font-semibold text-brand-gold transition hover:bg-brand-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true">{state.viewerLiked ? "♥" : "♡"}</span>
        <span>{state.viewerLiked ? "أعجبك" : "أعجبني"}</span>
        <span className="tabular-nums">{state.likeCount.toLocaleString("ar")}</span>
      </button>
      {!state.authenticated ? (
        <Link href="/auth/login" className="text-xs text-brand-cream/60 underline underline-offset-4">
          سجّل الدخول للإعجاب
        </Link>
      ) : null}
      {message ? <p role="status" className="w-full text-xs text-brand-cream/60">{message}</p> : null}
    </div>
  );
}
