import { AbsoluteFill, Sequence, Video, Audio, Img } from 'remotion';

export const BusinessVideo: React.FC<{
  businessName: string;
  font: string;
  logoUrl?: string;
  voiceoverUrl?: string;
  clips: string[];            // ← now an array
}> = ({ businessName, font, logoUrl, voiceoverUrl, clips }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Title Slide */}
      <Sequence from={0} durationInFrames={30}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
            {businessName}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Clip Sequences */}
      {clips.map((src, idx) => (
        <Sequence
          key={src}
          from={30 + idx * 60}
          durationInFrames={60}
        >
          <AbsoluteFill>
            <Video
              src={src}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </AbsoluteFill>
        </Sequence>
      ))}

      {/* Voiceover (if present) */}
      {voiceoverUrl && (
        <Audio
          src={voiceoverUrl}
          startFrom={0}
        />
      )}
    </AbsoluteFill>
  );
};
