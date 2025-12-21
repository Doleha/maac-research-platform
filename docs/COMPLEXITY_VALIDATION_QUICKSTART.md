# Complexity Validation - Quick Start Guide

**5-minute guide to using the validated complexity tier system**

## What It Does

Ensures all experiment scenarios pass academic complexity standards before being saved to the database. Based on peer-reviewed research (Wood 1986, Campbell 1988, Liu & Li 2012).

## How It Works

```
Generate Scenarios → Validate Complexity → Store in Database → Run Experiments
                           ↑
                    MANDATORY GATE
                  (blocks if invalid)
```

## Usage

### 1. Run Experiment (Validation Automatic)

```typescript
import { AdvancedExperimentOrchestrator } from '@maac/experiment-orchestrator';

const orchestrator = new AdvancedExperimentOrchestrator(config);

// Validation happens automatically before storage
await orchestrator.runExperiment({
  experimentId: 'exp-001',
  domains: ['analytical', 'planning'],
  tiers: ['simple', 'moderate', 'complex'],
  repetitionsPerDomainTier: 10,
  models: ['gpt_4o'],
  toolConfigs: [fullToolsConfig],
});

// ✅ All scenarios validated before storage
// ❌ Experiment fails if validation fails
```

### 2. Monitor Validation Progress

```typescript
orchestrator.on('validation:started', ({ total }) => {
  console.log(`🔍 Validating ${total} scenarios...`);
});

orchestrator.on('validation:progress', ({ current, total, scenarioId }) => {
  console.log(`[${current}/${total}] ${scenarioId}`);
});

orchestrator.on('validation:completed', ({ total }) => {
  console.log(`✅ All ${total} scenarios validated`);
});
```

### 3. Check Validation Stats (API)

```bash
# Get overall statistics
curl http://localhost:3000/api/scenarios/validation/stats

# Get specific scenario details
curl http://localhost:3000/api/scenarios/analytical-simple-001/validation

# Get score distribution
curl http://localhost:3000/api/scenarios/validation/distribution
```

### 4. Validate Standalone Scenario

```typescript
import { validateScenario } from '@maac/complexity-analyzer';

const result = await validateScenario({
  id: 'test-001',
  intendedTier: 'simple',
  content: 'Calculate Q1 revenue ($2.5M) and Q2 revenue ($2.8M). Find growth rate.',
  calculationSteps: ['Q1 revenue', 'Q2 revenue', 'Growth rate'],
  domain: 'analytical',
});

if (result.isValid) {
  console.log(`✓ Valid! Score: ${result.complexityScore.overallScore}`);
} else {
  console.log(`✗ Failed: ${result.complexityScore.rejectionReasons}`);
}
```

## Configuration

### Default Thresholds

- **Simple**: 0-15 points
- **Moderate**: 15-30 points  
- **Complex**: 30+ points

### Adjust Thresholds (Optional)

```typescript
import { validateScenario, DEFAULT_COMPLEXITY_CONFIG } from '@maac/complexity-analyzer';

const customConfig = {
  ...DEFAULT_COMPLEXITY_CONFIG,
  tierThresholds: {
    simple: { min: 0, max: 12 },    // Stricter
    moderate: { min: 12, max: 35 },
    complex: { min: 35, max: Infinity },
  },
};

const result = await validateScenario(scenario, { config: customConfig });
```

### Environment Variables

```bash
# .env
COMPLEXITY_STRICT_MODE=false           # Allow 1-tier deviation
COMPLEXITY_MAX_REGENERATION=3          # Retry attempts
COMPLEXITY_SIMPLE_MAX=15
COMPLEXITY_MODERATE_MAX=30
```

## What Gets Validated

### 1. Wood (1986) - Component Complexity
- Distinct acts (number of steps)
- Information cues (data points)
- Coordinative complexity (dependencies)
- Dynamic complexity (state changes)

### 2. Campbell (1988) - Four Sources
- Multiple solution paths
- Multiple correct outcomes
- Conflicting trade-offs
- Uncertain relationships

### 3. Liu & Li (2012) - Ten Dimensions
- Variety, Ambiguity, Novelty, Coupling, etc.

### 4. Element Interactivity
- Cognitive load from simultaneous processing

## Database Schema

Complexity metrics automatically stored with each scenario:

```sql
SELECT 
  "scenarioId",
  tier,
  "complexityScore",
  "validationPassed",
  "validatedAt"
FROM "MAACExperimentScenario"
WHERE "validationPassed" = true;
```

## Troubleshooting

### Validation Fails Unexpectedly

```typescript
// Check detailed breakdown
console.log(result.complexityScore.calculationBreakdown);
console.log(result.complexityScore.rejectionReasons);
console.log(result.complexityScore.validationFlags);
```

### Adjust Weights

```typescript
const config = {
  ...DEFAULT_COMPLEXITY_CONFIG,
  weights: {
    ...DEFAULT_COMPLEXITY_CONFIG.weights,
    elementInteractivity: 5.0,  // Increase importance
  },
};
```

### Skip Validation (NOT RECOMMENDED)

```typescript
// Only for testing/debugging
process.env.SKIP_COMPLEXITY_VALIDATION = 'true';
```

## Performance

- ⚡ **50-200ms** per scenario
- 🔄 **Parallel validation** with orchestrator
- 📊 **1000 scenarios** in ~5-10 seconds
- 💾 **Memory efficient** streaming

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /scenarios/validation/stats` | Overall statistics |
| `GET /scenarios/:id/validation` | Scenario details |
| `GET /scenarios/validation/distribution` | Score distribution |

## Next Steps

1. **Run Experiments**: Validation is automatic
2. **Monitor Stats**: Use API endpoints
3. **Calibrate** (Optional): See `docs/CALIBRATION_GUIDE.md`
4. **Test**: Add unit tests for your scenarios

## Documentation

- 📖 **Full Guide**: `packages/complexity-analyzer/README.md`
- 🔧 **Integration**: `docs/COMPLEXITY_VALIDATION_INTEGRATION.md`
- 🎯 **Calibration**: `docs/CALIBRATION_GUIDE.md`
- 📋 **Implementation**: `COMPLEXITY_VALIDATION_IMPLEMENTATION.md`

## Support

Questions? Check:
1. Framework document: `context/complexity-tier-robustness-framwork.md`
2. Type definitions: `packages/shared-types/src/complexity.ts`
3. Analyzer code: `packages/complexity-analyzer/src/`

## Academic References

- Wood (1986): *Organizational Behavior and Human Decision Processes*, 37(1), 60-82
- Campbell (1988): *Academy of Management Review*, 13(1), 40-52
- Liu & Li (2012): *Procedia Engineering*, 29, 3244-3249
