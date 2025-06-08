import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Service‐role client to bypass Storage RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // 1) authenticate user
  const supabase = createRouteHandlerClient<Database>({ cookies, headers });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) list the exact folder you upload into
  const folder = `${user.id}/videos`;
  const { data: files, error } = await supabaseAdmin
    .storage
    .from('final-videos')
    .list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('List error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3) build public URLs
  const videos = files.map((f) => {
    const { data } = supabaseAdmin
      .storage
      .from('final-videos')
      .getPublicUrl(`${folder}/${f.name}`);
    return data.publicUrl;
  });

  return NextResponse.json({ videos });
}
