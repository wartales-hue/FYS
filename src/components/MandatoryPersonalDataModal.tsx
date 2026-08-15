import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  FileText, 
  MapPin, 
  Mountain, 
  Briefcase, 
  Truck, 
  Calendar, 
  Clock, 
  Sun, 
  Moon, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Scale,
  Mail
} from 'lucide-react';
import { WorkerProfile } from '../types';
import { OpliraLogo } from './OpliraLogo';
import { validateRut, formatRut, cleanRut } from '../lib/rutValidator';
import { RutErrorModal } from './RutErrorModal';

interface MandatoryPersonalDataModalProps {
  isOpen: boolean;
  worker: WorkerProfile;
  onSave: (updatedProfile: WorkerProfile) => void;
}

export const MandatoryPersonalDataModal: React.FC<MandatoryPersonalDataModalProps> = ({
  isOpen,
  worker,
  onSave
}) => {
  const [name, setName] = useState(worker.name || '');
  const [rut, setRut] = useState(worker.rut || '');
  const [company, setCompany] = useState(worker.company || 'Minera Los Andes');
  const [role, setRole] = useState(worker.role || 'Operador CAEX');
  const [equipmentAssigned, setEquipmentAssigned] = useState(worker.equipmentAssigned || 'CAEX #42');
  const [faena, setFaena] = useState(worker.faena || 'Faena Cordillera Sur');
  const [altitudeMeters, setAltitudeMeters] = useState(worker.altitudeMeters || 3800);
  const [birthDate, setBirthDate] = useState(worker.birthDate || '1988-06-15');
  const [gender, setGender] = useState<'Masculino' | 'Femenino' | 'Otro'>(worker.gender || 'Masculino');
  const [supervisorName, setSupervisorName] = useState(worker.supervisorName || 'Carlos Henríquez');
  const [supervisorEmail, setSupervisorEmail] = useState(worker.supervisorEmail || 'supervisor.faena@minera.cl');
  
  // Shift Pattern and Habitual Shift Type
  const [shiftPattern, setShiftPattern] = useState<string>(worker.shiftPattern || worker.currentShift?.rosterPattern || '7x7');
  const [habitualShiftType, setHabitualShiftType] = useState<'day' | 'night' | 'rotative'>(
    worker.habitualShiftType || (worker.currentShift?.type === 'night' ? 'night' : 'day')
  );

  // RUT Error Modal state
  const [showRutErrorModal, setShowRutErrorModal] = useState(false);
  const [rutErrorMessage, setRutErrorMessage] = useState('');

  useEffect(() => {
    if (worker) {
      setName(worker.name || '');
      setRut(worker.rut || '');
      setCompany(worker.company || 'Minera Los Andes');
      setRole(worker.role || 'Operador CAEX');
      setEquipmentAssigned(worker.equipmentAssigned || 'CAEX #42');
      setFaena(worker.faena || 'Faena Cordillera Sur');
      setAltitudeMeters(worker.altitudeMeters || 3800);
      setBirthDate(worker.birthDate || '1988-06-15');
      setGender(worker.gender || 'Masculino');
      setSupervisorName(worker.supervisorName || 'Carlos Henríquez');
      setSupervisorEmail(worker.supervisorEmail || 'supervisor.faena@minera.cl');
      setShiftPattern(worker.shiftPattern || '7x7');
      setHabitualShiftType(worker.habitualShiftType || 'day');
    }
  }, [worker]);

  if (!isOpen) return null;

  const handleRutBlur = () => {
    if (rut.trim()) {
      const rutCheck = validateRut(rut);
      if (!rutCheck.isValid) {
        setRutErrorMessage(rutCheck.message || 'El RUT ingresado no es válido según el algoritmo Módulo 11.');
        setShowRutErrorModal(true);
      } else {
        setRut(formatRut(rut));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar RUT con algoritmo
    const rutCheck = validateRut(rut);
    if (!rutCheck.isValid) {
      setRutErrorMessage(rutCheck.message || 'El RUT ingresado no es válido según el algoritmo Módulo 11 chileno.');
      setShowRutErrorModal(true);
      return;
    }

    const formattedRutStr = formatRut(rut);
    const cleanedRutStr = cleanRut(rut);
    const cleanedOldRut = cleanRut(worker.rut || '');
    const trimmedName = name.trim();
    const oldTrimmedName = (worker.name || '').trim();

    // 2. Comprobar si cambió Nombre o RUT para invalidar consentimiento previo
    const identityChanged = cleanedRutStr !== cleanedOldRut || trimmedName.toLowerCase() !== oldTrimmedName.toLowerCase();

    const updatedWorker: WorkerProfile = {
      ...worker,
      name: trimmedName,
      rut: formattedRutStr,
      company: company.trim(),
      role: role.trim(),
      equipmentAssigned: equipmentAssigned.trim(),
      faena: faena.trim(),
      altitudeMeters: Number(altitudeMeters),
      birthDate,
      gender,
      supervisorName: supervisorName.trim(),
      supervisorEmail: supervisorEmail.trim().toLowerCase(),
      shiftPattern,
      habitualShiftType,
      profileCompleted: true,
      // Si la identidad cambió, se debe forzar un nuevo consentimiento
      legalConsent: identityChanged ? undefined : worker.legalConsent,
      currentShift: {
        ...worker.currentShift,
        type: habitualShiftType === 'night' ? 'night' : 'day',
        rosterPattern: shiftPattern
      }
    };

    onSave(updatedWorker);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
        <div 
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden text-slate-900"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 shadow-xs">
                <OpliraLogo size={36} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    Paso 1 Obligatorio
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Registro de Datos Personales
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                  Ficha del Trabajador & Parámetros de Turno
                </h2>
              </div>
            </div>
          </div>

          {/* Mandatory notice */}
          <div className="bg-amber-50 px-5 py-3 border-b border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Requisito Previo Obligatorio:</strong> Antes de autorizar los documentos legales y consentimientos informados de Oplira FYS HSEC, debe completar su ficha de identificación y parámetros base de turno.
            </p>
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-800 flex-1 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-slate-800 block">
                  Nombre Completo del Trabajador: <span className="text-rose-600">*</span>
                </label>
                <input
                  id="mandatory-worker-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Alejandro Morales Sepúlveda"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-semibold text-xs transition-colors"
                />
              </div>

              {/* RUT */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 block">
                    RUT (Cédula de Identidad): <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Verificado con Algoritmo Módulo 11
                  </span>
                </div>
                <input
                  id="mandatory-worker-rut"
                  type="text"
                  required
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  onBlur={handleRutBlur}
                  placeholder="Ej: 14.892.415-3 o 14892415-3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-mono font-bold text-xs transition-colors"
                />
              </div>

              {/* Shift Pattern */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Tipo / Sistema de Turno Base: <span className="text-rose-600">*</span>
                </label>
                <select
                  id="mandatory-shift-pattern"
                  value={shiftPattern}
                  onChange={(e) => setShiftPattern(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <option value="7x7">7x7 Continuo (7 días trabajo x 7 descanso)</option>
                  <option value="4x3">4x3 (4 días trabajo x 3 descanso)</option>
                  <option value="14x14">14x14 Continuo</option>
                  <option value="5x2">5x2 (Lunes a Viernes)</option>
                  <option value="6x1">6x1 Faena</option>
                  <option value="Turno Especial">Turno Especial / Rol Flexible</option>
                </select>
              </div>

              {/* Habitual Shift Type */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Jornada Habitual: <span className="text-rose-600">*</span>
                </label>
                <select
                  id="mandatory-habitual-shift"
                  value={habitualShiftType}
                  onChange={(e) => setHabitualShiftType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <option value="day">☀️ Diurna (Turno Día)</option>
                  <option value="night">🌙 Nocturna (Turno Noche)</option>
                  <option value="rotative">🔄 Rotativa (Día y Noche alternados)</option>
                </select>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Empresa Empleadora:
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ej: Minera Los Andes / Contratista"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Cargo / Función Operativa:
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ej: Operador CAEX Komatsu 930E"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* Equipment Assigned */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Equipo Asignado:
                </label>
                <input
                  type="text"
                  value={equipmentAssigned}
                  onChange={(e) => setEquipmentAssigned(e.target.value)}
                  placeholder="Ej: CAEX #42"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* Faena */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Faena Minera:
                </label>
                <input
                  type="text"
                  value={faena}
                  onChange={(e) => setFaena(e.target.value)}
                  placeholder="Ej: Faena Cordillera Sur"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* Birthdate */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Fecha de Nacimiento:
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Género:
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro / Prefiero no declarar</option>
                </select>
              </div>
            </div>

            {/* Supervisor Information Section (For Evaluation Email Notifications) */}
            <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-700" />
                  Notificación Automática al Supervisor Directo
                </span>
                <span className="text-[10px] bg-sky-200/80 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                  Copia de Evaluación
                </span>
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                Cada vez que complete una evaluación pre-turno, se remitirá automáticamente una copia oficial del certificado y dictamen al correo del supervisor registrado aquí.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block text-[11px]">
                    Nombre del Supervisor:
                  </label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    placeholder="Ej: Carlos Henríquez"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-sky-300 bg-white focus:border-sky-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block text-[11px]">
                    Email del Supervisor (Copia PDF):
                  </label>
                  <input
                    type="email"
                    value={supervisorEmail}
                    onChange={(e) => setSupervisorEmail(e.target.value)}
                    placeholder="Ej: supervisor.faena@minera.cl"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-sky-300 bg-white focus:border-sky-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
              <span>
                Los datos se guardan de forma permanente y se vinculan criptográficamente a su consentimiento informado bajo la Ley N° 21.719 de Protección de Datos Personales.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-3">
              <button
                id="submit-mandatory-personal-data-btn"
                type="submit"
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Guardar Datos y Continuar al Consentimiento Informado</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Algorithmic RUT Error Modal */}
      <RutErrorModal
        isOpen={showRutErrorModal}
        onClose={() => setShowRutErrorModal(false)}
        rutEntered={rut}
        errorMessage={rutErrorMessage}
      />
    </>
  );
};
