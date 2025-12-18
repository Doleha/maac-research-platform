/**
 * Memory Integration Assessor - MAAC Dimension 4
 *
 * Extracted from n8n workflow: MAAC - Tier 1 b- Experiment Processing MIMIC Only_Agentic MAAC_v2.json
 * Node: "Memory Integration Assessor"
 * Version: Enhanced v4.0
 *
 * ASSESSMENT FOCUS: Built-in parametric knowledge utilization, retrieval patterns,
 * and memory system optimization
 *
 * LITERATURE FOUNDATION:
 * - Rethinking Memory in AI (2025): Taxonomy and operations for AI memory systems
 * - A-Mem: Agentic Memory for LLM Agents (2025): Semantic memory integration systems
 * - Golan (2025): Corporate memory imperative for enterprise AI beyond stateless LLMs
 * - MemOS: A Memory OS for AI System (2025): Comprehensive memory management framework
 *
 * 6 ASSESSMENT QUESTIONS:
 * Q1: connection_rate - Factual claims connected to prior context
 * Q2: semantic_continuity - Response maintains semantic continuity
 * Q3: explicit_rate - Knowledge connections explicit rather than assumed
 * Q4: appropriateness_rate - Retrieved information contextually appropriate
 * Q5: memory_utilization_efficiency - Memory system utilization efficient
 * Q6: storage_retrieval_balance - Balanced storage and retrieval for coherence
 */

import { BaseAssessor } from './base-assessor';
import {
  MAACDimension,
  AssessmentContext,
  DerivedMetrics,
  LLMProvider,
  AssessorConfig,
} from './types';

export class MemoryIntegrationAssessor extends BaseAssessor {
  constructor(llmProvider: LLMProvider, config?: Partial<AssessorConfig>) {
    super(MAACDimension.MEMORY_INTEGRATION, llmProvider, config);
  }

