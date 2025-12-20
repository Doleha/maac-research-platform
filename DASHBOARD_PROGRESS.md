# MAAC Research Platform - Dashboard Development Progress

**Start Date:** December 19, 2025  
**Status:** In Development  
**Current Phase:** Foundation

---

## 📊 Overall Progress: 23/25 (92%) + Enhancements

---

## Phase 1: Foundation (4/4) ✅

**Goal:** Multi-page routing and navigation structure

### ✅ Completed

- [x] Basic dashboard homepage with Tailwind CSS
- [x] Experiment status component
- [x] MAAC visualization component
- [x] Statistical results component
- [x] **1.1 Build sidebar navigation component** ✅
  - Complete sidebar with all navigation links
  - Active state highlighting
  - Icons and proper styling
  - **Files:** `src/components/sidebar.tsx`
- [x] **Basic API Client setup** ✅
  - Experiment endpoints
  - Analysis endpoints
  - **Files:** `src/lib/api-client.ts`
- [x] **1.1 Setup multi-page routing & navigation** ✅
  - ✅ Build sidebar navigation component
  - ✅ Create pages: /experiments, /experiments/new, /experiments/[id], /data, /settings
  - ✅ Update layout to use sidebar
  - **Files:** `src/app/layout.tsx`, `src/app/experiments/page.tsx`, `src/app/experiments/new/page.tsx`, `src/app/experiments/[id]/page.tsx`, `src/app/data/page.tsx`, `src/app/settings/page.tsx`
- [x] **1.2 Build experiment creation form - Basic structure** ✅
  - Experiment metadata (name, description)
  - Domain selection (problem_solving, creative_writing, data_analysis, technical_reasoning)
  - Tier selection (1a, 1b, 2), replication count
  - Form validation and error handling
  - **Files:** `src/app/experiments/new/page.tsx`, `src/components/experiment-form.tsx`

---

## Phase 2: Experiment Creation (4/4) ✅

**Goal:** Complete experiment configuration interface

### ✅ Completed

- [x] **2.1 Add LLM provider/model selection** ✅
  - Dropdown: OpenAI, Anthropic, DeepSeek, OpenRouter
  - Model selection (dynamic based on provider)
  - Temperature, max_tokens, top_p inputs
  - **Files:** `src/components/llm-selector.tsx`

- [x] **2.2 Implement tool configuration interface** ✅
  - Checkboxes for 6 MIMIC tools (Memory, Planning, Reflection, Validation, Clarification, Evaluation)
  - Map to 6-bit configuration (111111)
  - Select All/Clear All functionality
  - **Files:** `src/components/tool-config.tsx`

- [x] **2.3 Build control expectations editor** ✅
  - 12 expected_calculations inputs
  - 6 success_thresholds inputs
  - Validation + tooltips
  - **Files:** `src/components/control-expectations.tsx`

- [x] **2.4 Connect experiment form to API** ✅
  - POST to `/api/experiments`
  - Validation error handling
  - Redirect on success
  - **Files:** `src/lib/api-client.ts`, `src/components/experiment-form.tsx`

---

## Phase 3: Data Management (2/2) ✅

**Goal:** Upload and validate scenario data

### ✅ Completed

- [x] **3.1 Build data upload component** ✅
  - Drag-drop CSV/JSON upload
  - Parse and validate files
  - Preview table (50 rows)
  - Cell editing capability
  - Downloadable CSV/JSON templates with example data
  - Schema documentation
  - **Files:** `src/app/data/page.tsx`, `src/components/data-upload.tsx`, `src/components/data-preview.tsx`, `src/components/template-download.tsx`

- [x] **3.2 Implement scenario validation & import** ✅
  - Zod schema validation
  - Error display with line numbers
  - POST to `/api/scenarios/bulk-import`
  - Success/error feedback
  - **Files:** `src/components/scenario-validator.tsx`

---

## Phase 4: Execution Controls (4/4) ✅

