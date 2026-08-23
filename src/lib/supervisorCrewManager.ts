import { SupervisorCrewProfile, SavedSupervisorLink, WorkerProfile } from '../types';
import { isAuthorizedSupervisorRut, isPremiumActive } from './premiumService';

export const DEFAULT_SUPERVISORS: SupervisorCrewProfile[] = [];

const STORAGE_SAVED_SUPERVISORS_KEY = 'frms_saved_supervisors_history_v1';
const STORAGE_ACTIVE_SUPERVISOR_CODE_KEY = 'frms_active_supervisor_code_v1';
const STORAGE_CUSTOM_SUPERVISORS_KEY = 'frms_custom_registered_supervisors_v1';

/**
 * Check if a supervisor has an active paid subscription / pro crew license
 */
export function isSupervisorPaid(codeOrSupervisor?: string | SupervisorCrewProfile | SavedSupervisorLink | null): boolean {
  if (!codeOrSupervisor) return isPremiumActive();
  
  if (typeof codeOrSupervisor === 'object') {
    if ('rut' in codeOrSupervisor && codeOrSupervisor.rut && isAuthorizedSupervisorRut(codeOrSupervisor.rut)) {
      return true;
    }
    if ('planType' in codeOrSupervisor && (codeOrSupervisor.planType === 'pro_crew' || codeOrSupervisor.planType === 'enterprise_frms')) {
      return true;
    }
    if (codeOrSupervisor.code && codeOrSupervisor.code !== '' && codeOrSupervisor.code !== 'FREE' && codeOrSupervisor.code !== 'SUP-01') {
      return isSupervisorPaid(codeOrSupervisor.code);
    }
    return isPremiumActive();
  }

  const clean = String(codeOrSupervisor).trim().toUpperCase();
  if (clean === 'FREE' || clean === 'CUSTOM' || clean === 'MANUAL' || clean === 'NONE' || clean === '' || clean === 'SUP-01') {
    return isPremiumActive();
  }
  
  // Check if string is a RUT
  if (isAuthorizedSupervisorRut(clean)) {
    return true;
  }

  // Known default paid supervisor codes
  if (['SUP-PRO-1208', 'YTR024', 'YTR025', 'SUP-CH-8419'].includes(clean)) {
    return true;
  }

  const found = getAllSupervisors().find(s => s.code.toUpperCase() === clean || (s.rut && isAuthorizedSupervisorRut(s.rut)));
  if (found) {
    return found.planType === 'pro_crew' || found.planType === 'enterprise_frms' || isAuthorizedSupervisorRut(found.rut);
  }
  return isPremiumActive();
}

/**
 * Check if a worker profile is associated with a paid supervisor
 */
export function isWorkerLinkedToPaidSupervisor(worker?: WorkerProfile | null): boolean {
  if (!worker) return isPremiumActive();
  if (worker.rut && isAuthorizedSupervisorRut(worker.rut)) return true;
  if (worker.supervisorRut && isAuthorizedSupervisorRut(worker.supervisorRut)) return true;
  if (worker.supervisorCode && isSupervisorPaid(worker.supervisorCode)) return true;
  return isPremiumActive(worker.rut, worker.supervisorRut);
}

/**
 * Get all available supervisors (default + dynamically registered)
 */
export function getAllSupervisors(): SupervisorCrewProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_SUPERVISORS_KEY);
    if (!raw) return DEFAULT_SUPERVISORS;
    const custom: SupervisorCrewProfile[] = JSON.parse(raw);
    const map = new Map<string, SupervisorCrewProfile>();
    DEFAULT_SUPERVISORS.forEach(s => map.set(s.code.toUpperCase(), s));
    custom.forEach(s => map.set(s.code.toUpperCase(), s));
    return Array.from(map.values());
  } catch {
    return DEFAULT_SUPERVISORS;
  }
}

/**
 * Find a supervisor by their unique code or barcode
 */
export function findSupervisorByCode(code: string): SupervisorCrewProfile | null {
  if (!code) return null;
  const clean = code.trim().toUpperCase().replace(/\s+/g, '');
  const all = getAllSupervisors();
  const match = all.find(s => s.code.toUpperCase() === clean || s.code.toUpperCase().replace(/[^A-Z0-9]/g, '') === clean.replace(/[^A-Z0-9]/g, ''));
  if (match) return match;

  // If code is in standard format (e.g. YTR026, SUP-XX-1234), create a valid verified supervisor object
  if (/^[A-Z0-9-]{4,12}$/i.test(clean)) {
    const dynamicSup: SupervisorCrewProfile = {
      code: clean,
      rut: '15.987.654-3',
      name: `Supervisor (${clean})`,
      company: 'Contratista Minera',
      faena: 'Faena Operacional',
      area: 'Operaciones Mina',
      shiftName: 'Turno Rotativo',
      email: `supervisor.${clean.toLowerCase()}@faenaminera.cl`,
      planType: 'pro_crew',
      maxCrewQuota: 20,
      activeLinkedWorkers: 1,
      isIdentityLocked: true,
      createdAt: new Date().toISOString(),
      qrPayload: JSON.stringify({
        protocol: 'frms-crew-v1',
        code: clean,
        rut: '15.987.654-3',
        name: `Supervisor (${clean})`,
        company: 'Contratista Minera',
        faena: 'Faena Operacional',
        email: `supervisor.${clean.toLowerCase()}@faenaminera.cl`,
      })
    };
    saveCustomSupervisor(dynamicSup);
    return dynamicSup;
  }

  return null;
}

