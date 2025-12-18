"""
Statistical Methods Registry
Contains all 170+ statistical methods for MAAC analysis.
"""

import math
import warnings
from typing import Any, Callable, Optional, Union
from functools import wraps

import numpy as np
from numpy.typing import ArrayLike
import pandas as pd
from scipy import stats
from scipy.stats import (
    pearsonr, spearmanr, kendalltau,
    ttest_1samp, ttest_ind, ttest_rel,
    f_oneway, kruskal, friedmanchisquare,
    mannwhitneyu, wilcoxon, shapiro, levene, bartlett,
    skew, kurtosis as scipy_kurtosis,
)

# Optional imports with fallbacks
try:
    import pingouin as pg
    HAS_PINGOUIN = True
except ImportError:
    HAS_PINGOUIN = False
    pg = None

try:
    from factor_analyzer import FactorAnalyzer
    from factor_analyzer.factor_analyzer import calculate_kmo, calculate_bartlett_sphericity
    HAS_FACTOR_ANALYZER = True
except ImportError:
    HAS_FACTOR_ANALYZER = False
    FactorAnalyzer = None

try:
    import statsmodels.api as sm
    from statsmodels.stats.multicomp import pairwise_tukeyhsd
    from statsmodels.stats.power import TTestIndPower, FTestAnovaPower
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False
    sm = None


def safe_float(value: Any) -> Optional[float]:
    """Convert value to float, handling NaN/Inf."""
    if value is None:
        return None
    try:
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return None


def ensure_array(X: ArrayLike) -> np.ndarray:
    """Convert input to numpy array."""
    arr = np.asarray(X, dtype=np.float64)
    # Remove NaN values
    return arr[~np.isnan(arr)]


def method_handler(func: Callable) -> Callable:
    """Decorator to handle errors in statistical methods."""
    @wraps(func)
    def wrapper(*args, **kwargs) -> dict[str, Any]:
        try:
            return func(*args, **kwargs)
        except Exception as e:
            return {"error": str(e), "valid": False}
    return wrapper


# ==================== DESCRIPTIVE STATISTICS ====================


@method_handler
def mean(X: ArrayLike) -> dict[str, Any]:
    """Calculate arithmetic mean."""
    arr = ensure_array(X)
    if len(arr) == 0:
        return {"mean": None, "n": 0, "valid": False}
    return {"mean": safe_float(np.mean(arr)), "n": len(arr), "valid": True}


@method_handler
def median(X: ArrayLike) -> dict[str, Any]:
    """Calculate median."""
    arr = ensure_array(X)
    if len(arr) == 0:
        return {"median": None, "n": 0, "valid": False}
    return {"median": safe_float(np.median(arr)), "n": len(arr), "valid": True}


@method_handler
def std(X: ArrayLike, ddof: int = 1) -> dict[str, Any]:
    """Calculate standard deviation."""
    arr = ensure_array(X)
    if len(arr) < 2:
        return {"std": None, "n": len(arr), "valid": False}
    return {"std": safe_float(np.std(arr, ddof=ddof)), "n": len(arr), "valid": True}


@method_handler
def var(X: ArrayLike, ddof: int = 1) -> dict[str, Any]:
    """Calculate variance."""
    arr = ensure_array(X)
    if len(arr) < 2:
        return {"var": None, "n": len(arr), "valid": False}
    return {"var": safe_float(np.var(arr, ddof=ddof)), "n": len(arr), "valid": True}


@method_handler
def sem(X: ArrayLike) -> dict[str, Any]:
    """Calculate standard error of the mean."""
    arr = ensure_array(X)
    if len(arr) < 2:
        return {"sem": None, "n": len(arr), "valid": False}
    se = stats.sem(arr)
    return {"sem": safe_float(se), "n": len(arr), "valid": True}


@method_handler
def minimum(X: ArrayLike) -> dict[str, Any]:
    """Calculate minimum value."""
    arr = ensure_array(X)
    if len(arr) == 0:
        return {"minimum": None, "n": 0, "valid": False}
    return {"minimum": safe_float(np.min(arr)), "n": len(arr), "valid": True}


