import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!, {
  apiVersion: 'v1',
});

export type StoryItem = {
  clip: string | null;
  text: string;
  duration: number;
};

export type Storyboard = {
  sequence: StoryItem[];
  voiceover: string;
};

/**
 * Generates a storyboard object from Gemini, given a business, category, and clip URLs.
 */
export async function generateStoryboard(params: {
  businessName: string;
  category: string;
  clipUrls: string[];
}): Promise<Storyboard> {
  const { businessName, category, clipUrls } = params;
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

  const prompt = `
You are a creative ad writer. Create a short, punchy social media ad using the following info:

Business name: "${businessName}"
Category: "${category}"
Clips: ${JSON.stringify(clipUrls)}

1. Create a storyboard: array of objects with:
   - "clip": use **one of the full URLs** from the Clips list, or null for text-only
   - "text": short marketing phrase for that clip
   - "duration": number of seconds (3–6)

2. Combine all text from all clips into a single "voiceover" string.

Return **only valid JSON**, no markdown fences, structured as:
{
  "sequence": [
    { "clip": "https://…mp4", "text": "...", "duration": 4 },
    …
  ],
  "voiceover": "..."
}
`;

  // Call Gemini
  const res = await model.generateContent(prompt);
  let text = res.response.text();

  // Strip any code fences
  text = text.replace(/```json/, '').replace(/```/g, '').trim();
  // Pull from first brace
  const start = text.indexOf('{');
  if (start !== -1) text = text.slice(start);

  // Parse and return
  try {
    const obj = JSON.parse(text);
    return obj as Storyboard;
  } catch (err) {
    console.warn('generateStoryboard: failed to parse JSON:', text, err);
    // Fallback: return a minimal placeholder
    return {
      sequence: [],
      voiceover: '',
    };
  }
}
