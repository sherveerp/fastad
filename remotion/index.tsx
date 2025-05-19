import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import { BusinessVideo } from './BusinessVideo';

registerRoot(() => (
  <Composition
    id="studio"
    component={BusinessVideo}
    durationInFrames={150}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      businessName: "Demo Restaurant",
      font: "helvetica",
      logoUrl: "",
      voiceoverUrl: "",
      videoUrl: "https://your-video-url.mp4"  // ← Make sure this is a valid fallback!
    }}
  />
));
