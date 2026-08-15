import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  ChevronRight, 
  UserCheck, 
  Scale, 
  HeartHandshake,
  ExternalLink
} from 'lucide-react';
import { WorkerProfile } from '../types';
import { OpliraLogo } from './OpliraLogo';

interface MandatoryLegalConsentModalProps {
  isOpen: boolean;
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
  worker,
  onAccept
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'informed_consent' | 'liability_waiver' | 'privacy'>('summary');
  const [checkTerms, setCheckTerms] = useState(false);
  const [checkPrivacy, setCheckPrivacy] = useState(false);
  const [checkDuty, setCheckDuty] = useState(false);
  const [understoodNonMedical, setUnderstoodNonMedical] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState(worker.name || '');

  // Keep digital signature synchronized whenever worker profile updates or modal opens
  useEffect(() => {
    if (worker?.name) {
      setDigitalSignature(worker.name);
    }
  }, [worker?.name, isOpen]);

  if (!isOpen) return null;

  const canAccept = checkTerms && checkPrivacy && checkDuty && understoodNonMedical && digitalSignature.trim().length >= 3;

  const handleConfirm = () => {
    if (!canAccept) return;
    onAccept({
      timestamp: new Date().toISOString(),
      acceptedTerms: checkTerms,
      acceptedPrivacy: checkPrivacy,
      acceptedDutyOfDisclosure: checkDuty,
      signatureDigital: digitalSignature.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Branding */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 shadow-xs">
              <OpliraLogo size={36} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5" />
                  Marco Regulatorio & Legal Oplira
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Obligatorio Pre-Acceso
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                Consentimiento Informado y Exención de Responsabilidad
              </h2>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-xs text-slate-400">
            <span>Operador: <strong className="text-slate-200">{worker.name}</strong></span>
            <span className="font-mono text-[11px]">RUT: {worker.rut}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'summary'
                ? 'border-amber-600 text-amber-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            1. Resumen Obligatorio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('informed_consent')}
            className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'informed_consent'
                ? 'border-amber-600 text-amber-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            2. Consentimiento Informado
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('liability_waiver')}
            className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'liability_waiver'
                ? 'border-amber-600 text-amber-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            3. Delimitación y Exención Legal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-amber-600 text-amber-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            4. Privacidad y Ley 21.719
          </button>
        </div>

        {/* Scrollable Legal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed flex-1 bg-white">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span>Declaración y Aceptación Previa al Uso del Sistema</span>
                </div>
                <p>
                  En cumplimiento del <strong>Decreto Supremo N° 44 (Reglamento de Seguridad Minera)</strong>, el <strong>Código del Trabajo de Chile</strong> y la <strong>Ley N° 21.719 de Protección de Datos</strong>, el acceso a la plataforma Oplira FYS HSEC requiere la autorización expresa e informada del trabajador u operador antes de su primera interacción.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Finalidad Exclusivamente Preventiva
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    El sistema evalúa el estado de alerta psicomotora pre-turno para proteger tu vida e integridad. <strong>No es una evaluación de desempeño ni habilita sanciones disciplinarias</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Deber de Declaración Fidedigna
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    Te comprometes a responder con estricta veracidad sobre tus horas reales de sueño, consumo de fármacos inductores de somnolencia y fatiga física percibida.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    Naturaleza No Médica Vinculante
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    Oplira es una herramienta tecnológica de tamizaje de riesgo operacional. No sustituye diagnósticos médicos clínicos, exámenes neurológicos ni peritajes de salud ocupacional.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Lock className="w-4 h-4 text-blue-600" />
                    Segregación y Confidencialidad
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    La supervisión solo recibe el semáforo operacional y la medida preventiva requerida. Tu historial de salud está aislado y protegido bajo secreto médico ocupacional.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'informed_consent' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Documento Oficial de Consentimiento Informado (Art. 184 Código del Trabajo)
              </h3>
              <p>
                Yo, <strong>{worker.name}</strong>, RUT <strong>{worker.rut}</strong>, en mi calidad de trabajador/a dependiente o contratista con funciones operacionales en <strong>{worker.faena}</strong> ({worker.company}), declaro haber sido debidamente informado/a y consiento voluntariamente en:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                <li>
                  <strong>Participación en Pruebas Psicomotoras:</strong> Realizar de forma previa al inicio del turno la prueba psicomotora de tiempo de reacción (PVT / Micro-PVT) y el autoreporte de estado de vigilancia (KSS y Encuesta FYS).
                </li>
                <li>
                  <strong>Monitoreo de Telemetría Ambiental:</strong> Autorizar la vinculación de coordenadas GPS y altitud de faena para la calibración del impacto de hipoxia y factores climáticos según el DS 44.
                </li>
                <li>
                  <strong>Aplicación de Protocolos de Mitigación:</strong> En caso de que el algoritmo compute un semáforo de riesgo moderado o crítico (Amarillo o Rojo), aceptar la aplicación inmediata de medidas de control (pausa activa de recuperación, rotación de equipo o siesta programada) coordinadas por la supervisión de turno.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'liability_waiver' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-600" />
                Cláusula de Delimitación y Exención de Responsabilidad
              </h3>
              <div className="space-y-2 text-slate-700 text-[11px] leading-relaxed">
                <p>
                  <strong>1. Alcance Técnico del Software:</strong> La plataforma Oplira FYS HSEC es un software de soporte a la prevención de riesgos por fatiga y somnolencia basado en modelos matemáticos circadiano-psicomotores. <strong>No constituye una garantía absoluta de ausencia de incidentes</strong>, ni exime al trabajador de su deber de cuidado personal y cumplimiento de los procedimientos de seguridad de la faena.
                </p>
                <p>
                  <strong>2. Deber Continuo de Auto-Reporte:</strong> Un resultado "Verde" (Apto para Operar) al inicio del turno no exime al trabajador de la obligación legal y contractual de detener su equipo y notificar de inmediato a su jefatura directa si experimenta síntomas sobrevinientes de somnolencia, fatiga extrema o indisposición física durante el transcurso de la jornada laboral.
                </p>
                <p>
                  <strong>3. Veracidad de la Información Proporcionada:</strong> El trabajador asume la total responsabilidad por la exactitud de los datos de descanso, horarios y consumo de sustancias ingresados en la aplicación. La empresa proveedora de la tecnología y la compañía mandante quedan eximidas de responsabilidad por evaluaciones desvirtuadas a causa de omisiones o declaraciones falsas del usuario.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Tratamiento de Datos Personales y Sensibles (Ley N° 21.719)
              </h3>
              <p>
                Los datos recolectados se encuentran protegidos bajo estándares de seguridad informática y encriptación local. Se garantiza:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-[11px]">
                <li><strong>No Almacenamiento Biométrico Facial:</strong> Las validaciones psicomotoras se computan a través de eventos táctiles en pantalla (milisegundos) sin almacenamiento de imágenes o video en servidores externos.</li>
                <li><strong>Trazabilidad Criptográfica:</strong> Cada evaluación genera un identificador hash SHA-256 inalterable para auditorías de HSEC y fiscalizaciones de Sernageomin.</li>
                <li><strong>Derechos ARCO:</strong> Derecho permanente de Acceso, Rectificación, Cancelación y Oposición dirigiéndose al Delegado de Protección de Datos de faena.</li>
              </ul>
            </div>
          )}

          {/* Mandatory Checkboxes */}
          <div className="pt-2 border-t border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900">
              Marque las siguientes casillas para autorizar y habilitar el sistema:
            </h4>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                id="consent-check-terms"
                type="checkbox"
                checked={checkTerms}
                onChange={(e) => setCheckTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs text-slate-800">
                <strong>He leído y acepto los Términos de Uso, Consentimiento Informado y Exención de Responsabilidades</strong> de Oplira FYS HSEC v2.0.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                id="consent-check-duty"
                type="checkbox"
                checked={checkDuty}
                onChange={(e) => setCheckDuty(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs text-slate-800">
                <strong>Declaro bajo juramento que toda la información que ingresaré</strong> sobre mis horas de descanso, condición fisiológica y consumo de fármacos será fidedigna y veraz.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                id="consent-check-nonmedical"
                type="checkbox"
                checked={understoodNonMedical}
                onChange={(e) => setUnderstoodNonMedical(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs text-slate-800">
                <strong>Entiendo que esta es una herramienta preventiva de tamizaje operacional</strong> y que mantengo el deber de informar a mi supervisión si siento fatiga sobreviniente durante la jornada.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                id="consent-check-privacy"
                type="checkbox"
                checked={checkPrivacy}
                onChange={(e) => setCheckPrivacy(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs text-slate-800">
                <strong>Autorizo el tratamiento de mis datos de turno y registros psicomotores</strong> para fines exclusivos de prevención HSEC y cumplimiento del DS 44 (Ley N° 21.719).
              </span>
            </label>

            {/* Digital Signature Confirmation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Firma Digital / Nombre Completo del Trabajador:
              </label>
              <input
                id="digital-signature-input"
                type="text"
                value={digitalSignature}
                onChange={(e) => setDigitalSignature(e.target.value)}
                placeholder="Escriba su nombre y apellido"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            {!canAccept ? (
              <span className="text-amber-800 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Debe marcar todas las casillas y firmar digitalmente para habilitar el sistema.
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Documentación completa y lista para autorización.
              </span>
            )}
          </div>

          <button
            id="accept-mandatory-legal-consent-btn"
            type="button"
            onClick={handleConfirm}
            disabled={!canAccept}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Autorizar y Continuar al Sistema</span>
          </button>
        </div>
      </div>
    </div>
  );
};
