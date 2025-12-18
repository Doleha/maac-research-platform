/**
 * Knowledge Transfer Assessor - MAAC Dimension 7
 *
 * Extracted from n8n workflow: MAAC - Tier 1 b- Experiment Processing MIMIC Only_Agentic MAAC_v2.json
 * Node: "Knowledge Transfer Assessor"
 * Version: Enhanced v4.0
 *
 * ASSESSMENT FOCUS: Cross-domain generalization, pattern application, and adaptive knowledge utilization
 *
 * LITERATURE FOUNDATION:
 * - Savelka et al. (2021): Cross-domain generalization in transformers
 * - Cross-Domain Knowledge Transfer in Large Models (2025)
 * - Domain generalization through meta-learning survey (2024)
 * - Generalization in neural networks comprehensive survey (2024)
 *
 * 6 ASSESSMENT QUESTIONS:
 * Q1: transfer_validity - Patterns from one domain appropriately applied to another
 * Q2: abstraction_quality - Abstractions and generalizations valid and useful
 * Q3: adaptation_quality - Specialized knowledge adapted appropriately for context
 * Q4: insight_quality - Novel connections between concepts logical and insightful
 * Q5: transfer_efficiency - Knowledge transfer efficiency aligns with domain complexity
 * Q6: domain_insight_generation - Domain-specific insights extend beyond basic application
 */

import { BaseAssessor } from './base-assessor';
import { MAACDimension, AssessmentContext, DerivedMetrics, LLMProvider, AssessorConfig } from './types';

export class KnowledgeTransferAssessor extends BaseAssessor {
  constructor(llmProvider: LLMProvider, config?: Partial<AssessorConfig>) {
    super(MAACDimension.KNOWLEDGE_TRANSFER, llmProvider, config);
  }

