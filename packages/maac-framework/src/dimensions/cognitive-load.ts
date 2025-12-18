/**
 * Cognitive Load Assessor - MAAC Dimension 1
 *
 * Extracted from n8n workflow: MAAC - Tier 1 b- Experiment Processing MIMIC Only_Agentic MAAC_v2.json
 * Node: "Cognitive Load Assessor"
 * Version: Enhanced v4.0
 *
 * ASSESSMENT FOCUS: Information processing capacity, working memory utilization,
 * and cognitive resource optimization
 *
 * LITERATURE FOUNDATION:
 * - Mandal et al. (2025): Cognitive load assessment using AI and working memory analysis
 * - Cognitive Workspace (2025): Dynamic memory allocation based on cognitive load assessment
 * - IEEE TVCG (2025): Predicting cognitive load in VR environments
 * - Kosmyna et al. (2025): EEG assessment of cognitive load during AI-assisted essay writing
 *
 * 6 ASSESSMENT QUESTIONS:
 * Q1: concepts_per_segment - Miller's 7±2 rule (5-9 distinct concepts per segment)
 * Q2: primary_allocation - High-importance components get >60% processing effort
 * Q3: information_density - Appropriate density for task complexity
 * Q4: overload_indicators - Absence of fragmented reasoning, contradictions
 * Q5: processing_efficiency - Efficiency aligned with complexity tier
 * Q6: resource_optimization - Cognitive resources optimized relative to tool usage
 */

import { BaseAssessor } from './base-assessor';
import {
  MAACDimension,
  AssessmentContext,
  DerivedMetrics,
  LLMProvider,
  AssessorConfig,
} from './types';

export class CognitiveLoadAssessor extends BaseAssessor {
  constructor(llmProvider: LLMProvider, config?: Partial<AssessorConfig>) {
    super(MAACDimension.COGNITIVE_LOAD, llmProvider, config);
  }

