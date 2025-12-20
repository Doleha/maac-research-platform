#!/bin/bash
set -e

echo "🚀 MAAC Research Platform - Fly.io Deployment"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo -e "${RED}❌ Fly CLI not found${NC}"
    echo "Install it with: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

echo -e "${GREEN}✓ Fly CLI installed${NC}"

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Fly.io${NC}"
    echo "Login with: fly auth login"
    exit 1
fi

echo -e "${GREEN}✓ Logged in to Fly.io${NC}"
echo ""

# Function to prompt for env var
get_secret() {
    local var_name=$1
    local prompt_text=$2
    local current_value=$3
    
    if [ -n "$current_value" ]; then
        echo -e "${BLUE}$prompt_text${NC}"
        echo "Current: $current_value"
        read -p "Press enter to use current value or enter new value: " new_value
        if [ -z "$new_value" ]; then
            echo "$current_value"
        else
            echo "$new_value"
        fi
    else
        read -p "$prompt_text: " value
        echo "$value"
    fi
}

# Step 1: PostgreSQL
echo -e "${BLUE}Step 1: Creating PostgreSQL database...${NC}"
if fly apps list | grep -q "maac-postgres"; then
    echo "✓ maac-postgres already exists"
else
    fly postgres create --name maac-postgres --region iad --initial-cluster-size 1
fi
echo ""

# Step 2: Redis
echo -e "${BLUE}Step 2: Creating Redis instance...${NC}"
if fly apps list | grep -q "maac-redis"; then
    echo "✓ maac-redis already exists"
else
    fly redis create --name maac-redis --region iad
fi
echo ""

# Step 3: Get database URLs
echo -e "${BLUE}Step 3: Getting database connection strings...${NC}"
DATABASE_URL=$(fly postgres connect --app maac-postgres | grep "postgres://" | head -1)
REDIS_URL=$(fly redis status --app maac-redis | grep "redis://" | head -1)
echo "✓ Database URLs retrieved"
echo ""

# Step 4: Collect secrets
echo -e "${BLUE}Step 4: Collecting environment variables...${NC}"
echo "You'll need the following API keys:"
echo ""

# Load from .env if exists
if [ -f "apps/api/.env" ]; then
    source apps/api/.env
fi

LLM_API_KEY=$(get_secret "LLM_API_KEY" "LLM API Key" "$LLM_API_KEY")
ANTHROPIC_API_KEY=$(get_secret "ANTHROPIC_API_KEY" "Anthropic API Key" "$ANTHROPIC_API_KEY")
OPENAI_API_KEY=$(get_secret "OPENAI_API_KEY" "OpenAI API Key" "$OPENAI_API_KEY")
OPENROUTER_API_KEY=$(get_secret "OPENROUTER_API_KEY" "OpenRouter API Key" "$OPENROUTER_API_KEY")
DEEPSEEK_API_KEY=$(get_secret "DEEPSEEK_API_KEY" "DeepSeek API Key" "$DEEPSEEK_API_KEY")
GROK_API_KEY=$(get_secret "GROK_API_KEY" "Grok API Key (optional)" "$GROK_API_KEY")
GEMINI_API_KEY=$(get_secret "GEMINI_API_KEY" "Gemini API Key (optional)" "$GEMINI_API_KEY")
STRIPE_SECRET_KEY=$(get_secret "STRIPE_SECRET_KEY" "Stripe Secret Key" "$STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY=$(get_secret "STRIPE_PUBLISHABLE_KEY" "Stripe Publishable Key" "$STRIPE_PUBLISHABLE_KEY")
NEO4J_PASSWORD=$(get_secret "NEO4J_PASSWORD" "Neo4j Password" "neo4j-secure-password")
echo ""

# Step 5: Deploy API
echo -e "${BLUE}Step 5: Deploying API backend...${NC}"
cd apps/api

if ! fly apps list | grep -q "maac-api"; then
    echo "Creating maac-api app..."
    fly launch --no-deploy --name maac-api --region iad
fi

echo "Setting secrets..."
fly secrets set \
  DATABASE_URL="$DATABASE_URL" \
  REDIS_URL="$REDIS_URL" \
  LLM_API_KEY="$LLM_API_KEY" \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
  DEEPSEEK_API_KEY="$DEEPSEEK_API_KEY" \
  GROK_API_KEY="$GROK_API_KEY" \
  GEMINI_API_KEY="$GEMINI_API_KEY" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY" \
  NEO4J_URI="bolt://maac-neo4j.internal:7687" \
  NEO4J_USERNAME="neo4j" \
  NEO4J_PASSWORD="$NEO4J_PASSWORD" \
  --app maac-api

echo "Deploying API..."
fly deploy
cd ../..
echo -e "${GREEN}✓ API deployed${NC}"
echo ""

# Step 6: Deploy Dashboard
echo -e "${BLUE}Step 6: Deploying Dashboard frontend...${NC}"
cd apps/dashboard

if ! fly apps list | grep -q "maac-dashboard"; then
    echo "Creating maac-dashboard app..."
    fly launch --no-deploy --name maac-dashboard --region iad
fi

echo "Setting secrets..."
fly secrets set \
  NEXT_PUBLIC_API_URL="https://maac-api.fly.dev" \
  --app maac-dashboard

echo "Deploying dashboard..."
fly deploy
cd ../..
echo -e "${GREEN}✓ Dashboard deployed${NC}"
echo ""

# Summary
echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=============================================="
echo ""
echo "Your services are available at:"
echo "  API:       https://maac-api.fly.dev"
echo "  Dashboard: https://maac-dashboard.fly.dev"
echo ""
echo "Next steps:"
echo "  1. Run database migrations:"
echo "     fly ssh console --app maac-api -C 'cd apps/api && npx prisma migrate deploy'"
echo ""
echo "  2. Seed test data:"
echo "     fly ssh console --app maac-api -C 'cd apps/api && npm run db:seed'"
echo ""
echo "  3. Configure Stripe webhook:"
echo "     https://dashboard.stripe.com/webhooks"
echo "     URL: https://maac-api.fly.dev/api/billing/webhook"
echo ""
echo "  4. Open your dashboard:"
echo "     fly open --app maac-dashboard"
echo ""
echo "View logs:"
echo "  fly logs --app maac-api"
echo "  fly logs --app maac-dashboard"
echo ""
