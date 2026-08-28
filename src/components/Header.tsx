import React, { useState } from 'react';
import { 
  Users, 
  Cpu, 
  RefreshCw, 
  User, 
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Crown,
  Scale,
  Smartphone,
  Menu,
  X,
  MessageSquare,
  Info,
  RotateCcw
} from 'lucide-react';
import { UserRole, WorkerProfile } from '../types';
import { MOCK_WORKERS } from '../lib/mockData';
import { OpliraLogo } from './OpliraLogo';
import { isPremiumActive } from '../lib/premiumService';

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
  isSyncing?: boolean;
  onSyncNow: () => void;
  onStartNewEvaluation?: () => void;
  onOpenPersonalData?: () => void;
  onOpenFeedbackModal?: () => void;
  onOpenInformationModal?: () => void;
  onOpenPremiumModal?: () => void;
  onOpenNonMedicalModal?: () => void;
  onOpenPermissionsModal?: () => void;
  onOpenReviewerDemoModal?: () => void;
  onResetData?: () => void;
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
  isSyncing = false,
  onSyncNow,
  onStartNewEvaluation,
  onOpenPersonalData,
  onOpenFeedbackModal,
  onOpenInformationModal,
  onOpenPremiumModal,
  onOpenNonMedicalModal,
  onOpenPermissionsModal,
  onOpenReviewerDemoModal,
  onResetData,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isPremium = isPremiumActive(selectedWorker?.rut, selectedWorker?.supervisorRut);

  const handleTabClick = (role: UserRole) => {
    if ((role === 'supervisor' || role === 'hsec') && !isPremium) {
      onOpenPremiumModal?.();
      return;
    }
    onRoleChange(role);
  };

  const getRoleTitle = (role: UserRole) => {
    switch (role) {
      case 'worker':
        return 'Panel Trabajador Pre-Turno';
      case 'supervisor':
        return 'Panel de Supervisión de Cuadrilla';
      case 'hsec':
        return 'Mesa Central Analítica HSEC';
      case 'admin':
        return 'Gobernanza Algorítmica';
      default:
        return 'Control Fatiga y Somnolencia';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md w-full max-w-full overflow-x-hidden">
      {/* Main Top Header Bar (Membrete) */}
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 py-2">
        <div className="flex flex-col gap-2">
          
          {/* First Row: Brand + Prominent Action Button + Quick Tools */}
          <div className="flex items-center justify-between gap-2">
            {/* Brand & Identity */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-shrink">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-blue-400/40 shadow-xs flex items-center justify-center p-1 flex-shrink-0">
                <OpliraLogo size={24} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-sm sm:text-lg font-black text-white tracking-tight leading-none">Oplira</span>
                  <span className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 whitespace-nowrap">
                    CONTROL FATIGA Y SOMNOLENCIA
                  </span>
                  {!isOnline && (
                    <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                      Off
                    </span>
                  )}
                </div>
                <span className="text-[9.5px] sm:text-[11px] text-slate-400 font-medium block truncate">
                  {getRoleTitle(currentRole)}
                </span>
              </div>
            </div>

            {/* Quick Actions & Tools on Right */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Información Button */}
              <button
                id="header-informacion-btn"
                onClick={onOpenInformationModal}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold text-[11px] border border-slate-700 transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                title="Información de la App y Validación Científica"
              >
                <Info className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Info</span>
              </button>

              {/* Buzón de Comentarios */}
              <button
                id="header-mejoras-comentarios-btn"
                onClick={onOpenFeedbackModal}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold text-[11px] border border-slate-700 transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                title="Buzón de mejoras y comentarios"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Comentarios</span>
              </button>

              {/* Sync Badge if items pending */}
              {pendingSyncCount > 0 && (
                <button
                  id="sync-now-btn"
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-bold text-xs shadow-xs cursor-pointer"
                  title="Sincronizar evaluaciones pendientes"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>({pendingSyncCount})</span>
                </button>
              )}

              {/* Mobile / Extra Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer border border-slate-700 flex-shrink-0"
                aria-label="Abrir opciones adicionales"
              >
                {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Second Row: Prominent "Realizar nueva evaluación de FYS" button */}
          {onStartNewEvaluation && (
            <div className="w-full">
              <button
                id="header-nueva-evaluacion-fys-btn"
                onClick={onStartNewEvaluation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md border border-emerald-400/60 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                title="Realizar nueva evaluación de Fatiga y Somnolencia (FYS) desde el inicio"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin-reverse" />
                <span className="tracking-wide uppercase">Realizar nueva evaluación de FYS</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Dropdown Menu for Secondary Actions */}
        {isMenuOpen && (
          <div className="pt-2 pb-1 mt-2 border-t border-slate-800 space-y-2 animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenInformationModal?.();
                }}
                className="p-2 rounded-xl bg-slate-800 text-sky-300 font-bold flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Base Científica</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenFeedbackModal?.();
                }}
                className="p-2 rounded-xl bg-slate-800 text-amber-300 font-bold flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Comentarios</span>
              </button>

              {onOpenReviewerDemoModal && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenReviewerDemoModal();
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-amber-300 font-bold flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Demo Revisor</span>
                </button>
              )}

              {onOpenPermissionsModal && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenPermissionsModal();
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 font-medium flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Permisos GPS</span>
                </button>
              )}

              {onResetData && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (window.confirm('¿Deseas reiniciar la aplicación para ingresar como un nuevo trabajador desde cero?')) {
                      onResetData();
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-rose-300 font-medium flex items-center justify-center gap-1.5 border border-slate-700 col-span-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar para Nuevo Trabajador</span>
                </button>
              )}

              {currentRole === 'supervisor' && !isPremium && onOpenPremiumModal && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenPremiumModal();
                  }}
                  className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-1.5 col-span-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Plan Supervisor</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Responsive Role Selector Tabs (Grid on mobile, fits 100% width with no scroll) */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 pt-2 pb-0.5 w-full">
          <button
            id="role-tab-worker"
            onClick={() => onRoleChange('worker')}
            className={`flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border ${
              currentRole === 'worker'
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-300 flex-shrink-0" />
            <span className="truncate">Trabajador</span>
          </button>

          <button
            id="role-tab-supervisor"
            onClick={() => handleTabClick('supervisor')}
            className={`flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border ${
              currentRole === 'supervisor'
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-300 flex-shrink-0" />
            <span className="truncate">Supervisor</span>
            {!isPremium && (
              <span className="text-[7.5px] sm:text-[8px] bg-amber-400 text-slate-950 font-black px-1 py-0.2 rounded font-mono hidden xs:inline">
                PRO
              </span>
            )}
          </button>

          <button
            id="role-tab-hsec"
            onClick={() => handleTabClick('hsec')}
            className={`flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border ${
              currentRole === 'hsec'
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-300 flex-shrink-0" />
            <span className="truncate">HSEC</span>
            {!isPremium && (
              <span className="text-[7.5px] sm:text-[8px] bg-amber-400 text-slate-950 font-black px-1 py-0.2 rounded font-mono hidden xs:inline">
                PRO
              </span>
            )}
          </button>

          <button
            id="role-tab-admin"
            onClick={() => onRoleChange('admin')}
            className={`flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border ${
              currentRole === 'admin'
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-300 flex-shrink-0" />
            <span className="truncate">Gobernanza</span>
          </button>
        </div>
      </div>

      {/* Operational Safety Interlock Banner if vehicle is moving */}
      {isVehicleMoving && (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>BLOQUEO DE SEGURIDAD: Vehículo en movimiento. Detén la máquina para realizar pruebas.</span>
        </div>
      )}
    </header>
  );
};
