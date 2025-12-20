# Backend API Integration - TODO

**Status:** Not Started  
**Frontend Status:** ✅ 100% Complete  
**Priority:** High - Frontend is blocked on API implementation

---

## 📊 Overview

The dashboard frontend is production-ready and requires backend API implementation. This document outlines all required endpoints, their specifications, and implementation priority.

**Total Endpoints Required:** 24  
**SSE Endpoints:** 2  
**CRUD Operations:** Multiple

---

## 🎯 Implementation Priority

### Priority 1: Core Experiment Functionality (8 endpoints)

Essential for basic experiment workflow

- [ ] `POST /api/experiments` - Create experiment
- [ ] `GET /api/experiments` - List experiments with filters
- [ ] `GET /api/experiments/{id}` - Get experiment details
- [ ] `POST /api/experiments/{id}/start` - Start experiment
- [ ] `POST /api/experiments/{id}/pause` - Pause experiment
- [ ] `POST /api/experiments/{id}/stop` - Stop experiment
- [ ] `GET /api/experiments/{id}/export` - Export results (JSON/CSV)
- [ ] `POST /api/experiments/{id}/retry` - Retry failed trials

### Priority 2: Real-Time Progress (1 endpoint)

Critical for live monitoring

- [ ] `GET /api/experiments/{id}/progress` - SSE stream for live updates

### Priority 3: Scenario Management (6 endpoints)

Data preparation and management

- [ ] `GET /api/scenarios` - List scenarios with filters
- [ ] `POST /api/scenarios` - Create single scenario
- [ ] `PUT /api/scenarios/{id}` - Update scenario
- [ ] `DELETE /api/scenarios/{id}` - Delete scenario
- [ ] `POST /api/scenarios/bulk-import` - Import CSV file
- [ ] `GET /api/models` - Get available LLM models per provider

### Priority 4: AI Scenario Generation (2 endpoints)

Advanced feature for scenario creation

- [ ] `POST /api/scenarios/generate/estimate` - Cost estimation
- [ ] `POST /api/scenarios/generate` - Generate with SSE streaming

### Priority 5: System Monitoring (6 endpoints)

Health and resource monitoring

- [ ] `GET /api/system/containers` - Docker container status
- [ ] `GET /api/system/services` - Service health checks
- [ ] `GET /api/system/metrics` - System resource metrics
- [ ] `POST /api/system/containers/{name}/start` - Start container
- [ ] `POST /api/system/containers/{name}/stop` - Stop container
- [ ] `POST /api/system/containers/{name}/restart` - Restart container

### Priority 6: Settings & Configuration (3 endpoints)

User preferences and credentials

- [ ] `GET /api/settings` - Get all settings
- [ ] `PUT /api/settings/credentials` - Update API keys
- [ ] `GET /api/billing` - Usage and credits tracking

---

## 📋 Detailed Endpoint Specifications

### 1. Experiments API

#### `POST /api/experiments`

**Purpose:** Create new experiment  
**Frontend:** [apps/dashboard/src/app/experiments/new/page.tsx](apps/dashboard/src/app/experiments/new/page.tsx)

**Request Body:**

```json
{
  "experimentName": "string",
  "description": "string",
  "tier": "tier1a" | "tier1b" | "tier2" | "tier3",
  "domain": "string",
  "llm_provider": "openai" | "anthropic" | "deepseek" | "openrouter",
  "llm_model": "string",
  "temperature": 0.0-2.0,
  "top_p": 0.0-1.0,
  "max_tokens": 1-32000,
  "trial_count": 1-1000,
  "scenario_ids": ["string"],
  "advanced_config": {
    "seed": number | null,
    "frequency_penalty": number,
    "presence_penalty": number
  }
}
```

**Response:**

```json
{
  "experimentId": "string",
  "status": "created",
  "createdAt": "ISO8601",
  "message": "Experiment created successfully"
}
```

**Implementation Notes:**

- Validate all fields with Zod/Joi schema
- Store in PostgreSQL experiments table
- Create initial experiment record with status="created"
- Return experimentId for navigation to detail page

---

#### `GET /api/experiments`

