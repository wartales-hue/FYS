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
  Mail,
  Zap,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Award
} from 'lucide-react';
import { WorkerProfile, PVTSummary } from '../types';
import { OpliraLogo } from './OpliraLogo';
import { validateRut, formatRut, cleanRut } from '../lib/rutValidator';
import { RutErrorModal } from './RutErrorModal';
import { InteractivePVT } from './WorkerCheckIn/InteractivePVT';

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
  // Step State: 1 = Personal Data & Shift, 2 = PVT Baseline Calibration
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
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

  // Baseline Calibration State
  const [baselineData, setBaselineData] = useState(worker.baseline || {
    meanRT: 240,
    medianRT: 235,
    standardDeviation: 22,
    fastest10Percent: 205,
    lapseThresholdMs: 500,
    validTrialsCount: 5,
    lastUpdated: new Date().toISOString().split('T')[0]
  });
  const [hasCalibratedInSession, setHasCalibratedInSession] = useState(false);
  const [calibrationSuccessMsg, setCalibrationSuccessMsg] = useState<string | null>(null);

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
      if (worker.baseline) {
        setBaselineData(worker.baseline);
      }
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

  // Step 1 Validation -> Move to Step 2
  const handleProceedToBaselineStep = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar RUT con algoritmo
    const rutCheck = validateRut(rut);
    if (!rutCheck.isValid) {
      setRutErrorMessage(rutCheck.message || 'El RUT ingresado no es válido según el algoritmo Módulo 11 chileno.');
      setShowRutErrorModal(true);
      return;
    }

    if (!name.trim()) {
      alert('Por favor ingrese su nombre completo.');
      return;
    }

    setRut(formatRut(rut));
    setCurrentStep(2);
  };

  // Callback when worker completes the PVT calibration in Step 2
  const handlePvtCalibrationComplete = (summary: PVTSummary) => {
    if (summary.validTrials < 2) {
      setCalibrationSuccessMsg('Prueba incompleta. Se requieren al menos 2 ensayos válidos.');
      return;
    }

    const updated = {
      meanRT: summary.meanRT,
      medianRT: summary.medianRT,
      standardDeviation: Math.round(summary.meanRT * 0.08),
      fastest10Percent: summary.fastest10PercentRT,
      lapseThresholdMs: 500,
      validTrialsCount: summary.validTrials,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setBaselineData(updated);
    setHasCalibratedInSession(true);
    setCalibrationSuccessMsg(`✓ Línea base calibrada: ${summary.meanRT} ms (${summary.validTrials} ensayos válidos).`);
    setTimeout(() => setCalibrationSuccessMsg(null), 6000);
  };

  // Final submit after Step 2
  const handleFinalSaveAndProceed = () => {
    const formattedRutStr = formatRut(rut);
    const cleanedRutStr = cleanRut(rut);
    const cleanedOldRut = cleanRut(worker.rut || '');
    const trimmedName = name.trim();
    const oldTrimmedName = (worker.name || '').trim();

    // Comprobar si cambió Nombre o RUT para invalidar consentimiento previo
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
      baseline: baselineData,
      profileCompleted: true,
      // Si la identidad cambió, se debe forzar un nuevo consentimiento
      legalConsent: identityChanged ? undefined : worker.legalConsent,
      currentShift: {
        ...worker.currentShift,
        type: habitualShiftType === 'night' ? 'night' : 'day',
        rosterPattern: shiftPattern
      }
    };

    // Save to localStorage
    try {
      localStorage.setItem(`fys_profile_${updatedWorker.id}`, JSON.stringify(updatedWorker));
      localStorage.setItem('fys_current_worker_id', updatedWorker.id);
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

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
          <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 shadow-xs">
                <OpliraLogo size={34} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    {currentStep === 1 ? <User className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                    Paso {currentStep} de 2 Obligatorio
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {currentStep === 1 ? 'Registro de Datos Personales' : 'Calibración Línea Base PVT'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                  {currentStep === 1 
                    ? 'Ficha del Trabajador & Parámetros de Turno' 
                    : 'Calibración de Línea Base Psicomotriz PVT'}
                </h2>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${currentStep === 1 ? 'bg-amber-400 ring-4 ring-amber-400/20' : 'bg-emerald-400'}`} />
              <div className={`w-6 h-0.5 ${currentStep === 2 ? 'bg-amber-400' : 'bg-slate-700'}`} />
              <div className={`w-2.5 h-2.5 rounded-full ${currentStep === 2 ? 'bg-amber-400 ring-4 ring-amber-400/20' : 'bg-slate-600'}`} />
            </div>
          </div>

          {/* ================= STEP 1: FORM FIELDS ================= */}
          {currentStep === 1 && (
            <>
              {/* Mandatory notice */}
              <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200 text-xs text-amber-950 flex items-start gap-2.5 flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong>Paso 1:</strong> Ingrese su identificación y turno. A continuación realizará la calibración de su línea base de tiempo de reacción PVT.
                </p>
              </div>

              {/* Form fields */}
              <form onSubmit={handleProceedToBaselineStep} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-800 flex-1 bg-white">
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
                        Validación Algorítmica Módulo 11
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

                {/* Supervisor Information Section */}
                <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-700" />
                      Notificación Automática al Supervisor Directo
                    </span>
                    <span className="text-[10px] bg-sky-200/80 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                      Copia Oficial PDF
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    Al finalizar cada evaluación pre-turno, se remitirá automáticamente una copia oficial del certificado y dictamen al correo del supervisor registrado aquí.
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

                {/* Continue button */}
                <div className="pt-2">
                  <button
                    id="proceed-to-baseline-btn"
                    type="submit"
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuar a Calibración de Línea Base PVT</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ================= STEP 2: PVT BASELINE CALIBRATION ================= */}
          {currentStep === 2 && (
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-800 flex-1 bg-white flex flex-col">
              {/* Instructions Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2 text-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-blue-950">
                    ¿Por qué es obligatoria la Calibración de Línea Base?
                  </span>
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  La línea base registra tu <strong>velocidad psicomotriz natural</strong> en estado de alerta óptimo. Servirá como tu referencia matemática individual para comparar tus evaluaciones pre-turno y detectar fatiga tempranamente.
                </p>
                <div className="p-2 bg-white/80 rounded-lg border border-blue-200/60 text-[10px] text-blue-800 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>
                    <strong>Flexibilidad total:</strong> Podrás repetir la prueba ahora todas las veces que desees y recalibrarla en el futuro desde tu perfil.
                  </span>
                </div>
              </div>

              {/* Success alert if calibrated */}
              {calibrationSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 font-bold text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{calibrationSuccessMsg}</span>
                </div>
              )}

              {/* Current Baseline Card */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Línea Base Registrada
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-amber-400 font-mono">
                        {baselineData.meanRT} ms
                      </span>
                      <span className="text-[10px] text-slate-300">
                        (Mediana: {baselineData.medianRT} ms • {baselineData.validTrialsCount} ensayos)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    hasCalibratedInSession 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {hasCalibratedInSession ? '✓ Calibrada Hoy' : 'Calibración Base'}
                  </span>
                </div>
              </div>

              {/* Embedded Interactive PVT */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Prueba Psicomotriz PVT (3 Ensayos de Reacción)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Toca la pantalla apenas aparezcan los números rojos
                  </span>
                </div>

                <InteractivePVT
                  mode="Micro-PVT"
                  worker={{
                    ...worker,
                    name,
                    rut,
                    baseline: baselineData
                  }}
                  onComplete={handlePvtCalibrationComplete}
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 mt-auto">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-4 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a Datos</span>
                </button>

                <button
                  id="finalize-mandatory-onboarding-btn"
                  type="button"
                  onClick={handleFinalSaveAndProceed}
                  className="w-full sm:flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Guardar Ficha y Continuar al Consentimiento Legal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
