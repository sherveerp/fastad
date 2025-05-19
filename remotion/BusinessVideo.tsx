import { AbsoluteFill, Video, Audio, Img } from 'remotion';

export const BusinessVideo: React.FC<{
  businessName: string;
  font: string;
  logoUrl?: string;
  voiceoverUrl?: string;
  videoUrl: string;
}> = ({ businessName, font, logoUrl, voiceoverUrl, videoUrl }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Video
        src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {voiceoverUrl && <Audio src={voiceoverUrl} />}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          width: '100%',
          textAlign: 'center',
          color: 'white',
          fontSize: 80,
          fontFamily: font,
          textShadow: '2px 2px 8px black',
        }}
      >
        {businessName}
      </div>
      {logoUrl && (
        <Img
          src={logoUrl}
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            width: 120,
            height: 120,
            objectFit: 'contain',
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            background: 'white'
          }}
        />
      )}
    </AbsoluteFill>
  );
};
