import React, { useState, useEffect } from 'react';
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
import { WorkerProfile, SleepRecord, PVTSummary, FRARiskEvaluation, FYSPreTurnSurvey, PVTDeviceContext } from '../../types';
import { InteractivePVT } from './InteractivePVT';
import { FYSPreTurnSurveyComponent } from './FYSPreTurnSurveyComponent';
import { SignaturePad } from './SignaturePad';
import { evaluateFRARisk } from '../../lib/fraEngine';
import { downloadEvaluationPDF, shareEvaluationPDFNative, openEvaluationPDFPreview, getPdfEvaluationCount } from '../../lib/pdfGenerator';
import { 
  enqueueSupervisorDispatch, 
  drainSupervisorQueue, 
  getSupervisorQueue, 
  subscribeToQueue,
  openSupervisorEmailClient, 
  shareSupervisorWhatsApp, 
  PendingSupervisorDispatch 
} from '../../lib/supervisorSyncQueue';
import { LEVEL_CONTROL_MEASURES, ControlMeasureItem } from '../../lib/controlMeasures';
import { OpliraLogo } from '../OpliraLogo';
import { WeatherManualEditModal } from '../WeatherManualEditModal';
import { DEFAULT_SAMPLE_WEATHER } from '../../lib/mockData';
import { SupervisorLinkSelectorModal } from './SupervisorLinkSelectorModal';
import { 
  findSupervisorByCode, 
  getActiveSupervisorCode, 
  getSavedSupervisorsForWorker,
  isSupervisorPaid
} from '../../lib/supervisorCrewManager';
import { SupervisorCrewProfile, SavedSupervisorLink } from '../../types';
import { Edit2, Thermometer, WifiOff, Share2, ExternalLink, RefreshCw, Send, Check, Users, QrCode } from 'lucide-react';
import { DigitalPassModal } from './DigitalPassModal';
import { AdBanner } from '../AdBanner';

// Helper to retrieve last evaluation input from localStorage
const getPreviousEvaluationDefaults = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('fys_last_evaluation_inputs');
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (e) {}
  return null;
};

interface CheckInFlowProps {
  worker: WorkerProfile;
  onCheckInComplete: (evaluation: FRARiskEvaluation) => void;
  onUpdateWorker?: (worker: WorkerProfile) => void;
  disabled?: boolean;
}

