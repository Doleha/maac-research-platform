"""
FastAPI Application Entry Point
MAAC Statistical Engine v4.0
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .methods import StatisticalMethodRegistry
from .comprehensive import run_comprehensive_analysis
from .models import (
    BatchRequest,
    BatchResponse,
    ComprehensiveRequest,
    ComprehensiveResponse,
    HealthResponse,
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize method registry
method_registry = StatisticalMethodRegistry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("🚀 MAAC Statistical Engine v4.0 starting...")
    logger.info(f"📊 Loaded {len(method_registry.methods)} statistical methods")
    yield
    logger.info("👋 MAAC Statistical Engine shutting down...")


# Create FastAPI app
app = FastAPI(
    title="MAAC Statistical Engine",
    description="Comprehensive statistical analysis service for the MAAC research platform",
    version="4.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== ENDPOINTS ====================


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="4.0.0",
        methods_available=len(method_registry.methods),
    )


@app.get("/api/v1/methods")
async def list_methods() -> dict[str, list[str]]:
    """List all available statistical methods."""
    return {"methods": list(method_registry.methods.keys())}


@app.post("/api/v1/batch", response_model=BatchResponse)
async def batch_analysis(request: BatchRequest) -> BatchResponse:
    """
    Execute multiple statistical methods in batch.
    This is the primary endpoint for Tier 2 analysis.
    """
    logger.info(f"📊 Batch request: {len(request.calls)} method calls, session: {request.session_id}")
    
    results: list[dict[str, Any]] = []
    successful = 0
    failed = 0
    
    for call in request.calls:
        try:
            method_fn = method_registry.get(call.method)
            if method_fn is None:
                results.append({
                    "id": call.id,
                    "method": call.method,
                    "success": False,
                    "error": f"Unknown method: {call.method}",
                    "result": None,
                })
                failed += 1
                continue
            
            # Execute the method
            result = method_fn(**call.params)
            results.append({
                "id": call.id,
                "method": call.method,
                "success": True,
                "error": None,
                "result": result,
            })
            successful += 1
            
        except Exception as e:
            logger.warning(f"Method {call.method} failed: {e}")
            results.append({
                "id": call.id,
                "method": call.method,
                "success": False,
                "error": str(e),
                "result": None,
            })
            failed += 1
    
    logger.info(f"✅ Batch complete: {successful} successful, {failed} failed")
    
    return BatchResponse(
        session_id=request.session_id,
        total_calls=len(request.calls),
        successful=successful,
        failed=failed,
        results=results,
    )


@app.post("/api/v1/comprehensive_analysis", response_model=ComprehensiveResponse)
async def comprehensive_analysis(request: ComprehensiveRequest) -> ComprehensiveResponse:
    """
    Run comprehensive statistical analysis on experiment data.
    This endpoint automatically runs all relevant methods and synthesizes results.
    """
    logger.info(f"📊 Comprehensive analysis: {len(request.experiments)} experiments, session: {request.session_id}")
    
    try:
        results = run_comprehensive_analysis(
            experiments=request.experiments,
            session_id=request.session_id,
            method_registry=method_registry,
        )
        return results
    except Exception as e:
        logger.error(f"Comprehensive analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== RUN FUNCTION ====================


def run():
    """Run the MAAC Statistical Engine server."""
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    workers = int(os.getenv("WORKERS", "4"))
    
    logger.info(f"Starting MAAC Statistical Engine on {host}:{port}")
    
    uvicorn.run(
        "maac_stat_engine.main:app",
        host=host,
        port=port,
        workers=workers,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )


if __name__ == "__main__":
    run()
