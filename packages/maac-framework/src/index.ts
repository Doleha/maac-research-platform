/**
 * MAAC Framework - Multi-Agent Adaptive Cognition
 * 
 * Nine-Dimensional Cognitive Assessment Framework for AI Systems
 * 
 * This framework provides:
 * - 9 dimension assessors (cognitive load, tool execution, etc.)
 * - Standardized scoring with 6 questions per dimension
 * - Formula-based validation for research consistency
 * - LLM-agnostic assessment using Claude Sonnet 4.5 prompts
 * 
 * Extracted from n8n workflows:
 * - MAAC - Tier 1 b- Experiment Processing MIMIC Only_Agentic MAAC_v2.json
 */

// Re-export types
export * from '@maac/types';

// Export 9-dimensional assessment framework
export * from './dimensions';

// Export dimension types explicitly for convenience
export {
  MAACDimension,
  type MAACScore,
  type DimensionAssessment,
  type ComponentScore,
  type AssessmentContext,
  type ProcessingContext,
  type SuccessThresholds,
  type LLMProvider,
  type AssessorConfig,
} from './dimensions/types';

// Export assessor classes
export {
  BaseAssessor,
  CognitiveLoadAssessor,
  ToolExecutionAssessor,
  ContentQualityAssessor,
  MemoryIntegrationAssessor,
  ComplexityHandlingAssessor,
  HallucinationControlAssessor,
  KnowledgeTransferAssessor,
  ProcessingEfficiencyAssessor,
  ConstructValidityAssessor,
  createAllAssessors,
  createAssessor,
  DIMENSION_ORDER,
  DIMENSION_NAMES,
} from './dimensions';

import { CognitiveEvaluation } from '@maac/types';
import { 
  createAllAssessors, 
  MAACDimension, 
  type MAACScore,
  type AssessmentContext,
  type LLMProvider,
  type AssessorConfig,
  DIMENSION_ORDER,
} from './dimensions';

/**
 * Main MAAC Framework class for running full 9-dimensional assessments
 */
export class MAACFramework {
  private llmProvider: LLMProvider;
  private config: Partial<AssessorConfig>;

  constructor(llmProvider: LLMProvider, config?: Partial<AssessorConfig>) {
    this.llmProvider = llmProvider;
    this.config = config || {};
  }

  /**
   * Run full 9-dimensional MAAC assessment on a cognitive response
   */
  async assessResponse(context: AssessmentContext): Promise<{
    dimensions: Map<MAACDimension, MAACScore>;
    overallScore: number;
    confidence: number;
    assessmentTimestamp: Date;
  }> {
    const assessors = createAllAssessors(this.llmProvider, this.config);
    const dimensions = new Map<MAACDimension, MAACScore>();

    // Run all 9 assessments (can be parallelized)
    const assessmentPromises = DIMENSION_ORDER.map(async (dimension) => {
      const assessor = assessors.get(dimension);
      if (!assessor) {
        throw new Error(`Assessor not found for dimension: ${dimension}`);
      }
      const score = await assessor.assess(context);
      return { dimension, score };
    });

    const results = await Promise.all(assessmentPromises);
    
    for (const { dimension, score } of results) {
      dimensions.set(dimension, score);
    }

    // Calculate overall score (average of 9 dimensions)
    const scores = Array.from(dimensions.values()).map(d => d.score);
    const overallScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // Calculate overall confidence (average)
    const confidences = Array.from(dimensions.values()).map(d => d.confidence);
    const confidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    return {
      dimensions,
      overallScore,
      confidence,
      assessmentTimestamp: new Date(),
    };
  }

  /**
   * Legacy simple evaluation method (for backward compatibility)
   */
  evaluate(input: string): CognitiveEvaluation {
    const wordCount = input.split(/\s+/).length;
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      metrics: {
        coherence: Math.min(0.95, 0.5 + wordCount * 0.01),
        relevance: 0.92,
      },
    };
  }
}
