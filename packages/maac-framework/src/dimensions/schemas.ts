/**
 * MAAC Dimension Output Schemas
 * 
 * Zod schemas for structured output validation of all 9 MAAC dimensions.
 * These schemas ensure consistent data structure for statistical analysis
 * and research reproducibility.
 * 
 * @packageDocumentation
 * @module MAACSchemas
 */

import { z } from 'zod';

// ============================================================
// SHARED COMPONENT SCHEMA
// ============================================================

/**
 * Base component score schema used by all dimensions
 */
export const ComponentScoreSchema = z.object({
  score: z.number().min(1).max(5),
  calculation: z.string(),
  evidence: z.string(),
  reasoning: z.string(),
});

// ============================================================
// DIMENSION 1: COGNITIVE LOAD
// ============================================================

/**
 * Cognitive Load Assessment Output Schema
 * 
 * Formula: cognitive_load = average of 6 component scores
 * - concepts_per_segment (Miller's 7±2 rule)
 * - primary_allocation (>60% to high-importance tasks)
 * - information_density (appropriate for complexity)
 * - overload_indicators (absence of fragmented reasoning)
 * - processing_efficiency (aligned with complexity tier)
 * - resource_optimization (cognitive resources vs tool usage)
 */
export const CognitiveLoadOutputSchema = z.object({
  dimension: z.literal('cognitive_load'),
  component_scores: z.object({
    concepts_per_segment: ComponentScoreSchema.extend({
      segments_identified: z.number(),
      concepts_counted: z.number(),
    }),
    primary_allocation: ComponentScoreSchema.extend({
      primary_words: z.number(),
      total_words: z.number(),
      allocation_percentage: z.number(),
    }),
    information_density: ComponentScoreSchema.extend({
      concepts_count: z.number(),
      sentence_count: z.number(),
      density_value: z.number(),
    }),
    overload_indicators: ComponentScoreSchema.extend({
      indicators_found: z.number(),
      segments_checked: z.number(),
      overload_rate: z.number(),
    }),
    processing_efficiency: ComponentScoreSchema.extend({
      efficiency_value: z.number(),
      tier_benchmark: z.string(),
      within_tier_range: z.boolean(),
    }),
    resource_optimization: ComponentScoreSchema.extend({
      tools_used: z.number(),
      resource_per_operation: z.number().optional(),
      optimization_score: z.number(),
    }),
  }),
  dimension_score: z.number().min(1).max(5),
  confidence: z.number().min(0).max(1),
  key_observations: z.array(z.string()),
});

// ============================================================
// DIMENSION 2: TOOL EXECUTION
// ============================================================

/**
 * Tool Execution Assessment Output Schema
 * 
 * Formula: tool_execution = average of 6 component scores
 * - tool_appropriateness (correct tools for task)
 * - execution_quality (proper parameters)
 * - integration_rate (output integrated vs appended)
 * - efficiency_rate (no redundant calls)
 * - success_achievement_through_tools
 * - tool_optimization (utilization rate)
 */
export const ToolExecutionOutputSchema = z.object({
  dimension: z.literal('tool_execution'),
  component_scores: z.object({
    tool_appropriateness: ComponentScoreSchema.extend({
      correct_selections: z.number(),
      tool_requiring_tasks: z.number(),
      appropriateness_rate: z.number(),
    }),
    execution_quality: ComponentScoreSchema.extend({
      properly_configured: z.number(),
      total_tool_uses: z.number(),
      quality_rate: z.number(),
    }),
    integration_rate: ComponentScoreSchema.extend({
      integrated_outputs: z.number(),
      total_outputs: z.number(),
      integration_percentage: z.number(),
    }),
    efficiency_rate: ComponentScoreSchema.extend({
      necessary_calls: z.number(),
      total_calls: z.number(),
      efficiency_percentage: z.number(),
    }),
    success_achievement_through_tools: ComponentScoreSchema.extend({
      criteria_achieved_with_tools: z.number(),
      tool_achievable_criteria: z.number(),
      achievement_rate: z.number(),
    }),
    tool_optimization: ComponentScoreSchema.extend({
      utilization_rate: z.number(),
      expected_utilization: z.number(),
      optimization_score: z.number(),
    }),
  }),
  dimension_score: z.number().min(1).max(5),
  confidence: z.number().min(0).max(1),
  key_observations: z.array(z.string()),
});

