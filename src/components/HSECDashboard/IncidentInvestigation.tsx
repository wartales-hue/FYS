import React, { useState } from 'react';
import { Search, FileSearch, ShieldAlert, Clock, Moon, Activity, Eye, Coffee, CheckCircle, Lock } from 'lucide-react';

export const IncidentInvestigation: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<string>('INC-2026-088');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 space-y-6 shadow-xs">
      {/* Title & Forensic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <FileSearch className="w-4 h-4" />
              <span>Módulo Forense de Investigación de Casi Incidentes</span>
            </span>
            <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 font-mono font-medium">
              Acceso Restringido & Auditado
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Reconstrucción Cronológica Integral de Factores Humanos y Fatiga
          </h2>
          <p className="text-xs text-slate-500">
            Trazabilidad punto a punto de exposición, sueño, vigilancia PVT, eventos DSM y controles operacionales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-900"
          >
            <option value="INC-2026-088">INC-088: Contacto lateral leve pretil CAEX #42 (04:22 hrs)</option>
            <option value="INC-2026-072">INC-072: Detención no programada Pala #08 por micro-sueño (03:15 hrs)</option>
          </select>
        </div>
      </div>

      {/* Case Overview Card */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <span className="font-bold text-sm text-slate-900">
            Caso: INC-2026-088 • Operador CAEX Komatsu 930E
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Fecha: 12-Agosto-2026 @ 04:22 hrs (Faena Cordillera Sur - 3.800 msnm)
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          <strong>Descripción del Evento:</strong> Durante el acarreo nocturno de lastre en rampa botadero norte, el camión CAEX #42 rozó levemente el pretil de seguridad a 18 km/h. No hubo lesionados ni daño estructural. Se activó protocolo de investigación forense SGFS.
        </p>
      </div>

      {/* Reconstructed Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
          Línea de Tiempo Forense Reconstruida por FRA-HSEC:
        </h3>

        <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-slate-200">
          {/* Item 1: Roster & Shift */}
          <div className="relative space-y-1">
            <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center text-[10px] font-bold text-white">
              1
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Exposición de Roster (19:00 hrs)</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded-md font-medium">Día 6 de 7</span>
            </div>
            <p className="text-xs text-slate-600">
              Operador asignado a su 6ª noche consecutiva de 12 horas en gran altitud (3.800 msnm).
            </p>
          </div>

          {/* Item 2: Sleep */}
          <div className="relative space-y-1">
            <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
              2
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Registro de Sueño en Campamento (18:40 hrs)</span>
              <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded-md font-medium">4.2h dormidas</span>
            </div>
            <p className="text-xs text-slate-600">
              Sueño acortado reportado (4.2 hrs reales frente a 9h de oportunidad). Deuda de sueño acumulada en 72h: 7.1 horas.
            </p>
          </div>

          {/* Item 3: Check-in & Masked Fatigue */}
          <div className="relative space-y-1">
            <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center text-[10px] font-bold text-white">
              3
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Check-In Pre-Turno: Fatiga Enmascarada (19:10 hrs)</span>
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-md font-medium">KSS 4 vs PVT +21.4%</span>
            </div>
            <p className="text-xs text-slate-600">
              Discordancia identificada por el motor: El operador reportó sentirse 'bastante alerta' (KSS 4), pero su prueba PVT objetiva mostró ralentización de +21.4% y 1 lapso &gt;500ms.
            </p>
          </div>

          {/* Item 4: DSM Telemetry */}
          <div className="relative space-y-1">
            <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full bg-slate-900 border-2 border-rose-500 flex items-center justify-center text-[10px] font-bold text-white">
              4
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Telemetría DSM en Cabina (03:52 y 04:15 hrs)</span>
              <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded-md font-medium">PERCLOS 14.8%</span>
            </div>
            <p className="text-xs text-slate-600">
              Cámara en cabina registró 2 alertas de cierre ocular prolongado (PERCLOS &gt; 12%) en plena ventana del nadir circadiano.
            </p>
          </div>

          {/* Item 5: Incident Event */}
          <div className="relative space-y-1">
            <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
              5
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-700">Contacto con Pretil (04:22 hrs)</span>
              <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-md">Evento</span>
            </div>
            <p className="text-xs text-slate-600">
              Pérdida momentánea de trayectoria por microsueño de 1.8 segundos.
            </p>
          </div>
        </div>
      </div>

      {/* Root Cause Conclusion for SGFS */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
        <span className="font-bold text-emerald-800 block flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Conclusión Sistémica y Plan de Acción Organizacional (No Punitivo):</span>
        </span>
        <p className="text-slate-700 leading-relaxed">
          La causa raíz se debió a la confluencia de deuda acumulada de sueño (noche 6) en gran altitud y el nadir circadiano (04:00 hrs). 
          <strong> Acción correctiva SGFS:</strong> Se adelanta la pausa activa obligatoria de flota a las 03:30 hrs y se incorpora el protocolo de siesta controlada de 25 min para operadores en su 5ª y 6ª noche de turno.
        </p>
      </div>
    </div>
  );
};
