// src/app/api/render-video/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { generateStoryboard, Storyboard, StoryItem } from '@/lib/gemini';
import { generateVoiceover } from '@/lib/elevenlabs';
import os from 'os';
import type { Database } from '@/types/supabase';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const supabase = createRouteHandlerClient<Database>({ cookies, headers });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const businessName = formData.get('businessName') as string;
    const category = formData.get('category') as string;
    const font = formData.get('font') as string;
    const logoFile = formData.get('logo') as File | null;
    const clips = formData.getAll('clips') as string[];
    const videoId = formData.get('videoId') as string | null;
    const theme = formData.get('theme') as string;

    const editedStoryboard = formData.get('storyboard') as string | null;
    const editedVoiceover = formData.get('voiceover') as string | null;

    let logoUrl = '';
    if (logoFile) {
      const logoKey = `logos/${uuidv4()}-${logoFile.name}`;
      await supabase.storage.from('user-logos').upload(logoKey, Buffer.from(await logoFile.arrayBuffer()), { contentType: logoFile.type });
      logoUrl = supabase.storage.from('user-logos').getPublicUrl(logoKey).data.publicUrl;
    }

    const processedClips = await Promise.all(clips.map(async clipUrl => {
      const baseName = `${uuidv4()}-${path.basename(new URL(clipUrl).pathname)}`;
      const rawPath = `/tmp/raw-${baseName}`;
      const procPath = `/tmp/proc-${baseName}`;

      const res = await fetch(clipUrl);
      await fs.writeFile(rawPath, Buffer.from(await res.arrayBuffer()));

      await new Promise<void>((resolve, reject) => {
        const ff = spawn('ffmpeg', [
          '-i', rawPath,
          '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
          '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-y', procPath
        ]);
          ff.stderr.on('data', (d) => console.error('ffmpeg:', d.toString()));
        ff.on('close', code => code === 0 ? resolve() : reject(new Error('ffmpeg error')));
      });

      const clipKey = `clips/${baseName}`;
      await supabase.storage.from('processed-clips').upload(clipKey, await fs.readFile(procPath), { contentType: 'video/mp4', upsert: true });

      return supabase.storage.from('processed-clips').getPublicUrl(clipKey).data.publicUrl;
    }));

    const storyboard: Storyboard = editedStoryboard && editedVoiceover ? {
      sequence: JSON.parse(editedStoryboard),
      voiceover: editedVoiceover
    } : await generateStoryboard({ businessName, category, clipUrls: processedClips });

    const voicePath = path.join(os.tmpdir(), `voice-${uuidv4()}.mp3`);
    await generateVoiceover(storyboard.voiceover, voicePath);

    const voiceKey = `voiceovers/${uuidv4()}.mp3`;
    await supabase.storage.from('voiceovers').upload(voiceKey, await fs.readFile(voicePath), { contentType: 'audio/mpeg' });
    const voiceoverUrl = supabase.storage.from('voiceovers').getPublicUrl(voiceKey).data.publicUrl;

    const backgroundMusicUrl = supabase.storage.from('bg-music').getPublicUrl('upbeat-funk-commercial-advertising-music-253434.mp3').data.publicUrl;

    const renderProps = { storyboard, clips: processedClips, font, logoUrl, voiceoverUrl, backgroundMusicUrl , theme};
    const propsFile = `/tmp/props-${uuidv4()}.json`;
    await fs.writeFile(propsFile, JSON.stringify(renderProps));

    const outName = `out-${uuidv4()}.mp4`;
    const outPath = `/tmp/${outName}`;

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('npx', ['remotion', 'render', 'studio', '--composition', 'studio', '--output', outPath, `--props=${propsFile}`]);
      proc.stdout.on('data', (d) => console.log('Remotion stdout:', d.toString()));
      proc.stderr.on('data', (d) => console.error('Remotion stderr:', d.toString()));
      proc.on('close', code => code === 0 ? resolve() : reject(new Error('Remotion render error')));
    });

    if (videoId) {
      const { data: prevVideo } = await supabaseAdmin.from('video_prompts').select('video_url').eq('id', videoId).single();
      if (prevVideo) {
        const prevKey = prevVideo.video_url.split('/').slice(-3).join('/');
        console.log('Attempting to delete previous video:', prevKey);

        await supabaseAdmin.storage.from('final-videos').remove([prevKey]);
      }
    }

    const videoKey = `${user.id}/videos/${outName}`;
    await supabaseAdmin.storage.from('final-videos').upload(videoKey, await fs.readFile(outPath), { contentType: 'video/mp4', upsert: true });
    const videoUrl = supabaseAdmin.storage.from('final-videos').getPublicUrl(videoKey).data.publicUrl;

    await supabaseAdmin.from('video_prompts').upsert({ id: videoId, user_id: user.id, business_name: businessName, category, font, logo_url: logoUrl, video_url: videoUrl });

    return NextResponse.json({ videoUrl, logoUrl, storyboard });
  } catch (error) {
    console.error('❌ render-video:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