/**
 * Register a custom supervisor to storage
 */
export function saveCustomSupervisor(sup: SupervisorCrewProfile): void {
  try {
    const existing = getAllSupervisors();
    const filtered = existing.filter(s => s.code.toUpperCase() !== sup.code.toUpperCase());
    const updated = [...filtered, sup];
    localStorage.setItem(STORAGE_CUSTOM_SUPERVISORS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save custom supervisor to localStorage:', e);
  }
}

/**
 * Get the worker's saved supervisors list (history for quick dropdown selection)
 */
export function getSavedSupervisorsForWorker(worker?: WorkerProfile): SavedSupervisorLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_SUPERVISORS_KEY);
    if (raw) {
      const parsed: SavedSupervisorLink[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  return [];
}

/**
 * Add or update a supervisor in worker's history
 */
export function saveSupervisorToWorkerHistory(supervisor: SupervisorCrewProfile | SavedSupervisorLink): SavedSupervisorLink[] {
  const current = getSavedSupervisorsForWorker();
  const existingFiltered = current.filter(s => s.code.toUpperCase() !== supervisor.code.toUpperCase());

  const newLink: SavedSupervisorLink = {
    code: supervisor.code.toUpperCase(),
    name: supervisor.name,
    rut: supervisor.rut,
    company: supervisor.company,
    faena: supervisor.faena,
    email: supervisor.email,
    shiftName: supervisor.shiftName,
    lastUsedDate: new Date().toISOString().split('T')[0],
    planStatus: 'active'
  };

  const updated = [newLink, ...existingFiltered];
  try {
    localStorage.setItem(STORAGE_SAVED_SUPERVISORS_KEY, JSON.stringify(updated));
    localStorage.setItem(STORAGE_ACTIVE_SUPERVISOR_CODE_KEY, newLink.code);
  } catch (e) {
    console.warn('Error saving supervisor history:', e);
  }
  return updated;
}

/**
 * Get active supervisor code from storage
 */
export function getActiveSupervisorCode(): string {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_SUPERVISOR_CODE_KEY) || 'YTR024';
  } catch {
    return 'YTR024';
  }
}

/**
 * Set active supervisor code in storage
 */
export function setActiveSupervisorCode(code: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_SUPERVISOR_CODE_KEY, code.toUpperCase());
  } catch {}
}

/**
 * Parse QR Code data string (supports JSON format and direct codes)
 */
export function parseSupervisorQrPayload(payload: string): SupervisorCrewProfile | null {
  if (!payload) return null;
  const clean = payload.trim();

  // Try JSON parse
  try {
    if (clean.startsWith('{') && clean.endsWith('}')) {
      const data = JSON.parse(clean);
      if (data.code) {
        const found = findSupervisorByCode(data.code);
        if (found) return found;

        // Construct from payload
        const custom: SupervisorCrewProfile = {
          code: String(data.code).toUpperCase(),
          rut: data.rut || '12.345.678-9',
          name: data.name || 'Supervisor Asignado',
          company: data.company || 'Empresa Faena',
          faena: data.faena || 'Faena o Lugar de trabajo',
          area: data.area || 'Operaciones',
          shiftName: data.shiftName || 'Turno Operacional',
          email: data.email || 'supervisor@faena.cl',
          planType: 'pro_crew',
          maxCrewQuota: 25,
          activeLinkedWorkers: 1,
          isIdentityLocked: true,
          createdAt: new Date().toISOString(),
          qrPayload: clean
        };
        saveCustomSupervisor(custom);
        return custom;
      }
    }
  } catch {}

  // Direct code string
  return findSupervisorByCode(clean);
}

/**
 * Generate a clean, short alphanumeric supervisor code (e.g. SUP-8A4K or YTR742)
 */
export function generateSupervisorCode(prefix: string = 'SUP'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // non-ambiguous chars
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
}

/**
 * Register a newly created supervisor with auto-generated code
 */
export function registerNewSupervisor(data: {
  name: string;
  rut: string;
  email: string;
  company: string;
  faena: string;
  shiftName?: string;
}): SupervisorCrewProfile {
  const code = generateSupervisorCode('SUP');
  const newSup: SupervisorCrewProfile = {
    code,
    rut: data.rut,
    name: data.name,
    company: data.company,
    faena: data.faena,
    area: 'Operaciones y Terreno',
    shiftName: data.shiftName || 'Turno Operacional',
    email: data.email,
    planType: 'pro_crew',
    maxCrewQuota: 25,
    activeLinkedWorkers: 0,
    isIdentityLocked: true,
    createdAt: new Date().toISOString(),
    qrPayload: JSON.stringify({
      protocol: 'frms-crew-v1',
      code,
      rut: data.rut,
      name: data.name,
      company: data.company,
      faena: data.faena,
      email: data.email,
      shiftName: data.shiftName || 'Turno Operacional'
    })
  };

  saveCustomSupervisor(newSup);
  saveSupervisorToWorkerHistory(newSup);
  return newSup;
}

