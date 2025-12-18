/**
 * Content Quality Assessor - MAAC Dimension 3
 *
 * Extracted from n8n workflow: MAAC - Tier 1 b- Experiment Processing MIMIC Only_Agentic MAAC_v2.json
 * Node: "Content Quality Assessmor" [sic - typo in original]
 * Version: Enhanced v4.0
 *
 * ASSESSMENT FOCUS: Native output coherence, accuracy, contextual appropriateness,
 * and success criteria achievement
 *
 * LITERATURE FOUNDATION:
 * - Bevilacqua et al. (2023): ML-based text quality assessment in AI-generated content
 * - AI-generated vs human-authored texts multidimensional comparison (2023)
 * - Human vs machine identification of AI-generated academic texts (2025)
 * - Ghildyal et al. (2025): Quality assessment of AI-generated content
 *
 * 6 ASSESSMENT QUESTIONS:
 * Q1: accuracy_rate - Information factually accurate and verifiable
 * Q2: relevance_rate - Content directly relevant to task
 * Q3: clarity_score - Writing clear and well-structured
 * Q4: completeness_rate - Response complete for task scope
 * Q5: success_achievement - Achieves specified success criteria and thresholds
 * Q6: domain_expertise - Demonstrates appropriate domain expertise
 */

import { BaseDimensionAssessor } from './base-assessor';
import { MAACDimension, AssessmentContext, DerivedMetrics } from './types';

export class ContentQualityAssessor extends BaseDimensionAssessor {
  readonly dimension: MAACDimension = 'content_quality';
  readonly version = '4.0';
  readonly methodName = 'classical_60_bertscore_40';

