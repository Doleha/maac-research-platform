/**
 * Data Preparation Module for Statistical Analysis
 * Extracted from: MAAC - Tier 2 - Dataset-Level Advanced Analysis-Python.json
 *
 * Handles data grouping, matrix construction, and preparation for statistical analysis.
 * NOTE: This module provides the data grouping logic that was identified as missing
 * from the original n8n workflow.
 */

import {
  ExperimentData,
  MAAC_DIMENSIONS,
  MaacDimension,
  StatisticalMethodCall,
  BatchPayload,
  Tier2Config,
  DEFAULT_TIER2_CONFIG,
} from './types.js';

// ==================== DATA GROUPING STRATEGIES ====================

/**
 * Data grouping options for statistical analysis
 */
export interface DataGroupingOptions {
  groupBy: 'domain' | 'tier' | 'model' | 'config' | 'none';
  aggregationMethod: 'mean' | 'median' | 'sum' | 'count';
  minGroupSize: number;
  includeMetadata: boolean;
}

/**
 * Grouped data structure for statistical analysis
 */
export interface GroupedData {
  groupKey: string;
  groupLabel: string;
  experiments: ExperimentData[];
  dimensionalData: Record<MaacDimension, number[]>;
  aggregatedScores: Record<MaacDimension, number>;
  metadata: {
    count: number;
    domains: string[];
    tiers: string[];
    models: string[];
    configs: string[];
  };
}

// ==================== MATRIX CONSTRUCTION ====================

/**
 * Construct a data matrix from experiment data for statistical analysis
 * Extracted from MAAC Engine HTTP Wrapper node
 */
export function buildDataMatrix(
  experiments: ExperimentData[],
  dimensions: readonly string[] = MAAC_DIMENSIONS,
): number[][] {
  return experiments.map((exp) =>
    dimensions.map((dim) => parseFloat(String(exp[dim as keyof ExperimentData] ?? 0))),
  );
}

/**
 * Construct a standardized data matrix for factor analysis
 * Prevents NaN/Inf values that cause issues in Python statistical libraries
 */
export function buildStandardizedMatrix(
  experiments: ExperimentData[],
  dimensions: readonly string[] = MAAC_DIMENSIONS,
): number[][] {
  // Step 1: Build raw matrix with value clamping
  const rawMatrix = experiments.map((exp) =>
    dimensions.map((dim) => {
      const val = parseFloat(String(exp[dim as keyof ExperimentData] ?? 0));
      if (!Number.isFinite(val)) return 5.0; // Use median MAAC score as default
      return Math.max(0.1, Math.min(10.0, val)); // Clamp to valid MAAC range
    }),
  );

  // Step 2: Standardize each column (z-score normalization)
  const numRows = rawMatrix.length;
  const numCols = dimensions.length;
  const standardizedMatrix: number[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(0));

  for (let col = 0; col < numCols; col++) {
    // Calculate column mean
    const colValues = rawMatrix.map((row) => row[col]);
    const mean = colValues.reduce((sum, val) => sum + val, 0) / numRows;

    // Calculate column standard deviation
    const variance =
      colValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (numRows - 1);
    const std = Math.sqrt(variance);

    // Standardize column values
    for (let row = 0; row < numRows; row++) {
      if (std <= 0.001) {
        standardizedMatrix[row][col] = 0; // No variance case
      } else {
        const standardized = (rawMatrix[row][col] - mean) / std;
        standardizedMatrix[row][col] = Number.isFinite(standardized) ? standardized : 0;
      }
    }
  }

  return standardizedMatrix;
}

/**
 * Extract dimensional data as separate arrays for each dimension
 */
export function extractDimensionalData(
  experiments: ExperimentData[],
  dimensions: readonly string[] = MAAC_DIMENSIONS,
): Record<string, number[]> {
  const result: Record<string, number[]> = {};

  for (const dim of dimensions) {
    result[dim] = experiments.map((exp) =>
      parseFloat(String(exp[dim as keyof ExperimentData] ?? 0)),
    );
  }

  return result;
}

