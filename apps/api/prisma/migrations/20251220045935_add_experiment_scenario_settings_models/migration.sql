-- CreateTable
CREATE TABLE IF NOT EXISTS "experiments" (
    "id" SERIAL NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "domains" TEXT[],
    "tiers" TEXT[],
    "models" TEXT[],
    "tool_configs" JSONB NOT NULL,
    "repetitions_per_domain_tier" INTEGER NOT NULL DEFAULT 1,
    "parallelism" INTEGER NOT NULL DEFAULT 10,
    "timeout" INTEGER NOT NULL DEFAULT 60000,
    "total_trials" INTEGER NOT NULL,
    "completed_trials" INTEGER NOT NULL DEFAULT 0,
    "failed_trials" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "scenarios" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "task_title" TEXT NOT NULL,
    "task_description" TEXT,
    "expected_outcome" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "experiments_experiment_id_key" ON "experiments"("experiment_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "experiments_experiment_id_idx" ON "experiments"("experiment_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "experiments_status_idx" ON "experiments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "experiments_created_at_idx" ON "experiments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "scenarios_scenario_id_key" ON "scenarios"("scenario_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scenarios_domain_idx" ON "scenarios"("domain");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scenarios_tier_idx" ON "scenarios"("tier");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scenarios_scenario_id_idx" ON "scenarios"("scenario_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "settings_key_idx" ON "settings"("key");
