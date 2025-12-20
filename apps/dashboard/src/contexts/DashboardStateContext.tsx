'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// =============================================================================
// STATE TYPES
// =============================================================================

interface ExperimentsState {
  filters: {
    status: string;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  selectedExperimentId: string | null;
}

interface ScenariosState {
  filters: {
    domain: string;
    tier: string;
    search: string;
  };
  generateForm: {
    domains: string[];
    tiers: string[];
    scenariosPerDomainTier: number;
    businessContext: string;
  };
}

interface ExperimentFormState {
  name: string;
  description: string;
  domains: string[];
  tiers: string[];
  models: string[];
  repetitionsPerDomainTier: number;
  toolConfigs: {
    enableGoalEngine: boolean;
    enablePlanningEngine: boolean;
    enableClarificationEngine: boolean;
    enableValidationEngine: boolean;
    enableEvaluationEngine: boolean;
    enableReflectionEngine: boolean;
    enableMemoryStore: boolean;
    enableMemoryQuery: boolean;
    enableThinkTool: boolean;
  };
}

interface LogsState {
  filters: {
    level: string;
    source: string;
    search: string;
  };
  autoScroll: boolean;
}

interface SettingsState {
  activeTab: string;
}

interface DashboardState {
  experiments: ExperimentsState;
  scenarios: ScenariosState;
  experimentForm: ExperimentFormState;
  logs: LogsState;
  settings: SettingsState;
}

// =============================================================================
// DEFAULT STATE
// =============================================================================

const defaultExperimentsState: ExperimentsState = {
  filters: {
    status: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  selectedExperimentId: null,
};

const defaultScenariosState: ScenariosState = {
  filters: {
    domain: 'all',
    tier: 'all',
    search: '',
  },
  generateForm: {
    domains: [],
    tiers: [],
    scenariosPerDomainTier: 3,
    businessContext: '',
  },
};

const defaultExperimentFormState: ExperimentFormState = {
  name: '',
  description: '',
  domains: [],
  tiers: [],
  models: [],
  repetitionsPerDomainTier: 10,
  toolConfigs: {
    enableGoalEngine: false,
    enablePlanningEngine: false,
    enableClarificationEngine: false,
    enableValidationEngine: false,
    enableEvaluationEngine: false,
    enableReflectionEngine: false,
    enableMemoryStore: false,
    enableMemoryQuery: false,
    enableThinkTool: false,
  },
};

const defaultLogsState: LogsState = {
  filters: {
    level: 'all',
    source: 'all',
    search: '',
  },
  autoScroll: true,
};

const defaultSettingsState: SettingsState = {
  activeTab: 'api-keys',
};

const defaultState: DashboardState = {
  experiments: defaultExperimentsState,
  scenarios: defaultScenariosState,
  experimentForm: defaultExperimentFormState,
  logs: defaultLogsState,
  settings: defaultSettingsState,
};

// =============================================================================
// CONTEXT
// =============================================================================

interface DashboardStateContextType {
  state: DashboardState;
  // Experiment actions
  setExperimentFilters: (filters: Partial<ExperimentsState['filters']>) => void;
  setSelectedExperiment: (id: string | null) => void;
  // Scenario actions
  setScenarioFilters: (filters: Partial<ScenariosState['filters']>) => void;
  setScenarioGenerateForm: (form: Partial<ScenariosState['generateForm']>) => void;
  // Experiment form actions
  setExperimentForm: (form: Partial<ExperimentFormState>) => void;
  resetExperimentForm: () => void;
  // Logs actions
  setLogsFilters: (filters: Partial<LogsState['filters']>) => void;
  setLogsAutoScroll: (autoScroll: boolean) => void;
  // Settings actions
  setSettingsTab: (tab: string) => void;
  // Global actions
  clearAllState: () => void;
}

const DashboardStateContext = createContext<DashboardStateContextType | null>(null);

// =============================================================================
// STORAGE HELPERS
// =============================================================================

const STORAGE_KEY = 'maac-dashboard-state';

function loadState(): DashboardState {
  if (typeof window === 'undefined') return defaultState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle any missing fields
      return {
        experiments: { ...defaultExperimentsState, ...parsed.experiments },
        scenarios: { ...defaultScenariosState, ...parsed.scenarios },
        experimentForm: { ...defaultExperimentFormState, ...parsed.experimentForm },
        logs: { ...defaultLogsState, ...parsed.logs },
        settings: { ...defaultSettingsState, ...parsed.settings },
      };
    }
  } catch (e) {
    console.error('Failed to load dashboard state:', e);
  }
  return defaultState;
}

