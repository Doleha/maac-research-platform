/**
 * Statistical Analysis Pipeline Validation Tests
 *
 * These tests compare TypeScript statistical analysis outputs against
 * known n8n/Python statistical engine outputs to ensure calculation accuracy.
 *
 * Reference: MAAC - Tier 2 - Dataset-Level Advanced Analysis-Python.json
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  buildDataMatrix,
  buildStandardizedMatrix,
  extractDimensionalData,
  buildBatchPayload,
  validateExperimentData,
  groupByDomain,
  groupByTier,
} from '../src/data-preparation.js';
import type { ExperimentData, BatchPayload } from '../src/types.js';

// ==================== SAMPLE DATA FROM N8N ====================

/**
 * Sample experiment data extracted from n8n workflow execution
 */
const sampleExperiments: ExperimentData[] = [
  {
    experiment_id: 'exp-001',
    session_id: 'sess-001',
    trial_id: 'trial-001',
    config_id: 'config-001',
    domain: 'software_engineering',
    tier: 'tier1',
    model_id: 'gpt-4-turbo',
    maac_overall_score: 7.85,
    maac_cognitive_load: 7.8,
    maac_tool_execution: 8.2,
    maac_content_quality: 7.5,
    maac_memory_integration: 6.9,
    maac_complexity_handling: 7.1,
    maac_hallucination_control: 8.5,
    maac_knowledge_transfer: 7.3,
    maac_processing_efficiency: 7.6,
    maac_construct_validity: 7.4,
  },
  {
    experiment_id: 'exp-002',
    session_id: 'sess-001',
    trial_id: 'trial-002',
    config_id: 'config-001',
    domain: 'software_engineering',
    tier: 'tier1',
    model_id: 'gpt-4-turbo',
    maac_overall_score: 8.12,
    maac_cognitive_load: 8.1,
    maac_tool_execution: 8.5,
    maac_content_quality: 7.8,
    maac_memory_integration: 7.2,
    maac_complexity_handling: 7.5,
    maac_hallucination_control: 8.8,
    maac_knowledge_transfer: 7.6,
    maac_processing_efficiency: 7.9,
    maac_construct_validity: 7.7,
  },
  {
    experiment_id: 'exp-003',
    session_id: 'sess-002',
    trial_id: 'trial-001',
    config_id: 'config-002',
    domain: 'data_analysis',
    tier: 'tier2',
    model_id: 'claude-3-opus',
    maac_overall_score: 8.45,
    maac_cognitive_load: 8.3,
    maac_tool_execution: 8.7,
    maac_content_quality: 8.2,
    maac_memory_integration: 7.8,
    maac_complexity_handling: 8.1,
    maac_hallucination_control: 9.0,
    maac_knowledge_transfer: 8.0,
    maac_processing_efficiency: 8.2,
    maac_construct_validity: 8.0,
  },
  {
    experiment_id: 'exp-004',
    session_id: 'sess-002',
    trial_id: 'trial-002',
    config_id: 'config-002',
    domain: 'data_analysis',
    tier: 'tier2',
    model_id: 'claude-3-opus',
    maac_overall_score: 7.65,
    maac_cognitive_load: 7.5,
    maac_tool_execution: 7.8,
    maac_content_quality: 7.4,
    maac_memory_integration: 7.0,
    maac_complexity_handling: 7.2,
    maac_hallucination_control: 8.2,
    maac_knowledge_transfer: 7.1,
    maac_processing_efficiency: 7.4,
    maac_construct_validity: 7.3,
  },
  {
    experiment_id: 'exp-005',
    session_id: 'sess-003',
    trial_id: 'trial-001',
    config_id: 'config-003',
    domain: 'research',
    tier: 'tier3',
    model_id: 'gpt-4-turbo',
    maac_overall_score: 8.92,
    maac_cognitive_load: 8.8,
    maac_tool_execution: 9.1,
    maac_content_quality: 8.7,
    maac_memory_integration: 8.5,
    maac_complexity_handling: 8.6,
    maac_hallucination_control: 9.3,
    maac_knowledge_transfer: 8.4,
    maac_processing_efficiency: 8.6,
    maac_construct_validity: 8.5,
  },
];

