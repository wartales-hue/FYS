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
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Brand & Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-blue-400/40 shadow-xs flex items-center justify-center p-1 flex-shrink-0">
              <OpliraLogo size={26} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base sm:text-lg font-black text-white tracking-tight leading-none">Oplira</span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 whitespace-nowrap">
                  Control F&S
                </span>
                {!isOnline && (
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    Offline
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                {getRoleTitle(currentRole)}
              </span>
            </div>
          </div>

          {/* Quick Actions & Status on Right */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Información Button (Icon on mobile, text on desktop) */}
            <button
              id="header-informacion-btn"
              onClick={onOpenInformationModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold text-[11px] border border-slate-700 transition-colors cursor-pointer shadow-xs"
              title="Información de la App y Validación Científica del Modelo"
            >
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Información</span>
            </button>

            {/* Buzón de Mejoras o Comentarios (Accessible to everyone) */}
            <button
              id="header-mejoras-comentarios-btn"
              onClick={onOpenFeedbackModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-[11px] border border-slate-700 transition-colors cursor-pointer shadow-xs"
              title="Buzón de mejoras, reclamos y sugerencias de faena"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Mejoras o Comentarios</span>
              <span className="lg:hidden hidden md:inline">Comentarios</span>
            </button>

            {/* Nuevo Trabajador / Reiniciar Datos */}
            {onResetData && (
              <button
                id="header-reset-worker-btn"
                onClick={() => {
                  if (window.confirm('¿Deseas reiniciar la aplicación para ingresar como un nuevo trabajador desde cero?')) {
                    onResetData();
                  }
                }}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 font-medium text-[11px] border border-slate-700 hover:border-rose-800/50 transition-colors cursor-pointer"
                title="Limpiar datos e ingresar como nuevo trabajador"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nuevo Registro</span>
              </button>
            )}

            {/* Sync Badge if items pending */}
            {pendingSyncCount > 0 && (
              <button
                id="sync-now-btn"
                onClick={onSyncNow}
                disabled={isSyncing}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                title="Sincronizar evaluaciones pendientes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync</span>
                <span>({pendingSyncCount})</span>
              </button>
            )}

            {/* Premium Indicator / Button - ONLY in supervisor role or when premium is active */}
            {isPremium ? (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 font-bold text-[11px]">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Premium</span>
              </div>
            ) : currentRole === 'supervisor' ? (
              <button
                id="header-upgrade-premium-btn"
                onClick={onOpenPremiumModal}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer"
                title="Plan Supervisor en Google Play"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Plan Supervisor</span>
              </button>
            ) : null}

            {/* Quick Helper Links (Desktop) */}
            <div className="hidden md:flex items-center gap-1.5 text-xs">
              {onOpenReviewerDemoModal && (
                <button
                  id="header-reviewer-demo-btn"
                  onClick={onOpenReviewerDemoModal}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] border border-slate-700 transition-colors cursor-pointer"
                  title="Credenciales de Prueba para Google Play"
                >
                  <Smartphone className="w-3 h-3 inline mr-1 text-amber-400" />
                  <span>Revisor Play</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer border border-slate-700 flex-shrink-0"
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu for Secondary Actions */}
        {isMenuOpen && (
          <div className="md:hidden pt-3 pb-2 mt-2 border-t border-slate-800 space-y-2 animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenInformationModal?.();
                }}
                className="p-2.5 rounded-xl bg-slate-800 text-sky-300 font-bold flex items-center justify-center gap-1.5 border border-slate-700 col-span-2 sm:col-span-1"
              >
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Información & Base Científica</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenFeedbackModal?.();
                }}
                className="p-2.5 rounded-xl bg-slate-800 text-amber-300 font-bold flex items-center justify-center gap-1.5 border border-slate-700 col-span-2 sm:col-span-1"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Mejoras o Comentarios</span>
              </button>

              {onOpenReviewerDemoModal && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenReviewerDemoModal();
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 text-amber-300 font-bold flex items-center justify-center gap-1.5 border border-slate-700"
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
                  className="p-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium flex items-center justify-center gap-1.5 border border-slate-700"
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
                  className="p-2.5 rounded-xl bg-slate-800 text-rose-300 font-medium flex items-center justify-center gap-1.5 border border-slate-700 col-span-2"
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
                  className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Plan Supervisor</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Clean Modern Role Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 scrollbar-none">
          <button
            id="role-tab-worker"
            onClick={() => onRoleChange('worker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              currentRole === 'worker'
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-300" />
            <span>Trabajador</span>
          </button>

          <button
            id="role-tab-supervisor"
            onClick={() => handleTabClick('supervisor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              currentRole === 'supervisor'
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-300" />
            <span>Supervisor</span>
            {!isPremium && (
              <span className="text-[8px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                PRO
              </span>
            )}
          </button>

          <button
            id="role-tab-hsec"
            onClick={() => handleTabClick('hsec')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              currentRole === 'hsec'
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            <span>Central HSEC</span>
            {!isPremium && (
              <span className="text-[8px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                PRO
              </span>
            )}
          </button>

          <button
            id="role-tab-admin"
            onClick={() => onRoleChange('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              currentRole === 'admin'
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-300" />
            <span>Gobernanza</span>
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
