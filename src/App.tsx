import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WorkerDashboard } from './components/WorkerDashboard/WorkerDashboard';
import { SupervisorView } from './components/SupervisorDashboard/SupervisorView';
import { HSECView } from './components/HSECDashboard/HSECView';
import { OccupationalHealthView } from './components/HealthDashboard/OccupationalHealthView';
import { GovernanceView } from './components/AlgorithmGovernance/GovernanceView';
import { 
  UserRole, 
  WorkerProfile, 
  FRARiskEvaluation, 
  InterventionRecord, 
  StopBangRecord 
} from './types';
import { 
  MOCK_WORKERS, 
  MOCK_EVALUATIONS, 
  MOCK_INTERVENTIONS, 
  MOCK_STOP_BANG 
} from './lib/mockData';
import { OfflineState, loadInitialState, saveStateToStorage } from './lib/offlineStore';
import { Shield, CheckCircle2 } from 'lucide-react';
import { MandatoryPersonalDataModal } from './components/MandatoryPersonalDataModal';
import { MandatoryLegalConsentModal } from './components/MandatoryLegalConsentModal';
import { fetchLiveWeatherFromCoords, getStoredWeatherForecast } from './lib/weatherService';
import { initBackgroundSyncListeners, subscribeToQueue, drainSupervisorQueue, getPendingQueueCount } from './lib/supervisorSyncQueue';

