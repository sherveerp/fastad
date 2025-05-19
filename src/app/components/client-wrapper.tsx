'use client';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
import type { Session } from '@supabase/auth-helpers-nextjs';

interface ClientWrapperProps {
  children: React.ReactNode;
  session: {
    access_token: string;
    user: {
      id: string;
      email: string;
    };
  } | null;
}

export function ClientWrapper({ children, session }: ClientWrapperProps) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={session as Session}>
      {children}
    </SessionContextProvider>
  );
}
