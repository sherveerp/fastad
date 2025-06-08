import { AbsoluteFill, Sequence, Video, Audio, Img } from 'remotion';
import { ThemedText } from './themed-text';

export type Storyboard = {
  sequence: {
    clip: string | null;
    text: string;
    duration: number; // in seconds
  }[];
  voiceover: string;
};

export const BusinessVideo: React.FC<{
  storyboard: Storyboard;
  clips: string[];
  theme: string;
  font: string;
  logoUrl?: string;
  voiceoverUrl?: string;
  backgroundMusicUrl?: string;
}> = ({
  storyboard,
  clips,
  theme,
  font,
  logoUrl,
  voiceoverUrl,
  backgroundMusicUrl,
}) => {
  const fps = 30;
  let frameOffset = 30;

  // Build each clip/text sequence
  const sequences = storyboard.sequence.map((item, index) => {
    const startFrame = frameOffset;
    const durationFrames = Math.round(item.duration * fps);
    frameOffset += durationFrames;

    const fullClipUrl = clips[index] ?? '';

    return (
      <Sequence key={index} from={startFrame} durationInFrames={durationFrames}>
        <AbsoluteFill>
          {fullClipUrl ? (
            <Video
              src={fullClipUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) =>
                console.error('❌ Video failed to load:', fullClipUrl, e)
              }
            />
          ) : (
            <AbsoluteFill style={{ backgroundColor: 'gray' }} />
          )}

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
        </AbsoluteFill>
      </Sequence>
    );
  });

  const totalFrames = frameOffset;

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Intro frame with logo + first text */}
      <Sequence from={0} durationInFrames={30}>
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

      {/* Voiceover track */}
      {voiceoverUrl && (
        <Sequence from={0} durationInFrames={totalFrames}>
          <Audio src={voiceoverUrl} />
        </Sequence>
      )}

      {/* Background music */}
      {backgroundMusicUrl && (
        <Sequence from={0} durationInFrames={totalFrames}>
          <Audio src={backgroundMusicUrl} volume={0.2} />
        </Sequence>
      )}

      {/* Main video sequences */}
      {sequences}
    </AbsoluteFill>
  );
};
