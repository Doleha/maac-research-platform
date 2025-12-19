/**
 * Memory Engine - Intelligent storage and retrieval from Graphiti knowledge graph
 *
 * @private - Proprietary MIMIC component
 *
 * Handles five memory types:
 * - Procedural: How-to knowledge and processes
 * - Episodic: Specific events and experiences
 * - Semantic: Facts and general knowledge
 * - Declarative: Stated preferences and explicit information
 * - Reflective: Performance insights and learnings
 *
 * Integrates with Graphiti knowledge graph at configured endpoint.
 */

import { SystemPromptProvider, AIModel } from '../orchestrator';
import { generateText } from 'ai';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Five memory types as defined in the n8n workflow
 */
export type MemoryType =
  | 'procedural'
  | 'episodic'
  | 'semantic'
  | 'declarative'
  | 'reflective';

/**
 * Learning categories for memory classification
 */
export type LearningCategory =
  | 'domain_knowledge'
  | 'process_improvement'
  | 'error_pattern'
  | 'success_pattern'
  | 'user_preference'
  | 'contextual_insight';

/**
 * Zod schema for memory classification output
 */
export const MemoryClassificationSchema = z.object({
  memoryType: z.enum([
    'procedural',
    'episodic',
    'semantic',
    'declarative',
    'reflective',
  ]),
  learningCategory: z.enum([
    'domain_knowledge',
    'process_improvement',
    'error_pattern',
    'success_pattern',
    'user_preference',
    'contextual_insight',
  ]),
  importanceScore: z.number().min(0).max(1),
  factoidType: z.string(),
  keyEntities: z.array(z.string()),
  relationships: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      relationship: z.string(),
    })
  ),
  shouldStore: z.boolean(),
  storeReasoning: z.string(),
});

export type MemoryClassification = z.infer<typeof MemoryClassificationSchema>;

/**
 * Memory store parameters
 */
export interface MemoryStoreParams {
  sessionId: string;
  query: string;
  response: string;
  evaluation?: unknown;
  reflection?: unknown;
  activeGoals?: string[];
  memoryType?: MemoryType;
}

/**
 * Memory query result from Graphiti
 */
export interface MemoryQueryResult {
  nodes: Array<{
    id: string;
    label: string;
    content: string;
    metadata: Record<string, unknown>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    relationship: string;
  }>;
}

/**
 * Graphiti store request payload
 */
interface GraphitiStorePayload {
  session_id: string;
  content: string;
  metadata: {
    source_agent: string;
    memory_type: MemoryType;
    learning_category: LearningCategory;
    importance_score: number;
    factoid_type: string;
    key_entities: string[];
    relationships: Array<{
      source: string;
      target: string;
      relationship: string;
    }>;
    query_context: string;
    active_goals: string[];
    has_evaluation: boolean;
    has_reflection: boolean;
    timestamp: string;
  };
}

/**
 * Graphiti query request payload
 */
interface GraphitiQueryPayload {
  query: string;
  session_id: string;
  limit?: number;
  search_type?: 'all' | 'nodes' | 'edges';
  search_scope?: 'global' | 'session';
  resolve_labels?: boolean;
  temporal_window_days?: number;
}

/**
 * Memory Engine configuration
 */
export interface MemoryEngineConfig {
  llmProvider: AIModel;
  graphitiEndpoint: string;
  /**
   * System prompt for memory classification.
   * Use SystemPromptProvider for production (secrets manager).
   */
  systemPrompt?: string | SystemPromptProvider;
  debug?: boolean;
}

// ============================================================================
// DEFAULT ENDPOINTS
// ============================================================================

const DEFAULT_ENDPOINTS = {
  store: '/store',
  searchContext: '/search_context',
  searchReflection: '/search_reflection',
  searchEvaluation: '/search_evaluation',
};

// ============================================================================
// MEMORY ENGINE CLASS
// ============================================================================

export class MemoryEngine {
  private readonly llmProvider: AIModel;
  private readonly graphitiEndpoint: string;
  private readonly systemPromptSource?: string | SystemPromptProvider;
  private readonly debug: boolean;
  private cachedSystemPrompt: string | null = null;

