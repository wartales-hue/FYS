import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle2, UserX, AlertCircle, Award } from 'lucide-react';
import { WorkerProfile } from '../../types';

interface WorkerPrivacyCenterProps {
  worker: WorkerProfile;
  onClose: () => void;
}

export const WorkerPrivacyCenter: React.FC<WorkerPrivacyCenterProps> = ({ worker, onClose }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 text-white space-y-6 shadow-2xl">
      {/* Title */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Centro de Privacidad del Trabajador</h2>
            <p className="text-xs text-slate-400">
              Estándar de Protección de Datos Personales y Sensibles (Ley 21.719 / Estándar Internacional)
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
        >
          Cerrar
        </button>
      </div>

      {/* 5 Core Transparency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Card 1: What data is stored */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-bold">
            <FileText className="w-4 h-4" />
            <span>1. ¿Qué información almacena FRA-HSEC?</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Se almacenan exclusivamente registros de tiempo de reacción (PVT en milisegundos), respuestas del cuestionario KSS, horas reportadas de sueño y parámetros operacionales de turno.
          </p>
          <div className="text-[11px] text-emerald-400 bg-emerald-950/40 p-2 rounded border border-emerald-800/50">
            ✓ <strong>Minimización:</strong> No se conservan imágenes faciales biométricas en servidor. La validación se ejecuta mediante token criptográfico local.
          </div>
        </div>

        {/* Card 2: Purpose */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Award className="w-4 h-4" />
            <span>2. ¿Para qué se utiliza? (Finalidad Estricta)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Finalidad 100% preventiva: alertar tempranamente condiciones de fatiga para programar pausas activas, siestas controladas o rotación antes de que ocurra un evento no deseado.
          </p>
          <div className="text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded border border-rose-800/50">
            ⛔ <strong>Garantía de No Uso Disciplinario:</strong> La plataforma prohíbe técnica y contractualmente su uso para evaluaciones de productividad, rankings o sanciones.
          </div>
        </div>

        {/* Card 3: Who has access */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <Eye className="w-4 h-4" />
            <span>3. ¿Quién puede ver la información?</span>
          </div>
          <ul className="space-y-1 text-slate-300">
            <li>• <strong>Supervisor de Turno:</strong> Solo ve el semáforo operacional (🟢/🟡/🔴) y la medida preventiva. <em>Nunca accede a diagnósticos médicos ni STOP-BANG</em>.</li>
            <li>• <strong>Salud Ocupacional:</strong> Acceso médico clínico confidencial protegido bajo secreto profesional.</li>
            <li>• <strong>HSEC:</strong> Métricas agregadas y estadísticas de flota anonimizadas.</li>
          </ul>
        </div>

        {/* Card 4: Retention & Rights */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Lock className="w-4 h-4" />
            <span>4. Derechos del Titular (Ley 21.719)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Tienes derecho permanente de acceso a tu historial completo, rectificación de mediciones erróneas, cancelación de consentimientos y solicitud de portabilidad ante el Delegado de Protección de Datos de la faena.
          </p>
          <p className="text-[11px] text-slate-400">
            Contacto oficial DPD: <span className="font-mono text-cyan-300">privacidad.hsec@minera.cl</span>
          </p>
        </div>
      </div>

      {/* Segregated Architecture Infographic */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-300">Arquitectura de Segregación de Dominios de Datos</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-center">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <span className="font-bold text-orange-400 block mb-1">Base Identidad & Turno</span>
            <p className="text-slate-400">RUT, Nombre, Faena, Turno 7x7, Equipo Asignado</p>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">Base Operacional</span>
            <p className="text-slate-400">Semáforo, Intervenciones, Tiempos de Reevaluación</p>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-indigo-700/60 bg-indigo-950/20">
            <span className="font-bold text-indigo-400 block mb-1">Base Salud Ocupacional (Aislada)</span>
            <p className="text-slate-400">Cuestionarios médicos, STOP-BANG, Apnea, Poligrafía</p>
          </div>
        </div>
      </div>
    </div>
  );
};
