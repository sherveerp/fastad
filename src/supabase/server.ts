// src/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export function createClient() {
  return createServerActionClient<Database>({ cookies });
}
