import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Moon, 
  Activity, 
  Clock, 
  Mountain, 
  Sparkles, 
  Play, 
  ShieldAlert, 
  Zap, 
  Lock, 
  ChevronRight, 
  CheckCircle2,
  TrendingDown,
  Info,
  Calendar,
  Compass,
  QrCode,
  FileCheck,
  RefreshCw,
  Scale
} from 'lucide-react';
import { WorkerProfile, FRARiskEvaluation, PVTSummary } from '../../types';
import { CheckInFlow } from '../WorkerCheckIn/CheckInFlow';
import { InteractivePVT } from '../WorkerCheckIn/InteractivePVT';
import { WorkerPrivacyCenter } from './WorkerPrivacyCenter';
import { PersonalDataView } from '../PersonalProfile/PersonalDataView';
import { DigitalPassModal } from '../WorkerCheckIn/DigitalPassModal';
import { MandatoryLegalConsentModal } from '../MandatoryLegalConsentModal';
import { evaluateFRARisk } from '../../lib/fraEngine';
import { User, CloudSun } from 'lucide-react';
import { OpliraLogo } from '../OpliraLogo';
import { AdBanner } from '../AdBanner';

interface WorkerDashboardProps {
  worker: WorkerProfile;
  latestEvaluation?: FRARiskEvaluation;
  onSaveEvaluation: (evaluation: FRARiskEvaluation) => void;
  onUpdateWorker?: (worker: WorkerProfile) => void;
  disabled?: boolean;
  activeViewMode?: 'dashboard' | 'checkin' | 'micropvt' | 'privacy' | 'personal_data';
  onViewModeChange?: (mode: 'dashboard' | 'checkin' | 'micropvt' | 'privacy' | 'personal_data') => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  worker,
  latestEvaluation,
  onSaveEvaluation,
  onUpdateWorker,
  disabled = false,
  activeViewMode,
  onViewModeChange,
}) => {
  const [currentWorkerData, setCurrentWorkerData] = useState<WorkerProfile>(worker);
  const [internalViewMode, setInternalViewMode] = useState<'dashboard' | 'checkin' | 'micropvt' | 'privacy' | 'personal_data'>('dashboard');
  const [microPvtDone, setMicroPvtDone] = useState<boolean>(false);
  const [isDigitalPassOpen, setIsDigitalPassOpen] = useState<boolean>(false);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('fys_legal_consent_v1') === 'true';
      }
    } catch (e) {}
    return false;
  });

  const viewMode = activeViewMode || internalViewMode;
  const setViewMode = (mode: 'dashboard' | 'checkin' | 'micropvt' | 'privacy' | 'personal_data') => {
    setInternalViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  // Keep state in sync whenever worker prop updates
  React.useEffect(() => {
    setCurrentWorkerData(worker);
  }, [worker]);

  const isNightShift = currentWorkerData.currentShift.type === 'night';
  const greeting = isNightShift ? 'Buenas Noches' : 'Buenos Días';

  // Default evaluation if none exists
  const currentStatus = latestEvaluation?.status || 'gray';
  const statusLabel = latestEvaluation?.statusLabel || 'Sin Evaluación Registrada';

  const handleMicroPvtComplete = (summary: PVTSummary) => {
    // Generate an intra-shift micro evaluation using the current updated worker profile
    const quickEval = evaluateFRARisk(
      currentWorkerData,
      {
        sleepDurationHours: 6.5,
        sleepOpportunityHours: 9.0,
        bedTime: '23:00',
        wakeTime: '05:30',
        sleepQuality: 5,
        timeSinceAwakeHours: 6.0,
        accumulatedSleepDebtHours: 1.5,
        consecutiveNights: currentWorkerData.currentShift.type === 'night' ? currentWorkerData.currentShift.dayInRoster : 0,
      },
      latestEvaluation ? latestEvaluation.kss : 4,
      summary,
      undefined,
      undefined,
      false
    );

    onSaveEvaluation(quickEval);
    setMicroPvtDone(true);
    setTimeout(() => {
      setViewMode('dashboard');
      setMicroPvtDone(false);
    }, 1800);
  };

  if (viewMode === 'checkin') {
    return (
      <div className="py-4">
        <div className="mb-4 flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => setViewMode('dashboard')}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            ← Volver al Dashboard del Trabajador
          </button>
        </div>
        <CheckInFlow
          worker={currentWorkerData}
          onCheckInComplete={(evalResult) => {
            onSaveEvaluation(evalResult);
            setViewMode('dashboard');
          }}
          onUpdateWorker={(updated) => {
            setCurrentWorkerData(updated);
            onUpdateWorker?.(updated);
          }}
          disabled={disabled}
        />
      </div>
    );
  }

  if (viewMode === 'micropvt') {
    return (
      <div className="py-6 max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewMode('dashboard')}
            className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            ← Cancelar y Volver
          </button>
          <span className="text-xs font-bold text-blue-400 px-2 py-0.5 bg-blue-950/70 border border-blue-700/50 rounded">
            Micro-PVT Intra-Turno (3 Ensayos)
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white text-xs space-y-2">
          <p className="font-semibold text-slate-200">
            Verificación Rápida de Alerta en Terreno (Maquinaria Detenida)
          </p>
          <p className="text-slate-400">
            Prueba breve de 20 segundos para calibrar tu estado de reflejos psicomotores durante la jornada.
          </p>
        </div>

        <InteractivePVT
          mode="Micro-PVT"
          worker={currentWorkerData}
          onComplete={handleMicroPvtComplete}
          disabled={disabled}
        />

        {microPvtDone && (
          <div className="p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-xl text-xs text-center animate-bounce">
            ✓ Micro-PVT registrado correctamente. Actualizando estado operacional...
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'privacy') {
    return (
      <div className="py-4 max-w-3xl mx-auto">
        <WorkerPrivacyCenter worker={currentWorkerData} onClose={() => setViewMode('dashboard')} />
      </div>
    );
  }

  if (viewMode === 'personal_data') {
    return (
      <div className="py-4 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button
            id="back-from-personal-data-btn"
            onClick={() => setViewMode('dashboard')}
            className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            ← Volver al Dashboard
          </button>
        </div>
        <PersonalDataView
          worker={currentWorkerData}
          onUpdateWorker={(updated) => {
            setCurrentWorkerData(updated);
            if (onUpdateWorker) {
              onUpdateWorker(updated);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 py-1">
      {/* 1. Worker Identity & Top Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center p-1.5 shadow-xs flex-shrink-0">
              <OpliraLogo size={28} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                {greeting}, {currentWorkerData.name || 'Trabajador'}
              </span>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {currentWorkerData.equipmentAssigned ? `${currentWorkerData.equipmentAssigned} • ` : ''}{currentWorkerData.role || 'Trabajador en Faena'}
              </h1>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                <span>{currentWorkerData.faena || 'Faena Minera'}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700 flex items-center gap-0.5">
                  <Mountain className="w-3.5 h-3.5 text-slate-400" />
                  {currentWorkerData.altitudeMeters || 0} msnm
                </span>
                <span>•</span>
                <span className="font-mono text-slate-600">RUT: {currentWorkerData.rut || '12.345.678-9'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              id="open-personal-data-btn"
              onClick={() => setViewMode('personal_data')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              title="Ver o editar datos personales y de contacto de emergencia"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Mi Ficha</span>
            </button>

            <button
              id="open-privacy-btn"
              onClick={() => setViewMode('privacy')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Centro de Privacidad y Derechos Ley 21.719"
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Privacidad</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hero Action Card (One-Action Decision Center) */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 transition-all shadow-sm ${
        !latestEvaluation 
          ? 'bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 border-blue-600 text-white'
          : currentStatus === 'green'
          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
          : currentStatus === 'yellow'
          ? 'bg-amber-50/90 border-amber-300 text-amber-950'
          : currentStatus === 'red'
          ? 'bg-rose-50/90 border-rose-300 text-rose-950'
          : 'bg-slate-100 border-slate-300 text-slate-900'
      }`}>
        {!latestEvaluation ? (
          /* State A: Check-in Required (Clear, Large, Unmissable CTA) */
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span>Requisito Obligatorio Pre-Turno DS 44</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Autoevaluación de Fatiga y Somnolencia
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Verifica tus horas de descanso previo, escala de alerta y reflejos psicomotores antes de operar maquinaria en faena.
              </p>
            </div>

            {/* Mandatory Legal Consent Checkbox before 1st checklist */}
            <div className="p-3.5 bg-slate-900/90 border border-blue-400/30 rounded-2xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="dashboard-legal-consent-checkbox"
                  type="checkbox"
                  checked={hasAcceptedLegal}
                  onChange={(e) => {
                    setHasAcceptedLegal(e.target.checked);
                    if (e.target.checked) {
                      localStorage.setItem('fys_legal_consent_v1', 'true');
                    } else {
                      localStorage.removeItem('fys_legal_consent_v1');
                    }
                  }}
                  className="w-4 h-4 mt-0.5 rounded text-blue-500 focus:ring-blue-400 border-slate-600 bg-slate-800 cursor-pointer flex-shrink-0"
                />
                <span className="text-xs text-slate-200 leading-snug">
                  Declaro conocer y aceptar la <strong>Declaración de Responsabilidad de Utilización de la Aplicación</strong> para el control preventivo de fatiga y somnolencia en faena.
                </span>
              </label>
              <div className="pl-6.5">
                <button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="text-[11px] text-amber-300 hover:text-amber-200 font-bold underline flex items-center gap-1 cursor-pointer"
                >
                  <Scale className="w-3 h-3 text-amber-400" />
                  <span>[Ver Declaración Completa]</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                id="start-checkin-cta"
                onClick={() => {
                  if (!hasAcceptedLegal) {
                    setShowLegalModal(true);
                    return;
                  }
                  setViewMode('checkin');
                }}
                disabled={disabled}
                className={`w-full sm:w-auto px-6 py-4 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 ${
                  hasAcceptedLegal
                    ? 'bg-blue-500 hover:bg-blue-400 text-slate-950 hover:shadow-blue-500/25'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Comenzar Evaluación (60 segundos)</span>
              </button>
              {!hasAcceptedLegal && (
                <span className="text-[11px] text-amber-300 font-medium">
                  * Marca la casilla para acceder al primer checklist.
                </span>
              )}
            </div>
          </div>
        ) : (
          /* State B: Evaluation Completed (Traffic Light Banner) */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 text-3xl shadow-sm ${
                  currentStatus === 'green' ? 'bg-emerald-100 border-emerald-400 text-emerald-700' :
                  currentStatus === 'yellow' ? 'bg-amber-100 border-amber-400 text-amber-700' :
                  currentStatus === 'red' ? 'bg-rose-100 border-rose-400 text-rose-700' :
                  'bg-slate-200 border-slate-400'
                }`}>
                  {currentStatus === 'green' && '🟢'}
                  {currentStatus === 'yellow' && '🟡'}
                  {currentStatus === 'red' && '🔴'}
                  {currentStatus === 'gray' && '⚪'}
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-75 block">
                    DIAGNÓSTICO OPERACIONAL PRE-TURNO
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                    {statusLabel}
                  </h2>
                  <p className="text-xs font-medium opacity-90 mt-0.5">
                    {latestEvaluation?.recommendedAction}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  id="start-checkin-repeat-cta"
                  onClick={() => setViewMode('checkin')}
                  disabled={disabled}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Realizar una nueva evaluación si tus condiciones cambiaron"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Realizar nueva evaluación Fatiga y Somnolencia</span>
                </button>
              </div>
            </div>

            {/* Quick Sello Criptográfico & Emisión Footer */}
            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[10px] text-slate-600 gap-2">
              <span className="font-mono">
                Emitido: {new Date(latestEvaluation.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
              </span>
              <span className="font-mono truncate max-w-xs text-slate-500">
                Sello SHA-256: {latestEvaluation.cryptographicSeal?.sha256Hash?.substring(0, 16)}...
              </span>
              <span className="font-bold text-emerald-700">✓ Válido para Turno Actual</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Operational Metrics Grid (4 Clean Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sueño Previo</span>
          </div>
          <p className="font-mono text-lg font-black text-slate-900">
            {latestEvaluation ? `${latestEvaluation.sleepHours || 8.0} hrs` : '8.0 hrs'}
          </p>
          <span className="text-[10px] font-bold text-emerald-700">
            {latestEvaluation ? 'Calidad: Normal' : 'Condición Óptima'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            <span>Somnolencia KSS</span>
          </div>
          <p className="font-mono text-lg font-black text-slate-900">
            {latestEvaluation ? `KSS ${latestEvaluation.kss}` : 'KSS -'}
          </p>
          <span className="text-[10px] font-bold text-slate-500">
            {latestEvaluation?.kss && latestEvaluation.kss <= 5 ? 'Alerta Óptima' : 'Requiere Pausa'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Reflejos PVT</span>
          </div>
          <p className="font-mono text-lg font-black text-slate-900">
            {worker.baseline?.meanRT ? `${worker.baseline.meanRT} ms` : '240 ms'}
          </p>
          <span className="text-[10px] font-bold text-emerald-700">
            Rango Normal
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-cyan-600" />
            <span>Jornada de Turno</span>
          </div>
          <p className="font-mono text-lg font-black text-slate-900">
            Día {worker.currentShift?.dayInRoster || 1} / {worker.currentShift?.totalRosterDays || 7}
          </p>
          <span className="text-[10px] font-bold text-slate-500">
            Régimen {worker.currentShift?.rosterPattern || '7x7'}
          </span>
        </div>
      </div>

      {/* 4. Quick Micro-PVT On-Demand Test Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-600" />
            <span>Calibración Rápida en Terreno</span>
          </span>
          <h3 className="text-sm font-bold text-slate-900">
            Micro-PVT de Reflejos en Pausa Activa (20 segundos)
          </h3>
          <p className="text-xs text-slate-500">
            ¿Sientes pesadez o fatiga durante la jornada? Realiza una verificación breve con maquinaria detenida.
          </p>
        </div>

        <button
          id="trigger-micropvt-quick-btn"
          onClick={() => setViewMode('micropvt')}
          disabled={disabled}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Iniciar Micro-PVT (20s)</span>
        </button>
      </div>

      {/* AD BANNER FOR WORKER SESSION */}
      <AdBanner role="worker" />

      {/* 5. Circadian Shift Curve & Science Tip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Circadian Curve Visualizer */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Curva de Alerta Circadiana del Turno</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Ventanas biológicas de alerta según modelo biomatemático FRA.
              </p>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold">
              {worker.currentShift?.shiftStart || '20:00'} - {worker.currentShift?.shiftEnd || '08:00'}
            </span>
          </div>

          {/* Visual alert curve bars */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
            <div className="grid grid-cols-6 gap-1 text-[9px] text-center text-slate-500 font-bold">
              <span>20:00</span>
              <span>23:00</span>
              <span className="text-rose-600">03:00 (Nadir)</span>
              <span className="text-rose-600">05:00 (Crítico)</span>
              <span>06:30</span>
              <span>08:00</span>
            </div>

            <div className="grid grid-cols-6 gap-1 h-12 items-end">
              <div className="bg-emerald-500 rounded-t h-4/5 text-[8px] text-white flex items-center justify-center font-bold">85%</div>
              <div className="bg-emerald-500 rounded-t h-3/5 text-[8px] text-white flex items-center justify-center font-bold">70%</div>
              <div className="bg-rose-500 rounded-t h-2/5 text-[8px] text-white flex items-center justify-center font-bold">38%</div>
              <div className="bg-rose-500 rounded-t h-1/4 text-[8px] text-white flex items-center justify-center font-bold">25%</div>
              <div className="bg-amber-500 rounded-t h-2/5 text-[8px] text-white flex items-center justify-center font-bold">45%</div>
              <div className="bg-emerald-500 rounded-t h-3/5 text-[8px] text-white flex items-center justify-center font-bold">65%</div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1 text-rose-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Ventana Crítica (03:00 - 05:30): Pausas programadas</span>
              </span>
              <span className="text-slate-400 font-medium">DS 44 / OHSAS</span>
            </div>
          </div>
        </div>

        {/* Micro-Learning Tip */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              Sueño en Faena ({worker.altitudeMeters || 3200} msnm)
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              La hipoxia por altitud genera microdespertares no percibidos. Dormir 7 horas en campamento equivale a 5.5 horas a nivel del mar.
            </p>
          </div>

          <div className="text-[10px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            💡 <strong>Recomendación:</strong> Mantén hidratación constante y evita pantallas 30 min antes de acostarte.
          </div>
        </div>
      </div>

      {/* Digital Pass & QR Credential Modal */}
      <DigitalPassModal
        isOpen={isDigitalPassOpen}
        onClose={() => setIsDigitalPassOpen(false)}
        worker={currentWorkerData}
        evaluation={latestEvaluation}
      />

      {/* Mandatory Legal Consent Modal */}
      <MandatoryLegalConsentModal
        isOpen={showLegalModal}
        worker={currentWorkerData}
        onClose={() => setShowLegalModal(false)}
        onAccept={(consent) => {
          setHasAcceptedLegal(true);
          try {
            localStorage.setItem('fys_legal_consent_v1', 'true');
            localStorage.setItem('fys_legal_consent_details', JSON.stringify(consent));
          } catch (e) {}
          setShowLegalModal(false);
          setViewMode('checkin');
        }}
      />
    </div>
  );
};