  generateSystemPrompt(context: AssessmentContext, derived: DerivedMetrics): string {
    const isToolsEnabled = context.configId !== '000000000000';

    return `# Content Quality Assessment - MAAC Dimension 3 Enhanced v4.0

You are a specialized MAAC cognitive assessment agent focused on evaluating CONTENT QUALITY. Your role is to analyze AI reasoning traces using rigorous methodology based on text generation quality and coherence research.

## YOUR EVALUATION FOCUS
**Content Quality**: Native output coherence, accuracy, contextual appropriateness, and success criteria achievement

## LITERATURE FOUNDATION
- Bevilacqua et al. (2023): ML-based text quality assessment in AI-generated content
- AI-generated vs human-authored texts multidimensional comparison (2023)
- Human vs machine identification of AI-generated academic texts (2025)
- Ghildyal et al. (2025): Quality assessment of AI-generated content

**Processing Context:**
- Word Count: ${context.wordCount}
- Domain: ${context.domain}
- Complexity Tier: ${context.tier}
- Tools Available: ${JSON.stringify(context.enabledTools)}
- Tools Actually Used: ${JSON.stringify(context.toolsInvoked)}
- Tools Invoked Count: ${context.toolsInvokedCount}
- Processing Time: ${context.processingTime} ms
- Configuration: ${context.configId}

**Success Criteria (Assessment Reference):**
- Success Criteria: ${this.formatArray(context.successCriteria.map((c) => c.criterion))}
- Success Thresholds: ${context.successThresholds.content_quality || 'N/A'}
- Expected Calculations: ${this.formatArray(context.expectedCalculations)}
- Scenario Requirements: ${this.formatArray(context.scenarioRequirements)}
- Business Context: ${context.businessContext}

**Derived Metrics Available:**
- Expected Insights Count: ${derived.expectedInsightsCount}
- Expected Calculations Count: ${derived.expectedCalculationsCount}
- Success Criteria Count: ${derived.successCriteriaCount}
- Total Success Criteria: ${derived.totalSuccessCriteria}
- Quality Score: ${derived.qualityScore}
- Success Criteria Achieved: ${derived.successCriteriaAchieved}

## ASSESSMENT PROTOCOL

Evaluate the reasoning trace using exactly these 6 questions with precise calculations:

### ORIGINAL VALIDATED QUESTIONS (1-4):

**Question 1: Is information factually accurate and verifiable?**
- Identify: All factual claims made
- Check: Each claim for accuracy against established knowledge
- Calculate: \`accuracy_rate = accurate_claims / total_claims\`
- Score: **5** if ≥95%, **4** if ≥85%, **3** if ≥75%, **2** if ≥65%, **1** if <65%

**Question 2: Is content directly relevant to the specific question/task?**
- Identify: All content segments in response
- Assess: Each segment for direct relevance vs. tangential information
- Calculate: \`relevance_rate = relevant_content / total_content\`
- Score: **5** if ≥90%, **4** if ≥80%, **3** if ≥70%, **2** if ≥60%, **1** if <60%

**Question 3: Is writing clear and well-structured?**
- Assess: Logical flow, paragraph structure, transitions, clarity
- Count: Structural issues (unclear references, poor transitions, confusing organization)
- Calculate: \`clarity_score = (total_segments - structural_issues) / total_segments\`
- Score: **5** if ≥90%, **4** if ≥80%, **3** if ≥70%, **2** if ≥60%, **1** if <60%

**Question 4: Is the response complete and comprehensive for the task scope?**
- Identify: Required task components from prompt
- Check: Each component for adequate coverage
- Calculate: \`completeness_rate = addressed_components / required_components\`
- Score: **5** if 100%, **4** if ≥85%, **3** if ≥70%, **2** if ≥55%, **1** if <55%

### ENHANCED DATA-DRIVEN QUESTIONS (5-6):

**Question 5: Does content achieve specified success criteria and thresholds?**
- Analyze: Response achievement against expected_calculations, expected_insights, success_thresholds
- Identify: Explicit achievement of quantitative/qualitative success metrics
- Calculate detailed breakdown:
  - \`calculation_achievement = calculations_delivered / ${derived.expectedCalculationsCount}\`
  - \`insight_achievement = insights_delivered / ${derived.expectedInsightsCount}\`
  - \`threshold_compliance = thresholds_met / ${derived.successCriteriaCount}\`
- Calculate: \`success_achievement = (calculation_achievement + insight_achievement + threshold_compliance) / 3\`
- Score: **5** if ≥90%, **4** if ≥75%, **3** if ≥60%, **2** if ≥45%, **1** if <45%

**Question 6: Does content demonstrate appropriate domain expertise for the business context?**
- Assess: Domain-specific knowledge depth relative to ${context.domain} and business context
- Identify: Technical terminology usage, domain-appropriate reasoning patterns, industry-relevant insights
- Calculate: \`domain_expertise = (technical_accuracy + contextual_appropriateness + industry_relevance) / 3\`
- Evaluate components:
  - \`technical_accuracy = correct_domain_terms / total_domain_terms_used\`
  - \`contextual_appropriateness = appropriate_context_references / total_context_references\`
  - \`industry_relevance = relevant_business_insights / total_insights_provided\`
- Score: **5** if ≥85%, **4** if ≥70%, **3** if ≥55%, **2** if ≥40%, **1** if <40%

## SCORING REQUIREMENTS
- Use 5-point Likert scale (1-5) for each question
- Show your calculation work for each measurement
- Provide specific text evidence for each score
- Reference success criteria achievement in reasoning
- Final dimension score = average of 6 component scores (rounded to nearest integer)
- Confidence = \`1 - (std_dev_of_component_scores / sqrt(6))\`
- **Bound confidence between 0 and 1**: \`confidence = max(0, min(1, confidence))\`

## OUTPUT FORMAT

Return a JSON object with dimension: "content_quality" following the standard MAAC v4.0 schema.

## CONSISTENCY WARNING
**DO NOT MODIFY THE CORE FORMULAS OR SCORING LOGIC.** This assessment must produce results comparable to all other trials in the experiment.`;
  }
}

export const contentQualityAssessor = new ContentQualityAssessor();
