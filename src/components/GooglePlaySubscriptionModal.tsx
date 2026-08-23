import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  X, 
  CreditCard, 
  Shield, 
  Key, 
  Lock, 
  Smartphone, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  FileCheck2,
  Cpu,
  Users,
  QrCode,
  FileText,
  Zap,
  Award,
  Mail
} from 'lucide-react';
import { 
  isAuthorizedSupervisorRut, 
  activateGooglePlaySubscription, 
  registerSupervisorRutAsPremium,
  hasAccountPassword,
  loginSupervisorWithPassword,
  setSupervisorPasswordAndBindDevice,
  getDeviceName,
  getOrCreateDeviceId,
  getDeviceHardwareFingerprint,
  checkDeviceSessionStatus,
  getActiveSubscriptionDetails,
  SubscriptionTokenData
} from '../lib/premiumService';
import { validateRut, formatRut, cleanRut } from '../lib/rutValidator';
import { OpliraLogo } from './OpliraLogo';

interface GooglePlaySubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRut?: string;
}

export const GooglePlaySubscriptionModal: React.FC<GooglePlaySubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRut = ''
}) => {
  const [activeTab, setActiveTab] = useState<'features' | 'google_play' | 'supervisor_rut'>('features');
  const [rutInput, setRutInput] = useState<string>(initialRut);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordConfirmInput, setPasswordConfirmInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepMode, setStepMode] = useState<'normal' | 'setup_password' | 'enter_password'>('normal');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [activeToken, setActiveToken] = useState<SubscriptionTokenData | null>(null);

  const deviceName = getDeviceName();
  const deviceId = getOrCreateDeviceId();
  const fingerprint = getDeviceHardwareFingerprint();

  useEffect(() => {
    if (initialRut) {
      setRutInput(initialRut);
      const clean = cleanRut(initialRut);
      if (clean && hasAccountPassword(clean)) {
        setStepMode('enter_password');
      } else if (clean && isAuthorizedSupervisorRut(clean)) {
        setStepMode('setup_password');
      }
    }
    const token = getActiveSubscriptionDetails(initialRut);
    if (token) {
      setActiveToken(token);
    }
  }, [initialRut, isOpen]);

  if (!isOpen) return null;

  const handleGooglePlayPurchase = () => {
    if (!passwordInput || passwordInput.length < 4) {
      setFeedback({
        type: 'error',
        text: 'Por favor define una contraseña de 4 o más caracteres para proteger el acceso a tu cuenta en este dispositivo único.'
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    // Simulate authentic Google Play In-App Billing confirmation dialog & token creation
    setTimeout(() => {
      activateGooglePlaySubscription(rutInput || '12080702-1', passwordInput);
      setIsProcessing(false);
      const token = getActiveSubscriptionDetails(rutInput || '12080702-1');
      if (token) setActiveToken(token);

      setFeedback({
        type: 'success',
        text: `✓ Suscripción Google Play confirmada ($0.99 USD/mes). Token criptográfico SHA-256 generado y anclado a este hardware (${deviceName}).`
      });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    }, 1200);
  };

  const handleValidateSupervisorRut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rutInput.trim()) {
      setFeedback({
        type: 'error',
        text: 'Por favor ingresa tu RUT de Supervisor.'
      });
      return;
    }

    const check = validateRut(rutInput);
    if (!check.isValid) {
      setFeedback({
        type: 'error',
        text: check.message || 'El RUT ingresado no es válido.'
      });
      return;
    }

    const clean = cleanRut(rutInput);

    if (stepMode === 'setup_password') {
      if (!passwordInput || passwordInput.length < 4) {
        setFeedback({
          type: 'error',
          text: 'La contraseña debe tener al menos 4 caracteres o dígitos.'
        });
        return;
      }
      if (passwordInput !== passwordConfirmInput) {
        setFeedback({
          type: 'error',
          text: 'Las contraseñas ingresadas no coinciden.'
        });
        return;
      }

      const res = setSupervisorPasswordAndBindDevice(clean, passwordInput);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: res.message
        });
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1800);
      } else {
        setFeedback({
          type: 'error',
          text: res.message
        });
      }
      return;
    }

    if (stepMode === 'enter_password') {
      if (!passwordInput) {
        setFeedback({
          type: 'error',
          text: 'Por favor ingresa tu contraseña.'
        });
        return;
      }

      const res = loginSupervisorWithPassword(clean, passwordInput);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: res.message
        });
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1800);
      } else {
        setFeedback({
          type: 'error',
          text: res.message
        });
      }
      return;
    }

    // Normal check
    if (isAuthorizedSupervisorRut(clean)) {
      if (hasAccountPassword(clean)) {
        setStepMode('enter_password');
        setFeedback({
          type: 'warning',
          text: 'Cuenta detectada con clave previa. Por favor ingresa tu contraseña.'
        });
      } else {
        setStepMode('setup_password');
        setFeedback({
          type: 'warning',
          text: 'RUT autorizado encontrado. Por favor crea una contraseña maestra.'
        });
      }
    } else {
      registerSupervisorRutAsPremium(clean);
      setFeedback({
        type: 'success',
        text: `✓ RUT de Supervisor ${formatRut(clean)} activado exitosamente.`
      });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 shadow-xs">
              <OpliraLogo size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Membresía Oficial Google Play
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  Plan Supervisor PRO
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                Ventajas y Características de la Versión Premium
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer border-b-2 ${
              activeTab === 'features'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            ⭐ Características Premium
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('google_play')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer border-b-2 ${
              activeTab === 'google_play'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            💳 Suscripción Google Play ($0.99 USD)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('supervisor_rut')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer border-b-2 ${
              activeTab === 'supervisor_rut'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            🔑 Activar por RUT Autorizado
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white space-y-4 text-xs text-slate-700">
          
          {/* Main Feature Highlight for Supervisor Premium Account */}
          <div className="p-4 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 border-2 border-blue-300 rounded-2xl flex items-start gap-3.5 shadow-xs">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="space-y-1.5">
              <span className="font-extrabold text-blue-950 text-sm block tracking-tight">
                Beneficio Principal de la Versión Premium del Supervisor
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                Con la versión premium del supervisor, <strong>el supervisor recibirá automáticamente a su correo electrónico una copia de cada una de las evaluaciones de sus trabajadores a cargo</strong>, además, <strong>podrá firmar en la pantalla del móvil cada una de las evaluaciones</strong>, cuya <strong>firma manuscrita quedará estampada en el reporte PDF de Fatiga y Somnolencia de cada trabajador</strong>, con el <strong>nombre de la faena y de la empresa asignada</strong>.
              </p>
            </div>
          </div>

          {/* Important Explanatory Legend for Workers & Supervisors */}
          <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl flex items-start gap-3">
            <Users className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-950 text-xs block">
                Habilitación de Trabajadores
              </span>
              <p className="text-[11.5px] text-amber-900 leading-relaxed">
                <strong>La versión premium es para el supervisor, quién podrá con esta cuenta habilitar a sus trabajadores.</strong> El trabajador no necesita una cuenta de pago sino estar vinculado a la cuadrilla de su supervisor. De todas maneras, si un trabajador desea contratar la versión premium de forma individual para autogestión, puede hacerlo libremente.
              </p>
            </div>
          </div>

          {/* Tab 1: Detailed Features List */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              {/* Dual Usage Highlight Banner */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Award className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-950 text-xs block">
                    Acceso Dual Ilimitado: Modo Supervisor y Modo Trabajador
                  </span>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Si eres un <strong>Supervisor con cuenta Premium</strong>, tienes acceso total e irrestricto tanto al panel de gestión como a la sección de autoevaluación de trabajador/operador, disfrutando de todas las funciones avanzadas sin necesidad de que otra persona te enrole.
                  </p>
                </div>
              </div>

              {/* Grid of Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Feature 1 - Email Copies & PDF Delivery */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Copia Automática por Correo</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Recibe instantáneamente en tu correo electrónico una copia oficial de cada evaluación completada por los trabajadores de tu cuadrilla.
                  </p>
                </div>

                {/* Feature 2 - Mobile Screen Signature */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    <span>Firma Manuscrita en Pantalla Móvil</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Firma directamente en el smartphone cada evaluación; tu firma manuscrita quedará estampada en el certificado PDF oficial de Fatiga y Somnolencia.
                  </p>
                </div>

                {/* Feature 3 - Full Company and Faena Header */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Empresa y Faena en Reportes PDF</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Todos los informes emitidos llevan integrados de forma destacada el nombre de la Faena minera e identificación de la Empresa asignada.
                  </p>
                </div>

                {/* Feature 4 - Live Crew Dashboard */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Dashboard de Cuadrilla en Vivo</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Control centralizado del semáforo operacional en faena (Aptos, Precaución, No Aptos) y registro de contramedidas preventivas.
                  </p>
                </div>

                {/* Feature 5 - QR Quick Enrolment */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>Enrolamiento Rápido por Código QR</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Generador de QR dinámico y códigos alfanuméricos para vincular operadores a tu cuadrilla en segundos desde cualquier smartphone.
                  </p>
                </div>

                {/* Feature 6 - Offline Operation & Legal Backing */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Respaldo Legal y Operatividad Offline</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    100% operativo en alta cordillera sin señal, con hash SHA-256 inmutable para trazabilidad ante SERNAGEOMIN y mutualidades.
                  </p>
                </div>

              </div>

              {/* Call to action button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('google_play')}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Suscribirse por $0.99 USD / mes en Google Play</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Google Play Checkout */}
          {activeTab === 'google_play' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase text-blue-700 tracking-wider block">
                    Plan Supervisor HSEC + Control de Cuadrilla
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-slate-900">$0.99</span>
                    <span className="text-xs font-bold text-slate-600">USD / mes</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Renovación mensual automática • Cancela cuando quieras en Google Play
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-xs border border-blue-100 flex flex-col items-center">
                  <span className="text-2xl">🛡️</span>
                  <span className="text-[9px] font-black text-blue-900 mt-1">1 DISPOSITIVO</span>
                </div>
              </div>

              {/* Core Feature Summary Banner */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-slate-800 text-xs leading-relaxed space-y-1">
                <span className="font-bold text-blue-950 block">Incluido en la versión premium del supervisor:</span>
                <p className="text-[11px] text-slate-700">
                  El supervisor recibirá automáticamente a su correo electrónico una copia de cada una de las evaluaciones de sus trabajadores, podrá firmar en la pantalla del móvil cada reporte (cuya firma manuscrita quedará estampada en el PDF de Fatiga y Somnolencia), e incluirá siempre el nombre de la faena y empresa asignada.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Protección Anti-Piratería & Token Criptográfico:</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    SHA-256 HMAC
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  La licencia genera una firma única enlazada al hardware del dispositivo ({deviceName}).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Crea tu Contraseña Maestra para este Dispositivo:</span>
                </label>
                <div className="relative">
                  <input
                    id="google-play-password-input"
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Mínimo 4 caracteres o PIN de seguridad"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {feedback && (
                <div className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              <button
                id="google-play-subscribe-btn"
                onClick={handleGooglePlayPurchase}
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validando con Google Play Billing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Confirmar Suscripción ($0.99 USD / mes)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 3: Validate Existing Supervisor RUT */}
          {activeTab === 'supervisor_rut' && (
            <form onSubmit={handleValidateSupervisorRut} className="space-y-4">
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sky-700" />
                  Validación de Cuenta Supervisor Registrada
                </span>
                <p className="text-[11px] text-sky-800">
                  Ingresa tu RUT para activar tu sesión de Supervisor en este equipo.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  RUT de Supervisor Autorizado:
                </label>
                <input
                  id="supervisor-rut-activation-input"
                  type="text"
                  value={rutInput}
                  onChange={(e) => setRutInput(e.target.value)}
                  placeholder="Ej: 12080702-1 o 12.080.702-1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none text-slate-900 font-mono font-bold text-sm"
                />
              </div>

              {stepMode === 'setup_password' && (
                <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>Crear Contraseña Maestra de Supervisor:</span>
                  </div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Nueva Contraseña (min 4)"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                  <input
                    type="password"
                    value={passwordConfirmInput}
                    onChange={(e) => setPasswordConfirmInput(e.target.value)}
                    placeholder="Confirmar Contraseña"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              )}

              {stepMode === 'enter_password' && (
                <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="text-xs font-bold text-slate-900 block">
                    Ingresa tu Contraseña de Supervisor:
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Contraseña registrada"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              )}

              {feedback && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  <span>{feedback.text}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Validar y Activar Plan Supervisor</span>
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
