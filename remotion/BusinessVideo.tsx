import { AbsoluteFill, Sequence, Video, Audio, Img } from 'remotion';
import { ThemedText } from './themed-text';

export type Storyboard = {
  sequence: {
    clip: string | null;
    text: string;
    duration: number; // in seconds
    audioUrl?: string;
  }[];
  voiceover: string;
};

export const BusinessVideo: React.FC<{
  storyboard: Storyboard;
  theme: string;
  font: string;
  logoUrl?: string;
  logoPosition?: 'top' | 'bottom' | 'both';
  backgroundMusicUrl?: string;
  durationInFrames: number; // ✅ add this prop
}> = ({
  storyboard,
  theme,
  font,
  logoUrl,
  logoPosition = 'top',
  backgroundMusicUrl,
  durationInFrames, // ✅ use this
}) => {
  const fps = 30;
  const introFrames = 30;
  let frameOffset = introFrames;

  const Logo = ({ position }: { position: 'top' | 'bottom' }) => (
      <AbsoluteFill
        style={{
          justifyContent: position === 'top' ? 'flex-start' : 'flex-end',
          alignItems: 'center',
          padding: 60,
          pointerEvents: 'none',
        }}
      >
        <Img
          src={logoUrl!}
          style={{
            width: '25%', 
            height: 'auto',
            maxHeight: '20%',
            objectFit: 'contain',
          }}
        />
      </AbsoluteFill>
    );

  const sequences = storyboard.sequence.map((item, index) => {
    const durationFrames = Math.round(item.duration * fps);
    const startFrame = frameOffset;
    frameOffset += durationFrames;

    return (
      <Sequence
        key={`seq-${index}`}
        from={startFrame}
        durationInFrames={durationFrames}
      >
        <AbsoluteFill>
          <Video
            src={item.clip}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) =>
              console.error('❌ Video failed to load:', item.clip, e)
            }
          />
          <AbsoluteFill
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <ThemedText text={item.text} theme={theme} font={font} />
          </AbsoluteFill>
          {item.audioUrl && (
            <Audio
              src={item.audioUrl}
              startFrom={0}
              endAt={durationFrames}
            />
          )}

        </AbsoluteFill>
      </Sequence>
    );
  });

  const topLogo = logoUrl && (logoPosition === 'top' || logoPosition === 'both') && (
    <Sequence from={0} durationInFrames={durationInFrames}>
      <Logo position="top" />
    </Sequence>
  );

  const bottomLogo = logoUrl && (logoPosition === 'bottom' || logoPosition === 'both') && (
    <Sequence from={0} durationInFrames={durationInFrames}>
      <Logo position="bottom" />
    </Sequence>
  );


  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Sequence from={0} durationInFrames={introFrames}>
        {/* intro content */}
      </Sequence>

      {backgroundMusicUrl && (
        <Sequence from={0} durationInFrames={durationInFrames}>
          <Audio src={backgroundMusicUrl} volume={0.2} />
        </Sequence>
      )}

      {sequences}

      {topLogo}
      {bottomLogo}
    </AbsoluteFill>

  );
};

// ✅ Utility to use in route or index.tsx
export const calculateTotalFrames = (storyboard: Storyboard, fps = 30): number => {
  const intro = 30;
  return (
    intro +
    storyboard.sequence.reduce(
      (sum, item) => sum + Math.round(item.duration * fps),
      0
    )
  );
};
