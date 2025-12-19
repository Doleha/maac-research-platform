/**
 * Tier 2 Statistical Analysis Integration Tests
 *
 * End-to-end tests validating the complete Tier 2 workflow:
 * 1. Experiment data → Data preparation
 * 2. Data preparation → Statistical engine
 * 3. Statistical results → 6 Interpretation agents
 * 4. Agent outputs → Synthesized results
 *
 * These tests use real LLM calls to validate agent behavior.
 * Reference: MAAC - Tier 2 - Dataset-Level Advanced Analysis-Python.json
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { StatisticalAnalysisEngine } from '../src/engine.js';
import { AgentExecutor, DeepSeekProvider, OpenAIProvider } from '../src/agents/executor.js';
import {
  buildDataMatrix,
  extractDimensionalData,
  validateExperimentData,
  groupByDomain,
  groupByTier,
} from '../src/data-preparation.js';
import type { ExperimentData, AgentInput, StatisticalAnalysisConfig } from '../src/types.js';

// ==================== TEST DATA ====================

/**
 * Comprehensive test dataset with 12 experiments across:
 * - 4 domains (analytical, planning, communication, problem_solving)
 * - 3 tiers (simple, moderate, complex)
 * - Various tool configurations
 */
const testExperiments: ExperimentData[] = [
  // Analytical Domain - Simple
  // All MAAC scores use 1-5 Likert scale
  {
    experiment_id: 'exp-001',
    session_id: 'tier2-test-session',
    trial_id: 'trial-001',
    config_id: '111100000000', // 4 tools enabled
    domain: 'analytical',
    tier: 'simple',
    model_id: 'deepseek_v3',
    maac_overall_score: 3.9,
    maac_cognitive_load: 3.9,
    maac_tool_execution: 4.1,
    maac_content_quality: 3.8,
    maac_memory_integration: 3.5,
    maac_complexity_handling: 3.6,
    maac_hallucination_control: 4.3,
    maac_knowledge_transfer: 3.7,
    maac_processing_efficiency: 3.8,
    maac_construct_validity: 3.7,
  },
  {
    experiment_id: 'exp-002',
    session_id: 'tier2-test-session',
    trial_id: 'trial-002',
    config_id: '111100000000',
    domain: 'analytical',
    tier: 'moderate',
    model_id: 'deepseek_v3',
    maac_overall_score: 4.1,
    maac_cognitive_load: 4.1,
    maac_tool_execution: 4.3,
    maac_content_quality: 3.9,
    maac_memory_integration: 3.6,
    maac_complexity_handling: 3.8,
    maac_hallucination_control: 4.4,
    maac_knowledge_transfer: 3.8,
    maac_processing_efficiency: 4.0,
    maac_construct_validity: 3.9,
  },
  // Planning Domain - Moderate
  {
    experiment_id: 'exp-003',
    session_id: 'tier2-test-session',
    trial_id: 'trial-003',
    config_id: '111111110000', // 8 tools enabled
    domain: 'planning',
    tier: 'moderate',
    model_id: 'sonnet_37',
    maac_overall_score: 4.2,
    maac_cognitive_load: 4.2,
    maac_tool_execution: 4.4,
    maac_content_quality: 4.1,
    maac_memory_integration: 3.9,
    maac_complexity_handling: 4.1,
    maac_hallucination_control: 4.5,
    maac_knowledge_transfer: 4.0,
    maac_processing_efficiency: 4.1,
    maac_construct_validity: 4.0,
  },
  {
    experiment_id: 'exp-004',
    session_id: 'tier2-test-session',
    trial_id: 'trial-004',
    config_id: '111111110000',
    domain: 'planning',
    tier: 'complex',
    model_id: 'sonnet_37',
    maac_overall_score: 3.8,
    maac_cognitive_load: 3.8,
    maac_tool_execution: 3.9,
    maac_content_quality: 3.7,
    maac_memory_integration: 3.5,
    maac_complexity_handling: 3.6,
    maac_hallucination_control: 4.1,
    maac_knowledge_transfer: 3.6,
    maac_processing_efficiency: 3.7,
    maac_construct_validity: 3.6,
  },
  // Communication Domain - Complex
  {
    experiment_id: 'exp-005',
    session_id: 'tier2-test-session',
    trial_id: 'trial-005',
    config_id: '111111111111', // All 12 tools enabled
    domain: 'communication',
    tier: 'complex',
    model_id: 'gpt_4o',
    maac_overall_score: 4.5,
    maac_cognitive_load: 4.4,
    maac_tool_execution: 4.6,
    maac_content_quality: 4.4,
    maac_memory_integration: 4.3,
    maac_complexity_handling: 4.5,
    maac_hallucination_control: 4.7,
    maac_knowledge_transfer: 4.3,
    maac_processing_efficiency: 4.5,
    maac_construct_validity: 4.4,
  },
  {
    experiment_id: 'exp-006',
    session_id: 'tier2-test-session',
    trial_id: 'trial-006',
    config_id: '000000000000', // Baseline - no tools
    domain: 'communication',
    tier: 'simple',
    model_id: 'gpt_4o',
    maac_overall_score: 3.2,
    maac_cognitive_load: 3.1,
    maac_tool_execution: 3.3,
    maac_content_quality: 3.2,
    maac_memory_integration: 2.9,
    maac_complexity_handling: 3.1,
    maac_hallucination_control: 3.4,
    maac_knowledge_transfer: 3.0,
    maac_processing_efficiency: 3.1,
    maac_construct_validity: 3.1,
  },
  // Problem Solving Domain
  {
    experiment_id: 'exp-007',
    session_id: 'tier2-test-session',
    trial_id: 'trial-007',
    config_id: '110011001100',
    domain: 'problem_solving',
    tier: 'simple',
    model_id: 'llama_maverick',
    maac_overall_score: 3.6,
    maac_cognitive_load: 3.6,
    maac_tool_execution: 3.7,
    maac_content_quality: 3.6,
    maac_memory_integration: 3.4,
    maac_complexity_handling: 3.5,
    maac_hallucination_control: 3.8,
    maac_knowledge_transfer: 3.5,
    maac_processing_efficiency: 3.6,
    maac_construct_validity: 3.5,
  },
  {
    experiment_id: 'exp-008',
    session_id: 'tier2-test-session',
    trial_id: 'trial-008',
    config_id: '110011001100',
    domain: 'problem_solving',
    tier: 'moderate',
    model_id: 'llama_maverick',
    maac_overall_score: 3.9,
    maac_cognitive_load: 3.8,
    maac_tool_execution: 4.0,
    maac_content_quality: 3.9,
    maac_memory_integration: 3.7,
    maac_complexity_handling: 3.8,
    maac_hallucination_control: 4.1,
    maac_knowledge_transfer: 3.8,
    maac_processing_efficiency: 3.8,
    maac_construct_validity: 3.8,
  },
  // Additional experiments for statistical significance
  {
    experiment_id: 'exp-009',
    session_id: 'tier2-test-session',
    trial_id: 'trial-009',
    config_id: '111111111111',
    domain: 'analytical',
    tier: 'complex',
    model_id: 'deepseek_v3',
    maac_overall_score: 4.3,
    maac_cognitive_load: 4.3,
    maac_tool_execution: 4.4,
    maac_content_quality: 4.3,
    maac_memory_integration: 4.1,
    maac_complexity_handling: 4.2,
    maac_hallucination_control: 4.6,
    maac_knowledge_transfer: 4.2,
    maac_processing_efficiency: 4.3,
    maac_construct_validity: 4.2,
  },
  {
    experiment_id: 'exp-010',
    session_id: 'tier2-test-session',
    trial_id: 'trial-010',
    config_id: '000000000000',
    domain: 'planning',
    tier: 'simple',
    model_id: 'sonnet_37',
    maac_overall_score: 3.3,
    maac_cognitive_load: 3.2,
    maac_tool_execution: 3.4,
    maac_content_quality: 3.3,
    maac_memory_integration: 3.0,
    maac_complexity_handling: 3.2,
    maac_hallucination_control: 3.5,
    maac_knowledge_transfer: 3.1,
    maac_processing_efficiency: 3.2,
    maac_construct_validity: 3.2,
  },
  {
    experiment_id: 'exp-011',
    session_id: 'tier2-test-session',
    trial_id: 'trial-011',
    config_id: '111100000000',
    domain: 'problem_solving',
    tier: 'complex',
    model_id: 'gpt_4o',
    maac_overall_score: 4.1,
    maac_cognitive_load: 4.0,
    maac_tool_execution: 4.2,
    maac_content_quality: 4.1,
    maac_memory_integration: 3.9,
    maac_complexity_handling: 4.0,
    maac_hallucination_control: 4.3,
    maac_knowledge_transfer: 3.9,
    maac_processing_efficiency: 4.0,
    maac_construct_validity: 4.0,
  },
  {
    experiment_id: 'exp-012',
    session_id: 'tier2-test-session',
    trial_id: 'trial-012',
    config_id: '111111110000',
    domain: 'communication',
    tier: 'moderate',
    model_id: 'llama_maverick',
    maac_overall_score: 4.0,
    maac_cognitive_load: 3.9,
    maac_tool_execution: 4.1,
    maac_content_quality: 4.0,
    maac_memory_integration: 3.8,
    maac_complexity_handling: 3.9,
    maac_hallucination_control: 4.2,
    maac_knowledge_transfer: 3.8,
    maac_processing_efficiency: 3.9,
    maac_construct_validity: 3.9,
  },
];

