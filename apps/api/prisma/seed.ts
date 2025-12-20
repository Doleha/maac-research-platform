import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users with initial credits
  const testUser = await prisma.user.upsert({
    where: { email: 'test@maac-research.com' },
    update: {},
    create: {
      email: 'test@maac-research.com',
      name: 'Test User',
      credits: 50000, // Start with 50,000 credits ($50 worth)
      creditTransactions: {
        create: {
          type: 'PURCHASE',
          amount: 50000,
          description: 'Initial credit allocation for testing',
          stripePaymentIntentId: 'pi_test_initial',
        },
      },
    },
  });

  console.log('✅ Created test user:', testUser.email);
  console.log(`   Credits: ${testUser.credits.toLocaleString()}`);

  // Create admin user with higher credits
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@maac-research.com' },
    update: {},
    create: {
      email: 'admin@maac-research.com',
      name: 'Admin User',
      credits: 500000, // Start with 500,000 credits ($500 worth)
      creditTransactions: {
        create: {
          type: 'PURCHASE',
          amount: 500000,
          description: 'Admin account initial allocation',
        },
      },
    },
  });

  console.log('✅ Created admin user:', adminUser.email);
  console.log(`   Credits: ${adminUser.credits.toLocaleString()}`);

  console.log('');
  console.log('Seeding existing sample experiments...');

  // Create sample experiment (or skip if exists)
  const experiment = await prisma.mAACExperimentScenario.upsert({
    where: { scenarioId: 'analytical-simple-000' },
    update: {},
    create: {
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
      userId: testUser.id,
      apiKeyMode: 'system',
      estimatedCredits: 150,
    },
  });

  console.log('Created sample scenario:', experiment.scenarioId);

  // Create sample trial result (or skip if exists)
  const trial = await prisma.mAACExperimentalData.upsert({
    where: { trialId: 'analytical-simple-000-rep0-deepseek_v3' },
    update: {},
    create: {
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
      // MAAC scores use 1-5 Likert scale
      maacCognitiveLoad: 3.8,
      maacToolExecution: 1.0,
      maacContentQuality: 4.0,
      maacMemoryIntegration: 1.0,
      maacComplexityHandling: 3.5,
      maacHallucinationControl: 4.3,
      maacKnowledgeTransfer: 3.8,
      maacProcessingEfficiency: 4.0,
      maacConstructValidity: 4.0,
      maacOverallScore: 3.6,
      maacConfidence: 0.85,
      maacCompleted: true,
      publicationReady: false,
    },
  });

  console.log('Created sample trial:', trial.trialId);
  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('Test accounts:');
  console.log('  - test@maac-research.com (50,000 credits)');
  console.log('  - admin@maac-research.com (500,000 credits)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
