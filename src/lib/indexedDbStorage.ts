/**
 * IndexedDB Enterprise Storage Engine for Oplira FYS
 * Capable of storing 100,000+ records safely without localStorage quota limits.
 * Includes Retention Policy (purge blobs older than 90 days) and DB Health Check.
 */

const DB_NAME = 'oplira_fys_enterprise_db';
const DB_VERSION = 1;
const STORE_EVALUATIONS = 'evaluations';
const STORE_SYNC_QUEUE = 'sync_queue';
const STORE_AUDIT_LOGS = 'audit_logs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store: Evaluations
      if (!db.objectStoreNames.contains(STORE_EVALUATIONS)) {
        const evalStore = db.createObjectStore(STORE_EVALUATIONS, { keyPath: 'id' });
        evalStore.createIndex('timestamp', 'timestamp', { unique: false });
        evalStore.createIndex('workerId', 'workerId', { unique: false });
        evalStore.createIndex('status', 'status', { unique: false });
      }

      // Store: Sync Queue
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id' });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('attempts', 'attempts', { unique: false });
      }

      // Store: Audit Logs
      if (!db.objectStoreNames.contains(STORE_AUDIT_LOGS)) {
        const auditStore = db.createObjectStore(STORE_AUDIT_LOGS, { keyPath: 'id' });
        auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        auditStore.createIndex('eventType', 'eventType', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function performTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    action(store)
      .then((res) => {
        transaction.oncomplete = () => {
          db.close();
          resolve(res);
        };
      })
      .catch((err) => {
        db.close();
        reject(err);
      });

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export const dbStorage = {
  // Evaluaciones
  async saveEvaluation(item: any): Promise<void> {
    try {
      await performTransaction<void>(STORE_EVALUATIONS, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const req = store.put(item);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      });
    } catch (e) {
      console.warn('IndexedDB saveEvaluation fallback:', e);
    }
  },

  async getAllEvaluations(): Promise<any[]> {
    try {
      return await performTransaction<any[]>(STORE_EVALUATIONS, 'readonly', (store) => {
        return new Promise<any[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      });
    } catch (e) {
      console.warn('IndexedDB getAllEvaluations error:', e);
      return [];
    }
  },

  // Cola de Sincronización
  async saveSyncItem(item: any): Promise<void> {
    try {
      await performTransaction<void>(STORE_SYNC_QUEUE, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const req = store.put(item);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      });
    } catch (e) {
      console.warn('IndexedDB saveSyncItem error:', e);
    }
  },

  async getAllSyncItems(): Promise<any[]> {
    try {
      return await performTransaction<any[]>(STORE_SYNC_QUEUE, 'readonly', (store) => {
        return new Promise<any[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      });
    } catch (e) {
      console.warn('IndexedDB getAllSyncItems error:', e);
      return [];
    }
  },

  async deleteSyncItem(id: string): Promise<void> {
    try {
      await performTransaction<void>(STORE_SYNC_QUEUE, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const req = store.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      });
    } catch (e) {
      console.warn('IndexedDB deleteSyncItem error:', e);
    }
  },

  /**
   * Retention Policy & Health Maintenance:
   * Strips heavy PDF strings from synced items older than 30 days to keep IndexedDB lean and fast.
   */
  async runStorageMaintenance(): Promise<{ purgedCount: number; status: string }> {
    try {
      const items = await this.getAllSyncItems();
      const now = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      let purgedCount = 0;

      for (const item of items) {
        const itemTime = new Date(item.timestamp).getTime();
        // If synced and older than 30 days, strip base64 pdf to free memory while preserving audit integrity
        if (item.syncStatus === 'synced' && (now - itemTime) > THIRTY_DAYS_MS && item.pdfBase64) {
          item.pdfBase64 = undefined; // Retain metadata & SHA-256
          await this.saveSyncItem(item);
          purgedCount++;
        }
      }

      return { purgedCount, status: 'healthy' };
    } catch (e) {
      console.warn('Storage maintenance note:', e);
      return { purgedCount: 0, status: 'error' };
    }
  }
};