**Goal:** Run and monitor experiments in real-time

### ✅ Completed

- [x] **4.1 Create experiment detail page with controls** ✅
  - Metadata + config summary
  - Start/Pause/Stop/Resume buttons
  - Status badge with live polling (5s intervals)
  - Progress bar with completion percentage
  - Quick action links to results/errors/export
  - **Files:** `src/app/experiments/[id]/page.tsx`

- [x] **4.2 Build real-time job queue monitor** ✅
  - BullMQ job status (active, completed, failed, waiting, delayed)
  - Job cards with progress bars
  - Stats overview cards
  - Auto-refresh every 2s
  - Job metadata display (trial/scenario/model/config IDs)
  - **Files:** `src/components/queue-monitor.tsx`

- [x] **4.3 Implement worker status dashboard** ✅
  - Worker health metrics (CPU, memory, uptime)
  - Active/idle/paused/offline status badges
  - Job processing statistics
  - Live logs viewer (last 100 entries)
  - Auto-scroll toggle
  - Refresh every 3s
  - **Files:** `src/components/worker-status.tsx`

- [x] **4.4 Build error logs viewer with retry** ✅
  - Failed trials list with error messages
  - Stack trace expansion
  - Individual trial retry buttons
  - Batch selection and retry
  - Select all/none functionality
  - Scenario details display
  - **Files:** `src/app/experiments/[id]/errors/page.tsx`

---

## Phase 5: Analysis & Comparison (2/2) ✅

**Goal:** Advanced results analysis and export

### ✅ Completed

- [x] **5.1 Create experiment comparison view** ✅
  - Multi-select experiments (2-5)
  - Search and filter functionality
  - Overall MAAC score comparison cards
  - Dimensional scores comparison table (9 dimensions)
  - Statistical summary table (mean, median, std dev, min, max)
  - Head-to-head difference indicators (2 experiments)
  - Color-coded score indicators
  - **Files:** `src/app/experiments/compare/page.tsx`

- [x] **5.2 Implement results export functionality** ✅
  - Export buttons component with 3 formats
  - CSV export (trial data + MAAC scores)
  - JSON export (complete structured data)
  - PDF export (formatted report)
  - Browser download with auto-naming
  - Export status feedback (loading, success, error)
  - Export guide with format descriptions
  - **Files:** `src/components/export-buttons.tsx`, `src/app/experiments/[id]/export/page.tsx`

---

## Phase 6: Configuration (4/4) ✅

**Goal:** System settings and credentials management

### ✅ Completed

- [x] **6.1 Build settings page - LLM credentials** ✅
  - API key inputs with show/hide toggle
  - Provider selection (OpenAI, Anthropic, DeepSeek, OpenRouter)
  - Test connection buttons with status feedback
  - Masked password inputs
  - Save functionality with success/error states
  - **Files:** `src/app/settings/page.tsx`

- [x] **6.2 Add database configuration UI** ✅
  - PostgreSQL, Neo4j, Redis connection strings
  - Connection status badges (connected/disconnected/unknown)
  - Test connection buttons with version info
  - Metadata display for connected databases
  - **Files:** `src/components/db-settings.tsx`

- [x] **6.3 Implement memory service settings** ✅
  - Graphiti webhook URL and group ID inputs
  - Enable/disable toggle switch
  - Neo4j graph statistics (nodes, relationships, labels)
  - Refresh stats functionality
  - **Files:** `src/components/memory-settings.tsx`

- [x] **6.4 Build rate limiting controls** ✅
  - Slider for max workers (1-20)
  - Slider for jobs per minute (10-300)
  - Slider for LLM requests per minute (10-1000)
  - Real-time value display
  - Save to update BullMQ configuration
  - Warning about worker restart requirement
  - **Files:** `src/components/rate-limits.tsx`

### ✨ Phase 6 Enhancements

