# Complexity Validation Calibration Guide

This guide explains how to calibrate and tune the complexity validation system for optimal academic rigor.

## Overview

The complexity validation system uses configurable thresholds and weights that can be adjusted based on:
- Domain-specific requirements
- Expert validation studies
- Empirical performance data
- Academic review feedback

## Default Configuration

```typescript
export const DEFAULT_COMPLEXITY_CONFIG: ComplexityValidationConfig = {
  tierThresholds: {
    simple: { min: 0, max: 15 },
    moderate: { min: 15, max: 30 },
    complex: { min: 30, max: Infinity },
  },
  interactivityThresholds: {
    simple: { max: 0.2 },
    moderate: { min: 0.2, max: 0.5 },
    complex: { min: 0.5 },
  },
  weights: {
    woodDistinctActs: 2.0,
    woodInformationCues: 1.5,
    woodCoordinative: 3.0,
    campbellAttribute: 3.0,
    liuLiVariety: 2.0,
    liuLiAmbiguity: 2.5,
    elementInteractivity: 4.0,
  },
  strictMode: false,
  allowedTierDeviation: 1,
  maxRegenerationAttempts: 3,
};
```

## Calibration Process

### Phase 1: Expert Baseline

1. **Select Reference Scenarios** (minimum 30 per tier)
   - 10 clearly simple scenarios
   - 10 clearly moderate scenarios
   - 10 clearly complex scenarios