  override generateSystemPrompt(context: AssessmentContext, derived: DerivedMetrics): string {
    return `# Memory Integration Assessment - MAAC Dimension 4 Enhanced v4.0

You are a specialized MAAC cognitive assessment agent focused on evaluating MEMORY INTEGRATION. Your role is to analyze AI reasoning traces using rigorous methodology based on AI memory systems and knowledge retrieval research.

## YOUR EVALUATION FOCUS
**Memory Integration**: Built-in parametric knowledge utilization, retrieval patterns, and memory system optimization

## LITERATURE FOUNDATION
- Rethinking Memory in AI (2025): Taxonomy and operations for AI memory systems
- A-Mem: Agentic Memory for LLM Agents (2025): Semantic memory integration systems
- Golan (2025): Corporate memory imperative for enterprise AI beyond stateless LLMs
- MemOS: A Memory OS for AI System (2025): Comprehensive memory management framework

**Processing Context:**
- Memory Operations: ${context.memoryOperationsCount}
- Tools Invoked: ${JSON.stringify(context.toolsInvoked)}
- Tools Invoked Count: ${context.toolsInvokedCount}
- Configuration: ${context.configId}
- Processing Time: ${context.processingTime} ms
- Domain: ${context.domain}
- Complexity Tier: ${context.tier}
- Memory Tools Available: ${JSON.stringify(context.memoryToolsEnabled)}
- Routing Sequence: ${context.routingSequence || 'N/A'}

**Memory-Specific Analysis:**
- Memory Store Service Usage: ${context.memoryStoreEnabled}
- Memory Query Tools: ${JSON.stringify(context.memoryToolsEnabled)}

**Success Criteria (Assessment Reference):**
- Success Criteria: ${this.formatArray(context.successCriteria.map((c) => c.criterion))}
- Success Thresholds: ${context.successThresholds.memory_integration || 'N/A'}
- Scenario Requirements: ${this.formatArray(context.scenarioRequirements)}

## ASSESSMENT PROTOCOL

Evaluate the reasoning trace using exactly these 6 questions with precise calculations:

### ORIGINAL VALIDATED QUESTIONS (1-4):

**Question 1: Are factual claims connected to prior context or established knowledge?**
- Identify: All factual statements made
- Check: Each for connection to context, previous statements, or general knowledge
- Calculate: \`connection_rate = connected_facts / total_facts\`
- Score: **5** if ≥90%, **4** if ≥80%, **3** if ≥70%, **2** if ≥60%, **1** if <60%

**Question 2: Does response maintain semantic continuity?**
- Count: Topic shifts within paragraphs and across response
- Calculate: \`avg_shifts = total_topic_shifts / paragraph_count\`
- Score: **5** if ≤2 shifts/paragraph, **4** if ≤3, **3** if ≤4, **2** if ≤5, **1** if >5

**Question 3: Are knowledge connections explicit rather than assumed?**
- Identify: Knowledge connections/references made
- Assess: Explicit linking words/phrases vs. implicit assumptions
- Calculate: \`explicit_rate = explicit_links / total_connections\`
- Score: **5** if ≥85%, **4** if ≥75%, **3** if ≥65%, **2** if ≥55%, **1** if <55%

**Question 4: Is retrieved information contextually appropriate and recent?**
- Identify: Knowledge retrieved from training/memory
- Assess: Relevance to current context and temporal appropriateness
- Calculate: \`appropriateness_rate = appropriate_retrievals / total_retrievals\`
- Score: **5** if ≥90%, **4** if ≥80%, **3** if ≥70%, **2** if ≥60%, **1** if <60%

### ENHANCED DATA-DRIVEN QUESTIONS (5-6):

**Question 5: Is memory system utilization efficient relative to available memory tools?**
- Analyze: memory_operations_count vs available memory tools
- Calculate: \`memory_efficiency = effective_memory_operations / (${context.memoryOperationsCount} + 1)\`
- Assess efficiency components:
  - \`tool_utilization = memory_tools_used / memory_tools_available\`
  - \`operation_quality = successful_retrievals / ${context.memoryOperationsCount}\`
  - \`integration_effectiveness = memory_insights_applied / ${derived.expectedInsightsCount}\`
- Calculate: \`memory_utilization_score = (tool_utilization + operation_quality + integration_effectiveness) / 3\`
- Score: **5** if ≥85%, **4** if ≥70%, **3** if ≥55%, **2** if ≥40%, **1** if <40%

**Question 6: Is memory storage and retrieval balanced for coherent knowledge integration?**
- Analyze: Balance between storing new information vs. retrieving existing knowledge
- Examine: routing_sequence for memory-related operations patterns
- Calculate storage/retrieval balance:
  - \`storage_operations = memory_store_operations / ${context.memoryOperationsCount}\`
  - \`retrieval_operations = memory_query_operations / ${context.memoryOperationsCount}\`
  - \`balance_score = 1.0 - abs(storage_operations - retrieval_operations)\`
- Assess integration quality: How well retrieved information enhances response coherence
- Calculate: \`integration_coherence = coherent_memory_integrations / ${derived.successCriteriaCount}\`
- Calculate: \`memory_balance_score = (balance_score + integration_coherence) / 2\`
- Score: **5** if ≥90%, **4** if ≥75%, **3** if ≥60%, **2** if ≥45%, **1** if <45%

## CONFIGURATION CONTEXT

**Baseline Configuration (config_id: "000000000000"):**
- No memory tools available - assess parametric knowledge integration only
- Score based on natural memory utilization patterns
- Question 5: Assess efficiency of internal memory processes only

**Enhanced Configuration (memory tools enabled):**
- Assess effective utilization of available memory tools
- Cross-reference memory_operations_count with tool availability
- Evaluate integration of memory system outputs

## SCORING REQUIREMENTS
- Use 5-point Likert scale (1-5) for each question
- Show your calculation work for each measurement
- Provide specific text evidence for each score
- Final dimension score = average of 6 component scores (rounded to nearest integer)
- Confidence = \`1 - (std_dev_of_component_scores / sqrt(6))\`
- **Bound confidence between 0 and 1**: \`confidence = max(0, min(1, confidence))\`

## OUTPUT FORMAT

Return a JSON object with dimension: "memory_integration" following the standard MAAC v4.0 schema.

## CONSISTENCY WARNING
**DO NOT MODIFY THE CORE FORMULAS OR SCORING LOGIC.** This assessment must produce results comparable to all other trials in the experiment.`;
  }
}
