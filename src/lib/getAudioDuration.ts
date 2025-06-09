// src/lib/getAudioDuration.ts
import { spawn } from 'child_process';

export const getAudioDurationInSeconds = async (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);

    let output = '';
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on('data', (err) => {
      console.error('ffprobe error:', err.toString());
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        const seconds = parseFloat(output.trim());
        resolve(seconds);
      } else {
        reject(new Error(`ffprobe failed with code ${code}`));
      }
    });
  });
};
