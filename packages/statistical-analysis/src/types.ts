/**
 * MAAC Statistical Analysis Types
 * Extracted from: MAAC - Tier 2 - Dataset-Level Advanced Analysis-Python.json
 * 
 * Defines the comprehensive type system for the statistical analysis pipeline
 * including Python engine integration, multi-agent interpretation, and result structures.
 */

// ==================== EXPERIMENTAL DATA TYPES ====================

/**
 * Raw experimental data from the database
 * Corresponds to maac_experimental_data and maac_experiment_scenarios tables
 */
export interface ExperimentData {
  // Core identifiers
  experiment_id: string;
  session_id: string;
  trial_id: string;
  config_id: string;
  domain: string;
  tier: string;
  model_id: string;
  
  // Tool configuration (12 individual tool enable flags)
  enable_browser?: boolean;
  enable_calculator?: boolean;
  enable_code_execution?: boolean;
  enable_data_analysis?: boolean;
  enable_document_reader?: boolean;
  enable_file_browser?: boolean;
  enable_file_search?: boolean;
  enable_image_generation?: boolean;
  enable_mcp_server?: boolean;
  enable_python?: boolean;
  enable_web_search?: boolean;
  enable_wiki_search?: boolean;
  
  // MAAC Nine-Dimensional Scores
  maac_overall_score: number;
  maac_cognitive_load: number;
  maac_tool_execution: number;
  maac_content_quality: number;
  maac_memory_integration: number;
  maac_complexity_handling: number;
  maac_hallucination_control: number;
  maac_knowledge_transfer: number;
  maac_processing_efficiency: number;
  maac_construct_validity: number;
  
  // Detailed MAAC components (optional, dimension-specific)
  maac_cognitive_load_cycles?: number;
  maac_cognitive_load_depth?: number;
  maac_memory_integration_retrieval?: number;
  maac_memory_integration_coherence?: number;
  maac_tool_execution_accuracy?: number;
  maac_tool_execution_efficiency?: number;
  
  // MIMIC Response Data
  word_count?: number;
  cognitive_cycles?: number;
  memory_operations?: number;
  response_time_ms?: number;
  
