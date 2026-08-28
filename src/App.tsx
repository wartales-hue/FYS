import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WorkerDashboard } from './components/WorkerDashboard/WorkerDashboard';
import { SupervisorView } from './components/SupervisorDashboard/SupervisorView';
import { HSECView } from './components/HSECDashboard/HSECView';
import { GovernanceView } from './components/AlgorithmGovernance/GovernanceView';
import { 
  UserRole, 
  WorkerProfile, 
  FRARiskEvaluation, 
  InterventionRecord
} from './types';
import { 
  MOCK_WORKERS, 
  MOCK_EVALUATIONS, 
  MOCK_INTERVENTIONS
} from './lib/mockData';
import { OfflineState, loadInitialState, saveStateToStorage, resetAllDataToZero } from './lib/offlineStore';
import { Shield, CheckCircle2 } from 'lucide-react';
import { MandatoryPersonalDataModal } from './components/MandatoryPersonalDataModal';
import { MandatoryLegalConsentModal } from './components/MandatoryLegalConsentModal';
import { GooglePlaySubscriptionModal } from './components/GooglePlaySubscriptionModal';
import { NonMedicalDisclaimerModal } from './components/GooglePlayCompliance/NonMedicalDisclaimerModal';
import { GooglePlayPermissionsModal } from './components/GooglePlayCompliance/GooglePlayPermissionsModal';
import { GooglePlayReviewerDemoModal } from './components/GooglePlayCompliance/GooglePlayReviewerDemoModal';
import { MejorasComentariosModal } from './components/MejorasComentariosModal';
import { AppInformationModal } from './components/AppInformationModal';
import { fetchLiveWeatherFromCoords, getStoredWeatherForecast } from './lib/weatherService';
import { initBackgroundSyncListeners, subscribeToQueue, drainSupervisorQueue, forceSyncAll, getPendingQueueCount } from './lib/supervisorSyncQueue';
import { initScreenSecurity, onSecurityAlert } from './lib/screenSecurity';
import { checkDeviceSessionStatus } from './lib/premiumService';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<OfflineState>(loadInitialState);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const [workerViewMode, setWorkerViewMode] = useState<'dashboard' | 'checkin' | 'micropvt' | 'privacy' | 'personal_data'>('dashboard');
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  const [isNonMedicalModalOpen, setIsNonMedicalModalOpen] = useState<boolean>(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState<boolean>(false);
  const [isReviewerDemoModalOpen, setIsReviewerDemoModalOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [isInformationModalOpen, setIsInformationModalOpen] = useState<boolean>(false);
  const [isSyncingGlobal, setIsSyncingGlobal] = useState<boolean>(false);

  // Screen security (anti-screenshot & data protection Ley 21.719)
  useEffect(() => {
    const cleanupSecurity = initScreenSecurity();
    const unsubAlert = onSecurityAlert((msg) => {
      setSecurityAlert(msg);
      setTimeout(() => setSecurityAlert(null), 5000);
    });

    return () => {
      cleanupSecurity();
      unsubAlert();
    };
  }, []);

  // Background sync listener for automatic offline supervisor email/PDF transmission
  useEffect(() => {
    // Initial clock sync ping
    import('./lib/clockSync').then(m => m.syncClockWithBackend()).catch(() => {});

    const unsubQueue = subscribeToQueue((queue) => {
      const pendingCount = queue.filter(q => q.syncStatus === 'pending' || q.syncStatus === 'failed' || q.syncStatus === 'syncing').length;
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

  const handleResetAllData = () => {
    const clean = resetAllDataToZero();
    setState(clean);
    setWorkerViewMode('dashboard');
    showToast('✓ Datos eliminados: Aplicación reiniciada para registrar nuevo trabajador.');
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
      setIsSyncingGlobal(true);
      try {
        const syncedCount = await forceSyncAll();
        if (syncedCount > 0) {
          showToast(`✓ Conexión online: ${syncedCount} certificados transmitidos al supervisor con hash SHA-256.`);
        } else {
          showToast('✓ Modo Online conectado.');
        }
      } finally {
        setIsSyncingGlobal(false);
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
    setIsSyncingGlobal(true);
    try {
      const syncedCount = await forceSyncAll();
      const newPending = getPendingQueueCount();
      setState(prev => ({ ...prev, pendingSyncCount: newPending }));
      if (syncedCount > 0) {
        showToast(`✓ Sincronización exitosa: ${syncedCount} reporte(s) y certificado(s) transmitidos al supervisor.`);
      } else {
        showToast('✓ Cola de sincronización verificada: todos los reportes están al día.');
      }
    } finally {
      setIsSyncingGlobal(false);
    }
  };

  const handleSaveEvaluation = (newEval: FRARiskEvaluation) => {
    setState(prev => ({
      ...prev,
      evaluations: [newEval, ...prev.evaluations.filter(e => e.id !== newEval.id)],
      pendingSyncCount: getPendingQueueCount(),
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
      pendingSyncCount: getPendingQueueCount(),
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

  const handleApplyReviewerDemo = (credentials: {
    rut: string;
    pin: string;
    faena: string;
    altitude: number;
    workerName: string;
  }) => {
    const updatedWorker: WorkerProfile = {
      ...currentWorker,
      name: credentials.workerName,
      rut: credentials.rut,
      faena: credentials.faena,
      altitudeMeters: credentials.altitude,
      supervisorRut: '12080702-1',
      supervisorName: 'Supervisor HSEC Autorizado (Google Play)',
      supervisorEmail: 'wartales@gmail.com',
      profileCompleted: true,
      legalConsent: {
        accepted: true,
        timestamp: new Date().toISOString(),
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedDutyOfDisclosure: true,
        signatureDigital: credentials.workerName
      }
    };
    handleUpdateWorker(updatedWorker);
    setState(prev => ({
      ...prev,
      currentRole: 'worker'
    }));
    showToast('✓ Entorno de Prueba Google Play cargado. Acceso completo y calibración habilitados.');
  };

  const handleStartNewEvaluation = () => {
    setState(prev => ({ ...prev, currentRole: 'worker' }));
    setWorkerViewMode('checkin');
    showToast('Iniciando nueva evaluación de Fatiga y Somnolencia (FYS)...');
  };

  // Sequential Gating: 1. Personal Data -> 2. Informed Consent -> 3. App / Evaluation
  const isProfilePending = !currentWorker.profileCompleted;
  const isConsentPending = currentWorker.profileCompleted && !currentWorker.legalConsent?.accepted;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-slate-800 selection:text-white security-protected-screen select-none">
      {/* Security Alert Toast (Anti-Screenshot / Ley 21.719 protection) */}
      {securityAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-rose-950/95 border-2 border-rose-500 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 max-w-lg text-center">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 animate-pulse" />
          <span>{securityAlert}</span>
        </div>
      )}
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
        isSyncing={isSyncingGlobal}
        onSyncNow={handleSyncNow}
        onStartNewEvaluation={handleStartNewEvaluation}
        onOpenPersonalData={handleOpenPersonalData}
        onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
        onOpenInformationModal={() => setIsInformationModalOpen(true)}
        onOpenPremiumModal={() => setIsPremiumModalOpen(true)}
        onOpenNonMedicalModal={() => setIsNonMedicalModalOpen(true)}
        onOpenPermissionsModal={() => setIsPermissionsModalOpen(true)}
        onOpenReviewerDemoModal={() => setIsReviewerDemoModalOpen(true)}
        onResetData={handleResetAllData}
      />

      {/* Centro de Información & Base Científica Oplira */}
      <AppInformationModal
        isOpen={isInformationModalOpen}
        onClose={() => setIsInformationModalOpen(false)}
      />

      {/* Buzón Oficial de Mejoras, Reclamos y Comentarios (Ley 21.719 / Trazabilidad) */}
      <MejorasComentariosModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        currentUser={currentWorker}
        currentRole={state.currentRole}
      />

      {/* Google Play Store Premium Modal */}
      <GooglePlaySubscriptionModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        initialRut={currentWorker.rut || currentWorker.supervisorRut}
        onSuccess={() => {
          showToast('✓ Cuenta Premium activada y vinculada a este dispositivo.');
        }}
      />

      {/* Non-Medical Disclaimer Modal (Google Play Health Policy) */}
      <NonMedicalDisclaimerModal
        isOpen={isNonMedicalModalOpen}
        onClose={() => setIsNonMedicalModalOpen(false)}
      />

      {/* Permissions Transparency Modal (Foreground Location & Zero Audio) */}
      <GooglePlayPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />

      {/* Google Play Reviewer Demo Modal */}
      <GooglePlayReviewerDemoModal
        isOpen={isReviewerDemoModalOpen}
        onClose={() => setIsReviewerDemoModalOpen(false)}
        onApplyReviewerDemo={handleApplyReviewerDemo}
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

        {state.currentRole === 'admin' && (
          <GovernanceView onOpenReviewerDemoModal={() => setIsReviewerDemoModalOpen(true)} />
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
            <span className="text-[11px] text-slate-500 hidden sm:inline">Sistema de Gestión de Fatiga y Somnolencia (SGFS / F&S)</span>
          </div>
          <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="text-slate-700 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="text-amber-500">💬</span>
              <span>Buzón de Mejoras y Comentarios</span>
            </button>
            <span>•</span>
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

