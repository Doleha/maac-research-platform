import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample experiment
  const experiment = await prisma.mAACExperimentScenario.create({
    data: {
      experimentId: 'exp-seed-001',
      scenarioId: 'analytical-simple-000',
      domain: 'analytical',
      tier: 'simple',
      repetition: 0,
      configId: '000000000000',
      modelId: 'deepseek_v3',
      taskTitle: 'Sample Analytical Task',
      taskDescription: 'Calculate ROI for a project investment.',
      businessContext: 'Company considering software investment',
      successCriteria: [
        { criterion: 'Calculate ROI correctly', weight: 0.4, category: 'accuracy' },
        { criterion: 'Explain reasoning', weight: 0.3, category: 'completeness' },
        { criterion: 'Consider risks', weight: 0.3, category: 'reasoning' },
      ],
      expectedCalculations: ['ROI = (Gain - Cost) / Cost * 100'],
      expectedInsights: ['ROI metric', 'Payback period', 'Risk assessment'],
      scenarioRequirements: ['Financial calculation', 'Risk analysis', 'Recommendation'],
      completed: false,
    },
  });

  console.log('Created sample scenario:', experiment.scenarioId);

  // Create sample trial result
  const trial = await prisma.mAACExperimentalData.create({
    data: {
      experimentId: 'exp-seed-001',
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      trialId: 'analytical-simple-000-rep0-deepseek_v3',
      configId: '000000000000',
      domain: 'analytical',
      tier: 'simple',
      repetition: 0,
      modelId: 'deepseek_v3',
      enabledTools: [],
      toolCount: 0,
      goalEngineEnabled: false,
      planningEngineEnabled: false,
      clarificationEngineEnabled: false,
      validationEngineEnabled: false,
      evaluationEngineEnabled: false,
      reflectionEngineEnabled: false,
      memoryStoreEnabled: false,
      memoryNodeQueryEnabled: false,
      memoryContextQueryEnabled: false,
      memoryEvalQueryEnabled: false,
      memoryReflQueryEnabled: false,
      thinkToolEnabled: false,
      mimicResponseText: 'Sample response for ROI calculation...',
      wordCount: 150,
      processingMetadata: {
        started: new Date().toISOString(),
        completed: new Date().toISOString(),
      },
      cognitiveCyclesCount: 1,
      memoryOperationsCount: 0,
      toolsInvokedCount: 0,
      processingMethod: 'direct',
      complexityAssessment: 'simple',
      processingTime: 5000,
      maacCognitiveLoad: 7.5,
      maacToolExecution: 0,
      maacContentQuality: 8.0,
      maacMemoryIntegration: 0,
      maacComplexityHandling: 7.0,
      maacHallucinationControl: 8.5,
      maacKnowledgeTransfer: 7.5,
      maacProcessingEfficiency: 8.0,
      maacConstructValidity: 8.0,
      maacOverallScore: 7.2,
      maacConfidence: 0.85,
      maacCompleted: true,
      publicationReady: false,
    },
  });

  console.log('Created sample trial:', trial.trialId);
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