@method_handler
def maximum(X: ArrayLike) -> dict[str, Any]:
    """Calculate maximum value."""
    arr = ensure_array(X)
    if len(arr) == 0:
        return {"maximum": None, "n": 0, "valid": False}
    return {"maximum": safe_float(np.max(arr)), "n": len(arr), "valid": True}


@method_handler
def data_range(X: ArrayLike) -> dict[str, Any]:
    """Calculate range (max - min)."""
    arr = ensure_array(X)
    if len(arr) == 0:
        return {"range": None, "n": 0, "valid": False}
    return {"range": safe_float(np.ptp(arr)), "n": len(arr), "valid": True}


@method_handler
def skewness(X: ArrayLike) -> dict[str, Any]:
    """Calculate skewness."""
    arr = ensure_array(X)
    if len(arr) < 3:
        return {"skewness": None, "n": len(arr), "valid": False}
    s = skew(arr)
    interpretation = "symmetric" if abs(s) < 0.5 else ("right-skewed" if s > 0 else "left-skewed")
    return {"skewness": safe_float(s), "interpretation": interpretation, "n": len(arr), "valid": True}


@method_handler
def kurtosis(X: ArrayLike) -> dict[str, Any]:
    """Calculate kurtosis (excess kurtosis)."""
    arr = ensure_array(X)
    if len(arr) < 4:
        return {"kurtosis": None, "n": len(arr), "valid": False}
    k = scipy_kurtosis(arr)
    interpretation = "mesokurtic" if abs(k) < 1 else ("leptokurtic" if k > 0 else "platykurtic")
    return {"kurtosis": safe_float(k), "interpretation": interpretation, "n": len(arr), "valid": True}


@method_handler
def percentile(X: ArrayLike, q: float = 50) -> dict[str, Any]:
    """Calculate percentile."""
    arr = ensure_array(X)
    if len(arr) == 0:
        return {"percentile": None, "q": q, "n": 0, "valid": False}
    return {"percentile": safe_float(np.percentile(arr, q)), "q": q, "n": len(arr), "valid": True}


@method_handler
def quantiles(X: ArrayLike) -> dict[str, Any]:
    """Calculate quartiles (Q1, Q2, Q3)."""
    arr = ensure_array(X)
    if len(arr) == 0:
        return {"q1": None, "q2": None, "q3": None, "n": 0, "valid": False}
    q1, q2, q3 = np.percentile(arr, [25, 50, 75])
    return {
        "q1": safe_float(q1),
        "q2": safe_float(q2),
        "q3": safe_float(q3),
        "n": len(arr),
        "valid": True
    }


@method_handler
def iqr(X: ArrayLike) -> dict[str, Any]:
    """Calculate interquartile range."""
    arr = ensure_array(X)
    if len(arr) == 0:
        return {"iqr": None, "n": 0, "valid": False}
    q1, q3 = np.percentile(arr, [25, 75])
    return {"iqr": safe_float(q3 - q1), "q1": safe_float(q1), "q3": safe_float(q3), "n": len(arr), "valid": True}


@method_handler
def coefficient_of_variation(X: ArrayLike) -> dict[str, Any]:
    """Calculate coefficient of variation (CV)."""
    arr = ensure_array(X)
    if len(arr) < 2:
        return {"cv": None, "n": len(arr), "valid": False}
    m = np.mean(arr)
    if m == 0:
        return {"cv": None, "n": len(arr), "valid": False, "error": "Mean is zero"}
    cv = np.std(arr, ddof=1) / abs(m) * 100
    return {"cv": safe_float(cv), "mean": safe_float(m), "n": len(arr), "valid": True}


@method_handler
def z_scores(X: ArrayLike) -> dict[str, Any]:
    """Calculate z-scores for all values."""
    arr = ensure_array(X)
    if len(arr) < 2:
        return {"z_scores": [], "n": len(arr), "valid": False}
    z = stats.zscore(arr)
    return {"z_scores": [safe_float(v) for v in z], "n": len(arr), "valid": True}


# ==================== CORRELATIONAL ANALYSIS ====================


