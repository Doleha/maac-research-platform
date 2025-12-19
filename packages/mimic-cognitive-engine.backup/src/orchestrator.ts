/**
 * MIMIC Orchestrator - Modular Intelligence for Memory-Integrated Cognition
 *
 * TypeScript implementation of the MIMIC Meta Cognitive Agent v4.4.8
 * Extracted from: MIMIC_Cognitive_Engine_experiment_ready_mulit_model.json
 *
 * This orchestrator coordinates cognitive processing through specialized
 * cognitive engines and memory systems.
 */

import {
  CognitiveSystem,
  CognitiveResponse,
  ToolConfiguration,
  ExecutionMetadata,
  LLMProvider,
} from '@maac/types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MIMICConfig {
  llmProvider: LLMProvider;
  memoryService: MemoryService;
  enabledEngines: Set<string>;
  graphitiEndpoint?: string;
}

export interface MemoryService {
  queryContext(params: MemoryQueryParams): Promise<MemoryQueryResult>;
  queryReflection(params: MemoryQueryParams): Promise<MemoryQueryResult>;
  queryEvaluation(params: MemoryQueryParams): Promise<MemoryQueryResult>;
  store(params: MemoryStoreParams): Promise<void>;
}

export interface MemoryQueryParams {
  query: string;
  userId: string;
  sessionId: string;
  limit?: number;
  searchType?: 'all' | 'nodes' | 'edges';
  searchScope?: 'global' | 'session';
  resolveLabels?: boolean;
  temporalWindowDays?: number;
}

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

export interface MemoryStoreParams {
  sessionId: string;
  content: string;
  activeGoals?: string[];
  memoryType: 'procedural' | 'episodic' | 'semantic' | 'declarative' | 'reflective';
}

export interface Tool {
  name: string;
  description: string;
  execute: (params: ToolParams) => Promise<ToolResult>;
}

export interface ToolParams {
  query: string;
  sessionId: string;
  iteration?: string;
  activeGoals?: string;
}

export interface ToolResult {
  success: boolean;
  output: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  content: string;
  iterations: number;
  memoryQueries: number;
  toolCalls: Array<{
    name: string;
    input: unknown;
    output: unknown;
  }>;
}

export interface ProcessingMetadata {
  method: 'natural_reasoning' | 'selective_enhancement';
  complexity: 'simple' | 'moderate' | 'complex';
  enhancementToolsInvoked: string[];
  memoryToolsUsed: string[];
  activeGoalsTracked: string[];
  goalProgressIndicators: Array<{
    goalId: string;
    processingStage: 'goal_setting' | 'planning' | 'validation' | 'execution';
    toolsApplied: string[];
  }>;
  metaToolsExecutionStatus: {
    memoryQuery: 'completed' | 'failed' | 'not_used';
    evaluationEngine: 'completed' | 'failed' | 'not_used';
    reflectionEngine: 'completed' | 'failed' | 'not_used';
    memoryStore: 'completed' | 'failed' | 'not_used';
  };
  routingSequence: string[];
  decisionReasoning: string;
}

// ============================================================================
// CONSTANTS - Extracted from n8n workflow
// ============================================================================

/**
 * All available MIMIC cognitive tools
 * Extracted from: MIMIC_Cognitive_Engine "Prepare Input" Code node
 */
export const ALL_MIMIC_TOOLS = [
  'Goal_Engine',
  'Planning_Engine',
  'Clarification_Engine',
  'Validation_Engine',
  'Evaluation Engine',
  'Reflection Engine',
  'Memory_Store_Service',
  'Memory_Query_Nodes',
  'Context_Memory_Query',
  'Evaluation_Memory_Query',
  'Reflection_Memory_Query',
  'Think',
] as const;

export type MIMICToolName = (typeof ALL_MIMIC_TOOLS)[number];

// ============================================================================
// SYSTEM PROMPT - Extracted EXACTLY from n8n workflow
// ============================================================================

/**
 * MIMIC Meta Cognitive Agent System Prompt v4.4.8
 *
 * EXTRACTED FROM: MIMIC_Cognitive_Engine_experiment_ready_mulit_model.json
 * NODE: "MIMIC Cognitive Agent" (type: @n8n/n8n-nodes-langchain.agent)
 * FIELD: parameters.options.systemMessage
 *
 * DO NOT MODIFY - This is the exact prompt from the n8n workflow
 */
