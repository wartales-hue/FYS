// Supervisor Offline Queue and Automatic Email/PDF Dispatcher for FYS HSEC Oplira

import { WorkerProfile, FRARiskEvaluation, SleepRecord, PVTSummary } from '../types';
import { generateEvaluationPDF } from './pdfGenerator';

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

/**
 * Loads pending items from persistent localStorage
 */
export function getSupervisorQueue(): PendingSupervisorDispatch[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading supervisor queue:', e);
  }
  return [];
}

/**
 * Saves queue to storage and notifies subscribers
 */
function saveQueue(queue: PendingSupervisorDispatch[]) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    notifyListeners(queue);
  } catch (e) {
    console.error('Error saving supervisor queue:', e);
  }
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

/**
 * Returns number of pending (unsynced) transmissions
 */
export function getPendingQueueCount(): number {
  return getSupervisorQueue().filter(item => item.syncStatus === 'pending' || item.syncStatus === 'failed').length;
}

/**
 * Adds an evaluation to the supervisor queue and attempts immediate transmission if online
 */
export async function enqueueSupervisorDispatch(
  worker: WorkerProfile,
  evaluation: FRARiskEvaluation,
  sleepRecord?: Partial<SleepRecord>,
  pvtSummary?: Partial<PVTSummary>,
  measuresApplied: string[] = []
): Promise<PendingSupervisorDispatch> {
  const supervisorEmail = worker.supervisorEmail || 'supervisor.faena@minera.cl';
  const supervisorName = worker.supervisorName || 'Carlos Henríquez (Supervisor HSEC)';

  // Generate Base64 PDF data for payload
  let pdfBase64 = '';
  try {
    const doc = generateEvaluationPDF(worker, evaluation, sleepRecord, pvtSummary);
    pdfBase64 = doc.output('datauristring');
  } catch (e) {
    console.warn('Could not generate base64 PDF for queue:', e);
  }

  const newItem: PendingSupervisorDispatch = {
    id: `disp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
    hashSha256: evaluation.hashSha256,
    recommendedAction: evaluation.recommendedAction,
    measuresApplied,
    pdfBase64,
    syncStatus: 'pending',
    retryCount: 0
  };

  const current = getSupervisorQueue();
  // Filter out older duplicate if re-evaluated
  const filtered = current.filter(item => item.evaluationId !== evaluation.id);
  const updated = [newItem, ...filtered];
  saveQueue(updated);

  // If device is currently online, attempt immediate background dispatch
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    processQueueItem(newItem.id);
  }

  return newItem;
}

/**
 * Processes a single queue item (dispatches to supervisor)
 */
async function processQueueItem(itemId: string): Promise<boolean> {
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

  try {
    // Construct rich email report payload
    const emailPayload = {
      to: item.supervisorEmail,
      subject: `[HSEC OPLIRA FYS] Certificado Oficial Pre-Turno: ${item.workerName} (${item.workerRut}) - Nivel: ${item.statusLabel.toUpperCase()}`,
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
        measures: item.measuresApplied
      },
      pdfAttachmentName: `Certificado_FYS_${item.workerRut}_${item.evaluationId}.pdf`,
      hasPdfAttachment: Boolean(item.pdfBase64)
    };

    // Real backend API dispatch with fallback resilience
    let isDispatched = false;
    let errorMessage = '';

    try {
      const response = await fetch('/api/send-supervisor-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          isDispatched = true;
        } else {
          errorMessage = result.error || 'Respuesta no exitosa del servidor';
        }
      } else {
        errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (networkErr: any) {
      // Offline or network unreachable - item will stay in offline queue
      errorMessage = networkErr?.message || 'Sin conexión a la red de despacho';
      console.warn('📡 [Oplira Dispatch] Modo offline o servidor no alcanzable temporalmente:', errorMessage);
    }

    if (isDispatched) {
      console.log('✅ [Supervisor Email Dispatcher] Transmisión exitosa al supervisor:', {
        to: item.supervisorEmail,
        worker: item.workerName,
        hash: item.hashSha256,
        timestamp: new Date().toISOString()
      });

      const refreshed = getSupervisorQueue();
      const idx = refreshed.findIndex(i => i.id === itemId);
      if (idx !== -1) {
        refreshed[idx] = {
          ...refreshed[idx],
          syncStatus: 'synced',
          syncedAt: new Date().toISOString(),
          retryCount: refreshed[idx].retryCount + 1,
          lastError: undefined
        };
        saveQueue(refreshed);
      }
      return true;
    } else {
      // Save as failed/pending for background automatic retry when online
      const refreshed = getSupervisorQueue();
      const idx = refreshed.findIndex(i => i.id === itemId);
      if (idx !== -1) {
        refreshed[idx] = {
          ...refreshed[idx],
          syncStatus: 'failed',
          retryCount: refreshed[idx].retryCount + 1,
          lastError: errorMessage
        };
        saveQueue(refreshed);
      }
      return false;
    }
  } catch (err: any) {
    console.error('Failed to dispatch supervisor email:', err);
    const refreshed = getSupervisorQueue();
    const idx = refreshed.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      refreshed[idx] = {
        ...refreshed[idx],
        syncStatus: 'failed',
        retryCount: refreshed[idx].retryCount + 1,
        lastError: err?.message || 'Error de conexión'
      };
      saveQueue(refreshed);
    }
    return false;
  }
}

/**
 * Drains and syncs all pending items in queue
 */
export async function drainSupervisorQueue(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 0;
  }

  const queue = getSupervisorQueue();
  const pending = queue.filter(item => item.syncStatus === 'pending' || item.syncStatus === 'failed');
  if (pending.length === 0) return 0;

  let successCount = 0;
  for (const item of pending) {
    const ok = await processQueueItem(item.id);
    if (ok) successCount++;
  }

  return successCount;
}

/**
 * Initializes automatic background listeners for network recovery
 */
export function initBackgroundSyncListeners(onSyncSuccess?: (count: number) => void) {
  if (typeof window === 'undefined') return;

  const handleOnline = async () => {
    console.log('🌐 Conexión a internet restablecida. Iniciando vaciado automático de cola offline...');
    const synced = await drainSupervisorQueue();
    if (synced > 0 && onSyncSuccess) {
      onSyncSuccess(synced);
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('focus', () => {
    if (navigator.onLine) {
      drainSupervisorQueue();
    }
  });

  // Periodic retry loop every 30 seconds
  const interval = setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine && getPendingQueueCount() > 0) {
      drainSupervisorQueue().then(synced => {
        if (synced > 0 && onSyncSuccess) {
          onSyncSuccess(synced);
        }
      });
    }
  }, 30000);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(interval);
  };
}

/**
 * Opens device's native Email client (Gmail, Outlook, etc.) with pre-filled report
 */
export function openSupervisorEmailClient(item: PendingSupervisorDispatch) {
  const subject = encodeURIComponent(`[HSEC OPLIRA FYS] Certificado Pre-Turno: ${item.workerName} (${item.workerRut}) - Nivel ${item.statusLabel.toUpperCase()}`);
  const body = encodeURIComponent(
`Estimado(a) ${item.supervisorName},

Se notifica el resultado oficial de la evaluación psicométrica de fatiga y somnolencia pre-turno FYS HSEC:

• Trabajador: ${item.workerName}
• RUT: ${item.workerRut}
• Empresa: ${item.workerCompany}
• Faena: ${item.workerFaena}
• Cargo: ${item.workerRole}
• Dictamen Operacional: ${item.statusLabel.toUpperCase()} (Puntaje de Riesgo: ${item.riskScore}/100)
• Fecha/Hora de Emisión: ${new Date(item.timestamp).toLocaleString('es-CL')}
• Hash SHA-256 de Integridad: ${item.hashSha256}
• Medidas de Mitigación: ${item.measuresApplied.length > 0 ? item.measuresApplied.join(', ') : 'Ninguna (Apto para operar)'}

Dictamen y Recomendación:
${item.recommendedAction}

El documento PDF certificado ha sido emitido con validez legal y trazabilidad HSEC.

Atentamente,
Sistema Oplira FYS HSEC`
  );
  
  if (typeof window !== 'undefined') {
    window.location.href = `mailto:${item.supervisorEmail}?subject=${subject}&body=${body}`;
  }
}

/**
 * Direct WhatsApp dispatch for field supervisors
 */
export function shareSupervisorWhatsApp(item: PendingSupervisorDispatch) {
  const text = encodeURIComponent(
`📋 *[CERTIFICADO OFICIAL OPLIRA FYS]*
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
