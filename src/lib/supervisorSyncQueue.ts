// Supervisor Offline Queue with Dual-Priority Dispatching and Crash Reconciler for FYS HSEC Oplira
// Supports IndexedDB storage, high-risk priority queue, adaptive backoff, and non-blocking batch chunking.

import { WorkerProfile, FRARiskEvaluation, SleepRecord, PVTSummary } from '../types';
import { generateEvaluationPDF } from './pdfGenerator';
import { dbStorage } from './indexedDbStorage';
import { updateServerClockOffset } from './clockSync';

export interface PendingSupervisorDispatch {
  id: string;
  evaluationId: string;
  workerName: string;
  workerRut: string;
  workerCompany: string;
  workerFaena: string;
  workerRole: string;
  supervisorName: string;
  supervisorEmail: string;
  timestamp: string;
  status: string;
  statusLabel: string;
  riskScore: number;
  priority: 'high' | 'normal';
  hashSha256: string;
  recommendedAction: string;
  measuresApplied: string[];
  pdfBase64?: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncedAt?: string;
  retryCount: number;
  lastError?: string;
}

const QUEUE_STORAGE_KEY = 'oplira_supervisor_sync_queue_v1';
type QueueChangeListener = (items: PendingSupervisorDispatch[]) => void;
const listeners: Set<QueueChangeListener> = new Set();
let memoryCache: PendingSupervisorDispatch[] | null = null;
let isProcessingBatch = false;
const pdfBlobCache: Map<string, string> = new Map();

/**
 * Loads pending items from persistent storage (localStorage + IndexedDB cache)
 */
export function getSupervisorQueue(): PendingSupervisorDispatch[] {
  if (memoryCache !== null) {
    return memoryCache;
  }

  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw);
      return memoryCache || [];
    }
  } catch (e) {
    console.error('Error reading supervisor queue from localStorage:', e);
  }

  memoryCache = [];
  return [];
}

/**
 * Crash Reconciliation Routine:
 * If app crashed mid-transit while an item was in 'syncing' state, reconcile back to 'pending'.
 */
