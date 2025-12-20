# Charge Matrix & Usage Tracking System

## Overview

The MAAC Research Platform implements a comprehensive token-based billing system that tracks LLM usage and automatically deducts credits from user balances.

## Tier-Based Pricing Model

### Tier 1a: Scenario Generation (PAID ONLY)
- **Base Fee**: 10 credits per scenario batch
- **Token Usage**: Provider-specific rates (see charge matrix)
- **API Keys**: System credentials REQUIRED (no user keys allowed)
- **Use Case**: Generating experimental scenarios using LLM

### Tier 1b: MIMIC Engine Execution (PAID ONLY)
- **Base Fee**: 50 credits per experiment
- **Token Usage**: Provider-specific rates (see charge matrix)
- **API Keys**: System credentials REQUIRED (no user keys allowed)
- **Use Case**: Running MIMIC cognitive engine experiments

### Tier 2: MAAC Assessment & Statistical Analysis (BOTH OPTIONS)
- **Base Fee**: 0 credits
- **Token Usage**: Provider-specific rates (see charge matrix)
- **API Keys**: User choice - use own keys OR purchase credits
- **Use Case**: MAAC dimensional assessment and statistical analysis

## Charge Matrix

Credits are calculated based on actual token usage:

```typescript
1 credit = $0.001 USD (1000 credits = $1.00)

Cost = (inputTokens / 1000) × inputRate + (outputTokens / 1000) × outputRate + baseFee
```

### Sample Rates (per 1000 tokens)

| Provider | Model | Input Cost | Output Cost |
|----------|-------|------------|-------------|
| OpenAI | GPT-4o | 2.5 credits | 10 credits |
| OpenAI | GPT-4o Mini | 0.15 credits | 0.6 credits |
| Anthropic | Claude 3.5 Sonnet | 3 credits | 15 credits |
| Anthropic | Claude 3.5 Haiku | 1 credit | 5 credits |
| DeepSeek | DeepSeek Chat | 0.14 credits | 0.28 credits |
| Gemini | Gemini 1.5 Pro | 1.25 credits | 5 credits |
| Llama | Llama 3.1 405B | 2.7 credits | 2.7 credits |

Full pricing matrix: [`apps/api/src/lib/charge-matrix.ts`](../apps/api/src/lib/charge-matrix.ts)

## Usage Tracking

### Automatic Tracking

All LLM calls are wrapped with the `trackLLMCall()` middleware:

```typescript
import { trackLLMCall } from './lib/usage-tracker';

const result = await trackLLMCall(
  experimentId,
  userId,
  tier,
  provider,
  model,
  async () => {
    // Your LLM call here
    const response = await llm.call(prompt);
    return {
      result: response.text,
      usage: {
        inputTokens: response.usage.promptTokens,
        outputTokens: response.usage.completionTokens,
      },
    };
  }
);
```

### What Gets Tracked

- **Experiment ID**: Links usage to specific experiment
- **User ID**: Identifies account for billing
- **Tier**: Determines base fees and pricing rules
- **Provider/Model**: Determines token pricing rates
- **Input/Output Tokens**: Actual usage from LLM response
- **Credits Charged**: Calculated total cost
- **Timestamp**: When usage occurred

### Database Records

Usage tracking creates two database entries:

1. **User Balance Update**: Decrement credits atomically
2. **Credit Transaction**: Audit log entry with full metadata

```typescript
// Transaction record example
{
  type: 'USAGE',
  amount: -125, // Negative for deductions
  description: '2 - anthropic/claude-3-5-sonnet - Experiment abc123',
  metadata: {
    experimentId: 'abc123',
    tier: '2',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    inputTokens: 2340,
    outputTokens: 1820,
  }
}
```

## Cost Estimation

Before running experiments, users get cost estimates:

```typescript
POST /api/billing/estimate
{
  "tier": "1b",
  "trials": 50,
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022"
}

Response:
{
  "estimatedCost": 1250,
  "costPerTrial": 24,
  "trials": 50,
  "tier": "1b",
  "breakdown": {
    "baseFee": 50,
    "tokenCost": 1200,
    "avgInputTokens": 2000,
    "avgOutputTokens": 1500
  }
}
```

## Insufficient Balance Handling

When credits run out mid-experiment:

1. **Pre-check**: UI blocks experiment creation if balance < estimate
2. **Runtime check**: Each LLM call verifies sufficient balance
3. **Transaction atomicity**: Credit deduction + usage log happen together
4. **Rollback**: If balance goes negative, transaction fails
5. **Error response**: Experiment pauses with "Insufficient credits" error

## Integration Points

### Experiment Creation Form
- Fetches user credit balance on load
- Shows Tier 1 requirements prominently
- Displays real-time cost estimates
- Blocks submission if insufficient balance

### Experiment Orchestrator
- Wraps all LLM calls with tracking middleware
- Catches insufficient balance errors
- Pauses experiment execution
- Records partial results before stopping

### Settings Page
- Credit balance dashboard
- Purchase credits via Stripe
- Transaction history
- Cost analytics

## Security Notes

1. **User Keys (Tier 2)**: Stored in session only, never persisted
2. **System Keys**: Encrypted in database, accessed via secure API
3. **Credit Transactions**: Atomic operations prevent race conditions
4. **Balance Verification**: Checked before each LLM call
5. **Audit Trail**: Complete history of all credit movements

## Future Enhancements

- [ ] Credit expiration policies
- [ ] Volume discounts for high-usage accounts
- [ ] Rollover credits for subscription plans
- [ ] Usage alerts and budget limits
- [ ] Refund processing for failed experiments
- [ ] Real-time balance notifications via WebSocket
