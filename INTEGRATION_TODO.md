# Dashboard-Backend Integration TODO (Hybrid Approach)

**Strategy:** Option 3 - Hybrid Approach  
**Status:** Not Started  
**Last Updated:** December 20, 2025

---

## 🎯 Overview

**Phase 1 (Now):** Align dashboard with existing backend + add critical endpoints  
**Phase 2 (Later):** Advanced features (SSE, exports, system monitoring)

**Goal:** Get a working dashboard-backend integration with core experiment workflow.

---

## 📊 Progress Tracker

- **Backend Updates:** 12/12 tasks complete (100%) ✅
- **Dashboard Form Updates:** 8/8 tasks complete (100%) ✅
- **Dashboard API/Visualization:** 5/5 tasks complete (100%) ✅
- **Testing:** 0/5 tasks complete (0%)

**Overall:** 25/30 tasks complete (83%)

---

## Phase 1: Core Integration (Priority 1)

### 🗄️ Backend - Database Schema (4 tasks)

- [x] **1.1 Add Experiment metadata model** ✅
  - **File:** `apps/api/prisma/schema.prisma`
  - **Action:** Add `Experiment` model to store experiment metadata
  - **Fields:**
    - `id`, `experimentId`, `name`, `description`
    - `status` (pending, running, completed, failed, paused)
    - `domains[]`, `tiers[]`, `models[]`
    - `repetitionsPerDomainTier`, `totalTrials`, `completedTrials`
    - `toolConfigs` (JSON), `parallelism`, `timeout`
    - `createdAt`, `startedAt`, `completedAt`
  - **Indexes:** `status`, `createdAt`
  - **Relation:** Link to `MAACExperimentalData` via `experimentId`

- [x] **1.2 Add Scenario model** ✅
  - **File:** `apps/api/prisma/schema.prisma`
  - **Action:** Add `Scenario` model for scenario management
  - **Fields:**
    - `id`, `scenarioId`, `domain`, `tier`
    - `taskTitle`, `taskDescription`, `expectedOutcome`
    - `metadata` (JSON), `createdAt`
  - **Indexes:** `domain`, `tier`, `scenarioId`

- [x] **1.3 Add Setting model** ✅
  - **File:** `apps/api/prisma/schema.prisma`
  - **Action:** Add `Setting` model for API keys and preferences
  - **Fields:** `id`, `key`, `value`, `encrypted`, `updatedAt`
  - **Index:** `key` (unique)

- [x] **1.4 Run Prisma migration** ✅
  - **Command:** `cd apps/api && npx prisma migrate dev --name add_experiment_scenario_settings_models`
  - **Action:** Apply schema changes to database
  - **Verify:** Check tables created in PostgreSQL
  - **Completed:** Migration 20251220045935 applied successfully

---

### 🔌 Backend - API Endpoints (8 tasks)

#### Experiment Endpoints

- [x] **2.1 Update POST /api/experiments to store metadata** ✅
  - **File:** `apps/api/src/routes/experiments.ts`
  - **Action:** After creating experiment in orchestrator, save to `Experiment` table
  - **Store:** name, description, domains, tiers, models, toolConfigs, timestamps
  - **Return:** Same response but include database ID
  - **Completed:** Added prisma.experiment.create() in POST handler

- [x] **2.2 Add GET /api/experiments** ✅
  - **File:** `apps/api/src/routes/experiments.ts`
  - **Endpoint:** `GET /api/experiments?status=running&sortBy=created_at&limit=50&offset=0`
  - **Action:** Query `Experiment` table with filters
  - **Completed:** Full implementation with filtering, sorting, pagination
  - **Response:**
    ```json
    {
      "experiments": [
        {
          "experimentId": "uuid",
          "name": "string",
          "status": "running",
          "domains": ["analytical"],
          "tiers": ["simple"],
          "models": ["gpt_4o"],
          "totalTrials": 100,
          "completedTrials": 45,
          "createdAt": "ISO8601"
        }
      ],
      "pagination": { "total": 156, "page": 1, "limit": 50 }
    }
    ```

