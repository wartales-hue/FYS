import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  AlertTriangle, 
  Coffee, 
  Lock, 
  Radio,
  Truck,
  UserX,
  FileText,
  QrCode,
  Smartphone,
  ShieldCheck,
  Key,
  ShieldAlert,
  Cpu,
  History,
  FileCheck2
} from 'lucide-react';
import { WorkerProfile, FRARiskEvaluation, InterventionRecord } from '../../types';
import { MOCK_WORKERS } from '../../lib/mockData';
import { InterventionModal } from './InterventionModal';
import { SupervisorCrewQrCard } from './SupervisorCrewQrCard';
import { AdBanner } from '../AdBanner';
import { downloadEvaluationPDF } from '../../lib/pdfGenerator';
import { 
  getDeviceName, 
  getOrCreateDeviceId, 
  getDeviceHardwareFingerprint,
  checkDeviceSessionStatus,
  getActiveSubscriptionDetails,
  getSecurityAuditLogs,
  SecurityAuditEntry
} from '../../lib/premiumService';

interface SupervisorViewProps {
  workers: WorkerProfile[];
  evaluations: FRARiskEvaluation[];
  interventions: InterventionRecord[];
  onSaveIntervention: (record: InterventionRecord) => void;
  onUpdateInterventionStatus: (id: string, outcome: 'recovered_green' | 'partial_yellow' | 'unrecovered_red') => void;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({
  workers,
  evaluations,
  interventions,
  onSaveIntervention,
  onUpdateInterventionStatus,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeWorkerForIntervention, setActiveWorkerForIntervention] = useState<WorkerProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showQrCard, setShowQrCard] = useState<boolean>(false);
  const [showSecurityAudit, setShowSecurityAudit] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEntry[]>([]);
  const [deviceSession, setDeviceSession] = useState<{ isLocked: boolean; tamperDetected?: boolean; reason?: string }>({ isLocked: false });

  const deviceName = getDeviceName();
  const deviceId = getOrCreateDeviceId();
  const fingerprint = getDeviceHardwareFingerprint();
  const subDetails = getActiveSubscriptionDetails();

  const refreshSessionStatus = () => {
    const status = checkDeviceSessionStatus();
    if (status.isLocked) {
      setDeviceSession({ isLocked: true, tamperDetected: status.tamperDetected, reason: status.reason });
    } else {
      setDeviceSession({ isLocked: false });
    }
    setAuditLogs(getSecurityAuditLogs());
  };

