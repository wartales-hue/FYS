import React from 'react';
import { AlertCircle, X, ShieldAlert, CheckCircle } from 'lucide-react';

interface RutErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rutEntered: string;
  errorMessage?: string;
}

export const RutErrorModal: React.FC<RutErrorModalProps> = ({
  isOpen,
  onClose,
  rutEntered,
  errorMessage
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-900 relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0 text-red-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              RUT Incorrecto o Inválido
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Validación de Identidad Oficial (Módulo 11)
            </p>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-xs text-red-950 space-y-2">
          <p className="font-semibold text-red-900">
            El RUT ingresado <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-red-300">"{rutEntered || '(vacío)'}"</span> no superó la verificación algorítmica.
          </p>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            {errorMessage || 'El dígito verificador no coincide con la serie numérica ingresada o el formato no cumple el estándar nacional chileno.'}
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
          <span className="font-bold text-slate-800 block">Ejemplos de formatos válidos:</span>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>12.345.678-5</strong> o <strong>12345678-5</strong></li>
            <li><strong>8.765.432-K</strong> o <strong>8765432-k</strong></li>
          </ul>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Corregir RUT
          </button>
        </div>
      </div>
    </div>
  );
};
