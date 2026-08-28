'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const { isEnglish } = useLanguage();
  const [user, setUser] = useState<User | null>(initialUser);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If the browser bundle cannot see Supabase configuration, preserve the
    // server-rendered auth state instead of replacing it with a false logout.
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient();

    async function syncUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (!currentUser) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle();

      setIsAdmin(profile?.role === 'admin');
    }

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
        return;
      }
      void syncUser();
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

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
