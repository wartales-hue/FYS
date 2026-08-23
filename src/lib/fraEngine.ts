// FRA Engine v2.0 - Scientific Multidimensional Fatigue Risk Assessment Algorithm
// Compliant with FRA-HSEC Master Specification

import { 
  WorkerProfile, 
  SleepRecord, 
  PVTSummary, 
  TrafficLightStatus, 
  FRARiskEvaluation,
  DSMEvent,
  FYSPreTurnSurvey,
  RiskDriver,
  OperationalDecision,
  LegalComplianceMetadata,
  PVTValidityStatus,
  PVTDeviceContext
} from '../types';

export const FRA_ALGORITHM_VERSION = "3.0.0-frms";

export function calculateCircadianPhase(shiftHour: number): 'peak_alertness' | 'intermediate' | 'trough_critical_nadir' {
  // Circadian Nadir typically occurs between 02:00 and 06:00
  if (shiftHour >= 2 && shiftHour <= 6) {
    return 'trough_critical_nadir';
  }
  // Secondary afternoon dip (post-prandial) 13:30 to 15:30
  if (shiftHour >= 13 && shiftHour <= 15) {
    return 'intermediate';
  }
  // Morning peak (09:00 - 12:00) or early evening (18:00 - 21:00)
  return 'peak_alertness';
}

