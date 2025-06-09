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
  clips: string[];
  theme: string;
  font: string;
  logoUrl?: string;
  backgroundMusicUrl?: string;
  durationInFrames: number; // ✅ add this prop
}> = ({
  storyboard,
  clips,
  theme,
  font,
  logoUrl,
  backgroundMusicUrl,
  durationInFrames, // ✅ use this
}) => {
  const fps = 30;
  const introFrames = 30;
  let frameOffset = introFrames;

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
            src={clips[index]}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) =>
              console.error('❌ Video failed to load:', clips[index], e)
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

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Sequence from={0} durationInFrames={introFrames}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundColor: 'black',
          }}
        >
          {logoUrl && (
            <Img
              src={logoUrl}
              style={{
                width: 200,
                height: 200,
                objectFit: 'contain',
                marginBottom: 40,
              }}
            />
          )}
          <ThemedText
            text={storyboard.sequence[0]?.text || 'Welcome'}
            theme={theme}
            font={font}
          />
        </AbsoluteFill>
      </Sequence>

      {/* 🎵 Background music spans exact total duration */}
      {backgroundMusicUrl && (
        <Sequence from={0} durationInFrames={durationInFrames}>
          <Audio src={backgroundMusicUrl} volume={0.2} />
        </Sequence>
      )}

      {sequences}
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