// ============================================================
// DIMENSION 3: CONTENT QUALITY
// ============================================================

/**
 * Content Quality Assessment Output Schema
 * 
 * Formula: content_quality = average of 6 component scores
 * - accuracy (factual correctness)
 * - completeness (all requirements addressed)
 * - clarity (understandable explanations)
 * - relevance (on-topic content)
 * - structure (logical organization)
 * - actionability (usable recommendations)
 */
export const ContentQualityOutputSchema = z.object({
  dimension: z.literal('content_quality'),
  component_scores: z.object({
    accuracy: ComponentScoreSchema.extend({
      accurate_statements: z.number(),
      total_statements: z.number(),
      accuracy_rate: z.number(),
    }),
    completeness: ComponentScoreSchema.extend({
      requirements_addressed: z.number(),
      total_requirements: z.number(),
      completeness_rate: z.number(),
    }),
    clarity: ComponentScoreSchema.extend({
      clear_explanations: z.number(),
      total_explanations: z.number(),
      clarity_rate: z.number(),
    }),
    relevance: ComponentScoreSchema.extend({
      relevant_content: z.number(),
      total_content: z.number(),
      relevance_rate: z.number(),
    }),
    structure: ComponentScoreSchema.extend({
      structural_elements: z.number(),
      expected_structure: z.number(),
      structure_score: z.number(),
    }),
    actionability: ComponentScoreSchema.extend({
      actionable_items: z.number(),
      expected_actions: z.number(),
      actionability_rate: z.number(),
    }),
  }),
  dimension_score: z.number().min(1).max(5),
  confidence: z.number().min(0).max(1),
  key_observations: z.array(z.string()),
});

// ============================================================
// DIMENSION 4: MEMORY INTEGRATION
// ============================================================

/**
 * Memory Integration Assessment Output Schema
 * 
 * Formula: memory_integration = average of 6 component scores
 * - context_retention (maintains context)
 * - reference_accuracy (accurate memory recalls)
 * - synthesis_quality (integrates information)
 * - continuity_score (logical flow)
 * - memory_utilization (uses available memory)
 * - adaptive_recall (relevant memory access)
 */
export const MemoryIntegrationOutputSchema = z.object({
  dimension: z.literal('memory_integration'),
  component_scores: z.object({
    context_retention: ComponentScoreSchema.extend({
      retained_elements: z.number(),
      total_context_elements: z.number(),
      retention_rate: z.number(),
    }),
    reference_accuracy: ComponentScoreSchema.extend({
      accurate_references: z.number(),
      total_references: z.number(),
      accuracy_rate: z.number(),
    }),
    synthesis_quality: ComponentScoreSchema.extend({
      synthesized_elements: z.number(),
      synthesis_opportunities: z.number(),
      synthesis_rate: z.number(),
    }),
    continuity_score: ComponentScoreSchema.extend({
      coherent_transitions: z.number(),
      total_transitions: z.number(),
      continuity_rate: z.number(),
    }),
    memory_utilization: ComponentScoreSchema.extend({
      memory_operations_used: z.number(),
      memory_operations_available: z.number(),
      utilization_rate: z.number(),
    }),
    adaptive_recall: ComponentScoreSchema.extend({
      relevant_recalls: z.number(),
      total_recalls: z.number(),
      relevance_rate: z.number(),
    }),
  }),
  dimension_score: z.number().min(1).max(5),
  confidence: z.number().min(0).max(1),
  key_observations: z.array(z.string()),
});

// ============================================================
// DIMENSION 5: COMPLEXITY HANDLING
// ============================================================

/**
 * Complexity Handling Assessment Output Schema
 * 
 * Formula: complexity_handling = average of 6 component scores
 * - decomposition_quality (problem breakdown)
 * - step_sequencing (logical ordering)
 * - dependency_management (handles dependencies)
 * - abstraction_level (appropriate abstraction)
 * - integration_quality (combines components)
 * - scalability_approach (handles scale)
 */
