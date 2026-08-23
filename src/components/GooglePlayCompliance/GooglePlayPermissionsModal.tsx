import React from 'react';
import { MapPin, Camera, MicOff, ShieldCheck, CheckCircle2, X, AlertCircle, Sparkles, Smartphone } from 'lucide-react';

interface GooglePlayPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GooglePlayPermissionsModal: React.FC<GooglePlayPermissionsModalProps> = ({
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
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Cumplimiento Google Play Permissions Policy
              </span>
              <h2 className="text-base font-bold text-white leading-tight">
                Transparencia de Permisos del Dispositivo (Primer Plano y Cero Audio)
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
          <p className="text-slate-600 text-xs">
            Para garantizar la máxima privacidad de los trabajadores en faena conforme a las políticas de Google Play y la Ley N° 21.719, Oplira opera bajo el principio de <strong>minimización estricta de permisos</strong>:
          </p>

          <div className="space-y-3">
            {/* 1. Ubicación solo en primer plano */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>1. Ubicación (GPS) — Solo Mientras la App Está en Uso (Foreground Only)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  En Uso Únicamente
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                La ubicación se consulta de forma puntual al iniciar la autoevaluación pre-turno para determinar las coordenadas y altitud sobre el nivel del mar (msnm) de la faena minera. <strong>NO se rastrea la ubicación en segundo plano (Background) ni cuando la pantalla está apagada.</strong>
              </p>
            </div>

            {/* 2. Cámara para QR */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 flex items-center gap-2 text-xs">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>2. Cámara del Dispositivo — Escaneo de Códigos QR</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                  Solo Escaneo QR
                </span>
              </div>
              <p className="text-[11px] text-blue-900 leading-relaxed">
                La cámara se activa exclusivamente cuando el usuario presiona voluntariamente el botón para escanear el código QR de una credencial de supervisor o un pase de cuadrilla. <strong>No se capturan fotografías faciales, ni se almacenan imágenes en servidores externos.</strong>
              </p>
            </div>

            {/* 3. Audio / Micrófono: Eliminado y Cero Uso */}
            <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                  <MicOff className="w-4 h-4 text-slate-600" />
                  <span>3. Micrófono / Grabación de Audio — 0% Utilizado (Eliminado)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300 font-mono">
                  SIN ACCESO A AUDIO
                </span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                <strong>Oplira NO solicita permiso de grabación de audio (RECORD_AUDIO).</strong> La aplicación no escucha, no graba ni procesa sonidos ambientales ni voz del trabajador en ninguna circunstancia.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            Conforme con las Directrices de Seguridad de Datos de Google Play Console
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
