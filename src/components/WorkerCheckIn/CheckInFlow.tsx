import React, { useState } from 'react';
import { 
  CheckCircle, 
  Moon, 
  Sun, 
  Activity, 
  ShieldAlert, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Info, 
  Sparkles,
  Lock,
  Mountain,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  FileDown,
  CloudSun,
  MapPin,
  ClipboardCheck,
  Mail,
  PenTool,
  UserCheck,
  FileCheck2,
  Droplets,
  Wind,
  Footprints,
  Eye,
  PauseCircle,
  Sliders,
  Ban,
  Bell,
  BedDouble,
  RotateCw,
  CheckCircle2
} from 'lucide-react';
import { WorkerProfile, SleepRecord, PVTSummary, FRARiskEvaluation, FYSPreTurnSurvey } from '../../types';
import { InteractivePVT } from './InteractivePVT';
import { FYSPreTurnSurveyComponent } from './FYSPreTurnSurveyComponent';
import { SignaturePad } from './SignaturePad';
import { evaluateFRARisk } from '../../lib/fraEngine';
import { downloadEvaluationPDF } from '../../lib/pdfGenerator';
import { LEVEL_CONTROL_MEASURES, ControlMeasureItem } from '../../lib/controlMeasures';
import { OpliraLogo } from '../OpliraLogo';
import { WeatherManualEditModal } from '../WeatherManualEditModal';
import { Edit2, Thermometer, WifiOff } from 'lucide-react';

interface CheckInFlowProps {
  worker: WorkerProfile;
  onCheckInComplete: (evaluation: FRARiskEvaluation) => void;
  disabled?: boolean;
}

