import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  RefreshCw, 
  Server, 
  ShieldCheck, 
  Clock, 
  Mail, 
  Smartphone, 
  Wifi, 
  FileText, 
  Lock, 
  Trash2,
  ExternalLink,
  Zap,
  CheckCircle,
  Share2,
  Key,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  EmailDiagnosticsData, 
  fetchEmailDiagnostics, 
  runEmailSimulationDrill, 
  clearSupervisorEmailLogs,
  PendingSupervisorDispatch,
  openSupervisorEmailClient,
  shareSupervisorWhatsApp,
  getPendingQueueCount,
  forceSyncAll,
  clearEntireQueue,
  fetchSmtpConfig,
  saveSmtpConfig,
  testRealEmailDispatch,
} from '../lib/supervisorSyncQueue';
import { WorkerProfile } from '../types';

interface EmailSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker?: WorkerProfile;
  initialTargetEmail?: string;
}

export const EmailSimulationModal: React.FC<EmailSimulationModalProps> = ({
  isOpen,
  onClose,
  worker,
  initialTargetEmail = 'wartales@gmail.com'
}) => {
  const [activeTab, setActiveTab] = useState<'drill' | 'smtp_config' | 'diagnostics' | 'audit'>('drill');
  
  // Drill State
  const [targetEmail, setTargetEmail] = useState<string>(
    worker?.supervisorEmail || initialTargetEmail || 'wartales@gmail.com'
  );
  const [drillScenario, setDrillScenario] = useState<'green' | 'yellow' | 'red'>('red');
  const [isExecutingDrill, setIsExecutingDrill] = useState<boolean>(false);
  const [drillResult, setDrillResult] = useState<any | null>(null);
  const [drillError, setDrillError] = useState<string | null>(null);

  // Diagnostics & Audit State
  const [diagnostics, setDiagnostics] = useState<EmailDiagnosticsData | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Real SMTP Configuration & Live Testing State
  const [smtpHost, setSmtpHost] = useState<string>('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [smtpFrom, setSmtpFrom] = useState<string>('Oplira SGFS HSEC <notificaciones@oplira.cl>');
  const [resendApiKey, setResendApiKey] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isTestingRealEmail, setIsTestingRealEmail] = useState<boolean>(false);
  const [realTestResult, setRealTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    channel?: string;
    latencyMs?: number;
  } | null>(null);

  const loadDiagnostics = async () => {
    setIsLoadingDiagnostics(true);
    try {
      const data = await fetchEmailDiagnostics();
      setDiagnostics(data);
      const smtpData = await fetchSmtpConfig();
      if (smtpData.host) setSmtpHost(smtpData.host);
      if (smtpData.port) setSmtpPort(smtpData.port);
      if (smtpData.user) setSmtpUser(smtpData.user);
      if (smtpData.from) setSmtpFrom(smtpData.from);
    } catch (err: any) {
      console.warn('Error loading email diagnostics:', err);
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: 'gmail' | 'outlook' | 'resend' | 'custom') => {
    if (preset === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(587);
      setSmtpFrom('Oplira SGFS HSEC <notificaciones@oplira.cl>');
      setResendApiKey('');
    } else if (preset === 'outlook') {
      setSmtpHost('smtp.office365.com');
      setSmtpPort(587);
      setSmtpFrom('Oplira SGFS HSEC <notificaciones@oplira.cl>');
      setResendApiKey('');
    } else if (preset === 'resend') {
      setSmtpHost('');
      setSmtpUser('');
      setSmtpPass('');
    }
    setRealTestResult(null);
  };

  const handleSaveSmtp = async () => {
    try {
      await saveSmtpConfig({
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
        resendApiKey: resendApiKey
      });
      setActionSuccessMessage('✓ Configuración de correo guardada en el servidor.');
      setTimeout(() => setActionSuccessMessage(null), 4000);
      loadDiagnostics();
    } catch (err: any) {
      setRealTestResult({
        success: false,
        error: err?.message || 'Error al guardar configuración.'
      });
    }
  };

  const handleTestRealEmail = async () => {
    if (!targetEmail || !targetEmail.includes('@')) {
      setRealTestResult({
        success: false,
        error: 'Por favor ingresa un correo de prueba válido en el campo superior.'
      });
      return;
    }

    setIsTestingRealEmail(true);
    setRealTestResult(null);

    try {
      const result = await testRealEmailDispatch({
        to: targetEmail.trim(),
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
        resendApiKey: resendApiKey
      });

      setRealTestResult(result);
      if (result.success) {
        setActionSuccessMessage(`✓ ¡Correo real entregado con éxito a ${targetEmail}!`);
        setTimeout(() => setActionSuccessMessage(null), 5000);
      }
      loadDiagnostics();
    } catch (err: any) {
      setRealTestResult({
        success: false,
        error: err?.message || 'Fallo de conexión al enviar correo real.'
      });
    } finally {
      setIsTestingRealEmail(false);
    }
  };

  const handleRunDrill = async () => {
    if (!targetEmail || !targetEmail.includes('@')) {
      setDrillError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsExecutingDrill(true);
    setDrillError(null);
    setDrillResult(null);

    try {
      const result = await runEmailSimulationDrill({
        targetEmail: targetEmail.trim(),
        scenario: drillScenario,
        workerName: worker?.name || 'Carlos Henríquez Soto',
        workerRut: worker?.rut || '14.285.932-4',
        workerFaena: worker?.faena || 'Faena Cordillera Sur',
        workerRole: worker?.role || 'Operador de Maquinaria Pesada'
      });

      setDrillResult(result);
      loadDiagnostics();
    } catch (err: any) {
      setDrillError(err?.message || 'Error al ejecutar el simulacro.');
    } finally {
      setIsExecutingDrill(false);
    }
  };

  const handleClearLogs = async () => {
    const ok = await clearSupervisorEmailLogs();
    if (ok) {
      setActionSuccessMessage('Historial de despachos limpiado correctamente.');
      setTimeout(() => setActionSuccessMessage(null), 3000);
      loadDiagnostics();
    }
  };

  // Helper for mock client mailto / WhatsApp test
  const handleTestClientMailto = () => {
    const mockItem: PendingSupervisorDispatch = {
      id: `drill_${Date.now()}`,
      evaluationId: `eval_${Date.now()}`,
      workerName: worker?.name || 'Carlos Henríquez Soto',
      workerRut: worker?.rut || '14.285.932-4',
      workerCompany: worker?.company || 'E-Mining Tech',
      workerFaena: worker?.faena || 'Faena Cordillera Sur',
      workerRole: worker?.role || 'Operador CAEX',
      supervisorName: worker?.supervisorName || 'Supervisor HSEC',
      supervisorEmail: targetEmail,
      timestamp: new Date().toISOString(),
      status: drillScenario,
      statusLabel: drillScenario === 'red' ? 'No Apto (Riesgo Crítico)' : drillScenario === 'yellow' ? 'Alerta Moderada' : 'Apto para Operar',
      riskScore: drillScenario === 'red' ? 84 : drillScenario === 'yellow' ? 48 : 18,
      priority: drillScenario === 'red' ? 'high' : 'normal',
      hashSha256: `SGFS-${Date.now().toString(16).toUpperCase()}-SHA256-TEST`,
      recommendedAction: drillScenario === 'red' ? 'Prohibición de operar. Derivación inmediata a descanso.' : 'Apto para turno.',
      measuresApplied: ['Control SGFS Pre-Turno', 'Pausa compensatoria'],
      syncStatus: 'pending',
      retryCount: 0
    };
    openSupervisorEmailClient(mockItem);
  };

  const handleTestWhatsApp = () => {
    const mockItem: PendingSupervisorDispatch = {
      id: `drill_${Date.now()}`,
      evaluationId: `eval_${Date.now()}`,
      workerName: worker?.name || 'Carlos Henríquez Soto',
      workerRut: worker?.rut || '14.285.932-4',
      workerCompany: worker?.company || 'E-Mining Tech',
      workerFaena: worker?.faena || 'Faena Cordillera Sur',
      workerRole: worker?.role || 'Operador CAEX',
      supervisorName: worker?.supervisorName || 'Supervisor HSEC',
      supervisorEmail: targetEmail,
      timestamp: new Date().toISOString(),
      status: drillScenario,
      statusLabel: drillScenario === 'red' ? 'No Apto (Riesgo Crítico)' : drillScenario === 'yellow' ? 'Alerta Moderada' : 'Apto para Operar',
      riskScore: drillScenario === 'red' ? 84 : drillScenario === 'yellow' ? 48 : 18,
      priority: drillScenario === 'red' ? 'high' : 'normal',
      hashSha256: `SGFS-${Date.now().toString(16).toUpperCase()}-SHA256-TEST`,
      recommendedAction: drillScenario === 'red' ? 'Prohibición de operar. Derivación inmediata a descanso.' : 'Apto para turno.',
      measuresApplied: ['Control SGFS Pre-Turno', 'Pausa compensatoria'],
      syncStatus: 'pending',
      retryCount: 0
    };
    shareSupervisorWhatsApp(mockItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="email-simulation-modal-content"
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Centro de Envíos, Simulacros y Configuración SMTP
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-full">
                  Multi-Canal Activo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Despacho transaccional de certificados SGFS, configuración de correo y pruebas en vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 text-xs font-semibold gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('drill')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'drill'
                ? 'border-sky-600 text-sky-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simulacro en Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('smtp_config')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'smtp_config'
                ? 'border-sky-600 text-sky-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Configurar Envío Real (Gmail / SMTP)</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'border-sky-600 text-sky-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Detección y Redundancia</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-sky-600 text-sky-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Historial ({diagnostics?.totalDispatches || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {actionSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* TAB 1: DRILL / SIMULACRO */}
          {activeTab === 'drill' && (
            <div className="space-y-6">
              <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-4 text-xs text-sky-950 space-y-1">
                <div className="font-bold flex items-center gap-2 text-sky-900">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Simulador de Despacho Inmediato a Casilla de Correo</span>
                </div>
                <p className="opacity-90 leading-relaxed">
                  Permite simular el flujo completo de emisión de certificados SGFS, verificando la entrega en el servidor, la generación del correo HTML oficial con hash criptográfico SHA-256 y la descarga de adjuntos.
                </p>
              </div>

              {/* Form Config */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Destinatario de Prueba (Supervisor / HSEC):
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="ejemplo@minera.cl o wartales@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Puedes probar enviando a <strong>wartales@gmail.com</strong> o cualquier casilla institucional.
                  </p>
                </div>

                {/* Scenario Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Selecciona Escenario Psicométrico a Simular:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setDrillScenario('green')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        drillScenario === 'green'
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-emerald-800">🟢 Apto (Verde)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm font-bold">18/100</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Aptitud operacional normal sin restricciones de turno.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDrillScenario('yellow')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        drillScenario === 'yellow'
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-amber-800">🟡 Moderado (Amarillo)</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-bold">48/100</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Alerta temprana con pausas compensatorias activas.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDrillScenario('red')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        drillScenario === 'red'
                          ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-rose-800">🔴 Crítico (Rojo)</span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-sm font-bold">84/100</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        No apto para operar equipos críticos. Alerta HSEC inmediata.
                      </p>
                    </button>
                  </div>
                </div>

                {drillError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{drillError}</span>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRunDrill}
                    disabled={isExecutingDrill}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Send className={`w-4 h-4 ${isExecutingDrill ? 'animate-spin' : ''}`} />
                    <span>{isExecutingDrill ? 'Transmitiendo Simulacro...' : 'Ejecutar Simulacro en Servidor'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestClientMailto}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    title="Abre la aplicación de correo del dispositivo móvil o escritorio con los datos pre-rellenados"
                  >
                    <Mail className="w-4 h-4 text-sky-400" />
                    <span>Abrir en Gmail / App Nativa Móvil</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    title="Envía el resumen oficial al supervisor por WhatsApp"
                  >
                    <Share2 className="w-4 h-4 text-white" />
                    <span>Compartir vía WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Drill Result Card */}
              {drillResult && (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs text-white">
                        Resultado del Simulacro de Despacho
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md font-mono text-[10px]">
                      Latencia: {drillResult?.drillResult?.latencyMs || 0}ms
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Canal de Entrega:</span>
                      <span className="font-mono text-sky-300">{drillResult?.drillResult?.channel || 'Simulado Certificado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Estado de Entrega:</span>
                      <span className="font-mono text-emerald-300">{drillResult?.drillResult?.status || 'delivered'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Destinatario Verificado:</span>
                      <span className="font-mono text-slate-200">{drillResult?.drillResult?.recipient}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Hash SHA-256 Generado:</span>
                      <span className="font-mono text-[10px] text-slate-300 break-all">{drillResult?.drillResult?.auditHash}</span>
                    </div>
                  </div>

                  {drillResult?.drillResult?.previewUrl && (
                    <div className="pt-1">
                      <a
                        href={drillResult.drillResult.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
                      >
                        <span>Abrir Vista Previa del Correo en Sandbox</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REAL SMTP CONFIGURATION & LIVE TEST */}
          {activeTab === 'smtp_config' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-2 text-amber-900">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>Configuración de Servidor de Correo para Envíos Reales a Bandeja de Entrada</span>
                </div>
                <p className="opacity-90 leading-relaxed">
                  Para que los correos lleguen directamente a tu casilla (ej. <strong>wartales@gmail.com</strong>), ingresa tus credenciales de envío. Si usas Gmail, recuerda utilizar una <strong>Contraseña de Aplicación de 16 caracteres</strong> (no tu contraseña personal).
                </p>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Seleccionar Proveedor Rápido:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('gmail')}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs transition-colors cursor-pointer"
                  >
                    <span className="font-bold block text-slate-900">✉️ Gmail</span>
                    <span className="text-[10px] text-slate-500">smtp.gmail.com:587</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('outlook')}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs transition-colors cursor-pointer"
                  >
                    <span className="font-bold block text-slate-900">📬 Outlook / O365</span>
                    <span className="text-[10px] text-slate-500">smtp.office365.com:587</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('resend')}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs transition-colors cursor-pointer"
                  >
                    <span className="font-bold block text-slate-900">🚀 Resend API</span>
                    <span className="text-[10px] text-slate-500">API Key transaccional</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('custom')}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs transition-colors cursor-pointer"
                  >
                    <span className="font-bold block text-slate-900">🏢 Corporativo</span>
                    <span className="text-[10px] text-slate-500">Servidor propio</span>
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Servidor SMTP Host:
                    </label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Puerto SMTP:
                    </label>
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      placeholder="587"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Usuario / Correo Emisor (ej. tu cuenta Gmail):
                    </label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="tu-correo@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Contraseña de Aplicación (App Password):
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="abcd efgh ijkl mnop"
                        className="w-full px-3 py-2 pr-9 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    O bien, Clave Resend API (opcional):
                  </label>
                  <input
                    type="password"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder="re_123456789..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>¿Cómo obtener una Contraseña de Aplicación en Gmail?</span>
                  </div>
                  <p>
                    1. Entra a tu cuenta Google &gt; <strong>Seguridad</strong> &gt; <strong>Verificación en dos pasos</strong>.<br/>
                    2. Al final de la página, selecciona <strong>Contraseñas de aplicaciones</strong>.<br/>
                    3. Genera una contraseña llamada &quot;Oplira SGFS&quot; y pega los 16 caracteres aquí arriba.
                  </p>
                </div>

                {/* Real Test Result Banner */}
                {realTestResult && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    realTestResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}>
                    {realTestResult.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <span className="font-bold block">
                        {realTestResult.success ? '✓ Envío Real Confirmado' : '✕ Error en Envío Real'}
                      </span>
                      <p className="leading-relaxed">
                        {realTestResult.success ? realTestResult.message : realTestResult.error}
                      </p>
                      {realTestResult.latencyMs && (
                        <span className="text-[10px] font-mono opacity-80 block">
                          Latencia: {realTestResult.latencyMs}ms • Canal: {realTestResult.channel}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestRealEmail}
                    disabled={isTestingRealEmail}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Send className={`w-3.5 h-3.5 ${isTestingRealEmail ? 'animate-spin' : ''}`} />
                    <span>{isTestingRealEmail ? 'Probando Conexión...' : `Probar Envío Real a ${targetEmail}`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSmtp}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Guardar Configuración en Servidor</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTICS & REDUNDANCY */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              {/* Server Diagnostics Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-xs text-slate-900">
                      Estado del Motor de Notificaciones en Servidor
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-sky-100 border border-sky-300 text-sky-800 rounded-full font-bold text-[10px] uppercase">
                    {diagnostics?.configuredTransport || 'Cargando...'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Host SMTP / Relay:</span>
                    <span className="font-mono text-slate-900 text-[11px]">
                      {diagnostics?.smtpHost}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Remitente Certificado (From):</span>
                    <span className="font-mono text-slate-900 text-[11px]">
                      {diagnostics?.smtpFrom}
                    </span>
                  </div>
                </div>
              </div>

              {/* Local Sync Queue Control Card */}
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-blue-950">
                      Cola de Sincronización Local y Memoria Offline
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    getPendingQueueCount() > 0 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {getPendingQueueCount()} pendientes
                  </span>
                </div>
                <p className="text-[11px] text-blue-900 leading-snug">
                  Si un informe o simulacro anterior quedó encolado, puedes forzar su despacho inmediato o purgar la memoria residual de sincronización.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      const count = await forceSyncAll();
                      await loadDiagnostics();
                      setActionSuccessMessage(`✓ Se forzó la sincronización: ${count} reporte(s) despachados.`);
                      setTimeout(() => setActionSuccessMessage(null), 4000);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Forzar Despacho de Cola</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearEntireQueue();
                      loadDiagnostics();
                      setActionSuccessMessage('✓ Cola de sincronización reseteada y limpiada a 0.');
                      setTimeout(() => setActionSuccessMessage(null), 4000);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Limpiar Cola</span>
                  </button>
                </div>
              </div>

              {/* Identified Gaps & Redundant Safeguards */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Brechas Detectadas en Web Móvil y Correcciones Redundantes Aplicadas:
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg mt-0.5">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950 block text-xs">
                        1. Suspensión de Pestañas en Navegadores Móviles (iOS / Android)
                      </span>
                      <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                        <strong>Corrección:</strong> Se incorporó <code className="bg-emerald-100 px-1 py-0.5 rounded-sm">keepalive: true</code> en los envíos fetch y suscripción activa a eventos <code className="bg-emerald-100 px-1 py-0.5 rounded-sm">visibilitychange</code> y <code className="bg-emerald-100 px-1 py-0.5 rounded-sm">focus</code> para reanudar el envío en cuanto el usuario desbloquea o regresa a la aplicación.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg mt-0.5">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950 block text-xs">
                        2. Desconexión o Mala Cobertura en Zonas de Faena
                      </span>
                      <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                        <strong>Corrección:</strong> AbortController con límite de 10 segundos para no bloquear la app, más persistencia ilimitada en <strong>IndexedDB</strong> que retiene la evaluación firmada y la reintenta automáticamente con prioridad alta.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950 block text-xs">
                        3. Fallas por Tamaño de Adjunto PDF en Redes Lentas
                      </span>
                      <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                        <strong>Corrección:</strong> Mecanismo de degradación elegante: si el payload binario falla por red débil, el sistema conmuta de inmediato a un envío liviano con el resumen certificado oficial y sello SHA-256.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950 block text-xs">
                        4. Cuádruple Canal de Redundancia Operacional
                      </span>
                      <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                        <strong>Corrección:</strong> Si el envío del servidor no encuentra salida, la interfaz provee acceso directo con un clic a <strong>Gmail/Mailto</strong> estructurado, <strong>WhatsApp HSEC</strong> y <strong>Descarga Directa de PDF</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT & LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Registro de Despachos y Auditoría en Servidor
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Total de despachos registrados: {diagnostics?.totalDispatches || 0}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadDiagnostics}
                    disabled={isLoadingDiagnostics}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Recargar logs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDiagnostics ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>

                  <button
                    onClick={handleClearLogs}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Limpiar registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>

              {(!diagnostics?.recentLogs || diagnostics.recentLogs.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <Mail className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No hay registros de envío aún</p>
                  <p className="text-[11px] text-slate-500">
                    Ejecuta un simulacro en la pestaña anterior para generar auditorías de prueba.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {diagnostics.recentLogs.map((log) => (
                    <div key={log.id} className="p-3.5 hover:bg-slate-50/80 transition-colors space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            log.isDrill
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}>
                            {log.isDrill ? 'SIMULACRO' : 'OFICIAL'}
                          </span>
                          <span className="font-bold text-slate-900">{log.workerName}</span>
                          <span className="text-slate-500 font-mono text-[11px]">({log.workerRut})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString('es-CL')}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[10px]">
                            {log.deliveryStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <div>
                          Destinatario: <span className="font-mono text-slate-900">{log.to}</span> | Dictamen: <span className="font-semibold">{log.statusLabel}</span> ({log.riskScore}/100)
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {log.latencyMs}ms
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono break-all pt-0.5 flex items-center justify-between">
                        <span>SHA-256: {log.hashSha256}</span>
                        {log.previewUrl && (
                          <a
                            href={log.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 hover:underline flex items-center gap-1 font-sans ml-2 flex-shrink-0"
                          >
                            <span>Ver Sandbox</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Sistema Oficial SGFS Oplira HSEC — Verificación de Envíos</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
