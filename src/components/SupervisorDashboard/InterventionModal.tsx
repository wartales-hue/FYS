import React, { useState } from 'react';
import { Shield, Coffee, Moon, RefreshCw, UserCheck, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { WorkerProfile, FRARiskEvaluation, InterventionRecord } from '../../types';

interface InterventionModalProps {
  worker: WorkerProfile;
  evaluation?: FRARiskEvaluation;
  onClose: () => void;
  onSaveIntervention: (record: InterventionRecord) => void;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  worker,
  evaluation,
  onClose,
  onSaveIntervention,
}) => {
  const [selectedType, setSelectedType] = useState<InterventionRecord['interventionType']>('active_break_15m');
  const [notes, setNotes] = useState<string>('');

  const interventionOptions: { type: InterventionRecord['interventionType']; label: string; desc: string; icon: React.ReactNode; duration: string }[] = [
    {
      type: 'active_break_15m',
      label: 'Pausa Activa (15 min)',
      desc: 'Detención en área de descanso, hidratación, caminata ligera y ejercicios de estiramiento.',
      icon: <Coffee className="w-5 h-5 text-amber-400" />,
      duration: '15 min'
    },
    {
      type: 'controlled_nap_25m',
      label: 'Siesta Estratégica Controlada (25 min)',
      desc: 'Descanso en módulo silencioso o domo de sueño para restaurar la vigilancia sin inercia del sueño.',
      icon: <Moon className="w-5 h-5 text-indigo-400" />,
      duration: '25 min'
    },
    {
      type: 'equipment_rotation',
      label: 'Rotación de Equipo / Tarea',
      desc: 'Reasignación temporal a equipo o tarea de menor criticidad (ej. de CAEX a apoyo en botadero).',
      icon: <RefreshCw className="w-5 h-5 text-cyan-400" />,
      duration: 'Durante turno'
    },
    {
      type: 'temporary_relief',
      label: 'Relevo Operacional Temporal',
      desc: 'Relevo inmediato por operador de retén para descanso prolongado en campamento.',
      icon: <UserCheck className="w-5 h-5 text-rose-400" />,
      duration: 'Turno completo'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: InterventionRecord = {
      id: `int-${Date.now()}`,
      workerId: worker.id,
      evaluationId: evaluation?.id || `eval-${Date.now()}`,
      supervisorId: 'sup-carlos-valenzuela',
      timestamp: new Date().toISOString(),
      interventionType: selectedType,
      customNotes: notes,
      status: 'in_progress',
    };

    onSaveIntervention(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl text-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              Gestión Operacional Preventiva
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Registrar Medida Preventiva: {worker.name}
            </h3>
            <p className="text-xs text-slate-500">
              {worker.equipmentAssigned} • {worker.role} ({worker.faena})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Operational Context Warning */}
        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs space-y-1 text-amber-900">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Objetivo Preventivo:</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Las medidas preventivas buscan restablecer la vigilancia psicomotora de forma anticipada. Toda medida ejecutada requerirá reevaluación posterior para verificar la recuperación.
          </p>
        </div>

        {/* Options List */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Selecciona la Acción Operacional:
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {interventionOptions.map((opt) => {
                const isSelected = selectedType === opt.type;
                return (
                  <div
                    key={opt.type}
                    onClick={() => setSelectedType(opt.type)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-300 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-white border border-slate-200 flex-shrink-0 shadow-2xs">
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${isSelected ? 'text-amber-900' : 'text-slate-800'}`}>
                          {opt.label}
                        </p>
                        <span className="text-[10px] font-mono bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          {opt.duration}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supervisor Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Observaciones del Supervisor de Turno:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Operador coordinado con caseta de despacho para relevo y descanso en domo."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar y Despachar Medida</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