2. **Expert Review**
   - Have domain experts rate each scenario
   - Use Likert scale: 1 (very simple) to 7 (very complex)
   - Calculate inter-rater reliability (Cronbach's α > 0.7)

3. **Run Initial Validation**
```typescript
import { validateBatch } from '@maac/complexity-analyzer';

const referenceScenarios = [
  { id: 'ref-simple-01', intendedTier: 'simple', content: '...' },
  // ... 29 more
];

const results = await validateBatch(referenceScenarios);

// Analyze mismatches
const mismatches = results.results.filter(
  r => r.complexityScore.predictedTier !== r.scenarioId.split('-')[1]
);

console.log(`Accuracy: ${(1 - mismatches.length / 30) * 100}%`);
```

4. **Calculate Baseline Metrics**
```typescript
// Collect scores by tier
const scoresByTier = {
  simple: results.results
    .filter(r => r.scenarioId.includes('simple'))
    .map(r => r.complexityScore.overallScore),
  moderate: results.results
    .filter(r => r.scenarioId.includes('moderate'))
    .map(r => r.complexityScore.overallScore),
  complex: results.results
    .filter(r => r.scenarioId.includes('complex'))
    .map(r => r.complexityScore.overallScore),
};

// Calculate statistics
for (const [tier, scores] of Object.entries(scoresByTier)) {
  const mean = scores.reduce((a, b) => a + b) / scores.length;
  const stdDev = Math.sqrt(
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
  );
  
  console.log(`${tier}: mean=${mean.toFixed(2)}, stdDev=${stdDev.toFixed(2)}`);
  console.log(`  Suggested range: ${(mean - stdDev).toFixed(2)} - ${(mean + stdDev).toFixed(2)}`);
}
```

### Phase 2: Threshold Adjustment

Based on baseline metrics, adjust tier thresholds:

```typescript
// Example: If simple scenarios average 11.5 ± 2.5
const calibratedConfig = {
  ...DEFAULT_COMPLEXITY_CONFIG,
  tierThresholds: {
    simple: { 
      min: 0, 
      max: 14  // Mean + 1 std dev
    },
    moderate: { 
      min: 14, 
      max: 32  // Based on moderate tier statistics
    },
    complex: { 
      min: 32, 
      max: Infinity 
    },
  },
};
```

### Phase 3: Weight Optimization

Use gradient descent or manual tuning to optimize weights:

```typescript
function evaluateWeights(
  weights: ScoringWeights,
  scenarios: ReferenceScenario[]
): number {
  let correctPredictions = 0;
  
  for (const scenario of scenarios) {
    const score = calculateComplexityWithWeights(scenario, weights);
    const predictedTier = scoreToPredictedTier(score);
    
    if (predictedTier === scenario.expertTier) {
      correctPredictions++;
    }
  }
  
  return correctPredictions / scenarios.length;
}

// Grid search for optimal weights
const weightRanges = {
  woodDistinctActs: [1.0, 1.5, 2.0, 2.5, 3.0],
  woodCoordinative: [2.0, 2.5, 3.0, 3.5, 4.0],
  elementInteractivity: [3.0, 3.5, 4.0, 4.5, 5.0],
};

let bestAccuracy = 0;
let bestWeights = DEFAULT_COMPLEXITY_CONFIG.weights;

// Try different weight combinations
for (const woodActs of weightRanges.woodDistinctActs) {
  for (const woodCoord of weightRanges.woodCoordinative) {
    for (const elemInt of weightRanges.elementInteractivity) {
      const testWeights = {
        ...DEFAULT_COMPLEXITY_CONFIG.weights,
        woodDistinctActs: woodActs,
        woodCoordinative: woodCoord,
        elementInteractivity: elemInt,
      };
      
      const accuracy = evaluateWeights(testWeights, referenceScenarios);
      
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestWeights = testWeights;
      }
    }
  }
}

console.log(`Best accuracy: ${bestAccuracy * 100}%`);
console.log('Optimal weights:', bestWeights);
```

### Phase 4: Cross-Validation

Validate calibrated configuration with held-out scenarios:

```typescript
// Split data: 70% calibration, 30% validation
const calibrationSet = referenceScenarios.slice(0, 21);
const validationSet = referenceScenarios.slice(21);

// Calibrate on calibration set
const calibratedConfig = calibrateWeights(calibrationSet);

// Test on validation set
const validationResults = await validateBatch(validationSet, {
  config: calibratedConfig,
});

const accuracy = validationResults.results.filter(
  r => r.complexityScore.tierMatch
).length / validationSet.length;

console.log(`Cross-validation accuracy: ${accuracy * 100}%`);

// Minimum acceptable: 80% accuracy
if (accuracy < 0.8) {
  console.warn('⚠️  Calibration may need adjustment');
}
```

## Domain-Specific Calibration

Different domains may require different thresholds:

```typescript
const domainConfigs: Record<Domain, ComplexityValidationConfig> = {
  analytical: {
    ...DEFAULT_COMPLEXITY_CONFIG,
    weights: {
      ...DEFAULT_COMPLEXITY_CONFIG.weights,
      woodInformationCues: 2.0,  // Higher weight for data-heavy domain
      liuLiVariety: 1.5,
    },
  },
  planning: {
    ...DEFAULT_COMPLEXITY_CONFIG,
    weights: {
      ...DEFAULT_COMPLEXITY_CONFIG.weights,
      woodCoordinative: 3.5,  // Planning requires coordination
      liuLiAmbiguity: 3.0,
    },
  },
  communication: {
    ...DEFAULT_COMPLEXITY_CONFIG,
    weights: {
      ...DEFAULT_COMPLEXITY_CONFIG.weights,
      campbellAttribute: 3.5,  // Emphasis on Campbell attributes
      liuLiAmbiguity: 3.0,
    },
  },
  problem_solving: {
    ...DEFAULT_COMPLEXITY_CONFIG,
    weights: {
      ...DEFAULT_COMPLEXITY_CONFIG.weights,
      elementInteractivity: 4.5,  // Complex problem-solving
      woodCoordinative: 3.5,
    },
  },
};

// Use domain-specific config
const config = domainConfigs[scenario.domain];
const result = await validateScenario(scenario, { config });
```

## Monitoring Calibration Quality

### Confusion Matrix

```typescript
async function generateConfusionMatrix(
  scenarios: ReferenceScenario[]
): Promise<number[][]> {
  const matrix = [
    [0, 0, 0],  // simple predictions
    [0, 0, 0],  // moderate predictions
    [0, 0, 0],  // complex predictions
  ];
  
  const tierIndex = { simple: 0, moderate: 1, complex: 2 };
  
  for (const scenario of scenarios) {
    const result = await validateScenario(scenario);
    const actualIdx = tierIndex[scenario.intendedTier];
    const predictedIdx = tierIndex[result.complexityScore.predictedTier];
    matrix[predictedIdx][actualIdx]++;
  }
  
  return matrix;
}

// Example output:
//              Actual
//           S    M    C
// Pred S  [95   5    0]   // 95% precision for simple
//      M  [ 3  88    9]   // 88% precision for moderate
//      C  [ 0   8   92]   // 92% precision for complex
```

### Precision and Recall

```typescript
function calculateMetrics(matrix: number[][]) {
  const tiers = ['simple', 'moderate', 'complex'];
  
  for (let i = 0; i < 3; i++) {
    const truePositives = matrix[i][i];
    const falsePositives = matrix[i].reduce((sum, val, j) => 
      j !== i ? sum + val : sum, 0
    );
    const falseNegatives = matrix.reduce((sum, row, j) => 
      j !== i ? sum + row[i] : sum, 0
    );
    
    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / (truePositives + falseNegatives);
    const f1 = 2 * (precision * recall) / (precision + recall);
    
    console.log(`${tiers[i]}: P=${(precision*100).toFixed(1)}%, R=${(recall*100).toFixed(1)}%, F1=${f1.toFixed(3)}`);
  }
}
```

## Continuous Calibration

### Collecting Feedback

```typescript
// Store expert corrections
interface ExpertFeedback {
  scenarioId: string;
  predictedTier: Tier;
  expertTier: Tier;
  expertScore: number;
  timestamp: Date;
  expertId: string;
}

async function recordFeedback(feedback: ExpertFeedback) {
  await prisma.complexityFeedback.create({ data: feedback });
}

// Periodically recalibrate
async function recalibrate() {
  const feedback = await prisma.complexityFeedback.findMany({
    where: {
      timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }  // Last 30 days
    },
  });
  
  if (feedback.length < 50) {
    console.log('Insufficient feedback for recalibration');
    return;
  }
  
  // Run calibration algorithm
  const newConfig = await calibrateFromFeedback(feedback);
  
  // Validate improvement
  const improvement = await validateCalibrationImprovement(newConfig);
  
  if (improvement > 0.02) {  // 2% improvement
    console.log(`✓ New calibration improves accuracy by ${(improvement*100).toFixed(1)}%`);
    saveConfiguration(newConfig);
  }
}
```

## Academic Validation

### Inter-Rater Reliability

```typescript
function calculateCronbachAlpha(ratings: number[][]): number {
  // ratings[i][j] = rating from expert i for scenario j
  const k = ratings.length;  // number of raters
  const n = ratings[0].length;  // number of scenarios
  
  // Calculate variance for each rater
  const raterVariances = ratings.map(raterScores => {
    const mean = raterScores.reduce((a, b) => a + b) / n;
    return raterScores.reduce((sum, score) => 
      sum + Math.pow(score - mean, 2), 0
    ) / n;
  });
  
  // Calculate variance of sum scores
  const sumScores = Array.from({ length: n }, (_, j) =>
    ratings.reduce((sum, rater) => sum + rater[j], 0)
  );
  const sumMean = sumScores.reduce((a, b) => a + b) / n;
  const sumVariance = sumScores.reduce((sum, score) =>
    sum + Math.pow(score - sumMean, 2), 0
  ) / n;
  
  // Cronbach's α
  const alpha = (k / (k - 1)) * (1 - raterVariances.reduce((a, b) => a + b) / sumVariance);
  
  return alpha;
}

// α > 0.7: Acceptable
// α > 0.8: Good
// α > 0.9: Excellent
```

### Cohen's Kappa (Agreement)

```typescript
function calculateCohenKappa(
  predicted: Tier[],
  actual: Tier[]
): number {
  const tiers = ['simple', 'moderate', 'complex'];
  const n = predicted.length;
  
  // Observed agreement
  const observedAgreement = predicted.filter(
    (p, i) => p === actual[i]
  ).length / n;
  
  // Expected agreement by chance
  const expectedAgreement = tiers.reduce((sum, tier) => {
    const pPredicted = predicted.filter(t => t === tier).length / n;
    const pActual = actual.filter(t => t === tier).length / n;
    return sum + pPredicted * pActual;
  }, 0);
  
  const kappa = (observedAgreement - expectedAgreement) / (1 - expectedAgreement);
  
  return kappa;
}

// κ > 0.6: Substantial agreement
// κ > 0.8: Almost perfect agreement
```

## Calibration Checklist

- [ ] Collect ≥30 expert-reviewed scenarios per tier
- [ ] Calculate inter-rater reliability (α > 0.7)
- [ ] Run baseline validation
- [ ] Analyze tier boundaries
- [ ] Optimize weights (accuracy > 85%)
- [ ] Cross-validate with held-out set
- [ ] Document calibration in experiment metadata
- [ ] Set up continuous monitoring
- [ ] Schedule periodic recalibration (quarterly)

## Example Calibration Script

```typescript
#!/usr/bin/env ts-node

import { validateBatch, DEFAULT_COMPLEXITY_CONFIG } from '@maac/complexity-analyzer';
import { ReferenceScenarios } from './reference-scenarios';

async function runCalibration() {
  console.log('🔬 Starting complexity validation calibration...\n');
  
  // Step 1: Baseline
  console.log('Step 1: Baseline validation');
  const baseline = await validateBatch(ReferenceScenarios);
  const baselineAccuracy = baseline.stats.successRate / 100;
  console.log(`Baseline accuracy: ${(baselineAccuracy * 100).toFixed(1)}%\n`);
  
  // Step 2: Optimize weights
  console.log('Step 2: Optimizing weights...');
  const optimizedWeights = await optimizeWeights(ReferenceScenarios);
  console.log('Optimal weights:', optimizedWeights, '\n');
  
  // Step 3: Test optimized config
  console.log('Step 3: Testing optimized configuration');
  const optimizedConfig = {
    ...DEFAULT_COMPLEXITY_CONFIG,
    weights: optimizedWeights,
  };
  
  const optimized = await validateBatch(ReferenceScenarios, {
    config: optimizedConfig,
  });
  
  const optimizedAccuracy = optimized.stats.successRate / 100;
  console.log(`Optimized accuracy: ${(optimizedAccuracy * 100).toFixed(1)}%`);
  console.log(`Improvement: ${((optimizedAccuracy - baselineAccuracy) * 100).toFixed(1)}%\n`);
  
  // Step 4: Cross-validation
  console.log('Step 4: Cross-validation');
  const cvAccuracy = await crossValidate(ReferenceScenarios, optimizedConfig);
  console.log(`CV accuracy: ${(cvAccuracy * 100).toFixed(1)}%\n`);
  
  if (cvAccuracy >= 0.85) {
    console.log('✅ Calibration successful!');
    saveConfiguration(optimizedConfig);
  } else {
    console.log('⚠️  Calibration below threshold. Manual review recommended.');
  }
}

runCalibration().catch(console.error);
```

## Troubleshooting

### Low Accuracy (<80%)

1. **Check Reference Scenarios**: Ensure they're truly representative
2. **Verify Expert Agreement**: Calculate inter-rater reliability
3. **Analyze Failure Patterns**: Which tiers are problematic?
4. **Review Framework Weights**: May need domain-specific tuning
5. **Consider Strict Mode**: Enable for no tier deviation

### High False Positives

Scenarios incorrectly classified as more complex:
- Reduce `elementInteractivity` weight
- Increase tier threshold maximums
- Check for overly detailed scenarios

### High False Negatives

Scenarios incorrectly classified as simpler:
- Increase framework weights (especially `woodCoordinative`)
- Decrease tier threshold maximums
- Ensure scenarios include all complexity markers

## Documentation

Document all calibration results:

```markdown
## Calibration Report

**Date**: 2025-12-21
**Version**: 1.0.0
**Dataset**: 90 expert-reviewed scenarios (30 per tier)

### Results
- Baseline Accuracy: 82.5%
- Optimized Accuracy: 89.2%
- Cross-Validation: 87.8%
- Inter-Rater Reliability (α): 0.83

### Optimized Configuration
- Tier Thresholds: simple: 0-14, moderate: 14-32, complex: 32+
- Key Weight Adjustments:
  - elementInteractivity: 4.0 → 4.5
  - woodCoordinative: 3.0 → 3.5

### Recommendations
- Deploy optimized configuration to production
- Monitor for 30 days
- Recalibrate quarterly with new feedback
```

## Support

For calibration assistance:
- Review framework document: `context/complexity-tier-robustness-framwork.md`
- Consult academic references (Wood 1986, Campbell 1988, Liu & Li 2012)
- Contact domain experts for scenario reviews