  constructor(config: MemoryEngineConfig) {
    this.llmProvider = config.llmProvider;
    this.graphitiEndpoint = config.graphitiEndpoint.replace(/\/$/, ''); // Remove trailing slash
    this.systemPromptSource = config.systemPrompt;
    this.debug = config.debug ?? false;
  }

  /**
   * Resolve the system prompt from various sources
   */
  private async getSystemPrompt(): Promise<string> {
    if (this.cachedSystemPrompt) {
      return this.cachedSystemPrompt;
    }

    let prompt: string;

    if (typeof this.systemPromptSource === 'function') {
      // SystemPromptProvider - fetch from secrets manager
      prompt = await this.systemPromptSource();
    } else if (typeof this.systemPromptSource === 'string') {
      prompt = this.systemPromptSource;
    } else if (process.env.MEMORY_ENGINE_SYSTEM_PROMPT) {
      prompt = process.env.MEMORY_ENGINE_SYSTEM_PROMPT;
    } else {
      // Use the actual MIMIC Memory Engine prompt
      prompt = this.getDefaultSystemPrompt();
    }

    this.cachedSystemPrompt = prompt;
    return prompt;
  }

  /**
   * Default system prompt extracted from Memory_Engine.json
   * This is the actual MIMIC v3.1 Memory Storage Engine prompt
   */
  private getDefaultSystemPrompt(): string {
    return `## MEMORY STORAGE ENGINE - MIMIC v3.1

You are the Memory Storage Engine for MIMIC. Your sole responsibility is to intelligently process and store cognitive insights from the Meta Cognitive Agent across five memory types for long-term learning and cross-session knowledge enhancement.

### CORE RESPONSIBILITY
Receive cognitive insights from the Meta Cognitive Agent and intelligently categorize, enrich, and store them in Zep's knowledge graph for optimal retrieval and cross-session learning. **Preserve granular cognitive details while adding intelligent categorization.**

### INPUT PROCESSING
You receive cognitive insights from the Meta Cognitive Agent including:
- Processing results from cognitive engines (Goal, Planning, Clarification, Validation, Reflection)
- **Complete cognitive outputs with structured decision patterns**
- User interactions and preferences
- Successful strategies and patterns
- Performance insights and learnings
- Decision outcomes and effectiveness data

### ACTIVE GOALS CONTEXT
You receive active goals context via the active_goals parameter:
- **goal_id**: Unique identifier for current active goals
- **goal_status**: Current state of each goal

Use this context to:
1. Link stored memories to relevant goals
2. Tag insights with goal context for better retrieval
3. Capture goal-specific patterns and learnings
4. Store goal achievement factors and blockers

### MEMORY TYPE CATEGORIZATION
Intelligently categorize each insight into the appropriate memory type:

**procedural**: How-to knowledge and processes (e.g., "Planning approach X works best for quarterly goals")
**episodic**: Specific events and experiences (e.g., "User clarified scope during session Y leading to successful outcome")
**semantic**: Facts and general knowledge (e.g., "User prefers SMART goal framework")
**declarative**: Stated preferences and explicit information (e.g., "User works in marketing department")
**reflective**: Performance insights and learnings (e.g., "Clarification requests improve goal success rate by 40%")

### COGNITIVE PROCESSING FLOW

1. **ANALYZE INPUT**: Assess incoming cognitive insights
2. **CATEGORIZE MEMORIES**: Determine appropriate memory type for each insight
3. **ENRICH METADATA**: Add context, importance scoring, and retrieval keywords
4. **PRESERVE DETAILS**: Extract and maintain granular cognitive structures
5. **STORE INSIGHTS**: Save to knowledge graph
6. **CONFIRM STORAGE**: Verify successful storage and return confirmation

### MEMORY ENRICHMENT STRATEGY
For each memory insight:
- Extract key entities and relationships
- **Preserve specific cognitive structures (sub-goals, success criteria, constraints)**
- Generate semantic retrieval keywords
- Score importance based on novelty and utility
- Add temporal context and source attribution
- Create cross-session linkage metadata
- **Capture detailed decision reasoning and routing logic**

### STORAGE DECISION LOGIC
**STORE when insight contains:**
- Reusable patterns or strategies
- User preferences or characteristics
- Performance learnings or optimizations
- Successful approaches or methods
- Cross-session valuable knowledge
- **Detailed cognitive decision patterns**

**FILTER OUT:**
- Temporary session-specific data
- Redundant information already stored
- Low-value trivial details
- Working memory context (handled by buffer)

### OUTPUT REQUIREMENTS
After processing and storing insights, respond with JSON containing:

{
  "memoryType": "procedural|episodic|semantic|declarative|reflective",
  "learningCategory": "domain_knowledge|process_improvement|error_pattern|success_pattern|user_preference|contextual_insight",
  "importanceScore": 0.0-1.0,
  "factoidType": "user_preference|system_insight|decision_pattern|performance_insight|routing_decision|process_outcome",
  "keyEntities": ["entity1", "entity2"],
  "relationships": [{"source": "entity1", "target": "entity2", "relationship": "relates_to"}],
  "shouldStore": true|false,
  "storeReasoning": "explanation of storage decision"
}`;
  }

