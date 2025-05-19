
'use client';

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export default function createBrowserClient() {
  return createPagesBrowserClient<Database>();
}