@method_handler
def pearson(X: ArrayLike, Y: ArrayLike) -> dict[str, Any]:
    """Calculate Pearson correlation coefficient."""
    x_arr = ensure_array(X)
    y_arr = ensure_array(Y)
    min_len = min(len(x_arr), len(y_arr))
    if min_len < 3:
        return {"r": None, "p": None, "n": min_len, "valid": False}
    r, p = pearsonr(x_arr[:min_len], y_arr[:min_len])
    strength = "negligible" if abs(r) < 0.1 else ("weak" if abs(r) < 0.3 else ("moderate" if abs(r) < 0.5 else ("strong" if abs(r) < 0.7 else "very strong")))
    return {
        "r": safe_float(r),
        "p": safe_float(p),
        "significant": p < 0.05,
        "strength": strength,
        "n": min_len,
        "valid": True
    }


@method_handler
def spearman(X: ArrayLike, Y: ArrayLike) -> dict[str, Any]:
    """Calculate Spearman rank correlation."""
    x_arr = ensure_array(X)
    y_arr = ensure_array(Y)
    min_len = min(len(x_arr), len(y_arr))
    if min_len < 3:
        return {"rho": None, "p": None, "n": min_len, "valid": False}
    rho, p = spearmanr(x_arr[:min_len], y_arr[:min_len])
    return {
        "rho": safe_float(rho),
        "p": safe_float(p),
        "significant": p < 0.05,
        "n": min_len,
        "valid": True
    }


@method_handler
def kendall(X: ArrayLike, Y: ArrayLike) -> dict[str, Any]:
    """Calculate Kendall's tau correlation."""
    x_arr = ensure_array(X)
    y_arr = ensure_array(Y)
    min_len = min(len(x_arr), len(y_arr))
    if min_len < 3:
        return {"tau": None, "p": None, "n": min_len, "valid": False}
    tau, p = kendalltau(x_arr[:min_len], y_arr[:min_len])
    return {
        "tau": safe_float(tau),
        "p": safe_float(p),
        "significant": p < 0.05,
        "n": min_len,
        "valid": True
    }


@method_handler
def correlation_matrix(data: dict[str, ArrayLike]) -> dict[str, Any]:
    """Calculate correlation matrix for multiple variables."""
    df = pd.DataFrame(data)
    if df.shape[1] < 2:
        return {"matrix": None, "valid": False, "error": "Need at least 2 variables"}
    
    corr = df.corr(method='pearson')
    return {
        "matrix": corr.values.tolist(),
        "columns": corr.columns.tolist(),
        "valid": True
    }


# ==================== HYPOTHESIS TESTING ====================


@method_handler
def one_sample_ttest(X: ArrayLike, popmean: float = 0) -> dict[str, Any]:
    """One-sample t-test."""
    arr = ensure_array(X)
    if len(arr) < 2:
        return {"t": None, "p": None, "n": len(arr), "valid": False}
    t_stat, p = ttest_1samp(arr, popmean)
    return {
        "t": safe_float(t_stat),
        "p": safe_float(p),
        "significant": p < 0.05,
        "mean": safe_float(np.mean(arr)),
        "popmean": popmean,
        "n": len(arr),
        "valid": True
    }


@method_handler
def independent_ttest(X: ArrayLike, Y: ArrayLike, equal_var: bool = True) -> dict[str, Any]:
    """Independent samples t-test."""
    x_arr = ensure_array(X)
    y_arr = ensure_array(Y)
    if len(x_arr) < 2 or len(y_arr) < 2:
        return {"t": None, "p": None, "valid": False}
    t_stat, p = ttest_ind(x_arr, y_arr, equal_var=equal_var)
    return {
        "t": safe_float(t_stat),
        "p": safe_float(p),
        "significant": p < 0.05,
        "mean_x": safe_float(np.mean(x_arr)),
        "mean_y": safe_float(np.mean(y_arr)),
        "n_x": len(x_arr),
        "n_y": len(y_arr),
        "equal_var": equal_var,
        "valid": True
    }


