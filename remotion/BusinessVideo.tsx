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
  font: string;
  logoUrl?: string;
  voiceoverUrl?: string;
  backgroundMusicUrl?: string;
}> = ({ storyboard, font, logoUrl, voiceoverUrl, backgroundMusicUrl }) => {
  let frameOffset = 30;
  const fps = 30;

  const sequences = storyboard.sequence.map((item, index) => {
    const startFrame = frameOffset;
    const durationFrames = Math.round(item.duration * fps);
    frameOffset += durationFrames;

    const fullClipUrl = item.clip || ''; // Assume full Supabase URL
    console.log('🎞 Video path for clip:', fullClipUrl);

    return (
      <Sequence
        key={index}
        from={startFrame}
        durationInFrames={durationFrames}
      >
        <AbsoluteFill>
          {item.clip && item.clip.trim() !== '' ? (
            <Video
                src={fullClipUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                console.error('❌ Video failed to load:', fullClipUrl, e);
                }}
            />
            ) : (
            <AbsoluteFill style={{ backgroundColor: 'black' }} />
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
          <div
            style={{
              color: 'white',
              fontSize: 100,
              fontFamily: font,
              textAlign: 'center',
              textShadow: '2px 2px 8px black',
            }}
          >
            {storyboard.sequence[0]?.text || 'Welcome'}
          </div>
        </AbsoluteFill>
      </Sequence>

      {voiceoverUrl && (
        <Sequence from={0} durationInFrames={totalFrames}>
          <Audio src={voiceoverUrl} />
        </Sequence>
      )}

      {backgroundMusicUrl && (
        <Sequence from={0} durationInFrames={totalFrames}>
          <Audio src={backgroundMusicUrl} volume={0.2} />
        </Sequence>
      )}

      {sequences}
    </AbsoluteFill>
  );
};
