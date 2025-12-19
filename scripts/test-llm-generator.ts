#!/usr/bin/env npx ts-node
/**
 * Test script for LLM Scenario Generator
 *
 * Usage:
 *   DEEPSEEK_API_KEY="your-key" npx ts-node scripts/test-llm-generator.ts
 */

import { LLMScenarioGenerator } from '../packages/experiment-orchestrator/src/scenarios/llm-scenario-generator';

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('❌ DEEPSEEK_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('✅ DeepSeek API key found');
  console.log('Creating LLM Scenario Generator...\n');

  const generator = new LLMScenarioGenerator({
    deepseekApiKey: apiKey,
    domains: ['problem_solving'],
    tiers: ['simple'],
    maxRetries: 3,
    rateLimitDelayMs: 1000,
  });

  console.log('Configuration:');
  console.log(JSON.stringify(generator.getConfigurationSummary(), null, 2));
  console.log('\n📝 Generating 1 scenario (problem_solving/simple)...\n');

  try {
    const startTime = Date.now();

    const scenarios = await generator.generateScenarios({
      domains: ['problem_solving'],
      tiers: ['simple'],
      repetitions: 1,
      model: 'deepseek_v3',
      onProgress: (progress) => {
        console.log(`[${progress.type}] ${progress.message}`);
        if (progress.elapsedMs) {
          console.log(`  Elapsed: ${(progress.elapsedMs / 1000).toFixed(1)}s`);
        }
        if (progress.estimatedRemainingMs) {
          console.log(
            `  Estimated remaining: ${(progress.estimatedRemainingMs / 1000).toFixed(1)}s`,
          );
        }
      },
    });

    const endTime = Date.now();
    console.log(
      `\n✅ Generated ${scenarios.length} scenario(s) in ${((endTime - startTime) / 1000).toFixed(1)}s\n`,
    );

    for (const scenario of scenarios) {
      console.log('='.repeat(80));
      console.log('COMPLETE SCENARIO JSON OUTPUT:');
      console.log('='.repeat(80));
      console.log(JSON.stringify(scenario, null, 2));
      console.log('='.repeat(80));
      console.log('Generation Time:', `${scenario.generationDurationMs}ms`);
      console.log('='.repeat(80));
    }
  } catch (error) {
    console.error('❌ Error generating scenario:', error);
    process.exit(1);
  }
}

main();