export const ComplexityHandlingOutputSchema = z.object({
  dimension: z.literal('complexity_handling'),
  component_scores: z.object({
    decomposition_quality: ComponentScoreSchema.extend({
      components_identified: z.number(),
      expected_components: z.number(),
      decomposition_rate: z.number(),
    }),
    step_sequencing: ComponentScoreSchema.extend({
      correctly_sequenced: z.number(),
      total_steps: z.number(),
      sequencing_rate: z.number(),
    }),
    dependency_management: ComponentScoreSchema.extend({
      dependencies_handled: z.number(),
      total_dependencies: z.number(),
      management_rate: z.number(),
    }),
    abstraction_level: ComponentScoreSchema.extend({
      appropriate_abstractions: z.number(),
      abstraction_opportunities: z.number(),
      abstraction_rate: z.number(),
    }),
    integration_quality: ComponentScoreSchema.extend({
      integrated_components: z.number(),
      total_components: z.number(),
      integration_rate: z.number(),
    }),
    scalability_approach: ComponentScoreSchema.extend({
      scalable_solutions: z.number(),
      scaling_requirements: z.number(),
      scalability_rate: z.number(),
    }),
  }),
  dimension_score: z.number().min(1).max(5),
  confidence: z.number().min(0).max(1),
  key_observations: z.array(z.string()),
});

// ============================================================
// DIMENSION 6: HALLUCINATION CONTROL
// ============================================================

/**
 * Hallucination Control Assessment Output Schema
 * 
 * Formula: hallucination_control = average of 6 component scores
 * - factual_accuracy (verifiable facts)
 * - source_grounding (citations/references)
 * - claim_hedging (appropriate uncertainty)
 * - consistency_check (no contradictions)
 * - knowledge_boundaries (acknowledges limits)
 * - verification_signals (self-verification)
 */
export const HallucinationControlOutputSchema = z.object({
  dimension: z.literal('hallucination_control'),
  component_scores: z.object({
    factual_accuracy: ComponentScoreSchema.extend({
      verifiable_facts: z.number(),
      total_claims: z.number(),
      accuracy_rate: z.number(),
    }),
    source_grounding: ComponentScoreSchema.extend({
      grounded_claims: z.number(),
      claims_needing_grounding: z.number(),
      grounding_rate: z.number(),
    }),
    claim_hedging: ComponentScoreSchema.extend({
      appropriately_hedged: z.number(),
      uncertain_claims: z.number(),
      hedging_rate: z.number(),
    }),
    consistency_check: ComponentScoreSchema.extend({
      consistent_statements: z.number(),
      total_statements: z.number(),
      consistency_rate: z.number(),
    }),
    knowledge_boundaries: ComponentScoreSchema.extend({
      acknowledged_limits: z.number(),
      limit_opportunities: z.number(),
      acknowledgment_rate: z.number(),
    }),
    verification_signals: ComponentScoreSchema.extend({
      verification_attempts: z.number(),
      verification_opportunities: z.number(),
      verification_rate: z.number(),
    }),
  }),
  dimension_score: z.number().min(1).max(5),
  confidence: z.number().min(0).max(1),
  key_observations: z.array(z.string()),
});

// ============================================================
// DIMENSION 7: KNOWLEDGE TRANSFER
// ============================================================

/**
 * Knowledge Transfer Assessment Output Schema
 * 
 * Formula: knowledge_transfer = average of 6 component scores
 * - domain_application (applies domain knowledge)
 * - cross_domain_synthesis (integrates multiple domains)
 * - explanation_quality (educational value)
 * - generalization_ability (abstract principles)
 * - contextual_adaptation (adapts to context)
 * - transfer_efficiency (knowledge application speed)
 */
export const KnowledgeTransferOutputSchema = z.object({
  dimension: z.literal('knowledge_transfer'),
  component_scores: z.object({
    domain_application: ComponentScoreSchema.extend({
      correctly_applied: z.number(),
      application_opportunities: z.number(),
      application_rate: z.number(),
    }),
    cross_domain_synthesis: ComponentScoreSchema.extend({
      domains_integrated: z.number(),
      relevant_domains: z.number(),
      synthesis_rate: z.number(),
    }),
    explanation_quality: ComponentScoreSchema.extend({
      clear_explanations: z.number(),
      explanation_opportunities: z.number(),
      explanation_rate: z.number(),
    }),
    generalization_ability: ComponentScoreSchema.extend({
      generalizations_made: z.number(),
      generalization_opportunities: z.number(),
      generalization_rate: z.number(),
    }),
    contextual_adaptation: ComponentScoreSchema.extend({
      adaptations_made: z.number(),
      adaptation_opportunities: z.number(),
      adaptation_rate: z.number(),
    }),
    transfer_efficiency: ComponentScoreSchema.extend({
      efficient_transfers: z.number(),
      transfer_opportunities: z.number(),
      efficiency_rate: z.number(),
    }),
  }),
  dimension_score: z.number().min(1).max(5),
  confidence: z.number().min(0).max(1),
  key_observations: z.array(z.string()),
});

