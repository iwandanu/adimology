'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AppUser {
  id: string;
  email: string | null;
}

interface UserContextValue {
  user: AppUser | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

function mapUser(user: User | null): AppUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(mapUser(data.user ?? null));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null));
    });

    return () => {
      mounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fire-and-forget logging of user profile / last seen
    fetch('/api/usage/log-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    }).catch((err) => {
      console.error('Failed to log user profile', err);
    });
  }, [user?.id, user?.email]);

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
}

export function useAppUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useAppUser must be used within a UserProvider');
  }
  return ctx;
}

