import React from 'react';
import { 
  Shield, 
  Activity, 
  Users, 
  BarChart3, 
  Stethoscope, 
  Cpu, 
  Wifi, 
  WifiOff, 
  Car, 
  AlertTriangle,
  RefreshCw,
  Lock,
  HardHat,
  User
} from 'lucide-react';
import { UserRole, WorkerProfile } from '../types';
import { MOCK_WORKERS } from '../lib/mockData';
import { OpliraLogo } from './OpliraLogo';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedWorker: WorkerProfile;
  workers?: WorkerProfile[];
  onWorkerChange: (worker: WorkerProfile) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  isVehicleMoving: boolean;
  onToggleVehicleMoving: () => void;
  pendingSyncCount: number;
  onSyncNow: () => void;
  onOpenPersonalData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  selectedWorker,
  workers = MOCK_WORKERS,
  onWorkerChange,
  isOnline,
  onToggleOnline,
  isVehicleMoving,
  onToggleVehicleMoving,
  pendingSyncCount,
  onSyncNow,
  onOpenPersonalData,
}) => {
  const roles: { id: UserRole; label: string; icon: React.ReactNode; badge: string }[] = [
    { id: 'worker', label: 'Trabajador / Móvil', icon: <HardHat className="w-4 h-4" />, badge: 'Operador' },
    { id: 'supervisor', label: 'Supervisor de Turno', icon: <Users className="w-4 h-4" />, badge: 'Operacional' },
    { id: 'hsec', label: 'Gestión HSEC & FRMS', icon: <BarChart3 className="w-4 h-4" />, badge: 'Analítica' },
    { id: 'health', label: 'Salud Ocupacional', icon: <Stethoscope className="w-4 h-4" />, badge: 'Médico' },
    { id: 'admin', label: 'Gobernanza Algoritmo', icon: <Cpu className="w-4 h-4" />, badge: 'I+D' },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-sm">
      {/* Top Bar: Brand, Status, Role Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:md:items-center md:justify-between gap-3">
        {/* Brand & System Definition */}
        <div className="flex items-center gap-3">
          <div className="p-0.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xs">
            <OpliraLogo size={38} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-base text-white">Oplira FYS</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                v2.0
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Ley 21.719 • DS 44 Minería
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sistema de Gestión y Evaluación del Riesgo de Fatiga y Somnolencia
            </p>
          </div>
        </div>

        {/* Global Controls: Online/Offline, Sync Queue */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Offline / Online Network Simulator */}
          <button
            id="network-status-toggle-btn"
            onClick={onToggleOnline}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              isOnline
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-amber-950/60 border-amber-600 text-amber-300'
            }`}
            title="Simular modo Offline-First con cola de sincronización"
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </button>

          {/* Sync Queue */}
          {pendingSyncCount > 0 && (
            <button
              id="sync-now-btn"
              onClick={onSyncNow}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-950/60 border border-orange-600 text-orange-300 hover:bg-orange-900/70 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Sync ({pendingSyncCount})</span>
            </button>
          )}

          {/* Registered Worker Identification Badge & Free Personal Data Access Button */}
          <div className="flex items-center gap-2">
            <button
              id="header-open-personal-data-btn"
              onClick={onOpenPersonalData}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/90 text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs group"
              title="Acceder y editar libremente sus datos personales y supervisor"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 uppercase font-semibold group-hover:text-amber-300 transition-colors">
                  Operador Registrado
                </span>
                <span className="text-xs font-bold text-white leading-tight">
                  {selectedWorker.name || 'Trabajador'}
                </span>
              </div>
              {selectedWorker.rut && (
                <span className="ml-1 text-[10px] font-mono bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                  {selectedWorker.rut}
                </span>
              )}
              <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded flex items-center gap-1 ml-1 group-hover:bg-amber-400">
                <User className="w-3 h-3" />
                <span>Datos Personales</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Navigation Bar */}
      <div className="bg-slate-950 border-t border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
          {roles.map((r) => {
            const isActive = currentRole === r.id;
            return (
              <button
                id={`role-tab-${r.id}`}
                key={r.id}
                onClick={() => onRoleChange(r.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
                {r.id === 'health' && (
                  <span className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-700/50 flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Privado
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Safety Interlock Banner if vehicle is moving */}
      {isVehicleMoving && (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>BLOQUEO DE SEGURIDAD OPERACIONAL: Vehículo en movimiento. La aplicación bloquea la realización de pruebas PVT hasta detenerse de forma segura.</span>
        </div>
      )}
    </header>
  );
};