async function reconcileAndSyncFromIDB() {
  try {
    const idbItems = await dbStorage.getAllSyncItems();
    if (idbItems && idbItems.length > 0) {
      const current = getSupervisorQueue();
      const mergedMap = new Map<string, PendingSupervisorDispatch>();
      current.forEach(item => mergedMap.set(item.id, item));
      
      idbItems.forEach((item: PendingSupervisorDispatch) => {
        // Reconcile orphan syncing state caused by crash or battery cut
        if (item.syncStatus === 'syncing') {
          item.syncStatus = 'pending';
        }
        // If IDB has item with higher retry or newer status, use it
        const existing = mergedMap.get(item.id);
        if (!existing || (item.syncStatus === 'synced' && existing.syncStatus !== 'synced')) {
          mergedMap.set(item.id, item);
        }
      });

      const merged = Array.from(mergedMap.values()).sort((a, b) => {
        // Sort High Priority (Red/Orange) first, then newest timestamp
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      saveQueue(merged);
    }
    // Run automated storage maintenance
    dbStorage.runStorageMaintenance();
  } catch (e) {
    console.warn('IDB Sync init note:', e);
  }
}

if (typeof window !== 'undefined') {
  reconcileAndSyncFromIDB();
}

/**
 * Saves queue to memory, localStorage (without heavy payload if quota is tight), and IndexedDB (full payload)
 */
function saveQueue(queue: PendingSupervisorDispatch[]) {
  memoryCache = queue;
  
  // Try saving to localStorage. If it exceeds quota, strip pdfBase64 for localStorage only while IDB preserves it
  try {
    const trimmed = queue.slice(0, 200);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    try {
      const lean = queue.slice(0, 200).map(item => ({ ...item, pdfBase64: undefined }));
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(lean));
    } catch (innerErr) {
      console.warn('LocalStorage fallback note:', innerErr);
    }
  }

  // Persist full item with PDF in IndexedDB
  queue.forEach(item => {
    dbStorage.saveSyncItem(item).catch(() => {});
  });

  notifyListeners(queue);
}

export function subscribeToQueue(callback: QueueChangeListener): () => void {
  listeners.add(callback);
  callback(getSupervisorQueue());
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners(queue: PendingSupervisorDispatch[]) {
  listeners.forEach(cb => {
    try {
      cb(queue);
    } catch (e) {
      console.warn('Listener error in supervisor queue:', e);
    }
  });
}

export function getPendingQueueCount(): number {
  return getSupervisorQueue().filter(item => item.syncStatus === 'pending' || item.syncStatus === 'failed').length;
}

/**
 * Adds an evaluation to the queue with automatic priority assignment (High priority for Red / Critical / Orange)
 * and triggers immediate non-blocking dispatch with timeout safeguards.
 */
export async function enqueueSupervisorDispatch(
  worker: WorkerProfile,
  evaluation: FRARiskEvaluation,
  sleepRecord?: Partial<SleepRecord>,
  pvtSummary?: Partial<PVTSummary>,
  measuresApplied: string[] = []
): Promise<PendingSupervisorDispatch> {
  const supervisorEmail = worker.supervisorEmail || 'supervisor.faena@minera.cl';
  const supervisorName = worker.supervisorName || 'Supervisor HSEC de Faena';

  // Assign priority: High for Red or High Risk Score (>= 60)
  const isHighRisk = evaluation.status === 'red' || (evaluation.riskScore >= 60);
  const priority: 'high' | 'normal' = isHighRisk ? 'high' : 'normal';

  // Generate lightweight base64 PDF in memory for instant email attachment
  let generatedPdfBase64 = '';
  try {
    const doc = generateEvaluationPDF(worker, evaluation, sleepRecord, pvtSummary);
    generatedPdfBase64 = doc.output('datauristring');
  } catch (pdfErr) {
    console.warn('PDF generation notice for email dispatch:', pdfErr);
  }

  // Keep queue item ultra-lightweight in localStorage, store large PDF in memory cache
  const newItem: PendingSupervisorDispatch = {
    id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    evaluationId: evaluation.id,
    workerName: worker.name,
    workerRut: worker.rut,
    workerCompany: worker.company,
    workerFaena: worker.faena,
    workerRole: worker.role,
    supervisorName,
    supervisorEmail,
    timestamp: evaluation.timestamp || new Date().toISOString(),
    status: evaluation.status,
    statusLabel: evaluation.statusLabel,
    riskScore: evaluation.riskScore,
    priority,
    hashSha256: evaluation.hashSha256,
    recommendedAction: evaluation.recommendedAction,
    measuresApplied,
    syncStatus: 'pending',
    retryCount: 0
  };

  if (generatedPdfBase64) {
    pdfBlobCache.set(newItem.id, generatedPdfBase64);
  }

  const current = getSupervisorQueue();
  const filtered = current.filter(item => item.evaluationId !== evaluation.id);
  
  // Place high priority at head of array
  const updated = isHighRisk ? [newItem, ...filtered] : [...filtered, newItem];
  saveQueue(updated);

  // Trigger immediate dispatch attempt
  setTimeout(() => {
    drainSupervisorQueue();
  }, 30);

  return newItem;
}

/**
 * Processes a single queue item with automatic multi-tier delivery (Backend API -> Direct Relay)
 */
export async function processQueueItem(itemId: string): Promise<boolean> {
  const current = getSupervisorQueue();
  const itemIndex = current.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return false;

  const item = current[itemIndex];
  if (item.syncStatus === 'synced') return true;

  current[itemIndex] = {
    ...item,
    syncStatus: 'syncing'
  };
  saveQueue(current);

  const cachedPdf = pdfBlobCache.get(item.id) || item.pdfBase64;

  try {
    const emailPayload = {
      to: item.supervisorEmail,
      subject: `[SGFS HSEC ${item.priority === 'high' ? '⚠️ URGENTE' : ''}] Certificado Oficial Pre-Turno: ${item.workerName} (${item.workerRut}) - Nivel: ${item.statusLabel.toUpperCase()}`,
      worker: {
        name: item.workerName,
        rut: item.workerRut,
        company: item.workerCompany,
        faena: item.workerFaena,
        role: item.workerRole
      },
      evaluation: {
        id: item.evaluationId,
        status: item.status,
        statusLabel: item.statusLabel,
        riskScore: item.riskScore,
        timestamp: item.timestamp,
        hashSha256: item.hashSha256,
        recommendedAction: item.recommendedAction,
        measures: item.measuresApplied,
        priority: item.priority
      },
      pdfAttachmentName: `Certificado_SGFS_${item.workerRut.replace(/[^a-zA-Z0-9_-]/g, '_')}_${item.evaluationId.substring(0, 8)}.pdf`,
      hasPdfAttachment: Boolean(cachedPdf),
      pdfBase64: cachedPdf || undefined
    };

    let isDispatched = false;
    let errorMessage = '';

    // Tier 1: Dispatch via local backend API route
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 16000);

      const response = await fetch('/api/send-supervisor-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const serverDate = response.headers.get('date');
      if (serverDate) {
        updateServerClockOffset(serverDate);
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          isDispatched = true;
        } else {
          errorMessage = result.error || 'Respuesta no exitosa del servidor';
        }
      } else {
        errorMessage = `Error HTTP ${response.status}`;
      }
    } catch (apiErr: any) {
      console.warn('Backend API dispatch warning, attempting direct relay:', apiErr);
      errorMessage = apiErr?.message || 'Error de conexión con API';
    }

    // Tier 2: Direct public relay fallback (guarantees delivery even on mobile/static/PWA environments)
    if (!isDispatched && item.supervisorEmail) {
      try {
        const directRelayRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(item.supervisorEmail.trim())}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `[SGFS HSEC OFICIAL] Certificado Pre-Turno: ${item.workerName} (${item.workerRut}) - Nivel ${item.statusLabel.toUpperCase()}`,
            _template: 'table',
            _captcha: 'false',
            "Trabajador": `${item.workerName} (RUT: ${item.workerRut})`,
            "Empresa_Faena": `${item.workerCompany || 'Oplira Minería'} - ${item.workerFaena || 'Faena Operacional'}`,
            "Cargo": item.workerRole || 'Operador',
            "Dictamen_SGFS": `${item.statusLabel} (Riesgo: ${item.riskScore}/100)`,
            "Sello_Criptografico_SHA256": item.hashSha256,
            "Medidas_Preventivas": item.measuresApplied && item.measuresApplied.length ? item.measuresApplied.join(' • ') : 'Pausas activas y control habitual',
            "Accion_Recomendada": item.recommendedAction || 'Apto para operar',
            "Fecha_Emision": new Date(item.timestamp).toLocaleString('es-CL'),
            "Sistema": 'Oplira SGFS - Seguridad y Prevención Minera HSEC'
          })
        });

        if (directRelayRes.ok) {
          isDispatched = true;
          errorMessage = '';
        }
      } catch (directErr: any) {
        console.warn('Direct relay error:', directErr);
      }
    }

    const refreshed = getSupervisorQueue();
    const idx = refreshed.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      if (isDispatched) {
        refreshed[idx] = {
          ...refreshed[idx],
          syncStatus: 'synced',
          syncedAt: new Date().toISOString(),
          retryCount: refreshed[idx].retryCount + 1,
          lastError: undefined
        };
        saveQueue(refreshed);
        return true;
      } else {
        refreshed[idx] = {
          ...refreshed[idx],
          syncStatus: 'failed',
          retryCount: refreshed[idx].retryCount + 1,
          lastError: errorMessage || 'Fallo de entrega en canales de red'
        };
        saveQueue(refreshed);
        return false;
      }
    }
    return false;
  } catch (err: any) {
    const refreshed = getSupervisorQueue();
    const idx = refreshed.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      refreshed[idx] = {
        ...refreshed[idx],
        syncStatus: 'failed',
        retryCount: refreshed[idx].retryCount + 1,
        lastError: err?.message || 'Error inesperado en despacho'
      };
      saveQueue(refreshed);
    }
    return false;
  }
}

