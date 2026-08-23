// Offline-First Store and State Manager for FRA-HSEC

import { 
  WorkerProfile, 
  FRARiskEvaluation, 
  InterventionRecord, 
  UserRole 
} from '../types';
import { 
  DEFAULT_EMPTY_WORKER,
  MOCK_WORKERS, 
  MOCK_EVALUATIONS, 
  MOCK_INTERVENTIONS 
} from './mockData';
import { getPendingQueueCount } from './supervisorSyncQueue';

export interface OfflineState {
  currentRole: UserRole;
  selectedWorkerId: string;
  isOnline: boolean;
  isVehicleMoving: boolean; // Operational safety lock
  pendingSyncCount: number;
  workers: WorkerProfile[];
  evaluations: FRARiskEvaluation[];
  interventions: InterventionRecord[];
}

const STORAGE_KEY = 'fra_hsec_clean_v8';

export function createCleanZeroState(): OfflineState {
  return {
    currentRole: 'worker',
    selectedWorkerId: DEFAULT_EMPTY_WORKER.id,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isVehicleMoving: false,
    pendingSyncCount: 0,
    workers: [DEFAULT_EMPTY_WORKER],
    evaluations: [],
    interventions: []
  };
}

export function loadInitialState(): OfflineState {
  try {
    // Clean up all older legacy storage keys to guarantee fresh start from scratch
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('fra_hsec_clean_v7');
      localStorage.removeItem('fra_hsec_clean_v6');
      localStorage.removeItem('fra_hsec_clean_v5');
      localStorage.removeItem('fra_hsec_clean_v4');
      localStorage.removeItem('fra_hsec_clean_v3');
      localStorage.removeItem('fra_hsec_clean_v2');
      localStorage.removeItem('fra_hsec_clean_v1');
      localStorage.removeItem('fra_hsec_state_v2');
      localStorage.removeItem('fra_hsec_state_v1');
      localStorage.removeItem('fra_hsec_state');
      localStorage.removeItem('fys_last_evaluation_inputs');
      localStorage.removeItem('fys_current_worker_id');
      localStorage.removeItem('fys_profile_w-default');
      localStorage.removeItem('fys_legal_consent_v1');
      localStorage.removeItem('fys_legal_consent_details');
      localStorage.removeItem('pdf_evaluation_counter');
      localStorage.removeItem('fys_active_subscription');
      localStorage.removeItem('fys_offline_checkins');
      localStorage.removeItem('frms_google_play_premium_v1');
      localStorage.removeItem('frms_premium_registered_rut_v1');
      localStorage.removeItem('frms_premium_active_session_v1');
    }

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        workers: parsed.workers && parsed.workers.length > 0 ? parsed.workers : [DEFAULT_EMPTY_WORKER],
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isVehicleMoving: false, // default stopped for safety
        pendingSyncCount: getPendingQueueCount()
      };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }

  return createCleanZeroState();
}

export function resetAllDataToZero(): OfflineState {
  clearStoredState();
  const cleanState = createCleanZeroState();
  saveStateToStorage(cleanState);
  return cleanState;
}

export function clearStoredState(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  } catch (e) {
    console.error('Failed to clear stored state', e);
  }
}

export function saveStateToStorage(state: OfflineState): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}