function saveState(state: DashboardState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save dashboard state:', e);
  }
}

// =============================================================================
// PROVIDER
// =============================================================================

export function DashboardStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DashboardState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setIsHydrated(true);
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    if (isHydrated) {
      saveState(state);
    }
  }, [state, isHydrated]);

  // Experiment actions
  const setExperimentFilters = useCallback((filters: Partial<ExperimentsState['filters']>) => {
    setState((prev) => ({
      ...prev,
      experiments: {
        ...prev.experiments,
        filters: { ...prev.experiments.filters, ...filters },
      },
    }));
  }, []);

  const setSelectedExperiment = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      experiments: { ...prev.experiments, selectedExperimentId: id },
    }));
  }, []);

  // Scenario actions
  const setScenarioFilters = useCallback((filters: Partial<ScenariosState['filters']>) => {
    setState((prev) => ({
      ...prev,
      scenarios: {
        ...prev.scenarios,
        filters: { ...prev.scenarios.filters, ...filters },
      },
    }));
  }, []);

  const setScenarioGenerateForm = useCallback((form: Partial<ScenariosState['generateForm']>) => {
    setState((prev) => ({
      ...prev,
      scenarios: {
        ...prev.scenarios,
        generateForm: { ...prev.scenarios.generateForm, ...form },
      },
    }));
  }, []);

  // Experiment form actions
  const setExperimentForm = useCallback((form: Partial<ExperimentFormState>) => {
    setState((prev) => ({
      ...prev,
      experimentForm: { ...prev.experimentForm, ...form },
    }));
  }, []);

  const resetExperimentForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      experimentForm: defaultExperimentFormState,
    }));
  }, []);

  // Logs actions
  const setLogsFilters = useCallback((filters: Partial<LogsState['filters']>) => {
    setState((prev) => ({
      ...prev,
      logs: {
        ...prev.logs,
        filters: { ...prev.logs.filters, ...filters },
      },
    }));
  }, []);

  const setLogsAutoScroll = useCallback((autoScroll: boolean) => {
    setState((prev) => ({
      ...prev,
      logs: { ...prev.logs, autoScroll },
    }));
  }, []);

  // Settings actions
  const setSettingsTab = useCallback((tab: string) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, activeTab: tab },
    }));
  }, []);

  // Global actions
  const clearAllState = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: DashboardStateContextType = {
    state,
    setExperimentFilters,
    setSelectedExperiment,
    setScenarioFilters,
    setScenarioGenerateForm,
    setExperimentForm,
    resetExperimentForm,
    setLogsFilters,
    setLogsAutoScroll,
    setSettingsTab,
    clearAllState,
  };

  return <DashboardStateContext.Provider value={value}>{children}</DashboardStateContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useDashboardState() {
  const context = useContext(DashboardStateContext);
  if (!context) {
    throw new Error('useDashboardState must be used within a DashboardStateProvider');
  }
  return context;
}

// Export individual hooks for convenience
export function useExperimentsState() {
  const { state, setExperimentFilters, setSelectedExperiment } = useDashboardState();
  return {
    ...state.experiments,
    setFilters: setExperimentFilters,
    setSelectedExperiment,
  };
}

export function useScenariosState() {
  const { state, setScenarioFilters, setScenarioGenerateForm } = useDashboardState();
  return {
    ...state.scenarios,
    setFilters: setScenarioFilters,
    setGenerateForm: setScenarioGenerateForm,
  };
}

export function useExperimentFormState() {
  const { state, setExperimentForm, resetExperimentForm } = useDashboardState();
  return {
    form: state.experimentForm,
    setForm: setExperimentForm,
    resetForm: resetExperimentForm,
  };
}

export function useLogsState() {
  const { state, setLogsFilters, setLogsAutoScroll } = useDashboardState();
  return {
    ...state.logs,
    setFilters: setLogsFilters,
    setAutoScroll: setLogsAutoScroll,
  };
}
