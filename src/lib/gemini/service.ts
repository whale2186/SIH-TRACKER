import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
}

export interface PSSummaryInput {
  psId: string;
  title: string;
  description: string;
  organization: string;
  department: string;
  category: string;
  theme: string;
  applicationCount: number;
  datasetUrl: string;
  youtubeLink: string;
}

export function validateConfiguration(): { configured: boolean; message: string } {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    return { configured: false, message: 'GEMINI_API_KEY is not configured. Set it in your .env file.' };
  }
  return { configured: true, message: 'Gemini is configured.' };
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  const config = validateConfiguration();
  if (!config.configured) return { success: false, message: config.message };

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // Try multiple model names as Google has updated their model identifiers
    const modelNames = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: Error | null = null;
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "connected" in one word.');
        const text = result.response.text();
        return { success: true, message: `Connected using ${modelName}. Response: ${text.substring(0, 50)}` };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue;
      }
    }
    
    return { success: false, message: `Connection failed: ${lastError?.message || 'All models failed'}` };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Connection failed: ${msg}` };
  }
}

export async function summarizeProblemStatement(input: PSSummaryInput): Promise<string> {
  const config = validateConfiguration();
  if (!config.configured) throw new Error(config.message);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  // Try multiple model names as Google has updated their model identifiers
  const modelNames = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: Error | null = null;

  const prompt = `You are analyzing a Smart India Hackathon (SIH) 2026 Problem Statement. Summarize ONLY the information provided below. Do NOT invent any information not present in the data.

Problem Statement Data:
- PS ID: ${input.psId}
- Title: ${input.title}
- Organization: ${input.organization}
- Department: ${input.department}
- Category: ${input.category}
- Theme: ${input.theme}
- Current Application Count: ${input.applicationCount}
- Dataset Available: ${input.datasetUrl ? 'Yes - ' + input.datasetUrl : 'Not specified'}
- YouTube/Video: ${input.youtubeLink || 'Not available'}

Full Description:
${input.description}

Provide a structured summary with these sections. If information for any section is not available in the data above, say "Not specified in the available Problem Statement information."

## What is the problem?
Explain the actual problem in simple language.

## What needs to be built?
Describe the expected solution.

## Important requirements
List the important requirements mentioned.

## Dataset
Explain available dataset information. Only mention what is actually provided.

## Suggested technologies
Only suggest technologies that are reasonably supported by the problem statement.

## Expected output
What the final prototype should demonstrate.

## Difficulty
Rate as Easy / Medium / Hard / Very Hard with a short reason.

## Competition
Current application count: ${input.applicationCount} teams have applied. (This is actual tracker data, not estimated.)`;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue;
    }
  }

  throw new Error(`All models failed: ${lastError?.message || 'Unknown error'}`);
}