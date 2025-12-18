# Statistical Analysis

Open source statistical analysis pipeline for the MAAC Research Platform.

## Overview

This package provides statistical analysis tools for experimental data processing and analysis.

## Features

- Descriptive statistics (mean, median, standard deviation, etc.)
- Correlation analysis
- Data validation
- Result aggregation

## Usage

```typescript
import { StatisticalAnalyzer } from '@maac/statistical-analysis';

const analyzer = new StatisticalAnalyzer();
const data = [1, 2, 3, 4, 5];
const results = analyzer.analyze(data);
console.log(results);
```

## License

MIT (Open Source)