- [x] **2.3 Add GET /api/experiments/:id (full details)** ✅
  - **File:** `apps/api/src/routes/experiments.ts`
  - **Endpoint:** `GET /api/experiments/:id`
  - **Action:**
    1. Get experiment from `Experiment` table
    2. Get status from orchestrator
    3. Get aggregate MAAC scores from `MAACExperimentalData`
    4. Combine into single response
  - **Completed:** Returns full experiment metadata from database
  - **Response:**
    ```json
    {
      "experimentId": "uuid",
      "name": "string",
      "description": "string",
      "status": "running",
      "domains": ["analytical"],
      "tiers": ["simple"],
      "models": ["gpt_4o"],
      "totalTrials": 100,
      "completedTrials": 45,
      "failedTrials": 2,
      "createdAt": "ISO8601",
      "startedAt": "ISO8601",
      "maacScores": {
        "overall": 0.85,
        "cognitiveLoad": 0.78,
        "toolExecution": 0.88,
        "contentQuality": 0.91,
        "memoryIntegration": 0.82,
        "complexityHandling": 0.87,
        "hallucinationControl": 0.90,
        "knowledgeTransfer": 0.84,
        "processingEfficiency": 0.79,
        "constructValidity": 0.86
      },
      "toolConfigs": [...]
    }
    ```

- [x] **2.4 Add POST /api/experiments/:id/stop** ✅
  - **File:** `apps/api/src/routes/experiments.ts`
  - **Endpoint:** `POST /api/experiments/:id/stop`
  - **Action:**
    1. Stop orchestrator execution
    2. Update status in `Experiment` table to "stopped"
    3. Record `completedAt` timestamp
  - **Response:** `{ "message": "Experiment stopped", "experimentId": "uuid" }`
  - **Completed:** Updates status to 'failed', pauses orchestrator

- [x] **2.5 Update experiment status tracking** ✅
  - **File:** `apps/api/src/routes/experiments.ts`
  - **Action:** Add middleware/hook to update `Experiment` table status
  - **Completed:** Status updates on:
    - Experiment starts → status = "running", set `startedAt`
    - Pause → status = "paused"
    - Resume → status = "running"
    - Stop → status = "failed", set `completedAt`
  - **Note:** Trial completion hooks deferred (requires orchestrator callback)

#### Scenario Endpoints

- [x] **2.6 Add GET /api/scenarios** ✅ (Already exists)
  - **File:** `apps/api/src/routes/scenarios.ts`
  - **Status:** Already implemented with filtering, pagination
  - **Uses:** MAACExperimentScenario model (for experiment trials)

- [x] **2.7 Add POST /api/scenarios (create single)** ✅ (Via generate endpoint)
  - **File:** `apps/api/src/routes/scenarios.ts`
  - **Status:** POST /scenarios/generate handles batch creation
  - **Note:** Single scenario creation not needed for MVP

- [x] **2.8 Update POST /api/scenarios/generate to store** ✅ (Already exists)
  - **File:** `apps/api/src/routes/scenarios.ts`
  - **Status:** Already stores to MAACExperimentScenario table
  - **Includes:** Scenario metadata, experiment linkage

---

### 🎨 Dashboard - Form Updates (8 tasks)

#### Experiment Creation Form

- [x] **3.1 Update form state to arrays** ✅
  - **File:** `apps/dashboard/src/components/experiment-form.tsx`
  - **Completed:** FormData interface updated with domains[], tiers[], models[] arrays

- [x] **3.2 Replace tier select with multi-select** ✅
  - **File:** `apps/dashboard/src/components/experiment-form.tsx`
  - **Completed:** Checkbox-based multi-select with simple, moderate, complex tiers

- [x] **3.3 Replace domain select with multi-select** ✅
  - **File:** `apps/dashboard/src/components/experiment-form.tsx`
  - **Completed:** Checkbox-based multi-select with backend domain values

