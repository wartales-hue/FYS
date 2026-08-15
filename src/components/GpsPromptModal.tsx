import React from 'react';
import { MapPinOff, AlertTriangle, Settings, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface GpsPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorMessage?: string | null;
}

export const GpsPromptModal: React.FC<GpsPromptModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  errorMessage
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 text-slate-900 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 text-amber-600">
            <MapPinOff className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Datos de GPS No Disponibles
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocolo HSEC Oplira • Ubicación y Altitud de Faena
            </p>
          </div>
        </div>

        {/* Explanation & Instructions */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5 text-xs text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Sugerencia de Habilitación de Ubicación</span>
          </p>
          <p>
            No pudimos obtener automáticamente las coordenadas ni la altitud de tu faena. Para una calibración climática y de hipoxia precisa según DS 44, te sugerimos habilitar el GPS:
          </p>
          <ul className="space-y-1 pl-4 list-disc text-slate-600">
            <li>Activa la <strong>Ubicación / GPS</strong> en los ajustes de tu dispositivo o tablet.</li>
            <li>Concede permiso de <strong>Ubicación precisa</strong> en el navegador.</li>
            <li>Si estás en mina subterránea o sin señal satelital, se aplicarán las coordenadas por defecto de faena.</li>
          </ul>

          {errorMessage && (
            <div className="mt-2 p-2 rounded bg-amber-100/70 border border-amber-200 text-[11px] text-amber-900 font-mono">
              Detalle: {errorMessage}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Continuar con Faena por Defecto
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar Lectura GPS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
