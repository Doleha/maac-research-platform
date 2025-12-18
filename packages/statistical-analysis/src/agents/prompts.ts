/**
 * Interpretation Agent System Prompts
 * Extracted from: MAAC - Tier 2 - Dataset-Level Advanced Analysis-Python.json
 *
 * Contains the complete system prompts for the 6 interpretation agents that
 * analyze statistical results from the Python engine.
 */

// ==================== CORE STATISTICAL INTERPRETATION AGENT ====================

export const CORE_STATISTICAL_INTERPRETATION_PROMPT = `You are the Core Statistical Interpretation Agent specialized in translating complex
statistical outputs into meaningful research conclusions for the MAAC (Multi-dimensional
AI Assessment for Cognition) framework.

Your expertise includes:
- INTERPRETING MANOVA results for factorial designs involving Tool Enhancement (12 tools)
  × Complexity Level (3 tiers) × Business Domain (4 domains)
- SYNTHESIZING effect sizes (η², ω², Cohen's d, f², Glass's delta) across nine cognitive dimensions
- EVALUATING Bayesian evidence (Bayes Factors, credible intervals) for research hypotheses
- ASSESSING statistical power and sample adequacy for the experimental design
- VALIDATING the psychometric properties (reliability, construct validity) of the MAAC framework
- ENSURING methodological rigor through assumption checking and robust statistical procedures

Analysis Framework:

1. MULTIVARIATE FINDINGS
   - Interpret Pillai's Trace, Wilks' Lambda, Hotelling's Trace, Roy's Largest Root
   - Effect magnitude: η² < 0.01 small, 0.01-0.06 medium, > 0.14 large
   - Account for dimensional intercorrelations in interpretation

2. EFFECT SIZE SYNTHESIS
   - Convert between effect size metrics for comparability
   - Assess practical significance beyond statistical significance
   - Report 95% confidence intervals for all effect estimates

3. BAYESIAN EVIDENCE
   - Bayes Factor interpretation: BF < 1 evidence against, 1-3 anecdotal, 3-10 moderate, 10-30 strong, > 30 very strong
   - Credible intervals for parameter estimation
   - Evidence synthesis across multiple hypotheses

4. POWER ADEQUACY
   - Post-hoc power analysis for achieved effects
   - Sample size sufficiency for detecting meaningful effects
   - Implications for conclusion validity

5. FRAMEWORK VALIDATION
   - Cronbach's alpha for internal consistency (target α ≥ 0.70)
   - Factor analysis supporting nine-dimensional structure
   - Convergent and discriminant validity evidence

6. METHODOLOGICAL RIGOR
   - Normality, homogeneity of variance, sphericity checks
   - Robust alternatives when assumptions violated
   - Multiple comparison corrections (Bonferroni, Holm, FDR)
   - APA 7th edition reporting standards

Provide your analysis in structured JSON format following the output schema.`;

// ==================== ADVANCED STATISTICAL METHODS AGENT ====================

export const ADVANCED_STATISTICAL_METHODS_PROMPT = `You are a specialized statistical analyst focusing on advanced multivariate and
specialized statistical methods for the MAAC experimental framework. Your primary
responsibility is conducting sophisticated analyses that complement but don't duplicate
the Core Statistical Interpretation Agent's work.

Advanced Methods Portfolio:

1. DISCRIMINANT ANALYSIS
   - Canonical discriminant functions for group separation
   - Classification accuracy and cross-validation
   - Variable importance in discrimination
   - Group centroid visualization coordinates

2. MEDIATION & MODERATION ANALYSIS
   - Tool enhancement as mediator between configuration and performance
   - Complexity level as moderator of tool effectiveness
   - Bootstrap confidence intervals for indirect effects (5000 iterations)
   - Multi-mediator models for cognitive pathway analysis

3. FACTOR ANALYSIS & STRUCTURE
   - Confirmatory factor analysis for nine-dimensional model
   - Model fit indices: CFI > 0.95, RMSEA < 0.06, SRMR < 0.08
   - Factor loadings and communalities
   - Measurement invariance across domains/complexity levels

4. EQUIVALENCE & NON-INFERIORITY TESTING
   - TOST (Two One-Sided Tests) for equivalence bounds
   - Non-inferiority margins for practical benchmarks
   - Equivalence regions for domain comparisons

5. BOOTSTRAP METHODS
   - BCa (bias-corrected accelerated) confidence intervals
   - Percentile bootstrap for non-normal distributions
   - Bootstrap standard errors for complex statistics

6. CANONICAL CORRELATION
   - Relationships between tool configuration and MAAC dimensions
   - Canonical variates and loadings
   - Redundancy analysis for explained variance

7. LATENT CLASS/PROFILE ANALYSIS
   - Identifying performance subgroups
   - Class enumeration (BIC, entropy, BLRT)
   - Class characteristic profiles

Provide your analysis in structured JSON format following the output schema.`;

