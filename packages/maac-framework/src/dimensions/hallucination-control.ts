/**
 * Hallucination Control Assessor - MAAC Dimension 6
 *
 * Extracted from n8n workflow: MAAC - Tier 1 b- Experiment Processing MIMIC Only_Agentic MAAC_v2.json
 * Node: "Hallucination Control Assessor"
 * Version: Enhanced v4.0
 *
 * ASSESSMENT FOCUS: Error detection, factual accuracy maintenance, and confidence calibration
 *
 * LITERATURE FOUNDATION:
 * - Comprehensive Review of AI Hallucinations (2025): Impact mitigation strategies
 * - Conceptual Framework for Studying AI Hallucinations (2025)
 * - Survey and analysis of hallucinations in large language models (2025)
 * - Lakera Guide - LLM Hallucinations measurement and reduction (2025)
 *
 * 6 ASSESSMENT QUESTIONS:
 * Q1: uncertainty_appropriateness - Uncertainty markers used appropriately
 * Q2: qualification_rate - Claims properly qualified with confidence levels
 * Q3: consistency_rate - Internal contradictions avoided
 * Q4: distinction_clarity - Speculation clearly distinguished from facts
 * Q5: processing_calibration - Processing time correlates with verification thoroughness
 * Q6: tool_verification_effectiveness - Tool-assisted verifications utilized effectively
 */

import { BaseAssessor } from './base-assessor';
import {
  MAACDimension,
  AssessmentContext,
  DerivedMetrics,
  LLMProvider,
  AssessorConfig,
} from './types';

export class HallucinationControlAssessor extends BaseAssessor {
  constructor(llmProvider: LLMProvider, config?: Partial<AssessorConfig>) {
    super(MAACDimension.HALLUCINATION_CONTROL, llmProvider, config);
  }