// ==================== DATA GROUPING FUNCTIONS ====================

/**
 * Group experiments by specified criteria
 */
export function groupExperiments(
  experiments: ExperimentData[],
  options: DataGroupingOptions,
): GroupedData[] {
  if (options.groupBy === 'none') {
    return [
      {
        groupKey: 'all',
        groupLabel: 'All Experiments',
        experiments,
        dimensionalData: extractDimensionalData(experiments) as Record<MaacDimension, number[]>,
        aggregatedScores: calculateAggregatedScores(experiments, options.aggregationMethod),
        metadata: extractGroupMetadata(experiments),
      },
    ];
  }

  // Group by specified field
  const groups = new Map<string, ExperimentData[]>();

  for (const exp of experiments) {
    const key = String(exp[options.groupBy as keyof ExperimentData] ?? 'unknown');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(exp);
  }

  // Filter by minimum group size and convert to GroupedData
  const result: GroupedData[] = [];

  for (const [key, groupExps] of groups) {
    if (groupExps.length >= options.minGroupSize) {
      result.push({
        groupKey: key,
        groupLabel: `${options.groupBy}: ${key}`,
        experiments: groupExps,
        dimensionalData: extractDimensionalData(groupExps) as Record<MaacDimension, number[]>,
        aggregatedScores: calculateAggregatedScores(groupExps, options.aggregationMethod),
        metadata: extractGroupMetadata(groupExps),
      });
    }
  }

  return result;
}

/**
 * Group experiments by domain for cross-domain analysis
 */
export function groupByDomain(experiments: ExperimentData[]): GroupedData[] {
  return groupExperiments(experiments, {
    groupBy: 'domain',
    aggregationMethod: 'mean',
    minGroupSize: 3,
    includeMetadata: true,
  });
}

/**
 * Group experiments by complexity tier for tier progression analysis
 */
export function groupByTier(experiments: ExperimentData[]): GroupedData[] {
  return groupExperiments(experiments, {
    groupBy: 'tier',
    aggregationMethod: 'mean',
    minGroupSize: 3,
    includeMetadata: true,
  });
}

/**
 * Group experiments by model for model comparison analysis
 */
export function groupByModel(experiments: ExperimentData[]): GroupedData[] {
  return groupExperiments(experiments, {
    groupBy: 'model',
    aggregationMethod: 'mean',
    minGroupSize: 3,
    includeMetadata: true,
  });
}

/**
 * Group experiments by configuration for ablation analysis
 */
export function groupByConfig(experiments: ExperimentData[]): GroupedData[] {
  return groupExperiments(experiments, {
    groupBy: 'config',
    aggregationMethod: 'mean',
    minGroupSize: 1,
    includeMetadata: true,
  });
}

// ==================== AGGREGATION FUNCTIONS ====================

/**
 * Calculate aggregated scores for a group of experiments
 */
function calculateAggregatedScores(
  experiments: ExperimentData[],
  method: 'mean' | 'median' | 'sum' | 'count',
): Record<MaacDimension, number> {
  const result = {} as Record<MaacDimension, number>;

  for (const dim of MAAC_DIMENSIONS) {
    const values = experiments
      .map((exp) => parseFloat(String(exp[dim as keyof ExperimentData] ?? 0)))
      .filter((v) => Number.isFinite(v));

    result[dim] = aggregate(values, method);
  }

  return result;
}

/**
 * Aggregate an array of values using specified method
 */
function aggregate(values: number[], method: 'mean' | 'median' | 'sum' | 'count'): number {
  if (values.length === 0) return 0;

  switch (method) {
    case 'mean':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'median':
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'count':
      return values.length;
  }
}

/**
 * Extract metadata from a group of experiments
 */
