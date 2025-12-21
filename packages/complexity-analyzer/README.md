# Complexity Analyzer

**Academically-grounded complexity tier validation system for MAAC research platform**

## Overview

The Complexity Analyzer ensures experimental rigor by validating that all generated scenarios meet academic standards for complexity assessment before being stored in the database. This is critical for maintaining the scientific validity of MAAC experiments.

## Theoretical Foundation

This package implements three peer-reviewed complexity frameworks:

### 1. Wood (1986) Component Complexity Model

- **Distinct Acts**: Number of independent steps required
- **Information Cues**: Unique data points needed
- **Coordinative Complexity**: Inter-dependencies between actions
- **Dynamic Complexity**: Changes in states or conditions over time

**Reference**: Wood, R. E. (1986). Task complexity: Definition of the construct. _Organizational Behavior and Human Decision Processes_, 37(1), 60-82.

### 2. Campbell (1988) Four Sources of Complexity

- **Multiple Paths**: Existence of alternative solution strategies
- **Multiple Outcomes**: Multiple possible correct answers
- **Conflicting Interdependence**: Trade-offs between objectives
- **Uncertain/Probabilistic Linkages**: Unpredictable relationships

**Reference**: Campbell, D. J. (1988). Task Complexity: A Review and Analysis. _Academy of Management Review_, 13(1), 40-52.

### 3. Liu & Li (2012) Ten-Dimension Framework

Ten dimensions capturing task complexity breadth:

- Variety, Ambiguity, Instability, Coupling, Novelty, Time Pressure, Equivocality, Scope, Work Flow, Coordination

**Reference**: Liu, L., & Li, X. (2012). Multidimensional Task Complexity: A Ten-Dimensional Framework. _Procedia Engineering_, 29, 3244-3249.

### 4. Cognitive Load Theory - Element Interactivity

Measures the degree to which elements must be processed simultaneously, based on Sweller's Cognitive Load Theory.

**Reference**: Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. _Cognitive Science_, 12(2), 257-285.

## Features

- ✅ **No Unvalidated Storage**: Scenarios MUST pass validation before database insertion
- ✅ **Parallel-Safe**: Works with concurrent scenario generation (BullMQ)
- ✅ **Comprehensive Metrics**: All three frameworks + element interactivity
- ✅ **Automatic Regeneration**: Failed scenarios can be regenerated with enhanced prompts
- ✅ **Progress Events**: Real-time validation feedback
- ✅ **TypeScript-First**: Full type safety with detailed interfaces

## Installation

This package is part of the MAAC monorepo and uses workspace dependencies:

```bash
pnpm install
```

## Usage

### Quick Start

```typescript
import { validateScenario } from '@maac/complexity-analyzer';

const scenario = {
  id: 'analytical-simple-001',
  intendedTier: 'simple',
  content: 'Calculate quarterly revenue growth...',
  calculationSteps: ['Q1 revenue', 'Q2 revenue', 'Growth rate'],
  domain: 'analytical',
};

const result = await validateScenario(scenario);

if (result.isValid) {
  console.log(`Score: ${result.complexityScore.overallScore}`);
  console.log(`Predicted Tier: ${result.complexityScore.predictedTier}`);
} else {
  console.log(`Validation failed: ${result.complexityScore.rejectionReasons}`);
}
```

### Individual Framework Analysis

```typescript
import {
  analyzeWoodMetrics,
  analyzeCampbellAttributes,
  analyzeLiuLiDimensions,
  analyzeElementInteractivity,
} from '@maac/complexity-analyzer';

// Wood Analysis
const woodMetrics = analyzeWoodMetrics({
  taskDescription: 'Analyze sales data...',
  calculationSteps: ['Step 1', 'Step 2'],
  variables: [{ name: 'revenue', type: 'number' }],
  relationships: [{ from: 'Q1', to: 'Q2', type: 'comparison' }],
});

// Campbell Analysis
const campbellAttributes = analyzeCampbellAttributes({
  taskDescription: 'Multi-region analysis...',
  successCriteria: ['Calculate ROI', 'Rank regions'],
  solutionPaths: ['Path A', 'Path B'],
});

// Liu & Li Analysis
const liuLiDimensions = analyzeLiuLiDimensions({
  taskDescription: 'Complex forecasting...',
  domain: 'analytical',
  scenarioRequirements: ['Data analysis', 'Forecasting'],
});

// Element Interactivity
const interactivity = analyzeElementInteractivity({
  taskDescription: 'Multi-step calculation...',
  calculationSteps: ['Step 1', 'Step 2', 'Step 3'],
  variableCount: 8,
  relationshipCount: 12,
});
```

### Batch Validation

```typescript
import { validateBatch } from '@maac/complexity-analyzer';

const scenarios = [
  { id: '1', intendedTier: 'simple', content: '...' },
  { id: '2', intendedTier: 'moderate', content: '...' },
  { id: '3', intendedTier: 'complex', content: '...' },
];

const results = await validateBatch(scenarios, {
  onProgress: (event) => {
    console.log(`${event.current}/${event.total} completed`);
  },
});

console.log(`Success rate: ${results.stats.successRate}%`);
console.log(`Failures: ${results.failed.length}`);
```

### Custom Configuration

```typescript
import { validateScenario, DEFAULT_COMPLEXITY_CONFIG } from '@maac/complexity-analyzer';

const customConfig = {
  ...DEFAULT_COMPLEXITY_CONFIG,
  tierThresholds: {
    simple: { min: 0, max: 12 }, // Stricter simple tier
    moderate: { min: 12, max: 35 },
    complex: { min: 35, max: Infinity },
  },
  strictMode: true, // No tier deviation allowed
  maxRegenerationAttempts: 5,
};

const result = await validateScenario(scenario, {
  config: customConfig,
});
```