**Purpose:** List all experiments with filtering  
**Frontend:** [apps/dashboard/src/app/experiments/page.tsx](apps/dashboard/src/app/experiments/page.tsx)

**Query Parameters:**

```
?search=string          # Search by name/description
&status=pending|running|completed|failed|paused
&tier=tier1a|tier1b|tier2|tier3
&domain=string
&sortBy=created_at|name|overall_maac_score
&sortOrder=asc|desc
&page=1
&limit=50
```

**Response:**

```json
{
  "experiments": [
    {
      "experimentId": "string",
      "experimentName": "string",
      "description": "string",
      "status": "pending" | "running" | "completed" | "failed" | "paused",
      "tier": "tier1a" | "tier1b" | "tier2" | "tier3",
      "domain": "string",
      "llm_model": "string",
      "created_at": "ISO8601",
      "completed_at": "ISO8601" | null,
      "totalTrials": 100,
      "completedTrials": 45,
      "overall_maac_score": 0.85 | null,
      "progress_percent": 45
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 50,
    "totalPages": 4
  }
}
```

**Implementation Notes:**

- Support all filter combinations
- Implement efficient pagination with offset/limit
- Calculate progress_percent = (completedTrials / totalTrials) \* 100
- Sort by multiple fields

---

#### `GET /api/experiments/{id}`

**Purpose:** Get detailed experiment information  
**Frontend:** [apps/dashboard/src/app/experiments/[id]/page.tsx](apps/dashboard/src/app/experiments/[id]/page.tsx)

**Response:**

```json
{
  "experimentId": "string",
  "experimentName": "string",
  "description": "string",
  "status": "pending" | "running" | "completed" | "failed" | "paused",
  "tier": "tier1a",
  "domain": "problem_solving",
  "llm_provider": "openai",
  "llm_model": "gpt-4o",
  "temperature": 0.7,
  "top_p": 1.0,
  "max_tokens": 4096,
  "created_at": "2025-12-20T10:00:00Z",
  "started_at": "2025-12-20T10:05:00Z",
  "completed_at": null,
  "totalTrials": 100,
  "completedTrials": 45,
  "failedTrials": 2,
  "overall_maac_score": 0.85,
  "maac_scores": {
    "model_alignment": 0.87,
    "answer_accuracy": 0.92,
    "adaptability": 0.78,
    "clarity": 0.83
  },
  "trials": [
    {
      "trialId": "string",
      "scenario_id": "string",
      "status": "completed" | "failed" | "running" | "pending",
      "maac_score": 0.85,
      "response": "string",
      "error": null,
      "completed_at": "ISO8601"
    }
  ],
  "config": {
    "seed": 42,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  }
}
```

**Implementation Notes:**

- Join experiments, trials, and scenarios tables
- Calculate aggregate MAAC scores across completed trials
- Include all trial details for display

---

#### `GET /api/experiments/{id}/progress` (SSE)

**Purpose:** Real-time experiment progress streaming  
**Frontend:** [apps/dashboard/src/components/live-progress.tsx](apps/dashboard/src/components/live-progress.tsx)

**SSE Event Format:**

```
event: progress
data: {
  "type": "progress",
  "experimentId": "string",
  "completedTrials": 45,
  "totalTrials": 100,
  "currentMaacScore": 0.85,
  "estimatedTimeRemaining": 300,
  "trials": [
    {
      "trialId": "string",
      "scenario_id": "string",
      "status": "completed",
      "maac_score": 0.88,
      "completedAt": "ISO8601"
    }
  ]
}

event: complete
data: {
  "type": "complete",
  "experimentId": "string",
  "finalMaacScore": 0.85,
  "completedAt": "ISO8601"
}

event: error
data: {
  "type": "error",
  "message": "Error message"
}
```

**Implementation Notes:**

- Use Server-Sent Events (SSE) for real-time streaming
- Push updates whenever a trial completes
- Calculate ETA based on average trial completion time
- Close connection when experiment completes/fails
- Implement heartbeat to detect disconnections
- Handle reconnection with Last-Event-ID header

---

#### `POST /api/experiments/{id}/start`

**Purpose:** Start/resume experiment execution  
**Frontend:** [apps/dashboard/src/app/experiments/[id]/page.tsx](apps/dashboard/src/app/experiments/[id]/page.tsx)

