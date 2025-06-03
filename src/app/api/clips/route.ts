// src/app/api/clips/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies, headers } from 'next/headers'
import { distance } from 'fastest-levenshtein'
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

function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const rawCat = url.searchParams.get('category') || ''
  const normalizedCat = normalize(rawCat)

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  if (!baseUrl) {
    return NextResponse.json({ error: 'Missing SUPABASE_URL' }, { status: 500 })
  }

  const supabase = createRouteHandlerClient<Database>({ cookies, headers })

  const { data: allFolders, error: folderError } = await supabase.storage
    .from('video-assets')
    .list('assets/clips', { limit: 1000 })

  if (folderError) {
    console.error('Error listing folders:', folderError)
    return NextResponse.json({ error: folderError.message }, { status: 500 })
  }

  const folders = allFolders?.filter(f => f.name && !f.id?.includes('.')) || []
  if (folders.length === 0) {
    return NextResponse.json({ error: 'No folders found' }, { status: 404 })
  }

  // Find closest folder using Levenshtein distance
  let bestMatch = folders[0].name
  let bestScore = distance(normalize(bestMatch), normalizedCat)

  for (const folder of folders) {
    const score = distance(normalize(folder.name), normalizedCat)
    if (score < bestScore) {
      bestMatch = folder.name
      bestScore = score
    }
  }

  if (bestScore > 5) {
    return NextResponse.json({ clips: [], suggestion: null })
  }

  const folderPath = `assets/clips/${bestMatch}`
  const { data: files, error: fileError } = await supabase.storage
    .from('video-assets')
    .list(folderPath, { limit: 1000 })

  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 500 })
  }

  if (!files || files.length === 0) {
    return NextResponse.json({ clips: [], suggestion: bestMatch })
  }

  const publicBase = baseUrl.replace(/\/$/, '') + `/storage/v1/object/public/video-assets/`
  const allUrls = files.map(f => publicBase + encodeURI(`${folderPath}/${f.name}`))

  const picks = pickRandom(allUrls, 3)
  return NextResponse.json({ clips: picks, suggestion: bestMatch !== rawCat ? bestMatch : null })
}
