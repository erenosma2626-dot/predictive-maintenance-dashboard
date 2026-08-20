/**
 * Centralized API configuration.
 * Single source of truth for backend API base URL and endpoints.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

export const API_ENDPOINTS = {
  // Bearing Assistant
  BEARING_HEALTH: `${API_BASE_URL}/api/bearing/health`,
  BEARING_ASSETS: `${API_BASE_URL}/api/bearing/assets`,
  BEARING_FAULT_CATALOG: `${API_BASE_URL}/api/bearing/fault-catalog`,
  BEARING_CHAT: `${API_BASE_URL}/api/bearing/chat`,
  BEARING_VERIFY_SOLUTION: `${API_BASE_URL}/api/bearing/verify-solution`,
  BEARING_MANUAL_DISPATCH: `${API_BASE_URL}/api/bearing/manual-dispatch`,
  
  // Fleet Simulation & LangGraph Approvals
  SIMULATION_PAUSE: (dataset) => `${API_BASE_URL}/api/simulation/pause/${dataset}`,
  MANUAL_CREW_MODE: (dataset) => `${API_BASE_URL}/api/settings/manual-crew-mode/${dataset}`,
  PENDING_APPROVALS: (dataset) => `${API_BASE_URL}/pending-approvals/${dataset}`,
  APPROVE_DISPATCH: (dataset, approved) => `${API_BASE_URL}/approve-dispatch/${dataset}?approved=${approved}`,
  TRIGGER_MONTHLY_REPORT: `${API_BASE_URL}/trigger-monthly-report`,
};
