-- CreateTable
CREATE TABLE "maac_experimental_data" (
    "id" SERIAL NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "session_id" UUID NOT NULL,
    "trial_id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "repetition" INTEGER NOT NULL,
    "model_id" TEXT NOT NULL,
    "enabled_tools" TEXT[],
    "tool_count" INTEGER NOT NULL,
    "goal_engine_enabled" BOOLEAN NOT NULL,
    "planning_engine_enabled" BOOLEAN NOT NULL,
    "clarification_engine_enabled" BOOLEAN NOT NULL,
    "validation_engine_enabled" BOOLEAN NOT NULL,
    "evaluation_engine_enabled" BOOLEAN NOT NULL,
    "reflection_engine_enabled" BOOLEAN NOT NULL,
    "memory_store_enabled" BOOLEAN NOT NULL,
    "memory_node_query_enabled" BOOLEAN NOT NULL,
    "memory_context_query_enabled" BOOLEAN NOT NULL,
    "memory_eval_query_enabled" BOOLEAN NOT NULL,
    "memory_refl_query_enabled" BOOLEAN NOT NULL,
    "think_tool_enabled" BOOLEAN NOT NULL,
    "mimic_response_text" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "processing_metadata" JSONB NOT NULL,
    "cognitive_cycles_count" INTEGER NOT NULL,
    "memory_operations_count" INTEGER NOT NULL,
    "tools_invoked_count" INTEGER NOT NULL,
    "processing_method" TEXT,
    "complexity_assessment" TEXT,
    "processing_time" INTEGER NOT NULL,
    "maac_cognitive_load" DECIMAL(5,2),
    "maac_tool_execution" DECIMAL(5,2),
    "maac_content_quality" DECIMAL(5,2),
    "maac_memory_integration" DECIMAL(5,2),
    "maac_complexity_handling" DECIMAL(5,2),
    "maac_hallucination_control" DECIMAL(5,2),
    "maac_knowledge_transfer" DECIMAL(5,2),
    "maac_processing_efficiency" DECIMAL(5,2),
    "maac_construct_validity" DECIMAL(5,2),
    "maac_overall_score" DECIMAL(5,2),
    "maac_confidence" DECIMAL(3,2),
    "statistical_significance_p" DECIMAL(10,8),
    "effect_size_cohens_d" DECIMAL(5,3),
    "confidence_interval_95" JSONB,
    "maac_completed" BOOLEAN NOT NULL DEFAULT false,
    "publication_ready" BOOLEAN NOT NULL DEFAULT false,
    "tier2_comparative_ready" BOOLEAN NOT NULL DEFAULT false,
    "tier2_batch_processed" BOOLEAN NOT NULL DEFAULT false,
    "tier2_batch_id" TEXT,
    "tier2_processed_at" TIMESTAMP(3),
    "tier2_batch_number" INTEGER,
    "tier2_analysis_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "mimic_started_at" TIMESTAMP(3),
    "mimic_completed_at" TIMESTAMP(3),

    CONSTRAINT "maac_experimental_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maac_experiment_scenarios" (
    "id" SERIAL NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "repetition" INTEGER NOT NULL,
    "config_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "task_title" TEXT NOT NULL,
    "task_description" TEXT NOT NULL,
    "business_context" TEXT NOT NULL,
    "success_criteria" JSONB NOT NULL,
    "expected_calculations" JSONB NOT NULL,
    "expected_insights" JSONB NOT NULL,
    "scenario_requirements" JSONB NOT NULL,
    "data_elements" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maac_experiment_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maac_tier2_analysis" (
    "id" SERIAL NOT NULL,
    "session_id" UUID NOT NULL,
    "analysis_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maac_framework_version" TEXT NOT NULL DEFAULT 'nine_dimensional_v1.0',
    "experiments_analyzed" INTEGER NOT NULL,
    "analysis_batch_id" TEXT NOT NULL,
    "batch_number" INTEGER NOT NULL,
    "batch_size" INTEGER NOT NULL DEFAULT 500,
    "core_statistics" JSONB NOT NULL,
    "advanced_statistics" JSONB NOT NULL,
    "business_analysis" JSONB NOT NULL,
    "cognitive_architecture_analysis" JSONB NOT NULL,
    "experimental_design_validation" JSONB NOT NULL,
    "synthesis_results" JSONB NOT NULL,
    "data_quality_score" DECIMAL(3,2),
    "analysis_confidence_level" DECIMAL(3,2),
    "analysis_quality_validated" BOOLEAN NOT NULL DEFAULT false,
    "core_statistical_agent_completed" BOOLEAN NOT NULL DEFAULT false,
    "advanced_statistical_agent_completed" BOOLEAN NOT NULL DEFAULT false,
    "business_analysis_agent_completed" BOOLEAN NOT NULL DEFAULT false,
    "cognitive_architecture_agent_completed" BOOLEAN NOT NULL DEFAULT false,
    "experimental_design_agent_completed" BOOLEAN NOT NULL DEFAULT false,
    "synthesis_agent_completed" BOOLEAN NOT NULL DEFAULT false,
    "ready_for_publication" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "maac_tier2_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maac_statistical_summary" (
    "id" SERIAL NOT NULL,
    "analysis_type" TEXT NOT NULL,
    "analysis_scope" TEXT NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "experiment_count" INTEGER NOT NULL,
    "configuration_count" INTEGER NOT NULL,
    "domain_coverage" TEXT[],
    "mean_score" DECIMAL(5,2) NOT NULL,
    "standard_deviation" DECIMAL(5,2) NOT NULL,
    "confidence_interval_95_lower" DECIMAL(5,2) NOT NULL,
    "confidence_interval_95_upper" DECIMAL(5,2) NOT NULL,
    "p_value" DECIMAL(10,8) NOT NULL,
    "effect_size" DECIMAL(5,3) NOT NULL,
    "statistical_power" DECIMAL(3,2) NOT NULL,
    "framework_reliability_alpha" DECIMAL(3,2),
    "inter_dimensional_correlation" JSONB,
    "construct_validity_score" DECIMAL(3,2),
    "predictive_validity_r2" DECIMAL(3,2),
    "key_findings" TEXT[],
    "methodological_notes" TEXT,
    "limitations" TEXT[],
    "analysis_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analyst_notes" TEXT,
    "publication_ready" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "maac_statistical_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maac_academic_reports" (
    "id" SERIAL NOT NULL,
    "session_id" UUID NOT NULL,
    "report_type" TEXT NOT NULL,
    "report_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "introduction_section" TEXT NOT NULL,
    "methodology_section" TEXT NOT NULL,
    "results_section" TEXT NOT NULL,
    "discussion_section" TEXT NOT NULL,
    "conclusion_section" TEXT NOT NULL,
    "references_section" TEXT NOT NULL,
    "data_quality_score" DECIMAL(3,2) NOT NULL,
    "report_quality_score" DECIMAL(3,2) NOT NULL,
    "literature_relevance_score" DECIMAL(3,2) NOT NULL,
    "ready_for_submission" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "maac_academic_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maac_experimental_data_trial_id_key" ON "maac_experimental_data"("trial_id");

-- CreateIndex
CREATE INDEX "maac_experimental_data_experiment_id_idx" ON "maac_experimental_data"("experiment_id");

-- CreateIndex
CREATE INDEX "maac_experimental_data_session_id_idx" ON "maac_experimental_data"("session_id");

-- CreateIndex
CREATE INDEX "maac_experimental_data_trial_id_idx" ON "maac_experimental_data"("trial_id");

-- CreateIndex
CREATE INDEX "maac_experimental_data_config_id_idx" ON "maac_experimental_data"("config_id");

-- CreateIndex
CREATE INDEX "maac_experimental_data_domain_tier_idx" ON "maac_experimental_data"("domain", "tier");

-- CreateIndex
CREATE INDEX "maac_experimental_data_model_id_idx" ON "maac_experimental_data"("model_id");

-- CreateIndex
CREATE INDEX "maac_experimental_data_maac_completed_idx" ON "maac_experimental_data"("maac_completed");

-- CreateIndex
CREATE INDEX "maac_experimental_data_publication_ready_idx" ON "maac_experimental_data"("publication_ready");

-- CreateIndex
CREATE UNIQUE INDEX "maac_experiment_scenarios_scenario_id_key" ON "maac_experiment_scenarios"("scenario_id");

-- CreateIndex
CREATE INDEX "maac_experiment_scenarios_experiment_id_idx" ON "maac_experiment_scenarios"("experiment_id");

-- CreateIndex
CREATE INDEX "maac_experiment_scenarios_scenario_id_idx" ON "maac_experiment_scenarios"("scenario_id");

-- CreateIndex
CREATE INDEX "maac_experiment_scenarios_domain_tier_idx" ON "maac_experiment_scenarios"("domain", "tier");

-- CreateIndex
CREATE INDEX "maac_experiment_scenarios_config_id_idx" ON "maac_experiment_scenarios"("config_id");

-- CreateIndex
CREATE INDEX "maac_tier2_analysis_session_id_idx" ON "maac_tier2_analysis"("session_id");

-- CreateIndex
CREATE INDEX "maac_tier2_analysis_analysis_batch_id_idx" ON "maac_tier2_analysis"("analysis_batch_id");

-- CreateIndex
CREATE INDEX "maac_tier2_analysis_batch_number_idx" ON "maac_tier2_analysis"("batch_number");

-- CreateIndex
CREATE INDEX "maac_tier2_analysis_ready_for_publication_idx" ON "maac_tier2_analysis"("ready_for_publication");

-- CreateIndex
CREATE INDEX "maac_statistical_summary_analysis_type_idx" ON "maac_statistical_summary"("analysis_type");

-- CreateIndex
CREATE INDEX "maac_statistical_summary_publication_ready_idx" ON "maac_statistical_summary"("publication_ready");

-- CreateIndex
CREATE INDEX "maac_academic_reports_session_id_idx" ON "maac_academic_reports"("session_id");

-- CreateIndex
CREATE INDEX "maac_academic_reports_report_type_idx" ON "maac_academic_reports"("report_type");

-- CreateIndex
CREATE INDEX "maac_academic_reports_ready_for_submission_idx" ON "maac_academic_reports"("ready_for_submission");
