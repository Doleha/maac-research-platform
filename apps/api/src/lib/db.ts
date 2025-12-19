import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Helper functions for common queries
export const dbHelpers = {
  // Get trial by ID
  async getTrial(trialId: string) {
    return db.mAACExperimentalData.findUnique({
      where: { trialId },
    });
  },

  // Get all trials for an experiment
  async getExperimentTrials(experimentId: string) {
    return db.mAACExperimentalData.findMany({
      where: { experimentId },
      orderBy: { createdAt: 'asc' },
    });
  },

  // Get trials by model
  async getTrialsByModel(modelId: string) {
    return db.mAACExperimentalData.findMany({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get completed MAAC assessments
  async getCompletedAssessments() {
    return db.mAACExperimentalData.findMany({
      where: { maacCompleted: true },
      select: {
        trialId: true,
        domain: true,
        tier: true,
        modelId: true,
        maacOverallScore: true,
        maacCognitiveLoad: true,
        maacToolExecution: true,
        maacContentQuality: true,
        maacMemoryIntegration: true,
        maacComplexityHandling: true,
        maacHallucinationControl: true,
        maacKnowledgeTransfer: true,
        maacProcessingEfficiency: true,
        maacConstructValidity: true,
        maacConfidence: true,
      },
    });
  },

  // Store trial result
  async storeTrial(data: {
    experimentId: string;
    trialId: string;
    configId: string;
    domain: string;
    tier: string;
    repetition: number;
    modelId: string;
    response: any;
    metadata: any;
    maacScores?: any;
  }) {
    return db.mAACExperimentalData.create({
      data: {
        experimentId: data.experimentId,
        sessionId: crypto.randomUUID(),
        trialId: data.trialId,
        configId: data.configId,
        domain: data.domain,
        tier: data.tier,
        repetition: data.repetition,
        modelId: data.modelId,
        enabledTools: data.metadata.toolsInvoked || [],
        toolCount: data.metadata.toolsInvokedCount || 0,
        // Map tool configuration...
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
        mimicResponseText: data.response.content,
        wordCount: data.metadata.wordCount,
        processingMetadata: data.metadata,
        cognitiveCyclesCount: data.metadata.cognitiveCyclesCount,
        memoryOperationsCount: data.metadata.memoryOperationsCount,
        toolsInvokedCount: data.metadata.toolsInvokedCount,
        processingMethod: data.metadata.processingMethod,
        complexityAssessment: data.metadata.complexityAssessment,
        processingTime: data.metadata.processingTime,
        // MAAC scores if available
        ...(data.maacScores && {
          maacCognitiveLoad: data.maacScores.cognitiveLoad,
          maacToolExecution: data.maacScores.toolExecution,
          maacContentQuality: data.maacScores.contentQuality,
          maacMemoryIntegration: data.maacScores.memoryIntegration,
          maacComplexityHandling: data.maacScores.complexityHandling,
          maacHallucinationControl: data.maacScores.hallucinationControl,
          maacKnowledgeTransfer: data.maacScores.knowledgeTransfer,
          maacProcessingEfficiency: data.maacScores.processingEfficiency,
          maacConstructValidity: data.maacScores.constructValidity,
          maacOverallScore: data.maacScores.overallScore,
          maacConfidence: data.maacScores.confidence,
          maacCompleted: true,
        }),
      },
    });
  },
};