export const MIMIC_SYSTEM_PROMPT = `# Updated MIMIC Meta Cognitive Agent Prompt v4.4.8
You are the MIMIC Meta Cognitive Agent - the central intelligence that coordinates cognitive processing through specialized cognitive engines and memory systems.

Your role is to intelligently orchestrate cognitive tools to analyze user requests, maintain context continuity, and provide comprehensive responses through memory-integrated reasoning.

## CORE RESPONSIBILITIES
1. **Natural Cognitive Processing** - Process user requests using your inherent reasoning capabilities first
2. **Selective Enhancement** - Invoke cognitive engines only when you identify specific needs for enhancement
3. **Memory Integration** - Retrieve and utilize both working and historical memory for context
4. **Context Continuity** - Maintain conversation flow and learning across sessions
5. **Mandatory Meta-Processing** - Always execute memory query, evaluation, reflection, and memory storage before finalizing responses
6. **Response Synthesis** - Combine natural reasoning with selective enhancements and meta-insights into comprehensive responses

## GOAL STATE AWARENESS

You maintain awareness of active goals across all interactions through goal state threading:
- Track active goals and their current status
- Pass goal context to all cognitive tools
- Monitor goal progress and completion
- Maintain goal continuity across sessions

When invoking cognitive tools, always include active_goals parameter with current goal context.

## GOAL ID HANDLING

You receive goal IDs from cognitive engines (particularly Goal_Engine) and must:
- Track received goal IDs in your processing metadata
- Reference these exact goal IDs when tracking progress
- Pass goal context to tools using the goal IDs from engine outputs
- Never modify or generate new goal IDs - only use what engines provide

{{ toolConfigurationInstructions }}

### LLM MODEL SELECTOR
{{ modelId }}

### TOOL PARAMETER FORMAT

When invoking cognitive tools that accept active_goals parameter:
- Pass the actual goal IDs (UUIDs) received from previous engine outputs
- Use the exact UUID format, not semantic descriptions
- Example: "active_goals": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
- NOT: "active_goals": "improve team productivity"

If no explicit goal UUIDs exist from Goal_Engine, omit the active_goals parameter rather than passing semantic descriptions.

## IMPLICIT GOAL TRACKING

When using natural reasoning and identifying goals without invoking Goal_Engine:
- Include implicit goals in active_goals_tracked using clear semantic descriptions
- Use descriptive phrases that capture the user's objective
- These semantic goals will coexist with UUID goals from Goal_Engine
- Maintain both types in the same tracking array for comprehensive goal awareness

Examples of implicit goal tracking:
- "improve customer satisfaction"
- "reduce operational costs" 
- "increase team productivity"

### MULTIPLE GOAL MANAGEMENT

Handle multiple goals dynamically:
- **Single goal conversations**: Track one goal ID/description in the array
- **Multi-goal conversations**: Track all relevant goals from current session (both UUID and semantic)
- **Cross-session goals**: Include goals from previous sessions that remain active
- **Goal evolution**: Add new goals to tracking array as they are created
- **Goal completion**: Remove completed goals from active tracking
- **Mixed tracking**: Combine UUID goals (from Goal_Engine) and semantic goals (from natural reasoning)

Examples:
- Single UUID: ["f47ac10b-58cc-4372-a567-0e02b2c3d479"]
- Single semantic: ["improve customer satisfaction"]
- Multiple mixed: ["f47ac10b-58cc-4372-a567-0e02b2c3d479", "improve customer satisfaction", "a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
- Cross-session mixed: ["83ef81cf-131b-4d67-92b5-252486a05de6", "reduce operational costs"]

## ENHANCED COGNITIVE PROTOCOL

**MANDATORY MEMORY INTEGRATION (ALWAYS FIRST):**
You MUST start every interaction by invoking the appropriate memory tool to retrieve relevant historical context, user preferences, and past interaction patterns.

**PRIMARY PROCESSING:**
Process user requests using your natural reasoning capabilities enhanced by memory context. Leverage your inherent analytical strengths, pattern recognition, and problem-solving abilities before considering tool enhancement.

**SELECTIVE ENHANCEMENT (Use only when you identify specific needs):**
- **Internet_Search**: When you need current information, real-time data, or external knowledge beyond your training
- **Goal_Engine**: When objectives need more structure than you can provide naturally
- **Planning_Engine**: When strategies need detailed execution planning beyond your capabilities
- **Clarification_Engine**: When you need specific information to proceed effectively
- **Validation_Engine**: When approaches need feasibility assessment you cannot perform
- **Think**: When complex problems require structured step-by-step analysis

**MANDATORY META-PROCESSING (MUST EXECUTE BEFORE EVERY USER RESPONSE):**
You MUST invoke these tools in sequence before providing ANY response to the user:
1. **Evaluation_Engine** - to assess your cognitive performance and behavioral metrics
2. **Reflection_Engine** - to extract learning insights and process improvements
3. **Memory_Store_Service** - to capture insights, user preferences, valuable patterns, AND findings from evaluation and reflection

## AVAILABLE COGNITIVE TOOLS

### COGNITIVE ENHANCEMENT TOOLS
- **Internet_Search**: Accesses current information, real-time data, recent developments, and external knowledge sources
- **Goal_Engine**: Extracts and structures user objectives into clear goals with success criteria and constraints
- **Planning_Engine**: Develops execution strategies with timelines, resources, and risk assessments from structured goals
- **Clarification_Engine**: Resolves ambiguities through targeted questions about scope, timeframe, and constraints
- **Validation_Engine**: Assesses feasibility, completeness, and constraint satisfaction of goals and plans
- **Think**: Essential for structured reasoning and cognitive strategy planning when complex analysis is needed

### MEMORY RETRIEVAL TOOLS (CHOOSE THE RIGHT TOOL FOR THE QUERY TYPE)
- **Context_Memory_Query**: Retrieve user identity information, personal details, entity summaries, cross-session context, user preferences, past interactions, procedural knowledge, and relational facts. Use for maintaining continuity and accessing user-specific information across sessions.
- **Reflection_Memory_Query**: Retrieve performance insights, learning patterns, process improvements, and meta-cognitive observations. Use when you need to understand past cognitive performance and apply learned strategies.
- **Evaluation_Memory_Query**: Retrieve behavioral metrics, assessment scores, performance data, and quantitative cognitive measurements. Use when you need to access self performance tracking data and measurement history to improve self performance from previous interactions (self learning).

### META-COGNITIVE TOOLS (USE FOR EVERY RESPONSE)
- **Evaluation_Engine**: Analyze your own cognitive performance using objective behavioral data from processing sessions
- **Reflection_Engine**: Extract learning insights and process improvements from cognitive journey patterns
- **Memory_Store_Service**: Capture insights, user information, preferences, successful strategies, session outcomes, AND evaluation/reflection findings

## MEMORY RETRIEVAL STRATEGY

**For all memory queries** (identity, personal info, preferences, context, background):
→ Use **Context_Memory_Query** - now handles all user information, entity data, and contextual memory retrieval

**For cognitive performance insights** ("How did we solve this before?", "What strategies worked well?", "What patterns have we learned?"):
→ Use **Reflection_Memory_Query**

**For performance data and metrics** ("How am I performing?", "What are my assessment scores?", "Show me behavioral metrics"):
→ Use **Evaluation_Memory_Query**

**When in doubt**: Use Context_Memory_Query as it now contains all user-specific information and entity data, then use specialized memory tools as needed.

## TOOL EXECUTION VERIFICATION

**CRITICAL REQUIREMENT:**
Before reporting tool usage in processing metadata, you MUST verify actual execution:

- **"completed"**: Only if the tool actually returned results and was processed
- **"failed"**: Only if the tool was called but returned an error or no results  
- **"not_used"**: If the tool was not available, not called, or skipped
- **NEVER claim tool usage without actual execution verification**

**MEMORY RETRIEVAL FALLBACK:**
If Memory_Query tools are unavailable or return no results:
- Acknowledge limited memory access in your decision reasoning
- Proceed with natural reasoning capabilities only  
- Report accurate tool status as "not_used" or "failed" in metadata
- Do not fabricate memory retrieval results

## ENHANCED PROCESSING FLOW

1. **MANDATORY Memory Query** → ATTEMPT to invoke the appropriate Memory_Query tool to retrieve historical context. If tool fails or is unavailable, proceed with natural reasoning and report accurate status.
2. **Natural Processing** → Use your inherent reasoning capabilities to address the user request
3. **Enhancement Assessment** → Identify if you need specific tool enhancements
4. **Selective Tool Use** → Invoke only the specific enhancement tools you identified as needed
5. **MANDATORY Meta-Processing** → BEFORE finalizing ANY response, execute in sequence:
   - Invoke Evaluation_Engine to assess cognitive performance and behavioral metrics
   - Invoke Reflection_Engine to extract learning insights and process improvements
   - Invoke Memory_Store_Service to capture session insights, user information, AND evaluation/reflection findings
6. **Final Response Synthesis** → Combine your natural reasoning + tool enhancements + meta-insights into comprehensive user response
7. **Complete** → Provide final response with processing metadata

## COGNITIVE MONITORING

**Contradiction Detection Triggers:**
- Quantitative metrics contradict qualitative feedback
- Different stakeholders report conflicting assessments of same issue
- User behavior contradicts stated preferences or satisfaction scores
- System performance data conflicts with user experience reports
- Success metrics don't align with business outcomes

**Dynamic Reflection Assessment:**
After tool executions, analyze output patterns for reflection needs:
- **Quality trajectory**: Are tool outputs showing degrading quality, increasing assumptions, or accumulating critical issues?
- **Cognitive progress**: Is each tool adding value or creating complexity? Are we moving toward or away from goal resolution?
- **Contextual adaptation**: Is the current approach appropriate for this problem type? Do tools suggest we need different cognitive strategies?
- **Goal alignment**: After 3+ tool executions, query memory for original goal_state and compare current processing direction with original objectives

## DUAL TRACKING PROTOCOL

For every interaction, follow this sequence:

1. **MANDATORY Memory Query** → Use appropriate Memory_Query tool based on query type
2. **Process user request** using natural reasoning + selective enhancements
3. **EXECUTE MANDATORY META-PROCESSING**: Evaluation_Engine → Reflection_Engine → Memory_Store_Service before each response.
4. **Provide final natural response** that synthesizes ALL relevant input collected from memory systems and cognitive engines to develop detailed, rich, comprehensive responses - not high-level summaries. Incorporate specific insights, data points, and contextual information from all available sources to create thorough, actionable responses.
5. **DO NOT** share processing steps or internal processing logic such as outputs from evaluation or reflection agents.

**MANDATORY SCHEMA OUTPUT:**
Then you MUST always end your response with EXACTLY this JSON structure. Do not modify field names, do not omit fields, do not add extra fields. Even if tools fail or processing is incomplete, you MUST still output this complete schema with accurate status reporting.

{
  "sessionId": "{{ sessionId }}",
  "experiment_metadata": {
    "trial_id": "{{ experimentMetadata.trialId }}",
    "experiment_id": "{{ experimentMetadata.experimentId }}",
    "model_id": "{{ experimentMetadata.modelId }}",
    "domain": "{{ experimentMetadata.domain }}",
    "tier": "{{ experimentMetadata.tier }}",
    "config_id": "{{ experimentMetadata.configId }}",
    "scenario_number": "{{ experimentMetadata.scenarioNumber }}",
    "maac_framework_version": "{{ experimentMetadata.maacFrameworkVersion }}"
  },
  "processing_metadata": {
    "method": "natural_reasoning|selective_enhancement",
    "complexity": "simple|moderate|complex",
    "enhancement_tools_invoked": ["array_of_enhancement_tools_used"],
    "memory_tools_used": ["Context_Memory_Query|Reflection_Memory_Query|Evaluation_Memory_Query"],
    "active_goals_tracked": [
      "mixed array of goal IDs (UUIDs from Goal_Engine and semantic descriptions from natural reasoning)"
    ],
    "goal_progress_indicators": [
      {
        "goal_id": "string", 
        "processing_stage": "goal_setting|planning|validation|execution",
        "tools_applied": ["goal_engine", "planning_engine"]
      }
    ],
    "meta_tools_execution_status": {
      "memory_query": "completed (tool executed successfully) | failed (tool called but errored) | not_used (tool unavailable or skipped)",
      "evaluation_engine": "completed|failed|not_used", 
      "reflection_engine": "completed|failed|not_used",
      "memory_store": "completed|failed|not_used"
    },   
    "routing_sequence": ["actual_sequence_of_cognitive_tools_invoked"],
    "decision_reasoning": "why this approach was chosen",
    "processing_sequence": "memory query → natural reasoning → selective enhancements → mandatory meta-processing → final synthesis",
    "memory_actions": {
      "stored_insights": ["list_of_insights_stored"],
      "storage_trigger": "automatic || human_invoked"
    }
  }
}
FAILURE TO INCLUDE THIS JSON BLOCK WILL BREAK THE EXPERIMENTAL PIPELINE.
NO EXCEPTIONS. ALWAYS INCLUDE THIS JSON AT THE END OF EVERY RESPONSE.

CRITICAL: ALWAYS start with the appropriate Memory_Query tool based on query type, use your natural cognitive capabilities as the foundation, enhance selectively when you identify specific needs, and ALWAYS execute meta-cognitive processing (Evaluation_Engine → Reflection_Engine → Memory_Store_Service) BEFORE providing ANY response. Memory_Store_Service should capture not only session insights but also findings from evaluation and reflection. Do not complete any interaction without executing all four mandatory tools.`;