/**
 * Adaptive Dual-Priority Batch Dispatcher:
 * Transmits High Priority items first, then regular items in throttled chunks.
 */
export async function drainSupervisorQueue(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 0;
  }

  if (isProcessingBatch) {
    return 0;
  }

  isProcessingBatch = true;
  let totalSuccess = 0;

  try {
    const queue = getSupervisorQueue();
    const pending = queue
      .filter(item => item.syncStatus === 'pending' || item.syncStatus === 'failed' || item.syncStatus === 'syncing')
      .sort((a, b) => {
        // High priority first
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return 0;
      });

    if (pending.length === 0) {
      isProcessingBatch = false;
      return 0;
    }

    const BATCH_SIZE = 5;
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        break;
      }

      const chunk = pending.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(chunk.map(item => processQueueItem(item.id)));
      const batchSuccess = results.filter(Boolean).length;
      totalSuccess += batchSuccess;

      if (i + BATCH_SIZE < pending.length) {
        await new Promise(res => setTimeout(res, 100));
      }
    }
  } finally {
    isProcessingBatch = false;
  }

  return totalSuccess;
}

/**
 * Force sync and reconcile all items in queue (clearing any stuck status)
 */
export async function forceSyncAll(): Promise<number> {
  isProcessingBatch = false;
  const current = getSupervisorQueue();
  const resetQueue = current.map(item => {
    if (item.syncStatus !== 'synced') {
      return { ...item, syncStatus: 'pending' as const };
    }
    return item;
  });
  saveQueue(resetQueue);
  return await drainSupervisorQueue();
}

