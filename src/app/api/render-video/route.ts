// src/app/api/render-video/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { generateStoryboard, Storyboard, StoryItem } from '@/lib/gemini';
import { generateVoiceover } from '@/lib/elevenlabs';
import os from 'os';
import type { Database } from '@/types/supabase';

export async function POST(req: Request) {
  try {
    // Supabase admin & auth clients
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const supabase = createRouteHandlerClient<Database>({ cookies, headers });

    // Authenticate
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const businessName = formData.get('businessName') as string;
    const category = formData.get('category') as string;
    const font = formData.get('font') as string;
    const logoFile = formData.get('logo') as File | null;
    const clips = formData.getAll('clips') as string[];

    // Pick up any client edits
    const editedStoryboard = formData.get('storyboard') as string | null;
    const editedVoiceover = formData.get('voiceover') as string | null;

    if (clips.length === 0) {
      return NextResponse.json({ error: 'No clips provided' }, { status: 400 });
    }

    // Upload logo (if any)
    let logoUrl = '';
    if (logoFile) {
      const buf = Buffer.from(await logoFile.arrayBuffer());
      const logoKey = `logos/${uuidv4()}-${logoFile.name}`;
      const { error: logoErr } = await supabase.storage
        .from('user-logos')
        .upload(logoKey, buf, { contentType: logoFile.type });
      if (!logoErr) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('user-logos').getPublicUrl(logoKey);
        logoUrl = publicUrl;
      }
    }

    // Process each clip through ffmpeg and re-upload
    const processedClips: string[] = [];
    for (const clipUrl of clips) {
      const baseName = `${uuidv4()}-${path.basename(new URL(clipUrl).pathname)}`;
      const rawPath = `/tmp/raw-${baseName}`;
      const procPath = `/tmp/proc-${baseName}`;

      // download
      const res = await fetch(clipUrl);
      if (!res.ok) throw new Error(`Failed to fetch clip: ${clipUrl}`);
      await fs.writeFile(rawPath, Buffer.from(await res.arrayBuffer()));

      // ffmpeg crop/scale
      await new Promise<void>((resolve, reject) => {
        const ff = spawn('ffmpeg', [
          '-i',
          rawPath,
          '-vf',
          'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          '-movflags',
          '+faststart',
          '-y',
          procPath,
        ]);
        ff.stderr.on('data', (d) => console.error(d.toString()));
        ff.on('close', (code) =>
          code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))
        );
      });

      // upload processed clip
      const clipKey = `clips/${baseName}`;
      const buf = await fs.readFile(procPath);
      const { error: uploadErr } = await supabase.storage
        .from('processed-clips')
        .upload(clipKey, buf, { contentType: 'video/mp4', upsert: true });
      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from('processed-clips').getPublicUrl(clipKey);
      processedClips.push(publicUrl);
    }

    // Build final Storyboard object (client edits override)
    let sb: Storyboard;
    if (editedStoryboard && editedVoiceover) {
      sb = {
        sequence: JSON.parse(editedStoryboard) as StoryItem[],
        voiceover: editedVoiceover,
      };
    } else {
      sb = await generateStoryboard({
        businessName,
        category,
        clipUrls: processedClips,
      });
    }

    // Generate TTS
    const voiceLocal = path.join(os.tmpdir(), `voice-${uuidv4()}.mp3`);
    await generateVoiceover(sb.voiceover, voiceLocal);
    const voiceBuf = await fs.readFile(voiceLocal);
    const voiceKey = `voiceovers/${uuidv4()}.mp3`;
    const { error: voiceErr } = await supabase.storage
      .from('voiceovers')
      .upload(voiceKey, voiceBuf, { contentType: 'audio/mpeg' });
    if (voiceErr) throw voiceErr;
    const {
      data: { publicUrl: voiceoverUrl },
    } = supabase.storage.from('voiceovers').getPublicUrl(voiceKey);

    // Background music
    const {
      data: { publicUrl: backgroundMusicUrl },
    } = supabase.storage
      .from('bg-music')
      .getPublicUrl('upbeat-funk-commercial-advertising-music-253434.mp3');

    // Write props JSON for Remotion
    const renderProps = {
      storyboard: sb,
      clips: processedClips,
      font,
      logoUrl,
      voiceoverUrl,
      backgroundMusicUrl,
    };
    const propsFile = `/tmp/props-${uuidv4()}.json`;
    await fs.writeFile(propsFile, JSON.stringify(renderProps));

    // Invoke Remotion
    const outName = `out-${uuidv4()}.mp4`;
    const outPath = `./public/videos/${outName}`;
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        'npx',
        [
          'remotion',
          'render',
          'studio',
          '--composition',
          'studio',
          '--output',
          outPath,
          `--props=${propsFile}`,
        ],
        {
          shell: true,
          env: {
            ...process.env,
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          },
        }
      );
      proc.stdout.on('data', (d) => console.log(d.toString()));
      proc.stderr.on('data', (d) => console.error(d.toString()));
      proc.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error(`Remotion exited ${code}`))
      );
    });

    // Upload final video
    const videoBuf = await fs.readFile(outPath);
    const videoKey = `${user.id}/videos/${outName}`;
    const { error: finalErr } = await supabaseAdmin.storage
      .from('final-videos')
      .upload(videoKey, videoBuf, { contentType: 'video/mp4', upsert: true });
    if (finalErr) throw finalErr;

    const {
      data: { publicUrl: videoUrl },
    } = supabase.storage.from('final-videos').getPublicUrl(videoKey);

    // Persist metadata
    const { error: dbErr } = await supabaseAdmin
      .from('video_prompts')
      .insert({
        user_id: user.id,
        business_name: businessName,
        category,
        font,
        logo_url: logoUrl,
        video_url: videoUrl,
        created_at: new Date().toISOString(),
      });
    if (dbErr) throw dbErr;

    return NextResponse.json({ videoUrl, logoUrl, storyboard: sb });
  } catch (err: any) {
    console.error('❌ /api/render-video error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
