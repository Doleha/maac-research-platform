# Product Context

Describe the product.

## Overview

Provide a high-level overview of the project.

## Core Features

- Feature 1
- Feature 2

## Technical Stack

- Tech 1
- Tech 2

## Project Description

MAAC Research Platform - Multi-agent AI evaluation system with LLM-based scenario generation, database storage, and MIMIC cognitive engine analysis pipeline



## Architecture

Monorepo (pnpm + Turbo) with apps (API, Dashboard) and packages (experiment-orchestrator, maac-framework, statistical-analysis, shared-types). API uses Express + Prisma + PostgreSQL. Scenario generation uses DeepSeek LLM with function calling for schema enforcement. SSE streaming for real-time progress updates. Database pipeline stores scenarios to maac_experiment_scenarios table for MIMIC engine retrieval.



## Technologies

- TypeScript
- Node.js
- Express
- Prisma ORM
- PostgreSQL
- DeepSeek LLM API (deepseek-chat model)
- SSE (Server-Sent Events)
- pnpm
- Turbo
- Vitest
- Zod



## Libraries and Dependencies

- @prisma/client - Database ORM
- zod - Schema validation
- express - REST API server
- dotenv - Environment variables
- tsx - TypeScript execution
- node-fetch - HTTP client for DeepSeek API
- vitest - Testing framework

