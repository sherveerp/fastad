// render.ts
import { render } from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';

interface RenderProps {
  businessName: string;
  font: string;
  logoUrl?: string;
  outName?: string;
}

export async function generateVideo(props: RenderProps) {
  const compositionId = 'BusinessVideo'; // matches your component name
  const entry = path.resolve('./remotion/index.tsx');
  const outName = props.outName || `video-${Date.now()}.mp4`;
  const outPath = path.resolve(`/tmp/${outName}`);

  try {
    const bundleLocation = await render({
      entryPoint: entry,
      outName,
      serveUrl: entry,
      composition: compositionId,
      codec: 'h264',
      outputLocation: outPath,
      inputProps: props,
    });

    const buffer = await fs.readFile(outPath);
    return { buffer, path: outPath };
  } catch (err) {
    console.error('Remotion render error:', err);
    throw err;
  }
}