- [x] **Enhanced LLM Provider Support** ✅
  - Added 3 new providers: Grok (X.AI), Google Gemini, Meta Llama
  - Total of 7 providers now supported
  - Dynamic model fetching from API endpoint (GET /api/llm/models?provider={provider})
  - Auto-fetch models on provider change
  - Manual refresh via dropdown click
  - Loading states with spinner
  - Error handling with retry button
  - Updated files: `src/components/llm-selector.tsx`

- [x] **API Key Mode Selection** ✅
  - Dual authentication modes:
    1. **Own API Keys**: Session-only keys (not persisted) - **Tier 2 ONLY**
    2. **System Credits**: Purchase credits via Stripe - **Required for Tier 1a/1b**
  - Tier-based availability:
    - **Tier 1a (Scenario Generation)**: System credits REQUIRED (10 credit base fee + tokens)
    - **Tier 1b (MIMIC Engine)**: System credits REQUIRED (50 credit base fee + tokens)
    - **Tier 2 (MAAC Assessment)**: Both options available (own keys OR system credits)
  - User credit balance display with real-time checks
  - Low balance warnings for Tier 1 (< 100 credits)
  - Automatic mode forcing based on tier selection
  - Session key inputs for all 7 providers
  - Show/hide password toggles
  - Link to billing page
  - Updated files: `src/components/api-key-mode.tsx`, `src/components/experiment-form.tsx`

- [x] **Billing & Credits System** ✅
  - Tabbed settings interface (General | Billing)
  - Credit balance dashboard with visual cards
  - 4 credit packages with discounts (10, 50, 100, 250 credits)
  - Transaction history table
  - Stripe checkout integration (ready for production)
  - Credit estimation API
  - Usage statistics tracking
  - Files: `src/components/billing-credits.tsx`, `src/app/settings/page.tsx`

- [x] **API Enhancements** ✅
  - New LLM routes: `/api/llm/models`, `/api/llm/providers`
  - New billing routes:
    - `/api/billing/credits` - Get credit balance
    - `/api/billing/transactions` - Transaction history
    - `/api/billing/create-checkout` - Stripe session
    - `/api/billing/estimate` - Tier-aware cost estimation
    - `/api/billing/info` - Comprehensive billing info
  - **Charge Matrix System**: Token-based pricing for 7 providers × 30+ models
  - **Usage Tracking Infrastructure**:
    - Real-time token usage tracking with Prisma transactions
    - Automatic credit deduction on LLM calls
    - `trackLLMCall()` middleware wrapper for instrumentation
    - Insufficient balance detection and blocking
  - **Tier-based Pricing**:
    - Tier 1a: 10 credit base fee + token costs
    - Tier 1b: 50 credit base fee + token costs
    - Tier 2: Token costs only (no base fee)
  - Fastify route registration
  - Files:
    - `apps/api/src/routes/llm.ts`
    - `apps/api/src/routes/billing.ts`
    - `apps/api/src/lib/charge-matrix.ts` ⭐ NEW
    - `apps/api/src/lib/usage-tracker.ts` ⭐ NEW
    - `apps/api/src/index.ts`

---

## Phase 7: Browsing & Search (2/2) ✅

**Goal:** Browse and manage experiments and scenarios

### ✅ Completed

- [x] **7.1 Create experiments list/browse page** ✅
  - Comprehensive table with sortable columns (name, created date, MAAC score)
  - Multi-filter system (search, status, tier, domain)
  - Pagination (50 items per page)
  - Status badges with icons (pending, running, completed, failed)
  - Progress bars for trial completion
  - Quick actions (view details, export results)
  - Clear filters button
  - Real-time filtering and sorting
  - **Files:** `src/app/experiments/page.tsx`

- [x] **7.2 Add scenario browser/editor** ✅
  - Scenarios list with search and domain filtering
  - View modal (read-only) for full scenario details
  - Edit modal with inline editing for all fields
  - Delete functionality with confirmation
  - Task ID, domain, description, baseline answer, ground truth
  - Pagination (50 items per page)
  - Save changes with API integration
  - **Files:** `src/app/data/scenarios/page.tsx`