function extractGroupMetadata(experiments: ExperimentData[]): GroupedData['metadata'] {
  return {
    count: experiments.length,
    domains: [...new Set(experiments.map((e) => e.domain).filter(Boolean))],
    tiers: [...new Set(experiments.map((e) => e.tier).filter(Boolean))],
    models: [...new Set(experiments.map((e) => e.model_id).filter(Boolean))],
    configs: [...new Set(experiments.map((e) => e.config_id).filter(Boolean))],
  };
}

// ==================== BATCH PAYLOAD CONSTRUCTION ====================

/**
 * Generate a unique short ID for method calls
 */
function shortId(): string {
  return String(Date.now()).replace(/\D/g, '').slice(0, 14);
}

/**
 * Build comprehensive batch payload for Python statistical engine
 * Extracted and enhanced from MAAC Engine HTTP Wrapper node
 */
export function buildBatchPayload(
  experiments: ExperimentData[],
  _config: Tier2Config = DEFAULT_TIER2_CONFIG,
): BatchPayload {
  const experimentCount = experiments.length;
  const dimensionalData = extractDimensionalData(experiments);
  const primaryData =
    dimensionalData['maac_overall_score'] || experiments.map((e) => e.maac_overall_score);
  const matrixData = buildDataMatrix(experiments);
  const standardizedMatrix = buildStandardizedMatrix(experiments);

  const isLargeDataset = experimentCount * MAAC_DIMENSIONS.length > 10000;

  // Get unique tiers for group analysis
  const tiers = [...new Set(experiments.map((e) => e.tier).filter(Boolean))];

  const calls: StatisticalMethodCall[] = [
    // Core descriptive statistics
    { id: `mean:${shortId()}`, method: 'mean', params: { X: primaryData } },
    { id: `median:${shortId()}`, method: 'median', params: { X: primaryData } },
    { id: `std:${shortId()}`, method: 'std', params: { X: primaryData } },
    { id: `var:${shortId()}`, method: 'var', params: { X: primaryData } },
    { id: `minimum:${shortId()}`, method: 'minimum', params: { X: primaryData } },
    { id: `maximum:${shortId()}`, method: 'maximum', params: { X: primaryData } },
    { id: `skew:${shortId()}`, method: 'skew', params: { X: primaryData } },
    { id: `kurtosis:${shortId()}`, method: 'kurtosis', params: { X: primaryData } },
    { id: `iqr:${shortId()}`, method: 'iqr', params: { X: primaryData } },

    // Distribution testing
    { id: `shapiro:${shortId()}`, method: 'shapiro', params: { X: primaryData } },
    { id: `normaltest:${shortId()}`, method: 'normaltest', params: { X: primaryData } },
    { id: `jarque_bera:${shortId()}`, method: 'jarque_bera', params: { X: primaryData } },

    // MAAC framework methods
    {
      id: `maac_scoring_validation:${shortId()}`,
      method: 'maac_scoring_validation',
      params: { scores: matrixData },
    },
    {
      id: `maac_dimensional_statistics:${shortId()}`,
      method: 'maac_dimensional_statistics',
      params: { data: dimensionalData },
    },
    {
      id: `maac_framework_coherence:${shortId()}`,
      method: 'maac_framework_coherence',
      params: { scores: matrixData },
    },
    {
      id: `maac_multivariate_validation:${shortId()}`,
      method: 'maac_multivariate_validation',
      params: { data: dimensionalData },
    },

    // Correlation analysis
    { id: `corr_matrix:${shortId()}`, method: 'corr_matrix', params: { X: standardizedMatrix } },
    {
      id: `cronbach_alpha:${shortId()}`,
      method: 'cronbach_alpha',
      params: { X: standardizedMatrix },
    },
    {
      id: `pearson:${shortId()}`,
      method: 'pearson',
      params: {
        X: primaryData,
        Y: dimensionalData['maac_content_quality'] || primaryData,
      },
    },
    {
      id: `spearman:${shortId()}`,
      method: 'spearman',
      params: {
        X: primaryData,
        Y: dimensionalData['maac_content_quality'] || primaryData,
      },
    },

    // Factor analysis
    { id: `kmo:${shortId()}`, method: 'kmo', params: { X: standardizedMatrix } },
    {
      id: `bartlett_sphericity:${shortId()}`,
      method: 'bartlett_sphericity',
      params: { X: standardizedMatrix },
    },
    { id: `pca:${shortId()}`, method: 'pca', params: { X: standardizedMatrix } },
    { id: `efa:${shortId()}`, method: 'efa', params: { X: standardizedMatrix, n_factors: 2 } },

    // Effect sizes
    {
      id: `cohens_d:${shortId()}`,
      method: 'cohens_d',
      params: {
        X: primaryData,
        Y: dimensionalData['maac_content_quality'] || primaryData,
      },
    },
    {
      id: `hedges_g:${shortId()}`,
      method: 'hedges_g',
      params: {
        X: primaryData,
        Y: dimensionalData['maac_content_quality'] || primaryData,
      },
    },

    // Bootstrap methods
    {
      id: `bootstrap_ci:${shortId()}`,
      method: 'bootstrap_ci',
      params: { X: primaryData, confidence_level: 0.95 },
    },
    {
      id: `bootstrap_bca:${shortId()}`,
      method: 'bootstrap_bca',
      params: { X: primaryData, confidence_level: 0.95 },
    },

    // Reliability analysis
    { id: `split_half:${shortId()}`, method: 'split_half', params: { X: matrixData } },
    {
      id: `item_total_corr:${shortId()}`,
      method: 'item_total_corr',
      params: { X: standardizedMatrix },
    },

    // Power analysis
    {
      id: `power_ttest:${shortId()}`,
      method: 'power_ttest',
      params: { effect_size: 0.5, nobs: experimentCount },
    },
    {
      id: `power_anova:${shortId()}`,
      method: 'power_anova',
      params: {
        k_groups: tiers.length || 2,
        effect_size: 0.5,
        nobs: experimentCount,
      },
    },

    // Robust methods
    { id: `robust_mean:${shortId()}`, method: 'robust_mean', params: { X: primaryData } },
    { id: `robust_std:${shortId()}`, method: 'robust_std', params: { X: primaryData } },
    { id: `trimmed_mean:${shortId()}`, method: 'trimmed_mean', params: { X: primaryData } },
    {
      id: `outlier_detection_robust:${shortId()}`,
      method: 'outlier_detection_robust',
      params: { data: primaryData },
    },

    // Mediation analysis (if enough dimensions)
    {
      id: `mediation_analysis:${shortId()}`,
      method: 'mediation_analysis',
      params: {
        X: dimensionalData['maac_tool_execution'] || primaryData,
        M: dimensionalData['maac_cognitive_load'] || primaryData,
        Y: primaryData,
      },
    },
  ];

  // Add CFA if enough dimensions
  if (MAAC_DIMENSIONS.length >= 5) {
    calls.push({
      id: `cfa:${shortId()}`,
      method: 'cfa',
      params: { X: matrixData, n_factors: Math.min(3, Math.floor(MAAC_DIMENSIONS.length / 3)) },
    });
  }

  return {
    calls,
    concurrent: true,
    memory_optimize: isLargeDataset,
    max_workers: Math.min(16, Math.max(8, Math.floor(experimentCount / 100))),
    priority_execution: true,
    batch_optimization: {
      chunk_size: Math.min(1000, Math.max(100, experimentCount)),
      enable_caching: true,
      parallel_matrix_ops: true,
      concurrent_statistical_methods: true,
    },
  };
}