// ============================================================
// DIMENSION 8: PROCESSING EFFICIENCY
// ============================================================

/**
 * Processing Efficiency Assessment Output Schema
 * 
 * Formula: processing_efficiency = average of 6 component scores
 * - response_conciseness (no unnecessary content)
 * - computation_efficiency (optimal processing)
 * - resource_utilization (efficient resource use)
 * - time_optimization (processing time vs quality)
 * - iteration_efficiency (minimal redundant cycles)
 * - output_density (information per unit output)
 */
export const ProcessingEfficiencyOutputSchema = z.object({
  dimension: z.literal('processing_efficiency'),
  component_scores: z.object({
    response_conciseness: ComponentScoreSchema.extend({
      essential_content: z.number(),
      total_content: z.number(),
      conciseness_rate: z.number(),
    }),
    computation_efficiency: ComponentScoreSchema.extend({
      efficient_computations: z.number(),
      total_computations: z.number(),
      efficiency_rate: z.number(),
    }),
    resource_utilization: ComponentScoreSchema.extend({
      resources_used: z.number(),
      resources_available: z.number(),
      utilization_rate: z.number(),
    }),
    time_optimization: ComponentScoreSchema.extend({
      processing_time: z.number(),
      expected_time: z.number(),
      optimization_score: z.number(),
    }),
    iteration_efficiency: ComponentScoreSchema.extend({
      necessary_iterations: z.number(),
      total_iterations: z.number(),
      efficiency_rate: z.number(),
    }),
    output_density: ComponentScoreSchema.extend({
      information_units: z.number(),
      output_size: z.number(),
      density_score: z.number(),
    }),
  }),
  dimension_score: z.number().min(1).max(5),
  confidence: z.number().min(0).max(1),
  key_observations: z.array(z.string()),
});

// ============================================================
// DIMENSION 9: CONSTRUCT VALIDITY
// ============================================================

/**
 * Construct Validity Assessment Output Schema
 * 
 * Formula: construct_validity = average of 6 component scores
 * - task_alignment (response matches task)
 * - criterion_satisfaction (meets success criteria)
 * - methodology_appropriateness (correct approach)
 * - output_format_compliance (proper structure)
 * - stakeholder_relevance (addresses audience)
 * - practical_applicability (real-world usable)
 */
export const ConstructValidityOutputSchema = z.object({
  dimension: z.literal('construct_validity'),
  component_scores: z.object({
    task_alignment: ComponentScoreSchema.extend({
      aligned_elements: z.number(),
      task_requirements: z.number(),
      alignment_rate: z.number(),
    }),
    criterion_satisfaction: ComponentScoreSchema.extend({
      criteria_satisfied: z.number(),
      total_criteria: z.number(),
      satisfaction_rate: z.number(),
    }),
    methodology_appropriateness: ComponentScoreSchema.extend({
      appropriate_methods: z.number(),
      method_opportunities: z.number(),
      appropriateness_rate: z.number(),
    }),
    output_format_compliance: ComponentScoreSchema.extend({
      compliant_elements: z.number(),
      format_requirements: z.number(),
      compliance_rate: z.number(),
    }),
    stakeholder_relevance: ComponentScoreSchema.extend({
      relevant_content: z.number(),
      stakeholder_needs: z.number(),
      relevance_rate: z.number(),
    }),
    practical_applicability: ComponentScoreSchema.extend({
      applicable_elements: z.number(),
      applicability_opportunities: z.number(),
      applicability_rate: z.number(),
    }),
  }),
  dimension_score: z.number().min(1).max(5),
  confidence: z.number().min(0).max(1),
  key_observations: z.array(z.string()),
});

