// scripts/seed-pexels.ts
import 'dotenv/config'
import { spawn } from 'child_process'
import { tmpdir } from 'os'
import { join as joinPath } from 'path'
import fs from 'fs/promises'
import axios from 'axios'
import { Buffer } from 'buffer'
import { v4 as uuidv4 } from 'uuid'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createPexelsClient, Video } from 'pexels'

//───────────────────────────────────────────────────────────────────────────────
//  CONFIG
//───────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL         = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const PEXELS_KEY           = process.env.PEXELS_API_KEY!
const BUCKET_ID            = 'video-assets'
const THRESHOLD_BYTES      = 500 * 1024 * 1024  // 500 MB

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PEXELS_KEY) {
  throw new Error('Missing one of SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or PEXELS_API_KEY')
}

//───────────────────────────────────────────────────────────────────────────────
//  CLIENTS
//───────────────────────────────────────────────────────────────────────────────
const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const pexels   = createPexelsClient(PEXELS_KEY)

//───────────────────────────────────────────────────────────────────────────────
//  HELPERS
//───────────────────────────────────────────────────────────────────────────────
async function fetchBuffer(url: string): Promise<Buffer> {
  const data = await axios
    .get<ArrayBuffer>(url, { responseType: 'arraybuffer' })
    .then(r => r.data)
  return Buffer.from(data)
}

// Sum up all file sizes in the bucket
async function getBucketUsageBytes(): Promise<number> {
  const { data: files, error } = await supabase.storage
    .from(BUCKET_ID)
    .list('', { limit: 10_000 })
  if (error || !files) {
    throw new Error(`Failed to list bucket: ${error?.message}`)
  }
  return files.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0)
}

// Pick best clip ≤1280 px wide
function pickResolutionFile(vid: Video, maxWidth = 1280) {
  const c = vid.video_files
    .filter(f => f.width <= maxWidth)
    .sort((a, b) => b.width - a.width)
  return c.length ? c[0] : vid.video_files[0]
}

// Transcode: trim to 5 s, remove audio, scale/pad to 720×1280 vertical
async function transcodeVideo(input: Buffer): Promise<Buffer> {
  const inPath  = joinPath(tmpdir(), `in-${uuidv4()}.mp4`)
  const outPath = joinPath(tmpdir(), `out-${uuidv4()}.mp4`)
  await fs.writeFile(inPath, input)

  await new Promise<void>((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-y',
      '-i', inPath,
      '-t', '5',
      '-vf',
        'scale=720:1280:force_original_aspect_ratio=decrease,' +
        'pad=720:1280:(ow-iw)/2:(oh-ih)/2',
      '-an',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      outPath,
    ])
    ff.stderr.on('data', () => {})  // optional: log
    ff.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))
  })

  const buf = await fs.readFile(outPath)
  await fs.unlink(inPath).catch(() => {})
  await fs.unlink(outPath).catch(() => {})
  return buf
}

//───────────────────────────────────────────────────────────────────────────────
//  SEEDING
//───────────────────────────────────────────────────────────────────────────────
async function seedCategoryFromPexels(category: string, perPage = 10) {
  console.log(`--- Seeding category: ${category} (${perPage} clips) ---`)

  // 1️⃣ Check bucket usage
  const used = await getBucketUsageBytes()
  console.log(`🔍 Bucket usage: ${(used/1024/1024).toFixed(1)} MB`)
  if (used >= THRESHOLD_BYTES) {
    console.log(`⚠️  Usage ≥ 500 MB—skipping category ${category}`)
    return
  }

  // 2️⃣ Fetch Pexels videos
  const res    = await pexels.videos.search({ query: category, per_page: perPage })
  const videos = res.videos

  for (const vid of videos) {
    // re-check before each upload
    const before = await getBucketUsageBytes()
    if (before >= THRESHOLD_BYTES) {
      console.log(`⚠️  Hit 500 MB limit mid-category—stopping`)
      break
    }

    try {
      // 3️⃣ Pick & download clip
      const file = pickResolutionFile(vid)
      console.log(`   🎥 [${vid.id}] ${file.width}×${file.height}, ${vid.duration}s`)
      const rawBuf = await fetchBuffer(file.link)

      // 4️⃣ Transcode to 5 s vertical/no-audio
      const finalBuf = await transcodeVideo(rawBuf)

      // 5️⃣ Upload
      const remote = `assets/clips/${category}/${uuidv4()}.mp4`
      const { error: upErr } = await supabase.storage
        .from(BUCKET_ID)
        .upload(remote, finalBuf, {
          contentType: 'video/mp4',
          cacheControl: '3600',
          upsert: false,
        })
      if (upErr) {
        console.error(`❌ Upload failed for ${vid.id}`, upErr)
        continue
      }

      // 6️⃣ Record in `assets` table
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_ID)
        .getPublicUrl(remote)

      const { error: dbErr } = await supabase
        .from('assets')
        .insert({
          category,
          type: 'clip',
          url: publicUrl,
          weight: 1,
          metadata: {
            pexelsId: vid.id,
            width:    720,
            height:   1280,
            duration: Math.min(vid.duration, 5),
          },
        })
      if (dbErr) {
        console.error(`❌ DB insert failed for ${publicUrl}`, dbErr)
      } else {
        console.log(`✅ Seeded clip: ${publicUrl}`)
      }
    } catch (err) {
      console.error(`⚠️ Error for VID ${vid.id}:`, err)
    }
  }
}

//───────────────────────────────────────────────────────────────────────────────
//  MAIN LOOP
//───────────────────────────────────────────────────────────────────────────────
async function main() {
  const categories: { name: string; count: number }[] = [
    { name: 'sneakers',          count: 15 },
    { name: 'coffee shop',       count: 15 },
    { name: 'clothing store',    count: 15 },
    { name: 'pizza restaurant',  count: 15 },
    { name: 'bakery',            count: 15 },
    { name: 'real estate',       count: 15 },
    { name: 'pet store',         count: 15 },
    { name: 'tech store',        count: 15 },
    { name: 'gym',               count: 15 },
    { name: 'salon',             count: 15 },
    { name: 'yoga studio',       count: 15 },
    { name: 'barbershop',        count: 15 },
    { name: 'bookstore',         count: 15 },
    { name: 'electronics store', count: 15 },
    { name: 'florist',           count: 15 },
    { name: 'plumber',           count: 15 },
    { name: 'electrician',       count: 15 },
    { name: 'grocery store',     count: 15 },
    { name: 'burgers',           count: 15 },
    { name: 'indian restaurant', count: 15 },
    { name: 'italian restaurant',count: 15 },
  ]

  for (const { name, count } of categories) {
    await seedCategoryFromPexels(name, count)
  }
}

main()
  .then(() => console.log('🎉 Done seeding all categories'))
  .catch(console.error)
