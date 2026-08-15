// Offline-First Store and State Manager for FRA-HSEC

import { 
  WorkerProfile, 
  FRARiskEvaluation, 
  InterventionRecord, 
  StopBangRecord, 
  UserRole 
} from '../types';
import { 
  MOCK_WORKERS, 
  MOCK_EVALUATIONS, 
  MOCK_INTERVENTIONS, 
  MOCK_STOP_BANG 
} from './mockData';

export interface OfflineState {
  currentRole: UserRole;
  selectedWorkerId: string;
  isOnline: boolean;
  isVehicleMoving: boolean; // Operational safety lock
  pendingSyncCount: number;
  workers: WorkerProfile[];
  evaluations: FRARiskEvaluation[];
  interventions: InterventionRecord[];
  stopBangRecords: StopBangRecord[];
}

const STORAGE_KEY = 'fra_hsec_state_v2';

export function loadInitialState(): OfflineState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        workers: parsed.workers && parsed.workers.length > 0 ? parsed.workers : MOCK_WORKERS,
        isOnline: navigator.onLine,
        isVehicleMoving: false // default stopped for safety
      };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }

  return {
    currentRole: 'worker',
    selectedWorkerId: MOCK_WORKERS[0].id,
    isOnline: navigator.onLine,
    isVehicleMoving: false,
    pendingSyncCount: 0,
    workers: MOCK_WORKERS,
    evaluations: MOCK_EVALUATIONS,
    interventions: MOCK_INTERVENTIONS,
    stopBangRecords: MOCK_STOP_BANG
  };
}

export function saveStateToStorage(state: OfflineState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}
