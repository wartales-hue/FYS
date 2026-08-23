import React, { useState } from 'react';
import { Flame, AlertCircle, Info, Filter, Clock, Calendar } from 'lucide-react';

export const FatigueHotspotMap: React.FC = () => {
  const [selectedFleet, setSelectedFleet] = useState<string>('all');

  const days = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5 (Noche)', 'Día 6 (Noche)', 'Día 7 (Noche)'];
  const hours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'
  ];

  // Hotspot matrix (0: low, 1: moderate, 2: high risk hotspot)
  // Peak risk typically: 03:00-06:00 on Day 5-7 night shifts
  const getRiskLevel = (dayIdx: number, hourIdx: number): { level: 0 | 1 | 2; label: string } => {
    // 04:00 (index 2) & 06:00 (index 3) on night shifts
    if ((hourIdx === 2 || hourIdx === 1) && dayIdx >= 4) {
      return { level: 2, label: 'Hotspot Crítico (Nadir + Deuda de Sueño)' };
    }
    if ((hourIdx === 1 || hourIdx === 2 || hourIdx === 3) && dayIdx >= 2) {
      return { level: 1, label: 'Riesgo Moderado Circadiano' };
    }
    // Post-prandial dip 14:00 (index 6)
    if (hourIdx === 6 && dayIdx >= 3) {
      return { level: 1, label: 'Valle Post-Prandial (14:00)' };
    }
    return { level: 0, label: 'Riesgo Operacional Controlado' };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>Fatigue Hotspot Analytics</span>
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-medium">
              Patrón Organizacional
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Matriz de Concentración de Riesgo por Horario y Ciclo de Turno
          </h2>
          <p className="text-xs text-slate-500">
            Identificación de ventanas biológicas críticas para programar pausas de ingeniería y rotaciones preventivas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedFleet}
            onChange={(e) => setSelectedFleet(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-slate-900"
          >
            <option value="all">Todas las Áreas (Mina + Planta + Transporte)</option>
            <option value="caex">Flota CAEX Rajo Abierto</option>
            <option value="palas">Palas y Carguío</option>
            <option value="buses">Transporte de Pasajeros</option>
          </select>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
        <div className="min-w-[640px] space-y-2">
          {/* Column Hours Header */}
          <div className="grid grid-cols-13 gap-1 text-[10px] text-slate-500 font-mono text-center pb-1">
            <div className="text-left font-sans font-semibold">Jornada</div>
            {hours.map((h, i) => (
              <div key={i} className={h === '04:00' ? 'text-rose-600 font-bold' : ''}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows for each day */}
          {days.map((day, dIdx) => (
            <div key={dIdx} className="grid grid-cols-13 gap-1 items-center">
              <div className="text-xs font-semibold text-slate-700 truncate pr-2">
                {day}
              </div>
              {hours.map((_, hIdx) => {
                const { level, label } = getRiskLevel(dIdx, hIdx);
                return (
                  <div
                    key={hIdx}
                    title={`${day} @ ${hours[hIdx]}: ${label}`}
                    className={`h-9 rounded-lg border transition-all flex items-center justify-center cursor-pointer hover:scale-105 font-mono ${
                      level === 2
                        ? 'bg-rose-500 border-rose-600 text-white font-bold text-[10px] shadow-xs'
                        : level === 1
                        ? 'bg-amber-400 border-amber-500 text-amber-950 font-semibold text-[10px]'
                        : 'bg-emerald-100/70 border-emerald-200 text-emerald-800 text-[10px] hover:bg-emerald-200'
                    }`}
                  >
                    {level === 2 ? 'HOT' : level === 1 ? 'MOD' : 'OK'}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Hotspot Organizational Recommendation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Ventana Crítica Detectada: 03:00 - 05:30 (Días 5 a 7 de Noche)</span>
          </div>
          <p className="text-rose-900 leading-relaxed">
            Se observa una concentración del 74% de los eventos de ralentización psicomotora y lapsos PVT durante las últimas 3 noches del ciclo 7x7.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Medida de Ingeniería y Gestión SGFS Recomendada:</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Implementar protocolo obligatorio de pausa activa de 15 minutos e hidratación a las 04:00 hrs para toda la flota CAEX y buses de transporte de personal.
          </p>
        </div>
      </div>
    </div>
  );
};
