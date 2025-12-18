"""
Pydantic Models for API Request/Response
"""

from typing import Any, Optional
from pydantic import BaseModel, Field


# ==================== HEALTH CHECK ====================


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    methods_available: int


# ==================== BATCH API ====================


class MethodCall(BaseModel):
    """Single method call in a batch request."""
    id: str = Field(..., description="Unique identifier for this call")
    method: str = Field(..., description="Name of the statistical method")
    params: dict[str, Any] = Field(default_factory=dict, description="Method parameters")


class BatchRequest(BaseModel):
    """Batch analysis request."""
    calls: list[MethodCall] = Field(..., description="List of method calls to execute")
    session_id: str = Field(default="batch", description="Session identifier for logging")


class MethodResult(BaseModel):
    """Result of a single method call."""
    id: str
    method: str
    success: bool
    error: Optional[str] = None
    result: Optional[Any] = None


class BatchResponse(BaseModel):
    """Batch analysis response."""
    session_id: str
    total_calls: int
    successful: int
    failed: int
    results: list[dict[str, Any]]


# ==================== COMPREHENSIVE API ====================


class ExperimentData(BaseModel):
    """Single experiment data record."""
    experiment_id: str
    session_id: str
    trial_id: str
    config_id: str
    domain: str
    tier: str
    model_id: str
    
    # MAAC scores
    maac_overall_score: float = 0.0
    maac_cognitive_load: float = 0.0
    maac_tool_execution: float = 0.0
    maac_content_quality: float = 0.0
    maac_memory_integration: float = 0.0
    maac_complexity_handling: float = 0.0
    maac_hallucination_control: float = 0.0
    maac_knowledge_transfer: float = 0.0
    maac_processing_efficiency: float = 0.0
    maac_construct_validity: float = 0.0
    
    # Allow extra fields
    model_config = {"extra": "allow"}


class ComprehensiveRequest(BaseModel):
    """Comprehensive analysis request."""
    experiments: list[dict[str, Any]] = Field(..., description="Experiment data records")
    session_id: str = Field(default="comprehensive", description="Session identifier")


class DataQuality(BaseModel):
    """Data quality metrics."""
    completeness_rate: float
    variance_adequacy: str
    method_coverage: dict[str, int]


class ExecutionSummary(BaseModel):
    """Execution summary."""
    total_methods_attempted: int
    successful_methods: int
    failed_methods: int
    success_rate: float


class FactorAnalysisResults(BaseModel):
    """Factor analysis results."""
    pca: dict[str, Any]
    efa: dict[str, Any]
    cfa: dict[str, Any]


class ComprehensiveResponse(BaseModel):
    """Comprehensive analysis response."""
    session_id: str
    engine_version: str = "4.0.0"
    analysis_timestamp: str
    experiments_analyzed: int
    
    # Core results
    method_results: dict[str, Any]
    statistical_tables: dict[str, Any]
    
    # Advanced analysis
    factor_analysis: Optional[dict[str, Any]] = None
    manova_results: Optional[dict[str, Any]] = None
    reliability_analysis: Optional[dict[str, Any]] = None
    bootstrap_analysis: Optional[dict[str, Any]] = None
    mediation_analysis: Optional[dict[str, Any]] = None
    power_analysis: Optional[dict[str, Any]] = None
    
    # Quality metrics
    data_quality: dict[str, Any]
    execution_summary: dict[str, Any]
    integration_summary: Optional[dict[str, Any]] = None
