import { describe, it, expect, beforeAll } from 'vitest';
import { VercelAIProvider } from '../src/llm-provider';
import { z } from 'zod';
import { MAACScoreSchema } from '../src/dimensions/types';

describe('Real API Test', () => {
  let llmProvider: VercelAIProvider;

  beforeAll(async () => {
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

    const { openai } = await import('@ai-sdk/openai');
    const model = openai('gpt-4o');
    llmProvider = new VercelAIProvider('gpt-4o', model);
  });

  it('makes real API call with structured output', async () => {
    const TestSchema = z.object({
      score: z.number().min(1).max(5),
      reasoning: z.string(),
    });

    const result = await llmProvider.invoke({
      systemPrompt: 'You are a helpful assistant. Rate the following text on a scale of 1-5.',
      userMessage: 'The quick brown fox jumps over the lazy dog.',
      responseSchema: TestSchema,
    });

    console.log('Result:', result);
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(5);
    expect(result.reasoning).toBeTruthy();
  }, 30000);

  it('tests MAACScoreSchema with real LLM', async () => {
    const systemPrompt = `You are a cognitive assessment agent. Evaluate the following AI response for cognitive load.
    
    You MUST return a JSON object with:
    - dimension_score: A score from 1-5 (Likert scale)
    - confidence: Your confidence in this assessment from 0-1
    - component_scores: An object with keys q1, q2, q3, q4, q5, q6, each containing { score: 1-5, reasoning: string }
    - key_observations: An array of 2-3 key observations as strings
    - reasoning: Overall reasoning for your assessment
    
    IMPORTANT: You must include component_scores with all 6 questions (q1-q6).`;

    const result = await llmProvider.invoke({
      systemPrompt,
      userMessage: 'The AI response was: "Based on analysis, revenue grew 15% year over year."',
      responseSchema: MAACScoreSchema,
    });

    console.log('MAAC Result:', JSON.stringify(result, null, 2));
    expect(result.dimension_score).toBeGreaterThanOrEqual(1);
    expect(result.dimension_score).toBeLessThanOrEqual(5);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    // component_scores is optional per schema, so check if present
    if (result.component_scores) {
      expect(Object.keys(result.component_scores).length).toBeGreaterThan(0);
    }
  }, 60000);
});
