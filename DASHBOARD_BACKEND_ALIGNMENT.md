# Dashboard-to-Backend API Alignment Guide

**Status:** Dashboard needs updates to align with existing backend  
**Backend API:** Fully implemented in `/apps/api/src/routes/`  
**Priority:** HIGH - Update dashboard to match backend structure

---

## 🎯 Current Backend API Structure

### Experiment Routes (`/api/experiments`)

#### ✅ POST /api/experiments
**Exists:** Yes  
**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "domains": ["analytical", "planning", "communication", "problem_solving"],
  "tiers": ["simple", "moderate", "complex"],
  "repetitionsPerDomainTier": 5,
  "models": ["deepseek_v3", "sonnet_37", "gpt_4o", "llama_maverick"],
  "toolConfigs": [
    {
      "configId": "string",
      "name": "string",
      "description": "string",
      "toolConfiguration": {
        "enableGoalEngine": true,
        "enablePlanningEngine": true,
        "enableClarificationEngine": true,
        "enableValidationEngine": true,
        "enableEvaluationEngine": true,
        "enableReflectionEngine": true,
        "enableMemoryStore": true,
        "enableMemoryQuery": true,
        "enableThinkTool": true
      }
    }
  ],
  "parallelism": 10,
  "timeout": 60000
}
```

**Dashboard Issue:** Current form expects different structure with single model/tier, needs update to support arrays

---

#### ✅ GET /api/experiments/:id/status
**Exists:** Yes  
**Response:**
```json
{
  "experimentId": "uuid",
  "total": 100,
  "completed": 45,
  "waiting": 30,
  "active": 5,
  "failed": 2,
  "progress": 0.45,
  "estimatedTimeRemaining": 300
}
```

**Dashboard Issue:** Expecting more detailed experiment metadata (name, description, created_at, etc.)

---

#### ✅ GET /api/experiments/:id/results
**Exists:** Yes  
**Query Params:** `?limit=100&offset=0&domain=analytical&tier=simple`  
**Response:**
```json
{
  "experimentId": "uuid",
  "results": [
    {
      "trialId": "uuid",
      "domain": "analytical",
      "tier": "simple",
      "modelId": "deepseek_v3",
      "maacOverallScore": 0.85,
      "maacConfidence": 0.92,
      "maacCognitiveLoad": 0.78,
      "maacToolExecution": 0.88,
      "maacContentQuality": 0.91
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 150
  }
}
```

**Dashboard Issue:** Needs full MAAC 9-dimension breakdown

---

#### ✅ POST /api/experiments/:id/pause
**Exists:** Yes  
**Response:**
```json
{
  "message": "Experiment paused",
  "experimentId": "uuid"
}
```

---

#### ✅ POST /api/experiments/:id/resume
**Exists:** Yes  
**Response:**
```json
{
  "message": "Experiment resumed",
  "experimentId": "uuid"
}
```

---

#### ❌ Missing Endpoints (Dashboard expects but don't exist)
- `GET /api/experiments` - List all experiments
- `GET /api/experiments/:id` - Full experiment details
- `POST /api/experiments/:id/stop` - Stop experiment
- `POST /api/experiments/:id/retry` - Retry failed trials
- `GET /api/experiments/:id/export` - Export results
- `GET /api/experiments/:id/progress` (SSE) - Real-time progress

---

### Scenario Routes (`/api/scenarios`)

#### ✅ POST /api/scenarios/generate
**Exists:** Yes  
**Request Body:**
```json
{
  "domains": ["analytical", "planning"],
  "tiers": ["simple", "moderate"],
  "repetitions": 5,
  "models": ["deepseek_v3"],
  "configType": "full_tools" | "baseline" | "custom",
  "configId": "string"
}
```

**Response:**
```json
{
  "message": "Generated scenarios",
  "experimentId": "uuid",
  "count": 20,
  "scenarios": [
    {
      "scenarioId": "uuid",
      "domain": "analytical",
      "tier": "simple",
      "taskTitle": "string"
    }
  ]
}
```

---

#### ❌ Missing Endpoints
- `GET /api/scenarios` - List all scenarios
- `POST /api/scenarios` - Create single scenario
- `PUT /api/scenarios/:id` - Update scenario
- `DELETE /api/scenarios/:id` - Delete scenario
- `POST /api/scenarios/bulk-import` - Import CSV
- `POST /api/scenarios/generate/estimate` - Cost estimate

---

### LLM Routes (`/api/llm`)

Need to check what exists here for model fetching.

---

## 📋 Required Dashboard Updates

### Priority 1: Update Experiment Creation Form

**File:** `apps/dashboard/src/app/experiments/new/page.tsx`

**Changes Needed:**
1. Support multiple domains (array selection)
2. Support multiple tiers (array selection)
3. Support multiple models (array selection)
4. Add `repetitionsPerDomainTier` field
5. Add tool configuration builder for `toolConfigs` array
6. Add `parallelism` field
7. Add `timeout` field
8. Remove fields not in backend: `llm_provider`, `temperature`, `top_p`, `max_tokens`

**New Form Structure:**
```tsx
{
  name: string;
  description: string;
  domains: Domain[]; // Multi-select
  tiers: Tier[]; // Multi-select  
  repetitionsPerDomainTier: number; // 1-200
  models: ModelId[]; // Multi-select
  toolConfigs: ToolConfig[]; // Array builder
  parallelism: number; // Default 10
  timeout: number; // Default 60000
}
```

---

### Priority 2: Add Missing Backend Endpoints

Since dashboard expects these, we need to add them to backend:

#### Backend TODO - Experiments
- [ ] `GET /api/experiments` - List with filters
- [ ] `GET /api/experiments/:id` - Full details (not just status)
- [ ] `POST /api/experiments/:id/stop` - Stop experiment
- [ ] `POST /api/experiments/:id/retry` - Retry failed
- [ ] `GET /api/experiments/:id/export` - Export results
- [ ] `GET /api/experiments/:id/progress` - SSE stream

#### Backend TODO - Scenarios
- [ ] `GET /api/scenarios` - List scenarios
- [ ] `POST /api/scenarios` - Create scenario
- [ ] `PUT /api/scenarios/:id` - Update scenario
- [ ] `DELETE /api/scenarios/:id` - Delete scenario
- [ ] `POST /api/scenarios/bulk-import` - Import CSV

#### Backend TODO - System
- [ ] `GET /api/system/containers` - Docker status
- [ ] `GET /api/system/services` - Service health
- [ ] `GET /api/system/metrics` - System metrics
- [ ] `POST /api/system/containers/:name/{action}` - Container control

#### Backend TODO - Settings
- [ ] `GET /api/settings` - Get settings
- [ ] `PUT /api/settings/credentials` - Update API keys
- [ ] `GET /api/billing` - Usage tracking

---

### Priority 3: Update Experiment Detail Page

**File:** `apps/dashboard/src/app/experiments/[id]/page.tsx`

**Changes:**
1. Call `/api/experiments/:id/results` instead of `/api/experiments/:id`
2. Parse MAAC scores from results array
3. Calculate aggregate MAAC scores across trials
4. Map backend status response to dashboard display

---

### Priority 4: Update API Client

**File:** `apps/dashboard/src/lib/api-client.ts`

**Update all endpoint calls to match backend:**
```typescript
// OLD - Dashboard expects
POST /api/experiments
{
  tier: "tier1a",
  llm_model: "gpt-4o",
  temperature: 0.7
}

// NEW - Backend requires
POST /api/experiments
{
  tiers: ["simple", "moderate"],
  models: ["gpt_4o"],
  toolConfigs: [...]
}
```

---

## 🔄 Data Model Mapping

### Backend → Dashboard Mapping

#### Experiment Status
```typescript
// Backend (orchestrator)
{
  experimentId: string;
  total: number;
  completed: number;
  waiting: number;
  active: number;
  failed: number;
  progress: number;
}

// Dashboard needs
{
  experimentId: string;
  experimentName: string; // MISSING - need to store
  status: "pending" | "running" | "completed" | "failed";
  totalTrials: number; // = total
  completedTrials: number; // = completed
  tier: string; // MISSING - need to store
  domain: string; // MISSING - need to store
  llm_model: string; // MISSING - need to store
  created_at: string; // MISSING - need to store
}
```

**Solution:** Backend needs to store experiment metadata in database, not just orchestrator state.

---

#### MAAC Scores
```typescript
// Backend (MAACExperimentalData)
{
  maacCognitiveLoad: Decimal;
  maacToolExecution: Decimal;
  maacContentQuality: Decimal;
  maacMemoryIntegration: Decimal;
  maacComplexityHandling: Decimal;
  maacHallucinationControl: Decimal;
  maacKnowledgeTransfer: Decimal;
  maacProcessingEfficiency: Decimal;
  maacConstructValidity: Decimal;
  maacOverallScore: Decimal;
  maacConfidence: Decimal;
}

// Dashboard expects (4 dimensions)
{
  model_alignment: number;
  answer_accuracy: number;
  adaptability: number;
  clarity: number;
  overall_maac_score: number;
}
```

**Solution:** Dashboard needs to map backend's 9 dimensions to 4-dimension display, or update to show all 9.

---

## 🗄️ Database Schema Alignment

### Current Schema: MAACExperimentalData
- Stores trial-level results
- No experiment-level metadata
- No scenarios table
- No settings table

### Required Schema Additions

```prisma
// New table for experiment metadata
model Experiment {
  id String @id @default(uuid())
  experimentId String @unique
  name String
  description String?
  status String // pending, running, completed, failed, paused
  domains String[] // Multiple domains
  tiers String[] // Multiple tiers
  models String[] // Multiple models
  repetitionsPerDomainTier Int
  totalTrials Int
  completedTrials Int @default(0)
  failedTrials Int @default(0)
  toolConfigs Json
  parallelism Int @default(10)
  timeout Int @default(60000)
  createdAt DateTime @default(now())
  startedAt DateTime?
  completedAt DateTime?
  
  trials MAACExperimentalData[]
  
  @@index([status])
  @@index([createdAt])
  @@map("experiments")
}

// New table for scenarios
model Scenario {
  id String @id @default(uuid())
  scenarioId String @unique
  domain String
  tier String
  taskTitle String
  taskDescription String?
  expectedOutcome String?
  metadata Json?
  createdAt DateTime @default(now())
  
  @@index([domain, tier])
  @@map("scenarios")
}

// New table for settings
model Setting {
  id Int @id @default(autoincrement())
  key String @unique
  value String
  encrypted Boolean @default(false)
  updatedAt DateTime @updatedAt
  
  @@map("settings")
}
```

---

## ✅ Action Plan

### Step 1: Update Database Schema
1. Add Experiment, Scenario, Setting models to Prisma schema
2. Run migration: `npx prisma migrate dev`
3. Update experiment creation to store metadata

### Step 2: Add Missing Backend Endpoints
1. Implement `GET /api/experiments` list endpoint
2. Implement `GET /api/experiments/:id` details endpoint
3. Implement CRUD endpoints for scenarios
4. Implement system monitoring endpoints
5. Implement settings endpoints

### Step 3: Update Dashboard Forms
1. Update experiment creation form structure
2. Add tool configuration builder component
3. Update API client to match backend contracts
4. Update experiment detail page to parse backend responses

### Step 4: Test Integration
1. Test experiment creation flow
2. Test experiment monitoring
3. Test scenario management
4. Verify MAAC score display

---

**Last Updated:** December 20, 2025  
**Next Step:** Update Prisma schema and run migrations  
**Priority:** HIGH - Dashboard is blocked on backend alignment