// ==================== PHASE 1: DATA PREPARATION TESTS ====================

describe('Tier 2 Integration: Phase 1 - Data Preparation', () => {
  it('validates experiment data structure', () => {
    const validation = validateExperimentData(testExperiments);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.summary.totalExperiments).toBe(12);
    expect(validation.summary.validExperiments).toBe(12);
  });

  it('builds data matrix with correct dimensions', () => {
    const matrix = buildDataMatrix(testExperiments);

    // Should have 12 rows (experiments) x 9 columns (MAAC dimensions)
    expect(matrix.length).toBe(12);
    expect(matrix[0].length).toBe(9);

    // Verify first row values match first experiment (1-5 Likert scale)
    expect(matrix[0][0]).toBe(3.9); // maac_cognitive_load
    expect(matrix[0][1]).toBe(4.1); // maac_tool_execution
    expect(matrix[0][2]).toBe(3.8); // maac_content_quality
  });

  it('extracts dimensional data correctly', () => {
    const dimensional = extractDimensionalData(testExperiments);

    // Keys use maac_ prefix
    expect(dimensional.maac_cognitive_load).toHaveLength(12);
    expect(dimensional.maac_tool_execution).toHaveLength(12);
    expect(dimensional.maac_hallucination_control).toHaveLength(12);

    // Verify values (1-5 Likert scale)
    expect(dimensional.maac_cognitive_load[0]).toBe(3.9);
    expect(dimensional.maac_hallucination_control[4]).toBe(4.7); // exp-005 has highest
  });

  it('groups by domain correctly', () => {
    const byDomain = groupByDomain(testExperiments);

    expect(byDomain.length).toBe(4); // 4 unique domains
    const groupKeys = byDomain.map((g) => g.groupKey);
    expect(groupKeys).toContain('analytical');
    expect(groupKeys).toContain('planning');
    expect(groupKeys).toContain('communication');
    expect(groupKeys).toContain('problem_solving');
  });

  it('groups by tier correctly', () => {
    const byTier = groupByTier(testExperiments);

    expect(byTier.length).toBe(3); // 3 tiers
    const groupKeys = byTier.map((g) => g.groupKey);
    expect(groupKeys).toContain('simple');
    expect(groupKeys).toContain('moderate');
    expect(groupKeys).toContain('complex');
  });
});

