import { registerRoot, Composition } from 'remotion';
import { BusinessVideo, Storyboard, calculateTotalFrames } from './BusinessVideo';


// Load the public Supabase URL from env (optional in render environment)
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL!;


// Example/demo storyboard using actual URLs if BASE is set
const demoStoryboard: Storyboard = {
  sequence: [
    {
      clip: `${BASE}/storage/v1/object/public/video-assets/assets/clips/demo/clip1.mp4`,
      text: 'Welcome to Demo Business',
      duration: 5,
    },
    {
      clip: `${BASE}/storage/v1/object/public/video-assets/assets/clips/demo/clip2.mp4`,
      text: 'Your trusted solution.',
      duration: 5,
    },
    {
      clip: `${BASE}/storage/v1/object/public/video-assets/assets/clips/demo/clip3.mp4`,
      text: 'Let’s grow together.',
      duration: 5,
    },
  ],
  voiceover: "Welcome to Demo Business. Your trusted solution. Let’s grow together.",
};


registerRoot(() => (
  <Composition
    id="studio"
    component={BusinessVideo}
    durationInFrames={calculateTotalFrames(demoStoryboard)} 
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      storyboard: demoStoryboard,
      clips: [],
      font: 'Arial',
      theme: 'minimalist',
    }}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.durationInFrames, 
      fps: 30,
      width: 1080,
      height: 1920,
    })}
  />
));
