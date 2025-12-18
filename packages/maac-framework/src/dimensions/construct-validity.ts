/**
 * Construct Validity Assessor - MAAC Dimension 9
 *
 * Extracted from n8n workflow: MAAC - Tier 1 b- Experiment Processing MIMIC Only_Agentic MAAC_v2.json
 * Node: "Construct Validity Assessor"
 * Version: Enhanced v4.0
 *
 * ASSESSMENT FOCUS: Theoretical framework alignment, conceptual coherence, and assessment integrity
 *
 * LITERATURE FOUNDATION:
 * Based on cognitive assessment validity research integrated from multiple
 * psychometric and cognitive evaluation studies.
 *
 * 6 ASSESSMENT QUESTIONS:
 * Q1: internal_consistency - Internal consistency maintained throughout response
 * Q2: logical_validity - Conclusions follow logically from premises and evidence
 * Q3: theoretical_coherence - Theoretical approach coherent and appropriate for domain
 * Q4: definitional_consistency - Conceptual definitions used consistently
 * Q5: construct_alignment - Response demonstrates construct validity for model/configuration
 * Q6: framework_validity - Domain-specific constructs and MAAC framework validity maintained
 */

import { BaseDimensionAssessor } from './base-assessor';
import { MAACDimension, AssessmentContext, DerivedMetrics } from './types';

export class ConstructValidityAssessor extends BaseDimensionAssessor {
  readonly dimension: MAACDimension = 'construct_validity';
  readonly version = '4.0';
  readonly methodName = 'theoretical_framework_alignment_plus_model_configuration_validity';