  // Scenario Context
  control_expectations?: string;
  success_criteria?: string;
  requirements?: string;
  scenario_description?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

/**
 * MAAC dimension field names for type safety
 */
export const MAAC_DIMENSIONS = [
  'maac_cognitive_load',
  'maac_tool_execution',
  'maac_content_quality',
  'maac_memory_integration',
  'maac_complexity_handling',
  'maac_hallucination_control',
  'maac_knowledge_transfer',
  'maac_processing_efficiency',
  'maac_construct_validity'
] as const;

export type MaacDimension = typeof MAAC_DIMENSIONS[number];

// ==================== BATCH CONFIGURATION ====================

/**
 * Tier 2 batch processing configuration
 */
export interface Tier2Config {
  batchSize: number;        // Default: 5
  analysisThreshold: number; // Default: 3600
  qualityThreshold: number;  // Default: 0.7
  parallelAgents: number;    // Default: 6
  synthesisAgents: number;   // Default: 1
}

export const DEFAULT_TIER2_CONFIG: Tier2Config = {
  batchSize: 5,
  analysisThreshold: 3600,
  qualityThreshold: 0.7,
  parallelAgents: 6,
  synthesisAgents: 1
};

// ==================== PYTHON ENGINE TYPES ====================

/**
 * Single method call for the Python statistical engine
 */
export interface StatisticalMethodCall {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

/**
 * Batch payload for Python engine /api/v1/batch endpoint
 */
export interface BatchPayload {
  calls: StatisticalMethodCall[];
  concurrent: boolean;
  memory_optimize: boolean;
  max_workers: number;
  priority_execution: boolean;
  batch_optimization: {
    chunk_size: number;
    enable_caching: boolean;
    parallel_matrix_ops: boolean;
    concurrent_statistical_methods: boolean;
  };
}

/**
 * Comprehensive analysis payload for /api/v1/comprehensive_analysis
 */
export interface ComprehensiveAnalysisPayload {
  session_id: string;
  experiment_data: ExperimentData[];
  analysis_options: {
    include_advanced_methods: boolean;
    include_business_scenarios: boolean;
    include_tier_analysis: boolean;
    include_domain_analysis: boolean;
    include_maac_methods: boolean;
    include_all_validations: boolean;
    output_format: string;
    performance_optimization: boolean;
  };
}

/**
 * Result from a single statistical method
 */
export interface StatisticalMethodResult {
  method: string;
  ok: boolean;
  result: Record<string, unknown>;
  error?: string;
}

/**
 * Batch processing response from Python engine
 */
export interface BatchResponse {
  results: StatisticalMethodResult[];
  timing_ms: number;
  success: boolean;
}

// ==================== COMPREHENSIVE ANALYSIS RESULTS ====================

/**
 * Execution summary from statistical engine
 */
export interface ExecutionSummary {
  totalMethodsAttempted: number;
  successfulMethods: number;
  failedMethods: number;
  successRate: number;
  processingTimeMs: number;
  analysisTimestamp: string;
}

/**
 * Data quality indicators
 */
export interface DataQuality {
  methodCoverage: {
    successful: number;
    total: number;
  };
  completenessRate: number;
  varianceAdequacy: string;
}

/**
 * Descriptive statistics results
 */
export interface DescriptiveStatistics {
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
  iqr: number;
  confidenceInterval95: [number, number];
}

/**
 * Correlation analysis results
 */
export interface CorrelationAnalysis {
  pearson: {
    r: number;
    p: number;
    significant: boolean;
  };
  spearman: {
    rho: number;
    p: number;
  };
  kendall: {
    tau: number;
    p: number;
  };
  correlationMatrix: number[][];
}

/**
 * Effect size analysis results
 */
export interface EffectSizeAnalysis {
  cohensD: number;
  hedgesG: number;
  glassDelta: number;
  etaSquared: number;
  omegaSquared: number;
  interpretation: 'negligible' | 'small' | 'medium' | 'large';
}

/**
 * Bootstrap analysis results
 */
export interface BootstrapAnalysis {
  mean: number;
  confidenceInterval: [number, number];
  standardError: number;
  bias: number;
  nIterations: number;
}

/**
 * Factor analysis results (PCA/EFA/CFA)
 */
export interface FactorAnalysis {
  pca: {
    valid: boolean;
    eigenvalues: number[];
    componentLoadings: number[][];
    explainedVarianceRatio: number[];
    cumulativeVariance: number;
    significantComponents: number;
    error?: string;
  };
  efa: {
    valid: boolean;
    loadings: number[][];
    communalities: number[];
    uniqueness: number[];
    nFactors: number;
    rotation: string;
    converged: boolean;
    error?: string;
  };
  cfa: {
    valid: boolean;
    goodnessOfFit: {
      cfi: number;
      tli: number;
      rmsea: number;
      srmr: number;
      fitInterpretation: string;
    };
    standardizedLoadings: Record<string, number>;
    error?: string;
  };
}

/**
 * MANOVA results
 */
export interface ManovaResults {
  valid: boolean;
  wilksLambda: number | null;
  pillaiTrace: number | null;
  hotellingT2: number | null;
  roysLargestRoot: number | null;
  pValue: number | null;
  significant: boolean;
  effectSize: number | null;
  error?: string;
}

/**
 * Mediation analysis results
 */
export interface MediationAnalysis {
  valid: boolean;
  mediationDetected: boolean;
  mediationType: 'full' | 'partial' | 'no_mediation';
  pathCoefficients: {
    pathA: number;
    pathB: number;
    pathC: number;
    pathCPrime: number;
  };
  effects: {
    directEffect: number;
    indirectEffect: number;
    totalEffect: number;
    proportionMediated: number;
  };
  sobel: {
    zStatistic: number;
    pValue: number;
    significant: boolean;
  };
  error?: string;
}

/**
 * Reliability analysis results
 */
export interface ReliabilityAnalysis {
  cronbachsAlpha: number;
  alphaInterpretation: 'excellent' | 'good' | 'acceptable' | 'questionable' | 'poor' | 'unacceptable';
  confidenceInterval: [number, number];
  splitHalf: number;
  guttmanLambda6: number;
  itemTotalCorrelations: number[];
}

/**
 * Power analysis results
 */
export interface PowerAnalysis {
  statisticalPower: number;
  effectSize: number;
  sampleSize: number;
  criticalValue: number;
  powerInterpretation: 'adequate' | 'marginal' | 'insufficient';
  recommendedSampleSize: number;
}

/**
 * Assumption testing results
 */
export interface AssumptionTesting {
  kmo: {
    valid: boolean;
    overallKmo: number;
    interpretation: string;
    factorAnalysisRecommendation: string;
  };
  bartlett: {
    valid: boolean;
    chiSquare: number;
    degreesOfFreedom: number;
    pValue: number;
    significant: boolean;
  };
  shapiroWilk: Record<string, {
    wStatistic: number;
    pValue: number;
    significant: boolean;
    normalityAssumption: string;
  }>;
}

/**
 * Comprehensive statistical analysis results from Python engine
 */
export interface ComprehensiveAnalysisResults {
  // Engine metadata
  engineVersion: string;
  advancedStatisticalMethodsCompleted: boolean;
  newMethodsImplemented: number;
  readyForInterpretation: boolean;
  
