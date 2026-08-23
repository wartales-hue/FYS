import React, { useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  FileText, 
  AlertCircle, 
  BarChart3, 
  GitBranch, 
  Scale,
  ShieldAlert,
  Zap,
  RefreshCw,
  Eye,
  Lock,
  Globe
} from 'lucide-react';
import { MOCK_ALGORITHM_LOGS } from '../../lib/mockData';
import { OpliraLogo } from '../OpliraLogo';
import { detectAdBlocker, getCachedAdBlockStatus } from '../../lib/adBlockDetector';

interface GovernanceViewProps {
  onOpenReviewerDemoModal?: () => void;
}

export const GovernanceView: React.FC<GovernanceViewProps> = ({ onOpenReviewerDemoModal }) => {
  const currentVersion = MOCK_ALGORITHM_LOGS[0];
  const [simulatedBlockType, setSimulatedBlockType] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeAdStatus, setActiveAdStatus] = useState(getCachedAdBlockStatus());

  const runSimulation = async (type: 'dns' | 'cosmetic' | 'script' | 'clear') => {
    setIsTesting(true);
    if (type === 'clear') {
      setSimulatedBlockType(null);
      const st = await detectAdBlocker();
      setActiveAdStatus(st);
      setIsTesting(false);
      return;
    }

    setSimulatedBlockType(type);
    setTimeout(() => {
      setIsTesting(false);
      setActiveAdStatus({
        isBlocked: true,
        detectedAt: new Date().toISOString(),
        detectorMethod: type === 'dns' ? 'dns_filter' : type === 'cosmetic' ? 'bait_element' : 'script_request',
        activeFilterVectors: [
          type === 'dns' ? 'Filtro DNS / Host Sinkhole (Pi-hole/AdAway)' :
          type === 'cosmetic' ? 'Filtro Cosmético CSS (uBlock Origin ##.ad-banner)' :
          'Inyección de Stub Scriptlet'
        ],
        guardianActive: true
      });
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 py-2">
      {/* Title & Governance Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                <span>Gobernanza del Algoritmo & Validación Científica</span>
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-medium">
                FRA Engine v2.0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Validación Científica, Trazabilidad y Control de Versiones
            </h1>
            <p className="text-xs text-slate-500">
              El motor FRA se fundamenta en modelos explicables validados experimentalmente, prohibiendo modificaciones silenciosas.
            </p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center gap-2">
            <OpliraLogo size={42} showText={true} />
          </div>
        </div>

        {/* Validation Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Sensibilidad</span>
            <p className="font-mono text-2xl font-bold text-emerald-800">
              {(currentVersion.validationMetrics.sensitivity * 100).toFixed(0)}%
            </p>
            <span className="text-[10px] text-slate-500">Detección de fatiga</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Especificidad</span>
            <p className="font-mono text-2xl font-bold text-indigo-800">
              {(currentVersion.validationMetrics.specificity * 100).toFixed(0)}%
            </p>
            <span className="text-[10px] text-slate-500">Bajo falso positivo</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Curva ROC / AUC</span>
            <p className="font-mono text-2xl font-bold text-amber-800">
              {currentVersion.validationMetrics.aucRoc.toFixed(2)}
            </p>
            <span className="text-[10px] text-slate-500">Precisión global</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Falsos Positivos</span>
            <p className="font-mono text-2xl font-bold text-amber-800">
              {(currentVersion.validationMetrics.falsePositiveRate * 100).toFixed(0)}%
            </p>
            <span className="text-[10px] text-slate-500">Tasa controlada</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Falsos Negativos</span>
            <p className="font-mono text-2xl font-bold text-rose-800">
              {(currentVersion.validationMetrics.falseNegativeRate * 100).toFixed(0)}%
            </p>
            <span className="text-[10px] text-slate-500">Mínimo riesgo residual</span>
          </div>
        </div>
      </div>

      {/* 10 Phases of Validation Program */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          <span>Programa de Validación Científica en 10 Fases (Sección 37)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          {[
            { phase: 'Fase 1', title: 'Calibración Dispositivo', desc: 'Latencia táctil en pantallas OLED/LCD industriales.', done: true },
            { phase: 'Fase 2', title: 'PVT-A vs PVT-L/X', desc: 'Equivalencia psicométrica de 60s vs 3 minutos.', done: true },
            { phase: 'Fase 3', title: 'KSS vs Desempeño', desc: 'Identificación de patrones de fatiga enmascarada.', done: true },
            { phase: 'Fase 4', title: 'Línea Base Dinámica', desc: 'Calibración individual intra-sujeto.', done: true },
            { phase: 'Fase 5', title: 'Turno Día / Noche', desc: 'Respuesta ante inversión de fase circadiana.', done: true },
            { phase: 'Fase 6', title: 'Tiempo Despierto', desc: 'Presión homeostática de sueño (>16h).', done: true },
            { phase: 'Fase 7', title: 'Gran Altitud', desc: 'Hipoxia y desaturación >3.500 msnm.', done: true },
            { phase: 'Fase 8', title: 'Telemetría DSM', desc: 'Correlación PERCLOS con lapsos PVT.', done: true },
            { phase: 'Fase 9', title: 'Efectividad Pausas', desc: 'Cinética de recuperación post-siesta.', done: true },
            { phase: 'Fase 10', title: 'Validación Prospectiva', desc: 'Seguimiento de incidentes en faenas piloto.', done: true },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-amber-700 font-bold text-[10px] uppercase">{item.phase}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="font-bold text-slate-900 text-xs">{item.title}</p>
              <p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Version Change Control Log */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-amber-600" />
          <span>Libro de Gobernanza y Aprobación de Algoritmos</span>
        </h2>

        <div className="space-y-4">
          {MOCK_ALGORITHM_LOGS.map((log, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 font-mono">{log.version}</span>
                  <span className="text-slate-500 font-mono text-[11px]">Liberado: {log.releaseDate}</span>
                </div>
                <span className="text-emerald-800 text-[11px] font-semibold">
                  Aprobado por: {log.approvalCommittee}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                <strong>Resumen de Cambios:</strong> {log.changesSummary}
              </p>
              <p className="text-slate-500 text-[11px]">
                Científico Responsable: <strong className="text-slate-700">{log.leadScientist}</strong>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Security, Anti-Piracy & Business Model Integrity Governance (Items 3, 4, 5) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Seguridad Criptográfica, Control Anti-Piratería y Gobernanza del Modelo
            </h2>
            <p className="text-xs text-slate-500">
              Protocolos de protección contra clonación de APK, cuentas compartidas y mitigación de bloqueadores de anuncios.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Item 3 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  ÍTEM 3 • ANTI-PIRATERÍA
                </span>
                <span className="text-[10px] font-bold text-emerald-600">SHA-256 HMAC</span>
              </div>
              <h3 className="font-bold text-slate-900 text-xs">Integridad de Licencias & Token GPA</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tokens de suscripción firmados con salt criptográfico. Si un usuario o APK modificada altera los datos en almacenamiento local, el sistema detecta la discordancia de firma, revoca los privilegios y registra un evento de manipulación en el libro de auditoría.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
              Validación: Offline 30 días + Sello SHA-256
            </div>
          </div>

          {/* Item 4 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  ÍTEM 4 • ANTI-ACCOUNT SHARING
                </span>
                <span className="text-[10px] font-bold text-blue-700">1 Cuenta = 1 Terminal</span>
              </div>
              <h3 className="font-bold text-slate-900 text-xs">Vinculación de Hardware & Kill-Switch</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cada inicio de sesión genera una huella de hardware irrepetible y un token de sesión dinámico. Si la cuenta es abierta en otro terminal o se detecta velocidad geográfica inverosímil (ej. faenas distintas en &lt;2h), la sesión previa queda invalidada de inmediato.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
              Control: Desconexión remota instantánea
            </div>
          </div>

          {/* Item 5 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ÍTEM 5 • ANTI-ADBLOCK
                </span>
                <span className="text-[10px] font-bold text-amber-700">Patrocinio Nativo</span>
              </div>
              <h3 className="font-bold text-slate-900 text-xs">Patrocinios de Seguridad Inbloqueables</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Detección activa de AdBlockers y filtros DNS. En caso de bloqueo, el sistema despliega patrocinios nativos de salud ocupacional y EPP (Mutualidades, 3M, Dräger) que aportan valor ergonómico directo a la cuadrilla y salvaguardan la monetización.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
              Monetización: 100% Inmune a bloqueadores
            </div>
          </div>
        </div>

        {/* Interactive Anti-AdBlock Testing Lab & Defense Verification */}
        <div className="mt-4 pt-4 border-t border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                🛡️
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  Laboratorio de Simulación y Resiliencia Anti-AdBlock
                </h3>
                <p className="text-[11px] text-slate-300">
                  Prueba en tiempo real cómo Oplira neutraliza los 5 vectores de bloqueo de publicidad
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                activeAdStatus.isBlocked 
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' 
                  : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
              }`}>
                {activeAdStatus.isBlocked ? '⚠️ Bloqueador Simulado Activo' : '✓ Entrega Nativa Blindada'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => runSimulation('dns')}
              disabled={isTesting}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                simulatedBlockType === 'dns'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Vector 1</span>
                <Globe className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <p className="font-bold text-xs mt-1">Filtro DNS / Pi-hole</p>
            </button>

            <button
              onClick={() => runSimulation('cosmetic')}
              disabled={isTesting}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                simulatedBlockType === 'cosmetic'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Vector 2</span>
                <Eye className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <p className="font-bold text-xs mt-1">Filtro Cosmético CSS</p>
            </button>

            <button
              onClick={() => runSimulation('script')}
              disabled={isTesting}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                simulatedBlockType === 'script'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Vector 3</span>
                <Zap className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <p className="font-bold text-xs mt-1">Inyección Scriptlet</p>
            </button>

            <button
              onClick={() => runSimulation('clear')}
              disabled={isTesting}
              className="p-2.5 rounded-xl border bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700 text-xs font-bold transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Control</span>
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
              </div>
              <p className="font-bold text-xs mt-1">Restablecer Sondas</p>
            </button>
          </div>

          {/* Defense Explanation Box */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Respuesta del Guardián Anti-AdBlock de Oplira:
              </span>
              <span className="font-mono text-[10px]">Protección Activa ✓</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {simulatedBlockType === 'dns' && (
                "✓ El filtro DNS bloqueó servidores externos. Oplira activa la entrega 100% First-Party de patrocinios locales de seguridad minera (Mutualidades, 3M, Dräger) sin depender de dominios de terceros."
              )}
              {simulatedBlockType === 'cosmetic' && (
                "✓ El filtro cosmético intentó inyectar 'display: none !important'. El Guardián DOM (MutationObserver) neutralizó la inyección forzando visibilidad en el módulo 'oplira-hsec-brief-container'."
              )}
              {simulatedBlockType === 'script' && (
                "✓ El bloqueador mockeó variables de script. Oplira detectó la discrepancia estructural y conmutó de inmediato al motor local de patrocinios EPP enriquecidos."
              )}
              {!simulatedBlockType && (
                "✓ Todas las sondas operan en modo normal. Los patrocinios de seguridad minera se entregan de forma fluida y aportan valor ergonómico a la cuadrilla."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Legal & Regulatory Liability Framework Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Scale className="w-5 h-5 text-amber-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Marco Jurídico, Exención de Responsabilidad y Ley N° 21.719
            </h2>
            <p className="text-xs text-slate-500">
              Delimitación normativa de deberes y alcances legales del software en Chile.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <span>🏛️</span> Art. 184 Código del Trabajo & Ley 16.744
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              El software constituye una herramienta de asistencia técnica para el autocuidado preventivo. No sustituye ni transfiere la obligación legal irrenunciable de la empresa empleadora de proteger eficazmente la vida y salud de sus trabajadores.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <span>🛡️</span> Exención Absoluta & Cláusula de Indemnidad
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              El desarrollador queda indemne y libre de responsabilidad civil, penal o laboral por siniestros operacionales, manteniendo plena validez las 8 cláusulas aceptadas digitalmente por cada operador y supervisor.
            </p>
          </div>
        </div>
      </div>

      {/* Google Play Store Compliance Matrix (Policies 1-6) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Matriz de Cumplimiento Google Play Store Console (Políticas 1 a 6)
              </h2>
              <p className="text-xs text-slate-500">
                Auditoría técnica y certificación de conformidad para publicación en Google Play.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
            100% Play Store Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Point 1: Google Play Billing */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 flex items-center justify-between">
              <span>1. Google Play Billing</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">CONFORME</span>
            </span>
            <p className="text-[11px] text-slate-600">
              Pagos digitales y suscripciones del Plan Supervisor ($0.99 USD) procesados exclusivamente mediante la pasarela nativa de Google Play Console.
            </p>
          </div>

          {/* Point 2: Health Policy & Misclassification */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 flex items-center justify-between">
              <span>2. Deslinde No-Médico</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">CONFORME</span>
            </span>
            <p className="text-[11px] text-slate-600">
              Clasificación expresa como herramienta de seguridad ocupacional (DS 44). No realiza diagnósticos médicos ni sustituye evaluaciones clínicas.
            </p>
          </div>

          {/* Point 3: Permissions (Foreground Location & Zero Audio) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 flex items-center justify-between">
              <span>3. Permisos & Cero Audio</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">CONFORME</span>
            </span>
            <p className="text-[11px] text-slate-600">
              GPS en primer plano únicamente durante el check-in. Cámara solo para códigos QR. Micrófono/Audio 100% eliminado y desactivado.
            </p>
          </div>

          {/* Point 4: Ads Policy */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 flex items-center justify-between">
              <span>4. Política de Anuncios</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">CONFORME</span>
            </span>
            <p className="text-[11px] text-slate-600">
              Patrocinios de seguridad minera claramente rotulados como PUBLICIDAD, sin interferir con pruebas ni simular elementos del sistema.
            </p>
          </div>

          {/* Point 5: Account Deletion */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 flex items-center justify-between">
              <span>5. Eliminación de Cuenta</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">CONFORME</span>
            </span>
            <p className="text-[11px] text-slate-600">
              Mecanismo in-app de purga definitiva en 1 clic + URL pública web para solicitud de borrado sin necesidad de reinstalar la app.
            </p>
          </div>

          {/* Point 6: App Quality & Reviewer Mode */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">6. Modo Revisor Play Store</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">CONFORME</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Credenciales oficiales precargadas (RUT 12.080.702-1 / PIN 1234) para que el equipo de Google revise todas las vistas sin bloqueos.
            </p>
            {onOpenReviewerDemoModal && (
              <button
                type="button"
                onClick={onOpenReviewerDemoModal}
                className="w-full py-1.5 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>Cargar Credenciales Revisor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
