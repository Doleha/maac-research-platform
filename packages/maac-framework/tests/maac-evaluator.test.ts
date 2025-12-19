import { describe, it, expect, beforeAll } from 'vitest';
import { MAACEvaluator, ScenarioContext } from '../src/evaluator';
import { VercelAIProvider } from '../src/llm-provider';
import { CognitiveResponse, ExecutionMetadata } from '@maac/types';
import { AssessmentContext } from '../src/dimensions/types';

// Load environment variables from vitest.config.ts

describe('MAAC Evaluator', () => {
  let llmProvider: VercelAIProvider;

  beforeAll(async () => {
    // Initialize OpenAI provider (Anthropic API key appears to be invalid)
    const { openai } = await import('@ai-sdk/openai');
    const model = openai('gpt-4o-mini');
    llmProvider = new VercelAIProvider('gpt-4o-mini', model);
  });

  const sampleScenario: ScenarioContext = {
    domain: 'business_analysis',
    tier: 'moderate',
    configId: '111111111111',
    modelId: 'claude-sonnet-4-5',
    taskTitle: 'Quarterly Sales Analysis',
    taskDescription: 'Analyze quarterly sales data and provide recommendations',
    businessContext: 'E-commerce company reviewing Q4 performance',
    successCriteria: [
      { criterion: 'Identify key trends in the data', category: 'completeness' },
      { criterion: 'Provide actionable recommendations', category: 'actionability' },
      { criterion: 'Calculate year-over-year growth rate', category: 'calculation' },
      { criterion: 'Support conclusions with evidence', category: 'accuracy' },
    ],
    expectedCalculations: ['growth rate', 'percentage change', 'year-over-year comparison'],
    expectedInsights: ['revenue trends', 'regional performance', 'product category analysis'],
    scenarioRequirements: ['trend analysis', 'recommendations', 'data visualization'],
    dataElements: ['quarterly_sales', 'regional_breakdown', 'product_categories'],
    enabledTools: ['data_analysis', 'calculator'],
    memoryToolsEnabled: [],
  };

  const sampleResponse: CognitiveResponse = {
    content: `
      Based on my analysis of the quarterly sales data, I've identified several key trends:
      
      1. **Revenue Growth**: Q4 showed a 15.3% increase compared to Q3, driven primarily by 
         the new product line launch. Year-over-year growth stands at 23.7%.
      
      2. **Regional Performance**: 
         - North America: +18% (strongest performer)
         - Europe: +12% (steady growth)
         - Asia-Pacific: +31% (emerging market expansion)
      
      3. **Product Category Analysis**:
         - Electronics: 45% of total revenue (up from 38%)
         - Home goods: 30% (stable)
         - Apparel: 25% (down from 32%)
      
      **Recommendations**:
      1. Increase inventory allocation for electronics category by 20%
      2. Expand Asia-Pacific distribution channels
      3. Review apparel pricing strategy to address declining share
      
      These conclusions are supported by the attached data tables showing monthly 
      transaction volumes and customer acquisition costs.
    `,
    metadata: {
      processingTime: 5000,
      cognitiveCyclesCount: 3,
      memoryOperationsCount: 0,
      toolsInvoked: ['data_analysis', 'calculator'],
      toolsInvokedCount: 2,
    },
  };

  const sampleMetadata: ExecutionMetadata = {
    processingTime: 5000,
    startedAt: new Date(),
    completedAt: new Date(),
    cognitiveCyclesCount: 3,
    memoryOperationsCount: 0,
    toolsInvoked: ['data_analysis', 'calculator'],
    toolsInvokedCount: 2,
    processingMethod: 'iterative',
    complexityAssessment: 'moderate',
    modelId: 'gpt-4o-mini',
    modelName: 'GPT-4o Mini',
    sessionId: 'test-session-1',
    trialId: 'test-trial-1',
    wordCount: 250,
    responseText: sampleResponse.content,
  };

  it('evaluates all 9 dimensions', async () => {
    const config = {
      llmProvider,
      model: 'claude-sonnet-4-5',
      confidenceThreshold: 0.7,
      parallelAssessment: false,
      includeReasoningChains: true,
      formulaValidation: true,
      statisticalMode: false,
    };

    const evaluator = new MAACEvaluator(config);

    const result = await evaluator.evaluate(sampleResponse, sampleScenario, sampleMetadata);

    // Verify all dimensions present
    expect(result).toHaveProperty('cognitiveLoad');
    expect(result).toHaveProperty('toolExecution');
    expect(result).toHaveProperty('contentQuality');
    expect(result).toHaveProperty('memoryIntegration');
    expect(result).toHaveProperty('complexityHandling');
    expect(result).toHaveProperty('hallucinationControl');
    expect(result).toHaveProperty('knowledgeTransfer');
    expect(result).toHaveProperty('processingEfficiency');
    expect(result).toHaveProperty('constructValidity');

    // Verify score ranges (0-10 scale after normalization)
    expect(result.cognitiveLoad).toBeGreaterThanOrEqual(0);
    expect(result.cognitiveLoad).toBeLessThanOrEqual(10);

    // Verify overall score
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(10);

    // Verify confidence (0-1)
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  }, 120000); // 2 minute timeout for LLM calls

  it('provides dimension reasonings', async () => {
    const config = {
      llmProvider,
      model: 'claude-sonnet-4-5',
      confidenceThreshold: 0.7,
      parallelAssessment: false,
      includeReasoningChains: true,
      formulaValidation: true,
      statisticalMode: false,
    };

    const evaluator = new MAACEvaluator(config);

    const result = await evaluator.evaluate(sampleResponse, sampleScenario, sampleMetadata);

    // Verify reasoning is provided for each dimension
    expect(result.dimensionReasonings).toBeDefined();
    expect(result.dimensionReasonings.cognitiveLoad).toBeTruthy();
    expect(result.dimensionReasonings.contentQuality).toBeTruthy();
  }, 120000);
});

