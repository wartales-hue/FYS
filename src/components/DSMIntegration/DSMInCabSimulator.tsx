import React, { useState, useEffect } from 'react';
import { Eye, Video, Car, AlertTriangle, ShieldCheck, Zap, Activity, RefreshCw } from 'lucide-react';
import { WorkerProfile, DSMEvent } from '../../types';

interface DSMInCabSimulatorProps {
  worker: WorkerProfile;
  isVehicleMoving: boolean;
  onTriggerMicroPvt: () => void;
}

export const DSMInCabSimulator: React.FC<DSMInCabSimulatorProps> = ({
  worker,
  isVehicleMoving,
  onTriggerMicroPvt,
}) => {
  const [perclos, setPerclos] = useState<number>(4.2); // Percentage eye closure
  const [blinkRate, setBlinkRate] = useState<number>(14); // Blinks per min
  const [yawnCount, setYawnCount] = useState<number>(0);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // Dynamic simulation ticker
  useEffect(() => {
    const interval = setInterval(() => {
      // Small random fluctuation
      const newPerclos = Number((Math.random() * 3 + (activeAlert ? 12 : 4)).toFixed(1));
      setPerclos(newPerclos);
      setBlinkRate(Math.floor(Math.random() * 8) + 12);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeAlert]);

  const simulateMicroSleep = () => {
    setActiveAlert('Alerta DSM: Cierre ocular prolongado detectado (PERCLOS 16.4% > Umbral 12%)');
    setPerclos(16.4);
    setYawnCount(prev => prev + 1);
  };

  const clearAlert = () => {
    setActiveAlert(null);
    setPerclos(4.5);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 space-y-5 shadow-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-4 h-4" />
              <span>Driver State Monitor (DSM) Telemetría Cabina</span>
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-medium">
              Integración Cámara IA
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Simulador de Telemetría Conductual en {worker.equipmentAssigned}
          </h2>
          <p className="text-xs text-slate-500">
            Monitoreo en tiempo real de PERCLOS, parpadeos y bostezos con protocolo de seguridad para micro-pruebas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
            isVehicleMoving 
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <Car className="w-3.5 h-3.5" />
            <span>{isVehicleMoving ? 'Vehículo en Movimiento (32 km/h)' : 'Vehículo Detenido (0 km/h - SEGURO)'}</span>
          </span>
        </div>
      </div>

      {/* Simulated Camera Feed & Telemetry Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camera visual feed box */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between h-64 text-white">
          <div className="flex items-center justify-between text-xs z-10">
            <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded text-[11px] font-mono text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>REC • CABINA {worker.equipmentAssigned}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">FPS: 30 • Latencia: 18ms</span>
          </div>

          {/* Center Face Landmark Graphic */}
          <div className="text-center my-auto space-y-2 z-10">
            <div className={`w-24 h-24 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
              activeAlert ? 'border-rose-500 bg-rose-950/40 animate-pulse' : 'border-emerald-500/60 bg-emerald-950/20'
            }`}>
              <Eye className={`w-10 h-10 ${activeAlert ? 'text-rose-400' : 'text-emerald-400'}`} />
            </div>
            <p className="text-xs font-mono text-slate-300">
              {worker.name} • FaceMesh 3D Tracking
            </p>
          </div>

          {/* Bottom telemetry overlay */}
          <div className="flex items-center justify-between text-[11px] font-mono bg-black/60 px-2.5 py-1 rounded text-slate-300 z-10">
            <span>PERCLOS: <strong className={perclos > 12 ? 'text-rose-400' : 'text-emerald-400'}>{perclos}%</strong></span>
            <span>Parpadeo: {blinkRate}/min</span>
            <span>Bostezos: {yawnCount}</span>
          </div>
        </div>

        {/* Telemetry Metrics & Triggers */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Análisis Telemetría Conductual:
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-600">Índice PERCLOS (Tiempo ojos cerrados):</span>
                <span className={`font-mono font-bold ${perclos > 12 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {perclos}% {perclos > 12 ? '(ALERTA ≥12%)' : '(Normal)'}
                </span>
              </div>

              <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-600">Frecuencia de Parpadeo:</span>
                <span className="font-mono font-bold text-slate-800">{blinkRate} / minuto</span>
              </div>

              <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-600">Patrón de Somnolencia Conductual:</span>
                <span className="font-bold text-emerald-800">
                  {activeAlert ? 'Posible Fatiga Detectada' : 'Atención en Ruta Óptima'}
                </span>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={simulateMicroSleep}
                className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Simular Alerta de Microsueño
              </button>
              <button
                onClick={clearAlert}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Normalizar
              </button>
            </div>

            {/* Micro PVT Trigger button compliant with vehicle safety */}
            <button
              onClick={onTriggerMicroPvt}
              disabled={isVehicleMoving}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isVehicleMoving
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{isVehicleMoving ? 'Micro-PVT Bloqueado (Vehículo en Movimiento)' : 'Solicitar Micro-PVT de Confirmación (Vehículo Detenido)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
