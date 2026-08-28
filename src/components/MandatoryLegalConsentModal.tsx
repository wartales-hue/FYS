import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  CheckCircle2, 
  Scale, 
  Building2,
  AlertCircle,
  X,
  FileSignature
} from 'lucide-react';
import { WorkerProfile } from '../types';
import { OpliraLogo } from './OpliraLogo';

interface MandatoryLegalConsentModalProps {
  isOpen: boolean;
  onClose?: () => void;
  worker: WorkerProfile;
  onAccept: (consentDetails: {
    timestamp: string;
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
    acceptedDutyOfDisclosure: boolean;
    signatureDigital: string;
  }) => void;
}

export const MandatoryLegalConsentModal: React.FC<MandatoryLegalConsentModalProps> = ({
  isOpen,
  onClose,
  worker,
  onAccept
}) => {
  const [acceptedSingleConsent, setAcceptedSingleConsent] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState(worker?.name || '');

  useEffect(() => {
    if (worker?.name) {
      setDigitalSignature(worker.name);
    }
  }, [worker?.name, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!acceptedSingleConsent) return;
    onAccept({
      timestamp: new Date().toISOString(),
      acceptedTerms: true,
      acceptedPrivacy: true,
      acceptedDutyOfDisclosure: true,
      signatureDigital: digitalSignature.trim() || worker.name || 'Trabajador Autorizado'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Branding */}
        <div className="p-3.5 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-1 rounded-xl bg-slate-800/80 border border-slate-700 shadow-xs flex-shrink-0">
              <OpliraLogo size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Scale className="w-3 h-3" />
                  Marco Legal & Exención
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  DS 44 / Ley 21.719
                </span>
              </div>
              <h2 className="text-xs sm:text-base font-bold tracking-tight text-white mt-0.5 leading-snug">
                Declaración de Exención y Responsabilidad
              </h2>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Extensive Legal Document Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed flex-1 bg-white">
          
          {/* Official Framing Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
            <span className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Declaración de Exención Individual de Responsabilidad por Uso de la Aplicación
            </span>
            <p className="text-[11px] text-amber-800 font-medium">
              (Versión Final Integrada – Lista para App)
            </p>
            <p className="text-[11.5px] leading-relaxed text-amber-900">
              El presente documento establece el marco regulatorio, condiciones de uso y deslinde de responsabilidades del sistema de gestión preventiva de fatiga y somnolencia, en conformidad con el Artículo 184 del Código del Trabajo, el Decreto Supremo N° 44 y la Ley N° 21.719 sobre Protección de Datos Personales.
            </p>
          </div>

          {/* Full Structured Clauses (Versión Final Integrada) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4 text-slate-800 text-[11.5px]">
            
            {/* Clause 1 */}
            <div className="border-b border-slate-200 pb-3.5">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <span>1.</span> Naturaleza y propósito de la aplicación
              </h3>
              <p className="text-slate-700 mt-1.5 leading-relaxed">
                Esta aplicación es una herramienta informativa y de apoyo, destinada exclusivamente a orientar la gestión de riesgos asociados a fatiga y somnolencia. Su contenido es referencial y no reemplaza evaluaciones médicas, decisiones de supervisión, criterios profesionales ni procedimientos internos de la empresa.
              </p>
            </div>

            {/* Clause 2 */}
            <div className="border-b border-slate-200 pb-3.5">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <span>2.</span> Alcance y limitación de responsabilidad del desarrollador
              </h3>
              <div className="text-slate-700 mt-1.5 space-y-1.5 leading-relaxed">
                <p>
                  El desarrollador, proveedor o propietario de la aplicación no presta servicios médicos, técnicos, laborales ni de seguridad, y el uso de la herramienta no genera relación contractual, profesional ni de dependencia entre el trabajador y el desarrollador.
                </p>
                <p>
                  El desarrollador queda exento de responsabilidad por cualquier consecuencia derivada del uso, mal uso, interpretación, error, omisión o dependencia de la información generada por la aplicación, incluyendo fallas técnicas del dispositivo, pérdida de datos, interrupciones de funcionamiento o errores de procesamiento.
                </p>
              </div>
            </div>

            {/* Clause 3 */}
            <div className="border-b border-slate-200 pb-3.5">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <span>3.</span> Interpretación y decisiones personales
              </h3>
              <div className="text-slate-700 mt-1.5 space-y-1.5 leading-relaxed">
                <p>
                  El trabajador declara que cualquier interpretación de los datos entregados por la aplicación, así como cualquier acción personal derivada de dicha información, es de carácter individual y no genera responsabilidad alguna para el desarrollador.
                </p>
                <p>
                  La aplicación no determina aptitud laboral, no autoriza ni restringe tareas, y no sustituye evaluaciones médicas, controles de supervisión ni decisiones de la empresa empleadora.
                </p>
              </div>
            </div>

            {/* Clause 4 */}
            <div className="border-b border-slate-200 pb-3.5">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <span>4.</span> Uso responsable y límites operacionales
              </h3>
              <p className="text-slate-700 mt-1 leading-relaxed">
                El trabajador comprende que:
              </p>
              <ul className="mt-1.5 space-y-1.5 pl-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>La aplicación es un apoyo referencial, no un sistema de control operacional.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Los resultados pueden variar según condiciones personales, ambientales o tecnológicas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>La aplicación no garantiza la ausencia de riesgos asociados a fatiga o somnolencia.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>La responsabilidad por decisiones operacionales corresponde exclusivamente a la empresa empleadora y a los profesionales competentes.</span>
                </li>
              </ul>
            </div>

            {/* Clause 5 */}
            <div className="border-b border-slate-200 pb-3.5">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <span>5.</span> No afectación de derechos laborales
              </h3>
              <div className="text-slate-700 mt-1.5 space-y-1.5 leading-relaxed">
                <p>
                  Esta declaración no limita, no restringe y no afecta derechos laborales del trabajador, ni constituye renuncia a acciones derivadas de la relación laboral con la empresa empleadora.
                </p>
                <p>
                  El trabajador mantiene íntegramente sus derechos conforme al Código del Trabajo, normativa de seguridad y salud ocupacional y políticas internas de la organización.
                </p>
              </div>
            </div>

            {/* Clause 6 */}
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <span>6.</span> Consentimiento informado
              </h3>
              <p className="text-slate-700 mt-1 leading-relaxed">
                Al utilizar esta aplicación, el trabajador declara que:
              </p>
              <ul className="mt-1.5 space-y-1.5 pl-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Ha leído y comprendido esta declaración.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Reconoce que la aplicación es un apoyo informativo, no un mecanismo de diagnóstico ni certificación.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Acepta que el desarrollador queda exento de responsabilidad por cualquier consecuencia derivada del uso de la aplicación en el ámbito personal o laboral.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Comprende que la gestión de riesgos, evaluaciones de aptitud y decisiones operacionales corresponden exclusivamente a la empresa empleadora.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Acceptance Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col gap-3 flex-shrink-0">
          <label className="flex items-start gap-3 p-3 bg-white border border-slate-300 rounded-2xl cursor-pointer hover:border-slate-400 transition-colors shadow-2xs">
            <input
              id="accept-extensive-legal-consent-checkbox"
              type="checkbox"
              checked={acceptedSingleConsent}
              onChange={(e) => setAcceptedSingleConsent(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 flex-shrink-0 cursor-pointer"
            />
            <span className="text-xs text-slate-900 font-bold leading-relaxed select-none">
              Declaro haber leído, comprender y aceptar íntegramente la Declaración de Exención Individual de Responsabilidad por Uso de la Aplicación, el Consentimiento Informado (Art. 184 CT) y las Políticas de Privacidad (Ley N° 21.719).
            </span>
          </label>

          <button
            id="confirm-extensive-legal-consent-btn"
            type="button"
            disabled={!acceptedSingleConsent}
            onClick={handleConfirm}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Aceptar Declaración y Continuar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