// ============================================================================
// TOOL DESCRIPTIONS - Extracted from n8n workflow toolWorkflow nodes
// ============================================================================

/**
 * Tool descriptions extracted from n8n workflow nodes
 * These are the exact descriptions used in the agent's tool definitions
 */
export const TOOL_DESCRIPTIONS = {
  /**
   * Goal_Engine tool description
   * NODE: "Goal_Engine" (type: @n8n/n8n-nodes-langchain.toolWorkflow)
   * FIELD: parameters.description
   */
  Goal_Engine: `Call this tool to extract and structure user objectives into clear goals with success criteria, constraints, and sub-components, while identifying ambiguities that may require clarification before proceeding to planning or execution.`,

  /**
   * Planning_Engine tool description
   * NODE: "Planning_Engine" (type: @n8n/n8n-nodes-langchain.toolWorkflow)
   * FIELD: parameters.description
   */
  Planning_Engine: `Call this tool to analyze structured goals and develop comprehensive execution strategies with step-by-step approaches, resource requirements, risk assessments, and timeline estimates, while determining the optimal path forward based on constraints and success criteria.`,

  /**
   * Clarification_Engine tool description
   * NODE: "Clarification_Engine" (type: @n8n/n8n-nodes-langchain.toolWorkflow)
   * FIELD: parameters.description
   */
  Clarification_Engine: `Call this tool to identify and resolve ambiguities in user objectives or requirements by generating targeted questions about scope, timeframe, metrics, priorities, and constraints, ensuring sufficient clarity before proceeding with planning or execution.`,

  /**
   * Validation_Engine tool description
   * NODE: "Validation_Engine" (type: @n8n/n8n-nodes-langchain.toolWorkflow)
   * FIELD: parameters.description
   */
  Validation_Engine: `Call this tool to assess the feasibility, completeness, and quality of goals and plans by evaluating resource availability, constraint satisfaction, risk factors, and alignment with success criteria, while identifying potential issues or improvements needed before execution.`,

  /**
   * Memory_Store_Service tool description
   * NODE: "Memory_Store_Service" (type: @n8n/n8n-nodes-langchain.toolWorkflow)
   * FIELD: parameters.description
   */
  Memory_Store_Service: `Call this tool to intelligently store and categorize cognitive insights for long-term, permanent storage across five memory types: procedural (how-to knowledge and processes), episodic (specific events and experiences), semantic (facts and general knowledge), declarative (stated preferences and explicit information), and reflective (performance insights and learnings), while enriching each memory with appropriate metadata for enhanced retrieval and cross-session learning.`,

  /**
   * Evaluation_Engine tool description
   * NODE: "Evaluation Engine" (type: @n8n/n8n-nodes-langchain.toolWorkflow)
   * FIELD: parameters.description
   */
  Evaluation_Engine: `Call this tool to evaluate MIMIC's cognitive performance through systematic analysis of behavioral metrics, automated application of performance calculation formulas, and generation of standardized assessment scores across task completion, contextual coherence, reasoning quality, and adaptive flexibility dimensions.`,

  /**
   * Reflection_Engine tool description
   * NODE: "Reflection Engine" (type: @n8n/n8n-nodes-langchain.toolWorkflow)
   * FIELD: parameters.description
   */
  Reflection_Engine: `Call this tool to perform meta-cognitive analysis of cognitive processing traces, identifying patterns in decision-making effectiveness, routing efficiency, and system performance to generate actionable insights for process optimization and learning enhancement in future cognitive sessions.`,

  /**
   * Context_Memory_Query tool description
   * NODE: "Context_Memory_Query" (type: n8n-nodes-base.httpRequestTool)
   * FIELD: parameters.toolDescription
   */
  Context_Memory_Query: `Call this tool to retrieve relationships, facts, preferences, procedural knowledge, and contextual information from the knowledge graph. Use this for queries about user preferences, past interactions, how-to knowledge, processes, and relational facts between entities. Include goal id and plan id if need as part of continuation of previous work.`,

  /**
   * Reflection_Memory_Query tool description
   * NODE: "Reflection_Memory_Query" (type: n8n-nodes-base.httpRequestTool)
   * FIELD: parameters.toolDescription
   */
  Reflection_Memory_Query: `Call this tool to retrieve performance insights, learning patterns, process improvements, and meta-cognitive observations from the knowledge graph. Use this for queries about past cognitive performance, successful strategies, learned approaches, adaptive reasoning patterns, and process optimization insights from previous sessions. Include goal id and plan id if need as part of continuation of previous work.`,

  /**
   * Evaluation_Memory_Query tool description
   * NODE: "Evaluation_Memory_Query" (type: n8n-nodes-base.httpRequestTool)
   * FIELD: parameters.toolDescription
   */
  Evaluation_Memory_Query: `Call this tool to retrieve behavioral metrics, assessment scores, performance data, and quantitative cognitive measurements from the knowledge graph. Use this for queries about cognitive performance tracking, assessment results, behavioral analysis data, task completion metrics, and systematic performance evaluations across sessions. Include goal id and plan id if need as part of continuation of previous work.`,

  /**
   * Think tool (built-in LangChain tool)
   * NODE: "Think" (type: @n8n/n8n-nodes-langchain.toolThink)
   */
  Think: `Use this tool for structured reasoning and cognitive strategy planning when complex analysis is needed. Essential for step-by-step thinking through difficult problems.`,
} as const;

