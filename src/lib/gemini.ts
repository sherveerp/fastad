import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!, {
  apiVersion: 'v1'
});

export async function generateStoryboard(businessName: string, category: string, clipUrls: string[]) {
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

  const prompt = `
You are a creative ad writer. Create a short, punchy social media ad using the following info:

Business name: "${businessName}"
Category: "${category}"
Clips: ${JSON.stringify(clipUrls)}

1. Create a storyboard: array of objects with:
   - "clip": use a clip filename from the list, or null for text-only
   - "text": short marketing phrase for that clip
   - "duration": number of seconds (3–6)

2. Combine all text from all clips into a single "voiceover" string.

Return the result as valid JSON like this:

{
  "sequence": [ { "clip": "...", "text": "...", "duration": ... }, ... ],
  "voiceover": "..."
}
`;

  const result = await model.generateContent(prompt);
const text = result.response.text();

// Remove markdown fences if they exist
const cleaned = text
  .replace(/```json/g, '')
  .replace(/```/g, '')
  .trim();

// Extract from first `{` onward
const jsonStart = cleaned.indexOf('{');
const jsonText = cleaned.slice(jsonStart);

let json;
try {
  json = JSON.parse(jsonText);
} catch (err) {
  console.error('❌ Failed to parse Gemini JSON:', jsonText);
  throw new Error('Invalid JSON from Gemini');
}


  return json;
}