// ==================== DATA VALIDATION ====================

/**
 * Validate experiment data before statistical analysis
 */
export function validateExperimentData(experiments: ExperimentData[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalExperiments: number;
    validExperiments: number;
    dimensionsPresent: string[];
    dimensionsMissing: string[];
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validCount = 0;

  // Check for empty dataset
  if (!experiments || experiments.length === 0) {
    errors.push('No experiment data provided');
    return {
      valid: false,
      errors,
      warnings,
      summary: {
        totalExperiments: 0,
        validExperiments: 0,
        dimensionsPresent: [],
        dimensionsMissing: [...MAAC_DIMENSIONS],
      },
    };
  }

  // Check for required dimensions
  const firstExp = experiments[0];
  const dimensionsPresent: string[] = [];
  const dimensionsMissing: string[] = [];

  for (const dim of MAAC_DIMENSIONS) {
    if (dim in firstExp && firstExp[dim as keyof ExperimentData] !== undefined) {
      dimensionsPresent.push(dim);
    } else {
      dimensionsMissing.push(dim);
    }
  }

  if (dimensionsMissing.length > 0) {
    warnings.push(`Missing MAAC dimensions: ${dimensionsMissing.join(', ')}`);
  }

  if (dimensionsPresent.length < 3) {
    errors.push(
      `Insufficient MAAC dimensions: ${dimensionsPresent.length} present, minimum 3 required`,
    );
  }

  // Validate each experiment
  for (let i = 0; i < experiments.length; i++) {
    const exp = experiments[i];
    let expValid = true;

    // Check required identifiers
    if (!exp.experiment_id && !exp.session_id) {
      warnings.push(`Experiment ${i}: Missing identifier (experiment_id or session_id)`);
    }

    // Check for valid scores
    for (const dim of dimensionsPresent) {
      const value = exp[dim as keyof ExperimentData];
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
          warnings.push(`Experiment ${i}: Invalid ${dim} value (NaN/Infinity)`);
          expValid = false;
        } else if (value < 0 || value > 10) {
          warnings.push(`Experiment ${i}: ${dim} value ${value} outside valid range [0, 10]`);
        }
      }
    }

    if (expValid) validCount++;
  }

  // Check sample size
  if (validCount < 30) {
    warnings.push(`Low sample size (${validCount}): May limit statistical power`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalExperiments: experiments.length,
      validExperiments: validCount,
      dimensionsPresent,
      dimensionsMissing,
    },
  };
}

