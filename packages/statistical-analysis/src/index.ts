/**
 * Statistical Analysis
 * Statistical pipeline for analyzing experimental data
 */

export interface StatisticalResult {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}

export class StatisticalAnalyzer {
  /**
   * Calculate descriptive statistics for a dataset
   */
  analyze(data: number[]): StatisticalResult {
    if (data.length === 0) {
      throw new Error('Cannot analyze empty dataset');
    }

    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;

    const median =
      data.length % 2 === 0
        ? (sorted[data.length / 2 - 1] + sorted[data.length / 2]) / 2
        : sorted[Math.floor(data.length / 2)];

    const squaredDiffs = data.map((val) => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: data.length,
    };
  }

  /**
   * Calculate correlation between two datasets
   */
  correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Datasets must have the same non-zero length');
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

export * from '@maac/types';
