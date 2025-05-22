// src/app/api/clips/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies, headers } from 'next/headers'
import type { Database } from '@/types/supabase'

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const picks: T[] = []
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    picks.push(copy.splice(idx, 1)[0])
  }
  return picks
}

export async function GET(req: Request) {
  const url    = new URL(req.url)
  const rawCat = url.searchParams.get('category') || ''
  // Normalize to match folder names: lowercase, strip non-alphanumerics
  const category = rawCat.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  const folder   = `assets/clips/${category}`

  // Your Supabase URL (ensure NEXT_PUBLIC_SUPABASE_URL in .env.local)
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Server misconfiguration: missing SUPABASE_URL' },
      { status: 500 }
    )
  }

  const supabase = createRouteHandlerClient<Database>({ cookies, headers })

  console.log('Listing folder:', folder)
  const { data: files, error } = await supabase.storage
    .from('video-assets')
    .list(folder, { limit: 1000 })

  if (error) {
    console.error('Storage.list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  console.log(`Found ${files?.length || 0} files in`, folder)

  if (!files || files.length === 0) {
    return NextResponse.json({ clips: [] })
  }

  // Manually build the public URLs
  const publicBase = baseUrl.replace(/\/$/, '') +
    `/storage/v1/object/public/video-assets/`
  const allUrls = files.map((f) => {
    const path = `${folder}/${f.name}`
    // Note: encodeURI so spaces or special chars are safe
    return publicBase + encodeURI(path)
  })

  const picks = pickRandom(allUrls, 3)
  return NextResponse.json({ clips: picks })
}