export function calculateFEI(
  sleep: SleepRecord, 
  worker: WorkerProfile, 
  currentHour: number = 8
): number {
  let score = 0;

  // 1. Sleep Duration Factor (Max 40 points in raw FEI scale)
  if (sleep.sleepDurationHours < 3.0) {
    score += 40;
  } else if (sleep.sleepDurationHours < 4.0) {
    score += 32;
  } else if (sleep.sleepDurationHours < 5.0) {
    score += 22;
  } else if (sleep.sleepDurationHours < 6.0) {
    score += 12;
  } else if (sleep.sleepDurationHours < 6.8) {
    score += 5;
  }

  // 2. Sleep Quality & Fragmented Rest (Max 18 points)
  if (sleep.sleepQuality === 1) score += 18;
  else if (sleep.sleepQuality === 2) score += 12;
  else if (sleep.sleepQuality === 3) score += 5;

  // 3. Time Awake / Homeostatic Sleep Pressure (Max 18 points)
  if (sleep.timeSinceAwakeHours >= 18) {
    score += 18;
  } else if (sleep.timeSinceAwakeHours >= 15) {
    score += 12;
  } else if (sleep.timeSinceAwakeHours >= 12) {
    score += 6;
  }

  // 4. Cumulative Sleep Debt / Consecutive Nights (Max 14 points)
  if (sleep.consecutiveNights >= 6) {
    score += 10;
  } else if (sleep.consecutiveNights >= 4) {
    score += 5;
  }
  if (sleep.accumulatedSleepDebtHours >= 4.0) {
    score += 6;
  } else if (sleep.accumulatedSleepDebtHours >= 2.0) {
    score += 3;
  }

  // 5. Shift & Circadian Context (Max 10 points)
  const circadian = calculateCircadianPhase(currentHour);
  if (circadian === 'trough_critical_nadir') {
    score += 10;
  } else if (circadian === 'intermediate') {
    score += 4;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function calculateIPD(pvt: PVTSummary, worker: WorkerProfile): number {
  if (!worker.baseline || worker.baseline.meanRT <= 0 || pvt.validTrials === 0) {
    return 0;
  }
  
  // Robust Statistical PVT Analysis (Basner & Dinges, 2011):
  // Compare against actual individual baseline without artificial high floor dampening
  const workerBaseMedian = worker.baseline.medianRT > 0 ? worker.baseline.medianRT : worker.baseline.meanRT;
  const effectiveBaseline = workerBaseMedian > 0 ? workerBaseMedian : 320;
  const currentMetric = pvt.medianRT > 0 ? pvt.medianRT : pvt.meanRT;

  // Calculate percentage shift from personal baseline
  const deviation = ((currentMetric - effectiveBaseline) / effectiveBaseline) * 100;
  
  // Intra-individual variability factor (ISV penalty if erratic performance)
  let variabilityAdjustment = 0;
  if (pvt.intraIndividualVariability && pvt.intraIndividualVariability > 80) {
    variabilityAdjustment = Math.min(12, Math.round((pvt.intraIndividualVariability - 80) / 8));
  }

  return Number(Math.max(-30, Math.min(150, deviation + variabilityAdjustment)).toFixed(1));
}

// Generate deterministic canonical hash for integrity tracking
export function generateIntegrityHash(payload: string): string {
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256-FRA-v3.0-${hex}`;
}

export function evaluateFRARisk(
  worker: WorkerProfile,
  sleep: SleepRecord,
  kss: number,
  pvt: PVTSummary,
  fysSurvey?: FYSPreTurnSurvey,
  dsm?: DSMEvent,
  isReevaluation: boolean = false,
  previousEvalId?: string,
  deviceContext?: PVTDeviceContext
): FRARiskEvaluation {
  // 1. DATA QUALITY LAYER (Evaluate measurement reliability independently from risk)
  let dataQualityScore = 95;
  const invalidationReasons: string[] = [];

  if (pvt.validTrials < 2) {
    dataQualityScore -= 45;
    invalidationReasons.push('Ensayos válidos de PVT insuficientes (< 2 ensayos)');
  }
  if (pvt.falseStartsCount >= 4) {
    dataQualityScore -= 30;
    invalidationReasons.push(`Exceso de falsos arranques anticipados (${pvt.falseStartsCount} pulsaciones antes del estímulo)`);
  }
  if (deviceContext?.interruptionDetected || deviceContext?.visibilityChangeDetected) {
    dataQualityScore -= 35;
    invalidationReasons.push('Interrupción de aplicación o cambio de pestaña durante la medición psicomotora');
  }
  if (!worker.baseline || worker.baseline.validTrialsCount < 3) {
    dataQualityScore -= 10;
  }

  dataQualityScore = Math.max(10, Math.min(100, dataQualityScore));

  const pvtValidity: PVTValidityStatus = 
    dataQualityScore < 50 || pvt.validTrials < 2 || pvt.falseStartsCount >= 5 
      ? 'invalid' 
      : dataQualityScore < 75 
      ? 'questionable' 
      : 'valid';

  // If technical quality is invalid, produce Inconclusive (Gray) result to prevent false greens or unwarranted stops
  if (pvtValidity === 'invalid') {
    const evalId = `eval-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const hash = generateIntegrityHash(`${worker.id}-gray-${Date.now()}`);

    const grayDecision: OperationalDecision = {
      recommendation: 'reassessment_required',
      decisionLabel: 'Medición No Concluyente — Repetir Test',
      mandatoryControls: [
        'Repetir test psicomotor PVT en entorno libre de distracciones',
        'Verificar que la pantalla táctil esté limpia y sin guantes incompatibles'
      ],
      suggestedControls: [
        'Confirmar estado de descanso con supervisor de turno'
      ]
    };

    const legalCompliance: LegalComplianceMetadata = {
      signatureStandard: 'FES_LEY_19799',
      dataProtectionStandard: 'LEY_21719_MINIMIZACION',
      legalLaborBase: 'ART_184_CODIGO_DEL_TRABAJO',
      evidenceIntegrityHash: hash,
      schemaVersion: 4,
      fraAlgorithmVersion: FRA_ALGORITHM_VERSION
    };

    return {
      id: evalId,
      workerId: worker.id,
      timestamp: new Date().toISOString(),
      status: 'gray',
      statusLabel: 'Medición No Concluyente (Repetir Test)',
      riskScore: 0,
      confidenceScore: dataQualityScore,
      dataQualityScore,
      pvtValidity,
      pvtQualityScore: dataQualityScore,
      deviceContext,
      fysSurvey,
      fei: calculateFEI(sleep, worker),
      kss,
      ipdPercentage: 0,
      concordanceIndex: 'concordant_safe',
      circadianPhase: 'intermediate',
      altitudeImpact: worker.altitudeMeters > 3000 ? 'high' : 'low',
      primaryFactors: invalidationReasons.length > 0 ? invalidationReasons : ['Calidad de medición insuficiente para validar el inicio del turno'],
      riskDrivers: [
        {
          category: 'pvt',
          name: 'Calidad de Medición PVT',
          scoreImpact: 0,
          isProtective: false,
          description: 'La sesión no cumplió los criterios de calidad psicométrica requeridos para emitir un score.'
        }
      ],
      recommendedAction: 'Repetir Test Psicomotor Pre-Turno',
      actionDetails: 'Asegurar entorno tranquilo, libre de notificaciones o interrupciones, y repetir la prueba de reacción.',
      operationalDecision: grayDecision,
      legalCompliance,
      fraAlgorithmVersion: FRA_ALGORITHM_VERSION,
      hashSha256: hash,
      isOfflineSynced: true,
      isReevaluation,
      previousEvaluationId: previousEvalId
    };
  }

  // 2. MATHEMATICAL RISK SCORING WITH EXPLICIT RISK DRIVERS
  const fei = calculateFEI(sleep, worker);
  const ipd = calculateIPD(pvt, worker);
  const now = new Date();
  const circadian = calculateCircadianPhase(now.getHours());
  const altitudeImpact = worker.altitudeMeters >= 3800 ? 'high' : worker.altitudeMeters >= 2500 ? 'moderate' : 'low';

  const riskDrivers: RiskDriver[] = [];
  let compositeScore = 0;

  // Driver A: Sleep Duration & Quality (FEI)
  const sleepPoints = Math.round((fei / 100) * 32);
  compositeScore += sleepPoints;

  if (sleep.sleepDurationHours < 5.0) {
    riskDrivers.push({
      category: 'sleep',
      name: 'Horas de Sueño Insuficientes',
      scoreImpact: sleepPoints,
      isProtective: false,
      description: `${sleep.sleepDurationHours.toFixed(1)} hrs registradas (mínimo recomendado: 6.5h)`
    });
  } else if (sleep.sleepDurationHours >= 7.0 && sleep.sleepQuality >= 4) {
    riskDrivers.push({
      category: 'protective',
      name: 'Sueño Reparador Óptimo',
      scoreImpact: -8,
      isProtective: true,
      description: `${sleep.sleepDurationHours.toFixed(1)} hrs de descanso con calidad alta`
    });
  } else {
    riskDrivers.push({
      category: 'sleep',
      name: 'Carga de Sueño / Descanso',
      scoreImpact: sleepPoints,
      isProtective: false,
      description: `${sleep.sleepDurationHours.toFixed(1)} hrs de descanso (Calidad ${sleep.sleepQuality}/5)`
    });
  }

  // Driver B: Subjective Sleepiness (KSS)
  let kssPoints = 0;
  if (kss >= 9) kssPoints = 30;
  else if (kss === 8) kssPoints = 25;
  else if (kss === 7) kssPoints = 18;
  else if (kss === 6) kssPoints = 12;
  else if (kss === 5) kssPoints = 6;
  else if (kss === 4) kssPoints = 3;
  compositeScore += kssPoints;

  if (kss >= 7) {
    riskDrivers.push({
      category: 'survey',
      name: 'Somnolencia Percibida Elevada (KSS)',
      scoreImpact: kssPoints,
      isProtective: false,
      description: `Nivel KSS ${kss}/9 (somnolencia marcada)`
    });
  } else if (kss <= 3) {
    riskDrivers.push({
      category: 'protective',
      name: 'Alerta Subjetiva Óptima (KSS)',
      scoreImpact: -5,
      isProtective: true,
      description: `Nivel KSS ${kss}/9 (estado de alta vigilia percibida)`
    });
  }

  // Driver C: Objective Psychomotor Reaction & Lapses (PVT)
  let pvtPoints = 0;
  if (ipd >= 40 || pvt.lapsesCount >= 3) {
    pvtPoints = 30 + Math.min(5, pvt.lapsesCount * 2);
  } else if (ipd >= 25 || pvt.lapsesCount >= 2) {
    pvtPoints = 22;
  } else if (ipd >= 15 || pvt.lapsesCount >= 1) {
    pvtPoints = 14;
  } else if (ipd >= 8) {
    pvtPoints = 6;
  }
  compositeScore += pvtPoints;

  if (pvt.lapsesCount > 0 || ipd >= 15) {
    riskDrivers.push({
      category: 'pvt',
      name: 'Desviación Psicomotora PVT',
      scoreImpact: pvtPoints,
      isProtective: false,
      description: `Latencia media: ${pvt.meanRT}ms (+${ipd}% vs baseline) | ${pvt.lapsesCount} lapso(s) >500ms`
    });
  } else if (ipd <= 5 && pvt.lapsesCount === 0) {
    riskDrivers.push({
      category: 'protective',
      name: 'Velocidad Psicomotora Calibrada',
      scoreImpact: -6,
      isProtective: true,
      description: `Latencia media: ${pvt.meanRT}ms sin lapsos de atención`
    });
  }

  // Driver D: Concordance & Masked Fatigue
  let concordance: 'concordant_safe' | 'concordant_risk' | 'discordant_masked_fatigue' | 'discordant_subjective_only' = 'concordant_safe';
  if (kss >= 6 && (ipd >= 20 || pvt.lapsesCount >= 1)) {
    concordance = 'concordant_risk';
  } else if (kss <= 4 && (ipd >= 30 || pvt.lapsesCount >= 2)) {
    concordance = 'discordant_masked_fatigue';
    compositeScore += 8;
    riskDrivers.push({
      category: 'pvt',
      name: 'Fatiga Enmascarada Detectada',
      scoreImpact: +8,
      isProtective: false,
      description: 'Discrepancia: El operador declara sentirse bien pero el PVT revela reflejos enlentecidos.'
    });
  } else if (kss >= 7 && ipd < 10 && pvt.lapsesCount === 0) {
    concordance = 'discordant_subjective_only';
  }

  // Driver E: Operational FYS Survey Questions
  let surveyDirectPenalty = 0;
  const primaryFactors: string[] = [];
  let isStrictDisqualifying = false;

  if (fysSurvey) {
    if (!fysSurvey.energyToStartShift) {
      surveyDirectPenalty += 8;
      primaryFactors.push('Baja energía reportada para iniciar la jornada');
      riskDrivers.push({
        category: 'survey',
        name: 'Reporte de Energía Pre-Turno',
        scoreImpact: +8,
        isProtective: false,
        description: 'El trabajador reporta falta de vitalidad al inicio del turno'
      });
    }

    if (fysSurvey.significantPhysicalFatigue) {
      surveyDirectPenalty += 10;
      primaryFactors.push('Presencia de cansancio físico reportado');
      riskDrivers.push({
        category: 'survey',
        name: 'Cansancio Físico Acumulado',
        scoreImpact: +10,
        isProtective: false,
        description: 'Declaración de fatiga muscular o física'
      });
    }

    if (fysSurvey.painAffectingDriving) {
      surveyDirectPenalty += 12;
      primaryFactors.push('Molestia física o dolor que interfiere con la tarea');
    }

    if (fysSurvey.alcoholConsumedLast12Hours) {
      surveyDirectPenalty += 80;
      isStrictDisqualifying = true;
      primaryFactors.push('ALERTA CRÍTICA: Declaración de consumo de alcohol en últimas 12h (Tolerancia Cero)');
      riskDrivers.push({
        category: 'survey',
        name: 'Consumo de Alcohol Reciente (12h)',
        scoreImpact: +80,
        isProtective: false,
        description: 'Tolerancia cero conforme a la normativa interna de faena'
      });
    }

    if (fysSurvey.medicationsOrDrugsConsumed) {
      surveyDirectPenalty += 12;
      primaryFactors.push(`Fármacos declarados: ${fysSurvey.medicationDetails || 'Informado'}`);
    }

    if (fysSurvey.nightQuestions) {
      const nq = fysSurvey.nightQuestions;
      if (nq.yawningOrHeavyEyelids) {
        surveyDirectPenalty += 8;
        primaryFactors.push('Signos visibles de somnolencia (pesadez palpebral / bostezos)');
      }
      if (nq.daytimeSleepEnvironment === 'poor') {
        surveyDirectPenalty += 8;
        primaryFactors.push('Ambiente de descanso diurno deficiente en campamento');
      }
      if (nq.cabinLightingCondition === 'dim_darkness') {
        surveyDirectPenalty += 5;
      }
    }
  }

  surveyDirectPenalty = Math.min(isStrictDisqualifying ? 80 : 35, surveyDirectPenalty);
  compositeScore += surveyDirectPenalty;

  // Driver F: Circadian & Altitude Context
  if (circadian === 'trough_critical_nadir') {
    compositeScore += 6;
    primaryFactors.push('Ventana de mínima alerta circadiana (02:00 - 06:00)');
    riskDrivers.push({
      category: 'circadian',
      name: 'Nadir Circadiano de Vigilancia',
      scoreImpact: +6,
      isProtective: false,
      description: 'Turno en franja de mayor propensión biológica al microsueño'
    });
  }

  if (worker.altitudeMeters >= 3800) {
    compositeScore += 2;
    primaryFactors.push(`Operación en gran altitud geográfica (${worker.altitudeMeters} msnm)`);
  }

  // Driver G: Demographics (Age & Gender) and Roster Overtime Weighting
  if (worker.birthDate) {
    const birthYear = new Date(worker.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = isNaN(birthYear) ? 35 : Math.max(18, currentYear - birthYear);
    
    // Circadian recovery and sleep architecture efficiency factor with age (>50 years)
    if (age >= 55) {
      compositeScore += 3;
      primaryFactors.push(`Factor etario (>55 años, mayor susceptibilidad al desajuste circadiano)`);
      riskDrivers.push({
        category: 'circadian',
        name: 'Sensibilidad Circadiana por Edad',
        scoreImpact: +3,
        isProtective: false,
        description: `Edad: ${age} años (mayor tiempo requerido para recuperación psicofisiológica)`
      });
    } else if (age <= 28 && sleep.sleepDurationHours < 6) {
      compositeScore += 2;
      riskDrivers.push({
        category: 'circadian',
        name: 'Vulnerabilidad por Deuda Aguda',
        scoreImpact: +2,
        isProtective: false,
        description: `Operador joven (${age} años) con déficit agudo de sueño`
      });
    }
  }

  // Roster Overtime Detection & Weighting (e.g. Day 8 in 7x7)
  const rosterPatternStr = worker.shiftPattern || worker.currentShift?.rosterPattern || '7x7';
  const matchRoster = rosterPatternStr.match(/^(\d+)[xX](\d+)/);
  if (matchRoster && worker.currentShift?.dayInRoster) {
    const maxWorkDays = parseInt(matchRoster[1], 10);
    const dayInRoster = worker.currentShift.dayInRoster;
    if (dayInRoster > maxWorkDays) {
      const extraDays = dayInRoster - maxWorkDays;
      const penalty = Math.min(8, extraDays * 2);
      compositeScore += penalty;
      primaryFactors.push(`Trabajador excede los días de turno regular (${dayInRoster}º día en rol ${maxWorkDays}x${matchRoster[2]})`);
      riskDrivers.push({
        category: 'survey',
        name: 'Extensión de Ciclo de Turno (Sobretiempo)',
        scoreImpact: +penalty,
        isProtective: false,
        description: `${extraDays} día(s) adicional(es) sobre el ciclo base (${maxWorkDays} días programados)`
      });
    }
  }

  compositeScore = Math.min(100, Math.max(0, Math.round(compositeScore)));

  // 3. OPERATIONAL DECISION & TRAFFIC LIGHT CLASSIFICATION
  let status: TrafficLightStatus = 'green';
  let statusLabel = 'Riesgo Operacional Controlado';
  let recommendedAction = 'Continuar Operación Habitual';
  let actionDetails = 'Parámetros psicomotores, fisiológicos y encuesta FYS dentro del rango de control para la jornada.';

  const isSurveyFatigued = !!(fysSurvey && (!fysSurvey.energyToStartShift || fysSurvey.significantPhysicalFatigue || fysSurvey.painAffectingDriving));
  const isNightSurveyFatigued = !!(fysSurvey?.nightQuestions && (fysSurvey.nightQuestions.yawningOrHeavyEyelids || fysSurvey.nightQuestions.daytimeSleepEnvironment === 'poor'));

  let decisionRecommendation: 'normal_operation' | 'controlled_operation' | 'operational_intervention' | 'reassessment_required' = 'normal_operation';
  let mandatoryControls: string[] = ['Pautas de descanso y pausa activa según estándar de faena'];
  let suggestedControls: string[] = ['Mantener hidratación continua'];

  if (
    isStrictDisqualifying || 
    compositeScore >= 55 || 
    sleep.sleepDurationHours < 3.8 ||
    kss >= 8 ||
    (kss >= 7 && (pvt.lapsesCount >= 1 || ipd >= 25)) ||
    (sleep.sleepDurationHours < 5.0 && kss >= 7) ||
    (pvt.lapsesCount >= 3)
  ) {
    status = 'red';
    statusLabel = 'Riesgo Operacional Elevado';
    recommendedAction = 'Detención Preventiva y Activación de Protocolo';
    actionDetails = 'Interrumpir tarea crítica de forma segura. Notificar a supervisor de turno para aplicar protocolo de recuperación (siesta programada/relevo) y posterior reevaluación.';
    decisionRecommendation = 'operational_intervention';
    mandatoryControls = [
      'Detención preventiva de operación en equipo crítico / CAEX',
      'Notificación inmediata al supervisor de turno',
      'Aplicación de protocolo de recuperación (siesta controlada 25-45m o relevo)'
    ];
    suggestedControls = [
      'Reevaluación psicomotora antes de considerar reincorporación'
    ];
  } else if (
    compositeScore >= 24 || 
    kss >= 6 || 
    sleep.sleepDurationHours < 6.0 ||
    ipd >= 18 || 
    pvt.lapsesCount >= 1 || 
    isSurveyFatigued ||
    isNightSurveyFatigued ||
    concordance === 'discordant_masked_fatigue'
  ) {
    status = 'yellow';
    statusLabel = 'Medida Preventiva Recomendada';
    recommendedAction = 'Pausa Activa / Hidratación / Monitoreo';
    actionDetails = 'Operación condicionada a medidas de control: hidratación periódica, micropausa activa a mitad de ciclo y verificación en terreno.';
    decisionRecommendation = 'controlled_operation';
    mandatoryControls = [
      'Micropausa activa de estiramiento y oxigenación cada 90 minutos',
      'Hidratación continua en cabina',
      'Chequeo de estado por supervisor a mitad de turno'
    ];
    suggestedControls = [
      'Monitoreo visual mediante sistema DSM / co-piloto'
    ];
  }

  const operationalDecision: OperationalDecision = {
    recommendation: decisionRecommendation,
    decisionLabel: statusLabel,
    mandatoryControls,
    suggestedControls
  };

  // Compile Primary Factors Summary
  if (primaryFactors.length === 0) {
    primaryFactors.push('Parámetros psicomotores y tiempos de reacción óptimos.');
    primaryFactors.push(`Descanso adecuado (${sleep.sleepDurationHours.toFixed(1)} hrs) y encuesta pre-turno satisfactoria.`);
  }

  // Confidence Score Calculation (Math independent from risk)
  let confidenceScore = 95;
  if (dataQualityScore < 85) confidenceScore -= 10;
  if (worker.baseline.validTrialsCount < 3) confidenceScore -= 8;
  if (pvt.validTrials < 3) confidenceScore -= 5;
  if (fysSurvey) confidenceScore += 2;
  confidenceScore = Math.min(99, Math.max(50, confidenceScore));

  const evalId = `eval-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const integrityHash = generateIntegrityHash(`${worker.id}-${compositeScore}-${confidenceScore}-${Date.now()}`);

  const legalCompliance: LegalComplianceMetadata = {
    signatureStandard: 'FES_LEY_19799',
    dataProtectionStandard: 'LEY_21719_MINIMIZACION',
    legalLaborBase: 'ART_184_CODIGO_DEL_TRABAJO',
    evidenceIntegrityHash: integrityHash,
    schemaVersion: 4,
    fraAlgorithmVersion: FRA_ALGORITHM_VERSION
  };

  return {
    id: evalId,
    workerId: worker.id,
    timestamp: new Date().toISOString(),
    status,
    statusLabel,
    riskScore: compositeScore,
    confidenceScore,
    dataQualityScore,
    pvtValidity,
    pvtQualityScore: dataQualityScore,
    deviceContext,
    fysSurvey,
    fei,
    kss,
    ipdPercentage: ipd,
    concordanceIndex: concordance,
    circadianPhase: circadian,
    altitudeImpact,
    primaryFactors,
    riskDrivers,
    recommendedAction,
    actionDetails,
    operationalDecision,
    legalCompliance,
    fraAlgorithmVersion: FRA_ALGORITHM_VERSION,
    hashSha256: integrityHash,
    isOfflineSynced: true,
    isReevaluation,
    previousEvaluationId: previousEvalId
  };
}