**Request Body:** Empty or optional config overrides

**Response:**

```json
{
  "experimentId": "string",
  "status": "running",
  "startedAt": "ISO8601",
  "message": "Experiment started successfully"
}
```

**Implementation Notes:**

- Update experiment status to "running"
- Enqueue trials to BullMQ job queue
- Trigger experiment orchestrator
- Validate experiment is in valid state (pending/paused)

---

#### `POST /api/experiments/{id}/pause`

**Purpose:** Pause running experiment

**Response:**

```json
{
  "experimentId": "string",
  "status": "paused",
  "pausedAt": "ISO8601",
  "completedTrials": 45,
  "totalTrials": 100
}
```

**Implementation Notes:**

- Stop processing new trials from queue
- Allow current trial to complete
- Update status to "paused"

---

#### `POST /api/experiments/{id}/stop`

**Purpose:** Stop and cancel experiment

**Response:**

```json
{
  "experimentId": "string",
  "status": "stopped",
  "stoppedAt": "ISO8601",
  "completedTrials": 45,
  "totalTrials": 100
}
```

**Implementation Notes:**

- Remove remaining jobs from queue
- Mark experiment as stopped
- Cancel any running trials

---

#### `POST /api/experiments/{id}/retry`

**Purpose:** Retry all failed trials in experiment

**Response:**

```json
{
  "experimentId": "string",
  "retriedTrials": 5,
  "status": "running",
  "message": "5 failed trials queued for retry"
}
```

**Implementation Notes:**

- Find all trials with status="failed"
- Re-enqueue to BullMQ with original config
- Update trial status to "pending"

---

#### `GET /api/experiments/{id}/export`

**Purpose:** Export experiment results

**Query Parameters:**

```
?format=json|csv
```

**Response (JSON):**

```json
{
  "experiment": {
    /* full experiment object */
  },
  "trials": [
    /* all trial details */
  ],
  "summary": {
    "overall_maac_score": 0.85,
    "total_trials": 100,
    "completion_rate": 0.98
  }
}
```

**Response (CSV):**

```csv
trial_id,scenario_id,status,maac_score,model_alignment,answer_accuracy,adaptability,clarity,response,error
...
```

**Implementation Notes:**

- Generate CSV with all trial data
- Include MAAC dimension breakdowns
- Set appropriate Content-Type and filename headers

---

### 2. Scenarios API

#### `GET /api/scenarios`

**Purpose:** List all scenarios with filtering  
**Frontend:** [apps/dashboard/src/app/data/scenarios/page.tsx](apps/dashboard/src/app/data/scenarios/page.tsx)

**Query Parameters:**

```
?search=string          # Search task_id, description
&domain=string
&page=1
&limit=50
```

**Response:**

```json
{
  "scenarios": [
    {
      "scenario_id": "string",
      "task_id": "string",
      "domain": "problem_solving",
      "task_description": "string",
      "baseline_answer": "string",
      "ground_truth": "string",
      "metadata": {
        /* optional */
      }
    }
  ],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 50
  }
}
```

---

#### `POST /api/scenarios`

**Purpose:** Create single scenario

**Request Body:**

```json
{
  "task_id": "string",
  "domain": "string",
  "task_description": "string",
  "baseline_answer": "string",
  "ground_truth": "string",
  "metadata": {}
}
```

**Response:**

```json
{
  "scenario_id": "string",
  "message": "Scenario created successfully"
}
```

---

#### `PUT /api/scenarios/{id}`

**Purpose:** Update existing scenario  
**Frontend:** [apps/dashboard/src/app/data/scenarios/page.tsx](apps/dashboard/src/app/data/scenarios/page.tsx) (Edit modal)

**Request Body:** Same as POST, all fields updatable

**Response:**

```json
{
  "scenario_id": "string",
  "message": "Scenario updated successfully"
}
```

---

#### `DELETE /api/scenarios/{id}`

**Purpose:** Delete scenario  
**Frontend:** [apps/dashboard/src/app/data/scenarios/page.tsx](apps/dashboard/src/app/data/scenarios/page.tsx) (Delete button)

**Response:**