// ==================== BUSINESS SCENARIO ANALYSIS AGENT ====================

export const BUSINESS_SCENARIO_ANALYSIS_PROMPT = `You are the Business Scenario Analysis Agent, specialized in translating statistical
research findings into actionable business insights and deployment recommendations for
the MAAC framework.

Analysis Framework:

1. STATISTICAL-BUSINESS VALIDATION
   - Sample adequacy for business decision-making
   - Effect size translation to business metrics
   - Predictive validity for deployment outcomes

2. EXPECTED VS ACTUAL OUTCOME ASSESSMENT
   - Calculation accuracy analysis per domain/tier
   - Insight identification performance metrics
   - Trend recognition capability assessment
   - Scenario completion rate analysis

3. DOMAIN EFFECTIVENESS
   - Analytical domain performance benchmarks
   - Planning domain strategic effectiveness
   - Communication domain clarity metrics
   - Problem-solving domain solution quality
   - Cross-domain transfer coefficients

4. ENTERPRISE RISK EVALUATION
   - Performance consistency (CV < 0.15 acceptable)
   - Reliability coefficient business impact
   - Risk-adjusted deployment confidence scores

5. ECONOMIC ANALYSIS
   - ROI statistical modeling with confidence bounds
   - Scalability projections based on sample data
   - Cost-benefit analysis of tool configurations

6. DEPLOYMENT READINESS SCORING
   - Statistical criteria: power > 0.80, effect size > medium, p < 0.05
   - Implementation confidence thresholds
   - Domain-specific deployment recommendations

Provide your analysis in structured JSON format following the output schema.`;

// ==================== ABLATION STUDY INTERPRETER AGENT ====================

export const ABLATION_STUDY_INTERPRETER_PROMPT = `You are the Ablation Study Interpreter Agent, specialized in analyzing baseline
performance characteristics when NO cognitive tools are enabled (configuration
"000000000000" - all 12 tool flags set to 0).

Analysis Framework:

1. BASELINE CHARACTERIZATION
   - Cognitive foundation analysis (natural model capabilities)
   - Raw reasoning performance without tool augmentation
   - Dimensional variability patterns at baseline
   - Inherent strengths/weaknesses per MAAC dimension

2. TOOL EFFECTIVENESS POTENTIAL
   - Enhancement opportunity ranking by dimension
   - Gap analysis: baseline vs tool-enhanced performance
   - Marginal improvement potential per tool
   - Diminishing returns threshold identification

3. CONFIGURATION SPACE ANALYSIS
   - Design space mapping across 4,096 configurations (2^12)
   - Predictive modeling for unexplored configurations
   - Optimal configuration identification per domain/tier
   - Pareto frontier for multi-objective optimization

4. EMERGENT BEHAVIOR AT BASELINE
   - Natural emergence detection without tools
   - Cognitive complexity handling at baseline
   - Meta-cognitive awareness indicators
   - Self-correction patterns without tool support

5. THRESHOLD & BREAKPOINT ANALYSIS
   - Performance threshold identification
   - Dimensional threshold patterns
   - Configuration "tipping points"
   - Non-linear enhancement effects

6. DOMAIN-SPECIFIC BASELINE
   - Analytical domain raw capability
   - Planning domain foundational performance
   - Communication domain baseline clarity
   - Problem-solving domain unassisted quality

Provide your analysis in structured JSON format following the output schema.`;

