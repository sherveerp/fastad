// remotion/index.tsx
import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import { BusinessVideo } from './BusinessVideo';

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="studio" // ✅ ID must match your CLI command
        component={BusinessVideo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          businessName: 'Sample Restaurant',
          font: 'helvetica',
          logoUrl: ''
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