```json
{
  "message": "Scenario deleted successfully"
}
```

**Implementation Notes:**

- Check if scenario is used in any experiments
- Optionally prevent deletion if in use
- Or soft-delete with deleted_at timestamp

---

#### `POST /api/scenarios/bulk-import`

**Purpose:** Import multiple scenarios from CSV  
**Frontend:** [apps/dashboard/src/app/data/page.tsx](apps/dashboard/src/app/data/page.tsx)

**Request:** multipart/form-data with CSV file

**CSV Format:**

```csv
task_id,domain,task_description,baseline_answer,ground_truth
```

**Response:**

```json
{
  "imported": 150,
  "skipped": 5,
  "errors": [
    {
      "row": 23,
      "error": "Missing required field: task_description"
    }
  ]
}
```

**Implementation Notes:**

- Validate CSV structure
- Check for duplicate task_ids
- Bulk insert for performance
- Return detailed error report

---

#### `GET /api/models`

**Purpose:** Get available LLM models per provider  
**Frontend:** [apps/dashboard/src/app/experiments/new/page.tsx](apps/dashboard/src/app/experiments/new/page.tsx)

**Query Parameters:**

```
?provider=openai|anthropic|deepseek|openrouter
```

**Response:**

```json
{
  "provider": "openai",
  "models": [
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "context_window": 128000,
      "supports_streaming": true,
      "cost_per_1k_input": 0.005,
      "cost_per_1k_output": 0.015
    }
  ]
}
```

**Implementation Notes:**

- Fetch from actual provider APIs (OpenAI, Anthropic, etc.)
- Cache results for 1 hour to reduce API calls
- Handle API failures gracefully with fallback to cached data

---

### 3. AI Scenario Generation API

#### `POST /api/scenarios/generate/estimate`

**Purpose:** Estimate cost before generation  
**Frontend:** [apps/dashboard/src/app/scenarios/generate/page.tsx](apps/dashboard/src/app/scenarios/generate/page.tsx)

**Request Body:**

```json
{
  "domain": "problem_solving",
  "count": 10,
  "complexity": "moderate",
  "llm_provider": "openai",
  "llm_model": "gpt-4o",
  "temperature": 0.7
}
```

**Response:**

```json
{
  "estimated_credits": 0.75,
  "estimated_tokens": 15000,
  "estimated_time_seconds": 120,
  "cost_breakdown": {
    "input_tokens": 5000,
    "output_tokens": 10000,
    "cost_per_scenario": 0.075
  }
}
```

---

#### `POST /api/scenarios/generate` (SSE)

**Purpose:** Generate scenarios with AI using SSE streaming  
**Frontend:** [apps/dashboard/src/app/scenarios/generate/page.tsx](apps/dashboard/src/app/scenarios/generate/page.tsx)

**Request Body:** Same as estimate endpoint

**SSE Event Format:**

```
event: progress
data: {
  "type": "progress",
  "text": "Generating scenario 3 of 10...",
  "current": 3,
  "total": 10
}

event: scenario
data: {
  "type": "scenario",
  "scenario": {
    "task_id": "gen_001",
    "domain": "problem_solving",
    "task_description": "...",
    "baseline_answer": "...",
    "ground_truth": "..."
  }
}

event: complete
data: {
  "type": "complete",
  "total_generated": 10,
  "total_cost": 0.75
}

event: error
data: {
  "type": "error",
  "message": "Generation failed"
}
```

**Implementation Notes:**

- Stream each generated scenario as it's created
- Use LLM provider SDK for generation
- Store generated scenarios in database
- Track usage/costs for billing

---

### 4. System Monitoring API

#### `GET /api/system/containers`

**Purpose:** Get Docker container status  
**Frontend:** [apps/dashboard/src/app/system/page.tsx](apps/dashboard/src/app/system/page.tsx)

**Response:**

```json
{
  "containers": [
    {
      "name": "maac-api",
      "status": "running",
      "uptime": "2h 34m",
      "cpu_percent": 12.5,
      "memory_percent": 45.2,
      "memory_usage": "512MB / 1GB",
      "health": "healthy"
    },
    {
      "name": "postgres",
      "status": "running",
      "uptime": "5d 12h",
      "cpu_percent": 5.3,
      "memory_percent": 32.1,
      "memory_usage": "256MB / 512MB",
      "health": "healthy"
    }
  ]
}
```