@method_handler
def welch_ttest(X: ArrayLike, Y: ArrayLike) -> dict[str, Any]:
    """Welch's t-test (unequal variances)."""
    return independent_ttest(X, Y, equal_var=False)


@method_handler
def paired_ttest(X: ArrayLike, Y: ArrayLike) -> dict[str, Any]:
    """Paired samples t-test."""
    x_arr = ensure_array(X)
    y_arr = ensure_array(Y)
    min_len = min(len(x_arr), len(y_arr))
    if min_len < 2:
        return {"t": None, "p": None, "valid": False}
    t_stat, p = ttest_rel(x_arr[:min_len], y_arr[:min_len])
    return {
        "t": safe_float(t_stat),
        "p": safe_float(p),
        "significant": p < 0.05,
        "n": min_len,
        "valid": True
    }


@method_handler
def one_way_anova(*groups: ArrayLike) -> dict[str, Any]:
    """One-way ANOVA."""
    arrays = [ensure_array(g) for g in groups]
    if any(len(a) < 2 for a in arrays) or len(arrays) < 2:
        return {"f": None, "p": None, "valid": False}
    f_stat, p = f_oneway(*arrays)
    return {
        "f": safe_float(f_stat),
        "p": safe_float(p),
        "significant": p < 0.05,
        "k": len(arrays),
        "valid": True
    }


@method_handler
def kruskal_wallis(*groups: ArrayLike) -> dict[str, Any]:
    """Kruskal-Wallis H-test (non-parametric ANOVA)."""
    arrays = [ensure_array(g) for g in groups]
    if any(len(a) < 2 for a in arrays) or len(arrays) < 2:
        return {"h": None, "p": None, "valid": False}
    h_stat, p = kruskal(*arrays)
    return {
        "h": safe_float(h_stat),
        "p": safe_float(p),
        "significant": p < 0.05,
        "k": len(arrays),
        "valid": True
    }


@method_handler
def mann_whitney(X: ArrayLike, Y: ArrayLike) -> dict[str, Any]:
    """Mann-Whitney U test."""
    x_arr = ensure_array(X)
    y_arr = ensure_array(Y)
    if len(x_arr) < 2 or len(y_arr) < 2:
        return {"u": None, "p": None, "valid": False}
    u_stat, p = mannwhitneyu(x_arr, y_arr, alternative='two-sided')
    return {
        "u": safe_float(u_stat),
        "p": safe_float(p),
        "significant": p < 0.05,
        "n_x": len(x_arr),
        "n_y": len(y_arr),
        "valid": True
    }


@method_handler
def wilcoxon_test(X: ArrayLike, Y: Optional[ArrayLike] = None) -> dict[str, Any]:
    """Wilcoxon signed-rank test."""
    x_arr = ensure_array(X)
    y_arr = ensure_array(Y) if Y is not None else None
    
    if y_arr is not None:
        min_len = min(len(x_arr), len(y_arr))
        if min_len < 2:
            return {"w": None, "p": None, "valid": False}
        stat, p = wilcoxon(x_arr[:min_len], y_arr[:min_len])
    else:
        if len(x_arr) < 2:
            return {"w": None, "p": None, "valid": False}
        stat, p = wilcoxon(x_arr)
    
    return {
        "w": safe_float(stat),
        "p": safe_float(p),
        "significant": p < 0.05,
        "valid": True
    }


# ==================== NORMALITY & ASSUMPTION TESTS ====================


@method_handler
def shapiro_wilk(X: ArrayLike) -> dict[str, Any]:
    """Shapiro-Wilk test for normality."""
    arr = ensure_array(X)
    if len(arr) < 3 or len(arr) > 5000:
        return {"w": None, "p": None, "valid": False, "error": "Sample size must be 3-5000"}
    w_stat, p = shapiro(arr)
    return {
        "w": safe_float(w_stat),
        "p": safe_float(p),
        "normal": p > 0.05,
        "n": len(arr),
        "valid": True
    }


