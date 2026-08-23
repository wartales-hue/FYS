/**
 * Time Sync and Clock Drift Detector for Oplira FYS HSEC
 * Prevents intentional or accidental device clock tampering.
 * Protects legal validity of WOCL (02:00 - 06:00) circadian risk windows and SHA-256 integrity.
 */

export interface ClockSyncStatus {
  isClockTrusted: boolean;
  driftSeconds: number;
  serverTimestampUtc?: string;
  deviceTimestampUtc: string;
  source: 'server_ntp' | 'monotonic_estimated' | 'device_only';
  warningMessage?: string;
}

let serverTimeDeltaMs = 0;
let hasSyncedWithServer = false;
let monotonicBootTime = 0;
let bootWallTime = 0;

if (typeof window !== 'undefined') {
  monotonicBootTime = performance.now();
  bootWallTime = Date.now();
}

/**
 * Updates the clock delta after any successful API ping/response
 */
export function updateServerClockOffset(serverDateHeader: string | number) {
  try {
    const serverMs = typeof serverDateHeader === 'number' ? serverDateHeader : new Date(serverDateHeader).getTime();
    if (!isNaN(serverMs)) {
      const currentDeviceMs = Date.now();
      serverTimeDeltaMs = serverMs - currentDeviceMs;
      hasSyncedWithServer = true;
      console.log(`⏱️ [Clock Sync] Delta con servidor establecido: ${Math.round(serverTimeDeltaMs / 1000)}s`);
    }
  } catch (e) {
    console.warn('Clock sync update note:', e);
  }
}

/**
 * Fetches server time via lightweight head request
 */
export async function syncClockWithBackend(): Promise<ClockSyncStatus> {
  const deviceNow = Date.now();
  
  try {
    const startPing = performance.now();
    const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
    const endPing = performance.now();
    const rtt = endPing - startPing;

    if (res.ok) {
      const serverDateHeader = res.headers.get('date');
      let serverMs = serverDateHeader ? new Date(serverDateHeader).getTime() : 0;
      
      // If header not present, try parsing JSON response if it includes timestamp
      if (!serverMs) {
        try {
          const json = await res.json();
          if (json.timestamp) serverMs = new Date(json.timestamp).getTime();
        } catch {
          // ignore
        }
      }

      if (serverMs) {
        // Compensate for half-roundtrip latency
        const compensatedServerMs = serverMs + Math.round(rtt / 2);
        serverTimeDeltaMs = compensatedServerMs - Date.now();
        hasSyncedWithServer = true;
      }
    }
  } catch {
    // Offline mode: verify internal consistency using hardware monotonic clock
  }

  return getVerifiedClockStatus();
}

/**
 * Returns current verified clock status
 */
export function getVerifiedClockStatus(): ClockSyncStatus {
  const currentDeviceMs = Date.now();
  const currentMonotonicMs = typeof performance !== 'undefined' ? performance.now() : 0;

  // Check 1: Server sync delta
  if (hasSyncedWithServer) {
    const driftSec = Math.round(Math.abs(serverTimeDeltaMs) / 1000);
    const isTrusted = driftSec < 300; // < 5 minutes allowed
    return {
      isClockTrusted: isTrusted,
      driftSeconds: driftSec,
      serverTimestampUtc: new Date(currentDeviceMs + serverTimeDeltaMs).toISOString(),
      deviceTimestampUtc: new Date(currentDeviceMs).toISOString(),
      source: 'server_ntp',
      warningMessage: !isTrusted 
        ? `⚠️ Desfase de reloj detectado (${Math.round(driftSec / 60)} min). Hora ajustada al servidor oficial.` 
        : undefined
    };
  }

  // Check 2: Monotonic drift detection (User changed device time while app was open)
  if (monotonicBootTime > 0 && currentMonotonicMs > 0) {
    const elapsedMonotonicMs = currentMonotonicMs - monotonicBootTime;
    const elapsedWallMs = currentDeviceMs - bootWallTime;
    const internalDriftSec = Math.round(Math.abs(elapsedWallMs - elapsedMonotonicMs) / 1000);

    if (internalDriftSec > 120) { // Changed by more than 2 minutes mid-session
      return {
        isClockTrusted: false,
        driftSeconds: internalDriftSec,
        deviceTimestampUtc: new Date(currentDeviceMs).toISOString(),
        source: 'monotonic_estimated',
        warningMessage: `⚠️ Alteración de reloj del dispositivo detectada durante la sesión (${Math.round(internalDriftSec / 60)} min).`
      };
    }
  }

  return {
    isClockTrusted: true,
    driftSeconds: 0,
    deviceTimestampUtc: new Date(currentDeviceMs).toISOString(),
    source: 'device_only'
  };
}

/**
 * Returns a trusted ISO timestamp for evaluation and legal SHA-256 hashing
 */
export function getTrustedTimestamp(): { timestampIso: string; isTrusted: boolean; note?: string } {
  const status = getVerifiedClockStatus();
  if (hasSyncedWithServer) {
    const adjusted = new Date(Date.now() + serverTimeDeltaMs).toISOString();
    return {
      timestampIso: adjusted,
      isTrusted: status.isClockTrusted,
      note: status.warningMessage
    };
  }

  return {
    timestampIso: status.deviceTimestampUtc,
    isTrusted: status.isClockTrusted,
    note: status.warningMessage
  };
}