// ==================== PHASE 2: STATISTICAL ENGINE TESTS ====================

describe('Tier 2 Integration: Phase 2 - Statistical Engine', () => {
  let engine: StatisticalAnalysisEngine;

  beforeAll(() => {
    // Create engine with test config (no LLM key = stats only mode)
    engine = new StatisticalAnalysisEngine({
      pythonEngineUrl: 'http://localhost:8000',
      llmProvider: 'deepseek',
      llmModel: 'deepseek-chat',
      llmApiKey: '', // Empty = will use fallback statistics
      enableDetailedLogging: false,
    });
  });

  it('checks engine health', async () => {
    // This will fail if Python engine isn't running, but test structure is valid
    const isHealthy = await engine.checkEngineHealth();
    // Don't fail test if Python engine isn't running
    expect(typeof isHealthy).toBe('boolean');
  });

  it('runs statistics-only analysis (requires Python engine)', async () => {
    // Check if Python engine is available first
    const isHealthy = await engine.checkEngineHealth();
    if (!isHealthy) {
      console.log('⚠️ Skipping: Python engine not running at localhost:8000');
      return;
    }

    const results = await engine.analyzeStatisticsOnly(testExperiments, 'test-session');

    expect(results).toBeDefined();
    expect(results.engineVersion).toBeDefined();
    expect(results.executionSummary).toBeDefined();
  }, 30000);
});

