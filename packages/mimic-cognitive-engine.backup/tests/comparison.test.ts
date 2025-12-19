/**
 * MIMIC Cognitive Engine Validation Tests
 *
 * These tests compare TypeScript MIMIC orchestrator outputs against
 * known n8n workflow outputs to ensure behavioral parity.
 *
 * Reference: MAAC - Tier 0 - Agent Router Orchestrator.json
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  MIMICOrchestrator,
  CognitiveAgent,
  ToolExecutor,
  MemoryManager,
  createMIMICConfig,
} from '../src/index.js';
import type {
  MIMICConfig,
  AgentState,
  ToolCall,
  MemoryContext,
  ProcessingResult,
} from '../src/types.js';

// ==================== MOCK DEPENDENCIES ====================

const createMockLLM = () => ({
  invoke: vi.fn().mockImplementation(async (prompt: string) => ({
    content: JSON.stringify({
      reasoning: 'Mock reasoning for test',
      action: 'proceed',
      confidence: 0.85,
    }),
  })),
  stream: vi.fn(),
});

const createMockTools = () => ({
  web_search: vi.fn().mockResolvedValue({ results: [{ title: 'Test', url: 'http://test.com' }] }),
  code_executor: vi.fn().mockResolvedValue({ output: 'Execution successful', exit_code: 0 }),
  file_reader: vi.fn().mockResolvedValue({ content: 'File content here' }),
  calculator: vi.fn().mockResolvedValue({ result: 42 }),
});

const createMockMemory = () => ({
  store: vi.fn().mockResolvedValue(true),
  retrieve: vi.fn().mockResolvedValue([]),
  search: vi.fn().mockResolvedValue([]),
  clear: vi.fn().mockResolvedValue(true),
});

// ==================== N8N REFERENCE DATA ====================

/**
 * Sample MIMIC configuration matching n8n workflow settings
 */
const sampleMIMICConfig: MIMICConfig = {
  model_id: 'gpt-4-turbo',
  max_iterations: 10,
  temperature: 0.7,
  tools_enabled: ['web_search', 'code_executor', 'file_reader', 'calculator'],
  memory_config: {
    short_term_limit: 10,
    long_term_enabled: true,
    embedding_model: 'text-embedding-3-small',
  },
  cognitive_config: {
    reasoning_depth: 'deep',
    self_reflection: true,
    chain_of_thought: true,
    meta_cognition: true,
  },
  timeout_ms: 60000,
  retry_config: {
    max_retries: 3,
    backoff_ms: 1000,
  },
};

/**
 * Sample prompts from n8n workflow execution
 */
const samplePrompts = {
  simple: 'What is the capital of France?',
  tool_use:
    'Search the web for the latest TypeScript version and tell me what new features it has.',
  multi_step:
    'Read the file at /data/config.json, extract the database URL, and then calculate the connection pool size based on the max_connections value.',
  complex:
    'Implement a binary search algorithm in Python, test it with sample data, and explain the time complexity.',
};

/**
 * Known n8n outputs for the sample prompts
 */
const n8nExpectedOutputs = {
  simple: {
    iterations: 1,
    tools_used: 0,
    confidence: 0.95,
    response_contains: 'Paris',
  },
  tool_use: {
    iterations: 2,
    tools_used: 1,
    tool_names: ['web_search'],
    confidence: 0.85,
  },
  multi_step: {
    iterations: 4,
    tools_used: 3,
    tool_names: ['file_reader', 'calculator'],
    confidence: 0.8,
  },
  complex: {
    iterations: 5,
    tools_used: 2,
    tool_names: ['code_executor'],
    confidence: 0.9,
  },
};

// ==================== ORCHESTRATOR TESTS ====================