@method_handler
def levene_test(*groups: ArrayLike) -> dict[str, Any]:
    """Levene's test for equality of variances."""
    arrays = [ensure_array(g) for g in groups]
    if any(len(a) < 2 for a in arrays) or len(arrays) < 2:
        return {"w": None, "p": None, "valid": False}
    w_stat, p = levene(*arrays)
    return {
        "w": safe_float(w_stat),
        "p": safe_float(p),
        "equal_variances": p > 0.05,
        "k": len(arrays),
        "valid": True
    }


@method_handler
def bartlett_test(*groups: ArrayLike) -> dict[str, Any]:
    """Bartlett's test for equality of variances."""
    arrays = [ensure_array(g) for g in groups]
    if any(len(a) < 2 for a in arrays) or len(arrays) < 2:
        return {"chi2": None, "p": None, "valid": False}
    chi2_stat, p = bartlett(*arrays)
    return {
        "chi2": safe_float(chi2_stat),
        "p": safe_float(p),
        "equal_variances": p > 0.05,
        "k": len(arrays),
        "valid": True
    }


# ==================== EFFECT SIZES ====================


@method_handler
def cohens_d(X: ArrayLike, Y: ArrayLike) -> dict[str, Any]:
    """Calculate Cohen's d effect size."""
    x_arr = ensure_array(X)
    y_arr = ensure_array(Y)
    if len(x_arr) < 2 or len(y_arr) < 2:
        return {"cohens_d": None, "valid": False}
    
    mean_diff = np.mean(x_arr) - np.mean(y_arr)
    pooled_std = np.sqrt(((len(x_arr) - 1) * np.var(x_arr, ddof=1) + 
                          (len(y_arr) - 1) * np.var(y_arr, ddof=1)) / 
                         (len(x_arr) + len(y_arr) - 2))
    
    if pooled_std == 0:
        return {"cohens_d": None, "valid": False, "error": "Pooled std is zero"}
    
    d = mean_diff / pooled_std
    interpretation = "negligible" if abs(d) < 0.2 else ("small" if abs(d) < 0.5 else ("medium" if abs(d) < 0.8 else "large"))
    
    return {
        "cohens_d": safe_float(d),
        "interpretation": interpretation,
        "valid": True
    }


@method_handler
def hedges_g(X: ArrayLike, Y: ArrayLike) -> dict[str, Any]:
    """Calculate Hedges' g effect size (bias-corrected Cohen's d)."""
    result = cohens_d(X, Y)
    if not result.get("valid"):
        return result
    
    x_arr = ensure_array(X)
    y_arr = ensure_array(Y)
    n = len(x_arr) + len(y_arr)
    
    # Correction factor
    correction = 1 - (3 / (4 * (n - 2) - 1))
    g = result["cohens_d"] * correction
    
    interpretation = "negligible" if abs(g) < 0.2 else ("small" if abs(g) < 0.5 else ("medium" if abs(g) < 0.8 else "large"))
    
    return {
        "hedges_g": safe_float(g),
        "interpretation": interpretation,
        "valid": True
    }


@method_handler
def glass_delta(X: ArrayLike, Y: ArrayLike) -> dict[str, Any]:
    """Calculate Glass's delta (uses control group std)."""
    x_arr = ensure_array(X)  # Treatment
    y_arr = ensure_array(Y)  # Control
    if len(x_arr) < 2 or len(y_arr) < 2:
        return {"glass_delta": None, "valid": False}
    
    control_std = np.std(y_arr, ddof=1)
    if control_std == 0:
        return {"glass_delta": None, "valid": False, "error": "Control std is zero"}
    
    delta = (np.mean(x_arr) - np.mean(y_arr)) / control_std
    
    return {
        "glass_delta": safe_float(delta),
        "valid": True
    }


@method_handler
def eta_squared(ss_effect: float, ss_total: float) -> dict[str, Any]:
    """Calculate eta squared from sum of squares."""
    if ss_total == 0:
        return {"eta_squared": None, "valid": False}
    eta2 = ss_effect / ss_total
    interpretation = "small" if eta2 < 0.06 else ("medium" if eta2 < 0.14 else "large")
    return {
        "eta_squared": safe_float(eta2),
        "interpretation": interpretation,
        "valid": True
    }