export default function App() {
  const [state, setState] = useState<OfflineState>(loadInitialState);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [workerViewMode, setWorkerViewMode] = useState<'dashboard' | 'checkin' | 'micropvt' | 'privacy' | 'personal_data'>('dashboard');

  // Background sync listener for automatic offline supervisor email/PDF transmission
  useEffect(() => {
    const unsubQueue = subscribeToQueue((queue) => {
      const pendingCount = queue.filter(q => q.syncStatus === 'pending' || q.syncStatus === 'failed').length;
      setState(prev => ({
        ...prev,
        pendingSyncCount: pendingCount
      }));
    });

    const cleanupSync = initBackgroundSyncListeners((syncedCount) => {
      showToast(`✓ Conexión detectada: ${syncedCount} certificado(s) PDF transmitidos automáticamente al supervisor.`);
    });

    return () => {
      unsubQueue();
      if (cleanupSync) cleanupSync();
    };
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Automatic GPS & Live Climate Telemetry on Startup
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const long = position.coords.longitude;
          const alt = position.coords.altitude ? Math.round(position.coords.altitude) : (currentWorker.altitudeMeters || 1240);

          try {
            const live = await fetchLiveWeatherFromCoords(lat, long, alt, currentWorker.faena || 'Faena Operacional');
            setState(prev => {
              const currentList = prev.workers || MOCK_WORKERS;
              const updatedList = currentList.map(w => {
                if (w.id === prev.selectedWorkerId) {
                  return {
                    ...w,
                    altitudeMeters: alt,
                    weather: live
                  };
                }
                return w;
              });
              return {
                ...prev,
                workers: updatedList
              };
            });
          } catch (e) {
            console.warn('Auto GPS weather fetch skipped or cached:', e);
          }
        },
        (err) => {
          // GPS silent fallback to stored cache
          const cached = getStoredWeatherForecast();
          if (cached) {
            setState(prev => {
              const currentList = prev.workers || MOCK_WORKERS;
              const updatedList = currentList.map(w => {
                if (w.id === prev.selectedWorkerId && !w.weather?.forecast?.length) {
                  return { ...w, weather: cached };
                }
                return w;
              });
              return { ...prev, workers: updatedList };
            });
          }
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const workersList = state.workers || MOCK_WORKERS;
  const currentWorker = workersList.find(w => w.id === state.selectedWorkerId) || workersList[0];

  const handleRoleChange = (role: UserRole) => {
    setState(prev => ({ ...prev, currentRole: role }));
  };

  const handleOpenPersonalData = () => {
    setState(prev => ({ ...prev, currentRole: 'worker' }));
    setWorkerViewMode('personal_data');
  };

  const handleWorkerChange = (worker: WorkerProfile) => {
    setState(prev => ({ ...prev, selectedWorkerId: worker.id }));
  };

  const handleUpdateWorker = (updatedWorker: WorkerProfile) => {
    setState(prev => {
      const currentList = prev.workers || MOCK_WORKERS;
      const updatedList = currentList.map(w => w.id === updatedWorker.id ? updatedWorker : w);
      return {
        ...prev,
        workers: updatedList
      };
    });
    showToast(`✓ Ficha personal y calibración de ${updatedWorker.name} actualizadas.`);
  };

  const handleToggleOnline = async () => {
    const nextOnline = !state.isOnline;
    if (nextOnline) {
      const syncedCount = await drainSupervisorQueue();
      if (syncedCount > 0) {
        showToast(`✓ Conexión online: ${syncedCount} certificados transmitidos al supervisor con hash SHA-256.`);
      } else {
        showToast('✓ Modo Online conectado.');
      }
      setState(prev => ({ ...prev, isOnline: true, pendingSyncCount: getPendingQueueCount() }));
    } else {
      setState(prev => ({ ...prev, isOnline: false }));
      showToast('Modo Offline activado: Los reportes se guardarán en cola local.');
    }
  };

  const handleToggleVehicleMoving = () => {
    setState(prev => {
      const nextMoving = !prev.isVehicleMoving;
      if (nextMoving) {
        showToast('⚠️ Advertencia: Vehículo en movimiento. Bloqueo de seguridad activado para pruebas PVT.');
      } else {
        showToast('✓ Vehículo detenido. Interacción y pruebas habilitadas.');
      }
      return { ...prev, isVehicleMoving: nextMoving };
    });
  };

  const handleSyncNow = async () => {
    const syncedCount = await drainSupervisorQueue();
    setState(prev => ({ ...prev, pendingSyncCount: getPendingQueueCount() }));
    if (syncedCount > 0) {
      showToast(`✓ Sincronización exitosa: ${syncedCount} reporte(s) y PDF(s) transmitidos al supervisor.`);
    } else {
      showToast('✓ Cola de sincronización actualizada y verificada.');
    }
  };

  const handleSaveEvaluation = (newEval: FRARiskEvaluation) => {
    setState(prev => ({
      ...prev,
      evaluations: [newEval, ...prev.evaluations.filter(e => e.id !== newEval.id)],
      pendingSyncCount: prev.isOnline ? prev.pendingSyncCount : prev.pendingSyncCount + 1,
    }));
    const supervisorMsg = currentWorker.supervisorEmail 
      ? ` • Copia enviada a ${currentWorker.supervisorEmail}` 
      : '';
    showToast(`✓ Evaluación registrada: ${newEval.statusLabel} (${newEval.riskScore}/100)${supervisorMsg}`);
  };

  const handleSaveIntervention = (newInt: InterventionRecord) => {
    setState(prev => ({
      ...prev,
      interventions: [newInt, ...prev.interventions],
      pendingSyncCount: prev.isOnline ? prev.pendingSyncCount : prev.pendingSyncCount + 1,
    }));
    showToast('✓ Medida preventiva despachada al operador y registrada en bitácora.');
  };

  const handleUpdateInterventionStatus = (id: string, outcome: 'recovered_green' | 'partial_yellow' | 'unrecovered_red') => {
    setState(prev => ({
      ...prev,
      interventions: prev.interventions.map(i => {
        if (i.id === id) {
          return {
            ...i,
            status: 'completed',
            recoveryOutcome: outcome,
            completedAt: new Date().toISOString(),
          };
        }
        return i;
      })
    }));
    showToast('✓ Estado de recuperación post-intervención actualizado.');
  };

  const handleSaveStopBang = (record: StopBangRecord) => {
    setState(prev => ({
      ...prev,
      stopBangRecords: [record, ...prev.stopBangRecords.filter(r => r.workerId !== record.workerId)],
      pendingSyncCount: prev.isOnline ? prev.pendingSyncCount : prev.pendingSyncCount + 1,
    }));
    showToast('✓ Evaluación médica STOP-BANG guardada en Base Clínica Segregada.');
  };

  const getLatestEvaluation = (workerId: string) => {
    return state.evaluations.find(e => e.workerId === workerId);
  };

  const handleSavePersonalData = (updatedProfile: WorkerProfile) => {
    handleUpdateWorker(updatedProfile);
    showToast(`✓ Datos personales registrados. Proceda con el Consentimiento Informado.`);
  };

  const handleAcceptLegalConsent = (consentDetails: {
    timestamp: string;
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
    acceptedDutyOfDisclosure: boolean;
    signatureDigital: string;
  }) => {
    const updatedWorker: WorkerProfile = {
      ...currentWorker,
      legalConsent: {
        accepted: true,
        ...consentDetails
      }
    };
    handleUpdateWorker(updatedWorker);
    showToast(`✓ Documentos legales y consentimiento autorizado por ${consentDetails.signatureDigital}.`);
  };

  // Sequential Gating: 1. Personal Data -> 2. Informed Consent -> 3. App / Evaluation
  const isProfilePending = !currentWorker.profileCompleted;
  const isConsentPending = currentWorker.profileCompleted && !currentWorker.legalConsent?.accepted;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-slate-800 selection:text-white">
      {/* 1. Mandatory Personal Data Modal (Step 1 Gatekeeper) */}
      <MandatoryPersonalDataModal
        isOpen={isProfilePending}
        worker={currentWorker}
        onSave={handleSavePersonalData}
      />

      {/* 2. Mandatory Legal & Informed Consent Modal (Step 2 Gatekeeper) */}
      <MandatoryLegalConsentModal
        isOpen={isConsentPending}
        worker={currentWorker}
        onAccept={handleAcceptLegalConsent}
      />
      {/* Global Navigation Header */}
      <Header
        currentRole={state.currentRole}
        onRoleChange={handleRoleChange}
        selectedWorker={currentWorker}
        workers={workersList}
        onWorkerChange={handleWorkerChange}
        isOnline={state.isOnline}
        onToggleOnline={handleToggleOnline}
        isVehicleMoving={state.isVehicleMoving}
        onToggleVehicleMoving={handleToggleVehicleMoving}
        pendingSyncCount={state.pendingSyncCount}
        onSyncNow={handleSyncNow}
        onOpenPersonalData={handleOpenPersonalData}
      />

      {/* Main Role Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {state.currentRole === 'worker' && (
          <WorkerDashboard
            worker={currentWorker}
            latestEvaluation={getLatestEvaluation(currentWorker.id)}
            onSaveEvaluation={handleSaveEvaluation}
            onUpdateWorker={handleUpdateWorker}
            disabled={state.isVehicleMoving}
            activeViewMode={workerViewMode}
            onViewModeChange={setWorkerViewMode}
          />
        )}

        {state.currentRole === 'supervisor' && (
          <SupervisorView
            workers={workersList}
            evaluations={state.evaluations}
            interventions={state.interventions}
            onSaveIntervention={handleSaveIntervention}
            onUpdateInterventionStatus={handleUpdateInterventionStatus}
          />
        )}

        {state.currentRole === 'hsec' && (
          <HSECView
            workers={workersList}
            evaluations={state.evaluations}
            interventions={state.interventions}
            isVehicleMoving={state.isVehicleMoving}
            onTriggerMicroPvt={() => {
              setState(prev => ({ ...prev, currentRole: 'worker' }));
              showToast('Redirigiendo a pantalla de operador para Micro-PVT...');
            }}
          />
        )}

        {state.currentRole === 'health' && (
          <OccupationalHealthView
            workers={workersList}
            stopBangRecords={state.stopBangRecords}
            onSaveStopBang={handleSaveStopBang}
          />
        )}

        {state.currentRole === 'admin' && (
          <GovernanceView />
        )}
      </main>

      {/* Toast notification popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Compliance & Engineering Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 text-xs py-4 px-4 sm:px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-slate-800">FRA-HSEC v2.0</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">Sistema de Gestión del Riesgo de Fatiga Operacional (FRMS)</span>
          </div>
          <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-center gap-3">
            <span>Cumplimiento Ley 21.719</span>
            <span>•</span>
            <span>DS 44 / OHSAS Minería</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Trazabilidad Criptográfica SHA-256
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

