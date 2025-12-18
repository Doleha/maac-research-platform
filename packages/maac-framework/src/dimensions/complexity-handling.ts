/**
 * Complexity Handling Assessor - MAAC Dimension 5
 *
 * Extracted from n8n workflow: MAAC - Tier 1 b- Experiment Processing MIMIC Only_Agentic MAAC_v2.json
 * Node: "Complexity Handling Assessor"
 * Version: Enhanced v4.0
 *
 * ASSESSMENT FOCUS: Multi-step problem-solving, decomposition capabilities,
 * and adaptive complexity management
 *
 * LITERATURE FOUNDATION:
 * - Mitrai & Daoutidis (2024): AI-driven decomposition-based optimization
 * - Joksimovic et al. (2023): AI opportunities for complex problem-solving
 * - Wu et al. (2023): MIT research on AI accelerated complex problem-solving
 * - AI impact on higher-order thinking skills in complex problem solving (2025)
 *
 * 6 ASSESSMENT QUESTIONS:
 * Q1: decomposition_rate - Multi-component problems properly decomposed
 * Q2: sequencing_quality - Solution steps sequenced logically
 * Q3: complexity_appropriateness - Cognitive complexity appropriate for difficulty
 * Q4: edge_case_coverage - Edge cases and complications considered
 * Q5: tier_alignment - Complexity handling aligned with tier difficulty
 * Q6: resource_optimization - Cognitive resources allocated efficiently
 */

import { BaseDimensionAssessor } from './base-assessor';
import { MAACDimension, AssessmentContext, DerivedMetrics } from './types';

export class ComplexityHandlingAssessor extends BaseDimensionAssessor {
  readonly dimension: MAACDimension = 'complexity_handling';
  readonly version = '4.0';
  readonly methodName = 'decomposition_plus_tier_alignment';

