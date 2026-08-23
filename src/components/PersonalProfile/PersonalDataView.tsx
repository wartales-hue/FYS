import React, { useState, useEffect } from 'react';
import { 
  User, 
  Save, 
  MapPin, 
  CloudSun, 
  Wind, 
  Thermometer, 
  Compass, 
  Mountain, 
  Activity, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  RefreshCw,
  Zap,
  Gauge,
  HelpCircle,
  Eye,
  Sun,
  Moon,
  RotateCcw,
  Mail
} from 'lucide-react';
import { WorkerProfile, WeatherData, WeatherForecastDay } from '../../types';
import { InteractivePVT } from '../WorkerCheckIn/InteractivePVT';
import { PVTSummary } from '../../types';
import { DEFAULT_SAMPLE_WEATHER } from '../../lib/mockData';
import { fetchLiveWeatherFromCoords } from '../../lib/weatherService';
import { OpliraLogo } from '../OpliraLogo';
import { GpsPromptModal } from '../GpsPromptModal';
import { validateRut, formatRut, cleanRut } from '../../lib/rutValidator';
import { RutErrorModal } from '../RutErrorModal';
import { WeatherManualEditModal } from '../WeatherManualEditModal';
import { 
  getAllSupervisors, 
  getSavedSupervisorsForWorker, 
  findSupervisorByCode,
  saveSupervisorToWorkerHistory,
  isSupervisorPaid
} from '../../lib/supervisorCrewManager';
import { 
  isAuthorizedSupervisorRut, 
  isPremiumActive, 
  registerSupervisorRutAsPremium 
} from '../../lib/premiumService';
import { GooglePlaySubscriptionModal } from '../GooglePlaySubscriptionModal';
import { SupervisorQrScannerModal, ScannedSupervisorData } from './SupervisorQrScannerModal';
import { NonMedicalDisclaimerModal } from '../GooglePlayCompliance/NonMedicalDisclaimerModal';
import { GooglePlayPermissionsModal } from '../GooglePlayCompliance/GooglePlayPermissionsModal';
import { PrivacyPolicyAndAccountDeletionModal } from '../GooglePlayCompliance/PrivacyPolicyAndAccountDeletionModal';
import { Edit2, WifiOff, Users, QrCode, Lock, Check, Crown, Scan, Trash2, Scale, Smartphone, ShieldAlert } from 'lucide-react';

interface PersonalDataViewProps {
  worker: WorkerProfile;
  onUpdateWorker: (updated: WorkerProfile) => void;
}

