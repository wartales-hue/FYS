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
  Compass
} from 'lucide-react';
import { WorkerProfile, FRARiskEvaluation, PVTSummary } from '../../types';
import { CheckInFlow } from '../WorkerCheckIn/CheckInFlow';
import { InteractivePVT } from '../WorkerCheckIn/InteractivePVT';
import { WorkerPrivacyCenter } from './WorkerPrivacyCenter';
import { PersonalDataView } from '../PersonalProfile/PersonalDataView';
import { evaluateFRARisk } from '../../lib/fraEngine';
import { User, CloudSun } from 'lucide-react';
import { OpliraLogo } from '../OpliraLogo';

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
  const currentStatus = latestEvaluation?.status || 'green';
  const statusLabel = latestEvaluation?.statusLabel || 'Riesgo Operacional Controlado';

  const handleMicroPvtComplete = (summary: PVTSummary) => {
    // Generate an intra-shift micro evaluation using the current updated worker profile
    const quickEval = evaluateFRARisk(
      currentWorkerData,
      {
        sleepDurationHours: 6.5,
        sleepOpportunityHours: 9.0,
        bedTime: '23:00',
        wakeTime: '05:30',
        sleepQuality: 3,
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
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
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
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ← Cancelar y Volver
          </button>
          <span className="text-xs font-bold text-orange-400 px-2 py-0.5 bg-orange-950/70 border border-orange-700/50 rounded">
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
    <div className="max-w-4xl mx-auto space-y-5 py-2">
      {/* Welcome & Operator Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs flex-shrink-0 mt-0.5">
              <OpliraLogo size={36} />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>{greeting}, {currentWorkerData.name}</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {currentWorkerData.equipmentAssigned} • {currentWorkerData.role}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>{currentWorkerData.faena}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Mountain className="w-3.5 h-3.5 text-slate-400" />
                  {currentWorkerData.altitudeMeters} msnm
                </span>
                <span>•</span>
                <span>RUT: {currentWorkerData.rut}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="open-personal-data-btn"
              onClick={() => setViewMode('personal_data')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Datos Personales</span>
            </button>

            <button
              id="open-privacy-btn"
              onClick={() => setViewMode('privacy')}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Ley 21.719</span>
            </button>
          </div>
        </div>

        {/* Big Readiness Status Banner */}
        <div
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            currentStatus === 'green'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : currentStatus === 'yellow'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : currentStatus === 'red'
              ? 'bg-rose-50/80 border-rose-200 text-rose-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 text-2xl shadow-xs ${
              currentStatus === 'green' ? 'bg-emerald-100 border-emerald-300' :
              currentStatus === 'yellow' ? 'bg-amber-100 border-amber-300' :
              currentStatus === 'red' ? 'bg-rose-100 border-rose-300' :
              'bg-slate-100 border-slate-300'
            }`}>
              {currentStatus === 'green' && '🟢'}
              {currentStatus === 'yellow' && '🟡'}
              {currentStatus === 'red' && '🔴'}
              {currentStatus === 'gray' && '⚪'}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-75 block">
                Estado de Alerta y Aptitud Operacional
              </span>
              <h2 className="text-lg sm:text-xl font-bold">
                {statusLabel}
              </h2>
              <p className="text-xs opacity-90 mt-0.5">
                {latestEvaluation?.recommendedAction || 'Desempeño dentro de tu rango habitual de seguridad.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              id="start-checkin-cta"
              onClick={() => setViewMode('checkin')}
              disabled={disabled}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Realizar Evaluación Fatiga y Somnolencia</span>
            </button>
          </div>
        </div>

        {/* 4 Core Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium">Sueño Previo</span>
            </div>
            <p className="font-mono text-base font-bold text-slate-900">
              {latestEvaluation ? '6.8 hrs' : '7 h 12 min'}
            </p>
            <span className="text-[11px] font-semibold text-emerald-600">Calidad: Buena</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium">Somnolencia KSS</span>
            </div>
            <p className="font-mono text-base font-bold text-slate-900">
              {latestEvaluation ? `KSS ${latestEvaluation.kss}` : 'KSS 3'}
            </p>
            <span className="text-[11px] text-slate-500">Alerta y activo</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-medium">Desempeño PVT</span>
            </div>
            <p className="font-mono text-base font-bold text-slate-900">
              {latestEvaluation ? `${worker.baseline.meanRT} ms` : '238 ms'}
            </p>
            <span className="text-[11px] font-semibold text-emerald-600">En rango habitual</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              <span className="font-medium">Jornada / Turno</span>
            </div>
            <p className="font-mono text-base font-bold text-slate-900">
              Día {worker.currentShift.dayInRoster} / {worker.currentShift.totalRosterDays}
            </p>
            <span className="text-[11px] text-slate-500">{worker.currentShift.type === 'night' ? 'Turno Noche' : 'Turno Día'}</span>
          </div>
        </div>
      </div>

      {/* Circadian Shift Curve & Educational Micro-learning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Circadian Curve Visualizer */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Curva de Alerta Circadiana Personalizada del Turno</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Identifica las ventanas biológicas de mayor fatiga durante tus {worker.currentShift.rosterPattern}.
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-medium">
              {worker.currentShift.shiftStart} - {worker.currentShift.shiftEnd}
            </span>
          </div>

          {/* Graphical Circadian Bar Representation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <div className="grid grid-cols-6 gap-1 text-[10px] text-center text-slate-500 font-medium">
              <span>20:00 (Inicio)</span>
              <span>23:00</span>
              <span className="text-rose-600 font-bold">03:00 (Nadir)</span>
              <span className="text-rose-600 font-bold">05:00 (Crítico)</span>
              <span>06:30</span>
              <span>07:00 (Salida)</span>
            </div>

            {/* Visual alert curve bars */}
            <div className="grid grid-cols-6 gap-1 h-14 items-end">
              <div className="bg-emerald-500 rounded-t h-4/5 text-[9px] text-white flex items-center justify-center font-bold">85%</div>
              <div className="bg-emerald-500 rounded-t h-3/5 text-[9px] text-white flex items-center justify-center font-bold">70%</div>
              <div className="bg-rose-500 rounded-t h-2/5 text-[9px] text-white flex items-center justify-center font-bold">38%</div>
              <div className="bg-rose-500 rounded-t h-1/4 text-[9px] text-white flex items-center justify-center font-bold">25%</div>
              <div className="bg-amber-500 rounded-t h-2/5 text-[9px] text-white flex items-center justify-center font-bold">45%</div>
              <div className="bg-amber-500 rounded-t h-3/5 text-[9px] text-white flex items-center justify-center font-bold">60%</div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Ventana Crítica (03:00 - 05:30): Pausas programadas recomendadas</span>
              </span>
              <span className="text-slate-400 font-medium">Modelo Biomatemático FRA</span>
            </div>
          </div>
        </div>

        {/* Micro-Learning Tip */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              Consejo Científico: Sueño en Gran Altitud ({worker.altitudeMeters}m)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              "La hipoxia en faenas sobre 3.000m genera respiración periódica y microdespertares no percibidos. Dormir 7 horas en campamento puede equivaler biológicamente a 5.5 horas a nivel del mar."
            </p>
          </div>

          <div className="text-[11px] text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
            💡 <strong>Recomendación:</strong> Mantén hidratación constante y evita pantallas brillantes 30 min antes de acostarte.
          </div>
        </div>
      </div>
    </div>
  );
};