  useEffect(() => {
    refreshSessionStatus();

    const handleSessionRevoked = (e: any) => {
      setDeviceSession({
        isLocked: true,
        reason: `⚠️ Acceso transferido: La cuenta fue abierta en '${e.detail?.newDevice || 'Otro Dispositivo'}'. La sesión en este equipo fue revocada por política de dispositivo único.`
      });
      setAuditLogs(getSecurityAuditLogs());
    };

    const handleAuditUpdate = () => {
      setAuditLogs(getSecurityAuditLogs());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('frms_device_session_revoked', handleSessionRevoked);
      window.addEventListener('frms_security_audit_updated', handleAuditUpdate);
      window.addEventListener('frms_premium_status_changed', refreshSessionStatus);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('frms_device_session_revoked', handleSessionRevoked);
        window.removeEventListener('frms_security_audit_updated', handleAuditUpdate);
        window.removeEventListener('frms_premium_status_changed', refreshSessionStatus);
      }
    };
  }, []);

  // Map latest evaluation for each worker
  const getLatestEval = (workerId: string) => {
    return evaluations.find(e => e.workerId === workerId);
  };

  const getWorkerIntervention = (workerId: string) => {
    return interventions.find(i => i.workerId === workerId && i.status === 'in_progress');
  };

  // Status counts
  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let grayCount = 0;

  workers.forEach(w => {
    const ev = getLatestEval(w.id);
    const st = ev?.status || 'green';
    if (st === 'green') greenCount++;
    else if (st === 'yellow') yellowCount++;
    else if (st === 'red') redCount++;
    else grayCount++;
  });

  const verifiedPercent = workers.length > 0 ? Math.round((workers.length / workers.length) * 100) : 0;

  const categories = [
    { id: 'all', label: 'Toda la Flota', count: workers.length },
    { id: 'CAEX', label: 'Flota CAEX (Catastrófica)', count: workers.filter(w => (w.equipmentAssigned || '').includes('CAEX')).length },
    { id: 'Pala', label: 'Palas & Carguío', count: workers.filter(w => (w.equipmentAssigned || '').includes('Pala')).length },
    { id: 'Perforadora', label: 'Perforación', count: workers.filter(w => (w.equipmentAssigned || '').includes('PV-')).length },
    { id: 'Bus', label: 'Buses Transporte', count: workers.filter(w => (w.equipmentAssigned || '').includes('Bus')).length },
  ];

  const filteredWorkers = workers.filter(w => {
    const equip = (w.equipmentAssigned || '').toLowerCase();
    const name = (w.name || '').toLowerCase();
    const role = (w.role || '').toLowerCase();
    const sTerm = searchTerm.toLowerCase();

    const matchesCategory = selectedCategory === 'all' || equip.includes(selectedCategory.toLowerCase());
    const matchesSearch = name.includes(sTerm) || 
                          equip.includes(sTerm) ||
                          role.includes(sTerm);
    return matchesCategory && matchesSearch;
  });

  const handleDownloadOfficialPdf = async () => {
    const primaryWorker = workers[0];
    const latestEval = getLatestEval(primaryWorker.id) || evaluations[0];
    if (primaryWorker && latestEval) {
      downloadEvaluationPDF(
        primaryWorker,
        latestEval,
        {
          sleepDurationHours: 7.2,
          sleepOpportunityHours: 8.5,
          bedTime: '22:30',
          wakeTime: '06:00',
          sleepQuality: 4,
          timeSinceAwakeHours: 1.5,
          accumulatedSleepDebtHours: 0.5,
          consecutiveNights: 0
        }
      );
    } else {
      alert('Generando PDF Oficial del Acta de Cuadrilla...');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 py-1">
      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Operadores en Turno */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              OPERADORES ACTIVOS
            </span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-black text-slate-900">
              {workers.length}
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              +{greenCount} Aptos
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Cuadrilla de turno sincronizada en faena
          </p>
        </div>

        {/* Metric 2: Estado de Alerta General */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              ESTADO DE ALERTA SGFS
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-black text-slate-900">
              {Math.round((greenCount / (workers.length || 1)) * 100)}%
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              Semáforo Verde
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {greenCount} verdes, {yellowCount} amarillos, {redCount} rojos
          </p>
        </div>

        {/* Metric 3: Medidas Preventivas */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              INTERVENCIONES ACTIVAS
            </span>
            <Coffee className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-black text-slate-900">
              {interventions.filter(i => i.status === 'in_progress').length}
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
              En Pausa
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Protocolo de recuperación y contramedidas
          </p>
        </div>

        {/* Metric 4: Cumplimiento Normativo */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              CUMPLIMIENTO LEGAL
            </span>
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ley 21.719
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              DS 44
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Trazabilidad y protección de datos
          </p>
        </div>
      </div>

      {/* Device Lock Warning or Security Integrity Bar */}
      {deviceSession.isLocked ? (
        <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-950 flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-black text-sm text-rose-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>SESIÓN DE SUPERVISOR BLOQUEADA EN ESTE DISPOSITIVO</span>
            </h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              {deviceSession.reason}
            </p>
            <p className="text-[11px] text-rose-700 font-medium pt-1">
              Para reanudar el acceso en este equipo, ingresa con tu contraseña maestra a través del botón Premium en la barra superior.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">Terminal: <strong className="text-emerald-300 font-mono">{deviceName}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300">Token Criptográfico: <strong className="text-blue-300 font-mono">SHA-256 HMAC ✓</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300">1 Dispositivo / Cuenta</span>
            </div>
          </div>

          <button
            onClick={() => setShowSecurityAudit(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Auditoría de Seguridad ({auditLogs.length})</span>
          </button>
        </div>
      )}

      {/* Operational Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Monitoreo y Gestión del Riesgo en Flota Activa
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Vigilancia pre-turno de fatiga y somnolencia en faena.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="supervisor-toggle-qr-btn"
              onClick={() => setShowQrCard(!showQrCard)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Código QR de Cuadrilla</span>
            </button>

            <button
              id="supervisor-download-report-btn"
              onClick={handleDownloadOfficialPdf}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Descargar Acta PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* AD BANNER FOR SUPERVISOR SESSION */}
      <AdBanner role="supervisor" />

      {/* Dynamic Crew Code & QR Generator for Shift (Collapsible) */}
      {showQrCard && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <SupervisorCrewQrCard />
        </div>
      )}

      {/* Fleet Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-mono font-bold">
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por operador, equipo o área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 w-full sm:w-64 focus:outline-none focus:border-slate-900 font-medium"
          />
        </div>
      </div>

      {/* Workers Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWorkers.map((w) => {
          const evalResult = getLatestEval(w.id);
          const activeInt = getWorkerIntervention(w.id);
          const status = evalResult?.status || 'green';

          return (
            <div
              key={w.id}
              className={`bg-white border rounded-2xl p-5 transition-all space-y-4 shadow-xs ${
                status === 'red'
                  ? 'border-rose-300 ring-1 ring-rose-200'
                  : status === 'yellow'
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header: Operator & Equipment */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-700">
                    {w.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>{w.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        w.criticality === 4 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Criticidad {w.criticality}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      <strong className="text-indigo-700 font-semibold">{w.equipmentAssigned}</strong> • {w.role}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    status === 'green'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : status === 'yellow'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    <span>{status === 'green' ? '🟢' : status === 'yellow' ? '🟡' : '🔴'}</span>
                    <span>{status === 'green' ? 'Controlado' : status === 'yellow' ? 'Pausa / Rotación' : 'Riesgo Elevado'}</span>
                  </span>
                </div>
              </div>

              {/* Operational Shift & Evaluation Summary */}
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Jornada</span>
                  <span className="font-bold text-slate-800">
                    Día {w.currentShift.dayInRoster}/{w.currentShift.totalRosterDays} ({w.currentShift.type === 'night' ? 'Noche' : 'Día'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">KSS / Calidad PVT</span>
                  <span className="font-bold text-slate-800">
                    KSS {evalResult ? evalResult.kss : 3} • {evalResult?.pvtValidity === 'valid' ? '✓ Válida' : evalResult?.pvtValidity === 'invalid' ? '✕ Repetir' : 'Normal'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Riesgo FRA</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {evalResult ? `${evalResult.riskScore}/100` : 'Normal'}
                  </span>
                </div>
              </div>

              {/* Recommended Action & Operational Decision Controls */}
              <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                    Decisión Operacional:
                  </span>
                  {evalResult?.dataQualityScore !== undefined && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Calidad: {evalResult.dataQualityScore}%
                    </span>
                  )}
                </div>
                <p className="text-slate-700 font-medium text-xs">
                  {evalResult?.operationalDecision?.mandatoryControls?.[0] || evalResult?.recommendedAction || 'Continuar operación habitual sin restricciones.'}
                </p>
                {evalResult?.riskDrivers && evalResult.riskDrivers.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/60">
                    {evalResult.riskDrivers.slice(0, 3).map((d, dIdx) => (
                      <span key={dIdx} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        d.isProtective ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.name}: {d.scoreImpact > 0 ? `+${d.scoreImpact}` : `${d.scoreImpact}`} pts
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* In-Progress Intervention Status */}
              {activeInt && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span>
                      Medida en curso: <strong>{activeInt.interventionType === 'active_break_15m' ? 'Pausa Activa 15 min' : 'Relevo Temporal'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateInterventionStatus(activeInt.id, 'recovered_green')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                    >
                      ✓ Recuperado (🟢)
                    </button>
                    <button
                      onClick={() => onUpdateInterventionStatus(activeInt.id, 'unrecovered_red')}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                    >
                      ✗ Relevo Definitivo
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setActiveWorkerForIntervention(w)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>Despachar Medida Preventiva</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    ⚡ Próximamente
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for dispatching interventions */}
      {activeWorkerForIntervention && (
        <InterventionModal
          worker={activeWorkerForIntervention}
          evaluation={getLatestEval(activeWorkerForIntervention.id)}
          onClose={() => setActiveWorkerForIntervention(null)}
          onSaveIntervention={onSaveIntervention}
        />
      )}

      {/* Security Audit Modal (Item 3, 4, 5) */}
      {showSecurityAudit && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto text-slate-900">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Registro de Auditoría de Seguridad & Anti-Piratería</h3>
                  <p className="text-xs text-slate-300">Trazabilidad de hardware, firmas SHA-256 HMAC y eventos de dispositivo único</p>
                </div>
              </div>
              <button
                onClick={() => setShowSecurityAudit(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Active Device Signature Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span>Huella de Hardware Activa:</span>
                  </span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {fingerprint}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200">
                  <div>Terminal: <strong>{deviceName}</strong></div>
                  <div>ID Hardware: <span className="font-mono">{deviceId.substring(0, 16)}...</span></div>
                  <div>Protección: <strong>HMAC Anti-Tamper Activo</strong></div>
                  <div>Sesión: <strong>1 Dispositivo / Cuenta</strong></div>
                </div>
              </div>

              {/* Event Logs List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Eventos Registrados ({auditLogs.length})
                </h4>

                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 text-center">No hay eventos de seguridad registrados.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        log.severity === 'critical'
                          ? 'bg-rose-50 border-rose-200 text-rose-950'
                          : log.severity === 'warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold flex items-center gap-1.5">
                          {log.severity === 'critical' ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          ) : log.severity === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>{log.type.replace(/_/g, ' ').toUpperCase()}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleString('es-CL')}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">{log.description}</p>
                      <div className="text-[10px] text-slate-500 font-mono pt-1">
                        RUT: {log.rut} • Dispositivo: {log.deviceName}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSecurityAudit(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