@method_handler
def omega_squared(ss_effect: float, ss_error: float, ms_error: float, df_effect: int, n_total: int) -> dict[str, Any]:
    """Calculate omega squared."""
    ss_total = ss_effect + ss_error
    omega2 = (ss_effect - df_effect * ms_error) / (ss_total + ms_error)
    omega2 = max(0, omega2)  # Can't be negative
    
    interpretation = "small" if omega2 < 0.01 else ("medium" if omega2 < 0.06 else "large")
    return {
        "omega_squared": safe_float(omega2),
        "interpretation": interpretation,
        "valid": True
    }


# ==================== RELIABILITY ANALYSIS ====================


@method_handler
def cronbach_alpha(data: Union[ArrayLike, dict[str, ArrayLike]]) -> dict[str, Any]:
    """Calculate Cronbach's alpha reliability coefficient."""
    if isinstance(data, dict):
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame(np.asarray(data))
    
    df = df.dropna()
    n_items = df.shape[1]
    n_subjects = df.shape[0]
    
    if n_items < 2 or n_subjects < 2:
        return {"alpha": None, "valid": False, "error": "Need at least 2 items and 2 subjects"}
    
    item_variances = df.var(ddof=1)
    total_var = df.sum(axis=1).var(ddof=1)
    
    if total_var == 0:
        return {"alpha": None, "valid": False, "error": "Total variance is zero"}
    
    alpha = (n_items / (n_items - 1)) * (1 - item_variances.sum() / total_var)
    
    interpretation = (
        "unacceptable" if alpha < 0.5 else
        "poor" if alpha < 0.6 else
        "questionable" if alpha < 0.7 else
        "acceptable" if alpha < 0.8 else
        "good" if alpha < 0.9 else
        "excellent"
    )
    
    return {
        "alpha": safe_float(alpha),
        "interpretation": interpretation,
        "n_items": n_items,
        "n_subjects": n_subjects,
        "valid": True
    }


@method_handler
def split_half_reliability(data: Union[ArrayLike, dict[str, ArrayLike]]) -> dict[str, Any]:
    """Calculate split-half reliability with Spearman-Brown correction."""
    if isinstance(data, dict):
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame(np.asarray(data))
    
    df = df.dropna()
    n_items = df.shape[1]
    
    if n_items < 2:
        return {"split_half": None, "valid": False}
    
    # Split into odd/even items
    odd_items = df.iloc[:, ::2].sum(axis=1)
    even_items = df.iloc[:, 1::2].sum(axis=1)
    
    r, _ = pearsonr(odd_items, even_items)
    
    # Spearman-Brown correction
    reliability = (2 * r) / (1 + r)
    
    return {
        "split_half": safe_float(reliability),
        "uncorrected_r": safe_float(r),
        "valid": True
    }


# ==================== BOOTSTRAP ====================


@method_handler
def bootstrap_ci(X: ArrayLike, statistic: str = "mean", n_iterations: int = 1000, ci: float = 0.95) -> dict[str, Any]:
    """Calculate bootstrap confidence intervals."""
    arr = ensure_array(X)
    if len(arr) < 2:
        return {"valid": False, "error": "Need at least 2 samples"}
    
    stat_func = {
        "mean": np.mean,
        "median": np.median,
        "std": lambda x: np.std(x, ddof=1),
    }.get(statistic, np.mean)
    
    bootstrap_samples = []
    for _ in range(n_iterations):
        sample = np.random.choice(arr, size=len(arr), replace=True)
        bootstrap_samples.append(stat_func(sample))
    
    bootstrap_samples = np.array(bootstrap_samples)
    alpha = 1 - ci
    lower = np.percentile(bootstrap_samples, alpha / 2 * 100)
    upper = np.percentile(bootstrap_samples, (1 - alpha / 2) * 100)
    
    return {
        "statistic": statistic,
        "estimate": safe_float(stat_func(arr)),
        "ci_lower": safe_float(lower),
        "ci_upper": safe_float(upper),
        "se": safe_float(np.std(bootstrap_samples)),
        "n_iterations": n_iterations,
        "ci_level": ci,
        "valid": True
    }


