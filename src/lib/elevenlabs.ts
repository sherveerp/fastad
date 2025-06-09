import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

if (!ELEVENLABS_API_KEY) {
  throw new Error('ElevenLabs API key not set in environment');
}

/**
 * Generate a voiceover MP3 using ElevenLabs TTS API and write it to outputPath.
 * If ElevenLabs rejects due to unusual activity, falls back to silent audio.
 */
export async function generateVoiceover(
  text: string,
  outputPath: string,
  fallbackDurationSec: number = 3
): Promise<void> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;
  const payload = {
    text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.6,
    },
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      validateStatus: (status) => status < 300,
    });

    await new Promise<void>((resolve, reject) => {
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (err: any) {
    let details: any;
    try {
      if (err.response?.data) {
        const chunks: Buffer[] = [];
        for await (const chunk of err.response.data) {
          chunks.push(Buffer.from(chunk));
        }
        const buf = Buffer.concat(chunks);
        details = JSON.parse(buf.toString('utf8'));
      }
    } catch {
      details = err.message;
    }

    console.warn('❌ ElevenLabs TTS API failed:', details);

    // Fallback to silent audio
    if (details?.detail?.status === 'detected_unusual_activity') {
      console.warn(`⏭ Falling back to ${fallbackDurationSec}s of silence`);
      await new Promise<void>((resolve, reject) => {
        const ff = spawn('ffmpeg', [
          '-f',
          'lavfi',
          '-i',
          'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-t',
          `${fallbackDurationSec}`,
          '-c:a',
          'libmp3lame',
          '-q:a',
          '9',
          '-y',
          outputPath,
        ]);
        ff.on('close', (code) =>
          code === 0
            ? resolve()
            : reject(new Error(`FFmpeg silent audio exited ${code}`))
        );
      });
      return;
    }

    throw new Error(
      `ElevenLabs TTS failed: ${
        details?.detail?.message || JSON.stringify(details)
      }`
    );
  }
}

/**
 * Generate multiple voiceover clips from an array of sentences.
 * Returns an array of output file paths.
 */
export async function generateVoiceoverClips(sentences: string[]): Promise<string[]> {
  const tmpDir = path.join('/tmp', `voice-${Date.now()}`);
  await fs.promises.mkdir(tmpDir, { recursive: true });

  const outputPaths: string[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const text = sentences[i].trim();
    if (!text) continue;

    const outputPath = path.join(tmpDir, `line-${i}.mp3`);
    await generateVoiceover(text, outputPath);
    outputPaths.push(outputPath);
  }

  return outputPaths;
}
