"""
Comprehensive Analysis Orchestrator
Runs all relevant statistical methods and synthesizes results.
"""

from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd

from .methods import StatisticalMethodRegistry


# MAAC dimensions
MAAC_DIMENSIONS = [
    "maac_cognitive_load",
    "maac_tool_execution",
    "maac_content_quality",
    "maac_memory_integration",
    "maac_complexity_handling",
    "maac_hallucination_control",
    "maac_knowledge_transfer",
    "maac_processing_efficiency",
    "maac_construct_validity",
]


def extract_dimensional_data(experiments: list[dict[str, Any]]) -> dict[str, list[float]]:
    """Extract MAAC dimensional data from experiments."""
    result = {dim: [] for dim in MAAC_DIMENSIONS}
    result["maac_overall_score"] = []
    
    for exp in experiments:
        for dim in MAAC_DIMENSIONS:
            if dim in exp:
                try:
                    result[dim].append(float(exp[dim]))
                except (TypeError, ValueError):
                    pass
        
        if "maac_overall_score" in exp:
            try:
                result["maac_overall_score"].append(float(exp["maac_overall_score"]))
            except (TypeError, ValueError):
                pass
    
    return result


def run_comprehensive_analysis(
    experiments: list[dict[str, Any]],
    session_id: str,
    method_registry: StatisticalMethodRegistry,
) -> dict[str, Any]:
    """
    Run comprehensive statistical analysis on experiment data.
    
    Returns a ComprehensiveResponse-compatible dict.
    """
    start_time = datetime.now()
    
    # Extract dimensional data
    dimensional_data = extract_dimensional_data(experiments)
    primary_data = dimensional_data.get("maac_overall_score", [])
    
    # Track method execution
    method_results: dict[str, Any] = {
        "descriptiveStatistics": {},
        "correlationalAnalysis": {},
        "testingProcedures": {},
        "specializedAnalyses": {},
    }
    
    total_attempted = 0
    successful = 0
    failed = 0
    
    # ==================== DESCRIPTIVE STATISTICS ====================
    
    descriptive_methods = ["mean", "median", "std", "var", "sem", "minimum", "maximum", "range", "skew", "kurtosis", "iqr", "quantiles"]
    
    for method_name in descriptive_methods:
        total_attempted += 1
        method_fn = method_registry.get(method_name)
        if method_fn and len(primary_data) > 0:
            try:
                result = method_fn(X=primary_data)
                method_results["descriptiveStatistics"][method_name] = {
                    "result": result,
                    "success": result.get("valid", False),
                }
                if result.get("valid"):
                    successful += 1
                else:
                    failed += 1
            except Exception as e:
                method_results["descriptiveStatistics"][method_name] = {
                    "result": None,
                    "success": False,
                    "error": str(e),
                }
                failed += 1
        else:
            failed += 1
    
    # ==================== CORRELATIONAL ANALYSIS ====================
    
    # Build dimensional pairs for correlation
    dim_data = {k: v for k, v in dimensional_data.items() if k != "maac_overall_score" and len(v) > 0}
    
    # Pearson correlation with overall score
    if len(primary_data) > 2:
        for dim, values in dim_data.items():
            if len(values) >= len(primary_data):
                total_attempted += 1
                try:
                    result = method_registry.get("pearson")(X=primary_data, Y=values[:len(primary_data)])
                    method_results["correlationalAnalysis"][f"pearson_{dim}"] = {
                        "result": result,
                        "success": result.get("valid", False),
                    }
                    if result.get("valid"):
                        successful += 1
                    else:
                        failed += 1
                except Exception as e:
                    method_results["correlationalAnalysis"][f"pearson_{dim}"] = {
                        "result": None,
                        "success": False,
                        "error": str(e),
                    }
                    failed += 1
    
    # Correlation matrix
    if len(dim_data) >= 2:
        total_attempted += 1
        try:
            result = method_registry.get("correlation_matrix")(data=dim_data)
            method_results["correlationalAnalysis"]["correlation_matrix"] = {
                "result": result,
                "success": result.get("valid", False),
            }
            if result.get("valid"):
                successful += 1
            else:
                failed += 1
        except Exception as e:
            method_results["correlationalAnalysis"]["correlation_matrix"] = {
                "result": None,
                "success": False,
                "error": str(e),
            }
            failed += 1
    
    # ==================== NORMALITY TESTS ====================
    
    if len(primary_data) >= 3:
        total_attempted += 1
        try:
            result = method_registry.get("shapiro_wilk")(X=primary_data)
            method_results["testingProcedures"]["shapiro_wilk"] = {
                "result": result,
                "success": result.get("valid", False),
            }
            if result.get("valid"):
                successful += 1
            else:
                failed += 1
        except Exception as e:
            method_results["testingProcedures"]["shapiro_wilk"] = {
                "result": None,
                "success": False,
                "error": str(e),
            }
            failed += 1
    
    # ==================== EFFECT SIZES ====================
    
    # Calculate effect sizes if we have group comparisons
    tiers = list(set(exp.get("tier", "") for exp in experiments if exp.get("tier")))
    
    if len(tiers) >= 2:
        tier_groups = {tier: [] for tier in tiers}
        for exp in experiments:
            tier = exp.get("tier")
            if tier and "maac_overall_score" in exp:
                try:
                    tier_groups[tier].append(float(exp["maac_overall_score"]))
                except (TypeError, ValueError):
                    pass
        
        # Compare first two tiers
        tier_list = list(tier_groups.keys())
        if len(tier_groups[tier_list[0]]) >= 2 and len(tier_groups[tier_list[1]]) >= 2:
            for effect_method in ["cohens_d", "hedges_g", "glass_delta"]:
                total_attempted += 1
                try:
                    result = method_registry.get(effect_method)(
                        X=tier_groups[tier_list[0]], 
                        Y=tier_groups[tier_list[1]]
                    )
                    method_results["specializedAnalyses"][effect_method] = {
                        "result": result,
                        "success": result.get("valid", False),
                    }
                    if result.get("valid"):
                        successful += 1
                    else:
                        failed += 1
                except Exception as e:
                    method_results["specializedAnalyses"][effect_method] = {
                        "result": None,
                        "success": False,
                        "error": str(e),
                    }
                    failed += 1
    
    # ==================== RELIABILITY ANALYSIS ====================
    
    reliability_result = None
    if len(dim_data) >= 2 and all(len(v) > 0 for v in dim_data.values()):
        total_attempted += 1
        try:
            # Build matrix for reliability
            min_len = min(len(v) for v in dim_data.values())
            reliability_data = {k: v[:min_len] for k, v in dim_data.items()}
            result = method_registry.get("cronbach_alpha")(data=reliability_data)
            method_results["specializedAnalyses"]["cronbach_alpha"] = {
                "result": result,
                "success": result.get("valid", False),
            }
            reliability_result = result
            if result.get("valid"):
                successful += 1
            else:
                failed += 1
        except Exception as e:
            method_results["specializedAnalyses"]["cronbach_alpha"] = {
                "result": None,
                "success": False,
                "error": str(e),
            }
            failed += 1
    
    # ==================== FACTOR ANALYSIS ====================
    
    factor_analysis = None
    if len(dim_data) >= 3 and all(len(v) >= 10 for v in dim_data.values()):
        min_len = min(len(v) for v in dim_data.values())
        fa_data = {k: v[:min_len] for k, v in dim_data.items()}
        
        # PCA
        total_attempted += 1
        try:
            pca_result = method_registry.get("pca")(data=fa_data)
            if pca_result.get("valid"):
                successful += 1
                factor_analysis = factor_analysis or {}
                factor_analysis["pca"] = pca_result
            else:
                failed += 1
        except Exception:
            failed += 1
        
        # EFA
        total_attempted += 1
        try:
            efa_result = method_registry.get("efa")(data=fa_data, n_factors=3)
            if efa_result.get("valid"):
                successful += 1
                factor_analysis = factor_analysis or {}
                factor_analysis["efa"] = efa_result
            else:
                failed += 1
        except Exception:
            failed += 1
        
        # KMO
        total_attempted += 1
        try:
            kmo_result = method_registry.get("kmo")(data=fa_data)
            if kmo_result.get("valid"):
                successful += 1
                factor_analysis = factor_analysis or {}
                factor_analysis["kmo"] = kmo_result
            else:
                failed += 1
        except Exception:
            failed += 1
    
    # ==================== BOOTSTRAP ANALYSIS ====================
    
    bootstrap_result = None
    if len(primary_data) >= 10:
        total_attempted += 1
        try:
            result = method_registry.get("bootstrap_ci")(X=primary_data, n_iterations=1000)
            if result.get("valid"):
                successful += 1
                bootstrap_result = {
                    "mean": result.get("estimate"),
                    "confidenceInterval": [result.get("ci_lower"), result.get("ci_upper")],
                    "standardError": result.get("se"),
                    "nIterations": result.get("n_iterations"),
                }
            else:
                failed += 1
        except Exception:
            failed += 1
    
    # ==================== POWER ANALYSIS ====================
    
    power_result = None
    if len(primary_data) >= 10:
        total_attempted += 1
        try:
            # Calculate effect size first
            effect_d = method_results.get("specializedAnalyses", {}).get("cohens_d", {}).get("result", {}).get("cohens_d", 0.5)
            if effect_d is None or effect_d == 0:
                effect_d = 0.5
            
            result = method_registry.get("power_analysis")(
                effect_size=abs(effect_d),
                n=len(primary_data),
                alpha=0.05
            )
            if result.get("valid"):
                successful += 1
                power_result = {
                    "statisticalPower": result.get("achieved_power"),
                    "effectSize": effect_d,
                    "sampleSize": len(primary_data),
                    "alpha": 0.05,
                }
            else:
                failed += 1
        except Exception:
            failed += 1
    
    # ==================== BUILD RESPONSE ====================
    
    success_rate = (successful / total_attempted * 100) if total_attempted > 0 else 0
    
    # Data quality assessment
    completeness = sum(1 for exp in experiments if all(
        exp.get(dim) is not None for dim in MAAC_DIMENSIONS
    )) / len(experiments) if experiments else 0
    
    # Build correlation matrix for tables
    corr_result = method_results.get("correlationalAnalysis", {}).get("correlation_matrix", {}).get("result", {})
    
    return {
        "session_id": session_id,
        "engine_version": "4.0.0",
        "analysis_timestamp": datetime.now().isoformat(),
        "experiments_analyzed": len(experiments),
        
        "method_results": method_results,
        
        "statistical_tables": {
            "correlationMatrix": corr_result.get("matrix", []),
            "correlationColumns": corr_result.get("columns", []),
        },
        
        "factor_analysis": factor_analysis,
        
        "manova_results": None,  # Would need group data
        
        "reliability_analysis": {
            "cronbachsAlpha": reliability_result.get("alpha") if reliability_result else None,
            "alphaInterpretation": reliability_result.get("interpretation") if reliability_result else None,
            "nItems": reliability_result.get("n_items") if reliability_result else 0,
        } if reliability_result else None,
        
        "bootstrap_analysis": bootstrap_result,
        
        "mediation_analysis": None,  # Would need specific mediator/IV/DV
        
        "power_analysis": power_result,
        
        "data_quality": {
            "completenessRate": completeness,
            "varianceAdequacy": "adequate" if completeness > 0.8 else "inadequate",
            "methodCoverage": {
                "successful": successful,
                "total": total_attempted,
            },
        },
        
        "execution_summary": {
            "totalMethodsAttempted": total_attempted,
            "successfulMethods": successful,
            "failedMethods": failed,
            "successRate": success_rate,
        },
        
        "integration_summary": {
            "keyFindings": {
                "reliability": f"Cronbach's α = {reliability_result.get('alpha', 'N/A')}" if reliability_result else "Not computed",
                "sampleSize": f"N = {len(experiments)}",
            },
            "academicCredibility": {
                "completenessScore": completeness,
                "publicationReadiness": "ready" if success_rate >= 80 and completeness >= 0.9 else "needs_improvement",
            },
        },
    }
