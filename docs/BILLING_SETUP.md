# Production-Grade Billing System Setup Guide

## ✅ Step 1: Run Database Migration

The Prisma schema has been updated with billing models. Create and run the migration:

```bash
cd apps/api

# Create migration
npx prisma migrate dev --name add_billing_system

# Generate Prisma Client (includes new User and CreditTransaction types)
npx prisma generate
```

This creates:
- `users` table with credit balances
- `credit_transactions` audit log
- `TransactionType` enum
- Adds billing fields to `maac_experiment_scenarios`

## ✅ Step 2: Seed Test Users

Create test accounts with initial credit balances:

```bash
npm run db:seed
```

This creates:
- `test@maac-research.com` - 50,000 credits ($50)
- `admin@maac-research.com` - 500,000 credits ($500)

## ✅ Step 3: Install Stripe Package

```bash
cd apps/api
pnpm install
```

This adds the `stripe` package dependency.

## ✅ Step 4: Configure Stripe Webhook

1. **Create webhook endpoint** in Stripe Dashboard:
   - URL: `https://your-api-domain.com/billing/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `payment_intent.payment_failed`

2. **Copy webhook secret** to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **For local testing**, use Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/billing/webhook
   ```

## ✅ Step 5: Update Frontend Environment

Add to `apps/dashboard/.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## ✅ Step 6: Test the System

### Test Credit Purchase Flow

```bash
# Start API server
cd apps/api
npm run dev

# Start dashboard
cd apps/dashboard
npm run dev
```

1. Navigate to `http://localhost:3000/settings`
2. Click "Billing & Credits" tab
3. Click "Buy Now" on any credit package
4. Complete test payment with Stripe test card: `4242 4242 4242 4242`
5. Verify credits appear in balance

### Test Experiment with Credits

1. Create new experiment (Tier 1b or 2)
2. Select system credits mode
3. View cost estimate before running
4. Run experiment
5. Check credit deduction in transaction history

### Test Usage Tracking

```bash
# Check logs for token tracking
tail -f apps/api/logs/usage.log

# View database transactions
cd apps/api
npx prisma studio
# Browse: credit_transactions table
```

## ✅ Step 7: Monitor in Production

### Key Metrics to Watch

1. **Credit Balance Alerts**
   ```sql
   SELECT email, credits 
   FROM users 
   WHERE credits < 1000;
   ```

2. **Daily Revenue**
   ```sql
   SELECT 
     DATE(created_at) as date,
     SUM(amount) as credits_purchased
   FROM credit_transactions
   WHERE type = 'PURCHASE'
   GROUP BY DATE(created_at);
   ```

3. **Top Spenders**
   ```sql
   SELECT 
     u.email,
     SUM(CASE WHEN type = 'USAGE' THEN -amount ELSE 0 END) as total_spent
   FROM credit_transactions ct
   JOIN users u ON ct.user_id = u.id
   GROUP BY u.email
   ORDER BY total_spent DESC
   LIMIT 10;
   ```

### Stripe Dashboard Monitoring

- Revenue: https://dashboard.stripe.com/revenue
- Payments: https://dashboard.stripe.com/payments
- Failed Payments: https://dashboard.stripe.com/payments?status=failed
- Webhooks: https://dashboard.stripe.com/webhooks

## ✅ Step 8: Security Checklist

- [ ] Stripe secret keys in `.env` (never commit)
- [ ] Webhook signature verification enabled
- [ ] HTTPS required in production
- [ ] Rate limiting on billing endpoints
- [ ] User authentication before credit access
- [ ] Audit log monitoring for suspicious activity
- [ ] Database backups enabled
- [ ] Transaction rollback on errors

## 🎯 What's Now Production-Ready

✅ **Charge Matrix** - Real pricing for 7 providers × 30+ models
✅ **Usage Tracking** - Token-level tracking with atomic deductions
✅ **Stripe Integration** - Real payment processing (not mocked)
✅ **Database Schema** - User accounts + credit transactions
✅ **Webhook Handler** - Automated credit delivery on payment
✅ **Tier-Based Restrictions** - Tier 1 requires system credits
✅ **Credit Estimation** - Pre-run cost calculation
✅ **Transaction Audit** - Complete history of all credit movements
✅ **Insufficient Balance** - Graceful handling with rollback

## 🚀 Next Steps

1. Add user authentication (Auth0, Clerk, NextAuth)
2. Implement email notifications for low balance
3. Add refund processing workflow
4. Create admin dashboard for credit management
5. Set up monitoring/alerting for failed payments
6. Add volume discounts for high-usage customers
7. Implement subscription plans with rollover credits

## 📝 Important Notes

- **Test Mode**: Use `sk_test_...` keys for development
- **Production Mode**: Switch to `sk_live_...` keys when ready
- **1 Credit = $0.001 USD** (1000 credits = $1)
- **Tier 1a Base Fee**: 10 credits per scenario
- **Tier 1b Base Fee**: 50 credits per experiment
- **Tier 2**: No base fee, token costs only