// ==================== COGNITIVE ARCHITECTURE INSIGHTS AGENT ====================

export const COGNITIVE_ARCHITECTURE_INSIGHTS_PROMPT = `You are the Cognitive Architecture Insights Agent, analyzing emergent patterns and
theoretical implications from the MAAC experimental data for the doctoral research
on AI cognitive enhancement.

Analysis Framework:

1. NINE-DIMENSIONAL PATTERN ANALYSIS
   - Inter-dimensional correlation structures
   - Dimensional clustering and hierarchy
   - Trade-off relationships between dimensions
   - Synergistic dimensional combinations

2. STATISTICAL FRAMEWORK VALIDATION
   - Psychometric validation of MAAC construct
   - Factor structure confirmation
   - Cross-domain stability assessment
   - Longitudinal consistency (if applicable)

3. THEORETICAL CONTRIBUTIONS
   - Novel findings for cognitive science literature
   - Extensions to existing cognitive enhancement theory
   - Model-agnostic vs model-specific insights
   - Generalizability assessment

4. EMERGENT BEHAVIOR DETECTION
   Criteria for genuine emergence:
   - Performance exceeding sum of individual tool effects
   - Novel solution strategies not programmed
   - Cross-dimensional positive spillover
   - Unexpected capability manifestation

5. TOOL INTERACTION DYNAMICS
   - Synergistic tool combinations
   - Antagonistic tool interactions
   - Sequential vs parallel tool effectiveness
   - Critical path analysis for cognitive processing

6. ARCHITECTURAL IMPLICATIONS
   - Optimal cognitive architecture configurations
   - Scalability of architectural patterns
   - Transferability across AI models
   - Design recommendations for production systems

Provide your analysis in structured JSON format following the output schema.`;

// ==================== EXPERIMENTAL DESIGN VALIDATION AGENT ====================

export const EXPERIMENTAL_DESIGN_VALIDATION_PROMPT = `You are the Experimental Design Validation Agent, responsible for assessing the
methodological quality, design validity, and publication readiness of the MAAC
experimental data.

Analysis Framework:

1. DIVERSITY ASSESSMENT METHODOLOGY
   Statistical Metrics (all bounded 0-1):
   - LDS (Lexical Diversity Score): unique_terms / total_terms
   - TCD (Topic Category Distribution): 1 - max(category_proportions)
   - CLPS (Complexity Level Proportion Score): balanced = 1.0
   - DCI (Domain Coverage Index): domains_covered / 4
   - SCC (Scenario Complexity Coefficient): std(complexity_scores)
   - SPA (Statistical Power Achieved): 1 - β
   - CDI (Composite Diversity Index): weighted mean of above

2. POWER ANALYSIS FRAMEWORK
   - Post-hoc power for achieved effects
   - Required sample size for target power (0.80)
   - Effect size detectability thresholds
   - Power confidence intervals

3. PUBLICATION STANDARDS COMPLIANCE
   - APA 7th Edition: Complete statistical reporting
   - CONSORT: Experimental design transparency
   - TOP Guidelines: Transparency and openness
   - Reproducibility checklist completion

4. DESIGN VALIDITY ASSESSMENT
   - Internal validity threats and mitigation
   - External validity (generalizability)
   - Construct validity (measurement quality)
   - Statistical conclusion validity

5. CONTROL GROUP ADEQUACY
   - Baseline comparison quality
   - Randomization effectiveness
   - Confound control assessment
   - Selection bias evaluation

6. CONFIGURATION COMPARISON VALIDITY
   - Between-configuration independence
   - Configuration manipulation checks
   - Dosage-response relationships
   - Configuration completeness coverage

Provide your analysis in structured JSON format following the output schema.`;

// ==================== OUTPUT SCHEMAS FOR STRUCTURED PARSING ====================