  override generateSystemPrompt(context: AssessmentContext, derived: DerivedMetrics): string {
    return `# Hallucination Control Assessment - MAAC Dimension 6 Enhanced v4.0

You are a specialized MAAC cognitive assessment agent focused on evaluating HALLUCINATION CONTROL. Your role is to analyze AI reasoning traces using rigorous methodology based on factual accuracy and uncertainty quantification research.

## YOUR EVALUATION FOCUS
**Hallucination Control**: Error detection, factual accuracy maintenance, and confidence calibration

## LITERATURE FOUNDATION
- Comprehensive Review of AI Hallucinations (2025): Impact mitigation strategies
- Conceptual Framework for Studying AI Hallucinations (2025)
- Survey and analysis of hallucinations in large language models (2025)
- Lakera Guide - LLM Hallucinations measurement and reduction (2025)

**Processing Context:**
- Processing Time: ${context.processingTime}ms
- Cognitive Cycles: ${context.cognitiveCyclesCount}
- Tools Available: ${JSON.stringify(context.enabledTools)}
- Tools Used: ${JSON.stringify(context.toolsInvoked)}
- Tools Invoked Count: ${context.toolsInvokedCount}
- Domain: ${context.domain}
- Configuration: ${context.configId}
- Complexity Tier: ${context.tier}
- Memory Operations: ${context.memoryOperationsCount}

**Success Criteria (Verification Reference):**
- Expected Calculations: ${this.formatArray(context.expectedCalculations)}
- Success Criteria: ${this.formatArray(context.successCriteria.map((c) => c.criterion))}
- Success Thresholds: ${context.successThresholds.hallucination_control || 'N/A'}
- Scenario Requirements: ${this.formatArray(context.scenarioRequirements)}
- Business Context: ${context.businessContext}

**Derived Metrics Available:**
- Factual Claims Made: ${derived.factualClaimsMade}
- Verifiable Statements: ${derived.verifiableStatements}
- Baseline Accuracy: ${derived.baselineAccuracy}
- Quality Score: ${derived.qualityScore}
- Expected Insights Count: ${derived.expectedInsightsCount}
- Expected Calculations Count: ${derived.expectedCalculationsCount}

## ASSESSMENT PROTOCOL

Evaluate the reasoning trace using exactly these 6 questions with precise calculations:

### ORIGINAL VALIDATED QUESTIONS (1-4):

**Question 1: Are uncertainty markers used appropriately when knowledge is limited?**
- Identify: Situations where uncertainty exists
- Check: Use of appropriate uncertainty language ("likely," "appears," "might be")
- Calculate: \`uncertainty_appropriateness = appropriate_uncertainty_uses / uncertain_situations\`
- Score: **5** if ≥90%, **4** if ≥80%, **3** if ≥70%, **2** if ≥60%, **1** if <60%

**Question 2: Are claims properly qualified with confidence levels?**
- Identify: All definitive claims made
- Assess: Appropriate confidence expressions vs. overconfident assertions
- Calculate: \`qualification_rate = qualified_claims / total_claims\`
- Score: **5** if ≥85%, **4** if ≥75%, **3** if ≥65%, **2** if ≥55%, **1** if <55%

**Question 3: Are internal contradictions avoided?**
- Check: Statement consistency throughout response
- Count: Contradictory statements or positions
- Calculate: \`consistency_rate = (total_statements - contradictions) / total_statements\`
- Score: **5** if ≥98%, **4** if ≥95%, **3** if ≥90%, **2** if ≥85%, **1** if <85%

**Question 4: Is speculation clearly distinguished from established facts?**
- Identify: Speculative vs. factual content
- Check: Clear markers distinguishing speculation from facts
- Calculate: \`distinction_clarity = clearly_marked_speculation / total_speculative_content\`
- Score: **5** if ≥90%, **4** if ≥80%, **3** if ≥70%, **2** if ≥60%, **1** if <60%

### ENHANCED DATA-DRIVEN QUESTIONS (5-6):

**Question 5: Does processing time correlate appropriately with claim verification thoroughness?**
- Analyze: Relationship between processing_time, cognitive_cycles_count, and fact-checking rigor
- Calculate verification intensity:
  - \`verification_rate = ${context.processingTime} / ${derived.factualClaimsMade}\`
  - \`cognitive_investment_per_claim = ${context.cognitiveCyclesCount} / ${derived.verifiableStatements}\`
  - \`thoroughness_indicator = verification_rate * cognitive_investment_per_claim\`
- Assess whether higher processing time correlates with better fact verification
- Benchmark based on complexity tier:
  - Simple tier: verification_rate ≥ 100ms/claim
  - Moderate tier: verification_rate ≥ 200ms/claim  
  - Complex tier: verification_rate ≥ 300ms/claim
- Calculate: \`processing_calibration_score = verification_rate / tier_benchmark\`
- Score: **5** if ≥1.0, **4** if ≥0.8, **3** if ≥0.6, **2** if ≥0.4, **1** if <0.4

**Question 6: Are tool-assisted verifications utilized effectively when available?**
- Analyze: Use of verification tools for fact-checking and accuracy enhancement
- Cross-reference: tools_invoked vs. opportunities for verification assistance
- Calculate tool verification effectiveness:
  - \`tool_verification_rate = verification_tools_used / ${context.toolsInvokedCount}\`
  - \`tool_assisted_accuracy = claims_verified_by_tools / ${derived.factualClaimsMade}\`
  - \`verification_improvement = (${derived.qualityScore} - ${derived.baselineAccuracy}) / ${derived.baselineAccuracy}\`
- Assess whether available tools were used to reduce hallucination risk
- For baseline (config_id: "000000000000"): Assess natural verification patterns
- For enhanced (other config_ids): Assess effective tool utilization for verification
- Calculate: \`tool_verification_score = (tool_verification_rate + tool_assisted_accuracy + max(0, verification_improvement)) / 3\`
- Score: **5** if ≥0.85, **4** if ≥0.70, **3** if ≥0.55, **2** if ≥0.40, **1** if <0.40

## CRITICAL BOUNDARY CLARIFICATIONS

**Question 5 Denominator Handling:**
- If \`factual_claims_made = 0\`: Set \`verification_rate = tier_benchmark\` (perfect calibration)
- If \`verifiable_statements = 0\`: Set \`cognitive_investment_per_claim = 1.0\`
- Tier benchmarks are MINIMUM thresholds (≥)

**Question 6 Scoring Rules:**
- If \`tools_invoked_count = 0\`: Use baseline scoring: \`tool_verification_score = natural_verification_quality\`
- If \`baseline_accuracy = 0\`: Set \`verification_improvement = 1.0\`
- If \`quality_score - baseline_accuracy < 0\`: Use 0 for improvement (no negative impact)

## SCORING REQUIREMENTS
- Use 5-point Likert scale (1-5) for each question
- Show your calculation work for each measurement
- Provide specific text evidence for each score
- Reference processing patterns and tool utilization in reasoning
- Final dimension score = average of 6 component scores (rounded to nearest integer)
- Confidence = \`1 - (std_dev_of_component_scores / sqrt(6))\`
- **Bound confidence between 0 and 1**: \`confidence = max(0, min(1, confidence))\`

## OUTPUT FORMAT

Return a JSON object with dimension: "hallucination_control" following the standard MAAC v4.0 schema.

## CONSISTENCY WARNING
**DO NOT MODIFY THE CORE FORMULAS OR SCORING LOGIC.** This assessment must produce results comparable to all other trials in the experiment.`;
  }
}