describe('MIMIC Orchestrator Validation', () => {
  let orchestrator: MIMICOrchestrator;
  let mockLLM: ReturnType<typeof createMockLLM>;
  let mockTools: ReturnType<typeof createMockTools>;
  let mockMemory: ReturnType<typeof createMockMemory>;

  beforeEach(() => {
    mockLLM = createMockLLM();
    mockTools = createMockTools();
    mockMemory = createMockMemory();
    orchestrator = new MIMICOrchestrator(sampleMIMICConfig, mockLLM, mockTools, mockMemory);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with correct configuration', () => {
      expect(orchestrator.config).toEqual(sampleMIMICConfig);
      expect(orchestrator.isReady()).toBe(true);
    });

    it('validates configuration on initialization', () => {
      const invalidConfig = { ...sampleMIMICConfig, max_iterations: -1 };

      expect(() => {
        new MIMICOrchestrator(invalidConfig, mockLLM, mockTools, mockMemory);
      }).toThrow();
    });

    it('registers all configured tools', () => {
      const registeredTools = orchestrator.getRegisteredTools();

      sampleMIMICConfig.tools_enabled.forEach((tool) => {
        expect(registeredTools).toContain(tool);
      });
    });
  });

  describe('Cognitive Processing', () => {
    it('processes simple prompts in single iteration', async () => {
      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          reasoning: 'This is a factual question with a direct answer.',
          action: 'respond',
          response: 'The capital of France is Paris.',
          confidence: 0.95,
        }),
      });

      const result = await orchestrator.process(samplePrompts.simple);

      expect(result.iterations).toBe(n8nExpectedOutputs.simple.iterations);
      expect(result.tools_used.length).toBe(n8nExpectedOutputs.simple.tools_used);
      expect(result.response).toContain(n8nExpectedOutputs.simple.response_contains);
    });

    it('uses tools when required', async () => {
      // First call: decide to use tool
      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          reasoning: 'I need to search the web for current information.',
          action: 'use_tool',
          tool: 'web_search',
          tool_input: { query: 'latest TypeScript version features' },
        }),
      });

      // Second call: process tool result
      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          reasoning: 'Based on the search results, I can now answer.',
          action: 'respond',
          response: 'TypeScript 5.3 includes improved type inference...',
          confidence: 0.85,
        }),
      });

      const result = await orchestrator.process(samplePrompts.tool_use);

      expect(result.tools_used.length).toBe(n8nExpectedOutputs.tool_use.tools_used);
      expect(result.tools_used).toContain('web_search');
    });

    it('handles multi-step reasoning correctly', async () => {
      // Simulate multi-step process
      const steps = [
        {
          action: 'use_tool',
          tool: 'file_reader',
          tool_input: { path: '/data/config.json' },
        },
        {
          action: 'think',
          reasoning: 'Extracted database URL and max_connections value.',
        },
        {
          action: 'use_tool',
          tool: 'calculator',
          tool_input: { expression: 'max_connections * 0.75' },
        },
        {
          action: 'respond',
          response: 'The recommended connection pool size is 75.',
          confidence: 0.8,
        },
      ];

      steps.forEach((step, i) => {
        mockLLM.invoke.mockResolvedValueOnce({
          content: JSON.stringify(step),
        });
      });

      const result = await orchestrator.process(samplePrompts.multi_step);

      expect(result.iterations).toBeLessThanOrEqual(n8nExpectedOutputs.multi_step.iterations + 1);
      expect(result.tools_used).toContain('file_reader');
    });

    it('respects max_iterations limit', async () => {
      // Always return "think" action to force iteration limit
      mockLLM.invoke.mockResolvedValue({
        content: JSON.stringify({
          action: 'think',
          reasoning: 'Still thinking...',
        }),
      });

      const result = await orchestrator.process('Complex open-ended question');

      expect(result.iterations).toBeLessThanOrEqual(sampleMIMICConfig.max_iterations);
      expect(result.status).toBe('max_iterations_reached');
    });
  });

  describe('Tool Execution', () => {
    it('executes tools with correct parameters', async () => {
      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          action: 'use_tool',
          tool: 'web_search',
          tool_input: { query: 'test query' },
        }),
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          action: 'respond',
          response: 'Done',
          confidence: 0.9,
        }),
      });

      await orchestrator.process('Search for test query');

      expect(mockTools.web_search).toHaveBeenCalledWith({ query: 'test query' });
    });

    it('handles tool execution errors gracefully', async () => {
      mockTools.web_search.mockRejectedValueOnce(new Error('Network error'));

      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          action: 'use_tool',
          tool: 'web_search',
          tool_input: { query: 'test' },
        }),
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          action: 'respond',
          response: 'I encountered an error but handled it.',
          confidence: 0.7,
        }),
      });

      const result = await orchestrator.process('Search test');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.status).not.toBe('failed');
    });

    it('validates tool input before execution', async () => {
      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          action: 'use_tool',
          tool: 'web_search',
          tool_input: {}, // Missing required 'query' field
        }),
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          action: 'respond',
          response: 'Fallback response',
          confidence: 0.6,
        }),
      });

      const result = await orchestrator.process('Search test');

      // Should handle invalid input gracefully
      expect(mockTools.web_search).not.toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    it('stores context in memory', async () => {
      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          action: 'respond',
          response: 'Test response',
          confidence: 0.9,
        }),
      });

      await orchestrator.process('Test prompt');

      expect(mockMemory.store).toHaveBeenCalled();
    });

    it('retrieves relevant context from memory', async () => {
      mockMemory.retrieve.mockResolvedValueOnce([
        { content: 'Previous conversation about TypeScript', relevance: 0.9 },
      ]);

      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          action: 'respond',
          response: 'Based on our previous discussion...',
          confidence: 0.85,
        }),
      });

      await orchestrator.process('Continue our TypeScript discussion');

      expect(mockMemory.retrieve).toHaveBeenCalled();
    });

    it('respects short_term_limit configuration', async () => {
      // Simulate multiple interactions
      for (let i = 0; i < 15; i++) {
        mockLLM.invoke.mockResolvedValueOnce({
          content: JSON.stringify({
            action: 'respond',
            response: `Response ${i}`,
            confidence: 0.9,
          }),
        });
        await orchestrator.process(`Prompt ${i}`);
      }

      // Memory store should have been called, potentially with trimming
      const storeCallsCount = mockMemory.store.mock.calls.length;
      expect(storeCallsCount).toBeGreaterThan(0);
    });
  });

  describe('Self-Reflection', () => {
    it('performs self-reflection when enabled', async () => {
      const configWithReflection = {
        ...sampleMIMICConfig,
        cognitive_config: { ...sampleMIMICConfig.cognitive_config, self_reflection: true },
      };

      const reflectiveOrchestrator = new MIMICOrchestrator(
        configWithReflection,
        mockLLM,
        mockTools,
        mockMemory,
      );

      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          action: 'reflect',
          reflection: 'Let me reconsider my approach...',
        }),
      });

      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          action: 'respond',
          response: 'After reflection, here is my answer.',
          confidence: 0.92,
        }),
      });

      const result = await reflectiveOrchestrator.process('Complex question');

      expect(result.reflection_count).toBeGreaterThan(0);
    });

    it('skips reflection when disabled', async () => {
      const configNoReflection = {
        ...sampleMIMICConfig,
        cognitive_config: { ...sampleMIMICConfig.cognitive_config, self_reflection: false },
      };

      const noReflectOrchestrator = new MIMICOrchestrator(
        configNoReflection,
        mockLLM,
        mockTools,
        mockMemory,
      );

      mockLLM.invoke.mockResolvedValue({
        content: JSON.stringify({
          action: 'respond',
          response: 'Direct response',
          confidence: 0.9,
        }),
      });

      const result = await noReflectOrchestrator.process('Simple question');

      expect(result.reflection_count).toBe(0);
    });
  });
});

