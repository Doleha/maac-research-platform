# Production Dockerfile for MAAC API
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/maac-framework/package.json ./packages/maac-framework/
COPY packages/experiment-orchestrator/package.json ./packages/experiment-orchestrator/
COPY packages/experimental-infrastructure/package.json ./packages/experimental-infrastructure/
COPY packages/statistical-analysis/package.json ./packages/statistical-analysis/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY . .

# Generate Prisma Client
WORKDIR /app/apps/api
RUN pnpm exec prisma generate

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy built application
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/apps/api ./apps/api
COPY --from=builder --chown=fastify:nodejs /app/packages ./packages
COPY --from=builder --chown=fastify:nodejs /app/package.json ./
COPY --from=builder --chown=fastify:nodejs /app/pnpm-workspace.yaml ./

USER fastify

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "--loader", "tsx", "src/index.ts"]
