// Global Types for FYS HSEC Oplira (Fatigue Risk Management System v2.0)

export type UserRole = 'worker' | 'personal_profile' | 'supervisor' | 'hsec' | 'health' | 'admin';

export type TrafficLightStatus = 'green' | 'yellow' | 'red' | 'gray';

export type TaskCriticality = 1 | 2 | 3 | 4; 
// 1: Admin/Bajo riesgo, 2: Operacional moderado, 3: Crítica (Palas, Perforación), 4: Catastrófica (CAEX, Transporte personas)

export type ShiftType = 'day' | 'night' | 'swing';

export type PVTMode = 'PVT-A' | 'PVT-L' | 'PVT-X' | 'Micro-PVT';

export interface WeatherForecastDay {
  dayLabel: string; // "Hoy", "Mañana (+1d)", "Pasado Mañana (+2d)"
  date: string; // "2026-08-13"
  tempMinC: number;
  tempMaxC: number;
  currentTempC: number;
  thermalSensationC: number;
  condition: 'Despejado Altiplánico' | 'Viento Blanco / Ráfagas' | 'Nublado Cordillera' | 'Escarcha Matinal' | 'Radiación Extrema' | 'Despejado / Templado' | 'Despejado / Óptimo' | 'Despejado' | 'Fresco' | 'Frío / Viento' | string;
  windSpeedKmh: number;
  windGustsKmh: number;
  uvIndex: number;
  humidityPercent: number;
  barometricPressureHpa: number;
  hypoxiaRiskLevel: 'Baja' | 'Moderada' | 'Severa';
  fatigueWeatherImpactScore: number; // 0 - 25 points added to fatigue burden
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  faenaName: string;
  isGpsConnected: boolean;
  lastUpdated: string;
  source?: 'gps_live' | 'cached_forecast' | 'manual_entry';
  cachedDate?: string;
  forecast: WeatherForecastDay[];
}

export interface WorkerProfile {
  id: string;
  rut: string; // Chilean ID format
  name: string;
  birthDate?: string; // "1988-05-14"
  gender?: 'Masculino' | 'Femenino' | 'Otro';
  avatarUrl?: string;
  company: string;
  role: string;
  area: string;
  faena: string;
  altitudeMeters: number;
  equipmentAssigned: string;
  criticality: TaskCriticality;
  gpsEnabled?: boolean;
  gpsCoordinates?: { latitude: number; longitude: number };
  weather?: WeatherData;
  currentShift: {
    type: ShiftType;
    dayInRoster: number; // e.g. Day 4 of 7
    totalRosterDays: number;
    shiftStart: string; // "07:00" or "19:00"
    shiftEnd: string;
    rosterPattern: string; // "7x7 Continuo"
  };
  baseline: {
    meanRT: number; // ms, e.g. 245ms
    medianRT: number;
    standardDeviation: number;
    fastest10Percent: number;
    lapseThresholdMs: number; // typically 500ms
    validTrialsCount: number;
    lastUpdated: string;
  };
  legalConsent?: {
    accepted: boolean;
    timestamp: string;
    signatureDigital: string;
    consentedRut?: string;
    consentedName?: string;
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
    acceptedDutyOfDisclosure: boolean;
  };
  profileCompleted?: boolean;
  shiftPattern?: string; // e.g. "7x7", "4x3", "14x14", "5x2"
  habitualShiftType?: 'day' | 'night' | 'rotative'; // Diurna, Nocturna, Rotativa
  supervisorName?: string; // Direct Supervisor Name
  supervisorEmail?: string; // Direct Supervisor Email
  chronotype?: 'morning' | 'intermediate' | 'evening';
}

export interface SleepRecord {
  sleepDurationHours: number; // Hours slept, e.g. 6.5
  sleepOpportunityHours: number; // Time available between shifts, e.g. 10.0
  bedTime: string; // e.g. "22:30"
  wakeTime: string; // e.g. "05:00"
  sleepQuality: 1 | 2 | 3 | 4 | 5; // 1: Muy mala, 5: Excelente
  timeSinceAwakeHours: number; // Calculated hours since wake-up
  accumulatedSleepDebtHours: number; // Accumulated debt over last 72h
  consecutiveNights: number;
}

