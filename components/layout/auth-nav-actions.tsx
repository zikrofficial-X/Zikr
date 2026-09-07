'use client';

import { useEffect, useState } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from './language-provider';

type AuthNavActionsProps = {
  initialUser: User | null;
  initialIsAdmin: boolean;
};

export function AuthNavActions({ initialUser, initialIsAdmin }: AuthNavActionsProps) {
  const { isEnglish } = useLanguage();
  const [user, setUser] = useState<User | null>(initialUser);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Never replace a valid server-rendered session with a false logout when
    // the browser bundle temporarily cannot access its auth state.
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient();
    let disposed = false;

    async function syncUser() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('[auth/nav] getSession failed; preserving current auth state');
          return;
        }

        const sessionUser = session?.user ?? null;
        if (sessionUser) {
          if (!disposed) setUser(sessionUser);
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', sessionUser.id)
            .maybeSingle();
          if (!disposed) setIsAdmin(profile?.role === 'admin');
          return;
        }

        // Confirm an empty client session with the Auth API before clearing
        // state; transient failures must never appear as a logout.
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.warn('[auth/nav] getUser failed; preserving current auth state');
          return;
        }

        if (!disposed) {
          setUser(currentUser ?? null);
          if (!currentUser) setIsAdmin(false);
        }
      } catch (error) {
        console.warn('[auth/nav] auth sync failed; preserving current auth state', error);
      }
    }

    void syncUser();

    const handleResume = () => {
      void syncUser();
    };

    window.addEventListener('pageshow', handleResume);
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      // Only an explicit SIGNED_OUT event may clear the navigation state.
      // Refresh/recovery events without a session are not treated as logout.
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        void syncUser();
      }
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
      window.removeEventListener('pageshow', handleResume);
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, []);

  if (!user) {
    return (
      <Button href="/auth/login" className="text-sm">
        {isEnglish ? 'Sign in' : 'تسجيل الدخول'}
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" href="/profile" className="text-sm">
        {isEnglish ? 'My profile' : 'الملف الشخصي'}
      </Button>
      {isAdmin && (
        <Button variant="ghost" href="/admin" className="text-sm">
          {isEnglish ? 'Admin' : 'الأدمن'}
        </Button>
      )}
      <form action={logoutAction}>
        <Button variant="secondary" type="submit" className="text-sm">
          {isEnglish ? 'Sign out' : 'تسجيل الخروج'}
        </Button>
      </form>
    </>
  );
}
