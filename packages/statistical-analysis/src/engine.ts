/**
 * Statistical Analysis Engine
 * Extracted from: MAAC - Tier 2 - Dataset-Level Advanced Analysis-Python.json
 *
 * Enhanced orchestrator for Tier 2 statistical analysis pipeline with:
 * - Direct Prisma database integration
 * - Advanced statistical methods (correlation, factor analysis, MANOVA)
 * - Specialized multi-agent interpretation
 * - Publication-ready reporting
 */

// Note: Using 'any' for LLM model type to avoid AI SDK version conflicts
// The actual model is created at runtime from the configured provider

import {
  ExperimentData,
  ComprehensiveAnalysisResults,
  AgentInput,
  Tier2AnalysisOutput,
  StatisticalAnalysisConfig,
  DEFAULT_ENGINE_CONFIG,
  DEFAULT_TIER2_CONFIG,
  MAAC_DIMENSIONS,
  MaacDimension,
} from './types.js';
import { PythonEngineClient } from './python-engine-client.js';
import {
  validateExperimentData,
  groupByDomain,
  groupByTier,
  extractDimensionalData,
} from './data-preparation.js';
import { AgentExecutor, AgentResults } from './agents/index.js';

// ==================== ENHANCED TYPES ====================

export interface StatisticalResults {
  coreStatistics: CoreStats;
  advancedStatistics: AdvancedStats;
  businessAnalysis: BusinessAnalysis;
  cognitiveArchitecture: CognitiveAnalysis;
  experimentalDesign: DesignValidation;
  synthesisResults: Synthesis;
}

interface CoreStats {
  descriptiveStatistics: {
    meanScores: Record<string, number>;
    standardDeviations: Record<string, number>;
    ranges: Record<string, { min: number; max: number }>;
    correlationMatrix: number[][];
  };
  inferentialStatistics: {
    tTests: any[];
    anovaResults: any[];
    confidenceIntervals: any[];
  };
}

interface AdvancedStats {
  reliabilityAnalysis: {
    cronbachsAlpha: number;
    itemTotalCorrelations: Record<string, number>;
  };
  factorAnalysis: {
    eigenvalues: number[];
    factorLoadings: number[][];
    varianceExplained: number[];
  };
  multivariateAnalysis: {
    manova: any;
    discriminantAnalysis: any;
  };
}

type BusinessAnalysis = any;
type CognitiveAnalysis = any;
type DesignValidation = any;
type Synthesis = any;

// ==================== ENGINE CLASS ====================

/**
 * Enhanced StatisticalAnalysisEngine - Tier 2 analysis with database integration
 *
 * Enhanced Pipeline:
 * 1. Load experiment data directly from Prisma database
 * 2. Compute core and advanced statistics (correlations, factor analysis)
 * 3. Execute 4 specialized interpretation agents
 * 4. Synthesize findings with cross-perspective validation
 * 5. Return publication-ready results
 */
export class StatisticalAnalysisEngine {
  private readonly config: StatisticalAnalysisConfig;
  private readonly pythonClient: PythonEngineClient;
  private agentExecutor?: AgentExecutor;
  private db?: any;
  private llmModelInstance?: any; // LLM model instance, created at runtime

  constructor(config: Partial<StatisticalAnalysisConfig>, database?: any) {
    // Merge with defaults
    this.config = {
      pythonEngineUrl: config.pythonEngineUrl || DEFAULT_ENGINE_CONFIG.pythonEngineUrl!,
      pythonEngineTimeout: config.pythonEngineTimeout || DEFAULT_ENGINE_CONFIG.pythonEngineTimeout!,
      llmProvider: config.llmProvider || DEFAULT_ENGINE_CONFIG.llmProvider!,
      llmModel: config.llmModel || 'deepseek-chat',
      llmApiKey: config.llmApiKey || '',
      llmModelInstance: config.llmModelInstance,
      enableParallelAgents:
        config.enableParallelAgents ?? DEFAULT_ENGINE_CONFIG.enableParallelAgents!,
      maxConcurrentAgents: config.maxConcurrentAgents || DEFAULT_ENGINE_CONFIG.maxConcurrentAgents!,
      enableCaching: config.enableCaching ?? DEFAULT_ENGINE_CONFIG.enableCaching!,
      cacheDirectory: config.cacheDirectory,
      tier2Config: { ...DEFAULT_TIER2_CONFIG, ...config.tier2Config },
      enableDetailedLogging:
        config.enableDetailedLogging ?? DEFAULT_ENGINE_CONFIG.enableDetailedLogging!,
      logLevel: config.logLevel || DEFAULT_ENGINE_CONFIG.logLevel!,
    };

    // Initialize database connection
    this.db = database;

    // Initialize Python engine client
    this.pythonClient = new PythonEngineClient(this.config);

    // Initialize agent executor if LLM key provided
    if (this.config.llmApiKey) {
      this.agentExecutor = AgentExecutor.fromConfig(this.config);
    }
  }

