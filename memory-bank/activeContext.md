# Active Context

## Current Goals

- Tier 1a LLM-based scenario generation fully implemented and production-ready. Generator uses DeepSeek with exact n8n system prompt, function calling for schema enforcement, domain pattern integration (5 per domain), and complete database pipeline via Prisma. All scenarios store to maac_experiment_scenarios table and can be retrieved for MIMIC engine analysis. Ready to generate 18,000 scenarios (4 domains × 3 tiers × 150 reps × 10 configs).

## Current Blockers

- None yet