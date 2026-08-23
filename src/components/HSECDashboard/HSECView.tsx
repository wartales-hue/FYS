import React, { useState } from 'react';
import { 
  BarChart3, 
  Flame, 
  Sliders, 
  FileSearch, 
  Video, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Users, 
  Sparkles,
  PieChart
} from 'lucide-react';
import { WorkerProfile, FRARiskEvaluation, InterventionRecord } from '../../types';
import { FatigueHotspotMap } from './FatigueHotspotMap';
import { RosterSimulator } from './RosterSimulator';
import { IncidentInvestigation } from './IncidentInvestigation';
import { DSMInCabSimulator } from '../DSMIntegration/DSMInCabSimulator';

interface HSECViewProps {
  workers: WorkerProfile[];
  evaluations: FRARiskEvaluation[];
  interventions: InterventionRecord[];
  isVehicleMoving: boolean;
  onTriggerMicroPvt: () => void;
}

export const HSECView: React.FC<HSECViewProps> = ({
  workers,
  evaluations,
  interventions,
  isVehicleMoving,
  onTriggerMicroPvt,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'hotspots' | 'roster' | 'investigation' | 'dsm'>('analytics');

  const tabs: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Indicadores SGFS & KPIs', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'hotspots', label: 'Fatigue Hotspots (Matriz)', icon: <Flame className="w-4 h-4" /> },
    { id: 'roster', label: 'Simulador de Roster', icon: <Sliders className="w-4 h-4" /> },
    { id: 'investigation', label: 'Investigación Forense', icon: <FileSearch className="w-4 h-4" /> },
    { id: 'dsm', label: 'Telemetría Cabina DSM', icon: <Video className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      {/* Top Banner with Core SGFS KPIs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                Gestión Integral HSEC & SGFS
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-medium">
                DS 44 / OHSAS / Estándar Minero
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Panel de Inteligencia y Control del Riesgo de Fatiga
            </h1>
            <p className="text-xs text-slate-500">
              Métricas agregadas del sistema preventivo, efectividad de pausas y gestión organizacional de turnos.
            </p>
          </div>
        </div>

        {/* 4 Macro SGFS KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Main KPI 1: Fatigue Risk Control Rate */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium text-[11px]">Fatigue Risk Control Rate</span>
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <p className="font-mono text-3xl font-bold text-emerald-800">96.4%</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Eventos de riesgo que activaron medida preventiva y tuvieron reevaluación documentada.
            </p>
          </div>

          {/* Main KPI 2: Recovery Success Rate */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium text-[11px]">Recovery Success Rate</span>
              <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <p className="font-mono text-3xl font-bold text-amber-800">89.2%</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Eficacia de pausas activas y siestas controladas para restablecer tiempos de reacción.
            </p>
          </div>

          {/* KPI 3: Check-in Compliance */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium text-[11px]">Cumplimiento de Check-In</span>
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <p className="font-mono text-3xl font-bold text-indigo-800">98.8%</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              1.428 check-ins realizados en los últimos 30 días de operación minera.
            </p>
          </div>

          {/* KPI 4: Mean Reaction Time Trend */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium text-[11px]">Tiempo de Reacción Promedio</span>
              <span className="p-1.5 bg-slate-200 text-slate-800 rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <p className="font-mono text-3xl font-bold text-slate-900">242 ms</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Desempeño psicomotor estable a nivel de flota en faenas a gran altitud.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-xs">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Fleet Status Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-600" />
              <span>Distribución Operacional de Flota (Mes en Curso)</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-800">🟢 Riesgo Operacional Controlado</span>
                  <span className="font-mono text-slate-700">88.5% (1.264 turnos)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[88.5%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-800">🟡 Medida Preventiva (Pausa / Rotación)</span>
                  <span className="font-mono text-slate-700">9.2% (131 turnos)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[9.2%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-rose-800">🔴 Riesgo Elevado (Detención & Relevo)</span>
                  <span className="font-mono text-slate-700">2.3% (33 turnos)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-[2.3%]" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
              💡 <strong>Observación HSEC:</strong> El 100% de los 33 eventos de riesgo elevado contaron con protocolo de relevo antes de continuar la tarea crítica en rajo abierto.
            </div>
          </div>

          {/* Preventative Intervention Effectiveness */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Efectividad Comparativa de Medidas Preventivas</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Siesta Estratégica (25 min en Domo)</p>
                  <p className="text-slate-500 text-[11px]">Recuperación promedio: -42 ms en PVT</p>
                </div>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  94.8% Eficacia
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Pausa Activa + Hidratación (15 min)</p>
                  <p className="text-slate-500 text-[11px]">Recuperación promedio: -28 ms en PVT</p>
                </div>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  87.4% Eficacia
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Rotación Temporal de Equipo</p>
                  <p className="text-slate-500 text-[11px]">Reducción de carga cognitiva en tareas monótonas</p>
                </div>
                <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  85.2% Eficacia
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hotspots' && <FatigueHotspotMap />}
      {activeTab === 'roster' && <RosterSimulator />}
      {activeTab === 'investigation' && <IncidentInvestigation />}
      {activeTab === 'dsm' && (
        <DSMInCabSimulator
          worker={workers[0]}
          isVehicleMoving={isVehicleMoving}
          onTriggerMicroPvt={onTriggerMicroPvt}
        />
      )}
    </div>
  );
};
