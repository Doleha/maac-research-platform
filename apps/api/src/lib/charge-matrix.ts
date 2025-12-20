/**
 * Charge Matrix
 *
 * Defines credit costs for different tiers and LLM providers
 */

export interface ChargeRate {
  // Credits per 1000 tokens (input)
  inputTokenCost: number;
  // Credits per 1000 tokens (output)
  outputTokenCost: number;
  // Flat fee per request (optional)
  baseFee?: number;
}

/**
 * Charge rates by provider and model
 * 1 credit = $0.001 USD (1000 credits = $1)
 */
export const CHARGE_MATRIX: Record<string, Record<string, ChargeRate>> = {
  openai: {
    'gpt-4o': { inputTokenCost: 2.5, outputTokenCost: 10 }, // $0.0025/$0.01 per 1K tokens
    'gpt-4o-mini': { inputTokenCost: 0.15, outputTokenCost: 0.6 }, // $0.00015/$0.0006 per 1K tokens
    'gpt-4-turbo': { inputTokenCost: 10, outputTokenCost: 30 }, // $0.01/$0.03 per 1K tokens
    'gpt-4': { inputTokenCost: 30, outputTokenCost: 60 }, // $0.03/$0.06 per 1K tokens
    'gpt-3.5-turbo': { inputTokenCost: 0.5, outputTokenCost: 1.5 }, // $0.0005/$0.0015 per 1K tokens
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': { inputTokenCost: 3, outputTokenCost: 15 }, // $0.003/$0.015 per 1K tokens
    'claude-3-5-haiku-20241022': { inputTokenCost: 1, outputTokenCost: 5 }, // $0.001/$0.005 per 1K tokens
    'claude-3-opus-20240229': { inputTokenCost: 15, outputTokenCost: 75 }, // $0.015/$0.075 per 1K tokens
    'claude-3-sonnet-20240229': { inputTokenCost: 3, outputTokenCost: 15 }, // $0.003/$0.015 per 1K tokens
    'claude-3-haiku-20240307': { inputTokenCost: 0.25, outputTokenCost: 1.25 }, // $0.00025/$0.00125 per 1K tokens
  },
  deepseek: {
    'deepseek-chat': { inputTokenCost: 0.14, outputTokenCost: 0.28 }, // $0.00014/$0.00028 per 1K tokens
    'deepseek-coder': { inputTokenCost: 0.14, outputTokenCost: 0.28 }, // $0.00014/$0.00028 per 1K tokens
  },
  openrouter: {
    'anthropic/claude-3.5-sonnet': { inputTokenCost: 3, outputTokenCost: 15, baseFee: 0.5 },
    'openai/gpt-4-turbo': { inputTokenCost: 10, outputTokenCost: 30, baseFee: 0.5 },
    'google/gemini-pro-1.5': { inputTokenCost: 1.25, outputTokenCost: 5, baseFee: 0.5 },
    'meta-llama/llama-3.1-405b-instruct': { inputTokenCost: 2.7, outputTokenCost: 2.7, baseFee: 0.5 },
  },
  grok: {
    'grok-2-1212': { inputTokenCost: 2, outputTokenCost: 10 }, // Estimated pricing
    'grok-2-vision-1212': { inputTokenCost: 2, outputTokenCost: 10 },
    'grok-beta': { inputTokenCost: 5, outputTokenCost: 15 },
  },
  gemini: {
    'gemini-2.0-flash-exp': { inputTokenCost: 0, outputTokenCost: 0 }, // Free during experimental
    'gemini-exp-1206': { inputTokenCost: 0, outputTokenCost: 0 }, // Free during experimental
    'gemini-1.5-pro': { inputTokenCost: 1.25, outputTokenCost: 5 }, // $0.00125/$0.005 per 1K tokens
    'gemini-1.5-flash': { inputTokenCost: 0.075, outputTokenCost: 0.3 }, // $0.000075/$0.0003 per 1K tokens
  },
  llama: {
    'meta-llama/Meta-Llama-3.1-405B-Instruct': { inputTokenCost: 2.7, outputTokenCost: 2.7 },
    'meta-llama/Meta-Llama-3.1-70B-Instruct': { inputTokenCost: 0.88, outputTokenCost: 0.88 },
    'meta-llama/Meta-Llama-3.1-8B-Instruct': { inputTokenCost: 0.18, outputTokenCost: 0.18 },
    'meta-llama/Llama-3.2-90B-Vision-Instruct': { inputTokenCost: 1, outputTokenCost: 1 },
  },
};

/**
 * Tier-based service fees
 */
export const TIER_FEES = {
  '1a': {
    name: 'Scenario Generation',
    baseFee: 10, // Flat fee per scenario generated
    requiresSystemCredits: true,
  },
  '1b': {
    name: 'MIMIC Engine Execution',
    baseFee: 50, // Flat fee per experiment run
    requiresSystemCredits: true,
  },
  '2': {
    name: 'MAAC Assessment + Statistical Analysis',
    baseFee: 0, // No flat fee, only token usage
    requiresSystemCredits: false, // Can use own keys
  },
};

/**
 * Calculate credit cost for LLM usage
 */
export function calculateCreditCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const providerRates = CHARGE_MATRIX[provider.toLowerCase()];
  if (!providerRates) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const modelRate = providerRates[model];
  if (!modelRate) {
    // Use average rate if specific model not found
    const rates = Object.values(providerRates);
    const avgInputCost = rates.reduce((sum, r) => sum + r.inputTokenCost, 0) / rates.length;
    const avgOutputCost = rates.reduce((sum, r) => sum + r.outputTokenCost, 0) / rates.length;
    
    return (
      (inputTokens / 1000) * avgInputCost +
      (outputTokens / 1000) * avgOutputCost
    );
  }

  const cost =
    (inputTokens / 1000) * modelRate.inputTokenCost +
    (outputTokens / 1000) * modelRate.outputTokenCost +
    (modelRate.baseFee || 0);

  return Math.ceil(cost); // Round up to nearest credit
}

/**
 * Check if tier requires system credits (no own-key option)
 */
export function requiresSystemCredits(tier: string): boolean {
  return TIER_FEES[tier as keyof typeof TIER_FEES]?.requiresSystemCredits ?? false;
}

/**
 * Get tier base fee
 */
export function getTierBaseFee(tier: string): number {
  return TIER_FEES[tier as keyof typeof TIER_FEES]?.baseFee ?? 0;
}
