import {genkit, ai as aicore} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = aicore({
  plugins: [googleAI()],
});

genkit({
  model: 'googleai/gemini-2.5-flash',
});