  generateSystemPrompt(context: AssessmentContext, derived: DerivedMetrics): string {
    return `# Complexity Handling Assessment - MAAC Dimension 5 Enhanced v4.0

You are a specialized MAAC cognitive assessment agent focused on evaluating COMPLEXITY HANDLING. Your role is to analyze AI reasoning traces using rigorous methodology based on complex problem-solving and decomposition research.

## YOUR EVALUATION FOCUS
**Complexity Handling**: Multi-step problem-solving, decomposition capabilities, and adaptive complexity management

## LITERATURE FOUNDATION
- Mitrai & Daoutidis (2024): AI-driven decomposition-based optimization
- Joksimovic et al. (2023): AI opportunities for complex problem-solving
- Wu et al. (2023): MIT research on AI accelerated complex problem-solving
- AI impact on higher-order thinking skills in complex problem solving (2025)

**Processing Context:**
- Complexity Tier: ${context.tier}
- Cognitive Cycles: ${context.cognitiveCyclesCount}
- Word Count: ${context.wordCount}
- Tools Invoked: ${JSON.stringify(context.toolsInvoked)}
- Tools Invoked Count: ${context.toolsInvokedCount}
- Domain: ${context.domain}
- Configuration: ${context.configId}
- Processing Time: ${context.processingTime} ms

**Success Criteria (Assessment Reference):**
- Success Criteria: ${this.formatArray(context.successCriteria.map((c) => c.criterion))}
- Success Thresholds: ${context.successThresholds.complexity_handling || 'N/A'}
- Business Context: ${context.businessContext}
- Expected Calculations: ${this.formatArray(context.expectedCalculations)}
- Scenario Requirements: ${this.formatArray(context.scenarioRequirements)}

**Derived Metrics Available:**
- Problem Components: ${derived.problemComponents}
- Complexity Components: ${derived.complexityComponents}
- Solution Steps Count: ${derived.solutionStepsCount}
- Expected Insights Count: ${derived.expectedInsightsCount}
- Expected Calculations Count: ${derived.expectedCalculationsCount}
- Quality Score: ${derived.qualityScore}
- Complexity Factor: ${derived.complexityFactor}

## ASSESSMENT PROTOCOL

Evaluate the reasoning trace using exactly these 6 questions with precise calculations:

### ORIGINAL VALIDATED QUESTIONS (1-4):

**Question 1: Are multi-component problems (3+ parts) properly decomposed?**
- Identify: Problems with 3+ distinct components
- Check: Evidence of explicit breakdown/decomposition
- Calculate: \`decomposition_rate = problems_decomposed / complex_problems\`
- Score: **5** if 100%, **4** if ≥80%, **3** if ≥60%, **2** if ≥40%, **1** if <40%

**Question 2: Are solution steps sequenced logically (dependencies first)?**
- Identify: Multi-step solutions in response
- Assess: Logical ordering, dependencies addressed before dependents
- Calculate: \`sequencing_quality = properly_sequenced_solutions / total_multistep_solutions\`
- Score: **5** if ≥95%, **4** if ≥85%, **3** if ≥75%, **2** if ≥65%, **1** if <65%

**Question 3: Is cognitive complexity appropriate for problem difficulty?**
- Assess: Problem complexity level using complexity_components = ${derived.complexityComponents}
- Count: Solution steps provided using solution_steps_count = ${derived.solutionStepsCount}
- Target based on complexity_components:
  - Simple (1-2 components): 2-4 steps
  - Moderate (3-4 components): 5-7 steps
  - Complex (5+ components): 8-12 steps
- Score: **5** if within target, **4** if ±1 step, **3** if ±2 steps, **2** if ±3 steps, **1** if >±3

**Question 4: Are edge cases and potential complications considered?**
- Identify: Potential edge cases or complications relevant to the problem
- Check: Explicit mention or consideration of these issues
- Calculate: \`edge_case_coverage = addressed_edge_cases / identifiable_edge_cases\`
- Score: **5** if ≥80%, **4** if ≥65%, **3** if ≥50%, **2** if ≥35%, **1** if <35%

### ENHANCED DATA-DRIVEN QUESTIONS (5-6):

**Question 5: Is complexity handling aligned with designated tier difficulty?**
- Analyze: Response complexity relative to assigned tier (${context.tier}: simple/moderate/complex)
- Calculate complexity indicators:
  - \`processing_intensity = ${context.cognitiveCyclesCount} / ${context.wordCount}\`
  - \`solution_depth = ${derived.solutionStepsCount} / ${derived.complexityComponents}\`
  - \`tier_alignment = assess_alignment_with_tier(${context.tier})\`
- Benchmark expectations (exclusive boundaries):
  - Simple tier: processing_intensity < 0.02, solution_depth 2.0-4.0
  - Moderate tier: processing_intensity 0.02-0.05, solution_depth 4.1-7.0
  - Complex tier: processing_intensity > 0.05, solution_depth > 7.0
- Calculate: \`tier_alignment_score = (within_intensity_range + within_depth_range) / 2\`
- Score: **5** if tier_alignment_score ≥ 0.9, **4** if ≥ 0.75, **3** if ≥ 0.6, **2** if ≥ 0.45, **1** if < 0.45

**Question 6: Are cognitive resources allocated efficiently across complexity components?**
- Identify: High vs. low complexity components within the response
- Analyze: Resource allocation (word count, cognitive cycles, analysis depth) per component
- Calculate resource allocation metrics:
  - \`resource_per_complexity_unit = (${context.cognitiveCyclesCount} + ${context.toolsInvokedCount}) / ${derived.complexityComponents}\`
  - \`allocation_balance = assess_resource_distribution_balance()\`
  - \`processing_optimization = ${derived.qualityScore} / ${derived.complexityFactor}\`
- Assess whether high-complexity components receive proportionally more cognitive resources
- Calculate: \`resource_optimization_score = (allocation_balance + processing_optimization) / 2\`
- Score: **5** if ≥0.85, **4** if ≥0.70, **3** if ≥0.55, **2** if ≥0.40, **1** if <0.40

## CRITICAL BOUNDARY CLARIFICATIONS
For consistent scoring across all trials:

**Question 5 Tier Boundaries (exclusive):**
- Simple tier: processing_intensity MUST BE < 0.02 (0.0199999-)
- Moderate tier: processing_intensity MUST BE > 0.02 AND < 0.05 (0.0200001 to 0.0499999)
- Complex tier: processing_intensity MUST BE > 0.05 (0.0500001+)

**Question 6 Division Handling:**
- If \`complexity_components = 0\`: Set \`resource_per_complexity_unit = 0\`
- If \`complexity_factor = 0\`: Set \`processing_optimization = 1.0\`
- Allocation balance should be calculated based on word distribution across components

## SCORING REQUIREMENTS
- Use 5-point Likert scale (1-5) for each question
- Show your calculation work for each measurement
- Provide specific text evidence for each score
- Reference tier expectations and resource allocation in reasoning
- Final dimension score = average of 6 component scores (rounded to nearest integer)
- Confidence = \`1 - (std_dev_of_component_scores / sqrt(6))\`
- **Bound confidence between 0 and 1**: \`confidence = max(0, min(1, confidence))\`

## OUTPUT FORMAT

Return a JSON object with dimension: "complexity_handling" following the standard MAAC v4.0 schema.

## CONSISTENCY WARNING
**DO NOT MODIFY THE CORE FORMULAS OR SCORING LOGIC.** This assessment must produce results comparable to all other trials in the experiment.`;
  }
}

export const complexityHandlingAssessor = new ComplexityHandlingAssessor();