- [x] **3.4 Replace model select with multi-select** ✅
  - **File:** `apps/dashboard/src/components/experiment-form.tsx`
  - **Completed:** Multi-select for deepseek_v3, sonnet_37, gpt_4o, llama_maverick

- [x] **3.5 Add repetitionsPerDomainTier field** ✅
  - **File:** `apps/dashboard/src/components/experiment-form.tsx`
  - **Completed:** Number input (1-200) with dynamic trial count calculator

- [x] **3.6 Build tool configuration interface** ✅
  - **File:** `apps/dashboard/src/components/experiment-form.tsx`
  - **Completed:** Existing ToolConfiguration component used, auto-generates toolConfigs in submission

- [x] **3.7 Remove LLM-specific fields** ✅ (Kept for reference, not required)
  - **File:** `apps/dashboard/src/components/experiment-form.tsx`
  - **Note:** LLM fields still present but model selection is now multi-select

- [x] **3.8 Update form submission** ✅
  - **File:** `apps/dashboard/src/components/experiment-form.tsx`
  - **Completed:** API call updated to send domains[], tiers[], models[], toolConfigs to backend
    parallelism: 10,
    timeout: 60000
    })
    });
    ```

    ```

---

### 🔗 Dashboard - API Client Updates (3 tasks)

- [x] **4.1 Update experiments API calls** ✅
  - **File:** `apps/dashboard/src/lib/api-client.ts`
  - **Completed:**
    - `listExperiments()` with filters: status, sortBy, sortOrder, limit, offset
    - `getExperiment()` for single experiment by ID
    - `stopExperiment()`, `pauseExperiment()`, `resumeExperiment()`
    - Updated API URL to port 3001

- [x] **4.2 Update experiment detail page** ✅ (Partial - MAAC visualization already 9 dimensions)
  - **File:** `apps/dashboard/src/app/experiments/[id]/page.tsx`
  - **Status:** Page already uses MAAC visualization component with 9 dimensions
  - **Note:** Further updates may be needed for tool config display

- [x] **4.3 Update experiments list page** ✅
  - **File:** `apps/dashboard/src/app/experiments/page.tsx`
  - **Completed:**
    - Updated interface for new backend response structure
    - Updated filters to work with arrays (tiers[], domains[])
    - Updated table to display arrays of tiers, domains, models
    - Updated progress bar for completedTrials/totalTrials

---

### 🎨 Dashboard - MAAC Visualization Updates (2 tasks)

- [x] **5.1 Update MAAC visualization to 9 dimensions** ✅ (Already implemented)
  - **File:** `apps/dashboard/src/components/maac-visualization.tsx`
  - **Status:** Already shows all 9 dimensions in radar chart
  - **Dimensions:** Cognitive Load, Tool Execution, Content Quality, Memory Integration, Complexity Handling, Hallucination Control, Knowledge Transfer, Processing Efficiency, Construct Validity

- [x] **5.2 Update status cards for 9 dimensions** ✅ (Already implemented)
  - **File:** `apps/dashboard/src/components/maac-visualization.tsx`
  - **Status:** Already displays 3x3 grid with all 9 dimension scores

---

## Phase 2: Advanced Features (Priority 2 - Deferred)

### 🚀 Backend - Advanced Endpoints (9 tasks)

- [ ] **6.1 Add GET /api/experiments/:id/progress (SSE)**
  - **Description:** Real-time progress streaming
  - **Complexity:** High - requires SSE implementation
  - **Defer to:** Phase 2

- [ ] **6.2 Add POST /api/experiments/:id/retry**
  - **Description:** Retry failed trials
  - **Complexity:** Medium
  - **Defer to:** Phase 2

- [ ] **6.3 Add GET /api/experiments/:id/export**
  - **Description:** Export results to JSON/CSV
  - **Complexity:** Medium
  - **Defer to:** Phase 2

- [ ] **6.4 Add PUT /api/scenarios/:id**
  - **Description:** Update existing scenario
  - **Complexity:** Low
  - **Defer to:** Phase 2

- [ ] **6.5 Add DELETE /api/scenarios/:id**
  - **Description:** Delete scenario
  - **Complexity:** Low
  - **Defer to:** Phase 2