export interface PVTTrialResult {
  trialIndex: number;
  stimulusDelayMs: number; // ISI (Inter-stimulus interval 2000-10000ms)
  reactionTimeMs: number;
  reciprocalRTMs?: number; // 1000 / RT (speed metric)
  isLapse: boolean; // RT >= 500ms
  isFalseStart: boolean; // RT < 100ms
  isDiscardedEnvironmental?: boolean; // Discarded due to cold/screen touch glitch
}

export interface PVTSummary {
  mode: PVTMode;
  timestamp: string;
  totalTrials: number;
  validTrials: number;
  meanRT: number;
  medianRT: number;
  fastest10PercentRT: number;
  slowest10PercentRT: number;
  rrtMean?: number; // Mean reciprocal reaction time (1000/RT), immune to single outlier distortion
  intraIndividualVariability?: number; // Standard deviation of valid RTs
  lapsesCount: number;
  falseStartsCount: number;
  deviceLatencyCalibratedMs: number;
  repeatAttemptNumber?: number; // Attempt 1, 2 or 3
  repeatReason?: string; // e.g. "Cold hands / screen touch issue"
  trials: PVTTrialResult[];
}

export interface DSMEvent {
  timestamp: string;
  eventType: 'perclos_high' | 'micro_sleep' | 'excessive_yawning' | 'eye_closure_prolonged';
  perclosPercentage: number;
  durationSeconds: number;
  vehicleSpeedKmH: number;
  isVehicleStopped: boolean;
}

export interface FYSPreTurnSurvey {
  // General Pre-Turn Questions (all shifts)
  energyToStartShift: boolean; // 1. ¿Se siente con energía para comenzar el turno? (true = SÍ, false = NO)
  significantPhysicalFatigue: boolean; // 2. ¿Presenta cansancio físico importante? (true = SÍ, false = NO)
  painAffectingDriving: boolean; // 3. ¿Tiene algún dolor que afecte la conducción? (true = SÍ, false = NO)
  
  // Health, Medication, Drugs & Alcohol Control
  medicationsOrDrugsConsumed: boolean; // ¿Ha consumido medicamentos (con o sin receta que induzcan somnolencia) o drogas en las últimas 24h?
  medicationDetails?: string;
  alcoholConsumedLast12Hours: boolean; // ¿Ha consumido alcohol en las últimas 12 horas o siente resaca/efecto residual?
  commuteTimeMinutes?: number; // Tiempo de traslado en minutos

  // Exclusive Night Shift Questions
  nightQuestions?: {
    yawningOrHeavyEyelids: boolean; // 4. ¿En la última hora ha estado bostezando o siente pesadez en los párpados?
    hydratedAndNourished: boolean; // 5. ¿Se alimentó y se encuentra hidratado?
    excessEnergyDrinks: boolean; // 6. ¿Ha consumido bebidas energéticas en exceso (+2 latas)?
    daytimeSleepEnvironment: 'optimal' | 'regular' | 'poor'; // Control Fisiológico: Óptimo / Regular / Deficiente
    cabinLightingCondition: 'optimal' | 'partial' | 'dim_darkness'; // Iluminación: Óptima / Parcial / Penumbra continua
  };
}

export interface FRARiskEvaluation {
  id: string;
  workerId: string;
  timestamp: string;
  status: TrafficLightStatus;
  statusLabel: string;
  riskScore: number; // 0-100 (0=Safe, 100=Extreme risk)
  confidenceScore: number; // 0-100%
  
  // Survey responses included
  fysSurvey?: FYSPreTurnSurvey;
  
  // Dimensional Sub-scores
  fei: number; // Fatigue Exposure Index (0-100)
  kss: number; // Karolinska Sleepiness Scale (1-9)
  ipdPercentage: number; // Individual Performance Deviation vs baseline (% deviation)
  concordanceIndex: 'concordant_safe' | 'concordant_risk' | 'discordant_masked_fatigue' | 'discordant_subjective_only';
  
  // Context Factors
  circadianPhase: 'peak_alertness' | 'intermediate' | 'trough_critical_nadir'; // Nadir: 03:00 - 06:00
  altitudeImpact: 'low' | 'moderate' | 'high';
  
  // Explainability
  primaryFactors: string[];
  recommendedAction: string;
  actionDetails: string;
  