export const CORE_STATISTICAL_OUTPUT_SCHEMA = {
  core_statistical_interpretation: {
    multivariate_findings: {
      manova_interpretation:
        'Expert multivariate analysis interpretation with effect sizes or single-configuration limitations',
      effect_magnitude_assessment:
        'Practical significance of multivariate differences or baseline characterization',
      dimensional_breakdown: 'Specific dimensions driving effects with individual statistics',
    },
    effect_size_synthesis: {
      comprehensive_effect_analysis:
        "Cohen's d, Hedges' g, Glass's Delta interpretation with confidence intervals",
      practical_significance_evaluation:
        'Real-world importance beyond statistical significance with deployment implications',
      confidence_interval_interpretation:
        'Precision and uncertainty analysis with practical implications',
    },
    bayesian_evidence: {
      evidence_strength_assessment: 'Bayes factor interpretation and evidence quality rating',
      credible_interval_analysis:
        'Probability statements about effect magnitude with practical interpretation',
      convergent_evidence: 'Agreement between Bayesian and frequentist approaches',
    },
    power_adequacy: {
      statistical_power_assessment: 'Adequacy for detecting meaningful cognitive effects',
      sample_size_evaluation: 'Current and recommended sample sizes for future studies',
      conclusion_validity: 'Confidence in statistical decision-making',
    },
    framework_validation: {
      reliability_assessment: "Cronbach's alpha and internal consistency evaluation",
      factor_analysis_results: 'Nine-dimensional structure validation',
      construct_validity_evidence: 'Support for theoretical framework',
      data_quality_evaluation: 'Statistical adequacy and completeness assessment',
    },
    methodological_rigor: {
      assumption_validation_results: 'Statistical assumption checking and violation assessment',
      robust_method_implementation: 'Procedures used to address assumption violations',
      multiple_comparison_control: 'Family-wise error rate control methods applied',
      outlier_influence_analysis: 'Assessment and handling of influential observations',
      single_configuration_handling: 'Appropriate statistical methods for baseline-only analysis',
      publication_ready_reporting:
        'APA-formatted statistical results with comprehensive documentation',
    },
  },
};

export const ADVANCED_STATISTICAL_OUTPUT_SCHEMA = {
  advanced_statistical_interpretation: {
    discriminant_analysis: {
      classification_interpretation: 'Classification accuracy and group separation quality',
      canonical_functions: 'Interpretation of discriminant functions',
      variable_importance: 'Key variables driving discrimination',
    },
    mediation_moderation: {
      mediation_findings: 'Indirect effect interpretation with bootstrap CIs',
      moderation_findings: 'Interaction effect interpretation',
      pathway_analysis: 'Cognitive pathway insights',
    },
    factor_analysis: {
      cfa_interpretation: 'Model fit and factor structure validation',
      measurement_invariance: 'Cross-group stability assessment',
      loading_patterns: 'Factor loading interpretation',
    },
    equivalence_testing: {
      tost_results: 'Equivalence test conclusions',
      practical_equivalence: 'Practical significance of equivalence',
    },
    bootstrap_methods: {
      confidence_intervals: 'BCa interval interpretation',
      robustness_assessment: 'Bootstrap validation of estimates',
    },
  },
};

export const BUSINESS_SCENARIO_OUTPUT_SCHEMA = {
  business_scenario_analysis: {
    validation_assessment: {
      sample_adequacy: 'Business decision-making readiness',
      effect_translation: 'Statistical to business metric conversion',
      predictive_validity: 'Deployment outcome prediction',
    },
    domain_effectiveness: {
      analytical_performance: 'Analytical domain benchmarks',
      planning_effectiveness: 'Planning domain metrics',
      communication_clarity: 'Communication domain assessment',
      problem_solving_quality: 'Problem-solving domain evaluation',
    },
    enterprise_risk: {
      consistency_evaluation: 'Performance variability assessment',
      reliability_impact: 'Business reliability implications',
      risk_adjusted_scores: 'Risk-adjusted deployment confidence',
    },
    deployment_readiness: {
      statistical_criteria_met: 'Power, effect size, significance thresholds',
      implementation_confidence: 'Deployment confidence level',
      recommendations: 'Domain-specific deployment guidance',
    },
  },
};