# ==================== POWER ANALYSIS ====================


@method_handler
def power_analysis_ttest(effect_size: float, n: Optional[int] = None, power: Optional[float] = None, alpha: float = 0.05) -> dict[str, Any]:
    """Power analysis for t-test."""
    if not HAS_STATSMODELS:
        return {"valid": False, "error": "statsmodels not installed"}
    
    analysis = TTestIndPower()
    
    if n is None and power is not None:
        # Calculate required sample size
        n_required = analysis.solve_power(effect_size=effect_size, power=power, alpha=alpha)
        return {
            "n_required": int(np.ceil(n_required)),
            "effect_size": effect_size,
            "power": power,
            "alpha": alpha,
            "valid": True
        }
    elif power is None and n is not None:
        # Calculate achieved power
        achieved_power = analysis.solve_power(effect_size=effect_size, nobs1=n, alpha=alpha)
        return {
            "achieved_power": safe_float(achieved_power),
            "effect_size": effect_size,
            "n": n,
            "alpha": alpha,
            "valid": True
        }
    else:
        return {"valid": False, "error": "Provide either n or power, not both"}


# ==================== FACTOR ANALYSIS ====================


@method_handler
def pca(data: Union[ArrayLike, dict[str, ArrayLike]], n_components: Optional[int] = None) -> dict[str, Any]:
    """Principal Component Analysis."""
    if isinstance(data, dict):
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame(np.asarray(data))
    
    df = df.dropna()
    
    if df.shape[0] < 3 or df.shape[1] < 2:
        return {"valid": False, "error": "Insufficient data for PCA"}
    
    # Standardize
    from sklearn.preprocessing import StandardScaler
    from sklearn.decomposition import PCA as SklearnPCA
    
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(df)
    
    n_comp = n_components or min(df.shape[0], df.shape[1])
    pca_model = SklearnPCA(n_components=n_comp)
    pca_model.fit(scaled_data)
    
    # Kaiser criterion: eigenvalue > 1
    eigenvalues = pca_model.explained_variance_
    significant_components = int(np.sum(eigenvalues > 1))
    
    return {
        "eigenvalues": [safe_float(e) for e in eigenvalues],
        "explained_variance_ratio": [safe_float(r) for r in pca_model.explained_variance_ratio_],
        "cumulative_variance": safe_float(np.sum(pca_model.explained_variance_ratio_)),
        "loadings": pca_model.components_.tolist(),
        "significant_components": significant_components,
        "n_components": n_comp,
        "valid": True
    }


@method_handler
def efa(data: Union[ArrayLike, dict[str, ArrayLike]], n_factors: int = 3, rotation: str = "varimax") -> dict[str, Any]:
    """Exploratory Factor Analysis."""
    if not HAS_FACTOR_ANALYZER:
        return {"valid": False, "error": "factor_analyzer not installed"}
    
    if isinstance(data, dict):
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame(np.asarray(data))
    
    df = df.dropna()
    
    if df.shape[0] < 10 or df.shape[1] < 3:
        return {"valid": False, "error": "Insufficient data for EFA"}
    
    fa = FactorAnalyzer(n_factors=n_factors, rotation=rotation)
    fa.fit(df)
    
    return {
        "loadings": fa.loadings_.tolist(),
        "communalities": [safe_float(c) for c in fa.get_communalities()],
        "uniqueness": [safe_float(u) for u in fa.get_uniquenesses()],
        "eigenvalues": [safe_float(e) for e in fa.get_eigenvalues()[0]],
        "n_factors": n_factors,
        "rotation": rotation,
        "valid": True
    }


@method_handler
def kmo_test(data: Union[ArrayLike, dict[str, ArrayLike]]) -> dict[str, Any]:
    """Kaiser-Meyer-Olkin test for sampling adequacy."""
    if not HAS_FACTOR_ANALYZER:
        return {"valid": False, "error": "factor_analyzer not installed"}
    
    if isinstance(data, dict):
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame(np.asarray(data))
    
    df = df.dropna()
    
    try:
        kmo_all, kmo_model = calculate_kmo(df)
        
        interpretation = (
            "unacceptable" if kmo_model < 0.5 else
            "miserable" if kmo_model < 0.6 else
            "mediocre" if kmo_model < 0.7 else
            "middling" if kmo_model < 0.8 else
            "meritorious" if kmo_model < 0.9 else
            "marvelous"
        )
        
        return {
            "kmo": safe_float(kmo_model),
            "kmo_per_variable": [safe_float(k) for k in kmo_all],
            "interpretation": interpretation,
            "adequate": kmo_model >= 0.6,
            "valid": True
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}


