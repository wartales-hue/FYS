import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  FileDown, 
  Share2, 
  QrCode, 
  Mountain, 
  Clock, 
  Calendar, 
  User, 
  HardHat, 
  Lock, 
  Scale, 
  ExternalLink,
  Printer,
  Sparkles
} from 'lucide-react';
import { WorkerProfile, FRARiskEvaluation } from '../../types';
import { OpliraLogo } from '../OpliraLogo';
import { downloadEvaluationPDF, shareEvaluationPDFNative } from '../../lib/pdfGenerator';

interface DigitalPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  evaluation?: FRARiskEvaluation;
}

export const DigitalPassModal: React.FC<DigitalPassModalProps> = ({
  isOpen,
  onClose,
  worker,
  evaluation
}) => {
  if (!isOpen) return null;

  const evalDate = evaluation ? new Date(evaluation.timestamp).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const status = evaluation?.status || 'green';
  const statusLabel = evaluation?.statusLabel || 'APTO PARA EL TURNO';
  const shaHash = evaluation?.cryptographicSeal?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const handleDownload = () => {
    if (evaluation) {
      downloadEvaluationPDF(worker, evaluation);
    }
  };

  const handleShare = () => {
    if (evaluation) {
      shareEvaluationPDFNative(worker, evaluation);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[94vh] overflow-hidden text-slate-900 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-slate-800 border border-slate-700">
              <QrCode className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                Pase de Turno y Credencial HSEC
              </span>
              <h2 className="text-sm font-bold text-white leading-tight">
                Certificado Digital de Aptitud Operacional
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

        {/* Pass Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-slate-50 flex-1">
          {/* Main Digital Card (Badge Style) */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-5 space-y-4 relative overflow-hidden">
            {/* Holographic Watermark Band */}
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600" />
            
            {/* Top Identity Row */}
            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center p-1 shadow-xs flex-shrink-0">
                  <OpliraLogo size={28} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    OPLIRA SGFS HSEC • CHILE
                  </span>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {worker.name || 'Operador en Faena'}
                  </h3>
                  <span className="text-xs font-mono font-bold text-blue-700">
                    RUT: {worker.rut || '12.345.678-9'}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                DS 44 MINERÍA
              </span>
            </div>

            {/* Readiness Banner Badge */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              status === 'green'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : status === 'yellow'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : status === 'red'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-slate-100 border-slate-300 text-slate-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">
                  {status === 'green' && '🟢'}
                  {status === 'yellow' && '🟡'}
                  {status === 'red' && '🔴'}
                  {status === 'gray' && '⚪'}
                </span>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider block opacity-75">
                    DIAGNÓSTICO PRE-TURNO
                  </span>
                  <span className="text-xs font-black tracking-tight block">
                    {statusLabel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 block">EMISIÓN</span>
                <span className="text-[10px] font-mono font-bold">{evalDate}</span>
              </div>
            </div>

            {/* Operator & Operational Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <HardHat className="w-3 h-3 text-slate-600" />
                  Cargo & Equipo
                </span>
                <strong className="text-slate-900 block truncate">
                  {worker.role || 'Operador'} • {worker.equipmentAssigned || 'Equipo Asignado'}
                </strong>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-slate-600" />
                  Faena & Altitud
                </span>
                <strong className="text-slate-900 block truncate">
                  {worker.faena || 'Faena'} ({worker.altitudeMeters || 0} msnm)
                </strong>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  Sensotécnico Micro-PVT
                </span>
                <strong className="text-slate-900 block font-mono">
                  {worker.baseline?.meanRT || 240} ms (Normal)
                </strong>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  Turno & Jornada
                </span>
                <strong className="text-slate-900 block">
                  Día {worker.currentShift?.dayInRoster || 1} ({worker.currentShift?.rosterPattern || '7x7'})
                </strong>
              </div>
            </div>

            {/* Cryptographic QR Code Verification Box */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-lg flex-shrink-0">
                {/* Visual Representation of Crypto QR Code */}
                <div className="w-16 h-16 bg-slate-900 rounded flex flex-col items-center justify-center p-1 relative overflow-hidden">
                  <div className="grid grid-cols-4 gap-0.5 w-full h-full p-0.5">
                    <div className="bg-white rounded-2xs" />
                    <div className="bg-white rounded-2xs" />
                    <div className="bg-slate-900" />
                    <div className="bg-white rounded-2xs" />
                    <div className="bg-white rounded-2xs" />
                    <div className="bg-slate-900" />
                    <div className="bg-white rounded-2xs" />
                    <div className="bg-white rounded-2xs" />
                    <div className="bg-slate-900" />
                    <div className="bg-white rounded-2xs" />
                    <div className="bg-white rounded-2xs" />
                    <div className="bg-slate-900" />
                    <div className="bg-white rounded-2xs" />
                    <div className="bg-white rounded-2xs" />
                    <div className="bg-slate-900" />
                    <div className="bg-white rounded-2xs" />
                  </div>
                </div>
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block">
                  SELLO CRIPTOGRÁFICO DE VERIFICACIÓN OFFLINE
                </span>
                <div className="text-[9px] font-mono text-slate-400 truncate break-all">
                  SHA-256: {shaHash}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Válido para control de acceso y portería</span>
                </div>
              </div>
            </div>

            {/* Legal & Compliance Footer */}
            <div className="text-[10px] text-slate-500 leading-tight text-center pt-1 border-t border-slate-100">
              Conforme con el <strong>Decreto Supremo N° 44 (Reglamento de Seguridad Minera)</strong> y <strong>Ley N° 21.719</strong>. Válido durante la jornada laboral actual.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="download-pass-pdf-btn"
              type="button"
              onClick={handleDownload}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>

            <button
              id="share-pass-btn"
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Compartir</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Cerrar Pase
          </button>
        </div>
      </div>
    </div>
  );
};