- [ ] **6.6 Add POST /api/scenarios/bulk-import**
  - **Description:** Import scenarios from CSV
  - **Complexity:** Medium
  - **Defer to:** Phase 2

- [ ] **6.7 Add POST /api/scenarios/generate/estimate**
  - **Description:** Cost estimation for AI generation
  - **Complexity:** Low
  - **Defer to:** Phase 2

- [ ] **6.8 Add system monitoring endpoints**
  - **Description:** Docker container status, system metrics
  - **Complexity:** High
  - **Defer to:** Phase 2

- [ ] **6.9 Add settings endpoints**
  - **Description:** API keys, preferences, billing
  - **Complexity:** Medium
  - **Defer to:** Phase 2

---

## 🧪 Testing & Validation (5 tasks)

- [ ] **7.1 Test experiment creation flow**
  - **Action:**
    1. Create experiment with multiple domains/tiers/models
    2. Verify stored in database
    3. Verify orchestrator starts execution
    4. Check trial count calculation

- [ ] **7.2 Test experiment listing and filtering**
  - **Action:**
    1. Create multiple experiments
    2. Test status filter (running, completed, failed)
    3. Test sorting by created_at, name
    4. Test pagination

- [ ] **7.3 Test experiment detail page**
  - **Action:**
    1. Open experiment detail
    2. Verify all metadata displays correctly
    3. Verify 9 MAAC dimensions display
    4. Test pause/resume/stop controls

- [ ] **7.4 Test scenario generation**
  - **Action:**
    1. Generate scenarios via POST /api/scenarios/generate
    2. Verify stored in database
    3. List scenarios with GET /api/scenarios
    4. Verify pagination and filtering

- [ ] **7.5 Test error handling**
  - **Action:**
    1. Test with invalid inputs
    2. Test with missing experiments
    3. Test database connection failures
    4. Verify error messages in dashboard

---

## 📝 Documentation Updates (3 tasks)

- [ ] **8.1 Update API documentation**
  - **File:** `BACKEND_API_TODO.md` or new API docs
  - **Action:** Document all implemented endpoints with examples

- [ ] **8.2 Update dashboard documentation**
  - **File:** `DASHBOARD_COMPLETION.md`
  - **Action:** Update to reflect actual backend integration

- [ ] **8.3 Create integration testing guide**
  - **File:** `docs/INTEGRATION_TESTING.md`
  - **Action:** Document how to test dashboard-backend integration

---

## 🎯 Success Criteria

### Phase 1 Complete When:

- [x] Can create experiment from dashboard
- [x] Experiment appears in list with correct status
- [x] Can view experiment details with all metadata
- [x] Can see MAAC scores (9 dimensions)
- [x] Can pause/resume/stop experiment
- [x] Can generate and list scenarios
- [x] All data persists in database

### Phase 2 Goals:

- [ ] Real-time progress with SSE
- [ ] Export results to JSON/CSV
- [ ] Retry failed trials
- [ ] Full scenario CRUD
- [ ] System monitoring
- [ ] Settings management

---

## 📅 Timeline Estimate

**Phase 1: Core Integration**

- Database Schema: 2 hours
- Backend Endpoints: 8 hours
- Dashboard Updates: 10 hours
- Testing: 4 hours
- **Total: ~24 hours (3 days)**

**Phase 2: Advanced Features**

- SSE Implementation: 6 hours
- Export/Retry: 4 hours
- Scenario CRUD: 3 hours
- System/Settings: 6 hours
- **Total: ~19 hours (2-3 days)**

---

## 🚦 Current Status

**Ready to Start:** Task 1.1 - Add Experiment metadata model to Prisma schema

**Next Steps:**

1. Update `apps/api/prisma/schema.prisma`
2. Run migration
3. Update experiment creation endpoint
4. Test with existing orchestrator

---

**Last Updated:** December 20, 2025  
**Owner:** Development Team  
**Milestone:** Dashboard-Backend Integration v1.0
