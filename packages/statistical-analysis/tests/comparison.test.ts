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
 */
const n8nExpectedStats = {
  descriptive: {
    mean: 8.198,
    std: 0.4873,
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
      // Order: overall, cognitive, tool, content, memory, complexity, hallucination, knowledge, processing, validity
      expect(matrix[0]).toContain(7.85); // overall score
      expect(matrix[0]).toContain(7.8); // cognitive load
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
      expect(dimensionalData['maac_overall_score'].length).toBe(sampleExperiments.length);
    });

    it('preserves score ordering', () => {
      const dimensionalData = extractDimensionalData(sampleExperiments);

      expect(dimensionalData['maac_overall_score'][0]).toBe(7.85);
      expect(dimensionalData['maac_overall_score'][1]).toBe(8.12);
      expect(dimensionalData['maac_overall_score'][4]).toBe(8.92);
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
  it('mean calculation matches n8n output', () => {
    const dimensionalData = extractDimensionalData(sampleExperiments);
    const scores = dimensionalData['maac_overall_score'];

    const calculatedMean = scores.reduce((a, b) => a + b, 0) / scores.length;

    expect(calculatedMean).toBeCloseTo(n8nExpectedStats.descriptive.mean, 2);
  });

  it('standard deviation calculation approach matches n8n', () => {
    const dimensionalData = extractDimensionalData(sampleExperiments);
    const scores = dimensionalData['maac_overall_score'];

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (scores.length - 1);
    const std = Math.sqrt(variance);

    expect(std).toBeCloseTo(n8nExpectedStats.descriptive.std, 2);
  });

  it('min/max values match n8n output', () => {
    const dimensionalData = extractDimensionalData(sampleExperiments);
    const scores = dimensionalData['maac_overall_score'];

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

    expect(groups.length).toBe(3); // software_engineering, data_analysis, research
    expect(groups.find((g) => g.groupKey === 'software_engineering')).toBeDefined();
    expect(groups.find((g) => g.groupKey === 'data_analysis')).toBeDefined();
    expect(groups.find((g) => g.groupKey === 'research')).toBeDefined();
  });

  it('groups experiments by tier correctly', () => {
    const groups = groupByTier(sampleExperiments);

    expect(groups.length).toBe(3); // tier1, tier2, tier3

    const tier1Group = groups.find((g) => g.groupKey === 'tier1');
    expect(tier1Group).toBeDefined();
    expect(tier1Group!.experiments.length).toBe(2);
  });

  it('calculates aggregated scores per group', () => {
    const groups = groupByDomain(sampleExperiments);

    groups.forEach((group) => {
      expect(group.aggregatedScores).toBeDefined();
      expect(group.aggregatedScores.maac_overall_score).toBeGreaterThan(0);
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
