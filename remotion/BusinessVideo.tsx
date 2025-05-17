// remotion/BusinessVideo.tsx
import { AbsoluteFill, Audio, Video } from 'remotion';

export const BusinessVideo: React.FC<{
  businessName: string;
  font: string;
  logoUrl?: string;
}> = ({ businessName, font }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Video
        src="https://cdn.coverr.co/videos/coverr-a-delicious-pepperoni-pizza-6354/1080p.mp4"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <Audio
        src="/audio/tonys-voiceover.mp3"
        volume={1}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          width: '100%',
          textAlign: 'center',
          color: 'white',
          fontSize: 80,
          fontFamily: font,
          textShadow: '2px 2px 8px black'
        }}
      >
        {businessName}
      </div>
    </AbsoluteFill>
  );
};
