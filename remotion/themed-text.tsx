import { useCurrentFrame, interpolate, spring } from 'remotion';

interface ThemedTextProps {
  text: string;
  theme: string;
  font: string;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ text, theme, font }) => {
  const frame = useCurrentFrame();

  if (theme === 'bold') {
    const scale = spring({ frame, fps: 30, from: 0.8, to: 1, config: { damping: 5 } });
    return (
      <div
        style={{
          transform: `scale(${scale})`,
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '20px',
          borderRadius: '16px',
          color: '#ffcc00',
          fontWeight: '900',
          fontSize: 72,
          fontFamily: font,
          textShadow: '3px 3px 10px black',
        }}
      >
        {text}
      </div>
    );
  }

  if (theme === 'typewriter') {
    const charsToShow = Math.floor(interpolate(frame, [0, 45], [0, text.length]));
    const displayed = text.slice(0, charsToShow);

    return (
      <div
        style={{
          color: '#00ffcc',
          fontSize: 42,
          fontFamily: `'Courier New', monospace`,
          whiteSpace: 'pre-wrap',
          textShadow: '1px 1px 4px black',
        }}
      >
        {displayed}
      </div>
    );
  }

  // Default: minimalist
  const opacity = interpolate(frame, [0, 15], [0, 1]);

  return (
    <div
      style={{
        color: 'white',
        fontSize: 60,
        fontFamily: font,
        opacity,
        textShadow: '2px 2px 6px black',
        padding: '0 60px',
      }}
    >
      {text}
    </div>
  );
};
