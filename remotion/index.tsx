import { registerRoot, Composition } from 'remotion';
import { BusinessVideo } from './BusinessVideo';

registerRoot(() => (
  <Composition
    id="studio"
    component={BusinessVideo}
    durationInFrames={30 + 60 * 3}  // title + 3 clips of 60f each = 210f
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      businessName: 'Demo Business',
      font: 'Helvetica',
      logoUrl: '',

      // fallback voiceover (optional)
      voiceoverUrl: '',

      // fallback clips: replace these with real 5s vertical mp4 URLs if you want a preview
      clips: [
        'https://your-supabase-url/storage/v1/object/public/video-assets/assets/clips/demo/clip1.mp4',
        'https://your-supabase-url/storage/v1/object/public/video-assets/assets/clips/demo/clip2.mp4',
        'https://your-supabase-url/storage/v1/object/public/video-assets/assets/clips/demo/clip3.mp4',
      ],
    }}
  />
));
