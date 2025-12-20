'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Zap, Loader2, Plus, TrendingUp, Calendar } from 'lucide-react';

interface CreditBalance {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  expiresAt?: string;
}

interface Transaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund';
  amount: number;
  description: string;
  createdAt: string;
}

const CREDIT_PACKAGES = [
  { credits: 10000, price: 10, bonus: 0, popular: false },
  { credits: 50000, price: 45, bonus: 5000, popular: true },
  { credits: 100000, price: 80, bonus: 20000, popular: false },
  { credits: 500000, price: 350, bonus: 150000, popular: false },
];

export function BillingCredits() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/billing/credits');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch credit balance', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/billing/transactions?limit=10');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

  const handlePurchase = async (packageIndex: number) => {
    const pkg = CREDIT_PACKAGES[packageIndex];
    setSelectedPackage(packageIndex);
    setPurchasing(true);

    try {
      // Create Stripe checkout session
      const response = await fetch('http://localhost:3001/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: pkg.credits + pkg.bonus,
          amount: pkg.price,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('Purchase failed', err);
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    const icons = {
      purchase: <Plus className="h-4 w-4 text-green-600" />,
      usage: <TrendingUp className="h-4 w-4 text-blue-600" />,
      refund: <DollarSign className="h-4 w-4 text-yellow-600" />,
    };
    return icons[type];
  };

  const usagePercentage = balance ? (balance.usedCredits / balance.totalCredits) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Credit Balance Overview */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Token Credits</h2>
          <Zap className="h-6 w-6 text-yellow-500" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : balance ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Total Credits</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {balance.totalCredits.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Used</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {balance.usedCredits.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {balance.remainingCredits.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Usage</span>
                <span>{usagePercentage.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    usagePercentage > 80
                      ? 'bg-red-600'
                      : usagePercentage > 50
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>

            {balance.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Credits expire: {new Date(balance.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No credit information available</p>
        )}
      </div>

      {/* Credit Packages */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Credits</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKAGES.map((pkg, index) => (
            <div
              key={index}
              className={`relative rounded-lg border p-4 transition-all ${
                pkg.popular
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">${pkg.price}</p>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900">
                    {pkg.credits.toLocaleString()} credits
                  </p>
                  {pkg.bonus > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      + {pkg.bonus.toLocaleString()} bonus!
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  ${((pkg.price / (pkg.credits + pkg.bonus)) * 1000).toFixed(2)} per 1k credits
                </p>

                <button
                  onClick={() => handlePurchase(index)}
                  disabled={purchasing && selectedPackage === index}
                  className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                    pkg.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing && selectedPackage === index ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Secure Payment via Stripe</p>
              <p className="mt-1">
                Credits are purchased securely through Stripe. No credit card information is stored
                on our servers. Credits can be used for any experiment using system API keys.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === 'purchase' || tx.type === 'refund'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'usage' ? '-' : '+'}
                    {tx.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">credits</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