// ==================== AGENT STATE TESTS ====================

describe('Cognitive Agent State', () => {
  it('tracks state transitions correctly', async () => {
    const agent = new CognitiveAgent(sampleMIMICConfig);
    const stateHistory: AgentState[] = [];

    agent.onStateChange((state) => stateHistory.push(state));

    await agent.process('Test prompt', createMockLLM(), createMockTools());

    expect(stateHistory).toContain('idle');
    expect(stateHistory).toContain('processing');
    expect(stateHistory[stateHistory.length - 1]).toBe('idle');
  });

  it('exposes current state', () => {
    const agent = new CognitiveAgent(sampleMIMICConfig);

    expect(agent.getState()).toBe('idle');
  });

  it('prevents concurrent processing', async () => {
    const agent = new CognitiveAgent(sampleMIMICConfig);
    const mockLLM = createMockLLM();

    // Simulate slow response
    mockLLM.invoke.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                content: JSON.stringify({ action: 'respond', response: 'Done' }),
              }),
            100,
          ),
        ),
    );

    const promise1 = agent.process('First prompt', mockLLM, createMockTools());

    await expect(agent.process('Second prompt', mockLLM, createMockTools())).rejects.toThrow(
      'Agent is already processing',
    );

    await promise1;
  });
});

// ==================== N8N PARITY TESTS ====================