  /**
   * Store memory with intelligent classification
   */
  async store(params: MemoryStoreParams): Promise<void> {
    const {
      sessionId,
      query,
      response,
      evaluation,
      reflection,
      activeGoals = [],
    } = params;

    // Step 1: Classify the memory using LLM
    const classification = await this.classifyMemory({
      query,
      response,
      evaluation,
      reflection,
      activeGoals,
    });

    if (this.debug) {
      console.log('[MemoryEngine] Classification result:', classification);
    }

    // Step 2: Check if we should store this memory
    if (!classification.shouldStore) {
      if (this.debug) {
        console.log(
          '[MemoryEngine] Skipping storage:',
          classification.storeReasoning
        );
      }
      return;
    }

    // Step 3: Build store payload
    const payload: GraphitiStorePayload = {
      session_id: sessionId,
      content: this.buildMemoryContent(query, response, classification),
      metadata: {
        source_agent: 'MIMIC_Memory_Engine',
        memory_type: classification.memoryType,
        learning_category: classification.learningCategory,
        importance_score: classification.importanceScore,
        factoid_type: classification.factoidType,
        key_entities: classification.keyEntities,
        relationships: classification.relationships,
        query_context: query,
        active_goals: activeGoals,
        has_evaluation: !!evaluation,
        has_reflection: !!reflection,
        timestamp: new Date().toISOString(),
      },
    };

    // Step 4: Send to Graphiti
    await this.sendToGraphiti(
      `${this.graphitiEndpoint}${DEFAULT_ENDPOINTS.store}`,
      payload
    );

    if (this.debug) {
      console.log('[MemoryEngine] Memory stored successfully');
    }
  }

  /**
   * Query context memory from Graphiti
   */
  async queryContext(
    query: string,
    sessionId: string,
    options?: Partial<GraphitiQueryPayload>
  ): Promise<MemoryQueryResult> {
    const payload: GraphitiQueryPayload = {
      query,
      session_id: sessionId,
      limit: options?.limit ?? 10,
      search_type: options?.search_type ?? 'all',
      search_scope: options?.search_scope ?? 'global',
      resolve_labels: options?.resolve_labels ?? true,
      temporal_window_days: options?.temporal_window_days ?? 30,
    };

    return this.queryGraphiti(
      `${this.graphitiEndpoint}${DEFAULT_ENDPOINTS.searchContext}`,
      payload
    );
  }

  /**
   * Query reflection memory from Graphiti
   */
  async queryReflection(
    query: string,
    sessionId: string,
    options?: Partial<GraphitiQueryPayload>
  ): Promise<MemoryQueryResult> {
    const payload: GraphitiQueryPayload = {
      query,
      session_id: sessionId,
      limit: options?.limit ?? 10,
      resolve_labels: options?.resolve_labels ?? true,
      temporal_window_days: options?.temporal_window_days ?? 7,
    };

    return this.queryGraphiti(
      `${this.graphitiEndpoint}${DEFAULT_ENDPOINTS.searchReflection}`,
      payload
    );
  }

