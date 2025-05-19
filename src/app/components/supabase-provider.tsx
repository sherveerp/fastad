// src/components/supabase-provider.tsx
'use client';

import createBrowserClient from '@/supabase/client';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import type { Session } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { useState } from 'react';

export function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  const [supabaseClient] = useState(() =>
    createBrowserClient()
  );

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
}
