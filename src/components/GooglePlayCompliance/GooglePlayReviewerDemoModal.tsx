import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  Key, 
  Sparkles, 
  X, 
  Play, 
  Cpu, 
  FileText, 
  MapPin, 
  RefreshCw,
  Award
} from 'lucide-react';
import { activateGooglePlaySubscription, isAuthorizedSupervisorRut } from '../../lib/premiumService';

interface GooglePlayReviewerDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyReviewerDemo: (credentials: {
    rut: string;
    pin: string;
    faena: string;
    altitude: number;
    workerName: string;
  }) => void;
}

export const GooglePlayReviewerDemoModal: React.FC<GooglePlayReviewerDemoModalProps> = ({
  isOpen,
  onClose,
  onApplyReviewerDemo
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  if (!isOpen) return null;

  const handle1ClickReviewerSetup = () => {
    setIsApplying(true);

    setTimeout(() => {
      // 1. Activate Google Play subscription mock token
      activateGooglePlaySubscription('12080702-1', '1234', 'Minera Escondida (Antofagasta)');

      // 2. Dispatch profile configuration
      onApplyReviewerDemo({
        rut: '12.080.702-1',
        pin: '1234',
        faena: 'Minera Escondida (Faena Norte)',
        altitude: 3100,
        workerName: 'Carlos M. Valenzuela (Demo Google Play)'
      });

      setIsApplying(false);
      setAppliedSuccess(true);

      setTimeout(() => {
        onClose();
      }, 1800);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-slate-900 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Smartphone className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
              Google Play Console • App Access & Testing Credentials
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Modo Revisor de Google Play (1-Click Reviewer Demo)
            </h3>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-slate-600 leading-relaxed">
          Para agilizar la revisión del equipo de Google Play Store y pruebas automatizadas (Robo Tests), este acceso rápido precarga una cuenta de supervisor autorizada, calibración ambiental de faena y una cuadrilla de prueba sin bloqueos.
        </p>

        {/* Credentials Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span>Credenciales Oficiales de Prueba:</span>
            <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Pre-Aprobado ✓
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">RUT Supervisor:</span>
              <strong className="text-slate-900">12.080.702-1</strong>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">PIN / Contraseña:</span>
              <strong className="text-slate-900">1234</strong>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">Faena Minera:</span>
              <strong className="text-slate-900">Minera Escondida</strong>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 text-[10px] block font-sans">Altitud / GPS:</span>
              <strong className="text-slate-900">3.100 msnm (Nativa)</strong>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {appliedSuccess ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>✓ Modo Revisor Google Play activado con éxito.</span>
          </div>
        ) : (
          <button
            id="apply-google-play-reviewer-demo-btn"
            type="button"
            onClick={handle1ClickReviewerSetup}
            disabled={isApplying}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isApplying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Calibrando entorno para revisión...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Activar Acceso Rápido Revisor Google Play</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