// ==================== PHASE 3: AGENT EXECUTION TESTS ====================

describe('Tier 2 Integration: Phase 3 - Interpretation Agents', () => {
  let agentExecutor: AgentExecutor | null = null;
  let mockAgentInput: AgentInput;

  beforeAll(() => {
    // Build mock agent input from test data
    const dimensional = extractDimensionalData(testExperiments);
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr: number[]) => {
      const m = mean(arr);
      return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / arr.length);
    };

    mockAgentInput = {
      session_id: 'tier2-integration-test',
      dimensions_processed: 9,
      timestamp: new Date().toISOString(),
      statistical_analysis_completed: true,
      engine_version: '2.0.0-test',
      overall_score: 78,
      grade_level: 'B',
      validation_strength: 'moderate',
      deployment_readiness: 'conditional',

      core_statistics: {
        executive_summary: {
          overall_score: 78,
          grade_level: 'B',
          confidence_level: 'moderate',
          percentile_rank: 75,
        },
        descriptive_statistics: {
          overall_stats: {
            mean: mean(testExperiments.map((e) => e.maac_overall_score)),
            std: std(testExperiments.map((e) => e.maac_overall_score)),
            min: Math.min(...testExperiments.map((e) => e.maac_overall_score)),
            max: Math.max(...testExperiments.map((e) => e.maac_overall_score)),
          },
          dimensional_stats: {
            cognitive_load: {
              mean: mean(dimensional.maac_cognitive_load),
              std: std(dimensional.maac_cognitive_load),
            },
            tool_execution: {
              mean: mean(dimensional.maac_tool_execution),
              std: std(dimensional.maac_tool_execution),
            },
            content_quality: {
              mean: mean(dimensional.maac_content_quality),
              std: std(dimensional.maac_content_quality),
            },
            memory_integration: {
              mean: mean(dimensional.maac_memory_integration),
              std: std(dimensional.maac_memory_integration),
            },
            complexity_handling: {
              mean: mean(dimensional.maac_complexity_handling),
              std: std(dimensional.maac_complexity_handling),
            },
            hallucination_control: {
              mean: mean(dimensional.maac_hallucination_control),
              std: std(dimensional.maac_hallucination_control),
            },
            knowledge_transfer: {
              mean: mean(dimensional.maac_knowledge_transfer),
              std: std(dimensional.maac_knowledge_transfer),
            },
            processing_efficiency: {
              mean: mean(dimensional.maac_processing_efficiency),
              std: std(dimensional.maac_processing_efficiency),
            },
            construct_validity: {
              mean: mean(dimensional.maac_construct_validity),
              std: std(dimensional.maac_construct_validity),
            },
          },
          correlation_summary: { average_correlation: 0.85, significant_pairs: 36 },
        },
        statistical_tests: {
          effect_sizes: { cohens_d: 0.72, hedges_g: 0.71 },
          statistical_tests: {},
        },
        matrix_analysis: {
          correlation_matrix: [],
          eigenanalysis: {},
        },
        quality_indicators: {
          methodCoverage: { successful: 15, total: 18 },
          completenessRate: 0.92,
          varianceAdequacy: 'adequate',
        },
      },

      advanced_statistics: {
        factor_analysis: {
          pca: {
            valid: true,
            eigenvalues: [4.2, 1.8, 0.9, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
            componentLoadings: [],
            explainedVarianceRatio: [0.47, 0.2, 0.1, 0.07, 0.05, 0.04, 0.03, 0.02, 0.02],
            cumulativeVariance: 0.97,
            significantComponents: 3,
          },
          efa: {
            valid: true,
            loadings: [],
            communalities: [],
            uniqueness: [],
            nFactors: 3,
            rotation: 'varimax',
            converged: true,
          },
          cfa: {
            valid: true,
            goodnessOfFit: {
              cfi: 0.95,
              tli: 0.94,
              rmsea: 0.05,
              srmr: 0.04,
              fitInterpretation: 'good',
            },
            standardizedLoadings: {},
          },
        },
        multivariate_analysis: {
          manova_analysis: {
            valid: true,
            wilksLambda: 0.45,
            pillaiTrace: 0.55,
            hotellingT2: 1.22,
            roysLargestRoot: 0.89,
            pValue: 0.001,
            significant: true,
            effectSize: 0.15,
          },
          multivariate_tests: {},
        },
        advanced_methods: {
          bootstrap_analysis: {
            mean: 7.8,
            confidenceInterval: [7.2, 8.4],
            standardError: 0.31,
            bias: 0.02,
            nIterations: 5000,
          },
          mediation_analysis: {
            valid: true,
            mediationDetected: true,
            mediationType: 'partial',
            pathCoefficients: { pathA: 0.45, pathB: 0.52, pathC: 0.68, pathCPrime: 0.44 },
            effects: {
              directEffect: 0.44,
              indirectEffect: 0.24,
              totalEffect: 0.68,
              proportionMediated: 0.35,
            },
            sobel: { zStatistic: 2.85, pValue: 0.004, significant: true },
          },
          reliability_analysis: {
            cronbachsAlpha: 0.89,
            alphaInterpretation: 'good',
            confidenceInterval: [0.85, 0.93],
            splitHalf: 0.87,
            guttmanLambda6: 0.91,
            itemTotalCorrelations: [],
          },
        },
        framework_validation: { validation_strength: 'strong', overall_support: true },
        statistical_evidence: {
          significance_tests: {},
          effect_sizes: { cohens_d: 0.72, hedges_g: 0.71, glass_delta: 0.75 },
          confidence_intervals: {},
          power_analysis: {
            statisticalPower: 0.85,
            effectSize: 0.72,
            sampleSize: 12,
            criticalValue: 1.96,
            powerInterpretation: 'adequate',
            recommendedSampleSize: 24,
          },
        },
      },

      business_analysis: {
        business_domains: {
          analysis_available: true,
          domains_identified: 4,
          classification_accuracy: 'high',
          domain_validation: 'confirmed',
          universal_strengths: ['hallucination_control', 'tool_execution'],
          universal_challenges: ['memory_integration'],
        },
        complexity_tiers: {
          analysis_available: true,
          tiers_identified: 3,
          progression_validation: 'confirmed',
          tier_validation: 'confirmed',
        },
        performance_analysis: {
          overall_score: 78,
          dimensional_means: {
            cognitive_load: 7.5,
            tool_execution: 7.9,
            content_quality: 7.6,
            memory_integration: 7.1,
            complexity_handling: 7.4,
            hallucination_control: 8.3,
            knowledge_transfer: 7.3,
            processing_efficiency: 7.5,
            construct_validity: 7.4,
          },
          effect_sizes: { cohens_d: 0.72 },
          deployment_readiness: 'conditional',
        },
        framework_assessment: {
          validation_scores: { reliability: 0.89, validity: 0.92, success_rate: 0.83 },
          quality_indicators: {
            methodCoverage: { successful: 15, total: 18 },
            completenessRate: 0.92,
            varianceAdequacy: 'adequate',
          },
          recommendations: {
            strengths: ['High reliability', 'Good effect sizes'],
            areasForImprovement: ['Increase sample size'],
          },
        },
      },

      ablation_study: {
        experimental_design: {
          total_experiments: 12,
          valid_experiments: 12,
          configurations_found: 4,
          dimensions_analyzed: 9,
        },
        pathway_analysis: {
          mediation_analysis: {
            valid: true,
            mediationDetected: true,
            mediationType: 'partial',
            pathCoefficients: { pathA: 0.45, pathB: 0.52, pathC: 0.68, pathCPrime: 0.44 },
            effects: {
              directEffect: 0.44,
              indirectEffect: 0.24,
              totalEffect: 0.68,
              proportionMediated: 0.35,
            },
            sobel: { zStatistic: 2.85, pValue: 0.004, significant: true },
          },
          correlation_patterns: [],
        },
        component_analysis: {
          pca_results: {
            valid: true,
            eigenvalues: [4.2, 1.8, 0.9],
            componentLoadings: [],
            explainedVarianceRatio: [0.47, 0.2, 0.1],
            cumulativeVariance: 0.77,
            significantComponents: 3,
          },
        },
      },

      cognitive_architecture: {
        dimensional_relationships: {
          correlation_matrix: [],
          hierarchical_structure: 'three-factor',
          dimensional_clusters: ['performance', 'quality', 'efficiency'],
        },
        tool_enhancement_effects: {
          baseline_performance: 6.45,
          enhanced_performance: 8.15,
          enhancement_magnitude: 1.7,
          effect_interpretation: 'large',
        },
        emergent_patterns: {
          synergistic_combinations: ['goal+planning', 'memory+reflection'],
          antagonistic_combinations: [],
          optimal_configurations: ['111111111111'],
        },
      },

      experimental_design: {
        design_structure: {
          factors: ['tool_configuration', 'domain', 'tier'],
          levels_per_factor: [4, 4, 3],
          total_cells: 48,
          observations_per_cell: 0.25,
        },
        design_adequacy: {
          power_achieved: 0.85,
          sample_adequacy: 'moderate',
          balance_assessment: 'acceptable',
        },
        validity_assessment: {
          internal_validity: 'high',
          external_validity: 'moderate',
          construct_validity: 'high',
          statistical_conclusion_validity: 'high',
        },
        publication_readiness: {
          apa_compliance: true,
          consort_compliance: true,
          top_guidelines: true,
          ready_for_tier3: true,
        },
      },
    };

    // Try to create agent executor with API key
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      const provider = process.env.DEEPSEEK_API_KEY
        ? new DeepSeekProvider(apiKey, 'deepseek-chat')
        : new OpenAIProvider(apiKey, 'gpt-4o-mini');
      agentExecutor = new AgentExecutor(provider, true);
    }
  });

  it('has valid agent input structure', () => {
    expect(mockAgentInput.session_id).toBeDefined();
    expect(mockAgentInput.dimensions_processed).toBe(9);
    expect(mockAgentInput.core_statistics).toBeDefined();
    expect(mockAgentInput.advanced_statistics).toBeDefined();
    expect(mockAgentInput.business_analysis).toBeDefined();
    expect(mockAgentInput.ablation_study).toBeDefined();
    expect(mockAgentInput.cognitive_architecture).toBeDefined();
    expect(mockAgentInput.experimental_design).toBeDefined();
  });

  it('executes Core Statistical agent', async () => {
    if (!agentExecutor) {
      console.log('⚠️ Skipping: No API key available');
      return;
    }

    const result = await agentExecutor.executeAgent('coreStatistical', mockAgentInput);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.executionTimeMs).toBeGreaterThan(0);
    console.log('✅ Core Statistical Agent:', JSON.stringify(result.result, null, 2).slice(0, 500));
  }, 60000);

  it('executes Advanced Statistical agent', async () => {
    if (!agentExecutor) {
      console.log('⚠️ Skipping: No API key available');
      return;
    }

    const result = await agentExecutor.executeAgent('advancedStatistical', mockAgentInput);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    console.log(
      '✅ Advanced Statistical Agent:',
      JSON.stringify(result.result, null, 2).slice(0, 500),
    );
  }, 60000);

  it('executes Business Scenario agent', async () => {
    if (!agentExecutor) {
      console.log('⚠️ Skipping: No API key available');
      return;
    }

    const result = await agentExecutor.executeAgent('businessScenario', mockAgentInput);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    console.log(
      '✅ Business Scenario Agent:',
      JSON.stringify(result.result, null, 2).slice(0, 500),
    );
  }, 60000);

  it('executes Ablation Study agent', async () => {
    if (!agentExecutor) {
      console.log('⚠️ Skipping: No API key available');
      return;
    }

    const result = await agentExecutor.executeAgent('ablationStudy', mockAgentInput);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    console.log('✅ Ablation Study Agent:', JSON.stringify(result.result, null, 2).slice(0, 500));
  }, 60000);

  it('executes Cognitive Architecture agent', async () => {
    if (!agentExecutor) {
      console.log('⚠️ Skipping: No API key available');
      return;
    }

    const result = await agentExecutor.executeAgent('cognitiveArchitecture', mockAgentInput);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    console.log(
      '✅ Cognitive Architecture Agent:',
      JSON.stringify(result.result, null, 2).slice(0, 500),
    );
  }, 60000);

  it('executes Experimental Design agent', async () => {
    if (!agentExecutor) {
      console.log('⚠️ Skipping: No API key available');
      return;
    }

    const result = await agentExecutor.executeAgent('experimentalDesign', mockAgentInput);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    console.log(
      '✅ Experimental Design Agent:',
      JSON.stringify(result.result, null, 2).slice(0, 500),
    );
  }, 60000);

  it('executes all 6 agents in parallel', async () => {
    if (!agentExecutor) {
      console.log('⚠️ Skipping: No API key available');
      return;
    }

    const { results, summary } = await agentExecutor.executeAllAgents(mockAgentInput, 6);

    console.log('\n📊 All Agents Summary:');
    console.log(`  ✅ Successful: ${summary.successful}/6`);
    console.log(`  ❌ Failed: ${summary.failed}`);
    console.log(`  ⏱️ Total Time: ${summary.totalTimeMs}ms`);
    console.log(`  🔢 Total Tokens: ${summary.totalTokens}`);

    expect(summary.successful).toBeGreaterThanOrEqual(4); // At least 4/6 should succeed
    expect(
      results.coreStatistical || results.advancedStatistical || results.businessScenario,
    ).toBeDefined();
  }, 180000);
});