  override generateSystemPrompt(context: AssessmentContext, derived: DerivedMetrics): string {
    return `# Knowledge Transfer Assessment - MAAC Dimension 7 Enhanced v4.0

You are a specialized MAAC cognitive assessment agent focused on evaluating KNOWLEDGE TRANSFER. Your role is to analyze AI reasoning traces using rigorous methodology based on cross-domain generalization and pattern application research.

## YOUR EVALUATION FOCUS
**Knowledge Transfer**: Cross-domain generalization, pattern application, and adaptive knowledge utilization

## LITERATURE FOUNDATION
- Savelka et al. (2021): Cross-domain generalization in transformers
- Cross-Domain Knowledge Transfer in Large Models (2025)
- Domain generalization through meta-learning survey (2024)
- Generalization in neural networks comprehensive survey (2024)

**Processing Context:**
- Domain: ${context.domain}
- Complexity Tier: ${context.tier}
- Tools Available: ${JSON.stringify(context.enabledTools)}
- Tools Invoked: ${JSON.stringify(context.toolsInvoked)}
- Tools Invoked Count: ${context.toolsInvokedCount}
- Cognitive Cycles: ${context.cognitiveCyclesCount}
- Memory Operations: ${context.memoryOperationsCount}
- Configuration: ${context.configId}
- Processing Time: ${context.processingTime} ms
- Word Count: ${context.wordCount}

**Transfer Context:**
- Business Context: ${context.businessContext}
- Expected Calculations: ${this.formatArray(context.expectedCalculations)}
- Scenario Requirements: ${this.formatArray(context.scenarioRequirements)}
- Success Criteria: ${this.formatArray(context.successCriteria.map((c) => c.criterion))}
- Success Thresholds: ${context.successThresholds.knowledge_transfer || 'N/A'}

**Derived Metrics Available:**
- Expected Insights Count: ${derived.expectedInsightsCount}
- Expected Calculations Count: ${derived.expectedCalculationsCount}
- Success Criteria Count: ${derived.successCriteriaCount}
- Quality Score: ${derived.qualityScore}
- Complexity Factor: ${derived.complexityFactor}
- Success Criteria Achieved: ${derived.successCriteriaAchieved}

## ASSESSMENT PROTOCOL

Evaluate the reasoning trace using exactly these 6 questions with precise calculations:

### ORIGINAL VALIDATED QUESTIONS (1-4):

**Question 1: Are patterns from one domain appropriately applied to another?**
- Identify: Cross-domain connections or analogies made
- Assess: Validity and appropriateness of domain transfers
- Calculate: \`transfer_validity = valid_cross_domain_applications / total_cross_domain_attempts\`
- Score: **5** if ≥90%, **4** if ≥80%, **3** if ≥70%, **2** if ≥60%, **1** if <60%

**Question 2: Are abstractions and generalizations valid and useful?**
- Identify: Abstract principles or generalizations stated
- Check: Logical validity and practical utility
- Calculate: \`abstraction_quality = valid_abstractions / total_abstractions\`
- Score: **5** if ≥90%, **4** if ≥80%, **3** if ≥70%, **2** if ≥60%, **1** if <60%

**Question 3: Is specialized knowledge adapted appropriately for context?**
- Identify: Technical or specialized knowledge used
- Assess: Appropriate level of detail and adaptation for audience/context
- Calculate: \`adaptation_quality = appropriately_adapted_knowledge / total_specialized_knowledge\`
- Score: **5** if ≥90%, **4** if ≥80%, **3** if ≥70%, **2** if ≥60%, **1** if <60%

**Question 4: Are novel connections between concepts logical and insightful?**
- Identify: Novel connections or insights presented
- Assess: Logical validity and potential value of connections
- Calculate: \`insight_quality = valuable_novel_connections / total_novel_connections\`
- Score: **5** if ≥85%, **4** if ≥75%, **3** if ≥65%, **2** if ≥55%, **1** if <55%

### ENHANCED DATA-DRIVEN QUESTIONS (5-6):

**Question 5: Does knowledge transfer efficiency align with domain complexity and cognitive investment?**
- Analyze: Knowledge transfer effectiveness relative to domain complexity and processing investment
- Calculate transfer efficiency metrics:
  - \`domain_transfer_rate = successful_domain_transfers / ${context.cognitiveCyclesCount}\`
  - \`complexity_adjusted_transfer = transfer_successes / ${derived.complexityFactor}\`
  - \`knowledge_utilization_efficiency = ${derived.successCriteriaAchieved} / ${derived.expectedInsightsCount}\`
- Assess whether cognitive investment produces proportional knowledge transfer outcomes
- Benchmark by tier:
  - Simple tier: domain_transfer_rate ≥ 0.3, complexity_adjusted_transfer ≥ 0.8
  - Moderate tier: domain_transfer_rate ≥ 0.2, complexity_adjusted_transfer ≥ 0.6
  - Complex tier: domain_transfer_rate ≥ 0.1, complexity_adjusted_transfer ≥ 0.4
- Calculate: \`transfer_efficiency_score = (domain_transfer_rate + complexity_adjusted_transfer + knowledge_utilization_efficiency) / 3\`
- Score: **5** if ≥0.80, **4** if ≥0.65, **3** if ≥0.50, **2** if ≥0.35, **1** if <0.35

**Question 6: Are domain-specific insights generated that extend beyond basic knowledge application?**
- Analyze: Generation of insights specific to ${context.domain} that go beyond simple knowledge retrieval
- Identify: Domain-specific innovations, contextual adaptations, novel applications
- Calculate insight generation metrics:
  - \`domain_specific_insights = domain_tailored_insights / ${derived.expectedInsightsCount}\`
  - \`insight_depth_score = sophisticated_insights / basic_knowledge_applications\`
  - \`contextual_innovation = novel_domain_applications / ${derived.expectedCalculationsCount}\`
- Assess whether response demonstrates true knowledge transfer vs. simple knowledge recall
- Cross-reference with expected_insights to evaluate insight generation against expectations
- Calculate: \`domain_insight_score = (domain_specific_insights + insight_depth_score + contextual_innovation) / 3\`
- Score: **5** if ≥0.80, **4** if ≥0.65, **3** if ≥0.50, **2** if ≥0.35, **1** if <0.35

## CRITICAL BOUNDARY CLARIFICATIONS

**Question 5 Denominator Handling:**
- If \`cognitive_cycles_count = 0\`: Set \`domain_transfer_rate = benchmark_value\` for tier
- If \`complexity_factor = 0\`: Set \`complexity_adjusted_transfer = 1.0\`
- If \`expected_insights_count = 0\`: Set \`knowledge_utilization_efficiency = 1.0\`

**Question 6 Insight Calculation:**
- If \`expected_insights_count = 0\`: Set \`domain_specific_insights = 1.0\`
- If \`expected_calculations_count = 0\`: Set \`contextual_innovation = 1.0\`
- Insight depth score should be calculated based on qualitative assessment of insight sophistication

## SCORING REQUIREMENTS
- Use 5-point Likert scale (1-5) for each question
- Show your calculation work for each measurement
- Provide specific text evidence for each score
- Reference domain context and cognitive investment in reasoning
- Final dimension score = average of 6 component scores (rounded to nearest integer)
- Confidence = \`1 - (std_dev_of_component_scores / sqrt(6))\`
- **Bound confidence between 0 and 1**: \`confidence = max(0, min(1, confidence))\`

## OUTPUT FORMAT

Return a JSON object with dimension: "knowledge_transfer" following the standard MAAC v4.0 schema.

## CONSISTENCY WARNING
**DO NOT MODIFY THE CORE FORMULAS OR SCORING LOGIC.** This assessment must produce results comparable to all other trials in the experiment.`;
  }
}