  // Execution summary
  executionSummary: ExecutionSummary;
  
  // Data quality
  dataQuality: DataQuality;
  
  // Method results by category
  methodResults: {
    maacCoreMethods: Record<string, StatisticalMethodResult>;
    descriptiveStatistics: Record<string, StatisticalMethodResult>;
    correlationalAnalysis: Record<string, StatisticalMethodResult>;
    robustMethods: Record<string, StatisticalMethodResult>;
    advancedStatistics: Record<string, StatisticalMethodResult>;
    distributionAnalysis: Record<string, StatisticalMethodResult>;
    testingProcedures: Record<string, StatisticalMethodResult>;
    specializedAnalyses: Record<string, StatisticalMethodResult>;
  };
  
  // Structured results
  descriptiveStatistics?: DescriptiveStatistics;
  correlationAnalysis?: CorrelationAnalysis;
  effectSizeAnalysis?: EffectSizeAnalysis;
  bootstrapAnalysis?: BootstrapAnalysis;
  factorAnalysis?: FactorAnalysis;
  manovaResults?: ManovaResults;
  mediationAnalysis?: MediationAnalysis;
  reliabilityAnalysis?: ReliabilityAnalysis;
  powerAnalysis?: PowerAnalysis;
  assumptionTesting?: AssumptionTesting;
  
  // MAAC-specific results
  maacDimensionalStatistics?: {
    overallMean: number;
    overallStd: number;
    profileConsistency: number;
    dimensionalStats: Record<MaacDimension, DescriptiveStatistics>;
  };
  
  // Statistical tables
  statisticalTables?: {
    correlationMatrix: number[][];
    factorAnalysis: FactorAnalysis;
    manovaAnalysis: ManovaResults;
  };
  
  // Integration summary
  integrationSummary?: {
    methodsExecuted: Array<{
      method: string;
      methodName: string;
      executed: boolean;
      successful: boolean;
    }>;
    overallValidation: {
      inputDataValid: boolean;
      sampleSizeAdequate: boolean;
      assumptionsMet: boolean;
      numericalStabilityGood: boolean;
    };
    keyFindings: {
      factorStructure: string;
      nineDimensionalValidation: string;
      dataQuality: string;
    };
    academicCredibility: {
      methodsImplemented: number;
      completenessScore: number;
      publicationReadiness: string;
    };
  };
}

// ==================== AGENT INPUT/OUTPUT TYPES ====================

/**
 * Input structure for interpretation agents
 * Matches the Output Parser node structure from n8n workflow
 */
export interface AgentInput {
  session_id: string;
  dimensions_processed: number;
  timestamp: string;
  statistical_analysis_completed: boolean;
  engine_version: string;
  overall_score: number;
  grade_level: 'A' | 'B' | 'C' | 'D' | 'F';
  validation_strength: 'strong' | 'moderate' | 'weak' | 'insufficient';
  deployment_readiness: 'ready' | 'conditional' | 'not_ready';
  