// ============================================================
// COMBINED MAAC ASSESSMENT SCHEMA
// ============================================================

/**
 * Complete MAAC Assessment Schema (all 9 dimensions)
 */
export const MAACAssessmentSchema = z.object({
  cognitive_load: CognitiveLoadOutputSchema,
  tool_execution: ToolExecutionOutputSchema,
  content_quality: ContentQualityOutputSchema,
  memory_integration: MemoryIntegrationOutputSchema,
  complexity_handling: ComplexityHandlingOutputSchema,
  hallucination_control: HallucinationControlOutputSchema,
  knowledge_transfer: KnowledgeTransferOutputSchema,
  processing_efficiency: ProcessingEfficiencyOutputSchema,
  construct_validity: ConstructValidityOutputSchema,
  overall_score: z.number().min(0).max(10),
  aggregate_confidence: z.number().min(0).max(1),
  assessment_timestamp: z.string(),
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type CognitiveLoadOutput = z.infer<typeof CognitiveLoadOutputSchema>;
export type ToolExecutionOutput = z.infer<typeof ToolExecutionOutputSchema>;
export type ContentQualityOutput = z.infer<typeof ContentQualityOutputSchema>;
export type MemoryIntegrationOutput = z.infer<typeof MemoryIntegrationOutputSchema>;
export type ComplexityHandlingOutput = z.infer<typeof ComplexityHandlingOutputSchema>;
export type HallucinationControlOutput = z.infer<typeof HallucinationControlOutputSchema>;
export type KnowledgeTransferOutput = z.infer<typeof KnowledgeTransferOutputSchema>;
export type ProcessingEfficiencyOutput = z.infer<typeof ProcessingEfficiencyOutputSchema>;
export type ConstructValidityOutput = z.infer<typeof ConstructValidityOutputSchema>;
export type MAACAssessment = z.infer<typeof MAACAssessmentSchema>;

// ============================================================
// VALIDATION UTILITIES
// ============================================================

/**
 * Validate dimension output against its schema
 */
export function validateDimensionOutput<T>(
  dimension: string,
  output: unknown
): { success: boolean; data?: T; errors?: string[] } {
  const schemaMap: Record<string, z.ZodSchema> = {
    cognitive_load: CognitiveLoadOutputSchema,
    tool_execution: ToolExecutionOutputSchema,
    content_quality: ContentQualityOutputSchema,
    memory_integration: MemoryIntegrationOutputSchema,
    complexity_handling: ComplexityHandlingOutputSchema,
    hallucination_control: HallucinationControlOutputSchema,
    knowledge_transfer: KnowledgeTransferOutputSchema,
    processing_efficiency: ProcessingEfficiencyOutputSchema,
    construct_validity: ConstructValidityOutputSchema,
  };

  const schema = schemaMap[dimension];
  if (!schema) {
    return { success: false, errors: [`Unknown dimension: ${dimension}`] };
  }

  const result = schema.safeParse(output);
  if (result.success) {
    return { success: true, data: result.data as T };
  } else {
    return {
      success: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }
}

/**
 * Calculate dimension score from component scores with formula validation
 */
export function calculateDimensionScore(
  componentScores: Record<string, { score: number }>
): { score: number; isValid: boolean } {
  const scores = Object.values(componentScores).map(c => c.score);
  
  if (scores.length !== 6) {
    console.warn(`Expected 6 component scores, got ${scores.length}`);
  }
  
  const sum = scores.reduce((acc, s) => acc + s, 0);
  const average = sum / scores.length;
  
  // Validate all scores are in range
  const isValid = scores.every(s => s >= 1 && s <= 5);
  
  return {
    score: Math.round(average * 100) / 100,
    isValid,
  };
}

/**
 * Calculate confidence from component score variance
 * Formula: confidence = 1 - (std_dev / sqrt(n))
 */
export function calculateConfidence(
  componentScores: Record<string, { score: number }>
): number {
  const scores = Object.values(componentScores).map(c => c.score);
  const n = scores.length;
  
  if (n === 0) return 0;
  
  const mean = scores.reduce((acc, s) => acc + s, 0) / n;
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const confidence = 1 - (stdDev / Math.sqrt(n));
  
  // Bound between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}