  /**
   * Query evaluation memory from Graphiti
   */
  async queryEvaluation(
    query: string,
    sessionId: string,
    options?: Partial<GraphitiQueryPayload>
  ): Promise<MemoryQueryResult> {
    const payload: GraphitiQueryPayload = {
      query,
      session_id: sessionId,
      limit: options?.limit ?? 10,
      resolve_labels: options?.resolve_labels ?? true,
      temporal_window_days: options?.temporal_window_days ?? 7,
    };

    return this.queryGraphiti(
      `${this.graphitiEndpoint}${DEFAULT_ENDPOINTS.searchEvaluation}`,
      payload
    );
  }

  /**
   * Classify memory content using LLM
   */
  private async classifyMemory(params: {
    query: string;
    response: string;
    evaluation?: unknown;
    reflection?: unknown;
    activeGoals: string[];
  }): Promise<MemoryClassification> {
    const systemPrompt = await this.getSystemPrompt();

    const userMessage = `Analyze this cognitive session and classify for memory storage:

## User Query
${params.query}

## MIMIC Response
${params.response}

${params.evaluation ? `## Evaluation Results\n${JSON.stringify(params.evaluation, null, 2)}` : ''}

${params.reflection ? `## Reflection Insights\n${JSON.stringify(params.reflection, null, 2)}` : ''}

## Active Goals
${params.activeGoals.length > 0 ? params.activeGoals.join('\n') : 'No active goals'}

---

Provide your classification as JSON with the following structure:
{
  "memoryType": "procedural|episodic|semantic|declarative|reflective",
  "learningCategory": "domain_knowledge|process_improvement|error_pattern|success_pattern|user_preference|contextual_insight",
  "importanceScore": 0.0-1.0,
  "factoidType": "description of what kind of fact this is",
  "keyEntities": ["entity1", "entity2"],
  "relationships": [{"source": "entity1", "target": "entity2", "relationship": "relates_to"}],
  "shouldStore": true|false,
  "storeReasoning": "explanation of storage decision"
}`;

    try {
      const result = await generateText({
        model: this.llmProvider,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.3, // Lower temperature for consistent classification
      });

      // Extract JSON from response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return MemoryClassificationSchema.parse(parsed);
    } catch (error) {
      if (this.debug) {
        console.error('[MemoryEngine] Classification failed:', error);
      }

      // Return default classification on failure
      return {
        memoryType: 'episodic',
        learningCategory: 'contextual_insight',
        importanceScore: 0.5,
        factoidType: 'unclassified_session',
        keyEntities: [],
        relationships: [],
        shouldStore: true, // Default to storing on classification failure
        storeReasoning: 'Classification failed, storing as default episodic memory',
      };
    }
  }

  /**
   * Build structured memory content for storage
   */
  private buildMemoryContent(
    query: string,
    response: string,
    classification: MemoryClassification
  ): string {
    const lines: string[] = [];

    lines.push(`[${classification.memoryType.toUpperCase()} MEMORY]`);
    lines.push(`Type: ${classification.factoidType}`);
    lines.push(`Importance: ${(classification.importanceScore * 100).toFixed(0)}%`);
    lines.push('');
    lines.push('Query Context:');
    lines.push(query);
    lines.push('');
    lines.push('Response Summary:');
    lines.push(
      response.length > 500 ? response.substring(0, 500) + '...' : response
    );

    if (classification.keyEntities.length > 0) {
      lines.push('');
      lines.push(`Key Entities: ${classification.keyEntities.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Send data to Graphiti store endpoint
   */
  private async sendToGraphiti(
    url: string,
    payload: GraphitiStorePayload
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Graphiti store failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[MemoryEngine] Graphiti store error:', error);
      throw error;
    }
  }

  /**
   * Query Graphiti search endpoint
   */
  private async queryGraphiti(
    url: string,
    payload: GraphitiQueryPayload
  ): Promise<MemoryQueryResult> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Graphiti query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as MemoryQueryResult;
    } catch (error) {
      if (this.debug) {
        console.error('[MemoryEngine] Graphiti query error:', error);
      }

      // Return empty result on failure
      return {
        nodes: [],
        edges: [],
      };
    }
  }
}