// ==================== PHASE 4: FULL TIER 2 PIPELINE TEST ====================

describe('Tier 2 Integration: Phase 4 - Full Pipeline', () => {
  it('runs complete Tier 2 workflow (engine.analyze) - requires Python engine', async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

    const engine = new StatisticalAnalysisEngine({
      pythonEngineUrl: 'http://localhost:8000',
      llmProvider: apiKey ? (process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'openai') : 'deepseek',
      llmModel: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o-mini',
      llmApiKey: apiKey || '',
      enableDetailedLogging: true,
    });

    // Check if Python engine is available first
    const isHealthy = await engine.checkEngineHealth();
    if (!isHealthy) {
      console.log('⚠️ Skipping: Python engine not running at localhost:8000');
      console.log('   To run full pipeline tests, start the Python engine:');
      console.log(
        '   cd services/python-stat-engine && uvicorn src.maac_stat_engine.api:app --port 8000',
      );
      return;
    }

    const results = await engine.analyze(testExperiments, 'tier2-full-test');

    // Validate output structure
    expect(results).toBeDefined();
    expect(results.batch_id).toBe('tier2-full-test');
    expect(results.experiments_analyzed).toBe(12);
    expect(results.statistical_results).toBeDefined();
    expect(results.quality_metrics).toBeDefined();
    expect(results.processing_metadata).toBeDefined();

    console.log('\n🎯 Full Tier 2 Pipeline Results:');
    console.log(`  Batch ID: ${results.batch_id}`);
    console.log(`  Experiments: ${results.experiments_analyzed}`);
    console.log(
      `  Data Completeness: ${(results.quality_metrics.data_completeness * 100).toFixed(1)}%`,
    );
    console.log(`  Statistical Validity: ${results.quality_metrics.statistical_validity}`);
    console.log(`  Publication Readiness: ${results.quality_metrics.publication_readiness}`);
    console.log(`  Processing Time: ${results.processing_metadata.processing_time_ms}ms`);
    console.log(`  Agents Completed: ${results.processing_metadata.agents_completed}/6`);

    if (apiKey) {
      expect(results.processing_metadata.agents_completed).toBeGreaterThan(0);
    }
  }, 300000);
});
