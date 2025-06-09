import { Storyboard } from '../BusinessVideo';

export const calculateTotalFrames = (storyboard: Storyboard, fps = 30) => {
  const intro = 30; // 1 second intro
  const contentFrames = storyboard.sequence.reduce(
    (sum, item) => sum + Math.round(item.duration * fps),
    0
  );
  return intro + contentFrames;
};