/**
 * Sanitize experiment data for Python engine compatibility
 * Converts arrays/objects to JSON strings to prevent "unhashable type: 'list'" errors
 */
export function sanitizeForPythonEngine(experiments: ExperimentData[]): ExperimentData[] {
  return experiments.map((exp) => {
    const sanitized = { ...exp } as Record<string, unknown>;

    for (const [key, value] of Object.entries(sanitized)) {
      if (Array.isArray(value)) {
        sanitized[key] = JSON.stringify(value);
      } else if (value && typeof value === 'object' && value.constructor === Object) {
        sanitized[key] = JSON.stringify(value);
      }
    }

    return sanitized as unknown as ExperimentData;
  });
}

// ==================== CHUNKED PROCESSING ====================

/**
 * Process large datasets in chunks to prevent memory issues
 */
export async function processInChunks<T, R>(
  items: T[],
  processFn: (chunk: T[]) => Promise<R>,
  chunkSize: number = 1000,
  onProgress?: (processed: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const result = await processFn(chunk);
    results.push(result);

    if (onProgress) {
      onProgress(Math.min(i + chunkSize, items.length), items.length);
    }

    // Yield to event loop between chunks
    await new Promise((resolve) => setImmediate(resolve));
  }

  return results;
}

/**
 * Build matrix in chunks for large datasets
 */
export async function buildMatrixInChunks(
  experiments: ExperimentData[],
  dimensions: readonly string[] = MAAC_DIMENSIONS,
  chunkSize: number = 1000,
): Promise<number[][]> {
  const results = await processInChunks(
    experiments,
    async (chunk) => buildDataMatrix(chunk, dimensions),
    chunkSize,
  );

  return results.flat();
}
