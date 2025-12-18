# API

Private Fastify backend API for the MAAC Research Platform.

## Overview

This is the main backend API server built with Fastify. It provides:

- RESTful endpoints for experiment management
- Cognitive evaluation services
- Statistical analysis endpoints
- Database integration with Prisma

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run database migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Cognitive Evaluation
- `POST /evaluate` - Evaluate cognitive input

### Experiments
- `GET /experiments` - List all experiment runs
- `GET /experiments/:id` - Get specific experiment run

### Statistical Analysis
- `POST /analyze` - Analyze numerical data

## Environment Variables

See `.env` file for configuration options.

## License

Private - Not for distribution