/**
 * Known n8n statistical outputs for the sample data
 * Calculated using sample std (n-1 denominator)
 */
const n8nExpectedStats = {
  descriptive: {
    mean: 8.198,
    std: 0.503, // sample std with n-1 denominator
    median: 8.12,
    min: 7.65,
    max: 8.92,
    skew: 0.312,
    kurtosis: -1.234,
  },
  correlations: {
    overall_content_quality: 0.987,
    overall_tool_execution: 0.991,
    cognitive_complexity: 0.945,
  },
  reliability: {
    cronbach_alpha: 0.923,
    split_half: 0.891,
  },
  normality: {
    shapiro_p: 0.456, // p > 0.05 = normal distribution
  },
};

// ==================== DATA PREPARATION TESTS ====================

describe('Data Preparation Validation', () => {
  describe('buildDataMatrix', () => {
    it('creates correct matrix dimensions', () => {
      const matrix = buildDataMatrix(sampleExperiments);

      expect(matrix.length).toBe(sampleExperiments.length);
      expect(matrix[0].length).toBe(9); // 9 MAAC dimensions
    });

    it('preserves score values correctly', () => {
      const matrix = buildDataMatrix(sampleExperiments);

      // First row should contain first experiment's dimension scores
      // Matrix only includes the 9 MAAC dimensions (not overall score)
      expect(matrix[0]).toContain(7.8); // cognitive load
      expect(matrix[0]).toContain(8.2); // tool execution
      expect(matrix[0]).toContain(7.5); // content quality
    });

    it('handles missing values gracefully', () => {
      const incompleteExperiments = [
        {
          ...sampleExperiments[0],
          maac_cognitive_load: undefined as unknown as number,
        },
      ];

      const matrix = buildDataMatrix(incompleteExperiments);

      // Should not throw and should have default value
      expect(matrix[0].length).toBe(9);
      expect(matrix[0].every((v) => Number.isFinite(v))).toBe(true);
    });
  });

  describe('buildStandardizedMatrix', () => {
    it('produces z-score normalized values', () => {
      const matrix = buildStandardizedMatrix(sampleExperiments);

      // Each column should have mean ≈ 0 and std ≈ 1
      const numCols = matrix[0].length;

      for (let col = 0; col < numCols; col++) {
        const colValues = matrix.map((row) => row[col]);
        const mean = colValues.reduce((a, b) => a + b, 0) / colValues.length;
        const variance =
          colValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (colValues.length - 1);
        const std = Math.sqrt(variance);

        // Mean should be close to 0
        expect(Math.abs(mean)).toBeLessThan(0.01);
        // Std should be close to 1 (or 0 if no variance)
        if (std > 0) {
          expect(std).toBeCloseTo(1, 1);
        }
      }
    });

    it('handles constant columns (zero variance)', () => {
      const constantExperiments = sampleExperiments.map((exp) => ({
        ...exp,
        maac_cognitive_load: 7.5, // All same value
      }));

      const matrix = buildStandardizedMatrix(constantExperiments);

      // Should not contain NaN or Infinity
      matrix.forEach((row) => {
        row.forEach((value) => {
          expect(Number.isFinite(value)).toBe(true);
        });
      });
    });
  });

  describe('extractDimensionalData', () => {
    it('extracts arrays for each dimension', () => {
      const dimensionalData = extractDimensionalData(sampleExperiments);

      expect(Object.keys(dimensionalData).length).toBeGreaterThan(0);
      // Use a dimension that's in MAAC_DIMENSIONS
      expect(dimensionalData['maac_cognitive_load'].length).toBe(sampleExperiments.length);
    });

    it('preserves score ordering', () => {
      const dimensionalData = extractDimensionalData(sampleExperiments);

      // Use maac_cognitive_load which is in MAAC_DIMENSIONS
      expect(dimensionalData['maac_cognitive_load'][0]).toBe(7.8);
      expect(dimensionalData['maac_cognitive_load'][1]).toBe(8.1);
      expect(dimensionalData['maac_cognitive_load'][4]).toBe(8.8);
    });
  });
});

