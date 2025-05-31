import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      apiVersion: 'v1',
    });

    const models = await genAI.listModels();

    if (!models || models.length === 0) {
      console.warn('⚠️ No models returned. Double-check API key and API version.');
    } else {
      console.log('🧠 Available Gemini models:');
      for (const model of models) {
        console.log(`- ${model.name}`);
      }
    }
  } catch (err: any) {
    console.error('❌ Error calling Gemini listModels():');
    console.error(err?.response?.data || err.message || err);
  }
}

listModels();