export const PersonalDataView: React.FC<PersonalDataViewProps> = ({
  worker,
  onUpdateWorker
}) => {
  // Form State
  const [name, setName] = useState(worker.name || '');
  const [rut, setRut] = useState(worker.rut || '');
  const [birthDate, setBirthDate] = useState(worker.birthDate || '');
  const [gender, setGender] = useState<'Masculino' | 'Femenino' | 'Otro'>(worker.gender || 'Masculino');
  const [company, setCompany] = useState(worker.company || '');
  const [role, setRole] = useState(worker.role || '');
  const [equipmentAssigned, setEquipmentAssigned] = useState(worker.equipmentAssigned || '');
  const [faena, setFaena] = useState(worker.faena || '');
  const [altitudeMeters, setAltitudeMeters] = useState(worker.altitudeMeters || 0);
  const [supervisorName, setSupervisorName] = useState(worker.supervisorName || '');
  const [supervisorEmail, setSupervisorEmail] = useState(worker.supervisorEmail || '');
  const [supervisorCode, setSupervisorCode] = useState(worker.supervisorCode || '');
  const [supervisorRut, setSupervisorRut] = useState(worker.supervisorRut || '');
  const [shiftPattern, setShiftPattern] = useState<string>(worker.shiftPattern || worker.currentShift?.rosterPattern || '4x4');
  const [customWorkDays, setCustomWorkDays] = useState<number>(4);
  const [customRestDays, setCustomRestDays] = useState<number>(4);
  const [habitualShiftType, setHabitualShiftType] = useState<'day' | 'night' | 'rotative'>(
    worker.habitualShiftType || (worker.currentShift?.type === 'night' ? 'night' : 'day')
  );

  // Status & Feedback
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string>('Datos guardados y sincronizados correctamente');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [gpsModalError, setGpsModalError] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [showQrScannerModal, setShowQrScannerModal] = useState<boolean>(false);
  const [showNonMedicalModal, setShowNonMedicalModal] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [showPrivacyDeleteModal, setShowPrivacyDeleteModal] = useState<boolean>(false);

  const isUserPremium = isAuthorizedSupervisorRut(rut) || isAuthorizedSupervisorRut(supervisorRut) || isPremiumActive(rut, supervisorRut);

  // RUT Validation Modal
  const [showRutErrorModal, setShowRutErrorModal] = useState(false);
  const [rutErrorMessage, setRutErrorMessage] = useState('');

  // Weather Manual Edit / Preset Modal
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  // Micro PVT Baseline Calibration State
  const [isCalibratingBaseline, setIsCalibratingBaseline] = useState(false);
  const [calibrationSuccess, setCalibrationSuccess] = useState<string | null>(null);

  // Weather state (using worker's weather or default)
  const [weatherData, setWeatherData] = useState<WeatherData>(
    worker.weather || DEFAULT_SAMPLE_WEATHER
  );

  // Sync with prop when worker changes
  useEffect(() => {
    setName(worker.name || '');
    setRut(worker.rut || '');
    setBirthDate(worker.birthDate || '');
    setGender(worker.gender || 'Masculino');
    setCompany(worker.company || '');
    setRole(worker.role || '');
    setEquipmentAssigned(worker.equipmentAssigned || '');
    setFaena(worker.faena || '');
    setAltitudeMeters(worker.altitudeMeters || 0);
    setSupervisorName(worker.supervisorName || '');
    setSupervisorEmail(worker.supervisorEmail || '');
    setShiftPattern(worker.shiftPattern || worker.currentShift?.rosterPattern || '4x4');
    setHabitualShiftType(worker.habitualShiftType || (worker.currentShift?.type === 'night' ? 'night' : 'day'));
    if (worker.weather) {
      setWeatherData(worker.weather);
    }
  }, [worker]);

  const handleRutBlur = () => {
    if (rut.trim()) {
      const check = validateRut(rut);
      if (!check.isValid) {
        setRutErrorMessage(check.message || 'RUT inválido según Módulo 11.');
        setShowRutErrorModal(true);
      } else {
        setRut(formatRut(rut));
      }
    }
  };

  // GPS Connection & Live Environmental Telemetry (Automatic background sync)
  const syncGpsLocation = (isUserTriggered: boolean = false) => {
    setGpsLoading(true);
    setGpsMessage(null);
    setGpsModalError(null);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = Number(position.coords.latitude.toFixed(4));
          const long = Number(position.coords.longitude.toFixed(4));
          const estimatedAltitude = position.coords.altitude ? Math.round(position.coords.altitude) : (altitudeMeters || 1240);

          try {
            const liveWeather = await fetchLiveWeatherFromCoords(lat, long, estimatedAltitude, faena || 'Faena Barreal Seco');
            setWeatherData(liveWeather);
            setAltitudeMeters(estimatedAltitude);
            setGpsLoading(false);
            setShowGpsModal(false);
            setGpsMessage(`GPS & Clima Sincronizado: ${lat}, ${long} (${estimatedAltitude} msnm • ${liveWeather.forecast[0]?.currentTempC ?? 21}°C)`);

            // Auto propagate updated worker data
            onUpdateWorker({
              ...worker,
              name,
              rut,
              birthDate,
              gender,
              company,
              role,
              equipmentAssigned,
              faena,
              gpsEnabled: true,
              gpsCoordinates: { latitude: lat, longitude: long },
              altitudeMeters: estimatedAltitude,
              weather: liveWeather
            });
          } catch (err) {
            console.error('Error fetching live weather:', err);
            setGpsLoading(false);
          }
        },
        (error) => {
          setGpsLoading(false);
          let errorMsg = 'Permiso denegado o satélites fuera de alcance.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Permiso de ubicación denegado por el navegador/dispositivo.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Señal de satélite no disponible en la ubicación actual.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Tiempo de espera de señal GPS agotado.';
          }
          setGpsModalError(errorMsg);

          // If user manually triggered or GPS never connected, display suggestion modal
          if (isUserTriggered || !worker.weather?.isGpsConnected) {
            setShowGpsModal(true);
          }
          setGpsMessage(`GPS no disponible (${errorMsg}). Utilizando faena ${faena}.`);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setGpsLoading(false);
      setGpsModalError('El dispositivo o navegador no soporta API de Geolocalización.');
      setShowGpsModal(true);
    }
  };

  // Attempt automatic GPS sync when entering personal data view
  useEffect(() => {
    syncGpsLocation(false);
  }, []);

  // Save personal profile to parent state and LocalStorage for future sessions
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Validar RUT con algoritmo Módulo 11
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

    const updatedProfile: WorkerProfile = {
      ...worker,
      name: trimmedName,
      rut: formattedRutStr,
      birthDate,
      gender,
      company: company.trim(),
      role: role.trim(),
      equipmentAssigned: equipmentAssigned.trim(),
      faena: faena.trim(),
      altitudeMeters: Number(altitudeMeters),
      supervisorName: supervisorName.trim(),
      supervisorEmail: supervisorEmail.trim().toLowerCase(),
      supervisorCode: supervisorCode.trim().toUpperCase(),
      supervisorRut: supervisorRut.trim(),
      shiftPattern,
      habitualShiftType,
      profileCompleted: true,
      weather: weatherData,
      legalConsent: identityChanged ? undefined : worker.legalConsent,
      currentShift: {
        ...worker.currentShift,
        type: habitualShiftType === 'night' ? 'night' : 'day',
        rosterPattern: shiftPattern
      }
    };

    if (isAuthorizedSupervisorRut(formattedRutStr)) {
      registerSupervisorRutAsPremium(formattedRutStr);
    }
    if (supervisorRut && isAuthorizedSupervisorRut(supervisorRut)) {
      registerSupervisorRutAsPremium(supervisorRut);
    }

    onUpdateWorker(updatedProfile);

    // Also save custom/updated supervisor to history so check-in uses exact email
    if (supervisorCode || supervisorEmail) {
      saveSupervisorToWorkerHistory({
        code: supervisorCode.trim().toUpperCase() || 'SUP-01',
        name: supervisorName.trim() || 'Supervisor HSEC',
        rut: supervisorRut.trim() || '12.345.678-9',
        company: company.trim() || 'Empresa Faena',
        faena: faena.trim() || 'Faena Operacional',
        email: supervisorEmail.trim().toLowerCase(),
        shiftName: 'Turno Actual',
        lastUsedDate: new Date().toISOString().split('T')[0],
        planStatus: 'active'
      });
    }

    // Save to localStorage so future sessions don't need re-entry
    try {
      localStorage.setItem(`fys_profile_${worker.id}`, JSON.stringify(updatedProfile));
      localStorage.setItem('fys_current_worker_id', worker.id);
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    if (identityChanged) {
      setSavedMessage('⚠️ Datos de identidad actualizados. Se requerirá firmar un nuevo consentimiento informado.');
    } else {
      setSavedMessage('✓ Datos personales guardados y sincronizados permanentemente.');
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4500);
  };

  const handleSupervisorQrScanned = (scanned: ScannedSupervisorData) => {
    setSupervisorCode(scanned.code);
    setSupervisorName(scanned.name);
    if (scanned.rut) setSupervisorRut(scanned.rut);
    if (scanned.email) setSupervisorEmail(scanned.email);
    if (scanned.faena) setFaena(scanned.faena);
    if (scanned.company) setCompany(scanned.company);

    const updatedProfile: WorkerProfile = {
      ...worker,
      supervisorCode: scanned.code,
      supervisorName: scanned.name,
      supervisorRut: scanned.rut || supervisorRut || '12.080.702-1',
      supervisorEmail: scanned.email,
      company: scanned.company || company || worker.company,
      faena: scanned.faena || faena || worker.faena
    };

    if (scanned.rut && isAuthorizedSupervisorRut(scanned.rut)) {
      registerSupervisorRutAsPremium(scanned.rut);
    }
    if (isAuthorizedSupervisorRut(scanned.code)) {
      registerSupervisorRutAsPremium(scanned.code);
    }

    saveSupervisorToWorkerHistory({
      code: scanned.code,
      name: scanned.name,
      rut: scanned.rut || '12.080.702-1',
      company: scanned.company || company || 'Empresa Operadora',
      faena: scanned.faena || faena || 'Faena Minera',
      email: scanned.email,
      shiftName: scanned.shiftName || 'Turno Activo',
      lastUsedDate: new Date().toISOString().split('T')[0],
      planStatus: 'active'
    });

    onUpdateWorker(updatedProfile);
    try {
      localStorage.setItem(`fys_profile_${worker.id}`, JSON.stringify(updatedProfile));
      localStorage.setItem('fys_current_worker_id', worker.id);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    setSavedMessage(`✓ Cuenta de Supervisor ${scanned.name} (${scanned.code}) vinculada exitosamente mediante escaneo QR.`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4500);
  };

  const handleConnectGPS = () => {
    syncGpsLocation(true);
  };

  // Callback when Micro PVT is completed
  const handleMicroPvtComplete = (summary: PVTSummary) => {
    setIsCalibratingBaseline(false);

    if (summary.validTrials < 3) {
      setCalibrationSuccess('Prueba incompleta. Se requieren al menos 3 ensayos válidos.');
      return;
    }

    const updatedBaseline = {
      meanRT: summary.meanRT,
      medianRT: summary.medianRT,
      standardDeviation: Math.round(summary.meanRT * 0.08),
      fastest10Percent: summary.fastest10PercentRT,
      lapseThresholdMs: 500,
      validTrialsCount: summary.validTrials,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    const updatedWorker: WorkerProfile = {
      ...worker,
      name,
      rut,
      birthDate,
      gender,
      baseline: updatedBaseline
    };

    onUpdateWorker(updatedWorker);
    localStorage.setItem(`fys_profile_${worker.id}`, JSON.stringify(updatedWorker));

    setCalibrationSuccess(`Línea base calibrada exitosamente: ${summary.meanRT} ms (${summary.validTrials} ensayos válidos).`);
    setTimeout(() => setCalibrationSuccess(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-1 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <OpliraLogo size={32} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Datos Personales y Calibración FYS HSEC
            </h1>
          </div>
          <p className="text-xs text-slate-600">
            Ingresa y almacena tus antecedentes personales. Los datos quedan guardados permanentemente para no tener que volver a ingresarlos en futuros turnos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isUserPremium ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl shadow-xs">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Cuenta Premium Activa ($0.99 USD/mes)</span>
            </div>
          ) : (
            <button
              id="personal-data-upgrade-premium-btn"
              type="button"
              onClick={() => setShowPremiumModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Convierte a Cuenta Premium ($0.99 USD/mes)</span>
            </button>
          )}

          {savedSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{savedMessage}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Data Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Ficha Personal del Trabajador</span>
              </h2>
              <span className="text-[11px] text-slate-600 font-medium bg-slate-100 px-2.5 py-0.5 rounded-md">
                Ley 21.719 • No Re-ingreso
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-slate-700 block">
                  Nombre Completo:
                </label>
                <input
                  id="worker-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Alejandro Morales"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* RUT */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  RUT (Cédula de Identidad):
                </label>
                <input
                  id="worker-rut-input"
                  type="text"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="Ej: 14.892.415-3"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-mono font-medium text-xs transition-colors"
                />
              </div>

              {/* Birth Date */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Fecha de Nacimiento:
                </label>
                <input
                  id="worker-birthdate-input"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Género:
                </label>
                <select
                  id="worker-gender-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro / Prefiero no declarar</option>
                </select>
              </div>

              {/* Shift Pattern */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Tipo / Sistema de Turno Base:
                </label>
                <select
                  id="worker-shift-pattern-select"
                  value={['7x7', '4x3', '5x2', '4x4', '6x1', '10x10', '8x6', '10x5', '14x14'].includes(shiftPattern) ? shiftPattern : 'Turno Especial'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Turno Especial') {
                      setShiftPattern(`${customWorkDays}x${customRestDays}`);
                    } else {
                      setShiftPattern(val);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors cursor-pointer"
                >
                  <option value="7x7">7x7 (7 días trabajo x 7 descanso)</option>
                  <option value="4x3">4x3 (4 días trabajo x 3 descanso)</option>
                  <option value="5x2">5x2 (5 días trabajo x 2 descanso)</option>
                  <option value="4x4">4x4 (4 días trabajo x 4 descanso)</option>
                  <option value="6x1">6x1 (6 días trabajo x 1 descanso)</option>
                  <option value="10x10">10x10 (10 días trabajo x 10 descanso)</option>
                  <option value="8x6">8x6 (8 días trabajo x 6 descanso)</option>
                  <option value="10x5">10x5 (10 días trabajo x 5 descanso)</option>
                  <option value="14x14">14x14 (14 días trabajo x 14 descanso)</option>
                  <option value="Turno Especial">➕ Crear otra jornada (Personalizada)</option>
                </select>

                {!['7x7', '4x3', '5x2', '4x4', '6x1', '10x10', '8x6', '10x5', '14x14'].includes(shiftPattern) && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-blue-900 block text-[11px]">
                      Configurar Jornada Personalizada:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-600 block mb-0.5">Días de Trabajo:</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={customWorkDays}
                          onChange={(e) => {
                            const w = Math.max(1, parseInt(e.target.value) || 1);
                            setCustomWorkDays(w);
                            setShiftPattern(`${w}x${customRestDays}`);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-center text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-600 block mb-0.5">Días de Descanso:</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={customRestDays}
                          onChange={(e) => {
                            const r = Math.max(1, parseInt(e.target.value) || 1);
                            setCustomRestDays(r);
                            setShiftPattern(`${customWorkDays}x${r}`);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-center text-xs"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-700 block font-mono">
                      Patrón resultante: <strong>{shiftPattern}</strong> ({customWorkDays} días continuos x {customRestDays} descanso)
                    </span>
                  </div>
                )}
              </div>

              {/* Habitual Shift Type */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Jornada Habitual:
                </label>
                <select
                  id="worker-habitual-shift-select"
                  value={habitualShiftType}
                  onChange={(e) => setHabitualShiftType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors cursor-pointer"
                >
                  <option value="day">☀️ Diurna (Turno Día)</option>
                  <option value="night">🌙 Nocturna (Turno Noche)</option>
                  <option value="rotative">🔄 Rotativa (Día / Noche)</option>
                </select>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Empresa Empleadora:
                </label>
                <input
                  id="worker-company-input"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ej: Minera Los Andes / Contratista"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Cargo / Función Operativa:
                </label>
                <input
                  id="worker-role-input"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ej: Operador CAEX Komatsu 930E"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* Equipment Assigned */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Equipo Asignado:
                </label>
                <input
                  id="worker-equipment-input"
                  type="text"
                  value={equipmentAssigned}
                  onChange={(e) => setEquipmentAssigned(e.target.value)}
                  placeholder="Ej: CAEX #42"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* Faena & Altitude */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Faena o Lugar de trabajo:
                </label>
                <input
                  id="worker-faena-input"
                  type="text"
                  value={faena}
                  onChange={(e) => setFaena(e.target.value)}
                  placeholder="Ej: Faena Cordillera Sur"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Altitud Operacional (msnm):
                </label>
                <input
                  id="worker-altitude-input"
                  type="number"
                  value={altitudeMeters}
                  onChange={(e) => setAltitudeMeters(Number(e.target.value))}
                  placeholder="3800"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-mono font-medium text-xs transition-colors"
                />
              </div>
            </div>

            {/* Supervisor Information Section (Cuadrilla & Email Target) */}
            <div className="p-4 bg-sky-50/90 border border-sky-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-700" />
                  Supervisor Asignado & Cuadrilla
                </span>
                <button
                  type="button"
                  onClick={() => setShowQrScannerModal(true)}
                  className="text-[10px] bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <QrCode className="w-3 h-3 text-slate-950" />
                  <span>Escanear QR</span>
                </button>
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                Selecciona tu supervisor habitual, ingresa su código único o escanea su código QR proyectado para asociar tus estadísticas de turno y despachos de certificados oficiales.
              </p>

              {/* Quick Supervisor Presets Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-[11px]">
                  Supervisores Registrados en tu Cuenta:
                </label>
                <select
                  value={getAllSupervisors().some(s => s.code === supervisorCode) ? supervisorCode : 'CUSTOM'}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setSupervisorCode('CUSTOM');
                      return;
                    }
                    const selected = getAllSupervisors().find(s => s.code === e.target.value);
                    if (selected) {
                      setSupervisorCode(selected.code);
                      setSupervisorName(selected.name);
                      setSupervisorRut(selected.rut);
                      setSupervisorEmail(selected.email);
                      saveSupervisorToWorkerHistory(selected);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-sky-300 bg-white focus:border-sky-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors cursor-pointer"
                >
                  <option value="CUSTOM">
                    {getAllSupervisors().length === 0 ? '-- Ningún supervisor registrado (Ingresa código o datos abajo) --' : '-- Ingreso Manual / Otro Supervisor --'}
                  </option>
                  {getAllSupervisors().map(sup => (
                    <option key={sup.code} value={sup.code}>
                      {sup.code} - {sup.name} (RUT: {sup.rut} • {sup.shiftName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block text-[11px]">
                    Código de Cuadrilla:
                  </label>
                  <input
                    id="worker-supervisor-code-input"
                    type="text"
                    value={supervisorCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setSupervisorCode(val);
                      const resolved = findSupervisorByCode(val);
                      if (resolved) {
                        setSupervisorName(resolved.name);
                        setSupervisorRut(resolved.rut);
                        setSupervisorEmail(resolved.email);
                      }
                    }}
                    placeholder="Ej: YTR024"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-sky-300 bg-white focus:border-sky-500 focus:outline-none text-slate-900 font-mono font-bold text-xs transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block text-[11px]">
                    Nombre del Supervisor:
                  </label>
                  <input
                    id="worker-supervisor-name-input"
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    placeholder="Ej: José Valdivia Soto"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-sky-300 bg-white focus:border-sky-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 block text-[11px]">
                      Email del Supervisor:
                    </label>
                    {!(isUserPremium || isSupervisorPaid(supervisorCode)) && (
                      <button
                        type="button"
                        onClick={() => setShowPremiumModal(true)}
                        className="text-[10px] text-amber-700 bg-amber-100 hover:bg-amber-200 font-bold px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        Versión Pago ($0.99)
                      </button>
                    )}
                  </div>
                  <input
                    id="worker-supervisor-email-input"
                    type="email"
                    value={(isUserPremium || isSupervisorPaid(supervisorCode)) ? supervisorEmail : ''}
                    onChange={(e) => (isUserPremium || isSupervisorPaid(supervisorCode)) && setSupervisorEmail(e.target.value)}
                    placeholder={(isUserPremium || isSupervisorPaid(supervisorCode)) ? "Ej: supervisor@faena.cl" : "Disponible para versión premium del supervisor"}
                    disabled={!(isUserPremium || isSupervisorPaid(supervisorCode))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors ${
                      (isUserPremium || isSupervisorPaid(supervisorCode))
                        ? 'border-sky-300 bg-white focus:border-sky-500 focus:outline-none text-slate-900 font-medium'
                        : 'border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed italic'
                    }`}
                  />
                </div>
              </div>

              {/* Paid supervisor indicator / notice */}
              {(isUserPremium || isSupervisorPaid(supervisorCode)) ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Supervisor con Versión Premium Vinculado: Envío automático de certificados activado.</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    Pro Crew Activo
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-[11px] text-amber-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <Lock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                      <span>Apartado de Email y Despacho Automático (Versión Premium del Supervisor)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPremiumModal(true)}
                      className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg shadow-2xs cursor-pointer"
                    >
                      Activar ($0.99 USD/mes)
                    </button>
                  </div>
                  <p className="text-[10.5px] text-amber-800 leading-tight">
                    Para activar el ingreso de email y despacho automático de certificados, el trabajador debe estar vinculado a una cuenta con <strong>versión premium del supervisor</strong> (o suscripción Google Play).
                  </p>
                </div>
              )}
            </div>

            {/* Shift dynamic note */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Control Dinámico Semanal:</strong> El día actual del ciclo (ej. Día 4 de 7) y el tipo de turno específico de cada jornada (Día vs Noche) se consultan de manera interactiva dentro de la evaluación pre-turno, adaptándose a sus rotaciones semanales.
              </p>
            </div>

            {/* Action Buttons: Scan Supervisor QR & Save */}
            <div className="pt-2 space-y-2.5">
              <button
                id="scan-supervisor-qr-btn"
                type="button"
                onClick={() => setShowQrScannerModal(true)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-amber-400 hover:scale-[1.005] active:scale-[0.99]"
              >
                <QrCode className="w-4 h-4 text-slate-950" />
                <span>Escanear Cuenta Supervisor QR</span>
              </button>

              <button
                id="save-personal-data-btn"
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Guardar Datos Personales Permanentemente</span>
              </button>
            </div>
          </form>

          {/* Micro PVT Baseline Calibration Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>Micro PVT para Crear la Línea Base de Reacción</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Calibra tu tiempo de reacción individual en estado de descanso para comparar tus futuros turnos de forma objetiva.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Línea Base Personal
              </span>
            </div>

            {calibrationSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{calibrationSuccess}</span>
              </div>
            )}

            {!isCalibratingBaseline ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Media Histórica</span>
                    <span className="text-sm font-bold font-mono text-slate-900">{worker.baseline.meanRT} ms</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Mediana RT</span>
                    <span className="text-sm font-bold font-mono text-slate-900">{worker.baseline.medianRT} ms</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Top 10% Más Rápido</span>
                    <span className="text-sm font-bold font-mono text-emerald-600">{worker.baseline.fastest10Percent} ms</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Última Calibración</span>
                    <span className="text-xs font-bold font-mono text-slate-700">{worker.baseline.lastUpdated}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-800 block">¿Por qué es crucial la línea base?</span>
                  <p>
                    Basner & Dinges (2011) demostraron que la velocidad psicomotriz varía fisiológicamente entre personas. Calibrar tu línea base evita falsos positivos y asegura que el algoritmo mida tu fatiga real y no tu velocidad natural.
                  </p>
                </div>

                <button
                  id="start-micro-pvt-baseline-btn"
                  type="button"
                  onClick={() => setIsCalibratingBaseline(true)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Realizar Micro PVT para Calibrar Línea Base (60 seg)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <InteractivePVT
                  mode="Micro-PVT"
                  worker={worker}
                  onComplete={handleMicroPvtComplete}
                />
                <button
                  type="button"
                  onClick={() => setIsCalibratingBaseline(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium block mx-auto underline"
                >
                  Cancelar calibración y volver
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: GPS & Weather / 2-Day Forecast Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* GPS Connection Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Geolocalización GPS & Faena</span>
              </h2>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                weatherData.isGpsConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {weatherData.isGpsConnected ? 'GPS Activo' : 'GPS Desconectado'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Coordenadas:</span>
                <span className="font-mono font-bold text-slate-800">
                  {weatherData.latitude.toFixed(4)}, {weatherData.longitude.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Altitud Estimada:</span>
                <span className="font-mono font-bold text-amber-700 flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5" />
                  <span>{weatherData.altitudeMeters} msnm</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Faena Registrada:</span>
                <span className="font-bold text-slate-800 truncate max-w-[180px]">{weatherData.faenaName}</span>
              </div>

              {gpsMessage && (
                <p className="text-[11px] text-emerald-700 font-medium pt-1 border-t border-slate-200">
                  {gpsMessage}
                </p>
              )}
            </div>

            <button
              id="connect-gps-btn"
              type="button"
              onClick={handleConnectGPS}
              disabled={gpsLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'Obteniendo GPS...' : 'Obtener / Actualizar Ubicación GPS'}</span>
            </button>
          </div>

          {/* 2-Day Weather Forecast & Climatic Fatigue Ponderation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-amber-600" />
                <span>Pronóstico Meteorológico (48 Horas)</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Ponderación DS 44
              </span>
            </div>

            <p className="text-xs text-slate-600">
              El algoritmo pondera la temperatura extrema, sensación térmica, viento cordillerano y presión atmosférica en el cálculo del riesgo de fatiga.
            </p>

            {/* 3 Days Forecast List: Today, Tomorrow, +2 Days */}
            <div className="space-y-2.5">
              {(weatherData?.forecast || DEFAULT_SAMPLE_WEATHER.forecast).map((day, idx) => (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-xl border transition-all ${
                    idx === 0 
                      ? 'bg-amber-50/70 border-amber-200 shadow-xs' 
                      : 'bg-slate-50 border-slate-100 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${idx === 0 ? 'text-amber-900' : 'text-slate-800'}`}>
                        {day.dayLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">({day.date})</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {day.tempMinC}°C / {day.tempMaxC}°C
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-600 font-medium flex items-center gap-1">
                      <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                      <span>{day.condition}</span>
                    </span>
                    <span className="text-slate-600 font-mono text-[11px]">
                      Sensación: <strong className="text-slate-800">{day.thermalSensationC}°C</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <div>
                      <span className="text-slate-400 block">Viento / Ráfagas</span>
                      <span className="font-bold text-slate-700 font-mono">{day.windSpeedKmh} / {day.windGustsKmh} km/h</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Índice UV</span>
                      <span className="font-bold text-rose-600 font-mono">{day.uvIndex} (Extremo)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Hipoxia Altura</span>
                      <span className="font-bold text-amber-700">{day.hypoxiaRiskLevel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct GPS & Climate Telemetry Refresh Button in Climate Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                id="refresh-climate-gps-btn"
                type="button"
                onClick={handleConnectGPS}
                disabled={gpsLoading}
                className="py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-300 text-amber-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-800 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Actualizando GPS...' : 'GPS en Vivo'}</span>
              </button>

              <button
                id="manual-edit-climate-btn"
                type="button"
                onClick={() => setShowWeatherModal(true)}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Ajustar Manualmente</span>
              </button>
            </div>

            {/* Scientific Citation for Environmental Fatigue */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">Respaldo Científico de la Ponderación Climática:</span>
              <p>
                West, J. B. (2012). <em>High-altitude medicine and physiology</em>. / Vitiello et al. (2015). La hipoxia hipobárica y el estrés por frío extremo aumentan el gasto metabólico y aceleran la degradación de la alerta neuroconductual en conductores y operadores de faena.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Play Store Compliance, Permissions & Account Deletion Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
              Directivas Google Play Store • Seguridad y Privacidad
            </span>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Gobernanza de Datos, Permisos y Deslinde Legal</span>
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold self-start sm:self-auto">
            ✓ Cumplimiento Play Store 2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Non-Medical Disclaimer */}
          <button
            type="button"
            onClick={() => setShowNonMedicalModal(true)}
            className="p-3.5 bg-amber-50/60 hover:bg-amber-50 border border-amber-200 rounded-xl text-left transition-all space-y-1.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <Scale className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">Salud & Legal</span>
            </div>
            <h4 className="text-xs font-bold text-amber-950">Deslinde No-Médico</h4>
            <p className="text-[11px] text-amber-900 leading-snug">
              Declaración de clasificación operacional y no-sustitución de diagnóstico clínico.
            </p>
          </button>

          {/* Permissions Transparency (Zero Audio / Foreground Only) */}
          <button
            type="button"
            onClick={() => setShowPermissionsModal(true)}
            className="p-3.5 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-left transition-all space-y-1.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <Smartphone className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">Permisos</span>
            </div>
            <h4 className="text-xs font-bold text-emerald-950">GPS & Cero Audio</h4>
            <p className="text-[11px] text-emerald-900 leading-snug">
              Ubicación en primer plano únicamente. Cero grabación ni acceso a micrófono.
            </p>
          </button>

          {/* Privacy Policy & Public Deletion URL */}
          <button
            type="button"
            onClick={() => setShowPrivacyDeleteModal(true)}
            className="p-3.5 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 rounded-xl text-left transition-all space-y-1.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <FileText className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">Privacidad</span>
            </div>
            <h4 className="text-xs font-bold text-blue-950">Política de Datos</h4>
            <p className="text-[11px] text-blue-900 leading-snug">
              Tratamiento Ley 21.719, enlace web público y derechos ARCO.
            </p>
          </button>
        </div>

        {/* Prominent In-App Account Deletion Button (Google Play Account Deletion Policy) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
          <div className="space-y-0.5 text-left w-full sm:w-auto">
            <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Eliminación Definitiva de Cuenta y Datos (In-App)
            </span>
            <p className="text-[11px] text-rose-800">
              Elimina de forma irreversible tu perfil, historial de pruebas psicomotoras y tokens de este dispositivo.
            </p>
          </div>
          <button
            id="open-account-deletion-modal-btn"
            type="button"
            onClick={() => setShowPrivacyDeleteModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Mi Cuenta</span>
          </button>
        </div>
      </div>

      {/* Weather Manual Edit & Calibration Modal */}
      <WeatherManualEditModal
        isOpen={showWeatherModal}
        currentWeather={weatherData}
        onClose={() => setShowWeatherModal(false)}
        onSave={(updated) => {
          setWeatherData(updated);
          setAltitudeMeters(updated.altitudeMeters);
          setFaena(updated.faenaName);
          onUpdateWorker({
            ...worker,
            faena: updated.faenaName,
            altitudeMeters: updated.altitudeMeters,
            weather: updated
          });
          setSavedMessage('Clima y altitud ajustados y persistidos localmente.');
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }}
      />

      {/* GPS Troubleshooting / Suggestion Modal */}
      <GpsPromptModal
        isOpen={showGpsModal}
        onClose={() => setShowGpsModal(false)}
        onRetry={() => syncGpsLocation(true)}
        errorMessage={gpsModalError}
      />

      {/* Algorithmic RUT Error Modal */}
      <RutErrorModal
        isOpen={showRutErrorModal}
        onClose={() => setShowRutErrorModal(false)}
        rutEntered={rut}
        errorMessage={rutErrorMessage}
      />

      {/* Google Play Subscription Modal */}
      <GooglePlaySubscriptionModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        initialRut={rut || supervisorRut}
        onSuccess={() => {
          if (!supervisorName) setSupervisorName('Supervisor HSEC');
          if (!supervisorEmail) setSupervisorEmail('supervisor.hsec@faenaminera.cl');
        }}
      />

      {/* Supervisor QR Scanner Modal */}
      <SupervisorQrScannerModal
        isOpen={showQrScannerModal}
        onClose={() => setShowQrScannerModal(false)}
        onScanSuccess={handleSupervisorQrScanned}
      />

      {/* Non-Medical Disclaimer Modal */}
      <NonMedicalDisclaimerModal
        isOpen={showNonMedicalModal}
        onClose={() => setShowNonMedicalModal(false)}
      />

      {/* Permissions Transparency Modal */}
      <GooglePlayPermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
      />

      {/* Privacy Policy & Account Deletion Modal */}
      <PrivacyPolicyAndAccountDeletionModal
        isOpen={showPrivacyDeleteModal}
        onClose={() => setShowPrivacyDeleteModal(false)}
        userRut={rut}
        userName={name}
      />
    </div>
  );
};