---

## Phase 8: Advanced Features (0/3)

**Goal:** Real-time monitoring and system health

### 📋 Todo

- [ ] **8.1 Implement live experiment progress tracking**
  - Server-Sent Events (SSE)
  - Real-time trial updates
  - Progress bar + timeline
  - **Files:** `src/components/live-progress.tsx`

- [ ] **8.2 Build scenario generation UI**
  - Generation form
  - LLM cost estimate
  - SSE streaming display
  - **Files:** `src/app/scenarios/generate/page.tsx`

- [ ] **8.3 Add system health dashboard**
  - Docker container status
  - Resource metrics
  - Restart buttons
  - **Files:** `src/app/system/page.tsx`

---

## Phase 9: Polish (0/2)

**Goal:** Final touches and user experience

### 📋 Todo

- [ ] **9.1 Implement user notifications system**
  - Toast notifications
  - React context
  - Auto-dismiss
  - **Files:** `src/contexts/NotificationContext.tsx`, `src/components/toast.tsx`

- [ ] **9.2 Polish UI/UX and accessibility**
  - Form validation feedback
  - Loading states
  - Error boundaries
  - Keyboard navigation
  - ARIA labels
  - Responsive design
  - Empty states
  - Dark mode toggle

---

## 📝 Notes & Decisions

### Architecture Decisions

- Using Next.js 14 App Router for file-based routing
- Tailwind CSS for styling
- React Query (@tanstack/react-query) for data fetching
- Server-Sent Events (SSE) for real-time updates
- React Context for global state (notifications)

### API Endpoints Required

- `POST /api/experiments` - Create experiment
- `GET /api/experiments` - List experiments
- `GET /api/experiments/{id}` - Get experiment details
- `GET /api/experiments/{id}/status` - Get status (polling)
- `POST /api/experiments/{id}/start` - Start experiment
- `POST /api/experiments/{id}/pause` - Pause experiment
- `POST /api/experiments/{id}/stop` - Stop experiment
- `GET /api/experiments/{id}/export` - Export results
- `POST /api/scenarios/bulk-import` - Import scenarios
- `GET /api/queue/status` - BullMQ queue status
- `POST /api/settings/credentials` - Save credentials
- `POST /api/experiments/{id}/retry` - Retry failed trials

### Dependencies to Add

- `react-dropzone` - File upload (not needed - implemented with native HTML5 drag-drop)
- `date-fns` - Date formatting
- `zod` (^3.22.4) - Schema validation ✅ Added
- `jspdf` (optional) - PDF generation

---

## 🐛 Known Issues

- None yet

---

## 🎯 Next Steps

1. Start Phase 1: Build sidebar navigation component
2. Create routing structure for all pages
3. Build experiment creation form skeleton

---

**Last Updated:** December 20, 2025

**Recent Progress:**

- ✅ Completed sidebar navigation component with full routing structure
- ✅ Set up basic API client with experiment and analysis endpoints
- ✅ Updated layout to integrate sidebar in two-column layout
- ✅ Created all foundation pages: /experiments, /experiments/new, /experiments/[id], /data, /settings
- ✅ Built comprehensive experiment creation form with validation
- ✅ Implemented LLM provider/model selector with dynamic model lists
- ✅ Created MIMIC tool configuration with 6-bit mapping
- ✅ Built control expectations editor with 12 calculations and 6 thresholds
- ✅ Connected experiment form to API endpoint with error handling
- ✅ Implemented drag-drop file upload with CSV/JSON parsing
- ✅ Built data preview table with cell editing (50 row preview)
- ✅ Created scenario validator with Zod schema and error reporting
- ✅ Connected bulk import to API with success feedback
- ✅ Added downloadable CSV/JSON templates with schema documentation
- ⏳ Next: Phase 4 - Execution controls and real-time monitoring