describe('MAAC Dimension Assessors', () => {
  let llmProvider: VercelAIProvider;

  beforeAll(async () => {
    const { openai } = await import('@ai-sdk/openai');
    const model = openai('gpt-4o-mini');
    llmProvider = new VercelAIProvider('gpt-4o-mini', model);
  });

  it('cognitive load assessor follows 6-question methodology', async () => {
    const { CognitiveLoadAssessor } = await import('../src/dimensions/cognitive-load');

    const assessor = new CognitiveLoadAssessor(llmProvider);

    const context: AssessmentContext = {
      responseText:
        'Sample response for cognitive load assessment with multiple insights and calculations.',
      responseContent:
        'Sample response for cognitive load assessment with multiple insights and calculations.',
      wordCount: 150,
      cognitiveCyclesCount: 3,
      memoryOperationsCount: 1,
      toolsInvoked: ['calculator'],
      toolsInvokedCount: 1,
      processingTime: 3000,
      configId: '111111111111',
      modelId: 'claude-sonnet-4-5',
      domain: 'business_analysis',
      tier: 'moderate',
      expectedCalculations: ['growth rate', 'percentage change'],
      scenarioRequirements: ['trend analysis', 'recommendations'],
      successThresholds: { cognitive_load: 3.5 },
      successCriteria: [{ criterion: 'Identify trends', category: 'completeness' }],
      expectedInsights: ['trend analysis'],
      enabledTools: ['calculator'],
      memoryToolsEnabled: [],
      memoryStoreEnabled: false,
    };

    const result = await assessor.assess(context);

    // Verify score structure
    expect(result).toHaveProperty('dimensionScore');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('componentScores');

    // Verify dimension score is in valid range (1-5 Likert)
    expect(result.dimensionScore).toBeGreaterThanOrEqual(1);
    expect(result.dimensionScore).toBeLessThanOrEqual(5);
  }, 60000);
});
