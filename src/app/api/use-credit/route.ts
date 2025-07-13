// src/app/api/use-credit/route.ts

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies, headers } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function POST() {
  const supabase = createRouteHandlerClient<Database>({ cookies, headers })

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use a stored procedure (recommended) or just update atomically
  const { data, error } = await supabase.rpc('use_one_credit', {
    p_user_id: user.id
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, remaining: data })
}
