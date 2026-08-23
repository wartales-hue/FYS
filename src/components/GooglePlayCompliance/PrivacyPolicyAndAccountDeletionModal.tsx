import React, { useState } from 'react';
import { 
  Trash2, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Globe, 
  FileText, 
  RefreshCw,
  UserX,
  Database
} from 'lucide-react';
import { clearStoredState } from '../../lib/offlineStore';
import { deactivateGooglePlaySubscription } from '../../lib/premiumService';

interface PrivacyPolicyAndAccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRut?: string;
  userName?: string;
  onAccountDeleted?: () => void;
}

export const PrivacyPolicyAndAccountDeletionModal: React.FC<PrivacyPolicyAndAccountDeletionModalProps> = ({
  isOpen,
  onClose,
  userRut = '',
  userName = '',
  onAccountDeleted
}) => {
  const [activeTab, setActiveTab] = useState<'privacy_policy' | 'account_deletion' | 'web_request'>('privacy_policy');
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExecuteAccountDeletion = () => {
    if (confirmInput.trim().toUpperCase() !== 'ELIMINAR') return;

    setIsDeleting(true);

    setTimeout(() => {
      // 1. Purge offline SQLite/IndexedDB & LocalStorage
      clearStoredState();

      // 2. Clear Google Play subscription local binding & hardware session
      deactivateGooglePlaySubscription();

      // 3. Clear sensitive session items
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn('Storage purge warning:', e);
      }

      setIsDeleting(false);
      setDeletionSuccess(true);

      setTimeout(() => {
        onAccountDeleted?.();
        window.location.reload();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden text-slate-900 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                Cumplimiento Google Play Data Safety & Account Deletion Policy
              </span>
              <h2 className="text-base font-bold text-white leading-tight">
                Política de Privacidad y Eliminación de Cuenta / Datos Personales
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('privacy_policy')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy_policy'
                ? 'border-blue-600 text-blue-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            1. Política de Privacidad
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account_deletion')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'account_deletion'
                ? 'border-rose-600 text-rose-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-rose-700'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>2. Eliminar Mi Cuenta y Datos (In-App)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('web_request')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'web_request'
                ? 'border-indigo-600 text-indigo-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-indigo-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>3. Solicitud Web de Borrado (Play Store URL)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed bg-white flex-1">
          {/* Tab 1: Privacy Policy */}
          {activeTab === 'privacy_policy' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-blue-950">
                <span className="font-bold text-xs flex items-center gap-1.5 text-blue-900">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Marco de Protección de Datos (Ley N° 21.719 / Ley N° 19.628 / GDPR)
                </span>
                <p className="text-[11px] leading-relaxed">
                  Oplira SGFS HSEC trata la información de los trabajadores bajo principios de licitud, finalidad preventiva, proporcionalidad y minimización.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  Resumen de Tratamiento de Datos (Play Console Data Safety Form):
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900">Datos Recopilados:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      <li>Nombre, RUT, faena y empresa operadora.</li>
                      <li>Horas de descanso autoreportadas.</li>
                      <li>Latencias de reacción psicomotora en milisegundos (Micro-PVT).</li>
                      <li>Ubicación GPS puntual en primer plano (solo para altitud).</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900">Datos que NUNCA Recopilamos:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      <li><strong>NO grabamos audio ni micrófonos.</strong></li>
                      <li>NO guardamos fotografías faciales ni biometría visual.</li>
                      <li>NO rastreamos ubicación en segundo plano.</li>
                      <li>NO vendemos ni compartimos datos con brokers publicitarios.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: In-App Account Deletion (Google Play Mandate) */}
          {activeTab === 'account_deletion' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-950">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Eliminación Definitiva de Cuenta y Datos Personales</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Conforme a la <strong>Política de Eliminación de Cuentas de Google Play</strong> y el derecho de cancelación de la <strong>Ley N° 21.719</strong>, puedes purgar en cualquier momento toda tu información personal, historial de pruebas psicomotoras y tokens de suscripción almacenados en este dispositivo.
                </p>
              </div>

              {deletionSuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-950 text-sm">Cuenta y Datos Eliminados Exitosamente</h4>
                  <p className="text-xs text-emerald-800">
                    Se han purgado todos los registros locales y tokens criptográficos. La aplicación se reiniciará...
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 text-xs">Datos a ser eliminados inmediatamente:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      <li>Perfil del trabajador (Nombre: <strong>{userName || 'Operador'}</strong>, RUT: <strong>{userRut || 'Registrado'}</strong>).</li>
                      <li>Historial de evaluaciones de fatiga y latencias Micro-PVT.</li>
                      <li>Vinculación criptográfica de hardware y contraseñas maestras.</li>
                      <li>Registros de bitácora e intervenciones de turno.</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-rose-900 block">
                      Para confirmar, escribe la palabra <span className="font-mono font-black text-rose-600">ELIMINAR</span> a continuación:
                    </label>
                    <input
                      id="confirm-delete-account-input"
                      type="text"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      placeholder="Escribe ELIMINAR"
                      className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-lg focus:outline-none focus:border-rose-600 font-mono font-bold text-rose-900"
                    />

                    <button
                      id="execute-account-deletion-btn"
                      type="button"
                      onClick={handleExecuteAccountDeletion}
                      disabled={confirmInput.trim().toUpperCase() !== 'ELIMINAR' || isDeleting}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {isDeleting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Purgando datos y credenciales criptográficas...</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4" />
                          <span>Eliminar Definitivamente Mi Cuenta y Datos</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Web Request Form (Public URL for Google Play Console Form) */}
          {activeTab === 'web_request' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1 text-indigo-950">
                <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-900">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  URL Pública de Solicitud de Borrado (Requisito Google Play 2024)
                </span>
                <p className="text-[11px] leading-relaxed">
                  Si un usuario desinstaló la aplicación y desea solicitar el borrado de sus datos sin reinstalar la app, puede hacerlo a través de la siguiente dirección web oficial:
                </p>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 font-mono text-xs">
                <div className="text-slate-400 text-[10px] uppercase">Enlace público de privacidad & borrado:</div>
                <div className="text-amber-400 font-bold break-all">
                  https://oplira-frms.cl/privacy/delete-account
                </div>
                <p className="text-[10px] text-slate-400 font-sans">
                  Tiempo de respuesta garantizado: Menos de 48 horas hábiles conforme a la normativa legal vigente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Google Play Data Safety Standard • ISO 27001 Ready
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
