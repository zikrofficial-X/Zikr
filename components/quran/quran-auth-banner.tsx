"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  AuthChangeEvent,
  Session,
  UserResponse,
} from "@supabase/supabase-js";
import Link from "next/link";
import { ReadingProgressCard } from "@/components/quran/reading-progress-card";
import { useLanguage } from "@/components/layout/language-provider";

/**
 * Renders client-side auth-aware UI for the Quran page header.
 * - Authenticated users: shows the ReadingProgressCard (continues reading).
 * - Unauthenticated users: shows the "إنشاء حساب مجاني" CTA.
 * - Resolves client-side to avoid hydration mismatch with SSR session state.
 */
export function QuranAuthBanner() {
  // null = not yet resolved, true/false = resolved
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { isEnglish, dir } = useLanguage();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }: UserResponse) => {
      setIsAuthenticated(!!data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setIsAuthenticated(!!session?.user);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Reserve the header slot while auth resolves so the page does not reflow.
  if (isAuthenticated === null) {
    return <div className="min-h-[88px] w-full max-w-sm" aria-hidden="true" />;
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-[88px] w-full max-w-sm">
        <ReadingProgressCard />
      </div>
    );
  }

  return (
    <div className="min-h-[88px] w-full max-w-sm flex items-center" dir={dir}>
      <Link
        href="/auth/register"
        className="inline-flex items-center justify-center rounded-xl bg-brand-gold/10 border border-brand-gold/20 px-6 py-2 text-sm font-bold text-brand-gold hover:bg-brand-gold/20 transition-colors"
      >
        {isEnglish ? "Create a free account to save your progress" : "أنشئ حساباً مجانياً لحفظ تقدمك"}
      </Link>
    </div>
  );
}
