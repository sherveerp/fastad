// src/app/components/subscription-check.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface SubscriptionCheckProps {
  children: React.ReactNode;
}

export default async function SubscriptionCheck({
  children,
}: SubscriptionCheckProps) {
  // Server Component: can use next/headers and navigation
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no user, kick them to sign-in
  if (!session?.user) {
    redirect('/sign-in');
  }

  // For now we’re not gating by subscription—everyone signed in is allowed
  return <>{children}</>;
}