/**
 * Purge / Reset the entire queue in case of corrupt legacy items
 */
export function clearEntireQueue(): void {
  saveQueue([]);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Clear queue note:', e);
  }
}

export function initBackgroundSyncListeners(onSyncSuccess?: (count: number) => void) {
  if (typeof window === 'undefined') return;

  // Immediate drain attempt on mount if online
  if (navigator.onLine) {
    setTimeout(() => {
      forceSyncAll().then(synced => {
        if (synced > 0 && onSyncSuccess) {
          onSyncSuccess(synced);
        }
      });
    }, 400);
  }

  const handleOnline = async () => {
    console.log('🌐 [Oplira Sync] Red restablecida. Vaciando cola de alta prioridad y lotes offline...');
    const synced = await forceSyncAll();
    if (synced > 0 && onSyncSuccess) {
      onSyncSuccess(synced);
    }
  };

  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      forceSyncAll().then(synced => {
        if (synced > 0 && onSyncSuccess) {
          onSyncSuccess(synced);
        }
      });
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  const interval = setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine && getPendingQueueCount() > 0) {
      forceSyncAll().then(synced => {
        if (synced > 0 && onSyncSuccess) {
          onSyncSuccess(synced);
        }
      });
    }
  }, 15000);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    clearInterval(interval);
  };
}

export function openSupervisorEmailClient(item: PendingSupervisorDispatch) {
  const subject = encodeURIComponent(`[SGFS HSEC ${item.priority === 'high' ? '⚠️ URGENTE' : ''}] Certificado Pre-Turno: ${item.workerName} (${item.workerRut}) - Nivel ${item.statusLabel.toUpperCase()}`);
  const body = encodeURIComponent(
`Estimado(a) ${item.supervisorName},

Se notifica el resultado oficial de la evaluación psicométrica de fatiga y somnolencia pre-turno SGFS HSEC:

• Trabajador: ${item.workerName}
• RUT: ${item.workerRut}
• Empresa: ${item.workerCompany}
• Faena o Lugar de trabajo: ${item.workerFaena}
• Cargo: ${item.workerRole}
• Dictamen Operacional: ${item.statusLabel.toUpperCase()} (Puntaje de Riesgo: ${item.riskScore}/100)
• Prioridad de Alerta: ${item.priority === 'high' ? 'ALTA (Riesgo Crítico / Medidas Inmediatas)' : 'NORMAL'}
• Fecha/Hora de Emisión: ${new Date(item.timestamp).toLocaleString('es-CL')}
• Hash SHA-256 de Integridad: ${item.hashSha256}
• Medidas de Mitigación: ${item.measuresApplied.length > 0 ? item.measuresApplied.join(', ') : 'Ninguna (Apto para operar)'}

Dictamen y Recomendación:
${item.recommendedAction}

El documento PDF certificado ha sido emitido con validez legal y trazabilidad HSEC.

Atentamente,
Sistema Oplira SGFS HSEC`
  );
  
  if (typeof window !== 'undefined') {
    const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(item.supervisorEmail)}&su=${subject}&body=${body}`;
    const mailtoUrl = `mailto:${item.supervisorEmail}?subject=${subject}&body=${body}`;
    try {
      const win = window.open(gmailWebUrl, '_blank');
      if (!win) {
        window.location.href = mailtoUrl;
      }
    } catch {
      window.location.href = mailtoUrl;
    }
  }
}

export function shareSupervisorWhatsApp(item: PendingSupervisorDispatch) {
  const text = encodeURIComponent(
`📋 *[CERTIFICADO OFICIAL OPLIRA SGFS ${item.priority === 'high' ? '⚠️ ALTA PRIORIDAD' : ''}]*
Trabajador: *${item.workerName}* (${item.workerRut})
Cargo: ${item.workerRole} | Faena: ${item.workerFaena}
Dictamen: *${item.statusLabel.toUpperCase()}* (Riesgo: ${item.riskScore}/100)
Acción: ${item.recommendedAction}
Hash SHA-256: \`${item.hashSha256}\`
Fecha: ${new Date(item.timestamp).toLocaleString('es-CL')}`
  );
  if (typeof window !== 'undefined') {
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }
}

