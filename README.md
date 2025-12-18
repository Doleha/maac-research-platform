# MAAC Research Platform

Multi-Agent Adaptive Cognition Research Platform - A TypeScript monorepo for doctoral research.

## Project Structure

```
maac-research-platform/
├── apps/
│   ├── api/                    # Express API server
│   └── dashboard/              # Next.js dashboard
├── packages/
│   ├── maac-framework/         # Open source cognitive evaluation
│   ├── experimental-infrastructure/  # Open source orchestration
│   └── shared-types/           # Shared TypeScript types
├── .devcontainer/              # Development container config
├── docker-compose.yml          # Local development services
└── turbo.json                  # Turborepo configuration
```

## Components

### 📦 Packages

- **@maac/framework**: Open source cognitive evaluation framework
- **@maac/infrastructure**: Experiment orchestration and monitoring
- **@maac/types**: Shared TypeScript type definitions

### 🚀 Apps

- **API**: Express-based REST API (port 3000)
- **Dashboard**: Next.js web interface (port 3001)

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for local services)

### Installation

```bash
# Install dependencies
pnpm install

# Start Docker services (PostgreSQL, Redis, Neo4j, n8n)
docker-compose up -d

# Development mode (all apps)
pnpm dev

# Build all packages
pnpm build
```

### Individual Commands

```bash
# Run API only
cd apps/api && pnpm dev

# Run Dashboard only
cd apps/dashboard && pnpm dev

# Build specific package
cd packages/maac-framework && pnpm build
```

## Environment Setup

Copy `.env` to configure:
- Database connections
- LLM API keys (Anthropic, OpenAI, OpenRouter, DeepSeek)
- Service ports

## Development

### Adding a New Package

```bash
mkdir -p packages/my-package/src
cd packages/my-package
pnpm init
```

### Type Checking

```bash
pnpm typecheck
```

### Formatting

```bash
pnpm format
```

## Architecture

This monorepo uses:
- **Turborepo**: Build system and task orchestration
- **pnpm workspaces**: Package management
- **TypeScript project references**: Incremental builds
- **Docker Compose**: Local development services

## License

- **MAAC Framework**: MIT (Open Source)
- **Experimental Infrastructure**: MIT (Open Source)
- **MIMIC Cognitive Engine**: Private (separate repository)

## Note on MIMIC

The MIMIC Cognitive Engine is maintained in a private repository and is not included in this open source monorepo.

---

*Part of doctoral research on multi-agent cognitive systems.*
