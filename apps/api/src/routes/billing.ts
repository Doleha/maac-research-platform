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
      // In production, integrate with Stripe:
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const session = await stripe.checkout.sessions.create({
      //   payment_method_types: ['card'],
      //   line_items: [{
      //     price_data: {
      //       currency: 'usd',
      //       product_data: {
      //         name: `${credits} MAAC Credits`,
      //       },
      //       unit_amount: amount * 100, // Stripe uses cents
      //     },
      //     quantity: 1,
      //   }],
      //   mode: 'payment',
      //   success_url: `${process.env.FRONTEND_URL}/settings?payment=success`,
      //   cancel_url: `${process.env.FRONTEND_URL}/settings?payment=cancelled`,
      //   metadata: {
      //     credits: credits.toString(),
      //     userId: req.user.id, // From authentication middleware
      //   },
      // });
      //
      // return { sessionId: session.id, checkoutUrl: session.url };

      // Mock response for development
      return {
        sessionId: 'cs_test_' + Math.random().toString(36).substring(7),
        checkoutUrl: 'https://checkout.stripe.com/mock-session',
        message: 'Stripe integration pending - this is a mock response',
      };
    } catch (error) {
      console.error('Checkout creation failed:', error);
      return reply.status(500).send({
        error: 'Failed to create checkout session',
      });
    }
  });

  /**
   * POST /api/billing/webhook
   *
   * Stripe webhook handler for payment events
   */
  fastify.post('/webhook', async () => {
    // In production, verify Stripe webhook signature:
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    //
    // Handle different event types:
    // switch (event.type) {
    //   case 'checkout.session.completed':
    //     const session = event.data.object;
    //     // Add credits to user account
    //     await addCreditsToUser(session.metadata.userId, session.metadata.credits);
    //     break;
    // }

    return { received: true };
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
        estimatedOutputTokens
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