  // Signatures & Operational Validation
  workerSignature?: string; // Base64 data URL of handwritten canvas signature
  workerSignatureTimestamp?: string;
  supervisorSignature?: string; // Base64 data URL of handwritten supervisor signature
  supervisorSignatureTimestamp?: string;
  supervisorApprovalNotes?: string;
  supervisorNotes?: string;

  // Integrity & Traceability
  hashSha256: string;
  isOfflineSynced: boolean;
  
  // Re-evaluation / Recovery
  isReevaluation: boolean;
  previousEvaluationId?: string;
  appliedInterventionId?: string;
}

export interface InterventionRecord {
  id: string;
  workerId: string;
  evaluationId: string;
  supervisorId: string;
  timestamp: string;
  interventionType: 'active_break_15m' | 'controlled_nap_25m' | 'equipment_rotation' | 'task_reassignment' | 'temporary_relief' | 'health_referral';
  customNotes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'reevaluated';
  recoveryOutcome?: 'recovered_green' | 'partial_yellow' | 'unrecovered_red' | 'inconclusive_gray';
  completedAt?: string;
  reevaluationId?: string;
}

export interface StopBangRecord {
  id: string;
  workerId: string;
  date: string;
  snoring: boolean;
  tiredness: boolean;
  observedApnea: boolean;
  highBloodPressure: boolean;
  bmiOver35: boolean;
  ageOver50: boolean;
  neckCircumferenceOver40cm: boolean;
  genderMale: boolean;
  totalScore: number; // 0 - 8
  riskCategory: 'low' | 'intermediate' | 'high';
  medicalRecommendation: string;
  referredToSleepStudy: boolean;
  doctorNotes?: string;
}

export interface ShiftRosterConfig {
  name: string;
  pattern: string; // e.g. "7x7 Día/Noche"
  dayShiftHours: number; // 12
  nightShiftHours: number;
  daysOn: number;
  daysOff: number;
  rotationStrategy: 'fixed_day' | 'fixed_night' | 'rotational_mid_cycle';
  transitHours: number;
}

export interface AlgorithmVersionLog {
  version: string;
  releaseDate: string;
  leadScientist: string;
  approvalCommittee: string;
  changesSummary: string;
  validationMetrics: {
    sensitivity: number; // e.g. 0.91
    specificity: number; // e.g. 0.89
    aucRoc: number; // e.g. 0.94
    falsePositiveRate: number; // e.g. 0.08
    falseNegativeRate: number; // e.g. 0.05
  };
}

// Meeting Attendance Register Types
export type AttendanceStatus = 'present' | 'late' | 'justified' | 'absent' | 'with_prevention_measure';

export interface MeetingAttendee {
  workerId: string;
  name: string;
  rut: string;
  role: string;
  company: string;
  equipmentAssigned: string;
  status: AttendanceStatus;
  checkInTime?: string; // "06:48:15"
  digitalSignature?: string; // Base64 signature or cryptographic verification stamp
  signatureHash?: string;
  fatigueStatus: TrafficLightStatus;
  kssScore?: number;
  pvtReactionTimeMs?: number;
  notes?: string;
  signedInPerson: boolean;
}

export interface MeetingTopic {
  id: string;
  title: string;
  description: string;
  category: 'safety_talk' | 'fatigue_management' | 'operational_coordination' | 'hsec_policy';
  durationMinutes: number;
}

export interface MeetingCommitment {
  id: string;
  topic: string;
  responsibleName: string;
  responsibleRole: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface MeetingSession {
  id: string;
  code: string; // e.g. "ACT-2026-0813-01"
  title: string;
  meetingType: 'shift_start' | 'paritary_committee' | 'hsec_safety_talk' | 'operational_sync' | 'fatigue_workshop';
  date: string; // "2026-08-13"
  startTime: string; // "06:45"
  endTime: string; // "07:15"
  location: string; // "Sala de Capacitación y Despacho Mina Rajo Sur"
  facilitatorName: string;
  facilitatorRole: string;
  facilitatorRut: string;
  faena: string;
  altitudeMeters: number;
  objective: string;
  topics: MeetingTopic[];
  commitments: MeetingCommitment[];
  attendees: MeetingAttendee[];
  status: 'in_progress' | 'closed' | 'archived';
  closureNotes?: string;
  facilitatorSignature?: string;
}