  // Agent-specific data sections
  core_statistics: CoreStatisticsInput;
  advanced_statistics: AdvancedStatisticsInput;
  business_analysis: BusinessAnalysisInput;
  ablation_study: AblationStudyInput;
  cognitive_architecture: CognitiveArchitectureInput;
  experimental_design: ExperimentalDesignInput;
  
  // Comprehensive results for reference
  comprehensive_results: ComprehensiveAnalysisResults;
}

export interface CoreStatisticsInput {
  executive_summary: {
    overall_score: number;
    grade_level: string;
    confidence_level: string;
    percentile_rank: number;
  };
  descriptive_statistics: {
    overall_stats: DescriptiveStatistics;
    dimensional_stats: Record<MaacDimension, DescriptiveStatistics>;
    correlation_summary: CorrelationAnalysis;
  };
  statistical_tests: {
    effect_sizes: EffectSizeAnalysis;
    statistical_tests: Record<string, StatisticalMethodResult>;
  };
  matrix_analysis: {
    correlation_matrix: number[][];
    eigenanalysis: Record<string, unknown>;
  };
  quality_indicators: DataQuality;
}

export interface AdvancedStatisticsInput {
  factor_analysis: FactorAnalysis;
  multivariate_analysis: {
    manova_analysis: ManovaResults;
    multivariate_tests: Record<string, unknown>;
  };
  advanced_methods: {
    bootstrap_analysis: BootstrapAnalysis;
    mediation_analysis: MediationAnalysis;
    reliability_analysis: ReliabilityAnalysis;
  };
  framework_validation: {
    validation_strength: string;
    overall_support: boolean;
  };
  statistical_evidence: {
    significance_tests: Record<string, number>;
    effect_sizes: EffectSizeAnalysis;
    confidence_intervals: Record<string, [number, number]>;
    power_analysis: PowerAnalysis;
  };
}

export interface BusinessAnalysisInput {
  business_domains: {
    analysis_available: boolean;
    domains_identified: number;
    classification_accuracy: string;
    domain_validation: string;
    universal_strengths: string[];
    universal_challenges: string[];
  };
  complexity_tiers: {
    analysis_available: boolean;
    tiers_identified: number;
    progression_validation: string;
    tier_validation: string;
  };
  performance_analysis: {
    overall_score: number;
    dimensional_means: Record<MaacDimension, number>;
    effect_sizes: EffectSizeAnalysis;
    deployment_readiness: string;
  };
  framework_assessment: {
    validation_scores: Record<string, number>;
    quality_indicators: DataQuality;
    recommendations: {
      strengths: string[];
      areasForImprovement: string[];
    };
  };
}

export interface AblationStudyInput {
  experimental_design: {
    total_experiments: number;
    valid_experiments: number;
    configurations_found: number;
    dimensions_analyzed: number;
  };
  pathway_analysis: {
    mediation_analysis: MediationAnalysis;
    correlation_patterns: number[][];
  };
  component_analysis: {
    pca_results: FactorAnalysis['pca'];
    efa_results: FactorAnalysis['efa'];
  };
  effect_analysis: {
    effect_sizes: EffectSizeAnalysis;
    statistical_tests: Record<string, StatisticalMethodResult>;
  };
}

export interface CognitiveArchitectureInput {
  dimensional_structure: {
    dimensional_statistics: Record<MaacDimension, DescriptiveStatistics>;
    correlation_matrix: number[][];
    framework_coherence: number;
  };
  factor_structure: {
    theoretical_model_fit: string;
    factor_loadings: Record<string, number[]>;
    model_fit_indices: Record<string, number>;
  };
  cognitive_patterns: {
    cognitive_load_analysis: DescriptiveStatistics;
    memory_integration: DescriptiveStatistics;
    complexity_handling: DescriptiveStatistics;
    processing_efficiency: DescriptiveStatistics;
  };
  reliability_validation: {
    cronbachs_alpha: number;
    framework_validation: string;
  };
}

export interface ExperimentalDesignInput {
  design_validation: {
    total_experiments: number;
    valid_experiments: number;
    data_quality_score: number;
    statistical_validity: boolean;
  };
  power_analysis: PowerAnalysis;
  framework_validation: {
    overall_validation: string;
    factor_structure_support: boolean;
    multivariate_support: boolean;
  };
  methodological_rigor: {
    methods_executed: number;
    nodes_successful: number;
    advanced_methods_coverage: number;
    publication_readiness: string;
  };
  scoring_validation: {
    validation_available: boolean;
    scoring_quality: string;
    range_compliance: number | null;
    threshold_compliance: number | null;
  };
  design_recommendations: {
    strengths: string[];
    areas_for_improvement: string[];
    immediate_actions: string[];
    long_term_goals: string[];
  };
}

// ==================== AGENT OUTPUT TYPES ====================

/**
 * Core Statistical Interpretation Agent output
 */
export interface CoreStatisticalInterpretation {
  statistical_foundation: {
    sample_adequacy: {
      sample_size: number;
      adequacy_assessment: string;
      power_implications: string;
    };
    descriptive_profile: {
      central_tendency: string;
      variability: string;
      distribution_shape: string;
    };
    normality_assessment: {
      overall_normality: string;
      violations_detected: string[];
      implications: string;
    };
  };
  effect_size_analysis: {
    primary_effect_sizes: EffectSizeAnalysis;
    interpretation: string;
    practical_significance: string;
  };
  bayesian_evidence: {
    bayes_factor_interpretation: string;
    evidence_strength: string;
  };
  framework_validation: {
    nine_dimensional_support: string;
    coherence_score: number;
    structural_validity: string;
  };
  key_findings: string[];
  methodological_notes: string[];
}

/**
 * Advanced Statistical Methods Agent output
 */
export interface AdvancedStatisticalInterpretation {
  factor_structure: {
    pca_interpretation: string;
    efa_interpretation: string;
    cfa_fit_interpretation: string;
    recommended_factor_solution: string;
  };
  mediation_moderation: {
    mediation_findings: string;
    pathway_interpretation: string;
    indirect_effects: string;
  };
  reliability_validity: {
    internal_consistency: string;
    construct_validity: string;
    criterion_validity: string;
  };
  advanced_diagnostics: {
    assumption_violations: string[];
    robustness_checks: string;
    sensitivity_analysis: string;
  };
  key_findings: string[];
  methodological_recommendations: string[];
}

/**
 * Business Scenario Analysis Agent output
 */
export interface BusinessScenarioAnalysis {
  domain_effectiveness: {
    domain_performance: Record<string, {
      score: number;
      interpretation: string;
      business_implications: string;
    }>;
    cross_domain_patterns: string;
  };
  deployment_assessment: {
    readiness_score: number;
    deployment_recommendation: string;
    risk_factors: string[];
    mitigation_strategies: string[];
  };
  roi_projections: {
    efficiency_gains: string;
    quality_improvements: string;
    resource_optimization: string;
  };
  enterprise_recommendations: {
    immediate_actions: string[];
    short_term_goals: string[];
    long_term_strategy: string[];
  };
  key_findings: string[];
  business_risks: string[];
}

/**
 * Ablation Study Interpreter Agent output
 */
export interface AblationStudyInterpretation {
  baseline_characterization: {
    baseline_performance: string;
    variability_assessment: string;
  };
  tool_effectiveness: {
    tool_contributions: Record<string, {
      effect_size: number;
      interpretation: string;
    }>;
    interaction_effects: string;
  };
  configuration_analysis: {
    optimal_configurations: string[];
    configuration_space: string;
    threshold_analysis: string;
  };
  emergent_behavior: {
    synergistic_effects: string;
    compensatory_mechanisms: string;
  };
  key_findings: string[];
  configuration_recommendations: string[];
}

/**
 * Cognitive Architecture Insights Agent output
 */
export interface CognitiveArchitectureInsights {
  dimensional_analysis: {
    dimension_profiles: Record<MaacDimension, {
      mean_score: number;
      interpretation: string;
      cognitive_implications: string;
    }>;
    interdimensional_relationships: string;
  };
  framework_validation: {
    nine_dimensional_support: boolean;
    theoretical_alignment: string;
    construct_coherence: string;
  };
  cognitive_patterns: {
    processing_style: string;
    memory_utilization: string;
    complexity_adaptation: string;
  };
  theoretical_contributions: {
    novel_findings: string[];
    framework_refinements: string[];
    future_research_directions: string[];
  };
  key_findings: string[];
  theoretical_implications: string[];
}

/**
 * Experimental Design Validation Agent output
 */
export interface ExperimentalDesignValidation {
  diversity_assessment: {
    experimental_coverage: string;
    domain_representation: string;
    complexity_distribution: string;
  };
  power_adequacy: {
    achieved_power: number;
    effect_detectability: string;
    sample_size_recommendation: string;
  };
  methodological_rigor: {
    internal_validity: string;
    external_validity: string;
    construct_validity: string;
  };
  publication_readiness: {
    readiness_assessment: string;
    missing_analyses: string[];
    recommended_additions: string[];
  };
  design_improvements: {
    strengths: string[];
    limitations: string[];
    future_recommendations: string[];
  };
  key_findings: string[];
}

// ==================== SYNTHESIZED OUTPUT ====================

/**
 * Complete synthesized analysis output
 */
export interface Tier2AnalysisOutput {
  // Metadata
  batch_id: string;
  analysis_timestamp: string;
  engine_version: string;
  experiments_analyzed: number;
  