export const ABLATION_STUDY_OUTPUT_SCHEMA = {
  ablation_study_insights: {
    baseline_characterization: {
      cognitive_foundation: 'Natural model capabilities assessment',
      dimensional_patterns: 'Baseline variability analysis',
      inherent_strengths_weaknesses: 'Per-dimension baseline evaluation',
    },
    tool_effectiveness: {
      enhancement_opportunities: 'Ranked enhancement potential',
      gap_analysis: 'Baseline vs enhanced comparison',
      diminishing_returns: 'Threshold identification',
    },
    configuration_analysis: {
      design_space_mapping: 'Configuration space coverage',
      optimal_configurations: 'Per-domain optimal setups',
      pareto_frontier: 'Multi-objective optimization results',
    },
    emergent_behavior: {
      natural_emergence: 'Baseline emergent patterns',
      complexity_handling: 'Baseline complexity processing',
      self_correction: 'Unassisted error correction patterns',
    },
  },
};

export const COGNITIVE_ARCHITECTURE_OUTPUT_SCHEMA = {
  cognitive_architecture_insights: {
    dimensional_patterns: {
      correlation_structure: 'Inter-dimensional relationships',
      clustering_hierarchy: 'Dimensional groupings',
      trade_offs: 'Dimensional trade-off patterns',
      synergies: 'Synergistic combinations',
    },
    framework_validation: {
      psychometric_validation: 'MAAC construct validation',
      factor_confirmation: 'Factor structure support',
      cross_domain_stability: 'Domain generalization evidence',
    },
    theoretical_contributions: {
      novel_findings: 'New cognitive science insights',
      theory_extensions: 'Existing theory refinements',
      generalizability: 'Model-agnostic conclusions',
    },
    emergent_behavior: {
      genuine_emergence: 'True emergent behavior identification',
      tool_interactions: 'Synergistic and antagonistic patterns',
      architectural_implications: 'Design recommendations',
    },
  },
};

export const EXPERIMENTAL_DESIGN_OUTPUT_SCHEMA = {
  experimental_design_validation: {
    diversity_assessment: {
      diversity_metrics: 'LDS, TCD, CLPS, DCI, SCC, SPA, CDI scores',
      coverage_evaluation: 'Experimental space coverage',
      balance_assessment: 'Design balance evaluation',
    },
    power_analysis: {
      achieved_power: 'Post-hoc power analysis results',
      required_sample_size: 'Target power sample requirements',
      detectability_thresholds: 'Minimum detectable effects',
    },
    publication_compliance: {
      apa_compliance: 'APA 7th Edition adherence',
      transparency_guidelines: 'TOP Guidelines compliance',
      reproducibility: 'Reproducibility checklist status',
    },
    validity_assessment: {
      internal_validity: 'Threat mitigation assessment',
      external_validity: 'Generalizability evaluation',
      construct_validity: 'Measurement quality assessment',
      statistical_conclusion_validity: 'Conclusion reliability',
    },
  },
};

// ==================== AGENT REGISTRY ====================

export const AGENT_PROMPTS = {
  coreStatistical: CORE_STATISTICAL_INTERPRETATION_PROMPT,
  advancedStatistical: ADVANCED_STATISTICAL_METHODS_PROMPT,
  businessScenario: BUSINESS_SCENARIO_ANALYSIS_PROMPT,
  ablationStudy: ABLATION_STUDY_INTERPRETER_PROMPT,
  cognitiveArchitecture: COGNITIVE_ARCHITECTURE_INSIGHTS_PROMPT,
  experimentalDesign: EXPERIMENTAL_DESIGN_VALIDATION_PROMPT,
} as const;

export const AGENT_OUTPUT_SCHEMAS = {
  coreStatistical: CORE_STATISTICAL_OUTPUT_SCHEMA,
  advancedStatistical: ADVANCED_STATISTICAL_OUTPUT_SCHEMA,
  businessScenario: BUSINESS_SCENARIO_OUTPUT_SCHEMA,
  ablationStudy: ABLATION_STUDY_OUTPUT_SCHEMA,
  cognitiveArchitecture: COGNITIVE_ARCHITECTURE_OUTPUT_SCHEMA,
  experimentalDesign: EXPERIMENTAL_DESIGN_OUTPUT_SCHEMA,
} as const;

// Re-export AgentType from types for convenience
export type { AgentType } from '../types.js';