## API Reference

### Core Functions

#### `validateScenario(scenario, options?)`

Validates a single scenario against all complexity frameworks.

**Parameters:**

- `scenario: ScenarioInput` - Scenario to validate
- `options?: ValidationOptions` - Configuration and callbacks

**Returns:** `Promise<ScenarioValidationResult>`

#### `validateBatch(scenarios, options?)`

Validates multiple scenarios in parallel.

**Parameters:**

- `scenarios: ScenarioInput[]` - Array of scenarios
- `options?: ValidationOptions` - Configuration and callbacks

**Returns:** `Promise<ValidationBatchStats>`

#### `analyzeComplexity(scenario)`

Quick complexity analysis without validation.

**Parameters:**

- `scenario: ScenarioInput` - Scenario to analyze

**Returns:** `Promise<ComplexityScore>`

### Configuration

#### Default Tier Thresholds

```typescript
{
  simple: { min: 0, max: 15 },
  moderate: { min: 15, max: 30 },
  complex: { min: 30, max: Infinity }
}
```

#### Scoring Weights

```typescript
{
  woodDistinctActs: 2.0,
  woodInformationCues: 1.5,
  woodCoordinative: 3.0,
  campbellAttribute: 3.0,
  liuLiVariety: 2.0,
  liuLiAmbiguity: 2.5,
  elementInteractivity: 4.0
}
```

Weights are calibrated based on cognitive load research and MAAC framework requirements.

## Integration with Orchestrator

The complexity analyzer is automatically integrated into the experiment orchestration pipeline:

```typescript
// In experiment-orchestrator/src/orchestrator.ts
private async storeScenarios(scenarios: Scenario[]): Promise<void> {
  // All scenarios are validated before storage
  const validatedScenarios = await Promise.all(
    scenarios.map(async (scenario) => {
      const validation = await validateScenario(scenario);
      if (!validation.isValid) {
        throw new Error('Validation failed');
      }
      return { scenario, complexityMetrics: validation.complexityScore };
    })
  );

  // Store with complexity metrics
  await database.createMany({ data: validatedScenarios });
}
```

## Database Schema

Complexity metrics are stored with each scenario:

```prisma
model MAACExperimentScenario {
  scenarioId           String   @id
  tier                 String   // simple, moderate, complex

  // Validation fields
  validationPassed     Boolean  @default(false)
  complexityScore      Float?
  woodMetrics          Json?
  campbellAttributes   Json?
  liuLiDimensions      Json?
  validatedAt          DateTime?
}
```

## Validation Events

The orchestrator emits events during validation:

```typescript
orchestrator.on('validation:started', ({ total }) => {
  console.log(`Starting validation of ${total} scenarios`);
});

orchestrator.on('validation:progress', ({ current, total, scenarioId }) => {
  console.log(`[${current}/${total}] Validated ${scenarioId}`);
});

orchestrator.on('validation:completed', ({ total }) => {
  console.log(`All ${total} scenarios validated successfully`);
});

orchestrator.on('validation:failed', ({ scenarioId, rejectionReasons }) => {
  console.error(`${scenarioId} failed:`, rejectionReasons);
});
```

## Performance

- **Parallel Validation**: All scenarios validated concurrently
- **Typical Duration**: 50-200ms per scenario
- **Memory Efficient**: Streaming analysis for large batches
- **No External Dependencies**: Pure TypeScript implementation

## Testing

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test wood-analyzer
pnpm test validation-engine

# Watch mode
pnpm test --watch
```

## Academic Rigor

This implementation follows academic best practices:

1. **Peer-Reviewed Frameworks**: All metrics based on published research
2. **Transparent Scoring**: Clear calculation breakdowns
3. **Reproducible Results**: Version-tracked analyzer
4. **Calibration Support**: Tunable thresholds for different domains
5. **Validation Logs**: Full audit trail of all validations

## Troubleshooting

### Common Issues

**Scenario fails validation unexpectedly:**

```typescript
// Check individual framework scores
console.log(result.complexityScore.calculationBreakdown);

// Review rejection reasons
console.log(result.complexityScore.rejectionReasons);

// Check tier bounds
console.log(result.complexityScore.validationFlags);
```

**Scores seem inconsistent:**

- Verify scenario content includes all required information
- Check that calculationSteps are provided
- Ensure domain is set correctly for novelty assessment

**Performance issues:**

- Use batch validation for multiple scenarios
- Increase parallelism in orchestrator config
- Profile with `validationDurationMs` metric

## Contributing

When modifying complexity analysis logic:

1. Update relevant framework analyzer
2. Add tests with known scenarios
3. Verify against academic literature
4. Update calibration documentation
5. Run full test suite

## License

MIT - See LICENSE file in repository root

## References

- Wood, R. E. (1986). Task complexity: Definition of the construct. _Organizational Behavior and Human Decision Processes_, 37(1), 60-82.
- Campbell, D. J. (1988). Task Complexity: A Review and Analysis. _Academy of Management Review_, 13(1), 40-52.
- Liu, L., & Li, X. (2012). Multidimensional Task Complexity. _Procedia Engineering_, 29, 3244-3249.
- Sweller, J. (1988). Cognitive load during problem solving. _Cognitive Science_, 12(2), 257-285.

## Support

For issues or questions:

- GitHub Issues: [maac-research-platform/issues](https://github.com/Doleha/maac-research-platform/issues)
- Documentation: See `/context/complexity-tier-robustness-framwork.md`