  // Executive summary
  executive_summary: {
    overall_score: number;
    grade_level: string;
    validation_strength: string;
    deployment_readiness: string;
    key_findings: string[];
  };
  
  // Raw statistical results
  statistical_results: ComprehensiveAnalysisResults;
  
  // Agent interpretations
  interpretations: {
    core_statistical: CoreStatisticalInterpretation;
    advanced_statistical: AdvancedStatisticalInterpretation;
    business_scenario: BusinessScenarioAnalysis;
    ablation_study: AblationStudyInterpretation;
    cognitive_architecture: CognitiveArchitectureInsights;
    experimental_design: ExperimentalDesignValidation;
  };
  
  // Quality metrics
  quality_metrics: {
    data_completeness: number;
    statistical_validity: boolean;
    publication_readiness: string;
    confidence_level: string;
  };
  
  // Processing metadata
  processing_metadata: {
    processing_time_ms: number;
    methods_executed: number;
    methods_successful: number;
    agents_completed: number;
  };
}

// ==================== ENGINE CONFIGURATION ====================

/**
 * Statistical Analysis Engine configuration
 */
export interface StatisticalAnalysisConfig {
  // Python engine connection
  pythonEngineUrl: string;
  pythonEngineTimeout: number;
  
  // LLM configuration for agents
  llmProvider: 'openai' | 'deepseek' | 'anthropic';
  llmModel: string;
  llmApiKey: string;
  
  // Processing options
  enableParallelAgents: boolean;
  maxConcurrentAgents: number;
  enableCaching: boolean;
  cacheDirectory?: string;
  
  // Batch processing
  tier2Config: Tier2Config;
  
  // Logging
  enableDetailedLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const DEFAULT_ENGINE_CONFIG: Partial<StatisticalAnalysisConfig> = {
  pythonEngineUrl: 'http://maac-stat-engine:8000',
  pythonEngineTimeout: 300000,
  llmProvider: 'deepseek',
  enableParallelAgents: true,
  maxConcurrentAgents: 6,
  enableCaching: true,
  tier2Config: DEFAULT_TIER2_CONFIG,
  enableDetailedLogging: true,
  logLevel: 'info'
};
