/**
 * Python Statistical Engine Client
 * Extracted from: MAAC - Tier 2 - Dataset-Level Advanced Analysis-Python.json
 *
 * HTTP client for communicating with the MAAC Statistical Engine v4.0 Python service.
 * Supports both comprehensive analysis and batch processing endpoints.
 */

import {
  ExperimentData,
  BatchPayload,
  BatchResponse,
  ComprehensiveAnalysisPayload,
  ComprehensiveAnalysisResults,
  StatisticalMethodResult,
  StatisticalAnalysisConfig,
  DEFAULT_ENGINE_CONFIG,
} from './types.js';
import { sanitizeForPythonEngine, buildBatchPayload } from './data-preparation.js';

// ==================== ENGINE CLIENT ====================

/**
 * Client for MAAC Statistical Engine v4.0
 */
export class PythonEngineClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly enableDetailedLogging: boolean;

  constructor(config: Partial<StatisticalAnalysisConfig> = {}) {
    this.baseUrl = config.pythonEngineUrl || DEFAULT_ENGINE_CONFIG.pythonEngineUrl!;
    this.timeout = config.pythonEngineTimeout || DEFAULT_ENGINE_CONFIG.pythonEngineTimeout!;
    this.enableDetailedLogging = config.enableDetailedLogging ?? true;
  }

  /**
   * Log a message if detailed logging is enabled
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.enableDetailedLogging) return;

    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📊';
    console.log(`${emoji} [PythonEngineClient] ${message}`);
  }

  /**
   * Check if the Python engine is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Run comprehensive analysis on experiment data
   * Uses the /api/v1/comprehensive_analysis endpoint
   */
  async runComprehensiveAnalysis(
    experiments: ExperimentData[],
    sessionId: string,
    options: Partial<ComprehensiveAnalysisPayload['analysis_options']> = {},
  ): Promise<ComprehensiveAnalysisResults> {
    this.log(
      `Starting comprehensive analysis: ${experiments.length} experiments, session ${sessionId}`,
    );

    // Sanitize data for Python compatibility
    const sanitizedData = sanitizeForPythonEngine(experiments);

    // Detect grouping availability
    const domains = [...new Set(experiments.map((e) => e.domain).filter(Boolean))];
    const tiers = [...new Set(experiments.map((e) => e.tier).filter(Boolean))];

    const payload: ComprehensiveAnalysisPayload = {
      session_id: sessionId,
      experiment_data: sanitizedData,
      analysis_options: {
        include_advanced_methods: true,
        include_business_scenarios: true,
        include_tier_analysis: tiers.length > 1,
        include_domain_analysis: domains.length > 1,
        include_maac_methods: true,
        include_all_validations: true,
        output_format: 'javascript_engine_compatible',
        performance_optimization: true,
        ...options,
      },
    };

    const url = `${this.baseUrl}/api/v1/comprehensive_analysis`;
    this.log(`Sending comprehensive analysis request to ${url}`);

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout),
      });

      const duration = Date.now() - startTime;
      this.log(`Comprehensive analysis response received in ${duration}ms`);

      if (!response.ok) {
        throw new Error(`Comprehensive analysis failed with status ${response.status}`);
      }

      const responseText = await response.text();

      // Parse and sanitize response (handle NaN values from Python)
      const sanitizedResponse = this.sanitizeJsonResponse(responseText);
      const data = JSON.parse(sanitizedResponse);

      // Extract and transform results
      const results = this.transformComprehensiveResponse(data);

      this.log(
        `Comprehensive analysis completed successfully: ${results.executionSummary?.successfulMethods || 0} methods`,
      );
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`Comprehensive analysis failed after ${duration}ms: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Run batch processing on experiment data
   * Uses the /api/v1/batch endpoint as fallback
   */
  async runBatchAnalysis(
    experiments: ExperimentData[],
    payload?: BatchPayload,
  ): Promise<BatchResponse> {
    this.log(`Starting batch analysis: ${experiments.length} experiments`);

    // Build payload if not provided
    const batchPayload = payload || buildBatchPayload(experiments);

    const url = `${this.baseUrl}/api/v1/batch`;
    this.log(`Sending batch request to ${url} with ${batchPayload.calls.length} method calls`);

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchPayload),
        signal: AbortSignal.timeout(this.timeout),
      });

      const duration = Date.now() - startTime;
      this.log(`Batch response received in ${duration}ms`);

      if (!response.ok) {
        throw new Error(`Batch analysis failed with status ${response.status}`);
      }

      const responseText = await response.text();
      const sanitizedResponse = this.sanitizeJsonResponse(responseText);
      const data = JSON.parse(sanitizedResponse);

      // Extract results array
      const results: StatisticalMethodResult[] = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data)
          ? data
          : [];

      // Clean NaN values from results
      this.cleanBatchResults(results);

      this.log(
        `Batch analysis completed: ${results.filter((r) => r.ok !== false).length}/${results.length} successful`,
      );

      return {
        results,
        timing_ms: duration,
        success: results.length > 0,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`Batch analysis failed after ${duration}ms: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Run analysis with automatic fallback from comprehensive to batch
   */
  async runAnalysisWithFallback(
    experiments: ExperimentData[],
    sessionId: string,
  ): Promise<{
    results: ComprehensiveAnalysisResults;
    mode: 'comprehensive' | 'batch';
    duration: number;
  }> {
    const startTime = Date.now();

    // Try comprehensive analysis first
    try {
      this.log('Attempting comprehensive analysis endpoint...');
      const results = await this.runComprehensiveAnalysis(experiments, sessionId);

      // Validate results
      if (
        results.readyForInterpretation !== false &&
        results.engineVersion !== 'emergency_fallback_v1.0'
      ) {
        return {
          results,
          mode: 'comprehensive',
          duration: Date.now() - startTime,
        };
      }

      this.log('Comprehensive analysis returned invalid results, falling back to batch', 'warn');
    } catch (error) {
      this.log(`Comprehensive analysis failed: ${error}, falling back to batch`, 'warn');
    }

    // Fallback to batch processing
    this.log('Using batch processing fallback...');
    const batchResponse = await this.runBatchAnalysis(experiments);
    const transformedResults = this.transformBatchToComprehensive(
      batchResponse.results,
      experiments,
    );

    return {
      results: transformedResults,
      mode: 'batch',
      duration: Date.now() - startTime,
    };
  }

  /**
   * Sanitize JSON response from Python engine
   * Handles NaN, Infinity, and -Infinity values
   */
  private sanitizeJsonResponse(jsonString: string): string {
    return jsonString
      .replace(/:\s*NaN\s*([,}\]])/g, ': null$1')
      .replace(/\[\s*NaN\s*([,\]])/g, '[null$1')
      .replace(/,\s*NaN\s*([,\]])/g, ', null$1')
      .replace(/:\s*Infinity/g, ': 1e308')
      .replace(/:\s*-Infinity/g, ': -1e308')
      .replace(/:\s*undefined/g, ': null');
  }

  /**
   * Clean NaN values from batch results
   */
  private cleanBatchResults(results: StatisticalMethodResult[]): void {
    for (const result of results) {
      if (result.result) {
        for (const key of Object.keys(result.result)) {
          const value = result.result[key];
          if (typeof value === 'number' && !Number.isFinite(value)) {
            result.result[key] = null;
          }
        }
      }
    }
  }

  /**
   * Transform comprehensive response to standard format
   */
  private transformComprehensiveResponse(
    data: Record<string, unknown>,
  ): ComprehensiveAnalysisResults {
    // Handle nested results structure
    let actualData = data;
    if (data.results && typeof data.results === 'object') {
      actualData = data.results as Record<string, unknown>;
      if (
        (actualData as Record<string, unknown>).results &&
        typeof (actualData as Record<string, unknown>).results === 'object'
      ) {
        actualData = (actualData as Record<string, unknown>).results as Record<string, unknown>;
      }
    }

    // Extract from analysisResults if present
    if (actualData.analysisResults && typeof actualData.analysisResults === 'object') {
      const analysisResults = actualData.analysisResults as Record<string, unknown>;
      for (const [key, value] of Object.entries(analysisResults)) {
        if (key.startsWith('maac_') || key === 'advancedStatisticalAnalysis') {
          actualData[key] = value;
        }
      }
    }

    return {
      engineVersion: String(actualData.engineVersion || 'MAAC_Statistical_Engine_v4.0'),
      advancedStatisticalMethodsCompleted: Boolean(actualData.advancedStatisticalMethodsCompleted),
      newMethodsImplemented: Number(actualData.newMethodsImplemented || 0),
      readyForInterpretation: Boolean(actualData.readyForInterpretation ?? true),
      executionSummary: (actualData.executionSummary ||
        {}) as ComprehensiveAnalysisResults['executionSummary'],
      dataQuality: (actualData.dataQuality || {}) as ComprehensiveAnalysisResults['dataQuality'],
      methodResults: (actualData.methodResults || {
        maacCoreMethods: {},
        descriptiveStatistics: {},
        correlationalAnalysis: {},
        robustMethods: {},
        advancedStatistics: {},
        distributionAnalysis: {},
        testingProcedures: {},
        specializedAnalyses: {},
      }) as ComprehensiveAnalysisResults['methodResults'],
      integrationSummary:
        actualData.integrationSummary as ComprehensiveAnalysisResults['integrationSummary'],
    };
  }

  /**
   * Transform batch results to comprehensive format
   * Extracted from MAAC Engine HTTP Wrapper node
   */
  private transformBatchToComprehensive(
    batchResults: StatisticalMethodResult[],
    experiments: ExperimentData[],
  ): ComprehensiveAnalysisResults {
    this.log(`Transforming ${batchResults.length} batch results to comprehensive format`);

    // Extract key results
    const successfulMethods = batchResults.filter((r) => r.ok !== false).length;
    const successRate =
      batchResults.length > 0 ? (successfulMethods / batchResults.length) * 100 : 0;

    // Group results by category
    const methodResults: ComprehensiveAnalysisResults['methodResults'] = {
      maacCoreMethods: {},
      descriptiveStatistics: {},
      correlationalAnalysis: {},
      robustMethods: {},
      advancedStatistics: {},
      distributionAnalysis: {},
      testingProcedures: {},
      specializedAnalyses: {},
    };

    for (const result of batchResults) {
      const method = result.method;

      if (method.startsWith('maac_')) {
        methodResults.maacCoreMethods[method] = result;
      } else if (
        ['mean', 'median', 'std', 'var', 'minimum', 'maximum', 'skew', 'kurtosis', 'iqr'].includes(
          method,
        )
      ) {
        methodResults.descriptiveStatistics[method] = result;
      } else if (
        ['pearson', 'spearman', 'kendall', 'corr_matrix', 'partial_corr'].includes(method)
      ) {
        methodResults.correlationalAnalysis[method] = result;
      } else if (
        ['robust_mean', 'robust_std', 'trimmed_mean', 'outlier_detection_robust'].includes(method)
      ) {
        methodResults.robustMethods[method] = result;
      } else if (
        ['bootstrap_ci', 'bootstrap_bca', 'mediation_analysis', 'pca', 'efa', 'cfa'].includes(
          method,
        )
      ) {
        methodResults.advancedStatistics[method] = result;
      } else if (['shapiro', 'normaltest', 'jarque_bera', 'anderson'].includes(method)) {
        methodResults.distributionAnalysis[method] = result;
      } else if (
        ['ttest_1samp', 'ttest_rel', 'anova_oneway', 'power_ttest', 'power_anova'].includes(method)
      ) {
        methodResults.testingProcedures[method] = result;
      } else {
        methodResults.specializedAnalyses[method] = result;
      }
    }

    return {
      engineVersion: `MAAC_Statistical_Engine_v4.0_batch_${batchResults.length}_methods`,
      advancedStatisticalMethodsCompleted: true,
      newMethodsImplemented: successfulMethods,
      readyForInterpretation: successRate > 50,
      executionSummary: {
        totalMethodsAttempted: batchResults.length,
        successfulMethods,
        failedMethods: batchResults.length - successfulMethods,
        successRate,
        processingTimeMs: 0,
        analysisTimestamp: new Date().toISOString(),
      },
      dataQuality: {
        methodCoverage: {
          successful: successfulMethods,
          total: batchResults.length,
        },
        completenessRate: successRate / 100,
        varianceAdequacy: 'auto_filtered',
      },
      methodResults,
      integrationSummary: {
        methodsExecuted: batchResults.map((r) => ({
          method: this.categorizeMethod(r.method),
          methodName: r.method,
          executed: true,
          successful: r.ok !== false,
        })),
        overallValidation: {
          inputDataValid: true,
          sampleSizeAdequate: experiments.length >= 30,
          assumptionsMet: true,
          numericalStabilityGood: true,
        },
        keyFindings: {
          factorStructure: 'batch_analysis_completed',
          nineDimensionalValidation: 'structure_analyzed',
          dataQuality: `${successRate.toFixed(1)}% methods successful`,
        },
        academicCredibility: {
          methodsImplemented: successfulMethods,
          completenessScore: successRate / 100,
          publicationReadiness: successRate >= 75 ? 'ready' : 'needs_improvement',
        },
      },
    };
  }

  /**
   * Categorize a statistical method
   */
  private categorizeMethod(method: string): string {
    if (method.startsWith('maac_')) return 'maac_framework_analysis';
    if (['pca', 'efa', 'cfa', 'factor_analysis_ml'].includes(method)) return 'factor_analysis';
    if (['bootstrap_ci', 'bootstrap_bca', 'bootstrap_percentile'].includes(method))
      return 'bootstrap_methods';
    if (['cohens_d', 'hedges_g', 'glass_delta', 'eta_squared'].includes(method))
      return 'effect_size_analysis';
    if (['mean', 'median', 'std', 'var', 'skew', 'kurtosis'].includes(method))
      return 'descriptive_statistics';
    if (['pearson', 'spearman', 'kendall', 'corr_matrix'].includes(method))
      return 'correlation_analysis';
    if (['shapiro', 'normaltest', 'kmo', 'bartlett_sphericity'].includes(method))
      return 'assumption_testing';
    if (['power_ttest', 'power_anova', 'power_corr'].includes(method)) return 'power_analysis';
    if (['cronbach_alpha', 'split_half', 'icc'].includes(method)) return 'reliability_analysis';
    if (['mediation_analysis', 'sobel_test'].includes(method)) return 'mediation_analysis';
    return 'other';
  }
}

/**
 * Helper function to extract value from batch results
 */
export function extractValueFromBatchResults(
  results: StatisticalMethodResult[],
  method: string,
  field: string,
  index: number | null = null,
): number {
  const result = results.find((r) => r.method === method);
  if (!result || !result.result || result.ok === false) return 0;

  const value = result.result[field];
  if (value === null || value === undefined) return 0;
  if (Array.isArray(value) && index !== null) return value[index] ?? 0;
  if (Array.isArray(value)) return value[0] ?? 0;
  return Number(value) || 0;
}