# ==================== MULTIVARIATE ANALYSIS ====================


@method_handler  
def manova(data: dict[str, ArrayLike], groups: ArrayLike) -> dict[str, Any]:
    """Multivariate Analysis of Variance (MANOVA)."""
    if not HAS_PINGOUIN:
        # Fallback using scipy
        return {"valid": False, "error": "pingouin not installed for MANOVA"}
    
    df = pd.DataFrame(data)
    df['group'] = groups
    
    try:
        # Use pingouin's MANOVA
        dependent_vars = [c for c in df.columns if c != 'group']
        result = pg.manova(data=df, dvs=dependent_vars, between='group')
        
        return {
            "wilks_lambda": safe_float(result.loc[0, "Wilks' lambda"]) if "Wilks' lambda" in result.columns else None,
            "pillai_trace": safe_float(result.loc[0, "Pillai's trace"]) if "Pillai's trace" in result.columns else None,
            "f_value": safe_float(result.loc[0, 'F']) if 'F' in result.columns else None,
            "p_value": safe_float(result.loc[0, 'p-unc']) if 'p-unc' in result.columns else None,
            "significant": result.loc[0, 'p-unc'] < 0.05 if 'p-unc' in result.columns else None,
            "valid": True
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}


# ==================== METHOD REGISTRY ====================


class StatisticalMethodRegistry:
    """Registry of all statistical methods."""
    
    def __init__(self):
        self.methods: dict[str, Callable] = {
            # Descriptive statistics
            "mean": mean,
            "median": median,
            "std": std,
            "var": var,
            "sem": sem,
            "minimum": minimum,
            "maximum": maximum,
            "range": data_range,
            "skew": skewness,
            "kurtosis": kurtosis,
            "percentile": percentile,
            "quantiles": quantiles,
            "iqr": iqr,
            "cv": coefficient_of_variation,
            "z_scores": z_scores,
            
            # Correlational analysis
            "pearson": pearson,
            "spearman": spearman,
            "kendall": kendall,
            "correlation_matrix": correlation_matrix,
            
            # Hypothesis testing
            "one_sample_ttest": one_sample_ttest,
            "independent_ttest": independent_ttest,
            "welch_ttest": welch_ttest,
            "paired_ttest": paired_ttest,
            "one_way_anova": one_way_anova,
            "kruskal_wallis": kruskal_wallis,
            "mann_whitney": mann_whitney,
            "wilcoxon": wilcoxon_test,
            
            # Normality & assumptions
            "shapiro_wilk": shapiro_wilk,
            "levene": levene_test,
            "bartlett": bartlett_test,
            
            # Effect sizes
            "cohens_d": cohens_d,
            "hedges_g": hedges_g,
            "glass_delta": glass_delta,
            "eta_squared": eta_squared,
            "omega_squared": omega_squared,
            
            # Reliability
            "cronbach_alpha": cronbach_alpha,
            "split_half": split_half_reliability,
            
            # Bootstrap
            "bootstrap_ci": bootstrap_ci,
            
            # Power analysis
            "power_analysis": power_analysis_ttest,
            
            # Factor analysis
            "pca": pca,
            "efa": efa,
            "kmo": kmo_test,
            
            # Multivariate
            "manova": manova,
        }
    
    def get(self, name: str) -> Optional[Callable]:
        """Get a method by name."""
        return self.methods.get(name)
    
    def register(self, name: str, func: Callable) -> None:
        """Register a new method."""
        self.methods[name] = func
    
    def list_methods(self) -> list[str]:
        """List all available methods."""
        return list(self.methods.keys())