  /**
   * Get the LLM model instance for AI calls
   * Creates model from provider config if not already instantiated
   */
  private async getModel(): Promise<any> {
    // Return pre-configured instance if available
    if (this.llmModelInstance) {
      return this.llmModelInstance;
    }
    if (this.config.llmModelInstance) {
      return this.config.llmModelInstance;
    }

    // Create model based on provider
    const { llmProvider, llmModel } = this.config;

    switch (llmProvider) {
      case 'openai': {
        const { createOpenAI } = await import('@ai-sdk/openai');
        const openai = createOpenAI({ apiKey: this.config.llmApiKey });
        this.llmModelInstance = openai(llmModel);
        return this.llmModelInstance;
      }
      case 'anthropic': {
        const { createAnthropic } = await import('@ai-sdk/anthropic');
        const anthropic = createAnthropic({ apiKey: this.config.llmApiKey });
        this.llmModelInstance = anthropic(llmModel);
        return this.llmModelInstance;
      }
      case 'deepseek':
      default: {
        // DeepSeek uses OpenAI-compatible API
        const { createOpenAI } = await import('@ai-sdk/openai');
        const deepseek = createOpenAI({
          apiKey: this.config.llmApiKey,
          baseURL: 'https://api.deepseek.com/v1',
        });
        this.llmModelInstance = deepseek(llmModel);
        return this.llmModelInstance;
      }
    }
  }

  /**
   * Log a message if detailed logging is enabled
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.enableDetailedLogging) return;
    if (level === 'error' && this.config.logLevel === 'error') return;
    if (level === 'warn' && ['error'].includes(this.config.logLevel)) return;
    if (level === 'info' && ['error', 'warn'].includes(this.config.logLevel)) return;

    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📊';
    console.log(`${emoji} [StatisticalAnalysisEngine] ${message}`);
  }

  /**
   * Check Python engine availability
   */
  async checkEngineHealth(): Promise<boolean> {
    return this.pythonClient.healthCheck();
  }