export const CheckInFlow: React.FC<CheckInFlowProps> = ({
  worker,
  onCheckInComplete,
  disabled = false,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);

  // Dynamic Shift System in Evaluation
  const [evaluationShiftType, setEvaluationShiftType] = useState<'day' | 'night'>(
    worker.currentShift?.type === 'night' ? 'night' : 'day'
  );
  const [evaluationDayInRoster, setEvaluationDayInRoster] = useState<number>(
    worker.currentShift?.dayInRoster || 1
  );
  const [isShiftSwitch, setIsShiftSwitch] = useState<boolean>(false);

  // Weather Customization & Offline Forecast State
  const [customWeather, setCustomWeather] = useState(worker.weather);
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);

  // Step 2: FYS Pre-Turn Survey State
  const [fysSurvey, setFysSurvey] = useState<FYSPreTurnSurvey>({
    energyToStartShift: true,
    significantPhysicalFatigue: false,
    painAffectingDriving: false,
    medicationsOrDrugsConsumed: false,
    alcoholConsumedLast12Hours: false,
    nightQuestions: (worker.currentShift?.type === 'night' || evaluationShiftType === 'night') ? {
      yawningOrHeavyEyelids: false,
      hydratedAndNourished: true,
      excessEnergyDrinks: false,
      daytimeSleepEnvironment: 'optimal',
      cabinLightingCondition: 'optimal',
    } : undefined
  });

  // Keep night questions in sync when shift type changes
  const handleShiftTypeChange = (type: 'day' | 'night') => {
    setEvaluationShiftType(type);
    if (type === 'night') {
      setConsecutiveNights(evaluationDayInRoster);
      setFysSurvey(prev => ({
        ...prev,
        nightQuestions: prev.nightQuestions || {
          yawningOrHeavyEyelids: false,
          hydratedAndNourished: true,
          excessEnergyDrinks: false,
          daytimeSleepEnvironment: 'optimal',
          cabinLightingCondition: 'optimal',
        }
      }));
    } else {
      setConsecutiveNights(0);
      setFysSurvey(prev => ({
        ...prev,
        nightQuestions: undefined
      }));
    }
  };

  const handleDayInRosterChange = (day: number) => {
    setEvaluationDayInRoster(day);
    if (evaluationShiftType === 'night') {
      setConsecutiveNights(day);
    }
  };

  // Step 3: Sleep Form State
  const [sleepHours, setSleepHours] = useState<number>(6.5);
  const [sleepOpportunity, setSleepOpportunity] = useState<number>(10.0);
  const [bedTime, setBedTime] = useState<string>('23:00');
  const [wakeTime, setWakeTime] = useState<string>('05:30');
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [consecutiveNights, setConsecutiveNights] = useState<number>(
    worker.currentShift?.type === 'night' ? worker.currentShift.dayInRoster : 0
  );

  // Step 4: KSS State (1 to 9)
  const [kssScore, setKssScore] = useState<number>(3);

  // Step 5: PVT Result
  const [pvtSummary, setPvtSummary] = useState<PVTSummary | null>(null);

  // Step 6: Worker Signature
  const [workerSignature, setWorkerSignature] = useState<string>('');
  const [workerSignatureTime, setWorkerSignatureTime] = useState<string>('');

  // Step 7: Supervisor Signature & Validation
  const [supervisorSignature, setSupervisorSignature] = useState<string>('');
  const [supervisorSignatureTime, setSupervisorSignatureTime] = useState<string>('');
  const [supervisorNotes, setSupervisorNotes] = useState<string>('Evaluación presencial verificada conforme a protocolo HSEC.');

  // Step 8: Generated Evaluation & PDF Status
  const [evaluationResult, setEvaluationResult] = useState<FRARiskEvaluation | null>(null);
  const [pdfGenerated, setPdfGenerated] = useState<boolean>(false);

  const kssDescriptions = [
    { value: 1, label: 'Extremadamente alerta', desc: 'Máxima agudeza mental, sin fatiga.', color: 'border-emerald-500 text-emerald-400' },
    { value: 2, label: 'Muy alerta', desc: 'Completamente despierto y activo.', color: 'border-emerald-500 text-emerald-400' },
    { value: 3, label: 'Alerta', desc: 'Estado normal de atención.', color: 'border-emerald-500 text-emerald-400' },
    { value: 4, label: 'Bastante alerta', desc: 'Atención adecuada, ligera relajación.', color: 'border-emerald-500 text-emerald-400' },
    { value: 5, label: 'Ni alerta ni somnoliento', desc: 'Punto neutro de vigilancia.', color: 'border-amber-500 text-amber-400' },
    { value: 6, label: 'Algo somnoliento', desc: 'Primeras señales sutiles de cansancio.', color: 'border-amber-500 text-amber-400' },
    { value: 7, label: 'Somnoliento, sin gran esfuerzo', desc: 'Ganas de descansar, pero aún despierto.', color: 'border-amber-600 text-amber-400' },
    { value: 8, label: 'Muy somnoliento', desc: 'Gran esfuerzo para mantener los ojos abiertos.', color: 'border-rose-500 text-rose-400' },
    { value: 9, label: 'Extremadamente somnoliento', desc: 'Luchando activamente contra el microsueño.', color: 'border-rose-600 text-rose-400' },
  ];

  // Dynamic worker object for this evaluation
  const evaluatedWorker: WorkerProfile = {
    ...worker,
    faena: customWeather?.faenaName || worker.faena,
    altitudeMeters: customWeather?.altitudeMeters || worker.altitudeMeters,
    weather: customWeather || worker.weather,
    currentShift: {
      ...worker.currentShift,
      type: evaluationShiftType,
      dayInRoster: evaluationDayInRoster,
      shiftStart: evaluationShiftType === 'night' ? '19:00' : '07:00',
      shiftEnd: evaluationShiftType === 'night' ? '07:00' : '19:00',
      rosterPattern: worker.shiftPattern || worker.currentShift?.rosterPattern || '7x7 Continuo'
    }
  };

  const currentSleepRecord: SleepRecord = {
    sleepDurationHours: sleepHours,
    sleepOpportunityHours: sleepOpportunity,
    bedTime,
    wakeTime,
    sleepQuality,
    timeSinceAwakeHours: 3.5,
    accumulatedSleepDebtHours: Math.max(0, 8 - sleepHours),
    consecutiveNights,
  };

  // Compute provisional evaluation once PVT is completed
  const provisionalEval = pvtSummary
    ? evaluateFRARisk(evaluatedWorker, currentSleepRecord, kssScore, pvtSummary, fysSurvey)
    : null;

  const activeStatus = evaluationResult?.status || provisionalEval?.status || 'green';
  const activePlan = LEVEL_CONTROL_MEASURES[activeStatus] || LEVEL_CONTROL_MEASURES.green;

  const renderMeasureIcon = (iconType: ControlMeasureItem['iconType']) => {
    switch (iconType) {
      case 'hydration':
        return <Droplets className="w-4 h-4 text-sky-500 flex-shrink-0" />;
      case 'ventilation':
        return <Wind className="w-4 h-4 text-teal-500 flex-shrink-0" />;
      case 'mobility':
        return <Footprints className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case 'pause':
        return <PauseCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'ergonomics':
        return <Sliders className="w-4 h-4 text-indigo-500 flex-shrink-0" />;
      case 'stoppage':
        return <Ban className="w-4 h-4 text-rose-500 flex-shrink-0" />;
      case 'recovery':
        return <BedDouble className="w-4 h-4 text-purple-500 flex-shrink-0" />;
      case 'notification':
        return <Bell className="w-4 h-4 text-orange-500 flex-shrink-0" />;
      case 'reevaluation':
        return <RotateCw className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'monitoring':
      default:
        return <Eye className="w-4 h-4 text-cyan-500 flex-shrink-0" />;
    }
  };

  const handlePvtComplete = (summary: PVTSummary) => {
    setPvtSummary(summary);
  };

  const handleWorkerSignatureSave = (signature: string) => {
    setWorkerSignature(signature);
    if (signature) {
      setWorkerSignatureTime(new Date().toISOString());
    }
  };

  const handleSupervisorSignatureSave = (signature: string) => {
    setSupervisorSignature(signature);
    if (signature) {
      setSupervisorSignatureTime(new Date().toISOString());
    }
  };

  const handleFinalizeSignaturesAndEmit = () => {
    if (!pvtSummary) return;

    // Prepare Sleep Record
    const sleepRecord: SleepRecord = {
      sleepDurationHours: sleepHours,
      sleepOpportunityHours: sleepOpportunity,
      bedTime,
      wakeTime,
      sleepQuality,
      timeSinceAwakeHours: 3.5,
      accumulatedSleepDebtHours: Math.max(0, 8 - sleepHours),
      consecutiveNights,
    };

    // Calculate multidimensional FRA Engine result with FYS Survey and Signatures
    const baseResult = evaluateFRARisk(evaluatedWorker, sleepRecord, kssScore, pvtSummary, fysSurvey);
    
    // Worker signature is required, supervisor signature is optional
    const finalEvaluation: FRARiskEvaluation = {
      ...baseResult,
      workerSignature: workerSignature || undefined,
      workerSignatureTimestamp: workerSignatureTime || new Date().toISOString(),
      supervisorSignature: supervisorSignature || undefined,
      supervisorSignatureTimestamp: supervisorSignatureTime || (supervisorSignature ? new Date().toISOString() : undefined),
      supervisorNotes: supervisorNotes || 'Validado conforme por supervisión de turno.',
    };

    setEvaluationResult(finalEvaluation);
    setCurrentStep(8);

    // Auto-generate and download official PDF with guilloché security background and signatures
    try {
      downloadEvaluationPDF(evaluatedWorker, finalEvaluation, sleepRecord, pvtSummary);
      setPdfGenerated(true);
    } catch (e) {
      console.warn('PDF Auto-download note:', e);
    }
  };

  const handleManualDownloadPDF = () => {
    if (evaluationResult) {
      const sleepRecord: SleepRecord = {
        sleepDurationHours: sleepHours,
        sleepOpportunityHours: sleepOpportunity,
        bedTime,
        wakeTime,
        sleepQuality,
        timeSinceAwakeHours: 3.5,
        accumulatedSleepDebtHours: Math.max(0, 8 - sleepHours),
        consecutiveNights,
      };
      downloadEvaluationPDF(evaluatedWorker, evaluationResult, sleepRecord, pvtSummary || undefined);
      setPdfGenerated(true);
    }
  };

  const handleFinalSubmit = () => {
    if (evaluationResult) {
      onCheckInComplete(evaluationResult);
    }
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setPvtSummary(null);
    setWorkerSignature('');
    setWorkerSignatureTime('');
    setSupervisorSignature('');
    setSupervisorSignatureTime('');
    setEvaluationResult(null);
    setPdfGenerated(false);
  };


  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress Steps Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold mb-3">
          <span className="text-slate-500">Paso {currentStep} de 8</span>
          <span className="text-amber-600 font-bold">
            {currentStep === 1 && '1. Identificación y Contexto de Faena'}
            {currentStep === 2 && '2. Test FYS Pre-Turno & Clima'}
            {currentStep === 3 && '3. Caracterización del Sueño'}
            {currentStep === 4 && '4. Somnolencia Subjetiva (KSS)'}
            {currentStep === 5 && '5. Vigilancia Psicomotriz (PVT)'}
            {currentStep === 6 && '6. Firma Manuscrita del Trabajador'}
            {currentStep === 7 && '7. Validación y Firma del Supervisor'}
            {currentStep === 8 && '8. Certificado Oficial & Diagnóstico'}
          </span>
        </div>
        <div className="grid grid-cols-8 gap-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
            <div
              key={step}
              className={`h-full transition-all duration-300 rounded-full ${
                step <= currentStep ? 'bg-amber-500' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Worker Identity & Operational Context */}
      {currentStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-slate-800">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Identificación y Turno Operacional</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  ≤60 seg
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Verifica tus datos operacionales, equipo asignado y condiciones de turno antes de ingresar a la jornada.
              </p>
            </div>
            <div className="p-1 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <OpliraLogo size={36} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block font-medium">Operador / Trabajador</span>
              <p className="font-bold text-sm text-slate-900">{worker.name}</p>
              <p className="text-slate-500 font-mono">RUT: {worker.rut} {worker.gender ? `• ${worker.gender}` : ''}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block font-medium">Equipo Asignado & Tarea</span>
              <p className="font-bold text-sm text-amber-700">{worker.equipmentAssigned}</p>
              <p className="text-slate-600">{worker.role}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1 relative group">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 block font-medium">Faena & Meteorología</span>
                <button
                  type="button"
                  onClick={() => setShowWeatherModal(true)}
                  className="text-[10px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 cursor-pointer transition-colors"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>Ajustar</span>
                </button>
              </div>
              <p className="font-bold text-sm text-slate-900 truncate">
                {evaluatedWorker.faena}
              </p>
              <div className="flex items-center justify-between text-slate-600 text-[11px] font-medium pt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Mountain className="w-3.5 h-3.5 text-amber-600" />
                  <span>{evaluatedWorker.altitudeMeters} msnm</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-700">
                  <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                  <span>{evaluatedWorker.weather?.forecast?.[0] ? `${evaluatedWorker.weather.forecast[0].currentTempC}°C` : '21°C'}</span>
                  {evaluatedWorker.weather?.source === 'cached_forecast' && (
                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-sans">Offline</span>
                  )}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 block font-medium">Sistema de Turno Base</span>
              <p className="font-bold text-sm text-slate-900">
                {worker.shiftPattern || worker.currentShift?.rosterPattern || '7x7 Continuo'}
              </p>
              <p className="text-slate-500 text-[11px]">
                Jornada habitual: <strong>{worker.habitualShiftType === 'night' ? 'Nocturna' : worker.habitualShiftType === 'rotative' ? 'Rotativa' : 'Diurna'}</strong>
              </p>
            </div>
          </div>

          {/* Shift Selectors */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Configuración del Turno para esta Evaluación</span>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftSwitch(!isShiftSwitch)}
                className="text-[11px] text-amber-700 hover:text-amber-900 underline font-medium cursor-pointer"
              >
                {isShiftSwitch ? 'Ocultar ajustes' : '¿Cambiaste de turno o día?'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Horario de la Jornada:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleShiftTypeChange('day')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      evaluationShiftType === 'day'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    <span>Turno Día</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftTypeChange('night')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      evaluationShiftType === 'night'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Turno Noche</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Día dentro del Ciclo:
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDayInRosterChange(d)}
                      className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                        evaluationDayInRoster === d
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            id="step1-continue-btn"
            type="button"
            onClick={() => setCurrentStep(2)}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Confirmar Datos y Pasar a Encuesta FYS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: FYS Pre-Turn Survey */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <FYSPreTurnSurveyComponent
            worker={evaluatedWorker}
            survey={fysSurvey}
            onChange={setFysSurvey}
            shiftType={evaluationShiftType}
            weather={evaluatedWorker.weather || worker.weather}
            disabled={disabled}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        </div>
      )}

      {/* Step 3: Sleep Quantification */}
      {currentStep === 3 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-slate-800 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-600" />
              <span>Caracterización del Sueño Previo al Turno</span>
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Indica la cantidad real de horas efectivas dormidas en las últimas 24 horas y tu calidad de descanso.
            </p>
          </div>

          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-indigo-950">Horas Efectivas de Sueño:</label>
              <span className="font-mono text-xl font-black text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                {sleepHours.toFixed(1)} hrs
              </span>
            </div>
            <input
              id="sleep-hours-slider"
              type="range"
              min="2.0"
              max="11.0"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>2.0h (Crítico)</span>
              <span>6.0h (Mínimo)</span>
              <span>7.5h (Óptimo)</span>
              <span>11.0h</span>
            </div>
          </div>

          {/* Bedtime & Waketime */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700">Hora en que te acostaste:</label>
              <input
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold text-slate-900"
              />
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700">Hora en que despertaste:</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Sleep Quality */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              ¿Cómo calificarías la calidad de tu descanso?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { val: 1, label: 'Muy mala' },
                { val: 2, label: 'Regular' },
                { val: 3, label: 'Normal' },
                { val: 4, label: 'Buena' },
                { val: 5, label: 'Excelente' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setSleepQuality(item.val as any)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    sleepQuality === item.val
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold text-sm">{item.val}★</span>
                  <span className="text-[10px] block truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Encuesta</span>
            </button>
            <button
              id="step3-continue-btn"
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Continuar a Escala KSS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Karolinska Sleepiness Scale (KSS) */}
      {currentStep === 4 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-slate-800 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              <span>Escala de Somnolencia Karolinska (KSS)</span>
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Selecciona el número que mejor describe tu nivel de alerta o somnolencia en este instante (últimos 5-10 minutos).
            </p>
          </div>

          <div className="space-y-2">
            {kssDescriptions.map((item) => {
              const isSelected = kssScore === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setKssScore(item.value)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 border-amber-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm font-mono flex-shrink-0 ${
                      isSelected
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.value}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${isSelected ? 'text-amber-900' : 'text-slate-800'}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                  </div>
                  {isSelected && <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Sueño</span>
            </button>
            <button
              id="step4-continue-btn"
              type="button"
              onClick={() => setCurrentStep(5)}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Continuar a Prueba PVT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Psychomotor Vigilance Test (PVT-A) */}
      {currentStep === 5 && (
        <div className="space-y-4">
          <InteractivePVT
            mode="PVT-A"
            worker={evaluatedWorker}
            onComplete={handlePvtComplete}
            onAcceptAndContinue={() => setCurrentStep(6)}
            disabled={disabled}
          />

          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mx-auto font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Volver a Escala KSS</span>
          </button>
        </div>
      )}

      {/* Step 6: Worker Handwritten Digital Signature & Control Measures Display */}
      {currentStep === 6 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-slate-800 animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Firma 1 de 2 • Medidas de Control y Declaración del Trabajador
              </span>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-slate-800" />
                <span>Medidas de Control del Nivel y Firma del Trabajador</span>
              </h2>
              <p className="text-xs text-slate-500">
                Revisa las medidas de control operacionales asignadas según tu evaluación y estampa tu firma manuscrita para confirmar tu compromiso antes de iniciar el turno.
              </p>
            </div>
            <div className="p-1 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <OpliraLogo size={36} />
            </div>
          </div>

          {/* Evaluation Result Header & Level Control Measures Display */}
          <div className={`p-4 rounded-xl border space-y-3 ${activePlan.badgeBg} ${activePlan.badgeBorder}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {activeStatus === 'green' && '🟢'}
                  {activeStatus === 'yellow' && '🟡'}
                  {activeStatus === 'red' && '🔴'}
                  {activeStatus === 'gray' && '⚪'}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activePlan.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {activePlan.subtitle}
                  </p>
                </div>
              </div>
              {provisionalEval && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white/80 rounded-lg border border-slate-200 text-slate-800">
                  Score: {provisionalEval.riskScore}/100
                </span>
              )}
            </div>

            {/* List of 4 Specific Control Measures */}
            <div className="bg-white/90 backdrop-blur-xs p-3 rounded-lg border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Medidas de Control Operacionales a Cumplir en Turno:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {activePlan.measures.map((measure, idx) => (
                  <div key={measure.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      {renderMeasureIcon(measure.iconType)}
                      <span>{idx + 1}. {measure.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      {measure.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mandatory Worker Commitment Statement Box */}
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-950 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Declaración de Compromiso Operacional:
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 leading-snug pl-7">
              "Me comprometo a cumplir las medidas de control propuestas, además de las indicadas por el supervisor y la empresa."
            </p>
          </div>

          {/* Mandatory Worker Signature Pad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-amber-600" />
                <span>Firma Manuscrita del Trabajador (Obligatoria)</span>
              </span>
              {workerSignature ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Firma Registrada</span>
                </span>
              ) : (
                <span className="text-rose-600 font-medium">Requerida para continuar</span>
              )}
            </div>

            <SignaturePad
              id="worker-signature-canvas"
              title="Recuadro de Firma del Trabajador Evaluado"
              subtitle="Dibuja tu firma utilizando tu dedo, lápiz táctil o puntero para sellar tu compromiso"
              signeeName={worker.name}
              signeeRole={worker.role}
              signeeRut={worker.rut}
              onSaveSignature={handleWorkerSignatureSave}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Certificación de firma conforme a la Ley N° 19.799 sobre Documentos Electrónicos y Firma Electrónica en Chile.
            </span>
          </div>

          {!workerSignature && (
            <p className="text-xs text-center text-amber-800 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
              ⚠️ Debes estampar tu firma en el recuadro superior para confirmar tu compromiso y continuar.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Test PVT</span>
            </button>
            <button
              id="confirm-worker-signature-btn"
              type="button"
              disabled={!workerSignature}
              onClick={() => setCurrentStep(7)}
              className={`flex-1 py-3 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs ${
                workerSignature
                  ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Confirmar Firma y Pasar a Supervisor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Supervisor Validation & Optional Handwritten Signature */}
      {currentStep === 7 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-slate-800 animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Firma 2 de 2 • Control HSEC en Terreno
              </span>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <span>Revisión y Validación del Supervisor de Turno</span>
              </h2>
              <p className="text-xs text-slate-500">
                Revisa el resultado de la evaluación y las medidas suscritas por el operador antes de estampar tu firma o validación oficial HSEC.
              </p>
            </div>
            <div className="p-1 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <OpliraLogo size={36} />
            </div>
          </div>

          {/* 1. Official Diagnostic Result Banner for Supervisor */}
          <div className={`p-4 rounded-xl border-2 space-y-3 ${
            activeStatus === 'green'
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : activeStatus === 'yellow'
              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
              : 'bg-rose-50/80 border-rose-300 text-rose-950'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`w-4 h-4 rounded-full flex-shrink-0 animate-pulse ${
                  activeStatus === 'green' ? 'bg-emerald-500' : activeStatus === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Estado de Aptitud del Operador:
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase ${
                      activeStatus === 'green'
                        ? 'bg-emerald-600 text-white'
                        : activeStatus === 'yellow'
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {activeStatus === 'green' ? '🟢 ESTADO: APTO' : activeStatus === 'yellow' ? '🟡 ESTADO: PREVENTIVO' : '🔴 ESTADO: NO APTO'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    {provisionalEval?.statusLabel || (activeStatus === 'green' ? 'Riesgo Operacional Controlado' : activeStatus === 'yellow' ? 'Medida Preventiva Recomendada' : 'Riesgo Operacional Elevado')}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-center shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold block">Score FRA</span>
                  <span className="text-sm font-black text-slate-900">{provisionalEval?.riskScore ?? 18} / 100</span>
                </div>
                <div className="bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-center shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold block">Confianza</span>
                  <span className="text-sm font-black text-slate-900">{provisionalEval?.confidenceScore ?? 94}%</span>
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Horas de Sueño</span>
                <span className="font-bold text-slate-900">{sleepHours.toFixed(1)} hrs</span>
                <span className="text-[10px] text-slate-500 block">Deuda: {Math.max(0, 8 - sleepHours).toFixed(1)}h</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Escala KSS</span>
                <span className="font-bold text-slate-900">{kssScore} / 9</span>
                <span className="text-[10px] text-slate-500 block">
                  {kssScore >= 7 ? 'Somnoliento' : kssScore >= 5 ? 'Alerta Media' : 'Óptima'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">PVT Mediana</span>
                <span className="font-bold text-slate-900">{pvtSummary?.medianRT || pvtSummary?.meanRT || 365} ms</span>
                <span className="text-[10px] text-slate-500 block">Base: {worker.baseline.medianRT || worker.baseline.meanRT || 320} ms</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Desviación IPD</span>
                <span className={`font-bold ${
                  (provisionalEval?.ipdPercentage ?? 0) > 25 ? 'text-rose-600' : 'text-slate-900'
                }`}>
                  {(provisionalEval?.ipdPercentage ?? 0) > 0 ? '+' : ''}{provisionalEval?.ipdPercentage ?? 0}%
                </span>
                <span className="text-[10px] text-slate-500 block">Lapsos: {pvtSummary?.lapsesCount ?? 0}</span>
              </div>
            </div>

            {/* Operator Clinical & Fatigue Declarations */}
            {fysSurvey && (
              <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1 text-slate-700">
                <span className="font-bold text-slate-900 block text-[11px]">
                  Declaración Pre-Turno del Operador:
                </span>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>Energía para iniciar: <strong>{fysSurvey.energyToStartShift ? 'SÍ' : 'NO'}</strong></span>
                  <span>Cansancio físico: <strong>{fysSurvey.significantPhysicalFatigue ? 'SÍ' : 'NO'}</strong></span>
                  <span>Dolor en conducción: <strong>{fysSurvey.painAffectingDriving ? 'SÍ' : 'NO'}</strong></span>
                  <span>Fármacos 24h: <strong>{fysSurvey.medicationsOrDrugsConsumed ? 'Declarado' : 'No'}</strong></span>
                  <span>Alcohol 12h: <strong>{fysSurvey.alcoholConsumedLast12Hours ? 'ALERTA DECLARADA' : '0.00 (Cero)'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Operational Control Plan Accepted by Worker */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                <span>Medidas de Control Suscritas por el Operador ({activePlan.title}):</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Compromiso Aceptado</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {activePlan.measures.map((measure, idx) => (
                <div key={measure.id} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    {renderMeasureIcon(measure.iconType)}
                    <span>{idx + 1}. {measure.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {measure.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-950 font-medium italic">
              "Me comprometo a cumplir las medidas de control propuestas, además de las indicadas por el supervisor y la empresa."
            </div>
          </div>

          {/* 3. Worker Signature Registered Display */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {workerSignature ? (
                <div className="bg-white p-1 rounded-lg border border-slate-300 w-24 h-12 flex items-center justify-center overflow-hidden">
                  <img
                    src={workerSignature}
                    alt="Firma Operador"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-24 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-medium">
                  Sin firma
                </div>
              )}
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">{worker.name}</span>
                <span className="text-slate-500 text-[11px]">RUT: {worker.rut} • {worker.role}</span>
                <span className="text-emerald-700 font-semibold text-[10px] block">
                  ✓ Firma manuscrita validada en pantalla
                </span>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <span className="block font-semibold text-slate-700">Turno: {evaluatedWorker.currentShift?.type === 'night' ? 'Noche' : 'Día'}</span>
              <span>Día {evaluatedWorker.currentShift?.dayInRoster || 1}/7</span>
            </div>
          </div>

          {/* 4. Supervisor Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Observaciones / Instrucciones del Supervisor HSEC:
            </label>
            <input
              type="text"
              value={supervisorNotes}
              onChange={(e) => setSupervisorNotes(e.target.value)}
              placeholder="Ej: Evaluación presencial verificada conforme a protocolo HSEC."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          {/* 5. Optional Supervisor Handwritten Signature Canvas */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <span>Firma Manuscrita del Supervisor</span>
                <span className="text-[11px] text-slate-500 font-normal">(Opcional en Terreno)</span>
              </span>
              {supervisorSignature ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Firma Estampada</span>
                </span>
              ) : (
                <span className="text-slate-500 text-[11px]">Validación digital por defecto</span>
              )}
            </div>

            <SignaturePad
              id="supervisor-signature-canvas"
              title="Recuadro de Firma del Supervisor HSEC"
              subtitle="Firma manuscrita en pantalla (opcional). Puedes emitir el informe directamente sin firma gráfica."
              signeeName={worker.supervisorName || 'Carlos Henríquez'}
              signeeRole="Supervisor de Turno / Seguridad HSEC"
              onSaveSignature={handleSupervisorSignatureSave}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Firma Operador</span>
            </button>
            <button
              id="confirm-supervisor-and-emit-btn"
              type="button"
              onClick={handleFinalizeSignaturesAndEmit}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Aprobar y Emitir Certificado Oficial</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 8: Full Explainable FRA Result & PDF Generation */}
      {currentStep === 8 && evaluationResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-slate-800 animate-in fade-in duration-300">
          {/* Status Banner */}
          <div
            className={`p-5 rounded-2xl border text-center space-y-2 ${
              evaluationResult.status === 'green'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : evaluationResult.status === 'yellow'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : evaluationResult.status === 'red'
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white border shadow-xs mb-1">
              <span className="text-2xl">
                {evaluationResult.status === 'green' && '🟢'}
                {evaluationResult.status === 'yellow' && '🟡'}
                {evaluationResult.status === 'red' && '🔴'}
                {evaluationResult.status === 'gray' && '⚪'}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest font-bold block opacity-75">
                Resultado de la Evaluación FRA & Certificado Emitido
              </span>
              <h3 className="text-xl font-bold tracking-tight">
                {evaluationResult.statusLabel}
              </h3>
            </div>
            <p className="text-xs max-w-md mx-auto opacity-90 leading-relaxed font-medium">
              {evaluationResult.recommendedAction}
            </p>
          </div>

          {/* Control Measures of the Level Display in Results */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-amber-600" />
                <span>Medidas de Control Operacionales Aplicadas</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {activePlan.title.split(':')[0]}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {activePlan.measures.map((m, idx) => (
                <div key={m.id} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    {renderMeasureIcon(m.iconType)}
                    <span>{idx + 1}. {m.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {m.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-950 italic">
              Compromiso suscrito: "Me comprometo a cumplir las medidas de control propuestas, además de las indicadas por el supervisor y la empresa."
            </div>
          </div>

          {/* Automatic PDF Status Bar */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <FileDown className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold block">Certificado PDF Oficial Oplira (Fondo Guilloché + Estructura Transparente)</span>
                <span className="text-[10px] text-slate-300">
                  {pdfGenerated ? 'Generado y descargado automáticamente' : 'Listo para descargar'}
                </span>
              </div>
            </div>
            <button
              id="download-evaluation-pdf-btn"
              type="button"
              onClick={handleManualDownloadPDF}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
          </div>

          {/* Supervisor Email Automatic Copy Notification */}
          <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3 text-xs text-sky-950">
            <Mail className="w-4 h-4 text-sky-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block text-[11px] text-sky-900">
                Copia Certificada Enviada al Supervisor Directo:
              </span>
              <p className="text-[11px] text-sky-800">
                Se registró y transmitió una copia certificada a <strong>{evaluatedWorker.supervisorName || 'Supervisor de Faena'}</strong> (<span className="font-mono text-sky-900">{evaluatedWorker.supervisorEmail || 'supervisor.faena@minera.cl'}</span>).
              </p>
            </div>
          </div>

          {/* Signature Verification Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">Firma Trabajador (Obligatoria)</span>
                <span className="font-bold text-slate-900">{worker.name}</span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Firmado en Pantalla</span>
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">Validación Supervisor</span>
                <span className="font-bold text-slate-900">{worker.supervisorName || 'Supervisor HSEC'}</span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{evaluationResult.supervisorSignature ? 'Firma Estampada' : 'Validado en Sistema'}</span>
              </span>
            </div>
          </div>

          {/* Primary Explainability Factors ("¿Por qué?") */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>¿Por qué se determinó este estado?</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Índice FRA: <strong className="text-amber-700">{evaluationResult.riskScore}/100</strong> • Confianza: <strong className="text-slate-800">{evaluationResult.confidenceScore}%</strong>
              </span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {evaluationResult.primaryFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action guidance box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block">Instrucción Operacional Inmediata:</span>
            <p className="text-slate-600 leading-relaxed">{evaluationResult.actionDetails}</p>
          </div>

          {/* Cryptographic Audit Hash */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span className="truncate">Hash: {evaluationResult.hashSha256}</span>
            <span className="flex-shrink-0 text-emerald-600 ml-2 font-semibold">✓ Trazabilidad SHA-256</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              id="finalize-checkin-btn"
              onClick={handleFinalSubmit}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Finalizar y Guardar Evaluación</span>
            </button>
            <button
              id="repeat-pvt-from-results-btn"
              onClick={() => {
                setCurrentStep(5);
                setPvtSummary(null);
                setEvaluationResult(null);
                setPdfGenerated(false);
              }}
              className="px-4 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Repetir Solo Test PVT</span>
            </button>
            <button
              onClick={resetFlow}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nueva Evaluación Completa</span>
            </button>
          </div>
        </div>
      )}

      {/* Weather & Altitude Manual Calibration Modal */}
      <WeatherManualEditModal
        isOpen={showWeatherModal}
        currentWeather={evaluatedWorker.weather || worker.weather}
        onClose={() => setShowWeatherModal(false)}
        onSave={(updated) => {
          setCustomWeather(updated);
        }}
      />

    </div>
  );
};
