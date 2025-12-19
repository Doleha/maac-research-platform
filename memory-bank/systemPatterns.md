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


## LLM-Based Scenario Generation Pipeline

Production-level pipeline for generating MAAC experiment scenarios using DeepSeek LLM with schema enforcement and database storage.

**Components:**
1. LLM Scenario Generator (/packages/experiment-orchestrator/src/scenarios/llm-scenario-generator.ts)
   - TASK_GENERATOR_SYSTEM_PROMPT: Exact copy from n8n Tier 1a workflow with complete example scenario embedded
   - LLMScenarioOutputSchema: Zod schema matching n8n jsonSchemaExample structure
   - generateScenario(): Core generation with domain pattern integration (5 patterns per domain, cycling)
   - callDeepSeekAPI(): Function calling with tools API, enforces schema via generate_maac_scenario function
   - parseAndValidateResponse(): Validates against schema, checks expected_calculations and success_thresholds not empty

2. Domain Patterns (/packages/experiment-orchestrator/src/scenarios/domain-patterns.ts)
   - 5 patterns per domain (problem_solving, creative_thinking, strategic_planning, data_analysis)
   - Patterns cycle based on repetition number (repetition % 5)
   - Provides context for LLM to generate domain-appropriate scenarios

3. API Endpoint (/apps/api/src/routes/scenarios.ts)
   - POST /scenarios/generate-llm-stream: SSE streaming endpoint
   - Generates scenarios with progress callbacks
   - Maps scenario fields to database schema
   - Batch inserts to maac_experiment_scenarios table (50 at a time)
   - Returns experiment ID and generation summary

**Schema Structure (14 top-level fields):**
- task_id, task_title, task_description, business_context
- scenario_type, scenario_number
- requirements (array of 5 items)
- success_criteria (array of 6 items)
- complexity_level, estimated_duration
- domain_specific_data (data_elements, calculations_required, industry_context, business_function)
- control_expectations (expected_calculations: 12 key-value pairs, expected_insights: 5, expected_trends: 4, success_thresholds: 6 items)
- MAAC_cognitive_requirements (primary_dimensions_tested: 4, cognitive_complexity_level, memory_integration_opportunities: 4, knowledge_transfer_elements: 4, expected_tool_usage_patterns: 5)
- metadata (11 fields including source_agent, experiment_id, business_domain, condition_id, task_id, timestamp, complexity_justification, MAAC_framework_version)

**Usage:**
```typescript
// Generate scenarios
const generator = createLLMScenarioGenerator({ deepseekApiKey: process.env.DEEPSEEK_API_KEY });
const scenarios = await generator.generateScenarios({
  domains: ['problem_solving'],
  tiers: ['simple'],
  repetitions: 150,
  model: 'deepseek-chat',
  onProgress: (event) => console.log(event.message)
});

// Scenarios auto-stored to DB via API endpoint
// Retrieve later: prisma.mAACExperimentScenario.findMany({ where: { experimentId } })
```

**Performance:**
- ~49 seconds per scenario with DeepSeek
- Batch generation with progress callbacks
- SSE streaming for real-time feedback
- Database storage in batches of 50

**Validation:**
- Function calling enforces schema at generation time
- Post-validation checks expected_calculations and success_thresholds not empty
- All fields verified in test output (problem_solving-simple-rep1)


### Examples

- /packages/experiment-orchestrator/src/scenarios/llm-scenario-generator.ts - Complete LLM generator implementation
- /apps/api/src/routes/scenarios.ts - POST /scenarios/generate-llm-stream endpoint (lines 600-700)
- /scripts/test-llm-generator.ts - Test script showing complete scenario JSON output
- context/n8n-workflow-analysis.md - Production n8n workflow reference documentation