  generateSystemPrompt(context: AssessmentContext, derived: DerivedMetrics): string {
    return `# Construct Validity Assessment - MAAC Dimension 9 Enhanced v4.0

You are a specialized MAAC cognitive assessment agent focused on evaluating CONSTRUCT VALIDITY. Your role is to analyze AI reasoning traces using rigorous methodology based on theoretical framework alignment and conceptual coherence research.

## YOUR EVALUATION FOCUS
**Construct Validity**: Theoretical framework alignment, conceptual coherence, and assessment integrity

## LITERATURE FOUNDATION
Based on cognitive assessment validity research integrated from multiple psychometric and cognitive evaluation studies.

**Processing Context:**
- Model: ${context.modelId}
- Configuration: ${context.configId}
- Domain: ${context.domain}
- Complexity Tier: ${context.tier}
- Processing Time: ${context.processingTime} ms
- Word Count: ${context.wordCount}
- Tools Configuration: ${JSON.stringify(context.enabledTools)}
- Tools Invoked: ${JSON.stringify(context.toolsInvoked)}
- Tools Invoked Count: ${context.toolsInvokedCount}
- Cognitive Cycles: ${context.cognitiveCyclesCount}
- Memory Operations: ${context.memoryOperationsCount}

**Construct Validation Context:**
- Success Criteria: ${this.formatArray(context.successCriteria.map((c) => c.criterion))}
- Expected Calculations: ${this.formatArray(context.expectedCalculations)}
- Scenario Requirements: ${this.formatArray(context.scenarioRequirements)}
- Success Thresholds: ${context.successThresholds.construct_validity || 'N/A'}
- Assessment Framework: MAAC Nine-Dimensional v1.0
- Business Context: ${context.businessContext}

**Derived Metrics Available:**
- Quality Score: ${derived.qualityScore}
- Complexity Factor: ${derived.complexityFactor}
- Success Criteria Achieved: ${derived.successCriteriaAchieved}
- Expected Insights Count: ${derived.expectedInsightsCount}
- Expected Calculations Count: ${derived.expectedCalculationsCount}
- Success Criteria Count: ${derived.successCriteriaCount}
- Baseline Accuracy: ${derived.baselineAccuracy}

## ASSESSMENT PROTOCOL

Evaluate the reasoning trace using exactly these 6 questions with precise calculations:

### ORIGINAL VALIDATED QUESTIONS (1-4):

**Question 1: Is internal consistency maintained throughout the response?**
- Check: Logical consistency of positions, arguments, and statements
- Count: Internal contradictions or inconsistent positions
- Calculate: \`internal_consistency = (total_positions - contradictions) / total_positions\`
- Score: **5** if ≥98%, **4** if ≥95%, **3** if ≥90%, **2** if ≥85%, **1** if <85%

**Question 2: Do conclusions follow logically from premises and evidence?**
- Identify: All conclusions drawn in response
- Assess: Logical validity of inference from premises to conclusions
- Calculate: \`logical_validity = valid_inferences / total_inferences\`
- Score: **5** if ≥95%, **4** if ≥85%, **3** if ≥75%, **2** if ≥65%, **1** if <65%

**Question 3: Is the theoretical approach coherent and appropriate for the domain?**
- Identify: Theoretical frameworks or approaches used
- Assess: Appropriateness for ${context.domain} and internal coherence
- Calculate: \`theoretical_coherence = appropriate_frameworks / total_frameworks_used\`
- Score: **5** if ≥90%, **4** if ≥80%, **3** if ≥70%, **2** if ≥60%, **1** if <60%

**Question 4: Are conceptual definitions used consistently?**
- Identify: Key concepts defined or used
- Check: Consistent usage throughout response
- Calculate: \`definitional_consistency = consistently_used_concepts / total_concepts\`
- Score: **5** if ≥95%, **4** if ≥90%, **3** if ≥85%, **2** if ≥80%, **1** if <80%

### ENHANCED DATA-DRIVEN QUESTIONS (5-6):

**Question 5: Does the response demonstrate construct validity appropriate for the assigned model and configuration?**
- Analyze: Response characteristics relative to model capabilities and configuration constraints
- Calculate construct alignment metrics:
  - \`model_capability_alignment = ${derived.qualityScore} / expected_model_capability(${context.modelId})\`
  - \`configuration_compliance = ${derived.successCriteriaAchieved} / ${derived.successCriteriaCount}\`
  - \`architectural_coherence = (${context.cognitiveCyclesCount} + ${context.memoryOperationsCount}) / (${context.wordCount} * ${derived.complexityFactor})\`
- Assess whether response demonstrates expected construct validity for the specific model-configuration combination
- Expected model capability benchmarks:
  - Standard models: 0.7-0.9 capability range
  - Advanced models: 0.8-1.0 capability range
  - Use 0.8 as baseline expected capability
- Calculate: \`construct_alignment_score = (model_capability_alignment + configuration_compliance + architectural_coherence) / 3\`
- Score: **5** if ≥0.85, **4** if ≥0.70, **3** if ≥0.55, **2** if ≥0.40, **1** if <0.40

**Question 6: Are domain-specific constructs and assessment validity maintained within the MAAC framework?**
- Analyze: Adherence to domain-specific theoretical constructs and assessment framework validity
- Evaluate framework compliance:
  - \`domain_construct_validity = appropriate_domain_reasoning_count / ${derived.expectedInsightsCount}\`
  - \`maac_framework_alignment = maac_compatible_behaviors / total_assessed_behaviors\`
  - \`assessment_construct_integrity = ${derived.baselineAccuracy} / theoretical_maximum_accuracy\`
- Assess whether response maintains theoretical validity within the MAAC nine-dimensional framework
- Theoretical maximum accuracy is defined as 1.0 for all calculations
- Calculate: \`framework_validity_score = (domain_construct_validity + maac_framework_alignment + assessment_construct_integrity) / 3\`
- Score: **5** if ≥0.85, **4** if ≥0.70, **3** if ≥0.55, **2** if ≥0.40, **1** if <0.40

## CRITICAL BOUNDARY CLARIFICATIONS

**Question 5 Model Capability Benchmarks:**
- Expected model capability baseline = 0.8 for all models
- If model_id indicates advanced capabilities (contains "4", "turbo", "pro", "max"): Use 0.9 as expected
- If model_id indicates standard capabilities: Use 0.8 as expected
- If model_id unknown: Use 0.8 as default

**Question 6 Denominator Handling:**
- If \`expected_insights_count = 0\`: Set \`domain_construct_validity = 1.0\`
- If \`total_assessed_behaviors = 0\`: Set \`maac_framework_alignment = 1.0\`
- Theoretical maximum accuracy is always 1.0

## SCORING REQUIREMENTS
- Use 5-point Likert scale (1-5) for each question
- Show your calculation work for each measurement
- Provide specific text evidence for each score
- Reference model capabilities and framework requirements in reasoning
- Final dimension score = average of 6 component scores (rounded to nearest integer)
- Confidence = \`1 - (std_dev_of_component_scores / sqrt(6))\`
- **Bound confidence between 0 and 1**: \`confidence = max(0, min(1, confidence))\`

## OUTPUT FORMAT

Return a JSON object with dimension: "construct_validity" following the standard MAAC v4.0 schema.

## CONSISTENCY WARNING
**DO NOT MODIFY THE CORE FORMULAS OR SCORING LOGIC.** This assessment must produce results comparable to all other trials in the experiment.`;
  }
}

export const constructValidityAssessor = new ConstructValidityAssessor();