// ============================================================================
// MEMORY QUERY ENDPOINTS - Extracted from n8n workflow
// ============================================================================

/**
 * Memory query endpoint configurations
 * Extracted from httpRequestTool nodes
 */
export const MEMORY_ENDPOINTS = {
  context: {
    url: 'http://graphiti-webhook:8080/search_context',
    defaultParams: {
      limit: 10,
      searchType: 'all',
      searchScope: 'global',
      resolveLabels: true,
      temporalWindowDays: 30,
    },
  },
  reflection: {
    url: 'http://graphiti-webhook:8080/search_reflection',
    defaultParams: {
      limit: 10,
      resolveLabels: true,
      temporalWindowDays: 7,
    },
  },
  evaluation: {
    url: 'http://graphiti-webhook:8080/search_evaluation',
    defaultParams: {
      limit: 10,
      resolveLabels: true,
      temporalWindowDays: 7,
    },
  },
} as const;

// ============================================================================
// MAIN ORCHESTRATOR CLASS
// ============================================================================

export class MIMICOrchestrator implements CognitiveSystem {
  private readonly config: MIMICConfig;

  constructor(config: MIMICConfig) {
    this.config = config;
  }

  /**
   * Execute a cognitive task with given configuration
   * Implements the CognitiveSystem interface for MAAC evaluation
   */
  async execute(query: string, toolConfig: ToolConfiguration): Promise<CognitiveResponse> {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    // Build system prompt with tool configuration
    const systemPrompt = this.buildSystemPrompt(toolConfig);

    // Build available tools based on configuration
    const tools = this.buildTools(toolConfig);

    // Execute cognitive loop
    const response = await this.executeCognitiveLoop({
      query,
      systemPrompt,
      tools,
      sessionId,
      toolConfig,
    });

    // Build execution metadata for MAAC assessment
    const metadata: ExecutionMetadata = {
      processingTime: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      cognitiveCyclesCount: response.iterations || 1,
      memoryOperationsCount: response.memoryQueries || 0,
      toolsInvokedCount: response.toolCalls?.length || 0,
      toolsInvoked: response.toolCalls?.map((t) => t.name) || [],
      processingMethod: this.determineProcessingMethod(response),
      complexityAssessment: this.assessComplexity(response),
      modelId: toolConfig.configId,
      modelName: this.config.llmProvider.model || 'unknown',
      sessionId,
      trialId: `${sessionId}-${Date.now()}`,
      wordCount: response.content.split(/\s+/).length,
      responseText: response.content,
    };

    return {
      content: response.content,
      metadata,
    };
  }

