/**
 * Billing & Credits Routes
 *
 * Endpoints for managing user credits and Stripe payments
 */

import type { FastifyInstance } from 'fastify';

// Mock database for demo - in production, use Prisma/database
const mockUserCredits = {
  totalCredits: 15000,
  usedCredits: 2345,
  remainingCredits: 12655,
};

const mockTransactions = [
  {
    id: 'tx_1',
    type: 'purchase' as const,
    amount: 50,
    description: 'Purchased 50,000 credits',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'tx_2',
    type: 'usage' as const,
    amount: -2345,
    description: 'Experiment: Problem Solving Test',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function billingRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/billing/credits
   *
   * Get user's current credit balance
   */
  fastify.get('/credits', async () => {
    // In production, fetch from database using authenticated user ID
    return {
      balance: mockUserCredits,
    };
  });

  /**
   * GET /api/billing/transactions
   *
   * Get user's transaction history
   */
  fastify.get<{
    Querystring: { limit?: string };
  }>('/transactions', async (request) => {
    const limit = parseInt(request.query.limit || '10', 10);

    // In production, fetch from database with pagination
    return {
      transactions: mockTransactions.slice(0, limit),
      total: mockTransactions.length,
    };
  });

  /**
   * POST /api/billing/create-checkout
   *
   * Create a Stripe checkout session for purchasing credits
   */
  fastify.post<{
    Body: { credits: number; amount: number };
  }>('/create-checkout', async (request, reply) => {
    const { credits, amount } = request.body;

    if (!credits || !amount) {
      return reply.status(400).send({
        error: 'Credits and amount are required',
      });
    }

    try {
      // Initialize Stripe
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-12-18.acacia',
      });

      // Create checkout session
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${credits.toLocaleString()} MAAC Credits`,
                description: `Research platform credits for LLM usage (1 credit = $0.001)`,
              },
              unit_amount: amount * 100, // Stripe uses cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?payment=cancelled`,
        metadata: {
          credits: credits.toString(),
          // userId: request.user?.id, // Add when auth is implemented
        },
      });

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    } catch (error) {
      console.error('Checkout creation failed:', error);
      return reply.status(500).send({
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/billing/webhook
   *
   * Stripe webhook handler for payment events
   */
  fastify.post('/webhook', async (request, reply) => {
    const sig = request.headers['stripe-signature'];

    if (!sig) {
      return reply.status(400).send({ error: 'Missing stripe-signature header' });
    }

    try {
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-12-18.acacia',
      });

      // Verify webhook signature
      const event = stripeClient.webhooks.constructEvent(
        request.body as string | Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const credits = parseInt(session.metadata?.credits || '0', 10);
          const userId = session.metadata?.userId;

          if (userId && credits > 0) {
            // Add credits to user account
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();

            await prisma.user.update({
              where: { id: userId },
              data: {
                credits: {
                  increment: credits,
                },
              },
            });

            // Record transaction
            await prisma.creditTransaction.create({
              data: {
                userId,
                type: 'PURCHASE',
                amount: credits,
                description: `Purchased ${credits.toLocaleString()} credits`,
                stripePaymentIntentId: session.payment_intent as string,
                stripeCheckoutSessionId: session.id,
              },
            });

            await prisma.$disconnect();
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          console.error('Payment failed:', event.data.object);
          break;
        }
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return reply.status(400).send({
        error: 'Webhook signature verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/billing/info
   *
   * Get comprehensive billing information
   */
  fastify.get('/info', async () => {
    return {
      billing: {
        credits: mockUserCredits.remainingCredits,
        totalSpent: 95, // Mock value
        lastPurchase: new Date(Date.now() - 86400000 * 2).toISOString(),
        transactions: [
          {
            id: 'tx_1',
            amount: 50,
            credits: 50000,
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: 'completed' as const,
          },
          {
            id: 'tx_2',
            amount: 45,
            credits: 50000,
            date: new Date(Date.now() - 86400000 * 10).toISOString(),
            status: 'completed' as const,
          },
        ],
      },
    };
  });

  /**
   * POST /api/billing/estimate
   *
   * Estimate cost for an experiment based on tier, provider, model, and trial count
   */
  fastify.post<{
    Body: {
      tier: string;
      trials: number;
      model: string;
      provider: string;
    };
  }>('/estimate', async (request) => {
    const { tier, trials, model, provider } = request.body;

    // Import charge matrix (in production, this would be a service)
    const { calculateCreditCost, getTierBaseFee } = await import('../lib/charge-matrix.js');

    // Estimate average tokens per trial
    const estimatedInputTokens = 2000; // Average input context
    const estimatedOutputTokens = 1500; // Average output

    try {
      const perTrialCost = calculateCreditCost(
        provider,
        model,
        estimatedInputTokens,
        estimatedOutputTokens,
      );

      const baseFee = getTierBaseFee(tier);
      const tokenCost = perTrialCost * trials;
      const totalCost = baseFee + tokenCost;

      return {
        estimatedCost: totalCost,
        costPerTrial: perTrialCost,
        trials,
        tier,
        breakdown: {
          baseFee,
          tokenCost,
          avgInputTokens: estimatedInputTokens,
          avgOutputTokens: estimatedOutputTokens,
        },
      };
    } catch (error) {
      // Fallback to simple estimation
      const fallbackCost = trials * 50;
      return {
        estimatedCost: fallbackCost,
        costPerTrial: 50,
        trials,
        tier,
        breakdown: {
          baseFee: 0,
          tokenCost: fallbackCost,
          avgInputTokens: estimatedInputTokens,
          avgOutputTokens: estimatedOutputTokens,
        },
        warning: 'Using fallback estimation - charge matrix not available',
      };
    }
  });
}
