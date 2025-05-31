import { registerRoot, Composition } from 'remotion';
import { BusinessVideo, Storyboard } from './BusinessVideo';

const demoStoryboard: Storyboard = {
  sequence: [
    {
      clip: 'https://your-supabase-url/storage/v1/object/public/video-assets/assets/clips/demo/clip1.mp4',
      text: 'Welcome to Demo Business',
      duration: 5
    },
    {
      clip: 'https://your-supabase-url/storage/v1/object/public/video-assets/assets/clips/demo/clip2.mp4',
      text: 'Your trusted solution.',
      duration: 5
    },
    {
      clip: 'https://your-supabase-url/storage/v1/object/public/video-assets/assets/clips/demo/clip3.mp4',
      text: 'Let’s grow together.',
      duration: 5
    }
  ],
  voiceover: 'Welcome to Demo Business. Your trusted solution. Let’s grow together.'
};

const totalDurationFrames = 30 + demoStoryboard.sequence.reduce((sum, step) => sum + step.duration * 30, 0);

registerRoot(() => (
  <Composition
    id="studio"
    component={BusinessVideo}
    durationInFrames={totalDurationFrames}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      storyboard: demoStoryboard,
      font: 'Helvetica',
      logoUrl: '',
      voiceoverUrl: '', // optional for preview
    }}
  />
));
