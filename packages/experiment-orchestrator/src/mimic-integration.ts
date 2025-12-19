/**
 * MIMIC Integration Example
 * 
 * Shows how to integrate the MIMIC cognitive framework with the experiment orchestrator
 */

import { MIMICOrchestrator } from '@maac/mimic-cognitive-engine';
import type { 
  LLMProvider, 
  MemoryService
} from '@maac/mimic-cognitive-engine';

/**
 * Factory function to create a MIMIC cognitive system for experiments
 */
export function createMIMICSystem(
  llmProvider: LLMProvider,
  memoryService: MemoryService
): MIMICOrchestrator {
  return new MIMICOrchestrator({
    llmProvider,
    memoryService,
    enabledEngines: new Set([
      'goal',
      'planning', 
      'clarification',
      'validation',
      'evaluation',
      'reflection'
    ])
  });
}

/**
 * Create a mock memory service for testing
 */
export function createMockMemoryService(): MemoryService {
  return {
    store: async (_params) => {},
    queryContext: async (_params) => ({ 
      nodes: [],
      edges: []
    }),
    queryReflection: async (_params) => ({ 
      nodes: [],
      edges: []
    }),
    queryEvaluation: async (_params) => ({ 
      nodes: [],
      edges: []
    })
  };
}

/**
 * Create a mock LLM provider for testing
 */
export function createMockLLMProvider(): LLMProvider {
  return {
    invoke: async <T>(_params: {
      systemPrompt: string;
      userMessage: string;
      responseSchema?: any;
      temperature?: number;
    }): Promise<T> => {
      // Mock implementation
      throw new Error('Implement your LLM provider');
    },
    model: 'gpt-4'
  };
}

/**
 * Example usage in experiment configuration
 */
export const exampleMIMICConfig = {
  cognitiveSystem: createMIMICSystem(
    createMockLLMProvider(),
    createMockMemoryService()
  )
};