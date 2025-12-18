# Extracted Logic Summary

## n8n to TypeScript Migration - Complete Mapping Document

This document provides a comprehensive mapping of n8n workflow nodes to their TypeScript implementations across the MAAC Research Platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: MIMIC Cognitive Engine](#phase-1-mimic-cognitive-engine)
3. [Phase 2: MAAC Framework Assessors](#phase-2-maac-framework-assessors)
4. [Phase 3: Experiment Orchestrator](#phase-3-experiment-orchestrator)
5. [Phase 4: Statistical Analysis Pipeline](#phase-4-statistical-analysis-pipeline)
6. [Python Statistical Engine](#python-statistical-engine)
7. [Validation Tests](#validation-tests)
8. [Architecture Diagrams](#architecture-diagrams)

---

## Overview

### Source Workflows (n8n JSON files)

| Workflow File | Purpose | Primary Nodes |
|---------------|---------|---------------|
| `MAAC - Tier 0 - Agent Router Orchestrator.json` | MIMIC cognitive orchestration | Agent Router, Tool Executor, Memory Manager |
| `MAAC - Tier 0 - Experiment & Session Generator.json` | Experiment setup and trial management | Scenario Generator, Session Manager, Trial Sequencer |
| `MAAC - Tier 1 - Response Assessment.json` | MAAC dimension scoring | 9 Dimension Assessors, Score Aggregator |
| `MAAC - Tier 2 - Dataset-Level Advanced Analysis-Python.json` | Statistical analysis | Python Engine, Batch Processor, Result Aggregator |

### Target TypeScript Packages

| Package | Purpose | Location |
|---------|---------|----------|
| `@maac/mimic-cognitive-engine` | MIMIC orchestrator | `packages/mimic-cognitive-engine/` |
| `@maac/maac-framework` | MAAC assessors | `packages/maac-framework/` |
| `@maac/experiment-orchestrator` | Trial management | `packages/experiment-orchestrator/` |
| `@maac/statistical-analysis` | Statistical pipeline | `packages/statistical-analysis/` |
| `@maac/types` | Shared types | `packages/shared-types/` |

---

## Phase 1: MIMIC Cognitive Engine

### n8n Node Mapping

| n8n Node | TypeScript Implementation | File |
|----------|---------------------------|------|
| **Agent Router** | `MIMICOrchestrator` class | `src/orchestrator/index.ts` |
| **Cognitive Loop** | `CognitiveLoop` class | `src/cognitive/loop.ts` |
| **Tool Selector** | `ToolSelector` class | `src/tools/selector.ts` |
| **Tool Executor** | `ToolExecutor` class | `src/tools/executor.ts` |
| **Memory Store** | `MemoryManager` class | `src/memory/manager.ts` |
| **Memory Retriever** | `MemoryRetriever` class | `src/memory/retriever.ts` |
| **Response Generator** | `ResponseGenerator` class | `src/response/generator.ts` |
| **Self-Reflection** | `SelfReflection` module | `src/cognitive/reflection.ts` |

### Key Logic Extracted

```typescript
// Agent Router Decision Flow (from n8n Agent Router node)
export class MIMICOrchestrator {
  async process(prompt: string): Promise<ProcessingResult> {
    // 1. Parse input and extract intent
    const intent = await this.parseIntent(prompt);
    
    // 2. Retrieve relevant context from memory
    const context = await this.memory.retrieve(prompt);
    
    // 3. Enter cognitive loop
    let iteration = 0;
    while (iteration < this.config.max_iterations) {
      // 4. Reason about next action
      const action = await this.reason(prompt, context, this.history);
      
      // 5. Execute action (tool or respond)
      if (action.type === 'use_tool') {
        const result = await this.executeTool(action.tool, action.input);
        this.history.push({ type: 'tool_result', result });
      } else if (action.type === 'respond') {
        return this.generateResponse(action);
      }
      
      iteration++;
    }
  }
}
```

### Configuration Mapping

| n8n Setting | TypeScript Config | Default |
|-------------|-------------------|---------|
| `maxIterations` | `config.max_iterations` | 10 |
| `temperature` | `config.temperature` | 0.7 |
| `timeout` | `config.timeout_ms` | 60000 |
| `enabledTools` | `config.tools_enabled` | all |
| `memoryLimit` | `config.memory_config.short_term_limit` | 10 |

---

## Phase 2: MAAC Framework Assessors

### n8n Node Mapping

| n8n Node | TypeScript Function | File |
|----------|---------------------|------|
| **Cognitive Load Assessor** | `assessCognitiveLoad()` | `src/dimensions/cognitive-load.ts` |
| **Tool Execution Assessor** | `assessToolExecution()` | `src/dimensions/tool-execution.ts` |
| **Content Quality Assessor** | `assessContentQuality()` | `src/dimensions/content-quality.ts` |
| **Memory Integration Assessor** | `assessMemoryIntegration()` | `src/dimensions/memory-integration.ts` |
| **Complexity Handling Assessor** | `assessComplexityHandling()` | `src/dimensions/complexity-handling.ts` |
| **Hallucination Control Assessor** | `assessHallucinationControl()` | `src/dimensions/hallucination-control.ts` |
| **Knowledge Transfer Assessor** | `assessKnowledgeTransfer()` | `src/dimensions/knowledge-transfer.ts` |
| **Processing Efficiency Assessor** | `assessProcessingEfficiency()` | `src/dimensions/processing-efficiency.ts` |
| **Construct Validity Assessor** | `assessConstructValidity()` | `src/dimensions/construct-validity.ts` |
| **Score Aggregator** | `calculateOverallMAACScore()` | `src/scoring/aggregator.ts` |

### MAAC Scoring Formulas

```typescript
// Overall Score Calculation (from n8n Score Aggregator)
export function calculateOverallMAACScore(dimensions: DimensionScore[]): OverallScore {
  // Default weights from n8n workflow
  const weights = {
    cognitive_load: 0.12,
    tool_execution: 0.12,
    content_quality: 0.12,
    memory_integration: 0.10,
    complexity_handling: 0.10,
    hallucination_control: 0.12,
    knowledge_transfer: 0.10,
    processing_efficiency: 0.10,
    construct_validity: 0.12,
  };
  
  const weightedSum = dimensions.reduce((sum, dim) => {
    return sum + dim.score * (weights[dim.dimension] || 0.11);
  }, 0);
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  
  return {
    overall_score: weightedSum / totalWeight,
    dimension_scores: dimensions,
    confidence: calculateConfidence(dimensions),
  };
}
```

### Dimension Assessment Structure

```typescript
// Common assessment interface (from n8n dimension nodes)
interface DimensionAssessment {
  dimension: string;
  score: number;           // 0-10 scale
  confidence: number;      // 0-1 scale
  reasoning: string;       // LLM reasoning
  indicators: string[];    // Evidence points
  sub_scores?: Record<string, number>;  // Component scores
}
```

---

## Phase 3: Experiment Orchestrator

### n8n Node Mapping

| n8n Node | TypeScript Implementation | File |
|----------|---------------------------|------|
| **Experiment Generator** | `ExperimentSession` class | `src/session/experiment.ts` |
| **Scenario Builder** | `ScenarioGenerator` class | `src/scenarios/generator.ts` |
| **Trial Sequencer** | `TrialManager` class | `src/trials/manager.ts` |
| **Domain Router** | `DomainRouter` class | `src/routing/domain-router.ts` |
| **Tier Selector** | `TierSelector` class | `src/routing/tier-selector.ts` |
| **Result Collector** | `ResultCollector` class | `src/results/collector.ts` |

### Experiment Matrix Generation

```typescript
// From n8n Experiment Generator node
export function generateExperimentMatrix(
  config: ExperimentConfig,
  domains: DomainConfig[]
): ExperimentMatrix {
  const scenarios: Scenario[] = [];
  
  // Generate scenarios for each combination
  for (const model of config.models) {
    for (const domain of config.domains) {
      const domainConfig = domains.find(d => d.id === domain);
      for (const template of domainConfig.scenario_templates) {
        for (const tier of config.tiers) {
          scenarios.push({
            scenario_id: generateId(),
            model_id: model,
            domain: domain,
            tier: tier,
            template: template,
            complexity_level: getTierComplexity(tier),
          });
        }
      }
    }
  }
  
  // Optionally randomize order
  if (config.randomize_order) {
    shuffleArray(scenarios);
  }
  
  return { scenarios, config };
}
```

### Trial Lifecycle

```
┌──────────────┐
│  PENDING     │
└──────┬───────┘
       │ start()
       ▼
┌──────────────┐
│  RUNNING     │◄──────┐
└──────┬───────┘       │
       │               │ retry (if retries left)
       ▼               │
┌──────────────┐  fail()
│  PROCESSING  │───────┤
└──────┬───────┘       │
       │               │
       ▼               │
┌──────────────┐       │
│  COMPLETED   │   ┌───┴──────────┐
└──────────────┘   │   FAILED     │
                   └──────────────┘
```

---

## Phase 4: Statistical Analysis Pipeline

### n8n Node Mapping

| n8n Node | TypeScript Implementation | File |
|----------|---------------------------|------|
| **Data Preparer** | `buildBatchPayload()` | `src/data-preparation.ts` |
| **Matrix Builder** | `buildDataMatrix()` | `src/data-preparation.ts` |
| **Standardizer** | `buildStandardizedMatrix()` | `src/data-preparation.ts` |
| **Python HTTP Wrapper** | `PythonEngineClient` class | `src/python-engine-client.ts` |
| **Batch Processor** | `StatisticalEngine` class | `src/engine.ts` |
| **Result Aggregator** | `ResultAggregator` class | `src/aggregation.ts` |

### Data Preparation Flow

```typescript
// From n8n Data Preparer node
export function buildBatchPayload(experiments: ExperimentData[]): BatchPayload {
  // Extract dimensional data
  const dimensionalData = extractDimensionalData(experiments);
  const primaryData = dimensionalData['maac_overall_score'];
  const matrixData = buildDataMatrix(experiments);
  const standardizedMatrix = buildStandardizedMatrix(experiments);
  
  // Build method calls
  const calls: StatisticalMethodCall[] = [
    // Descriptive statistics
    { id: 'mean:1', method: 'mean', params: { X: primaryData } },
    { id: 'std:2', method: 'std', params: { X: primaryData } },
    // ... 38+ statistical methods
  ];
  
  return {
    calls,
    concurrent: true,
    max_workers: 16,
  };
}
```

### Statistical Methods Registry

| Category | Methods |
|----------|---------|
| **Descriptive** | mean, median, std, var, min, max, skew, kurtosis, iqr, percentile |
| **Normality** | shapiro, normaltest, jarque_bera |
| **Correlation** | pearson, spearman, kendall, correlation_matrix |
| **Effect Sizes** | cohens_d, hedges_g, glass_delta, eta_squared, omega_squared |
| **Reliability** | cronbach_alpha, split_half, item_total_corr |
| **Factor Analysis** | pca, efa, cfa, kmo, bartlett_sphericity |
| **Bootstrap** | bootstrap_ci, bootstrap_bca |
| **Power Analysis** | power_ttest, power_anova |
| **Robust** | robust_mean, robust_std, trimmed_mean, outlier_detection |
| **MAAC-specific** | maac_scoring_validation, maac_dimensional_statistics, maac_framework_coherence, maac_multivariate_validation |

---

## Python Statistical Engine

### Service Architecture

```
services/python-stat-engine/
├── src/maac_stat_engine/
│   ├── __init__.py
│   ├── main.py           # FastAPI application
│   ├── models.py         # Pydantic models
│   ├── methods.py        # 62 statistical methods
│   └── comprehensive.py  # Analysis orchestrator
├── pyproject.toml        # Dependencies
└── Dockerfile            # Container deployment
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check with version info |
| `/api/v1/batch` | POST | Execute batch statistical methods |
| `/api/v1/comprehensive_analysis` | POST | Full analysis pipeline |

### Request/Response Schema

```python
# Batch Request (matches TypeScript BatchPayload)
class BatchRequest(BaseModel):
    calls: list[MethodCall]
    session_id: str = "batch"

class MethodCall(BaseModel):
    id: str
    method: str
    params: dict[str, Any]

# Batch Response
class BatchResponse(BaseModel):
    session_id: str
    total_calls: int
    successful: int
    failed: int
    results: list[dict[str, Any]]
```

### Dependencies

```toml
[project.dependencies]
numpy = ">=1.26"
scipy = ">=1.11"
pandas = ">=2.1"
statsmodels = ">=0.14"
scikit-learn = ">=1.3"
pingouin = ">=0.5.3"
factor-analyzer = ">=0.5"
fastapi = ">=0.104"
uvicorn = ">=0.24"
```

---

## Validation Tests

### Test Files Created

| Package | Test File | Purpose |
|---------|-----------|---------|
| `@maac/maac-framework` | `tests/comparison.test.ts` | MAAC dimension formula validation |
| `@maac/statistical-analysis` | `tests/comparison.test.ts` | Statistical pipeline validation |
| `@maac/experiment-orchestrator` | `tests/comparison.test.ts` | Scenario/trial generation validation |
| `@maac/mimic-cognitive-engine` | `tests/comparison.test.ts` | MIMIC behavioral parity validation |

### Validation Approach

1. **Known Inputs**: Use actual data from n8n workflow executions
2. **Expected Outputs**: Capture n8n outputs for comparison
3. **Tolerance**: Use `toBeCloseTo()` with precision of 1-2 decimal places
4. **Edge Cases**: Test boundary conditions and error handling

```typescript
// Example validation test
it('cognitive load score matches n8n calculation', async () => {
  const result = await assessCognitiveLoad(n8nInput);
  expect(result.score).toBeCloseTo(n8nExpectedScore, 1);
});
```

---

## Architecture Diagrams

### Overall System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAAC Research Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │    Experiment    │───▶│      MIMIC       │                   │
│  │   Orchestrator   │    │   Cognitive      │                   │
│  │                  │    │     Engine       │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           │                       ▼                              │
│           │              ┌──────────────────┐                   │
│           │              │      MAAC        │                   │
│           │              │    Framework     │                   │
│           │              │   (9 Assessors)  │                   │
│           │              └────────┬─────────┘                   │
│           │                       │                              │
│           ▼                       ▼                              │
│  ┌──────────────────────────────────────────┐                   │
│  │          Statistical Analysis            │                   │
│  │      ┌─────────────┐  ┌─────────────┐   │                   │
│  │      │  TypeScript │──│   Python    │   │                   │
│  │      │   Client    │  │   Engine    │   │                   │
│  │      └─────────────┘  └─────────────┘   │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
ExperimentData[] 
       │
       ▼
┌──────────────────┐
│ extractDimensional│
│     Data()       │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────┐  ┌──────────┐
│Matrix│  │Dimensional│
│Data  │  │  Arrays   │
└──┬───┘  └────┬─────┘
   │           │
   ▼           ▼
┌──────────────────┐
│  buildBatch     │
│   Payload()     │
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│   Python Stat   │
│     Engine      │
│   (62 methods)  │
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│    Statistical  │
│     Results     │
└─────────────────┘
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **n8n Nodes Migrated** | 45+ |
| **TypeScript Functions** | 120+ |
| **Python Statistical Methods** | 62 |
| **MAAC Dimensions** | 9 |
| **Test Cases** | 150+ |
| **Packages Created** | 5 |

---

## Running the Tests

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm test --filter=@maac/maac-framework
pnpm test --filter=@maac/statistical-analysis
pnpm test --filter=@maac/experiment-orchestrator
pnpm test --filter=@maac/mimic-cognitive-engine

# Run Python engine tests
cd services/python-stat-engine
source .venv/bin/activate
pytest tests/
```

---

## Next Steps

1. **Integration Testing**: End-to-end tests with real LLM calls
2. **Performance Benchmarking**: Compare execution times vs n8n
3. **Data Migration**: Import historical n8n execution data
4. **Documentation**: API documentation generation
5. **Deployment**: Container orchestration setup

---

*Generated: December 18, 2025*
*MAAC Research Platform - n8n Migration Phase 5 Complete*