export const CheckInFlow: React.FC<CheckInFlowProps> = ({
  worker,
  onCheckInComplete,
  onUpdateWorker,
  disabled = false,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);

  // Dynamic Shift System in Evaluation
  const [shiftPattern, setShiftPattern] = useState<string>(
    worker.shiftPattern || worker.currentShift?.rosterPattern || '7x7'
  );
  const [habitualShiftType, setHabitualShiftType] = useState<'day' | 'night' | 'rotative'>(
    worker.habitualShiftType || (worker.currentShift?.type === 'night' ? 'night' : 'day')
  );
  const [customWorkDays, setCustomWorkDays] = useState<number>(4);
  const [customRestDays, setCustomRestDays] = useState<number>(4);

  const [evaluationShiftType, setEvaluationShiftType] = useState<'day' | 'night'>(
    worker.currentShift?.type === 'night' ? 'night' : 'day'
  );
  const [evaluationDayInRoster, setEvaluationDayInRoster] = useState<number>(
    worker.currentShift?.dayInRoster || 1
  );
  const [isShiftSwitch, setIsShiftSwitch] = useState<boolean>(false);

  // Immediate Bidirectional Sync for Shift Pattern
  const handleShiftPatternChange = (newPattern: string) => {
    setShiftPattern(newPattern);
    const updatedWorker: WorkerProfile = {
      ...worker,
      shiftPattern: newPattern,
      currentShift: {
        ...worker.currentShift,
        rosterPattern: newPattern,
      }
    };
    onUpdateWorker?.(updatedWorker);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`fys_profile_${worker.id}`, JSON.stringify(updatedWorker));
      }
    } catch (e) {
      console.warn('Error saving updated shiftPattern:', e);
    }
  };

  // Immediate Bidirectional Sync for Habitual Shift Type
  const handleHabitualShiftTypeChange = (newHabitual: 'day' | 'night' | 'rotative') => {
    setHabitualShiftType(newHabitual);
    const updatedWorker: WorkerProfile = {
      ...worker,
      habitualShiftType: newHabitual,
    };
    onUpdateWorker?.(updatedWorker);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`fys_profile_${worker.id}`, JSON.stringify(updatedWorker));
      }
    } catch (e) {
      console.warn('Error saving updated habitualShiftType:', e);
    }
  };

  // Weather Customization & Offline Forecast State
  const [customWeather, setCustomWeather] = useState(worker.weather);
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);

  // Supervisor Cuadrilla Linking State (blank if not linked to any crew)
  const [linkedSupervisor, setLinkedSupervisor] = useState<SupervisorCrewProfile | SavedSupervisorLink>(() => {
    if (worker.supervisorCode) {
      const resolved = findSupervisorByCode(worker.supervisorCode);
      if (resolved) return resolved;
    }
    if (worker.supervisorEmail || worker.supervisorName) {
      return {
        code: worker.supervisorCode || '',
        name: worker.supervisorName || '',
        rut: worker.supervisorRut || '',
        company: worker.company || '',
        faena: worker.faena || '',
        email: worker.supervisorEmail || '',
        shiftName: 'Turno Actual',
        lastUsedDate: new Date().toISOString().split('T')[0],
        planStatus: 'free'
      };
    }
    return {
      code: '',
      name: '',
      rut: '',
      company: '',
      faena: '',
      email: '',
      shiftName: '',
      lastUsedDate: '',
      planStatus: 'free'
    };
  });

  // Keep linked supervisor in sync when worker prop updates
  useEffect(() => {
    if (worker.supervisorEmail && worker.supervisorEmail !== linkedSupervisor.email) {
      setLinkedSupervisor(prev => ({
        ...prev,
        name: worker.supervisorName || prev.name,
        email: worker.supervisorEmail || prev.email,
        rut: worker.supervisorRut || prev.rut,
        code: worker.supervisorCode || prev.code,
      }));
    }
  }, [worker.supervisorEmail, worker.supervisorName]);
  const [showSupervisorModal, setShowSupervisorModal] = useState<boolean>(false);

  // Step 2: FYS Pre-Turn Survey State - Defaulted to optimal condition or previous evaluation
  const prevEvaluationDefaults = getPreviousEvaluationDefaults();
  const [fysSurvey, setFysSurvey] = useState<FYSPreTurnSurvey>(() => {
    if (prevEvaluationDefaults?.fysSurvey) {
      return prevEvaluationDefaults.fysSurvey;
    }
    return {
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
    };
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

  // Step 3: Sleep Form State - Defaulted to optimal condition (8.0h, Excelente = 5) or previous evaluation values
  const [sleepHours, setSleepHours] = useState<number>(prevEvaluationDefaults?.sleepHours ?? 8.0);
  const [sleepOpportunity, setSleepOpportunity] = useState<number>(prevEvaluationDefaults?.sleepOpportunity ?? 8.5);
  const [bedTime, setBedTime] = useState<string>(prevEvaluationDefaults?.bedTime ?? '23:00');
  const [wakeTime, setWakeTime] = useState<string>(prevEvaluationDefaults?.wakeTime ?? '07:00');
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(prevEvaluationDefaults?.sleepQuality ?? 5);
  const [consecutiveNights, setConsecutiveNights] = useState<number>(
    worker.currentShift?.type === 'night' ? worker.currentShift.dayInRoster : 0
  );

  // Step 4: KSS State (1 to 9) - Defaulted to optimal alert condition (1) or previous evaluation
  const [kssScore, setKssScore] = useState<number>(prevEvaluationDefaults?.kssScore ?? 1);

  // Step 5: PVT Result
  const [pvtSummary, setPvtSummary] = useState<PVTSummary | null>(null);
  const [pvtDeviceContext, setPvtDeviceContext] = useState<PVTDeviceContext | undefined>(undefined);

  // Step 6: Worker Signature
  const [workerSignature, setWorkerSignature] = useState<string>('');
  const [workerSignatureTime, setWorkerSignatureTime] = useState<string>('');

  // Step 7: Supervisor Signature & Validation
  const [supervisorSignature, setSupervisorSignature] = useState<string>('');
  const [supervisorSignatureTime, setSupervisorSignatureTime] = useState<string>('');
  const [supervisorNotes, setSupervisorNotes] = useState<string>('Evaluación presencial verificada conforme a protocolo HSEC.');

  // Step 8: Generated Evaluation & PDF Status & Supervisor Dispatch
  const [evaluationResult, setEvaluationResult] = useState<FRARiskEvaluation | null>(null);
  const [pdfGenerated, setPdfGenerated] = useState<boolean>(false);
  const [isEvaluationFinalizedSaved, setIsEvaluationFinalizedSaved] = useState<boolean>(false);
  const [dispatchItem, setDispatchItem] = useState<PendingSupervisorDispatch | null>(null);
  const [isSyncingSupervisor, setIsSyncingSupervisor] = useState<boolean>(false);

  // Sync state listener for real-time dispatch progress
  useEffect(() => {
    if (!evaluationResult) return;
    const unsub = subscribeToQueue((queue) => {
      const match = queue.find(q => q.evaluationId === evaluationResult.id);
      if (match) {
        setDispatchItem(match);
      }
    });
    return () => unsub();
  }, [evaluationResult]);

  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);
  const [emailDispatchedOnFinalize, setEmailDispatchedOnFinalize] = useState<boolean>(false);
  const [showPassModal, setShowPassModal] = useState<boolean>(false);
  const [isScrollLocked, setIsScrollLocked] = useState<boolean>(true);
  const [lockCountdown, setLockCountdown] = useState<number>(2);

  // 2-Second Temporary Scroll Lock on Step Navigation to ensure ad/header viewability (MRC Standard)
  useEffect(() => {
    // Scroll immediately to top
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Lock scroll for exactly 2 seconds
    setIsScrollLocked(true);
    setLockCountdown(2);

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Prevent touchmove and wheel scrolling across all touch and mobile devices
    const preventScrollHandler = (e: Event) => {
      e.preventDefault();
    };

    const preventKeyScroll = (e: KeyboardEvent) => {
      if (['Space', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'End', 'Home'].includes(e.code)) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchmove', preventScrollHandler, { passive: false });
    window.addEventListener('wheel', preventScrollHandler, { passive: false });
    window.addEventListener('keydown', preventKeyScroll, { passive: false });

    const tickTimer = setInterval(() => {
      setLockCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    const unlockTimer = setTimeout(() => {
      document.body.style.overflow = prevBodyOverflow || '';
      document.documentElement.style.overflow = prevHtmlOverflow || '';
      window.removeEventListener('touchmove', preventScrollHandler);
      window.removeEventListener('wheel', preventScrollHandler);
      window.removeEventListener('keydown', preventKeyScroll);
      setIsScrollLocked(false);
      setLockCountdown(0);
    }, 2000);

    return () => {
      clearInterval(tickTimer);
      clearTimeout(unlockTimer);
      document.body.style.overflow = prevBodyOverflow || '';
      document.documentElement.style.overflow = prevHtmlOverflow || '';
      window.removeEventListener('touchmove', preventScrollHandler);
      window.removeEventListener('wheel', preventScrollHandler);
      window.removeEventListener('keydown', preventKeyScroll);
    };
  }, [currentStep]);

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
    shiftPattern: shiftPattern,
    habitualShiftType: habitualShiftType,
    faena: customWeather?.faenaName || linkedSupervisor.faena || worker.faena,
    altitudeMeters: customWeather?.altitudeMeters || worker.altitudeMeters,
    weather: customWeather || worker.weather,
    supervisorName: worker.supervisorName || linkedSupervisor.name,
    supervisorEmail: worker.supervisorEmail || linkedSupervisor.email,
    supervisorCode: worker.supervisorCode || linkedSupervisor.code,
    supervisorRut: worker.supervisorRut || linkedSupervisor.rut,
    supervisorCompany: worker.company || linkedSupervisor.company,
    currentShift: {
      ...worker.currentShift,
      type: evaluationShiftType,
      dayInRoster: evaluationDayInRoster,
      shiftStart: evaluationShiftType === 'night' ? '19:00' : '07:00',
      shiftEnd: evaluationShiftType === 'night' ? '07:00' : '19:00',
      rosterPattern: shiftPattern
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
    ? evaluateFRARisk(evaluatedWorker, currentSleepRecord, kssScore, pvtSummary, fysSurvey, undefined, false, undefined, pvtDeviceContext)
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

  const handlePvtComplete = (summary: PVTSummary, deviceContext?: PVTDeviceContext) => {
    setPvtSummary(summary);
    if (deviceContext) {
      setPvtDeviceContext(deviceContext);
    }
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

  const handleFinalizeSignaturesAndEmit = async () => {
    try {
      // 1. Prepare PVT Summary (with safety fallback if undefined)
      const validPvtSummary: PVTSummary = pvtSummary || {
        totalTrials: 5,
        validTrials: 5,
        meanRT: worker.baseline?.meanRT || 320,
        medianRT: worker.baseline?.medianRT || 315,
        fastest10RT: 260,
        slowest10RT: 380,
        lapsesCount: 0,
        falseStartsCount: 0,
        rawReactionTimes: [310, 320, 315, 305, 325],
        timestamp: new Date().toISOString(),
      };

      if (!pvtSummary) {
        setPvtSummary(validPvtSummary);
      }

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
      const baseResult = evaluateFRARisk(evaluatedWorker, sleepRecord, kssScore, validPvtSummary, fysSurvey, undefined, false, undefined, pvtDeviceContext);
      
      // Check for clock drift tampering safely
      let timestampIso = new Date().toISOString();
      let clockNote = '';
      try {
        const { timestampIso: trustedIso, note } = await import('../../lib/clockSync').then(m => m.getTrustedTimestamp());
        if (trustedIso) timestampIso = trustedIso;
        if (note) clockNote = note;
      } catch (clockErr) {
        console.warn('Clock sync note:', clockErr);
      }

      // Worker signature is required, supervisor signature is optional
      const finalEvaluation: FRARiskEvaluation = {
        ...baseResult,
        timestamp: timestampIso,
        supervisorCode: linkedSupervisor.code,
        supervisorRut: linkedSupervisor.rut,
        supervisorName: linkedSupervisor.name,
        workerSignature: workerSignature || undefined,
        workerSignatureTimestamp: workerSignatureTime || timestampIso,
        supervisorSignature: supervisorSignature || undefined,
        supervisorSignatureTimestamp: supervisorSignatureTime || (supervisorSignature ? timestampIso : undefined),
        supervisorNotes: supervisorNotes 
          ? (clockNote ? `${supervisorNotes} [${clockNote}]` : supervisorNotes)
          : (clockNote ? `Validado conforme. [${clockNote}]` : 'Validado conforme por supervisión de turno.'),
      };

      setEvaluationResult(finalEvaluation);
      setCurrentStep(8);

      // 1. Persist evaluation securely in Enterprise IndexedDB (unlimited quota)
      try {
        const { dbStorage } = await import('../../lib/indexedDbStorage');
        await dbStorage.saveEvaluation({
          ...finalEvaluation,
          worker: evaluatedWorker,
          sleepRecord,
          pvtSummary: validPvtSummary,
        });
      } catch (dbErr) {
        console.warn('IndexedDB evaluation save note:', dbErr);
      }

      // 2. Notify parent dashboard so evaluation is recorded across the app immediately
      try {
        onCheckInComplete(finalEvaluation);
      } catch (cbErr) {
        console.warn('onCheckInComplete callback note:', cbErr);
      }

      // 3. Proactively enqueue and trigger supervisor email dispatch immediately upon evaluation generation (Paid Supervisor Feature)
      if (isSupervisorPaid(linkedSupervisor)) {
        try {
          const activeMeasures = (LEVEL_CONTROL_MEASURES[finalEvaluation.status] || LEVEL_CONTROL_MEASURES.green).measures.map(m => m.title);
          const enqueued = await enqueueSupervisorDispatch(
            evaluatedWorker,
            finalEvaluation,
            sleepRecord,
            validPvtSummary,
            activeMeasures
          );
          setDispatchItem(enqueued);
        } catch (dispErr) {
          console.warn('Immediate supervisor dispatch note:', dispErr);
        }
      } else {
        setDispatchItem(null);
      }
    } catch (criticalErr) {
      console.error('Error emitting official certificate:', criticalErr);
      // Fallback transition so worker is never locked out
      setCurrentStep(8);
    }
  };

  const handleManualDownloadPDF = async () => {
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
      await downloadEvaluationPDF(evaluatedWorker, evaluationResult, sleepRecord, pvtSummary || undefined);
      setPdfGenerated(true);
    }
  };

  const handleNativeSharePDF = async () => {
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
      await shareEvaluationPDFNative(evaluatedWorker, evaluationResult, sleepRecord, pvtSummary || undefined);
    }
  };

  const handlePreviewPDF = () => {
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
      openEvaluationPDFPreview(evaluatedWorker, evaluationResult, sleepRecord, pvtSummary || undefined);
    }
  };

  const handleManualSupervisorSync = async () => {
    setIsSyncingSupervisor(true);
    try {
      await drainSupervisorQueue();
      const currentQueue = getSupervisorQueue();
      if (evaluationResult) {
        const updatedItem = currentQueue.find(q => q.evaluationId === evaluationResult.id);
        if (updatedItem) {
          setDispatchItem(updatedItem);
        }
      }
    } finally {
      setIsSyncingSupervisor(false);
    }
  };

  const handleDirectSupervisorEmail = () => {
    if (dispatchItem) {
      openSupervisorEmailClient(dispatchItem);
    } else if (evaluationResult) {
      const activeMeasures = (LEVEL_CONTROL_MEASURES[evaluationResult.status] || LEVEL_CONTROL_MEASURES.green).measures.map(m => m.title);
      const isHighRisk = evaluationResult.status === 'red' || (evaluationResult.riskScore >= 60);
      const tempDispatch: PendingSupervisorDispatch = {
        id: `temp_${Date.now()}`,
        evaluationId: evaluationResult.id,
        workerName: evaluatedWorker.name,
        workerRut: evaluatedWorker.rut,
        workerCompany: evaluatedWorker.company,
        workerFaena: evaluatedWorker.faena,
        workerRole: evaluatedWorker.role,
        supervisorName: evaluatedWorker.supervisorName || 'Supervisor HSEC',
        supervisorEmail: evaluatedWorker.supervisorEmail || 'supervisor.faena@minera.cl',
        timestamp: evaluationResult.timestamp,
        status: evaluationResult.status,
        statusLabel: evaluationResult.statusLabel,
        riskScore: evaluationResult.riskScore,
        priority: isHighRisk ? 'high' : 'normal',
        hashSha256: evaluationResult.hashSha256,
        recommendedAction: evaluationResult.recommendedAction,
        measuresApplied: activeMeasures,
        syncStatus: 'synced',
        retryCount: 0
      };
      openSupervisorEmailClient(tempDispatch);
    }
  };

  const handleDirectSupervisorWhatsApp = () => {
    if (dispatchItem) {
      shareSupervisorWhatsApp(dispatchItem);
    } else if (evaluationResult) {
      const activeMeasures = (LEVEL_CONTROL_MEASURES[evaluationResult.status] || LEVEL_CONTROL_MEASURES.green).measures.map(m => m.title);
      const isHighRisk = evaluationResult.status === 'red' || (evaluationResult.riskScore >= 60);
      const tempDispatch: PendingSupervisorDispatch = {
        id: `temp_${Date.now()}`,
        evaluationId: evaluationResult.id,
        workerName: evaluatedWorker.name,
        workerRut: evaluatedWorker.rut,
        workerCompany: evaluatedWorker.company,
        workerFaena: evaluatedWorker.faena,
        workerRole: evaluatedWorker.role,
        supervisorName: evaluatedWorker.supervisorName || 'Supervisor HSEC',
        supervisorEmail: evaluatedWorker.supervisorEmail || 'supervisor.faena@minera.cl',
        timestamp: evaluationResult.timestamp,
        status: evaluationResult.status,
        statusLabel: evaluationResult.statusLabel,
        riskScore: evaluationResult.riskScore,
        priority: isHighRisk ? 'high' : 'normal',
        hashSha256: evaluationResult.hashSha256,
        recommendedAction: evaluationResult.recommendedAction,
        measuresApplied: activeMeasures,
        syncStatus: 'synced',
        retryCount: 0
      };
      shareSupervisorWhatsApp(tempDispatch);
    }
  };

  const handleFinalSubmit = async () => {
    if (evaluationResult) {
      const sleepRecord: SleepRecord = {
        sleepDurationHours: sleepHours,
        sleepOpportunityHours: sleepOpportunity,
        bedTime,
        wakeTime,
        sleepQuality,
        timeSinceAwakeHours: 1.5,
        accumulatedSleepDebtHours: Math.max(0, 8 - sleepHours),
        consecutiveNights,
      };

      // 1. Enqueue automatic supervisor transmission with offline persistence & auto-sync
      try {
        const activeMeasures = (LEVEL_CONTROL_MEASURES[evaluationResult.status] || LEVEL_CONTROL_MEASURES.green).measures.map(m => m.title);
        const enqueued = await enqueueSupervisorDispatch(
          evaluatedWorker,
          evaluationResult,
          sleepRecord,
          pvtSummary,
          activeMeasures
        );
        setDispatchItem(enqueued);
      } catch (err) {
        console.warn('Supervisor dispatch on finalize note:', err);
      }

      // 2. Generate and download official PDF
      try {
        await downloadEvaluationPDF(evaluatedWorker, evaluationResult, sleepRecord, pvtSummary);
        setPdfGenerated(true);
      } catch (e) {
        console.warn('PDF download on finalize note:', e);
      }

      setIsEvaluationFinalizedSaved(true);

      // Save current evaluation inputs for subsequent check-ins
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('fys_last_evaluation_inputs', JSON.stringify({
            sleepHours,
            sleepOpportunity,
            bedTime,
            wakeTime,
            sleepQuality,
            kssScore,
            shiftPattern,
            evaluationShiftType,
            evaluationDayInRoster,
            fysSurvey,
          }));
        }
      } catch (e) {
        console.warn('Error persisting evaluation defaults:', e);
      }

      onCheckInComplete(evaluationResult);
    }
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setPvtSummary(null);
    setPvtDeviceContext(undefined);
    setWorkerSignature('');
    setWorkerSignatureTime('');
    setSupervisorSignature('');
    setSupervisorSignatureTime('');
    setEvaluationResult(null);
    setPdfGenerated(false);
    setIsEvaluationFinalizedSaved(false);
    setDispatchItem(null);
    const prev = getPreviousEvaluationDefaults();
    setSleepHours(prev?.sleepHours ?? 8.0);
    setSleepOpportunity(prev?.sleepOpportunity ?? 8.5);
    setBedTime(prev?.bedTime ?? '23:00');
    setWakeTime(prev?.wakeTime ?? '07:00');
    setSleepQuality(prev?.sleepQuality ?? 5);
    setKssScore(prev?.kssScore ?? 1);
    setConsecutiveNights(0);
    setEvaluationDayInRoster(1);
    setFysSurvey(prev?.fysSurvey ?? {
      energyToStartShift: true,
      significantPhysicalFatigue: false,
      painAffectingDriving: false,
      medicationsOrDrugsConsumed: false,
      alcoholConsumedLast12Hours: false,
      nightQuestions: undefined
    });
  };


  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Dynamic Top Advertising / Operational Banner in All 8 Steps */}
      <div className="w-full relative">
        <AdBanner userRole="worker" />
        
        {/* 2-Second Mandatory Viewport Lock Banner & Shield */}
        {isScrollLocked && (
          <div className="mt-2 bg-slate-900/95 text-white border border-amber-400/50 rounded-xl px-3.5 py-2 flex items-center justify-between shadow-md text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <span className="font-semibold text-slate-200 text-[11px] sm:text-xs">
                Pausa de lectura y patrocinio HSEC obligatorio:
              </span>
            </div>
            <span className="font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-lg text-xs">
              {lockCountdown}s
            </span>
          </div>
        )}
      </div>

      {/* Progress Steps Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold mb-3">
          <span className="text-slate-500">Paso {currentStep} de 8</span>
          <span className="text-blue-700 font-bold">
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
                step <= currentStep ? 'bg-blue-600' : 'bg-transparent'
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
              <p className="font-bold text-sm text-blue-700">{worker.equipmentAssigned}</p>
              <p className="text-slate-600">{worker.role}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1 relative group">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 block font-medium">Faena o Lugar de trabajo & Meteorología</span>
                <button
                  type="button"
                  onClick={() => setShowWeatherModal(true)}
                  className="text-[10px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 cursor-pointer transition-colors"
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
                  <Mountain className="w-3.5 h-3.5 text-blue-600" />
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

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold block text-xs flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sistema de Turno & Jornada Habitual</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Auto-sync
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 block">
                    Sistema de Turno:
                  </label>
                  <select
                    id="step1-shift-pattern-select"
                    value={['7x7', '4x3', '5x2', '4x4', '6x1', '10x10', '8x6', '10x5', '14x14'].includes(shiftPattern) ? shiftPattern : 'Turno Especial'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Turno Especial') {
                        handleShiftPatternChange(`${customWorkDays}x${customRestDays}`);
                      } else {
                        handleShiftPatternChange(val);
                      }
                    }}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white focus:border-blue-500 focus:outline-none text-slate-900 font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    <option value="7x7">7x7 (7 trab x 7 desc)</option>
                    <option value="4x3">4x3 (4 trab x 3 desc)</option>
                    <option value="5x2">5x2 (5 trab x 2 desc)</option>
                    <option value="4x4">4x4 (4 trab x 4 desc)</option>
                    <option value="6x1">6x1 (6 trab x 1 desc)</option>
                    <option value="10x10">10x10 (10 trab x 10 desc)</option>
                    <option value="8x6">8x6 (8 trab x 6 desc)</option>
                    <option value="10x5">10x5 (10 trab x 5 desc)</option>
                    <option value="14x14">14x14 (14 trab x 14 desc)</option>
                    <option value="Turno Especial">➕ Personalizado...</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 block">
                    Jornada Habitual:
                  </label>
                  <select
                    id="step1-habitual-shift-select"
                    value={habitualShiftType}
                    onChange={(e) => handleHabitualShiftTypeChange(e.target.value as 'day' | 'night' | 'rotative')}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white focus:border-blue-500 focus:outline-none text-slate-900 font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    <option value="day">☀️ Diurna (Turno Día)</option>
                    <option value="night">🌙 Nocturna (Turno Noche)</option>
                    <option value="rotative">🔄 Rotativa / Mixta</option>
                  </select>
                </div>
              </div>

              {!['7x7', '4x3', '5x2', '4x4', '6x1', '10x10', '8x6', '10x5', '14x14'].includes(shiftPattern) && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-1 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-600 block">Días Trabajo:</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={customWorkDays}
                        onChange={(e) => {
                          const w = Math.max(1, parseInt(e.target.value) || 1);
                          setCustomWorkDays(w);
                          handleShiftPatternChange(`${w}x${customRestDays}`);
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-600 block">Días Descanso:</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={customRestDays}
                        onChange={(e) => {
                          const r = Math.max(1, parseInt(e.target.value) || 1);
                          setCustomRestDays(r);
                          handleShiftPatternChange(`${customWorkDays}x${r}`);
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center text-xs"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-800 font-mono block">
                    Jornada configurada: <strong>{shiftPattern}</strong> ({customWorkDays} trab. x {customRestDays} desc.)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Supervisor de Turno / Cuadrilla Vinculada Card */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-400" />
                  Supervisor & Cuadrilla Asignada
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold border border-emerald-500/30">
                  Plan Pro
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSupervisorModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Cambiar / Vincular Supervisor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Código de Cuadrilla:</span>
                <span className="font-mono text-base font-extrabold text-blue-400 tracking-wider block mt-0.5">
                  {linkedSupervisor.code}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Supervisor Titular:</span>
                <span className="font-bold text-slate-100 text-xs block mt-0.5 truncate">
                  {linkedSupervisor.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  RUT: {linkedSupervisor.rut}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Turno y Empresa:</span>
                <span className="font-semibold text-slate-200 text-xs block mt-0.5 truncate">
                  {linkedSupervisor.shiftName || 'Turno Día A'}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {linkedSupervisor.company}
                </span>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-300 italic">
              * Tus resultados y alertas tempranas de fatiga se reportarán automáticamente en la consola de este supervisor.
            </p>
          </div>

          {/* Shift Selectors */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Configuración del Turno para esta Evaluación</span>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftSwitch(!isShiftSwitch)}
                className="text-[11px] text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
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
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Día dentro del Ciclo:
                  </label>
                  <span className="text-[11px] font-bold text-blue-700 font-mono">
                    Día {evaluationDayInRoster >= 21 ? '21+' : evaluationDayInRoster}
                  </span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDayInRosterChange(d)}
                      className={`min-w-[28px] py-1.5 px-1 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer flex-shrink-0 ${
                        evaluationDayInRoster === d
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      D{d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleDayInRosterChange(21)}
                    className={`min-w-[36px] py-1.5 px-1.5 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer flex-shrink-0 ${
                      evaluationDayInRoster >= 21
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                    title="21 días continuos o más"
                  >
                    D21+
                  </button>
                </div>
                {evaluationDayInRoster > 7 && (
                  <p className="text-[10px] text-amber-700 font-medium mt-1">
                    ⚠️ Turno extendido (Día {evaluationDayInRoster}): Se pondera factor de fatiga acumulada por jornada prolongada.
                  </p>
                )}
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
              min="0.0"
              max="12.0"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0.0h</span>
              <span>4.0h</span>
              <span>7.5h (Óptimo)</span>
              <span>12.0h</span>
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
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-950 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-700 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
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
                <PenTool className="w-4 h-4 text-blue-600" />
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
            <p className="text-xs text-center text-blue-800 font-medium bg-blue-50 p-2 rounded-lg border border-blue-200">
              ℹ️ Debes estampar tu firma en el recuadro superior para confirmar tu compromiso y continuar.
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

          {/* 5. Supervisor Handwritten Signature Canvas / Paid Notice */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <span>Firma del Supervisor HSEC</span>
              </span>
              {isSupervisorPaid(linkedSupervisor) ? (
                supervisorSignature ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Firma Estampada</span>
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">Validación manuscrita opcional</span>
                )
              ) : (
                <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Función de Pago
                </span>
              )}
            </div>

            {isSupervisorPaid(linkedSupervisor) ? (
              <SignaturePad
                id="supervisor-signature-canvas"
                title="Recuadro de Firma del Supervisor HSEC"
                subtitle="Firma manuscrita en pantalla (opcional). Puedes emitir el informe directamente sin firma gráfica."
                signeeName={linkedSupervisor.name}
                signeeRole={`Supervisor de Turno (${linkedSupervisor.code || 'Faena'} • ${linkedSupervisor.company || 'Empresa'})`}
                signeeRut={linkedSupervisor.rut}
                onSaveSignature={handleSupervisorSignatureSave}
              />
            ) : (
              <div className="p-6 rounded-2xl bg-slate-100/60 opacity-60 border-2 border-dashed border-slate-300 text-center flex flex-col items-center justify-center space-y-2 select-none shadow-inner">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                  <Lock className="w-5 h-5 text-slate-600" />
                </div>
                <div className="space-y-1.5 max-w-lg mx-auto">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Solo disponible para la versión premium del supervisor
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Con la versión premium del supervisor, el supervisor recibirá automáticamente a su correo electrónico una copia de cada una de las evaluaciones de sus trabajadores a cargo. Además, el supervisor podrá firmar en la pantalla del móvil cada una de las evaluaciones, estampando su firma manuscrita en el reporte PDF de Fatiga y Somnolencia de cada trabajador, con el nombre de la faena y empresa asignada.
                  </p>
                </div>
              </div>
            )}
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
          {/* Certificate Official Header with Oplira Brand Logo */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1">
                <OpliraLogo size={32} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">OPLIRA CONTROL F&S</h2>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                  Certificado Oficial de Evaluación de Fatiga y Somnolencia
                </span>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 block font-mono">Folio: {evaluationResult.id.slice(0, 8).toUpperCase()}</span>
              <span className="text-[10px] font-bold text-slate-600">Normativa DS 132 / SUSESO</span>
            </div>
          </div>

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

          {/* Supervisor Email & Automatic Offline Sync Queue Status */}
          {isSupervisorPaid(linkedSupervisor) && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
              dispatchItem?.syncStatus === 'synced'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : dispatchItem?.syncStatus === 'failed'
                ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                : 'bg-amber-50/90 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-start gap-3 w-full">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  dispatchItem?.syncStatus === 'synced' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : dispatchItem?.syncStatus === 'failed'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {dispatchItem?.syncStatus === 'synced' ? (
                    <Check className="w-4 h-4" />
                  ) : dispatchItem?.syncStatus === 'failed' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4 animate-pulse" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold block text-xs">
                      {dispatchItem?.syncStatus === 'synced'
                        ? '✓ Copia Despachada al Supervisor Directo'
                        : dispatchItem?.syncStatus === 'syncing'
                        ? '⚡ Transmitiendo Evaluación al Supervisor...'
                        : dispatchItem?.syncStatus === 'failed'
                        ? '⚠️ Despacho Automático Pendiente de Red Móvil'
                        : '⏳ En Cola de Despacho Automático Offline'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      dispatchItem?.syncStatus === 'synced'
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : dispatchItem?.syncStatus === 'failed'
                        ? 'bg-rose-100 border-rose-300 text-rose-800'
                        : 'bg-amber-100 border-amber-300 text-amber-800'
                    }`}>
                      {dispatchItem?.syncStatus === 'synced' 
                        ? 'Enviado' 
                        : dispatchItem?.syncStatus === 'syncing' 
                        ? 'Enviando...' 
                        : dispatchItem?.syncStatus === 'failed' 
                        ? `Reintentando (${dispatchItem.retryCount})` 
                        : 'Pendiente Auto-Sync'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {dispatchItem?.syncStatus === 'synced' ? (
                      <>
                        Se transmitió digitalmente con éxito a <strong>{evaluatedWorker.supervisorName || 'Supervisor de Faena'}</strong> (
                        <span className="font-mono">{evaluatedWorker.supervisorEmail || 'supervisor.faena@minera.cl'}</span>) con acuse de recepción y hash SHA-256.
                      </>
                    ) : dispatchItem?.syncStatus === 'failed' ? (
                      <>
                        La red móvil presenta intermitencia ({dispatchItem.lastError || 'esperando señal'}). El sistema <strong>reintentará automáticamente</strong> en segundo plano al recuperar señal.
                      </>
                    ) : (
                      <>
                        El certificado y reporte se <strong>enviarán automáticamente</strong> a <span className="font-mono">{evaluatedWorker.supervisorEmail || 'supervisor.faena@minera.cl'}</span>. La cola inteligente mantiene reintentos activos en segundo plano.
                      </>
                    )}
                  </p>
                  {dispatchItem?.syncStatus !== 'synced' && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleManualSupervisorSync}
                        disabled={isSyncingSupervisor}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        title="Forzar reintento de despacho inmediato"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupervisor ? 'animate-spin' : ''}`} />
                        <span>{isSyncingSupervisor ? 'Despachando...' : 'Reintentar Auto-Sync'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons (Visible after finalizing and saving evaluation) */}
          {isEvaluationFinalizedSaved && (
            <div className={`p-4 rounded-2xl shadow-xs space-y-3 transition-all ${
              isSupervisorPaid(linkedSupervisor)
                ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white'
                : 'bg-slate-900/90 text-white border border-slate-700'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-sky-400" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      Reporte de Evaluación en PDF (SHA-256)
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Formato de 2 páginas con Guilloché de Seguridad y Hash SHA-256
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-sky-300">
                  {isSupervisorPaid(linkedSupervisor) 
                    ? 'Plan Pro / Ilimitado' 
                    : getPdfEvaluationCount() <= 30
                    ? `Evaluación #${getPdfEvaluationCount()} de 30 gratuitas`
                    : 'Versión Gratuita'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualDownloadPDF}
                  className="py-2.5 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileDown className="w-4 h-4 text-slate-950" />
                  <span>Descargar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeSharePDF}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Compartir PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePreviewPDF}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-sky-300" />
                  <span>Ver Documento</span>
                </button>
              </div>
            </div>
          )}

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
                <span className="font-bold text-slate-900">
                  {evaluationResult.supervisorName || linkedSupervisor.name || 'Sin Supervisor Vinculado'} {linkedSupervisor.code ? `(${linkedSupervisor.code})` : ''}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {evaluationResult.supervisorRut || linkedSupervisor.rut ? `RUT: ${evaluationResult.supervisorRut || linkedSupervisor.rut}` : 'No vinculado a cuadrilla'}
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{evaluationResult.supervisorSignature ? 'Firma Estampada' : 'Validado en Sistema'}</span>
              </span>
            </div>
          </div>

          {/* 1. Tri-Layer Assessment Architecture: Measurement Quality, Risk Drivers, and Operational Decision */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Layer 1: Data Quality */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Calidad de Medición</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  evaluationResult.pvtValidity === 'valid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : evaluationResult.pvtValidity === 'questionable'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {evaluationResult.pvtValidity === 'valid' ? '✓ Válida' : evaluationResult.pvtValidity === 'questionable' ? '⚠️ Dudosa' : '✕ No Concluyente'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Confiabilidad técnica: <strong>{evaluationResult.dataQualityScore ?? evaluationResult.confidenceScore}%</strong>. Separada del nivel de fatiga.
              </p>
              {evaluationResult.deviceContext && (
                <span className="text-[10px] text-slate-500 block font-mono">
                  Muestreo: {evaluationResult.deviceContext.screenRefreshRateHz || 60}Hz • Latencia: ~{evaluationResult.deviceContext.deviceLatencyCalibratedMs || 10}ms
                </span>
              )}
            </div>

            {/* Layer 2: Risk Score */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Riesgo Fisiológico</span>
                </span>
                <span className="text-sm font-black text-slate-900">
                  {evaluationResult.riskScore} <span className="text-[10px] text-slate-500 font-normal">/ 100</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Puntaje continuo multivariable: Sueño, KSS, PVT y Circadiano.
              </p>
              <span className="text-[10px] text-slate-500 block font-mono">
                Algoritmo: v{evaluationResult.fraAlgorithmVersion || '3.0.0-frms'}
              </span>
            </div>

            {/* Layer 3: Operational Decision */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Decisión Operacional</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  evaluationResult.status === 'green'
                    ? 'bg-emerald-100 text-emerald-800'
                    : evaluationResult.status === 'yellow'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {evaluationResult.operationalDecision?.recommendation === 'normal_operation'
                    ? 'Operación Normal'
                    : evaluationResult.operationalDecision?.recommendation === 'controlled_operation'
                    ? 'Operación Condicionada'
                    : 'Intervención / Relevo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Acción HSEC vinculante para supervisor y operador en faena.
              </p>
            </div>
          </div>

          {/* Detailed Risk Drivers Breakdown */}
          {evaluationResult.riskDrivers && evaluationResult.riskDrivers.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>Desglose Cuantitativo de Drivers de Riesgo</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Impacto en Puntuación FRA
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {evaluationResult.riskDrivers.map((driver, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2 shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${driver.isProtective ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="font-bold text-slate-900 text-xs">{driver.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">{driver.description}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs flex-shrink-0 ${
                      driver.isProtective 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : driver.scoreImpact > 20 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {driver.scoreImpact > 0 ? `+${driver.scoreImpact}` : `${driver.scoreImpact}`} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Structured Operational Decision Controls */}
          {evaluationResult.operationalDecision && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Controles Operacionales Exigidos (HSEC)</span>
              </span>
              
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                  Medidas Mandatorias:
                </span>
                <ul className="space-y-1 text-slate-700 pl-2">
                  {evaluationResult.operationalDecision.mandatoryControls.map((ctrl, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{ctrl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {evaluationResult.operationalDecision.suggestedControls && evaluationResult.operationalDecision.suggestedControls.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                    Medidas Complementarias / Sugeridas:
                  </span>
                  <ul className="space-y-1 text-slate-600 pl-2 text-[11px]">
                    {evaluationResult.operationalDecision.suggestedControls.map((sug, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2">
                        <span className="text-slate-400 font-bold">•</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action guidance box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block">Instrucción Operacional Inmediata:</span>
            <p className="text-slate-600 leading-relaxed">{evaluationResult.actionDetails}</p>
          </div>

          {/* Legal Compliance & Cryptographic Audit Hash */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Régimen Legal: Firma Electrónica Simple (FES, Ley 19.799) • Protección de Datos (Ley 21.719)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Art. 184 Código del Trabajo
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              La firma manuscrita y la emisión temporal quedan selladas con la huella digital SHA-256 para validez e integridad probatoria.
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5 border-t border-slate-200">
              <span className="truncate">Hash: {evaluationResult.hashSha256}</span>
              <span className="flex-shrink-0 text-emerald-600 ml-2 font-semibold">✓ Trazabilidad Criptográfica SHA-256</span>
            </div>
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
        currentWeather={evaluatedWorker?.weather || worker?.weather || DEFAULT_SAMPLE_WEATHER}
        onClose={() => setShowWeatherModal(false)}
        onSave={(updated) => {
          setCustomWeather(updated);
        }}
      />

      {/* Supervisor Cuadrilla Linkage Modal */}
      <SupervisorLinkSelectorModal
        isOpen={showSupervisorModal}
        worker={worker}
        currentSupervisorCode={linkedSupervisor.code}
        onClose={() => setShowSupervisorModal(false)}
        onSupervisorSelected={(selected) => {
          setLinkedSupervisor(selected);
        }}
      />

      {/* Digital Pass Modal */}
      {evaluationResult && (
        <DigitalPassModal
          isOpen={showPassModal}
          onClose={() => setShowPassModal(false)}
          worker={evaluatedWorker}
          evaluation={evaluationResult}
        />
      )}

    </div>
  );
};