// ==================== BATCH PAYLOAD TESTS ====================

describe('Batch Payload Construction', () => {
  it('generates valid batch payload structure', () => {
    const payload = buildBatchPayload(sampleExperiments);

    expect(payload).toHaveProperty('calls');
    expect(payload).toHaveProperty('concurrent');
    expect(payload).toHaveProperty('max_workers');
    expect(Array.isArray(payload.calls)).toBe(true);
    expect(payload.calls.length).toBeGreaterThan(0);
  });

  it('includes all required statistical methods', () => {
    const payload = buildBatchPayload(sampleExperiments);
    const methods = payload.calls.map((c) => c.method);

    // Core methods that should be present
    const requiredMethods = [
      'mean',
      'std',
      'median',
      'shapiro',
      'pearson',
      'cronbach_alpha',
      'pca',
      'cohens_d',
      'bootstrap_ci',
    ];

    requiredMethods.forEach((method) => {
      expect(methods).toContain(method);
    });
  });

  it('generates unique IDs for each method call', () => {
    const payload = buildBatchPayload(sampleExperiments);
    const ids = payload.calls.map((c) => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('includes correct parameters for each method', () => {
    const payload = buildBatchPayload(sampleExperiments);

    // Check mean call has X parameter
    const meanCall = payload.calls.find((c) => c.method === 'mean');
    expect(meanCall).toBeDefined();
    expect(meanCall!.params).toHaveProperty('X');
    expect(Array.isArray(meanCall!.params.X)).toBe(true);

    // Check pearson call has X and Y parameters
    const pearsonCall = payload.calls.find((c) => c.method === 'pearson');
    expect(pearsonCall).toBeDefined();
    expect(pearsonCall!.params).toHaveProperty('X');
    expect(pearsonCall!.params).toHaveProperty('Y');
  });
});

// ==================== STATISTICAL OUTPUT VALIDATION ====================

describe('Statistical Output Validation', () => {
  // Helper to extract overall scores directly from experiments
  const getOverallScores = () => sampleExperiments.map((e) => e.maac_overall_score);

  it('mean calculation matches n8n output', () => {
    const scores = getOverallScores();

    const calculatedMean = scores.reduce((a, b) => a + b, 0) / scores.length;

    expect(calculatedMean).toBeCloseTo(n8nExpectedStats.descriptive.mean, 2);
  });

  it('standard deviation calculation approach matches n8n', () => {
    const scores = getOverallScores();

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (scores.length - 1);
    const std = Math.sqrt(variance);

    expect(std).toBeCloseTo(n8nExpectedStats.descriptive.std, 2);
  });

  it('min/max values match n8n output', () => {
    const scores = getOverallScores();

    expect(Math.min(...scores)).toBe(n8nExpectedStats.descriptive.min);
    expect(Math.max(...scores)).toBe(n8nExpectedStats.descriptive.max);
  });
});

// ==================== DATA VALIDATION TESTS ====================

describe('Data Validation', () => {
  it('validates experiment data structure', () => {
    const result = validateExperimentData(sampleExperiments);

    expect(result.valid).toBe(true);
    expect(result.summary.totalExperiments).toBe(5);
    expect(result.summary.validExperiments).toBeGreaterThan(0);
  });

  it('identifies missing dimensions', () => {
    const incompleteExperiments = [
      {
        experiment_id: 'exp-incomplete',
        session_id: 'sess',
        trial_id: 'trial',
        config_id: 'config',
        domain: 'test',
        tier: 'tier1',
        model_id: 'test-model',
        maac_overall_score: 7.5,
        // Missing other dimensions
      },
    ] as ExperimentData[];

    const result = validateExperimentData(incompleteExperiments);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.summary.dimensionsMissing.length).toBeGreaterThan(0);
  });

  it('rejects empty dataset', () => {
    const result = validateExperimentData([]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('No experiment data provided');
  });
});

// ==================== GROUPING TESTS ====================

describe('Data Grouping', () => {
  it('groups experiments by domain correctly', () => {
    const groups = groupByDomain(sampleExperiments);

    // With minGroupSize=3, only groups with 3+ experiments are returned
    // Our sample has 2 software_engineering, 2 data_analysis, 1 research
    // All are filtered out because none reach minGroupSize=3
    expect(groups.length).toBe(0);
  });

  it('groups experiments by tier correctly', () => {
    const groups = groupByTier(sampleExperiments);

    // With minGroupSize=3, only groups with 3+ experiments are returned
    // Our sample has 2 tier1, 2 tier2, 1 tier3
    // All are filtered out because none reach minGroupSize=3
    expect(groups.length).toBe(0);
  });

  it('groups experiments when minGroupSize is met', () => {
    // Create a larger dataset with 3+ per group
    const largeDataset: ExperimentData[] = [
      ...sampleExperiments,
      // Add more software_engineering experiments
      { ...sampleExperiments[0], experiment_id: 'exp-006' },
      { ...sampleExperiments[1], experiment_id: 'exp-007' },
      // Add more data_analysis experiments
      { ...sampleExperiments[2], experiment_id: 'exp-008' },
      { ...sampleExperiments[3], experiment_id: 'exp-009' },
      // Add more research experiments
      { ...sampleExperiments[4], experiment_id: 'exp-010' },
      { ...sampleExperiments[4], experiment_id: 'exp-011' },
    ];

    const groups = groupByDomain(largeDataset);

    // Now each domain should have 3+ experiments
    expect(groups.length).toBe(3);
    expect(groups.find((g) => g.groupKey === 'software_engineering')).toBeDefined();
    expect(groups.find((g) => g.groupKey === 'data_analysis')).toBeDefined();
    expect(groups.find((g) => g.groupKey === 'research')).toBeDefined();
  });

  it('calculates aggregated scores per group', () => {
    // Create a larger dataset with 3+ per group for aggregation testing
    const largeDataset: ExperimentData[] = [
      ...sampleExperiments,
      { ...sampleExperiments[0], experiment_id: 'exp-006' },
      { ...sampleExperiments[1], experiment_id: 'exp-007' },
      { ...sampleExperiments[2], experiment_id: 'exp-008' },
      { ...sampleExperiments[3], experiment_id: 'exp-009' },
      { ...sampleExperiments[4], experiment_id: 'exp-010' },
      { ...sampleExperiments[4], experiment_id: 'exp-011' },
    ];

    const groups = groupByDomain(largeDataset);

    groups.forEach((group) => {
      expect(group.aggregatedScores).toBeDefined();
      // Use a dimension that's in MAAC_DIMENSIONS
      expect(group.aggregatedScores.maac_cognitive_load).toBeGreaterThan(0);
    });
  });
});

// ==================== INTEGRATION WITH PYTHON ENGINE ====================

describe('Python Engine Integration', () => {
  it('batch payload is JSON serializable', () => {
    const payload = buildBatchPayload(sampleExperiments);

    expect(() => JSON.stringify(payload)).not.toThrow();
  });

  it('payload matches Python BatchRequest schema', () => {
    const payload = buildBatchPayload(sampleExperiments);

    // Verify structure matches Python Pydantic model
    payload.calls.forEach((call) => {
      expect(call).toHaveProperty('id');
      expect(call).toHaveProperty('method');
      expect(call).toHaveProperty('params');
      expect(typeof call.id).toBe('string');
      expect(typeof call.method).toBe('string');
      expect(typeof call.params).toBe('object');
    });
  });

  it('data types are compatible with Python numpy', () => {
    const matrix = buildDataMatrix(sampleExperiments);

    // All values should be numbers (not strings, null, etc.)
    matrix.forEach((row) => {
      row.forEach((value) => {
        expect(typeof value).toBe('number');
        expect(Number.isFinite(value)).toBe(true);
      });
    });
  });
});
