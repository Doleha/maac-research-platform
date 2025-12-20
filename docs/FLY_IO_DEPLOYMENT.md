# Fly.io Deployment Guide for MAAC Research Platform

## Prerequisites

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login to Fly.io:
   ```bash
   fly auth login
   ```

## Services Architecture

Your platform will run 6 services on Fly.io:

1. **maac-api** - Fastify backend (Node.js)
2. **maac-dashboard** - Next.js frontend
3. **maac-postgres** - PostgreSQL database (Fly managed)
4. **maac-redis** - Redis (Fly managed)
5. **maac-neo4j** - Neo4j graph database (Docker)
6. **maac-python** - Python statistics engine (Docker)

## Step-by-Step Deployment

### 1. Create PostgreSQL Database

```bash
fly postgres create --name maac-postgres --region iad --initial-cluster-size 1
```

Note the connection string output.

### 2. Create Redis Instance

```bash
fly redis create --name maac-redis --region iad
```

Note the Redis URL output.

### 3. Deploy API Backend

```bash
cd apps/api

# Create the app (first time only)
fly launch --no-deploy --name maac-api --region iad

# Set environment variables
fly secrets set \
  DATABASE_URL="postgresql://user:pass@maac-postgres.internal:5432/maac_research" \
  REDIS_URL="redis://default:password@maac-redis.internal:6379" \
  LLM_API_KEY="your-key" \
  ANTHROPIC_API_KEY="your-key" \
  OPENAI_API_KEY="your-key" \
  OPENROUTER_API_KEY="your-key" \
  DEEPSEEK_API_KEY="your-key" \
  GROK_API_KEY="your-key" \
  GEMINI_API_KEY="your-key" \
  STRIPE_SECRET_KEY="your-key" \
  STRIPE_PUBLISHABLE_KEY="your-key" \
  NEO4J_URI="bolt://maac-neo4j.internal:7687" \
  NEO4J_USERNAME="neo4j" \
  NEO4J_PASSWORD="your-neo4j-password"

# Run database migrations
fly ssh console -C "cd apps/api && npx prisma migrate deploy"

# Deploy
fly deploy
```

### 4. Deploy Dashboard Frontend

```bash
cd apps/dashboard

# Create the app (first time only)
fly launch --no-deploy --name maac-dashboard --region iad

# Set environment variables
fly secrets set \
  NEXT_PUBLIC_API_URL="https://maac-api.fly.dev"

# Deploy
fly deploy
```

### 5. Deploy Neo4j (Memory/Graph DB)

```bash
cd ../../services

# Create directory for Neo4j
mkdir -p neo4j-fly

cat > neo4j-fly/fly.toml << 'EOF'
app = "maac-neo4j"
primary_region = "iad"

[build]
  image = "neo4j:5.13.0"

[env]
  NEO4J_AUTH = "neo4j/your-strong-password"
  NEO4J_PLUGINS = '["apoc"]'

[[mounts]]
  source = "neo4j_data"
  destination = "/data"

[http_service]
  internal_port = 7474
  force_https = false
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  protocol = "tcp"
  internal_port = 7687

  [[services.ports]]
    port = 7687

[[services]]
  protocol = "tcp"
  internal_port = 7474

  [[services.ports]]
    port = 7474
EOF

# Create volume for persistent data
fly volumes create neo4j_data --region iad --size 10

# Deploy
fly deploy neo4j-fly
```

### 6. Deploy Python Statistics Engine

```bash
cd ../python-stat-engine

cat > fly.toml << 'EOF'
app = "maac-python"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8000
  force_https = false
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[vm]
  memory = "512mb"
  cpus = 1
EOF

# Deploy
fly deploy
```

## Networking

All services communicate via Fly's private network using `.internal` domains:

- API → PostgreSQL: `maac-postgres.internal:5432`
- API → Redis: `maac-redis.internal:6379`
- API → Neo4j: `maac-neo4j.internal:7687`
- API → Python: `maac-python.internal:8000`
- Dashboard → API: `https://maac-api.fly.dev` (public)

## Environment Variables Summary

### API (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@maac-postgres.internal:5432/maac_research

# Redis
REDIS_URL=redis://default:password@maac-redis.internal:6379

# Neo4j
NEO4J_URI=bolt://maac-neo4j.internal:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-password

# LLM Keys
LLM_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...
DEEPSEEK_API_KEY=...
GROK_API_KEY=...
GEMINI_API_KEY=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Application
NODE_ENV=production
API_PORT=3000
```

### Dashboard (.env)
```bash
NEXT_PUBLIC_API_URL=https://maac-api.fly.dev
```

## Useful Commands

```bash
# View logs
fly logs --app maac-api
fly logs --app maac-dashboard

# Scale resources
fly scale memory 1024 --app maac-api
fly scale count 2 --app maac-api

# SSH into container
fly ssh console --app maac-api

# View status
fly status --app maac-api

# List all apps
fly apps list

# Open dashboard in browser
fly open --app maac-dashboard

# Check costs
fly platform status
```

## Cost Estimate (Monthly)

- **API** (1GB RAM): ~$10
- **Dashboard** (512MB RAM): ~$5
- **PostgreSQL** (Shared): Free or $3
- **Redis** (Shared): Free or $3
- **Neo4j** (512MB + 10GB storage): ~$5
- **Python** (512MB): ~$5

**Total: ~$20-30/month** (with free tiers)

## Troubleshooting

### Database connection issues
```bash
# Test connection from API
fly ssh console --app maac-api -C "nc -zv maac-postgres.internal 5432"
```

### Check service health
```bash
fly checks list --app maac-api
```

### View resource usage
```bash
fly status --app maac-api
```

## Rollback

```bash
# View releases
fly releases --app maac-api

# Rollback to previous version
fly releases rollback --app maac-api
```

## Production Checklist

- [ ] Set strong passwords for PostgreSQL, Redis, Neo4j
- [ ] Configure Stripe webhook URL in Stripe dashboard
- [ ] Add custom domain (optional): `fly certs add yourdomain.com`
- [ ] Enable auto-scaling: `fly autoscale set min=1 max=3`
- [ ] Set up monitoring: Fly.io dashboard or external APM
- [ ] Configure backups for PostgreSQL
- [ ] Test all API endpoints
- [ ] Test LLM model fetching
- [ ] Test billing/Stripe integration
- [ ] Test experiment workflows
