# MAAC Statistical Engine

Python statistical analysis service for the MAAC (Multi-dimensional AI Assessment for Cognition) research platform.

## Overview

This service provides comprehensive statistical analysis capabilities including:

- **170+ statistical methods** for experimental data analysis
- **Multi-dimensional analysis** across 9 MAAC cognitive dimensions
- **Factor analysis** (PCA, EFA, CFA)
- **Multivariate analysis** (MANOVA, discriminant analysis)
- **Bayesian statistics** (Bayes factors, credible intervals)
- **Effect size calculations** (Cohen's d, Hedge's g, η², ω²)
- **Reliability analysis** (Cronbach's α, split-half, item-total correlations)

## Installation

### Using pip

```bash
cd services/python-stat-engine
pip install -e .
```

### Using Docker

```bash
docker build -t maac-stat-engine .
docker run -p 8000:8000 maac-stat-engine
```

## Running the Service

```bash
# Development mode
uvicorn maac_stat_engine.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
maac-stat-engine
```

## API Endpoints

### Health Check

```
GET /health
```

### Comprehensive Analysis

```
POST /api/v1/comprehensive_analysis
Content-Type: application/json

{
  "experiments": [...],
  "session_id": "tier2_123456"
}
```

### Batch Analysis (170+ methods)

```
POST /api/v1/batch
Content-Type: application/json

{
  "calls": [
    {"id": "mean:1", "method": "mean", "params": {"X": [1,2,3,4,5]}},
    {"id": "std:1", "method": "std", "params": {"X": [1,2,3,4,5]}}
  ],
  "session_id": "batch_123"
}
```

## Supported Statistical Methods

### Descriptive Statistics

- `mean`, `median`, `std`, `var`, `sem`
- `minimum`, `maximum`, `range`
- `skew`, `kurtosis`
- `percentile`, `quantile`, `iqr`

### Correlational Analysis

- `pearson`, `spearman`, `kendall`
- `point_biserial`, `partial_correlation`
- `correlation_matrix`

### Hypothesis Testing

- `one_sample_ttest`, `independent_ttest`, `paired_ttest`
- `welch_ttest`, `one_way_anova`, `repeated_measures_anova`
- `kruskal_wallis`, `friedman`, `mann_whitney`
- `wilcoxon`, `shapiro_wilk`, `levene`, `bartlett`

### Effect Sizes

- `cohens_d`, `hedges_g`, `glass_delta`
- `eta_squared`, `omega_squared`, `partial_eta_squared`
- `cohens_f`, `cohens_f_squared`

### Factor Analysis

- `pca` (Principal Component Analysis)
- `efa` (Exploratory Factor Analysis)
- `cfa` (Confirmatory Factor Analysis)

### Multivariate Analysis

- `manova` (Multivariate ANOVA)
- `discriminant_analysis`
- `hotelling_t2`

### Reliability Analysis

- `cronbach_alpha`
- `split_half_reliability`
- `item_total_correlation`
- `guttman_lambda6`

### Advanced Methods

- `bootstrap_ci` (Bootstrap Confidence Intervals)
- `mediation_analysis`
- `power_analysis`
- `bayes_factor`

## Environment Variables

| Variable    | Default | Description                |
| ----------- | ------- | -------------------------- |
| `PORT`      | 8000    | Server port                |
| `HOST`      | 0.0.0.0 | Server host                |
| `LOG_LEVEL` | info    | Logging level              |
| `WORKERS`   | 4       | Number of worker processes |

## License

MIT