**Implementation Notes:**

- Use Docker SDK/CLI to fetch container stats
- Parse docker ps and docker stats output
- Calculate uptime from container start time

---

#### `GET /api/system/services`

**Purpose:** Health checks for database services

**Response:**

```json
{
  "services": [
    {
      "service": "PostgreSQL",
      "status": "connected",
      "latency_ms": 5,
      "details": "postgres://localhost:5432/maac"
    },
    {
      "service": "Redis",
      "status": "connected",
      "latency_ms": 2,
      "details": "redis://localhost:6379"
    },
    {
      "service": "Neo4j",
      "status": "connected",
      "latency_ms": 8,
      "details": "bolt://localhost:7687"
    }
  ]
}
```

**Implementation Notes:**

- Ping each service with timeout
- Measure response time
- Return connection status

---

#### `GET /api/system/metrics`

**Purpose:** System resource metrics

**Response:**

```json
{
  "cpu_percent": 35.2,
  "memory_percent": 62.8,
  "memory_total": "16GB",
  "memory_used": "10GB",
  "disk_percent": 45.3,
  "disk_total": "500GB",
  "disk_used": "226GB"
}
```

**Implementation Notes:**

- Use os/psutil library to get system stats
- Calculate percentages
- Format sizes in human-readable units

---

#### `POST /api/system/containers/{name}/start`

**Purpose:** Start stopped container

**Response:**

```json
{
  "container": "postgres",
  "status": "running",
  "message": "Container started successfully"
}
```

---

#### `POST /api/system/containers/{name}/stop`

**Purpose:** Stop running container

---

#### `POST /api/system/containers/{name}/restart`

**Purpose:** Restart container

---

### 5. Settings & Configuration API

#### `GET /api/settings`

**Purpose:** Get all user settings  
**Frontend:** [apps/dashboard/src/app/settings/page.tsx](apps/dashboard/src/app/settings/page.tsx)

**Response:**

```json
{
  "credentials": {
    "openai_api_key": "sk-...***...xyz",
    "anthropic_api_key": "sk-...***...abc",
    "deepseek_api_key": null
  },
  "preferences": {
    "refresh_interval": 5000,
    "default_tier": "tier1a",
    "auto_start_experiments": false
  }
}
```

**Implementation Notes:**

- Mask API keys (show only first 8 and last 3 chars)
- Store in secure configuration table
- Support per-user settings if multi-tenant

---

#### `PUT /api/settings/credentials`

**Purpose:** Update API credentials

**Request Body:**

```json
{
  "openai_api_key": "sk-...",
  "anthropic_api_key": "sk-...",
  "deepseek_api_key": "sk-..."
}
```

**Response:**

```json
{
  "message": "Credentials updated successfully"
}
```

**Implementation Notes:**

- Encrypt before storing in database
- Validate API keys by testing with provider
- Return error if invalid key

---

#### `GET /api/billing`

**Purpose:** Get usage and billing information  
**Frontend:** [apps/dashboard/src/app/settings/page.tsx](apps/dashboard/src/app/settings/page.tsx)

**Response:**

```json
{
  "current_month": {
    "credits_used": 125.5,
    "credits_limit": 500.0,
    "total_tokens": 1500000,
    "total_experiments": 45
  },
  "usage_by_provider": [
    {
      "provider": "openai",
      "credits": 75.25,
      "tokens": 900000
    },
    {
      "provider": "anthropic",
      "credits": 50.25,
      "tokens": 600000
    }
  ],
  "recent_usage": [
    {
      "date": "2025-12-20",
      "credits": 12.5,
      "experiments": 5
    }
  ]
}
```

---

## 🗄️ Database Schema Requirements

### Experiments Table