  /**
   * Run complete Tier 2 statistical analysis pipeline
   */
  async analyze(experiments: ExperimentData[], batchId?: string): Promise<Tier2AnalysisOutput> {
    // Maintain backward compatibility with existing method
    const startTime = Date.now();
    const sessionId = batchId || `tier2_${Date.now()}`;

    this.log(`Starting Tier 2 analysis: ${experiments.length} experiments, session ${sessionId}`);

    // Step 1: Validate experiment data
    const validation = validateExperimentData(experiments);
    if (!validation.valid) {
      throw new Error(`Invalid experiment data: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((w) => this.log(w, 'warn'));
    }

    this.log(
      `Data validation passed: ${validation.summary.validExperiments}/${validation.summary.totalExperiments} valid`,
    );

    // Step 2: Run statistical analysis via Python engine
    const {
      results: statisticalResults,
      mode,
      duration: statDuration,
    } = await this.pythonClient.runAnalysisWithFallback(experiments, sessionId);

    this.log(`Statistical analysis completed via ${mode} endpoint in ${statDuration}ms`);

    // Step 3: Transform to agent input format
    const agentInput = this.transformToAgentInput(experiments, statisticalResults, sessionId);

    // Step 4: Execute interpretation agents (if LLM configured)
    let interpretations: Tier2AnalysisOutput['interpretations'] | null = null;
    let agentSummary = { successful: 0, failed: 6, totalTimeMs: 0, totalTokens: 0 };

    if (this.agentExecutor) {
      this.log('Executing interpretation agents...');
      const agentResults = await this.agentExecutor.executeAllAgents(
        agentInput,
        this.config.maxConcurrentAgents,
      );

      interpretations = this.mapAgentResults(agentResults.results);
      agentSummary = agentResults.summary;

      this.log(
        `Agents completed: ${agentSummary.successful}/${agentSummary.successful + agentSummary.failed} successful`,
      );
    } else {
      this.log('No LLM configured, skipping interpretation agents', 'warn');
      interpretations = this.createEmptyInterpretations();
    }

    // Step 5: Build final output
    const totalTimeMs = Date.now() - startTime;

    const output: Tier2AnalysisOutput = {
      batch_id: sessionId,
      analysis_timestamp: new Date().toISOString(),
      engine_version: statisticalResults.engineVersion,
      experiments_analyzed: experiments.length,

      executive_summary: this.buildExecutiveSummary(statisticalResults, interpretations),
      statistical_results: statisticalResults,
      interpretations,

      quality_metrics: {
        data_completeness: statisticalResults.dataQuality?.completenessRate || 0,
        statistical_validity: (statisticalResults.executionSummary?.successRate || 0) > 75,
        publication_readiness:
          statisticalResults.integrationSummary?.academicCredibility?.publicationReadiness ||
          'needs_improvement',
        confidence_level: this.determineConfidenceLevel(statisticalResults),
      },

      processing_metadata: {
        processing_time_ms: totalTimeMs,
        methods_executed: statisticalResults.executionSummary?.totalMethodsAttempted || 0,
        methods_successful: statisticalResults.executionSummary?.successfulMethods || 0,
        agents_completed: agentSummary.successful,
      },
    };

    this.log(`Tier 2 analysis completed in ${totalTimeMs}ms`);
    return output;
  }

  /**
   * Enhanced database-driven analysis with advanced statistical methods
   */
  async analyzeDataset(experimentId: string): Promise<StatisticalResults> {
    if (!this.db) {
      throw new Error('Database connection required for analyzeDataset method');
    }

    console.log('[Stats Engine] Starting dataset analysis');

    // Load experimental data from database
    const data = await this.loadExperimentData(experimentId);
    console.log(`[Stats Engine] Loaded ${data.length} trials`);

    // Phase 1: Core statistics with enhanced methods
    const coreStats = await this.computeCoreStatistics(data);
    console.log('[Stats Engine] Core statistics complete');

    // Phase 2: Advanced statistical methods
    const advancedStats = await this.computeAdvancedStatistics(data);
    console.log('[Stats Engine] Advanced statistics complete');

    // Phase 3: Multi-agent interpretation with specialized roles
    const businessAnalysis = await this.analyzeBusinessContext(coreStats, advancedStats, data);
    const cognitiveAnalysis = await this.analyzeCognitiveArchitecture(
      coreStats,
      advancedStats,
      data,
    );
    const designValidation = await this.validateExperimentalDesign(coreStats, advancedStats, data);
    const synthesis = await this.synthesizeFindings(
      coreStats,
      advancedStats,
      businessAnalysis,
      cognitiveAnalysis,
      designValidation,
    );

    console.log('[Stats Engine] Multi-agent analysis complete');

    return {
      coreStatistics: coreStats,
      advancedStatistics: advancedStats,
      businessAnalysis,
      cognitiveArchitecture: cognitiveAnalysis,
      experimentalDesign: designValidation,
      synthesisResults: synthesis,
    };
  }

  /**
   * Run statistical analysis only (no agent interpretation)
   */
  async analyzeStatisticsOnly(
    experiments: ExperimentData[],
    sessionId?: string,
  ): Promise<ComprehensiveAnalysisResults> {
    const id = sessionId || `stats_${Date.now()}`;

    this.log(`Running statistics-only analysis: ${experiments.length} experiments`);

    const validation = validateExperimentData(experiments);
    if (!validation.valid) {
      throw new Error(`Invalid experiment data: ${validation.errors.join(', ')}`);
    }

    const { results, mode, duration } = await this.pythonClient.runAnalysisWithFallback(
      experiments,
      id,
    );

    this.log(`Statistics completed via ${mode} in ${duration}ms`);
    return results;
  }

  /**
   * Transform statistical results to agent input format
   * Extracted from Output Parser node in n8n workflow
   */
  private transformToAgentInput(
    experiments: ExperimentData[],
    results: ComprehensiveAnalysisResults,
    sessionId: string,
  ): AgentInput {
    const dimensionalData = extractDimensionalData(experiments);
    const domainGroups = groupByDomain(experiments);
    const tierGroups = groupByTier(experiments);

    // Calculate overall score and grade
    const successRate = results.executionSummary?.successRate || 0;
    const overallScore = Math.round(successRate * 0.89);
    const gradeLevel =
      successRate >= 90
        ? 'A'
        : successRate >= 80
          ? 'B'
          : successRate >= 70
            ? 'C'
            : successRate >= 60
              ? 'D'
              : 'F';

    // Extract reliability from results
    const cronbachResult = results.methodResults?.specializedAnalyses?.cronbach_alpha?.result as
      | { alpha?: number; interpretation?: string }
      | undefined;
    const alpha = cronbachResult?.alpha || 0;

    const validationStrength =
      alpha >= 0.8 ? 'strong' : alpha >= 0.6 ? 'moderate' : alpha >= 0.4 ? 'weak' : 'insufficient';

    const deploymentReadiness =
      successRate >= 80 && alpha >= 0.7 ? 'ready' : successRate >= 60 ? 'conditional' : 'not_ready';

    // Build dimensional statistics
    const dimensionalStats: Record<MaacDimension, { mean: number; std: number }> = {} as Record<
      MaacDimension,
      { mean: number; std: number }
    >;

    for (const dim of MAAC_DIMENSIONS) {
      const values = dimensionalData[dim] || [];
      const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
      const variance =
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length || 1);
      dimensionalStats[dim] = { mean, std: Math.sqrt(variance) };
    }

    return {
      session_id: sessionId,
      dimensions_processed: MAAC_DIMENSIONS.length,
      timestamp: new Date().toISOString(),
      statistical_analysis_completed: true,
      engine_version: results.engineVersion,
      overall_score: overallScore,
      grade_level: gradeLevel as AgentInput['grade_level'],
      validation_strength: validationStrength as AgentInput['validation_strength'],
      deployment_readiness: deploymentReadiness as AgentInput['deployment_readiness'],

      core_statistics: {
        executive_summary: {
          overall_score: overallScore,
          grade_level: gradeLevel,
          confidence_level: validationStrength,
          percentile_rank: Math.round(successRate),
        },
        descriptive_statistics: {
          overall_stats: this.extractDescriptiveStats(results),
          dimensional_stats: dimensionalStats as any,
          correlation_summary: this.extractCorrelationSummary(results),
        },
        statistical_tests: {
          effect_sizes: this.extractEffectSizes(results),
          statistical_tests: results.methodResults?.testingProcedures || {},
        },
        matrix_analysis: {
          correlation_matrix: results.statisticalTables?.correlationMatrix || [],
          eigenanalysis: {},
        },
        quality_indicators: results.dataQuality || {
          methodCoverage: { successful: 0, total: 0 },
          completenessRate: 0,
          varianceAdequacy: '',
        },
      },

      advanced_statistics: {
        factor_analysis: results.factorAnalysis || {
          pca: {
            valid: false,
            eigenvalues: [],
            componentLoadings: [],
            explainedVarianceRatio: [],
            cumulativeVariance: 0,
            significantComponents: 0,
          },
          efa: {
            valid: false,
            loadings: [],
            communalities: [],
            uniqueness: [],
            nFactors: 0,
            rotation: '',
            converged: false,
          },
          cfa: {
            valid: false,
            goodnessOfFit: { cfi: 0, tli: 0, rmsea: 0, srmr: 0, fitInterpretation: '' },
            standardizedLoadings: {},
          },
        },
        multivariate_analysis: {
          manova_analysis: results.manovaResults || {
            valid: false,
            wilksLambda: null,
            pillaiTrace: null,
            hotellingT2: null,
            roysLargestRoot: null,
            pValue: null,
            significant: false,
            effectSize: null,
          },
          multivariate_tests: {},
        },
        advanced_methods: {
          bootstrap_analysis: results.bootstrapAnalysis || {
            mean: 0,
            confidenceInterval: [0, 0],
            standardError: 0,
            bias: 0,
            nIterations: 0,
          },
          mediation_analysis: results.mediationAnalysis || {
            valid: false,
            mediationDetected: false,
            mediationType: 'no_mediation',
            pathCoefficients: { pathA: 0, pathB: 0, pathC: 0, pathCPrime: 0 },
            effects: { directEffect: 0, indirectEffect: 0, totalEffect: 0, proportionMediated: 0 },
            sobel: { zStatistic: 0, pValue: 0, significant: false },
          },
          reliability_analysis: results.reliabilityAnalysis || {
            cronbachsAlpha: 0,
            alphaInterpretation: 'unacceptable',
            confidenceInterval: [0, 0],
            splitHalf: 0,
            guttmanLambda6: 0,
            itemTotalCorrelations: [],
          },
        },
        framework_validation: {
          validation_strength: validationStrength,
          overall_support: alpha >= 0.7 && successRate >= 75,
        },
        statistical_evidence: {
          significance_tests: {},
          effect_sizes: this.extractEffectSizes(results),
          confidence_intervals: {},
          power_analysis: results.powerAnalysis || {
            statisticalPower: 0,
            effectSize: 0,
            sampleSize: experiments.length,
            criticalValue: 0,
            powerInterpretation: 'insufficient',
            recommendedSampleSize: 0,
          },
        },
      },

      business_analysis: {
        business_domains: {
          analysis_available: domainGroups.length > 1,
          domains_identified: domainGroups.length,
          classification_accuracy: 'not_performed',
          domain_validation: 'not_performed',
          universal_strengths: [],
          universal_challenges: [],
        },
        complexity_tiers: {
          analysis_available: tierGroups.length > 1,
          tiers_identified: tierGroups.length,
          progression_validation: 'not_performed',
          tier_validation: 'not_performed',
        },
        performance_analysis: {
          overall_score: overallScore,
          dimensional_means: Object.fromEntries(
            MAAC_DIMENSIONS.map((d) => [d, dimensionalStats[d]?.mean || 0]),
          ) as Record<MaacDimension, number>,
          effect_sizes: this.extractEffectSizes(results),
          deployment_readiness: deploymentReadiness,
        },
        framework_assessment: {
          validation_scores: {
            reliability: alpha,
            validity: successRate / 100,
            success_rate: successRate / 100,
          },
          quality_indicators: results.dataQuality || {
            methodCoverage: { successful: 0, total: 0 },
            completenessRate: 0,
            varianceAdequacy: '',
          },
          recommendations: {
            strengths:
              alpha >= 0.8 ? [`Excellent reliability achieved (α=${alpha.toFixed(3)})`] : [],
            areasForImprovement: alpha < 0.7 ? ['Improve internal consistency reliability'] : [],
          },
        },
      },

      ablation_study: {
        experimental_design: {
          total_experiments: experiments.length,
          valid_experiments: experiments.length,
          configurations_found: [...new Set(experiments.map((e) => e.config_id))].length,
          dimensions_analyzed: MAAC_DIMENSIONS.length,
        },
        pathway_analysis: {
          mediation_analysis: results.mediationAnalysis || {
            valid: false,
            mediationDetected: false,
            mediationType: 'no_mediation',
            pathCoefficients: { pathA: 0, pathB: 0, pathC: 0, pathCPrime: 0 },
            effects: { directEffect: 0, indirectEffect: 0, totalEffect: 0, proportionMediated: 0 },
            sobel: { zStatistic: 0, pValue: 0, significant: false },
          },
          correlation_patterns: results.statisticalTables?.correlationMatrix || [],
        },
        component_analysis: {
          pca_results: results.factorAnalysis?.pca || {
            valid: false,
            eigenvalues: [],
            componentLoadings: [],
            explainedVarianceRatio: [],
            cumulativeVariance: 0,
            significantComponents: 0,
          },
          efa_results: results.factorAnalysis?.efa || {
            valid: false,
            loadings: [],
            communalities: [],
            uniqueness: [],
            nFactors: 0,
            rotation: '',
            converged: false,
          },
        },
        effect_analysis: {
          effect_sizes: this.extractEffectSizes(results),
          statistical_tests: results.methodResults?.testingProcedures || {},
        },
      },

      cognitive_architecture: {
        dimensional_structure: {
          dimensional_statistics: dimensionalStats as any,
          correlation_matrix: results.statisticalTables?.correlationMatrix || [],
          framework_coherence: alpha,
        },
        factor_structure: {
          theoretical_model_fit:
            results.factorAnalysis?.cfa?.goodnessOfFit?.fitInterpretation || 'not_assessed',
          factor_loadings: {},
          model_fit_indices: {
            cfi: results.factorAnalysis?.cfa?.goodnessOfFit?.cfi || 0,
            rmsea: results.factorAnalysis?.cfa?.goodnessOfFit?.rmsea || 0,
            srmr: results.factorAnalysis?.cfa?.goodnessOfFit?.srmr || 0,
          },
        },
        cognitive_patterns: {
          cognitive_load_analysis: dimensionalStats.maac_cognitive_load as any,
          memory_integration: dimensionalStats.maac_memory_integration as any,
          complexity_handling: dimensionalStats.maac_complexity_handling as any,
          processing_efficiency: dimensionalStats.maac_processing_efficiency as any,
        },
        reliability_validation: {
          cronbachs_alpha: alpha,
          framework_validation: validationStrength,
        },
      },

      experimental_design: {
        design_validation: {
          total_experiments: experiments.length,
          valid_experiments: experiments.length,
          data_quality_score: results.dataQuality?.completenessRate || 0,
          statistical_validity: successRate >= 75,
        },
        power_analysis: results.powerAnalysis || {
          statisticalPower: 0,
          effectSize: 0,
          sampleSize: experiments.length,
          criticalValue: 0,
          powerInterpretation: 'insufficient',
          recommendedSampleSize: 0,
        },
        framework_validation: {
          overall_validation: validationStrength,
          factor_structure_support: results.factorAnalysis?.pca?.valid || false,
          multivariate_support: results.manovaResults?.valid || false,
        },
        methodological_rigor: {
          methods_executed: results.executionSummary?.totalMethodsAttempted || 0,
          nodes_successful: results.executionSummary?.successfulMethods || 0,
          advanced_methods_coverage:
            results.integrationSummary?.academicCredibility?.completenessScore || 0,
          publication_readiness:
            results.integrationSummary?.academicCredibility?.publicationReadiness ||
            'needs_improvement',
        },
        scoring_validation: {
          validation_available: true,
          scoring_quality: validationStrength,
          range_compliance: null,
          threshold_compliance: null,
        },
        design_recommendations: {
          strengths: [],
          areas_for_improvement: [],
          immediate_actions: [],
          long_term_goals: [],
        },
      },

      comprehensive_results: results,
    };
  }

  /**
   * Extract descriptive statistics from results
   */
  private extractDescriptiveStats(
    results: ComprehensiveAnalysisResults,
  ): AgentInput['core_statistics']['descriptive_statistics']['overall_stats'] {
    const desc = results.methodResults?.descriptiveStatistics || {};
    return {
      mean: (desc.mean?.result as { mean?: number })?.mean || 0,
      median: (desc.median?.result as { median?: number })?.median || 0,
      std: (desc.std?.result as { std?: number })?.std || 0,
      variance: (desc.var?.result as { var?: number })?.var || 0,
      min: (desc.minimum?.result as { minimum?: number })?.minimum || 0,
      max: (desc.maximum?.result as { maximum?: number })?.maximum || 0,
      skewness: (desc.skew?.result as { skewness?: number })?.skewness || 0,
      kurtosis: (desc.kurtosis?.result as { kurtosis?: number })?.kurtosis || 0,
      iqr: (desc.iqr?.result as { iqr?: number })?.iqr || 0,
      confidenceInterval95: [0, 0],
    };
  }

  /**
   * Extract correlation summary from results
   */
  private extractCorrelationSummary(
    results: ComprehensiveAnalysisResults,
  ): AgentInput['core_statistics']['descriptive_statistics']['correlation_summary'] {
    const corr = results.methodResults?.correlationalAnalysis || {};
    const pearsonResult = corr.pearson?.result as { r?: number; p?: number } | undefined;
    const spearmanResult = corr.spearman?.result as { rho?: number; p?: number } | undefined;
    const kendallResult = corr.kendall?.result as { tau?: number; p?: number } | undefined;

    return {
      pearson: {
        r: pearsonResult?.r || 0,
        p: pearsonResult?.p || 1,
        significant: (pearsonResult?.p || 1) < 0.05,
      },
      spearman: {
        rho: spearmanResult?.rho || 0,
        p: spearmanResult?.p || 1,
      },
      kendall: {
        tau: kendallResult?.tau || 0,
        p: kendallResult?.p || 1,
      },
      correlationMatrix: results.statisticalTables?.correlationMatrix || [],
    };
  }

  /**
   * Extract effect sizes from results
   */
  private extractEffectSizes(
    results: ComprehensiveAnalysisResults,
  ): AgentInput['core_statistics']['statistical_tests']['effect_sizes'] {
    const spec = results.methodResults?.specializedAnalyses || {};
    const cohensResult = spec.cohens_d?.result as
      | { cohens_d?: number; interpretation?: string }
      | undefined;
    const hedgesResult = spec.hedges_g?.result as { hedges_g?: number } | undefined;
    const glassResult = spec.glass_delta?.result as { glass_delta?: number } | undefined;

    const cohensD = cohensResult?.cohens_d || 0;

    return {
      cohensD,
      hedgesG: hedgesResult?.hedges_g || 0,
      glassDelta: glassResult?.glass_delta || 0,
      etaSquared: 0,
      omegaSquared: 0,
      interpretation: (Math.abs(cohensD) < 0.2
        ? 'negligible'
        : Math.abs(cohensD) < 0.5
          ? 'small'
          : Math.abs(cohensD) < 0.8
            ? 'medium'
            : 'large') as 'negligible' | 'small' | 'medium' | 'large',
    };
  }

  /**
   * Map agent results to interpretation structure
   */
  private mapAgentResults(results: Partial<AgentResults>): Tier2AnalysisOutput['interpretations'] {
    return {
      core_statistical:
        results.coreStatistical || this.createEmptyInterpretation('coreStatistical'),
      advanced_statistical:
        results.advancedStatistical || this.createEmptyInterpretation('advancedStatistical'),
      business_scenario:
        results.businessScenario || this.createEmptyInterpretation('businessScenario'),
      ablation_study: results.ablationStudy || this.createEmptyInterpretation('ablationStudy'),
      cognitive_architecture:
        results.cognitiveArchitecture || this.createEmptyInterpretation('cognitiveArchitecture'),
      experimental_design:
        results.experimentalDesign || this.createEmptyInterpretation('experimentalDesign'),
    };
  }

  /**
   * Create empty interpretations when no LLM is configured
   */
  private createEmptyInterpretations(): Tier2AnalysisOutput['interpretations'] {
    return {
      core_statistical: this.createEmptyInterpretation('coreStatistical'),
      advanced_statistical: this.createEmptyInterpretation('advancedStatistical'),
      business_scenario: this.createEmptyInterpretation('businessScenario'),
      ablation_study: this.createEmptyInterpretation('ablationStudy'),
      cognitive_architecture: this.createEmptyInterpretation('cognitiveArchitecture'),
      experimental_design: this.createEmptyInterpretation('experimentalDesign'),
    };
  }

  /**
   * Create empty interpretation for a specific agent type
   */
  private createEmptyInterpretation(type: string): any {
    return {
      agent_not_executed: true,
      reason: 'LLM API key not configured',
      type,
    };
  }

  /**
   * Build executive summary from results
   */
  private buildExecutiveSummary(
    results: ComprehensiveAnalysisResults,
    _interpretations: Tier2AnalysisOutput['interpretations'],
  ): Tier2AnalysisOutput['executive_summary'] {
    const successRate = results.executionSummary?.successRate || 0;
    const overallScore = Math.round(successRate * 0.89);

    return {
      overall_score: overallScore,
      grade_level:
        successRate >= 90
          ? 'A'
          : successRate >= 80
            ? 'B'
            : successRate >= 70
              ? 'C'
              : successRate >= 60
                ? 'D'
                : 'F',
      validation_strength:
        successRate >= 80
          ? 'strong'
          : successRate >= 60
            ? 'moderate'
            : successRate >= 40
              ? 'weak'
              : 'insufficient',
      deployment_readiness: successRate >= 75 ? 'ready' : 'conditional',
      key_findings: results.integrationSummary?.keyFindings
        ? Object.values(results.integrationSummary.keyFindings)
        : [],
    };
  }

  /**
   * Determine confidence level based on results
   */
  private determineConfidenceLevel(results: ComprehensiveAnalysisResults): string {
    const successRate = results.executionSummary?.successRate || 0;
    const cronbachResult = results.methodResults?.specializedAnalyses?.cronbach_alpha?.result as
      | { alpha?: number }
      | undefined;
    const alpha = cronbachResult?.alpha || 0;

    if (successRate >= 80 && alpha >= 0.8) return 'high';
    if (successRate >= 60 && alpha >= 0.6) return 'medium';
    return 'low';
  }

  // ==================== ENHANCED STATISTICAL METHODS ====================

  /**
   * Load experiment data directly from Prisma database
   */
  private async loadExperimentData(experimentId: string) {
    if (!this.db) {
      throw new Error('Database connection required for loadExperimentData');
    }

    return this.db.mAACExperimentalData.findMany({
      where: {
        experimentId,
        maacCompleted: true,
      },
      select: {
        trialId: true,
        domain: true,
        tier: true,
        modelId: true,
        configId: true,
        maacCognitiveLoad: true,
        maacToolExecution: true,
        maacContentQuality: true,
        maacMemoryIntegration: true,
        maacComplexityHandling: true,
        maacHallucinationControl: true,
        maacKnowledgeTransfer: true,
        maacProcessingEfficiency: true,
        maacConstructValidity: true,
        maacOverallScore: true,
        maacConfidence: true,
        processingTime: true,
        wordCount: true,
        toolsInvokedCount: true,
      },
    });
  }

  /**
   * Compute enhanced core statistics with correlation matrix
   */
  private async computeCoreStatistics(data: any[]): Promise<CoreStats> {
    const dimensions = [
      'maacCognitiveLoad',
      'maacToolExecution',
      'maacContentQuality',
      'maacMemoryIntegration',
      'maacComplexityHandling',
      'maacHallucinationControl',
      'maacKnowledgeTransfer',
      'maacProcessingEfficiency',
      'maacConstructValidity',
      'maacOverallScore',
    ];

    const meanScores: Record<string, number> = {};
    const standardDeviations: Record<string, number> = {};
    const ranges: Record<string, { min: number; max: number }> = {};

    for (const dim of dimensions) {
      const values = data.map((d) => Number(d[dim])).filter((v) => !isNaN(v));

      // Mean
      meanScores[dim] = values.reduce((a, b) => a + b, 0) / values.length;

      // Standard deviation
      const mean = meanScores[dim];
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      standardDeviations[dim] = Math.sqrt(variance);

      // Range
      ranges[dim] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }

    // Enhanced correlation matrix
    const correlationMatrix = this.computeCorrelationMatrix(data, dimensions);

    return {
      descriptiveStatistics: {
        meanScores,
        standardDeviations,
        ranges,
        correlationMatrix,
      },
      inferentialStatistics: {
        tTests: [], // Placeholder for future t-test implementation
        anovaResults: [], // Placeholder for ANOVA
        confidenceIntervals: [], // Placeholder for confidence intervals
      },
    };
  }

  /**
   * Enhanced correlation matrix computation
   */
  private computeCorrelationMatrix(data: any[], dimensions: string[]): number[][] {
    const n = dimensions.length;
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const valuesX = data.map((d) => Number(d[dimensions[i]])).filter((v) => !isNaN(v));
          const valuesY = data.map((d) => Number(d[dimensions[j]])).filter((v) => !isNaN(v));
          matrix[i][j] = this.pearsonCorrelation(valuesX, valuesY);
        }
      }
    }

    return matrix;
  }

  /**
   * Pearson correlation coefficient calculation
   */
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }

    return numerator / Math.sqrt(denomX * denomY);
  }

  /**
   * Advanced statistical methods (placeholders for integration with Python engine)
   */
  private async computeAdvancedStatistics(_data: any[]): Promise<AdvancedStats> {
    // Note: These would typically call the Python engine for advanced calculations
    return {
      reliabilityAnalysis: {
        cronbachsAlpha: 0.0, // Low alpha expected for formative model
        itemTotalCorrelations: {},
      },
      factorAnalysis: {
        eigenvalues: [],
        factorLoadings: [],
        varianceExplained: [],
      },
      multivariateAnalysis: {
        manova: null,
        discriminantAnalysis: null,
      },
    };
  }

  /**
   * Agent 1: Enhanced Business Context Analysis
   */
  private async analyzeBusinessContext(
    coreStats: CoreStats,
    _advancedStats: AdvancedStats,
    data: any[],
  ): Promise<BusinessAnalysis> {
    if (!this.agentExecutor) {
      return { key_insights: [], business_implications: {}, recommendations: [], risk_factors: [] };
    }

    // Use dynamic import for optional AI dependency
    try {
      const { generateText } = await import('ai');

      const prompt = `You are a business intelligence analyst. Analyze these experimental results from a business perspective.

CORE STATISTICS:
${JSON.stringify(coreStats.descriptiveStatistics, null, 2)}

SAMPLE SIZE: ${data.length} trials

TASK:
1. Identify business-relevant patterns
2. Assess practical significance (not just statistical)  
3. Provide actionable insights for decision-makers
4. Consider cost-benefit implications

Output JSON with:
- key_insights: Array of main findings
- business_implications: Practical impacts
- recommendations: Specific actions
- risk_factors: Potential concerns`;

      const model = await this.getModel();
      const result = await generateText({
        model,
        prompt,
        temperature: 0.5,
      });

      try {
        return JSON.parse(result.text);
      } catch (parseError) {
        return {
          key_insights: [result.text],
          business_implications: {},
          recommendations: [],
          risk_factors: [],
        };
      }
    } catch (aiError) {
      return {
        key_insights: ['AI module not available'],
        business_implications: {},
        recommendations: [],
        risk_factors: [],
      };
    }
  }

  /**
   * Agent 2: Enhanced Cognitive Architecture Analysis
   */
  private async analyzeCognitiveArchitecture(
    coreStats: CoreStats,
    _advancedStats: AdvancedStats,
    _data: any[],
  ): Promise<CognitiveAnalysis> {
    if (!this.agentExecutor) {
      return {
        cognitive_patterns: [],
        dimensional_interactions: {},
        architecture_assessment: {},
        theoretical_implications: [],
      };
    }

    try {
      const { generateText } = await import('ai');

      const prompt = `You are a cognitive science researcher. Analyze these results from a cognitive architecture perspective.

DIMENSIONAL SCORES:
${JSON.stringify(coreStats.descriptiveStatistics.meanScores, null, 2)}

CORRELATIONS:
${JSON.stringify(coreStats.descriptiveStatistics.correlationMatrix, null, 2)}

TASK:
1. Assess cognitive system performance patterns
2. Identify dimensional relationships
3. Evaluate cognitive load distribution
4. Compare to theoretical baselines

Output JSON with:
- cognitive_patterns: Observable patterns
- dimensional_interactions: How dimensions relate
- architecture_assessment: Overall evaluation
- theoretical_implications: Research insights`;

      const model = await this.getModel();
      const result = await generateText({
        model,
        prompt,
        temperature: 0.5,
      });

      try {
        return JSON.parse(result.text);
      } catch (e) {
        return {
          cognitive_patterns: [result.text],
          dimensional_interactions: {},
          architecture_assessment: {},
          theoretical_implications: [],
        };
      }
    } catch (e) {
      return {
        cognitive_patterns: ['AI module not available'],
        dimensional_interactions: {},
        architecture_assessment: {},
        theoretical_implications: [],
      };
    }
  }

  /**
   * Agent 3: Enhanced Experimental Design Validation
   */
  private async validateExperimentalDesign(
    coreStats: CoreStats,
    _advancedStats: AdvancedStats,
    data: any[],
  ): Promise<DesignValidation> {
    if (!this.agentExecutor) {
      return {
        design_validity: {},
        data_quality: {},
        potential_confounds: [],
        recommendations: [],
      };
    }

    try {
      const { generateText } = await import('ai');

      const prompt = `You are a research methodologist. Validate the experimental design and data quality.

SAMPLE CHARACTERISTICS:
- Total trials: ${data.length}
- Domains: ${new Set(data.map((d) => d.domain)).size}
- Tiers: ${new Set(data.map((d) => d.tier)).size}
- Models: ${new Set(data.map((d) => d.modelId)).size}

STATISTICAL QUALITY:
${JSON.stringify(coreStats.descriptiveStatistics, null, 2)}

TASK:
1. Assess experimental design validity
2. Evaluate data quality and completeness
3. Identify potential confounds or biases
4. Recommend improvements

Output JSON with:
- design_validity: Assessment of experimental design
- data_quality: Quality metrics
- potential_confounds: Issues identified
- recommendations: Methodological improvements`;

      const model = await this.getModel();
      const result = await generateText({
        model,
        prompt,
        temperature: 0.5,
      });

      try {
        return JSON.parse(result.text);
      } catch (e) {
        return {
          design_validity: {},
          data_quality: {},
          potential_confounds: [result.text],
          recommendations: [],
        };
      }
    } catch (e) {
      return {
        design_validity: {},
        data_quality: {},
        potential_confounds: ['AI module not available'],
        recommendations: [],
      };
    }
  }

  /**
   * Agent 4: Enhanced Synthesis
   */
  private async synthesizeFindings(
    _coreStats: CoreStats,
    _advancedStats: AdvancedStats,
    businessAnalysis: BusinessAnalysis,
    cognitiveAnalysis: CognitiveAnalysis,
    designValidation: DesignValidation,
  ): Promise<Synthesis> {
    if (!this.agentExecutor) {
      return {
        convergent_findings: [],
        divergent_findings: [],
        integrated_recommendations: [],
        confidence_assessment: {},
        next_steps: [],
      };
    }

    try {
      const { generateText } = await import('ai');

      const prompt = `You are synthesizing findings from multiple analytical perspectives.

BUSINESS PERSPECTIVE:
${JSON.stringify(businessAnalysis, null, 2)}

COGNITIVE PERSPECTIVE:  
${JSON.stringify(cognitiveAnalysis, null, 2)}

METHODOLOGICAL PERSPECTIVE:
${JSON.stringify(designValidation, null, 2)}

TASK:
Create an integrated synthesis that:
1. Identifies convergent findings across perspectives
2. Highlights contradictions or tensions
3. Provides unified recommendations
4. Assesses overall confidence in conclusions

Output JSON with:
- convergent_findings: Agreement across analyses
- divergent_findings: Disagreements or tensions
- integrated_recommendations: Unified guidance
- confidence_assessment: Overall reliability
- next_steps: Suggested follow-up research`;

      const model = await this.getModel();
      const result = await generateText({
        model,
        prompt,
        temperature: 0.7,
      });

      try {
        return JSON.parse(result.text);
      } catch (e) {
        return {
          convergent_findings: [result.text],
          divergent_findings: [],
          integrated_recommendations: [],
          confidence_assessment: {},
          next_steps: [],
        };
      }
    } catch (e) {
      return {
        convergent_findings: ['AI module not available'],
        divergent_findings: [],
        integrated_recommendations: [],
        confidence_assessment: {},
        next_steps: [],
      };
    }
  }
}

// ==================== FACTORY FUNCTION ====================

/**
 * Create a StatisticalAnalysisEngine with configuration and optional database
 */
export function createStatisticalAnalysisEngine(
  config: Partial<StatisticalAnalysisConfig>,
  database?: any,
): StatisticalAnalysisEngine {
  return new StatisticalAnalysisEngine(config, database);
}

// ==================== RE-EXPORTS ====================

export * from './types.js';
export * from './data-preparation.js';
export * from './python-engine-client.js';
export * from './agents/index.js';
