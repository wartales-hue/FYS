import React from 'react';
import { Cpu, ShieldCheck, CheckCircle2, Award, FileText, AlertCircle, BarChart3, GitBranch } from 'lucide-react';
import { MOCK_ALGORITHM_LOGS } from '../../lib/mockData';
import { OpliraLogo } from '../OpliraLogo';

export const GovernanceView: React.FC = () => {
  const currentVersion = MOCK_ALGORITHM_LOGS[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 py-2">
      {/* Title & Governance Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                <span>Gobernanza del Algoritmo & Validación Científica</span>
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-medium">
                FRA Engine v2.0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Validación Científica, Trazabilidad y Control de Versiones
            </h1>
            <p className="text-xs text-slate-500">
              El motor FRA se fundamenta en modelos explicables validados experimentalmente, prohibiendo modificaciones silenciosas.
            </p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center gap-2">
            <OpliraLogo size={42} showText={true} />
          </div>
        </div>

        {/* Validation Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Sensibilidad</span>
            <p className="font-mono text-2xl font-bold text-emerald-800">
              {(currentVersion.validationMetrics.sensitivity * 100).toFixed(0)}%
            </p>
            <span className="text-[10px] text-slate-500">Detección de fatiga</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Especificidad</span>
            <p className="font-mono text-2xl font-bold text-indigo-800">
              {(currentVersion.validationMetrics.specificity * 100).toFixed(0)}%
            </p>
            <span className="text-[10px] text-slate-500">Bajo falso positivo</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Curva ROC / AUC</span>
            <p className="font-mono text-2xl font-bold text-amber-800">
              {currentVersion.validationMetrics.aucRoc.toFixed(2)}
            </p>
            <span className="text-[10px] text-slate-500">Precisión global</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Falsos Positivos</span>
            <p className="font-mono text-2xl font-bold text-amber-800">
              {(currentVersion.validationMetrics.falsePositiveRate * 100).toFixed(0)}%
            </p>
            <span className="text-[10px] text-slate-500">Tasa controlada</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Falsos Negativos</span>
            <p className="font-mono text-2xl font-bold text-rose-800">
              {(currentVersion.validationMetrics.falseNegativeRate * 100).toFixed(0)}%
            </p>
            <span className="text-[10px] text-slate-500">Mínimo riesgo residual</span>
          </div>
        </div>
      </div>

      {/* 10 Phases of Validation Program */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          <span>Programa de Validación Científica en 10 Fases (Sección 37)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          {[
            { phase: 'Fase 1', title: 'Calibración Dispositivo', desc: 'Latencia táctil en pantallas OLED/LCD industriales.', done: true },
            { phase: 'Fase 2', title: 'PVT-A vs PVT-L/X', desc: 'Equivalencia psicométrica de 60s vs 3 minutos.', done: true },
            { phase: 'Fase 3', title: 'KSS vs Desempeño', desc: 'Identificación de patrones de fatiga enmascarada.', done: true },
            { phase: 'Fase 4', title: 'Línea Base Dinámica', desc: 'Calibración individual intra-sujeto.', done: true },
            { phase: 'Fase 5', title: 'Turno Día / Noche', desc: 'Respuesta ante inversión de fase circadiana.', done: true },
            { phase: 'Fase 6', title: 'Tiempo Despierto', desc: 'Presión homeostática de sueño (>16h).', done: true },
            { phase: 'Fase 7', title: 'Gran Altitud', desc: 'Hipoxia y desaturación >3.500 msnm.', done: true },
            { phase: 'Fase 8', title: 'Telemetría DSM', desc: 'Correlación PERCLOS con lapsos PVT.', done: true },
            { phase: 'Fase 9', title: 'Efectividad Pausas', desc: 'Cinética de recuperación post-siesta.', done: true },
            { phase: 'Fase 10', title: 'Validación Prospectiva', desc: 'Seguimiento de incidentes en faenas piloto.', done: true },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-amber-700 font-bold text-[10px] uppercase">{item.phase}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="font-bold text-slate-900 text-xs">{item.title}</p>
              <p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Version Change Control Log */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-amber-600" />
          <span>Libro de Gobernanza y Aprobación de Algoritmos</span>
        </h2>

        <div className="space-y-4">
          {MOCK_ALGORITHM_LOGS.map((log, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 font-mono">{log.version}</span>
                  <span className="text-slate-500 font-mono text-[11px]">Liberado: {log.releaseDate}</span>
                </div>
                <span className="text-emerald-800 text-[11px] font-semibold">
                  Aprobado por: {log.approvalCommittee}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                <strong>Resumen de Cambios:</strong> {log.changesSummary}
              </p>
              <p className="text-slate-500 text-[11px]">
                Científico Responsable: <strong className="text-slate-700">{log.leadScientist}</strong>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
