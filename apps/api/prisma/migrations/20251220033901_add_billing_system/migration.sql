-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE', 'USAGE', 'REFUND', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "maac_experiment_scenarios" ADD COLUMN     "api_key_mode" TEXT NOT NULL DEFAULT 'system',
ADD COLUMN     "credits_used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimated_credits" INTEGER,
ADD COLUMN     "user_id" TEXT;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "stripe_payment_intent_id" TEXT,
    "stripe_checkout_session_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "credit_transactions_stripe_payment_intent_id_key" ON "credit_transactions"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_transactions_stripe_checkout_session_id_key" ON "credit_transactions"("stripe_checkout_session_id");

-- CreateIndex
CREATE INDEX "credit_transactions_user_id_createdAt_idx" ON "credit_transactions"("user_id", "createdAt");

-- CreateIndex
CREATE INDEX "credit_transactions_type_idx" ON "credit_transactions"("type");

-- CreateIndex
CREATE INDEX "credit_transactions_stripe_payment_intent_id_idx" ON "credit_transactions"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "maac_experiment_scenarios_user_id_idx" ON "maac_experiment_scenarios"("user_id");

-- AddForeignKey
ALTER TABLE "maac_experiment_scenarios" ADD CONSTRAINT "maac_experiment_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
