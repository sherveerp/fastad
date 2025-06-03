import axios from 'axios';
import fs from 'fs';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default: Matthew

export async function generateVoiceover(text: string, outputPath: string) {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not set in environment');
  }

  const payload = {
    text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.6,
    },
  };

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        payload,
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        }
      );

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (err: any) {
      console.error('❌ ElevenLabs TTS API failed:', err.response?.data || err.message);
      throw err;
    }
  }
