# System Patterns

## Architectural Patterns

- Pattern 1: Description

## Design Patterns

- Pattern 1: Description

## Common Idioms

- Idiom 1: Description

## Running TypeScript scripts in the workspace

Use `npx tsx script.ts` to run TypeScript files directly without compilation issues. Never use `ts-node --esm` as it has module resolution problems. The tsx package handles ESM and TypeScript seamlessly.

### Examples

- npx tsx scripts/test-llm-generator.ts
- npx tsx scripts/validate-setup.ts


## Loading environment variables for testing

The project has a .env file at /workspaces/maac-research-platform/.env with API keys. To load DEEPSEEK_API_KEY: export DEEPSEEK_API_KEY=$(grep DEEPSEEK_API_KEY .env | cut -d'=' -f2 | tr -d '"'). Do NOT use 'source .env' as it keeps quotes in values.

### Examples

- export DEEPSEEK_API_KEY=$(grep DEEPSEEK_API_KEY .env | cut -d'=' -f2 | tr -d '"') && npx tsx scripts/test.ts


## Tier 1a LLM Scenario Generation - Production Implementation

The LLM scenario generator at /packages/experiment-orchestrator/src/scenarios/llm-scenario-generator.ts is PRODUCTION-READY and WORKING. It uses DeepSeek API with function calling to enforce the exact n8n schema. The generator successfully produces valid scenarios with all required fields (expected_calculations, success_thresholds, MAAC_cognitive_requirements) in ~45 seconds per scenario. Test with: export DEEPSEEK_API_KEY=$(grep DEEPSEEK_API_KEY .env | cut -d'=' -f2 | tr -d '\"') && npx tsx scripts/test-llm-generator.ts

### Examples

- LLMScenarioGenerator with DeepSeek function calling
- ScenarioGenerationProgress SSE streaming
- Production-level validation matching n8n Validate Output node


## Tier 1a LLM Scenario Generation - PRODUCTION COMPLETE

The LLM scenario generator now uses the EXACT n8n system prompt with complete example scenario embedded. It generates scenarios based on the 5 domain patterns per domain (cycling through patterns using repetition % 5). Test confirmed: analytical-simple-rep1 generated customer_segmentation_analysis pattern with 13 expected_calculations, proper MAAC requirements, and full schema compliance. Ready for 18,000 scenario generation (4 domains × 3 tiers × 150 repetitions × 10 configs).

### Examples

- export DEEPSEEK_API_KEY=$(grep DEEPSEEK_API_KEY .env | cut -d'=' -f2 | tr -d '"') && npx tsx scripts/test-llm-generator.ts
- Generates scenarios matching n8n Domain Pattern Examples exactly
- 52 seconds per scenario with DeepSeek function calling
