# Prisma Schema Additions for Billing System

Add these models to `apps/api/prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  credits   Int      @default(0) // Credit balance in credits (1 credit = $0.001)
  
  // Relations
  experiments        MAACExperiment[]
  creditTransactions CreditTransaction[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([email])
}

model CreditTransaction {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        TransactionType // PURCHASE, USAGE, REFUND, ADJUSTMENT
  amount      Int             // Credits (positive for purchase/refund, negative for usage)
  description String
  
  // JSON metadata for detailed tracking
  metadata    Json?   // { experimentId, tier, provider, model, inputTokens, outputTokens }
  
  // Stripe payment info (for purchases)
  stripePaymentId     String?
  stripeCheckoutId    String?
  
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([type])
}

enum TransactionType {
  PURCHASE    // User bought credits
  USAGE       // Credits consumed by experiment
  REFUND      // Credits returned
  ADJUSTMENT  // Manual admin adjustment
}

// Add to existing MAACExperiment model:
model MAACExperiment {
  // ... existing fields ...
  
  // Billing fields
  userId           String?
  user             User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  apiKeyMode       String  @default("system") // "own" or "system"
  creditsUsed      Int     @default(0) // Total credits consumed
  estimatedCredits Int?    // Pre-run estimate
  
  // ... rest of existing fields ...
}
```

## Migration Commands

```bash
# Create migration
cd apps/api
npx prisma migrate dev --name add_billing_system

# Generate Prisma Client
npx prisma generate

# (Optional) Seed with test user
npx prisma db seed
```

## Seed Example

Add to `apps/api/prisma/seed.ts`:

```typescript
// Create test user with credits
const testUser = await prisma.user.create({
  data: {
    email: 'test@example.com',
    name: 'Test User',
    credits: 10000, // Start with 10,000 credits ($10 worth)
    creditTransactions: {
      create: {
        type: 'PURCHASE',
        amount: 10000,
        description: 'Initial credit purchase',
        stripePaymentId: 'pi_test_123',
      },
    },
  },
});
```

## Environment Variables

Add to `.env`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL for Stripe redirects
FRONTEND_URL=http://localhost:3000
```
