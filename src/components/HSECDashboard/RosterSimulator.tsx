import React, { useState } from 'react';
import { Sliders, Calendar, Clock, Mountain, ShieldCheck, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { ShiftRosterConfig } from '../../types';

export const RosterSimulator: React.FC = () => {
  const [rosterType, setRosterType] = useState<string>('7x7_continuous');
  const [shiftHours, setShiftHours] = useState<number>(12);
  const [altitudeMeters, setAltitudeMeters] = useState<number>(3800);
  const [consecutiveNights, setConsecutiveNights] = useState<number>(4);
  const [transitHours, setTransitHours] = useState<number>(3);

  // Simulation calculations
  const calculateRosterRisk = () => {
    let baseDebt = 0;
    // Daily sleep deficit in altitude and 12h shifts
    const estimatedDailySleep = shiftHours === 12 ? 6.2 : 7.2;
    const altitudeFragmentation = altitudeMeters > 3000 ? 0.8 : 0.3;
    const netDailySleep = Math.max(4.0, estimatedDailySleep - altitudeFragmentation);
    const dailyDeficit = 8.0 - netDailySleep;

    const cumulativeDebt = (dailyDeficit * (rosterType === '7x7_continuous' ? 7 : rosterType === '14x14_extreme' ? 14 : 4)) + (transitHours * 0.5);
    
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    if (cumulativeDebt >= 9.0 || (consecutiveNights >= 5 && altitudeMeters > 3000)) {
      riskLevel = 'high';
    } else if (cumulativeDebt >= 5.0) {
      riskLevel = 'moderate';
    }

    return {
      netDailySleep: netDailySleep.toFixed(1),
      dailyDeficit: dailyDeficit.toFixed(1),
      cumulativeDebt: cumulativeDebt.toFixed(1),
      riskLevel,
    };
  };

  const simResult = calculateRosterRisk();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 space-y-6 shadow-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              <span>Roster Risk Simulator</span>
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-medium">
              Modelado Predictivo
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Simulador Biomatemático de Jornadas y Sistemas de Turnos
          </h2>
          <p className="text-xs text-slate-500">
            Evalúa y compara el impacto de la duración del turno, altitud geográfica y noches consecutivas antes de implementar cambios operacionales.
          </p>
        </div>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Roster Type */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="text-slate-700 font-semibold block flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Sistema de Turno:</span>
          </label>
          <select
            value={rosterType}
            onChange={(e) => setRosterType(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none focus:border-slate-900"
          >
            <option value="7x7_continuous">7x7 Continuo (7D - 7Desc - 7N)</option>
            <option value="4x3_mining">4x3 Faena Minera (4 días 12h)</option>
            <option value="5x2_standard">5x2 Turno Normal (8.5h)</option>
            <option value="14x14_extreme">14x14 Turno Extremo Cordillera</option>
          </select>
        </div>

        {/* Shift Duration */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between">
            <label className="text-slate-700 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Horas por Turno:</span>
            </label>
            <span className="font-mono font-bold text-amber-700">{shiftHours} hrs</span>
          </div>
          <input
            type="range"
            min="8"
            max="12"
            step="1"
            value={shiftHours}
            onChange={(e) => setShiftHours(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />
          <span className="text-[10px] text-slate-500 block">Jornada 12h estándar faena</span>
        </div>

        {/* Altitude */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between">
            <label className="text-slate-700 font-semibold flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-amber-600" />
              <span>Altitud Geográfica:</span>
            </label>
            <span className="font-mono font-bold text-amber-700">{altitudeMeters} msnm</span>
          </div>
          <input
            type="range"
            min="1000"
            max="4600"
            step="200"
            value={altitudeMeters}
            onChange={(e) => setAltitudeMeters(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />
          <span className="text-[10px] text-slate-500 block">Mayor altitud = mayor fragmentación</span>
        </div>

        {/* Consecutive Nights */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between">
            <label className="text-slate-700 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>Noches Consecutivas:</span>
            </label>
            <span className="font-mono font-bold text-rose-700">{consecutiveNights} noches</span>
          </div>
          <input
            type="range"
            min="1"
            max="7"
            step="1"
            value={consecutiveNights}
            onChange={(e) => setConsecutiveNights(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />
          <span className="text-[10px] text-slate-500 block">Límite recomendado: ≤ 4 noches</span>
        </div>
      </div>

      {/* Simulation Result Projected Dashboard */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800">
            Proyección Biomatemática del Roster Simulado
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            simResult.riskLevel === 'high'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : simResult.riskLevel === 'moderate'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {simResult.riskLevel === 'high' ? '🔴 RIESGO ROSTER ELEVADO' : simResult.riskLevel === 'moderate' ? '🟡 RIESGO MODERADO' : '🟢 ROSTER OPTIMIZADO'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px]">Sueño Diario Efectivo Proyectado</span>
            <p className="font-mono text-xl font-bold text-slate-900">{simResult.netDailySleep} hrs</p>
            <span className="text-[10px] text-slate-500">Ajustado por hipoxia de altitud</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px]">Deuda Diaria de Sueño</span>
            <p className="font-mono text-xl font-bold text-amber-700">+{simResult.dailyDeficit} hrs / día</p>
            <span className="text-[10px] text-slate-500">Respecto a 8h recomendadas</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px]">Deuda Acumulada al Fin de Ciclo</span>
            <p className={`font-mono text-xl font-bold ${parseFloat(simResult.cumulativeDebt) > 8 ? 'text-rose-700' : 'text-amber-700'}`}>
              {simResult.cumulativeDebt} hrs
            </p>
            <span className="text-[10px] text-slate-500">Deuda fisiológica total</span>
          </div>
        </div>

        {/* Scientific recommendations */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
          <span className="font-bold text-amber-800 block">Recomendaciones FRMS para esta Programación:</span>
          <ul className="space-y-1 text-slate-600 list-disc list-inside">
            {consecutiveNights > 4 && (
              <li>Reducir el bloque de noches continuas a un máximo de 4 noches seguidas para evitar acumulación crítica de sueño delta.</li>
            )}
            {altitudeMeters > 3000 && (
              <li>Incorporar cápsulas o domos presurizados/oxigenados para mejorar la arquitectura del sueño REM en campamento.</li>
            )}
            <li>Programar paradas biológicas obligatorias de 15 minutos en el nadir circadiano (04:00 - 05:00).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
