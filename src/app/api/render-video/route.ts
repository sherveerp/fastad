import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { generateStoryboard } from '@/lib/gemini';
import { generateVoiceover } from '@/lib/elevenlabs';
import type { Database } from '@/types/supabase';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies, headers });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const businessName = formData.get('businessName') as string;
    const category = formData.get('category') as string;
    const font = formData.get('font') as string;
    const logoFile = formData.get('logo') as File | null;
    const clips = formData.getAll('clips') as string[];

    if (!clips.length) {
      return NextResponse.json({ error: 'No clips provided' }, { status: 400 });
    }

    // Upload logo (optional)
    let logoUrl = '';
    if (logoFile) {
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      const logoPath = `logos/${uuidv4()}-${logoFile.name}`;
      const { error: logoErr } = await supabase.storage
        .from('user-logos')
        .upload(logoPath, logoBuffer, { contentType: logoFile.type });
      if (!logoErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('user-logos')
          .getPublicUrl(logoPath);
        logoUrl = publicUrl;
      }
    }

    // Process and upload clips
    const processedClips: string[] = [];

    for (const clipUrl of clips) {
      const clipName = path.basename(clipUrl);
      const uuid = uuidv4();
      const baseName = `${uuid}-${clipName}`;
      const rawClipPath = path.resolve(`/tmp/${baseName}`);
      const finalClipPath = path.resolve(`/tmp/processed-${baseName}`);

      // Download clip
      const res = await fetch(clipUrl);
      if (!res.ok) throw new Error(`Failed to fetch clip: ${clipUrl}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(rawClipPath, buffer);

      // Preprocess clip
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i', rawClipPath,
          '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-movflags', '+faststart',
          '-y',
          finalClipPath,
        ]);

        ffmpeg.stderr.on('data', (chunk) =>
          console.error(`[ffmpeg stderr] ${chunk.toString()}`)
        );

        ffmpeg.on('close', async (code) => {
          if (code !== 0) {
            reject(new Error(`ffmpeg exited with code ${code}`));
            return;
          }

          try {
            const processedBuffer = await fs.readFile(finalClipPath);
            const supabaseKey = `clips/${baseName}`;
const { error: uploadErr } = await supabase.storage
  .from('processed-clips')
  .upload(supabaseKey, processedBuffer, {
    contentType: 'video/mp4',
    upsert: true, // allow overwriting if already exists
  });
            if (uploadErr) {
  console.error('❌ Supabase upload error:', uploadErr);
  console.error('👤 Upload attempted by user:', user);
  console.error('📦 Bucket:', 'processed-clips', 'Path:', supabaseKey);
  throw new Error('Failed to upload processed clip');
}


            const { data: { publicUrl } } = supabase.storage
              .from('processed-clips')
              .getPublicUrl(supabaseKey);

            processedClips.push(publicUrl);
            console.log('✅ Uploaded & using clip:', publicUrl);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    // Generate storyboard
    const storyboard = await generateStoryboard(businessName, category, processedClips);

    // Voiceover
    const voicePath = path.resolve(`/tmp/${uuidv4()}-voice.mp3`);
    await generateVoiceover(storyboard.voiceover, voicePath);
    const voiceBuffer = await fs.readFile(voicePath);
    const voiceKey = `voiceovers/voice-${uuidv4()}.mp3`;
    const { error: voiceErr } = await supabase.storage
      .from('voiceovers')
      .upload(voiceKey, voiceBuffer, { contentType: 'audio/mpeg' });
    if (voiceErr) throw new Error('Failed to upload voiceover');
    const { data: { publicUrl: voiceoverUrl } } = supabase.storage
      .from('voiceovers')
      .getPublicUrl(voiceKey);

    // Background music
    const musicKey = 'upbeat-funk-commercial-advertising-music-253434.mp3';
    const { data: { publicUrl: backgroundMusicUrl } } = supabase.storage
      .from('bg-music')
      .getPublicUrl(musicKey);
    if (!backgroundMusicUrl) throw new Error('Failed to get background music');

    // Render props
    const renderProps = {
      storyboard,
      font,
      logoUrl,
      voiceoverUrl,
      backgroundMusicUrl,
    };

    const outName = `out-${uuidv4()}.mp4`;
    const outPath = path.resolve(`./public/videos/${outName}`);
    const propsPath = path.resolve(`./tmp/${uuidv4()}-props.json`);
    await fs.mkdir(path.dirname(propsPath), { recursive: true });
    await fs.writeFile(propsPath, JSON.stringify(renderProps));

    console.log('🧪 Final processedClips for Remotion:', processedClips);

    // Render video
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        'npx',
        ['remotion', 'render', 'studio', '--composition', 'studio', '--output', outPath, `--props=${propsPath}`],
        { shell: true }
      );

      proc.stdout.on('data', (chunk) =>
        console.log(`[remotion stdout] ${chunk.toString()}`)
      );
      proc.stderr.on('data', (chunk) =>
        console.error(`[remotion stderr] ${chunk.toString()}`)
      );
      proc.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error(`Remotion exited with ${code}`))
      );
    });

    // Upload video
    const videoBuffer = await fs.readFile(outPath);
    const videoKey = `final-videos/${outName}`;
    const { error: uploadError } = await supabase.storage
      .from('final-videos')
      .upload(videoKey, videoBuffer, { contentType: 'video/mp4' });
    if (uploadError) throw uploadError;
    const { data: { publicUrl: videoUrl } } = supabase.storage
      .from('final-videos')
      .getPublicUrl(videoKey);

    // Save DB record
    await supabase.from('video_prompts').insert({
      user_id: user.id,
      business_name: businessName,
      category,
      font,
      logo_url: logoUrl,
      video_url: videoUrl,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ videoUrl, logoUrl, storyboard });
  } catch (err: any) {
    console.error('❌ /api/render-video error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
