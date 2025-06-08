import { AbsoluteFill, Sequence, Video, Audio, Img } from 'remotion';

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
  font: string;
  logoUrl?: string;
  voiceoverUrl?: string;
  backgroundMusicUrl?: string;
}> = ({ storyboard, clips, font, logoUrl, voiceoverUrl, backgroundMusicUrl }) => {
  let frameOffset = 30;
  const fps = 30;

  // Build each clip/text sequence
  const sequences = storyboard.sequence.map((item, index) => {
    const startFrame = frameOffset;
    const durationFrames = Math.round(item.duration * fps);
    frameOffset += durationFrames;

    // Pull the URL from the same index in `clips[]`
    const fullClipUrl = clips[index] ? clips[index] : '';

    console.log('🎞 Video path for clip:', fullClipUrl);

    return (
      <Sequence key={index} from={startFrame} durationInFrames={durationFrames}>
        <AbsoluteFill>
          {fullClipUrl !== '' ? (
            <Video
              src={fullClipUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                console.error('❌ Video failed to load:', fullClipUrl, e);
              }}
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
              color: 'white',
              fontSize: 60,
              fontFamily: font,
              padding: '0 60px',
              textShadow: '2px 2px 6px black',
            }}
          >
            {item.text}
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
          {logoUrl ? (
            <Img
              src={logoUrl}
              style={{
                width: 200,
                height: 200,
                objectFit: 'contain',
                marginBottom: 40,
              }}
            />
          ) : null}
          <div
            style={{
              color: 'white',
              fontSize: 100,
              fontFamily: font,
              textAlign: 'center',
              textShadow: '2px 2px 8px black',
            }}
          >
            {storyboard.sequence.length > 0
              ? storyboard.sequence[0].text
              : 'Welcome'}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Voiceover track */}
      {voiceoverUrl ? (
        <Sequence from={0} durationInFrames={totalFrames}>
          <Audio src={voiceoverUrl} />
        </Sequence>
      ) : null}

      {/* Background music */}
      {backgroundMusicUrl ? (
        <Sequence from={0} durationInFrames={totalFrames}>
          <Audio src={backgroundMusicUrl} volume={0.2} />
        </Sequence>
      ) : null}

      {/* The main sequences */}
      {sequences}
    </AbsoluteFill>
  );
};
