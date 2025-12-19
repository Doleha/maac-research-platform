import { describe, it, expect, beforeAll } from 'vitest';
import { MAACEvaluator, ScenarioContext } from '../src/evaluator';
import { VercelAIProvider } from '../src/llm-provider';
import { CognitiveResponse, ExecutionMetadata } from '@maac/types';
import { AssessmentContext, MAACDimension, LLMProvider } from '../src/dimensions/types';
import {
  CognitiveLoadAssessor,
  ToolExecutionAssessor,
  ContentQualityAssessor,
  MemoryIntegrationAssessor,
  ComplexityHandlingAssessor,
  HallucinationControlAssessor,
  KnowledgeTransferAssessor,
  ProcessingEfficiencyAssessor,
  ConstructValidityAssessor,
} from '../src/dimensions';

// Load environment variables from vitest.config.ts

describe('MAAC Dimension Assessors - Sequential Debug', () => {
  let llmProvider: VercelAIProvider;

  beforeAll(async () => {
    console.log('\n🔧 Initializing LLM Provider...');
    const { openai } = await import('@ai-sdk/openai');
    const model = openai('gpt-4o');
    llmProvider = new VercelAIProvider('gpt-4o', model);
    console.log('✅ LLM Provider initialized\n');
  });

  const testContext: AssessmentContext = {
    responseText: `Based on my analysis of the quarterly sales data, I've identified several key trends:
      
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
      3. Review apparel pricing strategy to address declining share`,
    wordCount: 250,
    processingTime: 5000,
    cognitiveCyclesCount: 3,
    memoryOperationsCount: 0,
    toolsInvokedCount: 2,
    toolsInvoked: ['data_analysis', 'calculator'],
    configId: '111111111111',
    modelId: 'gpt-4o',
    domain: 'business_analysis',
    tier: 'moderate',
    enabledTools: ['data_analysis', 'calculator'],
    memoryToolsEnabled: [],
    memoryStoreEnabled: false,
    successCriteria: [
      { criterion: 'Identify key trends', category: 'completeness' },
      { criterion: 'Provide recommendations', category: 'actionability' },
    ],
    expectedCalculations: ['growth rate', 'percentage change'],
    expectedInsights: ['revenue trends', 'regional performance'],
    scenarioRequirements: ['trend analysis', 'recommendations'],
    successThresholds: {},
    businessContext: 'E-commerce Q4 analysis',
    dataElements: ['quarterly_sales', 'regional_breakdown'],
  };

  it('1. Cognitive Load Assessor', async () => {
    console.log('\n📊 Testing: COGNITIVE LOAD');
    const assessor = new CognitiveLoadAssessor(llmProvider);
    
    try {
      const result = await assessor.assess(testContext);
      console.log('  ✅ Score:', result.dimensionScore);
      console.log('  📈 Confidence:', result.confidence);
      console.log('  📝 Components:', Object.keys(result.componentScores).length);
      console.log('  🔍 Key Observations:', result.keyObservations?.slice(0, 2));
      
      expect(result.dimensionScore).toBeGreaterThanOrEqual(1);
      expect(result.dimensionScore).toBeLessThanOrEqual(5);
    } catch (error) {
      console.log('  ❌ Error:', error);
      throw error;
    }
  }, 60000);

  it('2. Tool Execution Assessor', async () => {
    console.log('\n📊 Testing: TOOL EXECUTION');
    const assessor = new ToolExecutionAssessor(llmProvider);
    
    try {
      const result = await assessor.assess(testContext);
      console.log('  ✅ Score:', result.dimensionScore);
      console.log('  📈 Confidence:', result.confidence);
      console.log('  📝 Components:', Object.keys(result.componentScores).length);
      
      expect(result.dimensionScore).toBeGreaterThanOrEqual(1);
      expect(result.dimensionScore).toBeLessThanOrEqual(5);
    } catch (error) {
      console.log('  ❌ Error:', error);
      throw error;
    }
  }, 60000);

  it('3. Content Quality Assessor', async () => {
    console.log('\n📊 Testing: CONTENT QUALITY');
    const assessor = new ContentQualityAssessor(llmProvider);
    
    try {
      const result = await assessor.assess(testContext);
      console.log('  ✅ Score:', result.dimensionScore);
      console.log('  📈 Confidence:', result.confidence);
      console.log('  📝 Components:', Object.keys(result.componentScores).length);
      
      expect(result.dimensionScore).toBeGreaterThanOrEqual(1);
      expect(result.dimensionScore).toBeLessThanOrEqual(5);
    } catch (error) {
      console.log('  ❌ Error:', error);
      throw error;
    }
  }, 60000);

  it('4. Memory Integration Assessor', async () => {
    console.log('\n📊 Testing: MEMORY INTEGRATION');
    const assessor = new MemoryIntegrationAssessor(llmProvider);
    
    try {
      const result = await assessor.assess(testContext);
      console.log('  ✅ Score:', result.dimensionScore);
      console.log('  📈 Confidence:', result.confidence);
      console.log('  📝 Components:', Object.keys(result.componentScores).length);
      
      expect(result.dimensionScore).toBeGreaterThanOrEqual(1);
      expect(result.dimensionScore).toBeLessThanOrEqual(5);
    } catch (error) {
      console.log('  ❌ Error:', error);
      throw error;
    }
  }, 60000);

  it('5. Complexity Handling Assessor', async () => {
    console.log('\n📊 Testing: COMPLEXITY HANDLING');
    const assessor = new ComplexityHandlingAssessor(llmProvider);
    
    try {
      const result = await assessor.assess(testContext);
      console.log('  ✅ Score:', result.dimensionScore);
      console.log('  📈 Confidence:', result.confidence);
      console.log('  📝 Components:', Object.keys(result.componentScores).length);
      
      expect(result.dimensionScore).toBeGreaterThanOrEqual(1);
      expect(result.dimensionScore).toBeLessThanOrEqual(5);
    } catch (error) {
      console.log('  ❌ Error:', error);
      throw error;
    }
  }, 60000);

  it('6. Hallucination Control Assessor', async () => {
    console.log('\n📊 Testing: HALLUCINATION CONTROL');
    const assessor = new HallucinationControlAssessor(llmProvider);
    
    try {
      const result = await assessor.assess(testContext);
      console.log('  ✅ Score:', result.dimensionScore);
      console.log('  📈 Confidence:', result.confidence);
      console.log('  📝 Components:', Object.keys(result.componentScores).length);
      
      expect(result.dimensionScore).toBeGreaterThanOrEqual(1);
      expect(result.dimensionScore).toBeLessThanOrEqual(5);
    } catch (error) {
      console.log('  ❌ Error:', error);
      throw error;
    }
  }, 60000);

  it('7. Knowledge Transfer Assessor', async () => {
    console.log('\n📊 Testing: KNOWLEDGE TRANSFER');
    const assessor = new KnowledgeTransferAssessor(llmProvider);
    
    try {
      const result = await assessor.assess(testContext);
      console.log('  ✅ Score:', result.dimensionScore);
      console.log('  📈 Confidence:', result.confidence);
      console.log('  📝 Components:', Object.keys(result.componentScores).length);
      
      expect(result.dimensionScore).toBeGreaterThanOrEqual(1);
      expect(result.dimensionScore).toBeLessThanOrEqual(5);
    } catch (error) {
      console.log('  ❌ Error:', error);
      throw error;
    }
  }, 60000);

  it('8. Processing Efficiency Assessor', async () => {
    console.log('\n📊 Testing: PROCESSING EFFICIENCY');
    const assessor = new ProcessingEfficiencyAssessor(llmProvider);
    
    try {
      const result = await assessor.assess(testContext);
      console.log('  ✅ Score:', result.dimensionScore);
      console.log('  📈 Confidence:', result.confidence);
      console.log('  📝 Components:', Object.keys(result.componentScores).length);
      
      expect(result.dimensionScore).toBeGreaterThanOrEqual(1);
      expect(result.dimensionScore).toBeLessThanOrEqual(5);
    } catch (error) {
      console.log('  ❌ Error:', error);
      throw error;
    }
  }, 60000);

  it('9. Construct Validity Assessor', async () => {
    console.log('\n📊 Testing: CONSTRUCT VALIDITY');
    const assessor = new ConstructValidityAssessor(llmProvider);
    
    try {
      const result = await assessor.assess(testContext);
      console.log('  ✅ Score:', result.dimensionScore);
      console.log('  📈 Confidence:', result.confidence);
      console.log('  📝 Components:', Object.keys(result.componentScores).length);
      
      expect(result.dimensionScore).toBeGreaterThanOrEqual(1);
      expect(result.dimensionScore).toBeLessThanOrEqual(5);
    } catch (error) {
      console.log('  ❌ Error:', error);
      throw error;
    }
  }, 60000);
});
