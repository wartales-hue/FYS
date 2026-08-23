import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, X, Scale, HeartPulse, Stethoscope } from 'lucide-react';
import { OpliraLogo } from '../OpliraLogo';

interface NonMedicalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NonMedicalDisclaimerModal: React.FC<NonMedicalDisclaimerModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden text-slate-900 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Cumplimiento Google Play Health & Medical Policy
              </span>
              <h2 className="text-base font-bold text-white leading-tight">
                Deslinde de Responsabilidad No-Médico y Clasificación Operacional
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed bg-white">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Aviso Importante a Usuarios y Autoridades Fiscalizadoras</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              <strong>Oplira FYS HSEC es una herramienta de gestión de seguridad ocupacional y prevención de riesgos laborales industriales</strong>, regulada bajo el <strong>Decreto Supremo N° 44 (Reglamento de Seguridad Minera)</strong> y el <strong>Artículo 184 del Código del Trabajo de Chile</strong>.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Puntos Clave de Clasificación (Google Play Store Policy)
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Stethoscope className="w-4 h-4 text-rose-500" />
                1. No es un Dispositivo Médico ni Realiza Diagnósticos Clínicos
              </span>
              <p className="text-[11px] text-slate-600">
                La aplicación <strong>NO diagnostica apnea del sueño (SAHOS), patologías neurológicas, ni trastornos clínicos del sueño</strong>. Las latencias de reacción táctil (Micro-PVT) son métricas psicomotoras operacionales de referencia para calibrar el estado de alerta pre-turno, no diagnósticos médicos.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <HeartPulse className="w-4 h-4 text-indigo-500" />
                2. No Sustituye Exámenes de Salud Ocupacional
              </span>
              <p className="text-[11px] text-slate-600">
                Esta herramienta no reemplaza los exámenes médicos pre-ocupacionales, ocupacionales de gran altitud geográfica (Batería Hipobárica), ni las evaluaciones realizadas por mutualidades (ACHS, Mutual CChC, IST) o médicos somnólogos.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                3. Finalidad Estrictamente de Prevención Operacional y Autocuidado
              </span>
              <p className="text-[11px] text-slate-600">
                El propósito exclusivo de Oplira es apoyar el autocuidado del trabajador y la toma de decisiones preventivas de la línea de mando antes del inicio del turno para evitar incidentes por microsueño en maquinaria pesada y transporte.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Certificación Normativa DS 44 • Categoría: Productividad y Seguridad
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
