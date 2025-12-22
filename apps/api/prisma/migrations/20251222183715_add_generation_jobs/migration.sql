-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" TEXT NOT NULL,
    "domains" TEXT[],
    "tiers" TEXT[],
    "repetitions" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "concurrency" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'running',
    "total_scenarios" INTEGER NOT NULL,
    "generated_count" INTEGER NOT NULL DEFAULT 0,
    "stored_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "last_error" TEXT,
    "experiment_id" TEXT,

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generation_jobs_status_idx" ON "generation_jobs"("status");

-- CreateIndex
CREATE INDEX "generation_jobs_started_at_idx" ON "generation_jobs"("started_at");
