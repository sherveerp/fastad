// src/app/api/render-video/route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import axios from 'axios';
import type { Database } from '@/types/supabase';

export async function POST(req: Request) {
  try {
    // Initialize Supabase client for this Route Handler
    const supabase = createRouteHandlerClient<Database>({ cookies, headers });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData     = await req.formData();
    console.log('🔍 Incoming formData keys:', Array.from(formData.keys()));
    console.log('🔍 Incoming clips values:', formData.getAll('clips'));


    const businessName = formData.get('businessName') as string;
    const category     = formData.get('category') as string;
    const font         = formData.get('font') as string;
    const logoFile     = formData.get('logo') as File | null;
    const clips = formData.getAll('clips') as string[];

    console.log('🔍 Parsed clips:', clips);

    if (!clips.length) {
    return NextResponse.json({ error: 'No clips provided' }, { status: 400 });
    }

    // 1) Optional: upload logo
    let logoUrl = '';
    if (logoFile) {
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      const logoPath   = `logos/${uuidv4()}-${logoFile.name}`;
      const { error: logoErr } = await supabase.storage
        .from('user-logos')
        .upload(logoPath, logoBuffer, { contentType: logoFile.type });
      if (!logoErr) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('user-logos').getPublicUrl(logoPath);
        logoUrl = publicUrl;
      }
    }

    // 2) Generate voiceover (ElevenLabs) …
    //    (omitted here for brevity; same pattern: upload & destructure publicUrl into voiceoverUrl)

    // 3) Prepare render props
    const renderProps = { businessName, category, clips, font, logoUrl /*, voiceoverUrl, etc */ };

    // 4) Render via Remotion CLI
// 4) Render via Remotion CLI
    const outName   = `out-${uuidv4()}.mp4`;
    const outPath   = path.resolve(`./public/videos/${outName}`);
    const propsPath = path.resolve(`./tmp/${uuidv4()}-props.json`);
    await fs.mkdir(path.dirname(propsPath), { recursive: true });
    await fs.writeFile(propsPath, JSON.stringify(renderProps));

    const cmd = 'npx';
    const args = [
    'remotion', 'render',
    'remotion/index.tsx',
    'studio',
    outPath,
    `--props=${propsPath}`,
    ];

    console.log('🚀 Running:', cmd, args.join(' '));
    await new Promise<void>((resolve, reject) => {
    const proc = spawn(cmd, args, { shell: true });

    proc.stdout.on('data', (chunk) => {
        console.log(`[remotion stdout] ${chunk.toString()}`);
    });
    proc.stderr.on('data', (chunk) => {
        console.error(`[remotion stderr] ${chunk.toString()}`);
    });

    proc.on('close', (code) => {
        if (code === 0) {
        resolve();
        } else {
        reject(new Error(`Remotion render exited with code ${code}`));
        }
    });
    });

    // 5) Read the rendered file and upload to Supabase Storage
    const videoBuffer = await fs.readFile(outPath);
    const videoKey    = `final-videos/${outName}`;
    const { error: uploadError } = await supabase.storage
      .from('final-videos')
      .upload(videoKey, videoBuffer, { contentType: 'video/mp4' });

    if (uploadError) {
      console.error('Final upload error:', uploadError);
    }

    // 6) Get the public URL of the final video
    const {
      data: { publicUrl: videoUrl },
    } = supabase.storage.from('final-videos').getPublicUrl(videoKey);

    // 7) Insert metadata into your table
    await supabase.from('video_prompts').insert({
      user_id:      user.id,
      business_name: businessName,
      category,
      font,
      logo_url:     logoUrl,
      video_url:    videoUrl,
      created_at:   new Date().toISOString(),
    });

    // 8) Return JSON
    return NextResponse.json({
      videoUrl,
      logoUrl,
      props: renderProps,
    });
  } catch (err: any) {
    console.error('❌ /api/render-video error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
