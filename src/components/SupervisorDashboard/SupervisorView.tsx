import React, { useState } from 'react';
import { 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  AlertTriangle, 
  RotateCcw, 
  Coffee, 
  Lock, 
  Radio,
  Truck,
  Layers,
  Sparkles,
  UserX
} from 'lucide-react';
import { WorkerProfile, FRARiskEvaluation, InterventionRecord } from '../../types';
import { MOCK_WORKERS } from '../../lib/mockData';
import { InterventionModal } from './InterventionModal';

interface SupervisorViewProps {
  workers: WorkerProfile[];
  evaluations: FRARiskEvaluation[];
  interventions: InterventionRecord[];
  onSaveIntervention: (record: InterventionRecord) => void;
  onUpdateInterventionStatus: (id: string, outcome: 'recovered_green' | 'partial_yellow' | 'unrecovered_red') => void;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({
  workers,
  evaluations,
  interventions,
  onSaveIntervention,
  onUpdateInterventionStatus,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeWorkerForIntervention, setActiveWorkerForIntervention] = useState<WorkerProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Map latest evaluation for each worker
  const getLatestEval = (workerId: string) => {
    return evaluations.find(e => e.workerId === workerId);
  };

  const getWorkerIntervention = (workerId: string) => {
    return interventions.find(i => i.workerId === workerId && i.status === 'in_progress');
  };

  // Status counts
  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let grayCount = 0;

  workers.forEach(w => {
    const ev = getLatestEval(w.id);
    const st = ev?.status || 'green';
    if (st === 'green') greenCount++;
    else if (st === 'yellow') yellowCount++;
    else if (st === 'red') redCount++;
    else grayCount++;
  });

  const categories = [
    { id: 'all', label: 'Toda la Flota', count: workers.length },
    { id: 'CAEX', label: 'Flota CAEX (Catastrófica)', count: workers.filter(w => w.equipmentAssigned.includes('CAEX')).length },
    { id: 'Pala', label: 'Palas & Carguío', count: workers.filter(w => w.equipmentAssigned.includes('Pala')).length },
    { id: 'Perforadora', label: 'Perforación', count: workers.filter(w => w.equipmentAssigned.includes('PV-')).length },
    { id: 'Bus', label: 'Buses Transporte', count: workers.filter(w => w.equipmentAssigned.includes('Bus')).length },
  ];

  const filteredWorkers = workers.filter(w => {
    const matchesCategory = selectedCategory === 'all' || w.equipmentAssigned.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.equipmentAssigned.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5 py-2">
      {/* Fleet Operational Header & KPI summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Dominio Operacional de Turno
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-medium">
                Faena Cordillera Sur & Norte
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Monitoreo y Gestión del Riesgo en Flota Activa
            </h1>
            <p className="text-xs text-slate-500">
              Estado de vigilancia de operadores en turno nocturno / diurno.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 text-[11px] font-medium pl-1">Información Médica:</span>
            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-500" /> NO DISPONIBLE (Protegida)
            </span>
          </div>
        </div>

        {/* Status Traffic Light Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider">
                🟢 Riesgo Controlado
              </span>
              <span className="text-2xl font-bold text-emerald-950 mt-1 block">
                {greenCount}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">Operación normal</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-lg text-emerald-800 font-bold">
              ✓
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-800 block uppercase tracking-wider">
                🟡 Medida Preventiva
              </span>
              <span className="text-2xl font-bold text-amber-950 mt-1 block">
                {yellowCount}
              </span>
              <span className="text-[10px] text-amber-700 font-medium">Requiere pausa / rotación</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-lg text-amber-800 font-bold">
              ⚠️
            </div>
          </div>

          <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-800 block uppercase tracking-wider">
                🔴 Riesgo Elevado
              </span>
              <span className="text-2xl font-bold text-rose-950 mt-1 block">
                {redCount}
              </span>
              <span className="text-[10px] text-rose-700 font-medium">Detención y protocolo</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-lg text-rose-800 font-bold">
              ⛔
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                Intervenciones Activas
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {interventions.filter(i => i.status === 'in_progress').length}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">En proceso de recuperación</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
              <Coffee className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] bg-slate-200/80 text-slate-800 px-1.5 py-0.2 rounded-full font-mono font-bold">
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por operador, equipo o área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 w-full sm:w-64 focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Workers Roster List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWorkers.map((w) => {
          const evalResult = getLatestEval(w.id);
          const activeInt = getWorkerIntervention(w.id);
          const status = evalResult?.status || 'green';

          return (
            <div
              key={w.id}
              className={`bg-white border rounded-2xl p-5 transition-all space-y-4 shadow-xs ${
                status === 'red'
                  ? 'border-rose-300 ring-1 ring-rose-200'
                  : status === 'yellow'
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header: Operator & Equipment */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-700">
                    {w.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>{w.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        w.criticality === 4 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Criticidad {w.criticality}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      <strong className="text-amber-700 font-semibold">{w.equipmentAssigned}</strong> • {w.role}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    status === 'green'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : status === 'yellow'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    <span>{status === 'green' ? '🟢' : status === 'yellow' ? '🟡' : '🔴'}</span>
                    <span>{status === 'green' ? 'Controlado' : status === 'yellow' ? 'Pausa / Rotación' : 'Riesgo Elevado'}</span>
                  </span>
                </div>
              </div>

              {/* Operational Shift & Evaluation Summary */}
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Jornada</span>
                  <span className="font-bold text-slate-800">
                    Día {w.currentShift.dayInRoster}/{w.currentShift.totalRosterDays} ({w.currentShift.type === 'night' ? 'Noche' : 'Día'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">KSS / PVT</span>
                  <span className="font-bold text-slate-800">
                    KSS {evalResult ? evalResult.kss : 3} • {evalResult ? (evalResult.ipdPercentage > 0 ? `+${evalResult.ipdPercentage}%` : `${evalResult.ipdPercentage}%`) : 'Normal'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Altitud</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {w.altitudeMeters} msnm
                  </span>
                </div>
              </div>

              {/* Recommended Action Box */}
              <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  Acción Operacional Recomendada:
                </span>
                <p className="text-slate-700 font-medium">
                  {evalResult?.recommendedAction || 'Continuar operación habitual sin restricciones.'}
                </p>
              </div>

              {/* In-Progress Intervention Status */}
              {activeInt && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span>
                      Medida en curso: <strong>{activeInt.interventionType === 'active_break_15m' ? 'Pausa Activa 15 min' : 'Relevo Temporal'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateInterventionStatus(activeInt.id, 'recovered_green')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs"
                    >
                      ✓ Recuperado (🟢)
                    </button>
                    <button
                      onClick={() => onUpdateInterventionStatus(activeInt.id, 'unrecovered_red')}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs"
                    >
                      ✗ Relevo Definitivo
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setActiveWorkerForIntervention(w)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>Despachar Medida Preventiva</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for dispatching interventions */}
      {activeWorkerForIntervention && (
        <InterventionModal
          worker={activeWorkerForIntervention}
          evaluation={getLatestEval(activeWorkerForIntervention.id)}
          onClose={() => setActiveWorkerForIntervention(null)}
          onSaveIntervention={onSaveIntervention}
        />
      )}
    </div>
  );
};