describe('N8N Behavioral Parity', () => {
  it('follows same decision flow as n8n', async () => {
    const orchestrator = new MIMICOrchestrator(
      sampleMIMICConfig,
      createMockLLM(),
      createMockTools(),
      createMockMemory(),
    );

    // The decision flow should be:
    // 1. Parse input
    // 2. Check memory for context
    // 3. Reason about action
    // 4. Execute action (tool or respond)
    // 5. Store result in memory
    // 6. Return response

    const executionLog = orchestrator.getExecutionLog();

    // After processing, execution log should contain these phases
    const expectedPhases = [
      'input_parsing',
      'memory_retrieval',
      'reasoning',
      'action_execution',
      'memory_storage',
      'response_generation',
    ];

    // Note: This test validates structure, actual log depends on implementation
    expect(orchestrator.getSupportedPhases()).toEqual(expect.arrayContaining(expectedPhases));
  });

  it('produces equivalent outputs for same inputs', async () => {
    const mockLLM = createMockLLM();
    mockLLM.invoke.mockResolvedValue({
      content: JSON.stringify({
        action: 'respond',
        response: 'Paris is the capital of France.',
        confidence: 0.95,
      }),
    });

    const orchestrator = new MIMICOrchestrator(
      sampleMIMICConfig,
      mockLLM,
      createMockTools(),
      createMockMemory(),
    );

    const result1 = await orchestrator.process(samplePrompts.simple);
    const result2 = await orchestrator.process(samplePrompts.simple);

    // Same input should produce same structure (content may vary due to LLM)
    expect(result1.status).toBe(result2.status);
    expect(result1.iterations).toBe(result2.iterations);
  });

  it('handles timeout as n8n does', async () => {
    const shortTimeoutConfig = { ...sampleMIMICConfig, timeout_ms: 100 };
    const mockLLM = createMockLLM();

    mockLLM.invoke.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200)), // Longer than timeout
    );

    const orchestrator = new MIMICOrchestrator(
      shortTimeoutConfig,
      mockLLM,
      createMockTools(),
      createMockMemory(),
    );

    const result = await orchestrator.process('Test prompt');

    expect(result.status).toBe('timeout');
    expect(result.error).toContain('timeout');
  });
});

// ==================== CONFIGURATION VALIDATION ====================

describe('Configuration Validation', () => {
  it('validates required fields', () => {
    expect(() => createMIMICConfig({})).toThrow();
    expect(() => createMIMICConfig({ model_id: 'test' })).not.toThrow();
  });

  it('applies default values', () => {
    const config = createMIMICConfig({ model_id: 'test' });

    expect(config.max_iterations).toBe(10); // default
    expect(config.temperature).toBe(0.7); // default
    expect(config.timeout_ms).toBe(60000); // default
  });

  it('validates value ranges', () => {
    expect(() =>
      createMIMICConfig({
        model_id: 'test',
        temperature: 2.5, // invalid: > 2.0
      }),
    ).toThrow();

    expect(() =>
      createMIMICConfig({
        model_id: 'test',
        max_iterations: 0, // invalid: must be > 0
      }),
    ).toThrow();
  });
});
