// src/app/api/storyboard/route.ts
import { NextResponse } from 'next/server'
import { generateStoryboard, Storyboard } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { businessName, category, clipUrls } = await req.json()
    if (!Array.isArray(clipUrls) || clipUrls.length === 0) {
      return NextResponse.json({ error: 'No clips provided' }, { status: 400 })
    }

    // generateStoryboard now returns a Storyboard object
    const sb: Storyboard = await generateStoryboard({ businessName, category, clipUrls })
    return NextResponse.json({ storyboard: sb })
  } catch (err: any) {
    console.error('Storyboard route error', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
