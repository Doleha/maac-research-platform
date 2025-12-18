/**
 * MAAC Nine-Dimensional Assessment Framework
 * 
 * Exports all 9 dimension assessors extracted from n8n Tier 1b workflow:
 * MAAC - Tier 1 b- Experiment Processing MIMIC Only_Agentic MAAC_v2.json
 */

// Types
export * from './types';

// Base Assessor
export { BaseAssessor } from './base-assessor';

// 9 Dimension Assessors
export { CognitiveLoadAssessor } from './cognitive-load';
export { ToolExecutionAssessor } from './tool-execution';
export { ContentQualityAssessor } from './content-quality';
export { MemoryIntegrationAssessor } from './memory-integration';
export { ComplexityHandlingAssessor } from './complexity-handling';
export { HallucinationControlAssessor } from './hallucination-control';
export { KnowledgeTransferAssessor } from './knowledge-transfer';
export { ProcessingEfficiencyAssessor } from './processing-efficiency';
export { ConstructValidityAssessor } from './construct-validity';

// Assessor Factory
import { BaseAssessor } from './base-assessor';
import { CognitiveLoadAssessor } from './cognitive-load';
import { ToolExecutionAssessor } from './tool-execution';
import { ContentQualityAssessor } from './content-quality';
import { MemoryIntegrationAssessor } from './memory-integration';
import { ComplexityHandlingAssessor } from './complexity-handling';
import { HallucinationControlAssessor } from './hallucination-control';
import { KnowledgeTransferAssessor } from './knowledge-transfer';
import { ProcessingEfficiencyAssessor } from './processing-efficiency';
import { ConstructValidityAssessor } from './construct-validity';
import { MAACDimension, LLMProvider, AssessorConfig } from './types';

/**
 * Factory function to create all 9 MAAC dimension assessors
 */
export function createAllAssessors(
  llmProvider: LLMProvider,
  config?: Partial<AssessorConfig>
): Map<MAACDimension, BaseAssessor> {
  const assessors = new Map<MAACDimension, BaseAssessor>();

  assessors.set(MAACDimension.COGNITIVE_LOAD, new CognitiveLoadAssessor(llmProvider, config));
  assessors.set(MAACDimension.TOOL_EXECUTION, new ToolExecutionAssessor(llmProvider, config));
  assessors.set(MAACDimension.CONTENT_QUALITY, new ContentQualityAssessor(llmProvider, config));
  assessors.set(MAACDimension.MEMORY_INTEGRATION, new MemoryIntegrationAssessor(llmProvider, config));
  assessors.set(MAACDimension.COMPLEXITY_HANDLING, new ComplexityHandlingAssessor(llmProvider, config));
  assessors.set(MAACDimension.HALLUCINATION_CONTROL, new HallucinationControlAssessor(llmProvider, config));
  assessors.set(MAACDimension.KNOWLEDGE_TRANSFER, new KnowledgeTransferAssessor(llmProvider, config));
  assessors.set(MAACDimension.PROCESSING_EFFICIENCY, new ProcessingEfficiencyAssessor(llmProvider, config));
  assessors.set(MAACDimension.CONSTRUCT_VALIDITY, new ConstructValidityAssessor(llmProvider, config));

  return assessors;
}

/**
 * Create a single assessor by dimension
 */
export function createAssessor(
  dimension: MAACDimension,
  llmProvider: LLMProvider,
  config?: Partial<AssessorConfig>
): BaseAssessor {
  switch (dimension) {
    case MAACDimension.COGNITIVE_LOAD:
      return new CognitiveLoadAssessor(llmProvider, config);
    case MAACDimension.TOOL_EXECUTION:
      return new ToolExecutionAssessor(llmProvider, config);
    case MAACDimension.CONTENT_QUALITY:
      return new ContentQualityAssessor(llmProvider, config);
    case MAACDimension.MEMORY_INTEGRATION:
      return new MemoryIntegrationAssessor(llmProvider, config);
    case MAACDimension.COMPLEXITY_HANDLING:
      return new ComplexityHandlingAssessor(llmProvider, config);
    case MAACDimension.HALLUCINATION_CONTROL:
      return new HallucinationControlAssessor(llmProvider, config);
    case MAACDimension.KNOWLEDGE_TRANSFER:
      return new KnowledgeTransferAssessor(llmProvider, config);
    case MAACDimension.PROCESSING_EFFICIENCY:
      return new ProcessingEfficiencyAssessor(llmProvider, config);
    case MAACDimension.CONSTRUCT_VALIDITY:
      return new ConstructValidityAssessor(llmProvider, config);
    default:
      throw new Error(`Unknown dimension: ${dimension}`);
  }
}

/**
 * MAAC dimension order (as used in experiments)
 */
export const DIMENSION_ORDER: MAACDimension[] = [
  MAACDimension.COGNITIVE_LOAD,
  MAACDimension.TOOL_EXECUTION,
  MAACDimension.CONTENT_QUALITY,
  MAACDimension.MEMORY_INTEGRATION,
  MAACDimension.COMPLEXITY_HANDLING,
  MAACDimension.HALLUCINATION_CONTROL,
  MAACDimension.KNOWLEDGE_TRANSFER,
  MAACDimension.PROCESSING_EFFICIENCY,
  MAACDimension.CONSTRUCT_VALIDITY,
];

/**
 * Dimension display names for reporting
 */
export const DIMENSION_NAMES: Record<MAACDimension, string> = {
  [MAACDimension.COGNITIVE_LOAD]: 'Cognitive Load',
  [MAACDimension.TOOL_EXECUTION]: 'Tool Execution',
  [MAACDimension.CONTENT_QUALITY]: 'Content Quality',
  [MAACDimension.MEMORY_INTEGRATION]: 'Memory Integration',
  [MAACDimension.COMPLEXITY_HANDLING]: 'Complexity Handling',
  [MAACDimension.HALLUCINATION_CONTROL]: 'Hallucination Control',
  [MAACDimension.KNOWLEDGE_TRANSFER]: 'Knowledge Transfer',
  [MAACDimension.PROCESSING_EFFICIENCY]: 'Processing Efficiency',
  [MAACDimension.CONSTRUCT_VALIDITY]: 'Construct Validity',
};