```sql
CREATE TABLE experiments (
  experiment_id UUID PRIMARY KEY,
  experiment_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused', 'stopped')),
  tier VARCHAR(10),
  domain VARCHAR(100),
  llm_provider VARCHAR(50),
  llm_model VARCHAR(100),
  temperature DECIMAL(3,2),
  top_p DECIMAL(3,2),
  max_tokens INT,
  total_trials INT,
  completed_trials INT DEFAULT 0,
  failed_trials INT DEFAULT 0,
  overall_maac_score DECIMAL(4,3),
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### Trials Table

```sql
CREATE TABLE trials (
  trial_id UUID PRIMARY KEY,
  experiment_id UUID REFERENCES experiments(experiment_id),
  scenario_id UUID REFERENCES scenarios(scenario_id),
  status VARCHAR(20),
  maac_score DECIMAL(4,3),
  model_alignment DECIMAL(4,3),
  answer_accuracy DECIMAL(4,3),
  adaptability DECIMAL(4,3),
  clarity DECIMAL(4,3),
  response TEXT,
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_experiment (experiment_id),
  INDEX idx_status (status)
);
```

### Scenarios Table

```sql
CREATE TABLE scenarios (
  scenario_id UUID PRIMARY KEY,
  task_id VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(100),
  task_description TEXT NOT NULL,
  baseline_answer TEXT,
  ground_truth TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  INDEX idx_domain (domain),
  INDEX idx_task_id (task_id)
);
```

### Settings Table

```sql
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  encrypted BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Usage Tracking Table

```sql
CREATE TABLE usage_logs (
  id SERIAL PRIMARY KEY,
  experiment_id UUID REFERENCES experiments(experiment_id),
  provider VARCHAR(50),
  model VARCHAR(100),
  input_tokens INT,
  output_tokens INT,
  cost DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_created_at (created_at),
  INDEX idx_provider (provider)
);
```

---

## 🔧 Technical Implementation Notes

### BullMQ Job Queue

- Set up Redis connection
- Define job types: `experiment-trial`, `scenario-generation`
- Implement worker processors
- Add retry logic with exponential backoff
- Monitor queue health

### SSE Implementation

- Use Fastify SSE plugin or manual implementation
- Set appropriate headers: `Content-Type: text/event-stream`
- Implement reconnection logic with Last-Event-ID
- Add heartbeat to detect client disconnections
- Close connections properly on completion

### LLM Provider Integration

- Abstract provider interface (OpenAI, Anthropic, DeepSeek, OpenRouter)
- Implement retry logic for rate limits
- Track token usage for billing
- Handle streaming responses
- Cache model lists

### Docker Management

- Use Dockerode library (Node.js) or Docker SDK
- Require proper permissions for container control
- Implement safety checks (don't stop critical containers)
- Log all container actions

### Error Handling

- Return consistent error format:
  ```json
  {
    "error": "Error message",
    "code": "ERROR_CODE",
    "details": {}
  }
  ```
- Use appropriate HTTP status codes
- Log errors with context

### Security

- Encrypt API keys at rest
- Validate all inputs with schemas
- Rate limit expensive operations
- Implement CORS properly
- Use secure session management

---

## ✅ Testing Requirements

### Unit Tests

- [ ] All endpoint handlers
- [ ] Database queries
- [ ] LLM provider integrations
- [ ] Cost calculation logic

### Integration Tests

- [ ] Full experiment workflow
- [ ] Scenario CRUD operations
- [ ] SSE streaming
- [ ] Docker container management

### Load Tests

- [ ] Concurrent experiments
- [ ] High trial counts
- [ ] Multiple SSE connections
- [ ] Bulk scenario imports

---

## 📚 Reference Documentation

- Frontend Implementation: [DASHBOARD_COMPLETION.md](DASHBOARD_COMPLETION.md)
- Dashboard Progress: [DASHBOARD_PROGRESS.md](DASHBOARD_PROGRESS.md)
- Deployment Guide: [docs/FLY_IO_DEPLOYMENT.md](docs/FLY_IO_DEPLOYMENT.md)
- Experiment Orchestrator: [packages/experiment-orchestrator/](packages/experiment-orchestrator/)
- MAAC Framework: [packages/maac-framework/](packages/maac-framework/)

---

**Last Updated:** December 20, 2025  
**Total Endpoints:** 24  
**Estimated Implementation Time:** 2-3 weeks  
**Priority:** HIGH - Blocking dashboard usage
