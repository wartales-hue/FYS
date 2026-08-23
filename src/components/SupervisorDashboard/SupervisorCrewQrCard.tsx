import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  Lock, 
  Users, 
  Sparkles, 
  Info,
  Radio,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { SupervisorCrewProfile } from '../../types';
import { getAllSupervisors } from '../../lib/supervisorCrewManager';

interface SupervisorCrewQrCardProps {
  currentSupervisor?: SupervisorCrewProfile;
}

export const SupervisorCrewQrCard: React.FC<SupervisorCrewQrCardProps> = ({
  currentSupervisor
}) => {
  const supervisors = getAllSupervisors();
  const [selectedCode, setSelectedCode] = useState<string>(currentSupervisor?.code || supervisors[0].code);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullScreenModal, setIsFullScreenModal] = useState<boolean>(false);

  const activeSup = supervisors.find(s => s.code === selectedCode) || supervisors[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeSup.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareSupervisor = async () => {
    const text = `Código de Cuadrilla FYS: ${activeSup.code}\nSupervisor: ${activeSup.name} (RUT: ${activeSup.rut})\nEmpresa: ${activeSup.company} - ${activeSup.faena}\nTurno: ${activeSup.shiftName}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Código Cuadrilla ${activeSup.code}`,
          text: text
        });
      } catch {}
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 rounded-2xl p-5 sm:p-6 text-white shadow-lg space-y-5">
      {/* Header with Title and Supervisor Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
              Sincronización de Cuadrilla & Turno
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/30">
              Plan Cuadrilla Pro
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            <span>Código de Cuadrilla & QR para el Turno</span>
          </h3>
          <p className="text-xs text-slate-300">
            Proyecta o comparte este código en la charla de 5 minutos para que tu grupo se vincule a tu sesión.
          </p>
        </div>

        {/* Switch supervisor profile (if testing multiple roles) */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-700">
          <span className="text-[11px] text-slate-400 pl-2">Perfil Activo:</span>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="bg-slate-800 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {supervisors.map(s => (
              <option key={s.code} value={s.code}>
                {s.code} - {s.name} ({s.shiftName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content: QR Code + Supervisor Inmutable Identity Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* QR Code Canvas */}
        <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-4 rounded-xl border-4 border-amber-400/80 shadow-md">
          <QRCodeSVG
            value={activeSup.qrPayload}
            size={160}
            level="H"
            includeMargin={false}
            className="w-36 h-36 sm:w-40 sm:h-40"
          />
          <div className="mt-3 flex items-center justify-between w-full pt-2 border-t border-slate-200">
            <span className="text-[11px] font-mono font-bold text-slate-900">
              {activeSup.code}
            </span>
            <button
              type="button"
              onClick={() => setIsFullScreenModal(true)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Ampliar</span>
            </button>
          </div>
        </div>

        {/* Supervisor Identity Details & Anti-Abuse Lock */}
        <div className="md:col-span-8 space-y-3 text-xs">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium text-[11px]">Código Alfanumérico Directo:</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900 px-4 py-2 rounded-xl border-2 border-amber-400/60 font-mono text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-wider">
                {activeSup.code}
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] text-slate-400 font-sans">
                  Los trabajadores pueden digitar este código o escanear el QR desde su app.
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleShareSupervisor}
                    className="text-[11px] text-amber-300 hover:text-amber-200 underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" /> Compartir por WhatsApp / Cuadrilla
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Identity Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>Supervisor Titular</span>
                <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40 flex items-center gap-0.5 font-semibold">
                  <Lock className="w-2.5 h-2.5" /> Certificado
                </span>
              </div>
              <p className="font-bold text-sm text-white">{activeSup.name}</p>
              <p className="text-slate-300 font-mono text-[11px]">RUT: {activeSup.rut}</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>Faena & Turno</span>
                <span className="text-slate-400 font-sans">{activeSup.company}</span>
              </div>
              <p className="font-bold text-sm text-white truncate">{activeSup.faena}</p>
              <p className="text-amber-300 font-medium text-[11px]">{activeSup.shiftName}</p>
            </div>
          </div>

          {/* Quota & Anti-Fraud Explanation */}
          <div className="bg-indigo-950/60 border border-indigo-500/30 p-3 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] text-indigo-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  Cupo de Cuadrilla Activo: {activeSup.activeLinkedWorkers} / {activeSup.maxCrewQuota} Operadores
                </span>
                <span className="text-emerald-400 font-bold">100% Operacional</span>
              </div>
              <p className="text-slate-300 text-[10px] leading-relaxed">
                Por integridad pericial y protección de licencia, el <strong>RUT y Nombre del Supervisor</strong> son inmutables. Todas las evaluaciones que ingresen este código sumarán automáticamente a tus estadísticas de turno y despachos HSEC.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen QR Modal for Tablet / 5-min Safety Talk */}
      {isFullScreenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsFullScreenModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 border border-slate-700 cursor-pointer"
            >
              <Minimize2 className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                Charla 5 Minutos • Escaneo de Cuadrilla
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-2">
                {activeSup.name}
              </h2>
              <p className="text-xs text-slate-400">
                {activeSup.company} • {activeSup.shiftName}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl mx-auto inline-block border-4 border-amber-400 shadow-xl">
              <QRCodeSVG
                value={activeSup.qrPayload}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 block">O digita el código en tu app:</span>
              <div className="font-mono text-3xl font-black text-amber-400 tracking-wider">
                {activeSup.code}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFullScreenModal(false)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              Cerrar Vista Ampliada
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
