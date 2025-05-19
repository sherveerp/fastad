import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createPexelsClient, Video } from 'pexels';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PEXELS_KEY         = process.env.PEXELS_API_KEY!;

// 1. Initialize Supabase (service role)
const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 2. Initialize Pexels
const pexels = createPexelsClient(PEXELS_KEY);

/**
 * Fetches up to `perPage` videos for a given Pexels search term,
 * uploads each to your Supabase bucket, and inserts an `assets` record.
 */
async function seedCategoryFromPexels(category: string, perPage = 10) {
  console.log(`🌱 Seeding category: ${category}`);

  // Search Pexels videos
  const res = await pexels.videos.search({ query: category, per_page: perPage });
  const videos: Video[] = res.videos;

  for (const vid of videos) {
    try {
      // Pick the highest-resolution file URL
      const file = vid.video_files.sort((a, b) => b.width - a.width)[0];
      const fileBuffer = await axios
        .get<Buffer>(file.link, { responseType: 'arraybuffer' })
        .then(r => Buffer.from(r.data));

      // Generate a stable path in your bucket
      const remotePath = `assets/clips/${category}/${uuidv4()}.mp4`;

      // 3. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('video-assets')
        .upload(remotePath, fileBuffer, { 
          contentType: 'video/mp4',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`❌ Upload failed for ${file.link}`, uploadError);
        continue;
      }

      // 4. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('video-assets')
        .getPublicUrl(remotePath);

      // 5. Insert into your `assets` table
      const { error: dbError } = await supabase
        .from('assets')
        .insert({
          category,
          type: 'clip',
          url: publicUrl,
          weight: 1,
          metadata: {
            pexelsId: vid.id,
            width: file.width,
            height: file.height,
            duration: vid.duration
          }
        });

      if (dbError) {
        console.error(`❌ DB insert failed for ${publicUrl}`, dbError);
      } else {
        console.log(`✅ Seeded clip: ${publicUrl}`);
      }
    } catch (err) {
      console.error(`⚠️ Unexpected error for category=${category}:`, err);
    }
  }
}

async function main() {
  // seed multiple categories
  await seedCategoryFromPexels('sneakers', 8);
  await seedCategoryFromPexels('coffee shop', 6);
  await seedCategoryFromPexels('clothing store', 6);
}

main()
  .then(() => console.log('🎉 Done seeding Pexels assets'))
  .catch(console.error)