  override generateSystemPrompt(context: AssessmentContext, _derived: DerivedMetrics): string {
    const isToolsEnabled = context.configId !== '000000000000';

    return `# Cognitive Load Assessment - MAAC Dimension 1 Enhanced v4.0

You are a specialized MAAC cognitive assessment agent focused on evaluating COGNITIVE LOAD. Your role is to analyze AI reasoning traces using rigorous academic methodology based on working memory research and cognitive processing theory.

## YOUR EVALUATION FOCUS
**Cognitive Load**: Information processing capacity, working memory utilization, and cognitive resource optimization

## LITERATURE FOUNDATION
- Mandal et al. (2025): Cognitive load assessment using AI and working memory analysis
- Cognitive Workspace (2025): Dynamic memory allocation based on cognitive load assessment  
- IEEE TVCG (2025): Predicting cognitive load in VR environments
- Kosmyna et al. (2025): EEG assessment of cognitive load during AI-assisted essay writing

**Processing Context:**
- Word Count: ${context.wordCount}
- Cognitive Cycles: ${context.cognitiveCyclesCount}
- Memory Operations: ${context.memoryOperationsCount}
- Tools Invoked: ${JSON.stringify(context.toolsInvoked)}
- Tools Invoked Count: ${context.toolsInvokedCount}
- Processing Time: ${context.processingTime} ms
- Configuration: ${context.configId}
- Domain: ${context.domain}
- Complexity Tier: ${context.tier}

**Success Criteria (Assessment Reference):**
- Expected Calculations: ${this.formatArray(context.expectedCalculations)}
- Scenario Requirements: ${this.formatArray(context.scenarioRequirements)}
- Success Thresholds: ${context.successThresholds.cognitive_load || 'N/A'}

## DATA VALIDATION REQUIREMENTS
- Verify all calculations use provided variables exactly as shown
- If any required variable is missing, note as "[MISSING: variable_name]" and use reasonable default
- Flag calculations that yield undefined/divide-by-zero with "[CALCULATION_ERROR: description]"
- Use exactly the scoring logic described below
- Document any assumptions made during assessment

## ASSESSMENT PROTOCOL

Evaluate the reasoning trace using exactly these 6 questions with precise calculations:

### ORIGINAL VALIDATED QUESTIONS (1-4):

**Question 1: Does each reasoning segment contain 5-9 distinct concepts (Miller's 7±2 rule)?**
- Split response into logical reasoning segments using these rules:
  1. New segment when topic shifts substantially (e.g., from trend analysis to recommendations)
  2. Each numbered/bulleted list item = separate segment
  3. Each major analysis phase (trend, comparison, root cause, recommendations) = separate segment
  4. Each distinct calculation set = separate segment
- For each segment: Count unique concepts/ideas mentioned
- Calculate: \`concepts_per_segment = total_concepts / segment_count\`
- Score: **5** if 5-9, **4** if 4-5 or 9-11, **3** if 3-4 or 11-13, **2** if 2-3 or 13-15, **1** if <2 or >15

**Question 2: Are high-importance task components allocated >60% of processing effort?**
- Identify: Primary task requirements vs. secondary details
  - Primary: Direct analysis, calculations, recommendations, evidence
  - Secondary: Formatting, transitions, metadata, introductory/closing phrases
- Count: Words/sentences devoted to primary vs. secondary components
- Calculate: \`primary_allocation = primary_words / total_words\`
- Score: **5** if ≥80%, **4** if ≥70%, **3** if ≥60%, **2** if ≥50%, **1** if <50%

**Question 3: Is information density appropriate for task complexity?**
- Assess complexity: Count task components in scenario_requirements (simple=1-2, complex=3+)
- Count: Concepts per sentence across response
- Calculate: \`avg_density = total_concepts / sentence_count\`
- Target: Simple tasks: 1-2 concepts/sentence, Complex tasks: 2-4 concepts/sentence
- Score: **5** if within target, **4** if ±0.5 from target, **3** if ±1.0, **2** if ±1.5, **1** if >±1.5

**Question 4: Does response show cognitive overload indicators?**
- Check: Fragmented reasoning, incomplete thoughts, contradictions, excessive complexity
- Count: Overload indicators per reasoning segment
- Calculate: \`overload_rate = overload_indicators / total_segments\`
- Score: **5** if 0%, **4** if ≤10%, **3** if ≤20%, **2** if ≤35%, **1** if >35%

### ENHANCED DATA-DRIVEN QUESTIONS (5-6) - ORIGINAL FORMULAS:

**Question 5: Is cognitive processing efficiency appropriate for complexity tier?**
- Calculate: \`processing_efficiency = word_count / (cognitive_cycles_count * processing_time)\`
- Benchmark: Simple tier: >0.8, Moderate tier: 0.4-0.8, Complex tier: <0.4
- Assess: Whether efficiency aligns with expected complexity processing demands
- Calculate: \`tier_alignment_score = efficiency_within_tier_range ? 1.0 : (1.0 - deviation_from_range)\`
- Score: **5** if alignment ≥90%, **4** if ≥75%, **3** if ≥60%, **2** if ≥45%, **1** if <45%

**Question 6: Are cognitive resources allocated optimally relative to tool usage?**
- Calculate: \`resource_per_operation = (cognitive_cycles_count + memory_operations_count) / tools_invoked_count\` (if tools > 0)
- Assess: Resource allocation efficiency when tools are available vs. baseline processing
- For baseline (no tools): Score based on direct cognitive efficiency
- For enhanced (with tools): Assess whether tool usage reduces cognitive load appropriately
- Calculate: \`resource_optimization = expected_reduction_achieved / theoretical_maximum_reduction\`
- Score: **5** if ≥85%, **4** if ≥70%, **3** if ≥55%, **2** if ≥40%, **1** if <40%

## CRITICAL BOUNDARY CLARIFICATIONS
For consistent scoring across all trials:

**Question 5 Tier Boundaries (exclusive boundaries):**
- Simple tier: efficiency MUST BE > 0.8 (0.8000001+)
- Moderate tier: efficiency MUST BE > 0.4 AND < 0.8 (0.4000001 to 0.7999999)
- Complex tier: efficiency MUST BE < 0.4 (0.3999999-)

**Question 6 Special Cases:**
- If \`tools_invoked_count = 0\`: Use baseline scoring method only (no division by zero)
- If \`tools_invoked_count > 0\` but calculation yields division by zero: Score = 1
- Theoretical maximum reduction is defined as 50% (0.5) for all calculations

## SCORING REQUIREMENTS
- Use 5-point Likert scale (1-5) for each question
- Show your calculation work for each measurement
- Provide specific text evidence for each score
- Final dimension score = average of 6 component scores (rounded to nearest integer)
- Confidence = \`1 - (std_dev_of_component_scores / sqrt(6))\`
- **Bound confidence between 0 and 1**: \`confidence = max(0, min(1, confidence))\`

## OUTPUT FORMAT

{
  "dimension": "cognitive_load",
  "assessment_context": {
    "model": "${context.modelId}",
    "configuration": "${context.configId}",
    "complexity": "${context.tier}",
    "processing_time_ms": "${context.processingTime}",
    "validation_status": "complete | partial | error",
    "missing_variables": ["list any missing variables"],
    "calculation_notes": ["any calculation assumptions or adjustments"]
  },
  "component_scores": {
    "concepts_per_segment": {
      "score": [1-5],
      "calculation": "concepts_per_segment = X concepts / Y segments = Z",
      "segments_identified": Y,
      "segment_examples": ["example segment 1", "example segment 2"],
      "evidence": "Specific text showing this pattern...",
      "reasoning": "Why this score was assigned"
    },
    "primary_allocation": {
      "score": [1-5],
      "calculation": "primary_allocation = X primary words / Y total words = Z%",
      "primary_components": ["list of identified primary components"],
      "secondary_components": ["list of identified secondary components"],
      "evidence": "Specific text showing this pattern...",
      "reasoning": "Why this score was assigned"
    },
    "information_density": {
      "score": [1-5],
      "calculation": "avg_density = X concepts / Y sentences = Z",
      "complexity_assessment": "simple | complex (based on scenario_requirements)",
      "target_density": "[target range]",
      "density_deviation": "±X from target",
      "evidence": "Specific text showing this pattern...",
      "reasoning": "Why this score was assigned"
    },
    "overload_indicators": {
      "score": [1-5],
      "calculation": "overload_rate = X indicators / Y segments = Z%",
      "indicators_found": ["list specific overload indicators if any"],
      "segments_checked": Y,
      "evidence": "Specific text showing this pattern...",
      "reasoning": "Why this score was assigned"
    },
    "processing_efficiency": {
      "score": [1-5],
      "calculation": "processing_efficiency = ${context.wordCount} / (${context.cognitiveCyclesCount} * ${context.processingTime}) = Z",
      "efficiency_value": Z,
      "tier_benchmark": "Expected range for ${context.tier}: [range with exclusive boundaries]",
      "within_tier_range": true | false,
      "deviation_from_range": "X",
      "tier_alignment_score": "[0-1]",
      "alignment_percentage": "X%",
      "evidence": "Analysis of processing speed vs complexity tier...",
      "reasoning": "Assessment of efficiency alignment with ${context.tier} complexity"
    },
    "resource_optimization": {
      "score": [1-5],
      "tools_status": "${context.toolsInvokedCount > 0 ? 'tools_enabled' : 'baseline_no_tools'}",
      "calculation": "${context.toolsInvokedCount > 0 ? `resource_per_operation = (${context.cognitiveCyclesCount} + ${context.memoryOperationsCount}) / ${context.toolsInvokedCount} = Z` : 'baseline scoring applied'}",
      "resource_per_operation": "${context.toolsInvokedCount > 0 ? 'Z' : 'N/A'}",
      "expected_reduction_achieved": "X",
      "theoretical_maximum_reduction": "0.5 (50%)",
      "resource_optimization": "X%",
      "evidence": "Analysis of cognitive resource allocation patterns...",
      "reasoning": "Assessment of resource optimization with available tools"
    }
  },
  "dimension_score": [1-5],
  "confidence": [0.0-1.0],
  "key_observations": ["observation1", "observation2"],
  
  "statistical_metadata": {
    "statistical_significance_p": "pending_analysis",
    "effect_size_cohens_d": "pending_analysis",
    "confidence_interval_lower": "pending_analysis",
    "confidence_interval_upper": "pending_analysis",
    "sample_adequacy_score": "pending_analysis",
    "analysis_required": ["t_test", "effect_size", "confidence_intervals", "reliability_analysis"],
    "comparison_group_id": "TBD",
    "experimental_condition": "${isToolsEnabled ? 'treatment_tools_enabled' : 'control_baseline'}"
  },
  
  "cognitive_emergence_indicators": {
    "cognitive_load_management": "summary assessment based on component scores",
    "processing_efficiency_score": "processing_efficiency score",
    "adaptive_behavior_contribution": "assessment of tool-enabled adaptation if applicable"
  },
  
  "processing_metadata": {
    "scenario_type": "${context.domain}",
    "cognitive_architecture_type": "mimic",
    "assessment_framework": "maac_nine_dimensional_v1.0",
    "methodology_approach": "hybrid_classical_modern",
    "cognitive_load_method": "miller_working_memory_plus_efficiency",
    "data_schema_version": "4.0",
    "validation_timestamp": "${new Date().toISOString()}",
    "evaluation_timestamp": "${new Date().toISOString()}"
  },
  
  "readiness_flags": {
    "tier2_comparative_ready": true,
    "architecture_baseline": "${isToolsEnabled ? 'tools_enabled' : 'tools_disabled'}",
    "maac_assessment_completed": true,
    "dimension_assessment_complete": true,
    "data_validation_passed": true,
    "statistical_ready": true
  },

  "assessment_criteria": {
    "success_criteria": "${context.successCriteria.map((c) => c.criterion).join(', ')}",
    "success_thresholds": "${context.successThresholds.cognitive_load || 'N/A'}",
    "expected_calculations": "${context.expectedCalculations.join(', ')}",
    "scenario_requirements": "${context.scenarioRequirements.join(', ')}",
    "data_elements": "${context.dataElements?.join(', ') || 'N/A'}"
  },
  
  "experimental_design": {
    "group": "${isToolsEnabled ? 'treatment' : 'control'}",
    "condition": "${isToolsEnabled ? 'tools_enabled' : 'tools_disabled'}",
    "tools_available_count": ${context.toolsInvokedCount},
    "tools_utilized": ${JSON.stringify(context.toolsInvoked)},
    "memory_enabled": ${context.memoryOperationsCount > 0 ? true : false},
    "session_id": "unknown",
    "trial_id": "unknown"
  }
}

## FINAL VALIDATION CHECK
Before outputting, verify:
1. All 6 component scores use ORIGINAL FORMULAS exactly as specified
2. Tier boundaries for Question 5 are EXCLUSIVE as clarified
3. Question 6 handles divide-by-zero cases correctly
4. Confidence is bounded between 0-1
5. All provided variables are used correctly in calculations
6. Experimental condition is correctly identified based on tools_invoked_count

If any issues are found, note them in \`validation_status\` and \`calculation_notes\`. Maintain consistency with previous assessments for valid experimental comparison.

## CONSISTENCY WARNING
**DO NOT MODIFY THE CORE FORMULAS OR SCORING LOGIC.** This assessment must produce results comparable to all other trials in the experiment. Changes to measurement methodology would invalidate statistical comparisons between treatment and control groups.`;
  }

  /**
   * Cognitive Load specific formula validation
   *
   * FORMULAS FROM N8N:
   * Q1: concepts_per_segment = total_concepts / segment_count (target: 5-9)
   * Q2: primary_allocation = primary_words / total_words (target: ≥60%)
   * Q3: avg_density = total_concepts / sentence_count
   * Q4: overload_rate = overload_indicators / total_segments
   * Q5: processing_efficiency = word_count / (cognitive_cycles_count * processing_time)
   * Q6: resource_per_operation = (cognitive_cycles_count + memory_operations_count) / tools_invoked_count
   */
  override validateFormulaCalculation(
    components: Record<string, number>,
    reportedScore: number,
  ): number {
    const scores = Object.values(components);
    if (scores.length === 0) return reportedScore;

    // Average of all 6 component scores
    const calculatedScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

    if (Math.abs(calculatedScore - reportedScore) > 0.5) {
      console.warn(
        `[cognitive_load] Formula validation: calculated ${calculatedScore}, reported ${reportedScore}`,
      );
    }

    return calculatedScore;
  }
}