  /**
   * Generate UUID v4 session ID
   * Extracted from: "Prepare Input" Code node in MIMIC workflow
   */
  private generateSessionId(): string {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Build system prompt with tool configuration instructions
   * Implements the dynamic prompt building from n8n workflow
   */
  private buildSystemPrompt(toolConfig: ToolConfiguration): string {
    const toolConfigInstructions = this.translateToolConfig(toolConfig);

    return MIMIC_SYSTEM_PROMPT.replace(
      '{{ toolConfigurationInstructions }}',
      toolConfigInstructions ? `\n\nTOOL CONFIGURATION:\n${toolConfigInstructions}` : '',
    ).replace('{{ modelId }}', toolConfig.configId || 'default');
  }

  /**
   * Translate tool configuration to instruction string
   * Extracted from: "Prepare Input" Code node - translateToolConfig function
   */
  private translateToolConfig(toolConfig: ToolConfiguration): string {
    const enabledTools: string[] = [];
    const disabledTools: string[] = [];

    // Map ToolConfiguration flags to tool names
    const toolMapping: Array<[keyof ToolConfiguration, string]> = [
      ['goalEngine', 'Goal_Engine'],
      ['planningEngine', 'Planning_Engine'],
      ['clarificationEngine', 'Clarification_Engine'],
      ['validationEngine', 'Validation_Engine'],
      ['reflectionEngine', 'Reflection Engine'],
      ['evaluationEngine', 'Evaluation Engine'],
      ['memoryStore', 'Memory_Store_Service'],
      ['contextMemory', 'Context_Memory_Query'],
      ['reflectionMemory', 'Reflection_Memory_Query'],
      ['evaluationMemory', 'Evaluation_Memory_Query'],
      ['structuredReasoning', 'Think'],
    ];

    for (const [configKey, toolName] of toolMapping) {
      if (toolConfig[configKey]) {
        enabledTools.push(toolName);
      } else {
        disabledTools.push(toolName);
      }
    }

    return `
EXPERIMENTAL TOOL CONFIGURATION:
ENABLED TOOLS: ${enabledTools.join(', ')}
DISABLED TOOLS: ${disabledTools.join(', ')}
You MUST ONLY use the enabled tools listed above. Do not invoke any disabled tools during this experimental session.
`;
  }

  /**
   * Build available tools based on configuration
   * Creates Tool objects for each enabled tool in the configuration
   */
  private buildTools(toolConfig: ToolConfiguration): Tool[] {
    const tools: Tool[] = [];

    // Goal Engine
    if (toolConfig.goalEngine) {
      tools.push({
        name: 'Goal_Engine',
        description: TOOL_DESCRIPTIONS.Goal_Engine,
        execute: async (params) => this.callEngine('goal', params),
      });
    }

    // Planning Engine
    if (toolConfig.planningEngine) {
      tools.push({
        name: 'Planning_Engine',
        description: TOOL_DESCRIPTIONS.Planning_Engine,
        execute: async (params) => this.callEngine('planning', params),
      });
    }

    // Clarification Engine
    if (toolConfig.clarificationEngine) {
      tools.push({
        name: 'Clarification_Engine',
        description: TOOL_DESCRIPTIONS.Clarification_Engine,
        execute: async (params) => this.callEngine('clarification', params),
      });
    }

    // Validation Engine
    if (toolConfig.validationEngine) {
      tools.push({
        name: 'Validation_Engine',
        description: TOOL_DESCRIPTIONS.Validation_Engine,
        execute: async (params) => this.callEngine('validation', params),
      });
    }

    // Evaluation Engine
    if (toolConfig.evaluationEngine) {
      tools.push({
        name: 'Evaluation_Engine',
        description: TOOL_DESCRIPTIONS.Evaluation_Engine,
        execute: async (params) => this.callEngine('evaluation', params),
      });
    }

    // Reflection Engine
    if (toolConfig.reflectionEngine) {
      tools.push({
        name: 'Reflection_Engine',
        description: TOOL_DESCRIPTIONS.Reflection_Engine,
        execute: async (params) => this.callEngine('reflection', params),
      });
    }

    // Memory Store Service
    if (toolConfig.memoryStore) {
      tools.push({
        name: 'Memory_Store_Service',
        description: TOOL_DESCRIPTIONS.Memory_Store_Service,
        execute: async (params) => {
          await this.config.memoryService.store({
            sessionId: params.sessionId,
            content: params.query,
            activeGoals: params.activeGoals?.split(','),
            memoryType: 'semantic',
          });
          return { success: true, output: 'Memory stored successfully' };
        },
      });
    }

    // Context Memory Query
    if (toolConfig.contextMemory) {
      tools.push({
        name: 'Context_Memory_Query',
        description: TOOL_DESCRIPTIONS.Context_Memory_Query,
        execute: async (params) => {
          const result = await this.config.memoryService.queryContext({
            query: params.query,
            userId: params.sessionId,
            sessionId: params.sessionId,
            ...MEMORY_ENDPOINTS.context.defaultParams,
          });
          return { success: true, output: JSON.stringify(result) };
        },
      });
    }

    // Reflection Memory Query
    if (toolConfig.reflectionMemory) {
      tools.push({
        name: 'Reflection_Memory_Query',
        description: TOOL_DESCRIPTIONS.Reflection_Memory_Query,
        execute: async (params) => {
          const result = await this.config.memoryService.queryReflection({
            query: params.query,
            userId: params.sessionId,
            sessionId: params.sessionId,
            ...MEMORY_ENDPOINTS.reflection.defaultParams,
          });
          return { success: true, output: JSON.stringify(result) };
        },
      });
    }

    // Evaluation Memory Query
    if (toolConfig.evaluationMemory) {
      tools.push({
        name: 'Evaluation_Memory_Query',
        description: TOOL_DESCRIPTIONS.Evaluation_Memory_Query,
        execute: async (params) => {
          const result = await this.config.memoryService.queryEvaluation({
            query: params.query,
            userId: params.sessionId,
            sessionId: params.sessionId,
            ...MEMORY_ENDPOINTS.evaluation.defaultParams,
          });
          return { success: true, output: JSON.stringify(result) };
        },
      });
    }

    // Think tool (structured reasoning)
    if (toolConfig.structuredReasoning) {
      tools.push({
        name: 'Think',
        description: TOOL_DESCRIPTIONS.Think,
        execute: async (params) => {
          // Think tool is handled by the LLM itself
          return { success: true, output: params.query };
        },
      });
    }

    return tools;
  }

  /**
   * Call a cognitive engine workflow
   * In n8n, these are Execute Workflow nodes that call separate workflows
   */
  private async callEngine(
    engineType: 'goal' | 'planning' | 'clarification' | 'validation' | 'evaluation' | 'reflection',
    _params: ToolParams,
  ): Promise<ToolResult> {
    // This would call the actual engine implementation
    // In n8n, these are separate workflows called via toolWorkflow nodes
    // _params will be used when engine implementations are added
    throw new Error(
      `Engine ${engineType} not yet implemented - requires engine workflow migration`,
    );
  }

  /**
   * Execute the cognitive processing loop
   * This implements the LangChain agent execution pattern from n8n
   */
  private async executeCognitiveLoop(_params: {
    query: string;
    systemPrompt: string;
    tools: Tool[];
    sessionId: string;
    toolConfig: ToolConfiguration;
  }): Promise<AgentResponse> {
    // This would integrate with the actual LLM and tool execution
    // The n8n workflow uses @n8n/n8n-nodes-langchain.agent with returnIntermediateSteps: true
    // _params will be used when LLM integration is added

    // Placeholder implementation - actual implementation requires LLM integration
    throw new Error('Cognitive loop not yet implemented - requires LLM provider integration');
  }

  /**
   * Determine processing method based on response analysis
   */
  private determineProcessingMethod(
    response: AgentResponse,
  ): 'direct' | 'iterative' | 'reflective' {
    if (response.iterations <= 1 && response.toolCalls.length === 0) {
      return 'direct';
    }
    if (response.toolCalls.some((t) => t.name.includes('Reflection'))) {
      return 'reflective';
    }
    return 'iterative';
  }

  /**
   * Assess complexity based on response characteristics
   */
  private assessComplexity(response: AgentResponse): 'simple' | 'moderate' | 'complex' {
    const wordCount = response.content.split(/\s+/).length;
    const toolCount = response.toolCalls.length;

    if (wordCount < 200 && toolCount <= 1) {
      return 'simple';
    }
    if (wordCount < 500 && toolCount <= 3) {
      return 'moderate';
    }
    return 'complex';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Filter scenario data for blind MIMIC evaluation
 * Extracted from: "Prepare Input" Code node - filterControlScenario function
 *
 * Creates completely blind task data for MIMIC (NO SUCCESS CRITERIA)
 */
export function filterControlScenario(scenario: {
  task_title: string;
  task_description: string;
  business_context: string;
  complexity_level: string;
  requirements: string[];
  domain_specific_data?: Record<string, unknown>;
  trial_id: string;
  experiment_id: string;
  domain: string;
  tier: string;
  scenario_number: number;
  amaic_framework_version: string;
  model_id: string;
}): {
  task_title: string;
  task_description: string;
  business_context: string;
  complexity_level: string;
  requirements: string[];
  domain_specific_data?: Record<string, unknown>;
  metadata: {
    trial_id: string;
    experiment_id: string;
    domain: string;
    tier: string;
    scenario_number: number;
    amaic_framework_version: string;
    model_id: string;
  };
} {
  return {
    task_title: scenario.task_title,
    task_description: scenario.task_description,
    business_context: scenario.business_context,
    complexity_level: scenario.complexity_level,
    requirements: scenario.requirements,
    // SUCCESS CRITERIA COMPLETELY REMOVED FOR BLIND EVALUATION
    domain_specific_data: scenario.domain_specific_data,
    // Include experiment metadata for tracking only
    metadata: {
      trial_id: scenario.trial_id,
      experiment_id: scenario.experiment_id,
      domain: scenario.domain,
      tier: scenario.tier,
      scenario_number: scenario.scenario_number,
      amaic_framework_version: scenario.amaic_framework_version,
      model_id: scenario.model_id,
    },
  };
}

/**
 * Normalize tool name for comparison
 * Extracted from: "Prepare Input" Code node
 */
export function normalizeToolName(name: string): string {
  return name.toLowerCase().replace(/[_\s]/g, '');
}

export default MIMICOrchestrator;
