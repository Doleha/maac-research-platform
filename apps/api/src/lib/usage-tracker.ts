/**
 * Usage Tracker
 *
 * Tracks LLM token usage and deducts credits from user balance
 */

import { PrismaClient } from '@prisma/client';
import { calculateCreditCost, getTierBaseFee } from './charge-matrix';

const prisma = new PrismaClient();

export interface UsageRecord {
  experimentId: string;
  userId: string;
  tier: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  creditsCharged: number;
  timestamp: Date;
}

/**
 * Track LLM usage and deduct credits
 *
 * TODO: Requires Prisma schema additions:
 * - User model with credits field
 * - CreditTransaction model for audit log
 */
export async function trackUsageAndDeduct(record: UsageRecord): Promise<void> {
  const { userId, creditsCharged, experimentId, tier, provider, model, inputTokens, outputTokens } =
    record;

  // TODO: Implement once User and CreditTransaction models are added to Prisma schema
  console.log('[Usage Tracker] Recording usage:', {
    userId,
    experimentId,
    tier,
    provider,
    model,
    inputTokens,
    outputTokens,
    creditsCharged,
  });

  /* 
  // Start transaction
  await prisma.$transaction(async (tx) => {
    // Deduct credits from user balance
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: creditsCharged,
        },
      },
    });

    if (user.credits < 0) {
      throw new Error('Insufficient credits');
    }

    // Record usage in transactions table
    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'USAGE',
        amount: -creditsCharged,
        description: `${tier} - ${provider}/${model} - Experiment ${experimentId}`,
        metadata: {
          experimentId,
          tier,
          provider,
          model,
          inputTokens,
          outputTokens,
        },
      },
    });
  });
  */
}

/**
 * Calculate total cost for experiment before running
 */
export async function estimateExperimentCost(
  tier: string,
  provider: string,
  model: string,
  estimatedTrials: number,
  avgTokensPerTrial: { input: number; output: number },
): Promise<{
  totalCredits: number;
  breakdown: {
    baseFee: number;
    tokenCost: number;
    perTrialCost: number;
  };
}> {
  const baseFee = getTierBaseFee(tier);
  const perTrialTokenCost = calculateCreditCost(
    provider,
    model,
    avgTokensPerTrial.input,
    avgTokensPerTrial.output,
  );
  const totalTokenCost = perTrialTokenCost * estimatedTrials;
  const totalCredits = baseFee + totalTokenCost;

  return {
    totalCredits,
    breakdown: {
      baseFee,
      tokenCost: totalTokenCost,
      perTrialCost: perTrialTokenCost,
    },
  };
}

/**
 * Check if user has sufficient credits
 *
 * TODO: Implement once User model is added to Prisma schema
 */
export async function checkSufficientCredits(
  userId: string,
  requiredCredits: number,
): Promise<boolean> {
  // TODO: Implement once User model exists
  console.log('[Usage Tracker] Checking credits:', { userId, requiredCredits });

  // Placeholder - always returns true for now
  return true;

  /*
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  return (user?.credits ?? 0) >= requiredCredits;
  */
}

/**
 * Middleware to wrap LLM calls and track usage
 */
export async function trackLLMCall<T>(
  experimentId: string,
  userId: string,
  tier: string,
  provider: string,
  model: string,
  llmCall: () => Promise<{
    result: T;
    usage: { inputTokens: number; outputTokens: number };
  }>,
): Promise<T> {
  // Execute LLM call
  const { result, usage } = await llmCall();

  // Calculate cost
  const creditsCharged = calculateCreditCost(
    provider,
    model,
    usage.inputTokens,
    usage.outputTokens,
  );

  // Track and deduct
  await trackUsageAndDeduct({
    experimentId,
    userId,
    tier,
    provider,
    model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    creditsCharged,
    timestamp: new Date(),
  });

  return result;
}