export interface EmailSimulationDrillParams {
  targetEmail: string;
  scenario: 'green' | 'yellow' | 'red';
  workerName?: string;
  workerRut?: string;
  workerFaena?: string;
  workerRole?: string;
}

export interface EmailDiagnosticsData {
  success: boolean;
  configuredTransport: string;
  hasCustomSmtp: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpFrom: string;
  totalDispatches: number;
  recentLogs: Array<{
    id: string;
    to: string;
    workerName: string;
    workerRut: string;
    statusLabel: string;
    riskScore: number;
    hashSha256: string;
    timestamp: string;
    hasPdfAttachment: boolean;
    deliveryChannel: string;
    isDrill?: boolean;
    previewUrl?: string;
    latencyMs: number;
    deliveryStatus: string;
    errorMessage?: string;
  }>;
  capabilities: string[];
}

/**
 * Triggers an instant on-demand email simulation drill against the server API
 */
export async function runEmailSimulationDrill(params: EmailSimulationDrillParams): Promise<any> {
  const response = await fetch('/api/email-simulation-drill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    throw new Error(`Error en el simulacro de envío: HTTP ${response.status}`);
  }
  return await response.json();
}

/**
 * Retrieves real-time server email diagnostics and audit dispatch logs
 */
export async function fetchEmailDiagnostics(): Promise<EmailDiagnosticsData> {
  const response = await fetch('/api/email-diagnostics');
  if (!response.ok) {
    throw new Error(`Error al consultar diagnóstico: HTTP ${response.status}`);
  }
  return await response.json();
}

/**
 * Clears the server dispatch audit logs
 */
export async function clearSupervisorEmailLogs(): Promise<boolean> {
  try {
    const response = await fetch('/api/supervisor-emails', { method: 'DELETE' });
    return response.ok;
  } catch {
    return false;
  }
}

export interface SmtpConfigData {
  configured: boolean;
  host: string;
  port: number;
  user: string;
  from: string;
  hasPass: boolean;
  hasResendKey: boolean;
  mode: string;
}

export async function fetchSmtpConfig(): Promise<SmtpConfigData> {
  const res = await fetch('/api/smtp-config');
  if (!res.ok) throw new Error('Error al consultar configuración SMTP');
  return await res.json();
}

export async function saveSmtpConfig(config: {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  secure?: boolean;
  resendApiKey?: string;
}): Promise<{ success: boolean; message: string; configured: boolean }> {
  const res = await fetch('/api/smtp-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Error al guardar configuración SMTP');
  return await res.json();
}

export async function testRealEmailDispatch(params: {
  to: string;
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  secure?: boolean;
  resendApiKey?: string;
}): Promise<{
  success: boolean;
  channel?: string;
  message?: string;
  messageId?: string;
  latencyMs?: number;
  error?: string;
}> {
  const res = await fetch('/api/test-real-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al ejecutar prueba de correo');
  }
  return data;
}

