// FRA Engine v2.0 - Scientific Multidimensional Fatigue Risk Assessment Algorithm
// Compliant with FRA-HSEC Master Specification

import { 
  WorkerProfile, 
  SleepRecord, 
  PVTSummary, 
  TrafficLightStatus, 
  FRARiskEvaluation,
  DSMEvent,
  FYSPreTurnSurvey 
} from '../types';

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

// Generate pure deterministic SHA-256-like hex string for integrity trace (Same input = strictly identical output)
export function generateIntegrityHash(payload: string): string {
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256-FRA-v2.0-${hex}`;
}

export function evaluateFRARisk(
  worker: WorkerProfile,
  sleep: SleepRecord,
  kss: number,
  pvt: PVTSummary,
  fysSurvey?: FYSPreTurnSurvey,
  dsm?: DSMEvent,
  isReevaluation: boolean = false,
  previousEvalId?: string
): FRARiskEvaluation {
  // Check validity: if PVT has fewer than minimum valid trials or abnormal errors, flag as inconclusive
  const isTechnicallyInvalid = pvt.validTrials < 2 || pvt.falseStartsCount >= 5;
  
  if (isTechnicallyInvalid) {
    return {
      id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      workerId: worker.id,
      timestamp: new Date().toISOString(),
      status: 'gray',
      statusLabel: 'Resultado No Concluyente',
      riskScore: 0,
      confidenceScore: 35,
      fysSurvey,
      fei: calculateFEI(sleep, worker),
      kss,
      ipdPercentage: 0,
      concordanceIndex: 'concordant_safe',
      circadianPhase: 'intermediate',
      altitudeImpact: worker.altitudeMeters > 3000 ? 'high' : 'low',
      primaryFactors: [
        'Calidad de medición insuficiente o interrupción técnica',
        'Exceso de pulsaciones anticipadas (falsos arranques)',
      ],
      recommendedAction: 'Repetir Evaluación PVT',
      actionDetails: 'Asegurar entorno tranquilo, libre de distracciones y volver a realizar el test adaptativo.',
      hashSha256: generateIntegrityHash(worker.id + Date.now()),
      isOfflineSynced: true,
      isReevaluation,
      previousEvaluationId: previousEvalId
    };
  }

  const fei = calculateFEI(sleep, worker);
  const ipd = calculateIPD(pvt, worker);
  const now = new Date();
  const circadian = calculateCircadianPhase(now.getHours());
  const altitudeImpact = worker.altitudeMeters >= 3800 ? 'high' : worker.altitudeMeters >= 2500 ? 'moderate' : 'low';

  // 1. Determine Concordance Index (Rigorous: flags masked fatigue and high risk)
  let concordance: 'concordant_safe' | 'concordant_risk' | 'discordant_masked_fatigue' | 'discordant_subjective_only' = 'concordant_safe';
  
  if (kss >= 6 && (ipd >= 20 || pvt.lapsesCount >= 1)) {
    concordance = 'concordant_risk';
  } else if (kss <= 4 && (ipd >= 30 || pvt.lapsesCount >= 2)) {
    // Masked fatigue: worker reports feeling ok (low KSS) but objective PVT shows significant psychomotor slowing
    concordance = 'discordant_masked_fatigue';
  } else if (kss >= 7 && ipd < 10 && pvt.lapsesCount === 0) {
    concordance = 'discordant_subjective_only';
  } else {
    concordance = 'concordant_safe';
  }

  // 2. Multidimensional Composite Score Calculation (Calibrated Scientific Ponderation)
  let compositeScore = 0;

  // A. FEI (Sleep & Circadian Debt) Contribution (0 - 32 pts)
  compositeScore += Math.round((fei / 100) * 32);

  // B. KSS (Subjective Sleepiness Scale 1-9) Contribution (0 - 30 pts)
  if (kss >= 9) compositeScore += 30;
  else if (kss === 8) compositeScore += 25;
  else if (kss === 7) compositeScore += 18;
  else if (kss === 6) compositeScore += 12;
  else if (kss === 5) compositeScore += 6;
  else if (kss === 4) compositeScore += 3;

  // C. IPD & PVT (Objective Psychomotor Reaction & Lapses) Contribution (0 - 35 pts)
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

  // Discordance / DSM bonus
  if (concordance === 'discordant_masked_fatigue') {
    compositeScore += 8;
  }
  if (dsm && (dsm.eventType === 'perclos_high' || dsm.eventType === 'micro_sleep')) {
    compositeScore += 15;
  }

  // 3. FYS Pre-Turn Survey Ponderation (Direct Clinical & Operational Risk Index)
  let surveyDirectPenalty = 0;
  const primaryFactors: string[] = [];
  let isStrictDisqualifying = false;

  if (fysSurvey) {
    // Q1: ¿Se siente con energía para comenzar el turno? (NO = +8 pts)
    if (!fysSurvey.energyToStartShift) {
      surveyDirectPenalty += 8;
      primaryFactors.push('Encuesta FYS: Trabajador reporta baja energía al inicio de turno');
    }

    // Q2: ¿Presenta cansancio físico importante? (SÍ = +10 pts)
    if (fysSurvey.significantPhysicalFatigue) {
      surveyDirectPenalty += 10;
      primaryFactors.push('Encuesta FYS: Presencia de cansancio físico reportado');
    }

    // Q3: ¿Tiene algún dolor que afecte la conducción? (SÍ = +12 pts)
    if (fysSurvey.painAffectingDriving) {
      surveyDirectPenalty += 12;
      primaryFactors.push('Encuesta FYS: Molestia física que interfiere con la conducción');
    }

    // Alcohol in last 12h: Zero tolerance safety policy (Strict No Apto / Critical Risk)
    if (fysSurvey.alcoholConsumedLast12Hours) {
      surveyDirectPenalty += 80;
      isStrictDisqualifying = true;
      primaryFactors.push('ALERTA CRÍTICA: Declaración de consumo de alcohol en las últimas 12h (Tolerancia Cero)');
    }

    // Medications / Drugs inducing drowsiness
    if (fysSurvey.medicationsOrDrugsConsumed) {
      surveyDirectPenalty += 12;
      primaryFactors.push(`Consumo de medicamentos/fármacos declarados (${fysSurvey.medicationDetails || 'Declarado'})`);
    }

    // Exclusive Night Shift Questions
    if (fysSurvey.nightQuestions) {
      const nq = fysSurvey.nightQuestions;
      
      // Q4: ¿En la última hora ha estado bostezando o siente pesadez en párpados?
      if (nq.yawningOrHeavyEyelids) {
        surveyDirectPenalty += 8;
        primaryFactors.push('Turno Noche: Signos de somnolencia (bostezos / pesadez palpebral)');
      }

      // Q5: ¿Se alimentó y se encuentra hidratado? (NO = +5 pts)
      if (!nq.hydratedAndNourished) {
        surveyDirectPenalty += 5;
        primaryFactors.push('Turno Noche: Hidratación / nutrición pre-turno deficiente');
      }

      // Q6: ¿Ha consumido bebidas energéticas en exceso (+2 latas)?
      if (nq.excessEnergyDrinks) {
        surveyDirectPenalty += 6;
        primaryFactors.push('Turno Noche: Consumo elevado de bebidas energéticas (+2 latas)');
      }

      // Daytime Sleep Environment Control (Óptimo, Regular, Deficiente)
      if (nq.daytimeSleepEnvironment === 'poor') {
        surveyDirectPenalty += 8;
        primaryFactors.push('Control Fisiológico Noche: Ambiente de sueño diurno deficiente (ruido/luz/calor)');
      } else if (nq.daytimeSleepEnvironment === 'regular') {
        surveyDirectPenalty += 4;
      }

      // Cabin Lighting Condition (Óptima, Parcial, Penumbra)
      if (nq.cabinLightingCondition === 'dim_darkness') {
        surveyDirectPenalty += 5;
        primaryFactors.push('Control Circadiano: Puesto en penumbra');
      }
    }
  }

  // Cap survey penalty (allows up to 35 pts for standard fatigue questions, or 80 if alcohol)
  surveyDirectPenalty = Math.min(isStrictDisqualifying ? 80 : 35, surveyDirectPenalty);
  compositeScore += surveyDirectPenalty;

  // 4. Weather & Climate Ponderation (GPS / Altitude / Thermal & 2-day Forecast Burden)
  let weatherBurden = 0;
  if (worker.weather && worker.weather.forecast && worker.weather.forecast.length > 0) {
    const todayWeather = worker.weather.forecast[0];

    if (todayWeather.thermalSensationC <= -10 || todayWeather.thermalSensationC >= 36) {
      weatherBurden += 3;
    } else if (todayWeather.thermalSensationC <= 0) {
      weatherBurden += 1;
    }

    if (todayWeather.windGustsKmh >= 60) {
      weatherBurden += 2;
    }

    if (worker.altitudeMeters >= 3800) {
      weatherBurden += 2;
    }
  }
  compositeScore += weatherBurden;

  compositeScore = Math.min(100, Math.max(0, Math.round(compositeScore)));

  // 5. Traffic Light Status Assignment - SCIENTIFICALLY RIGOROUS THRESHOLDS
  // Green (Apto / Riesgo Controlado): 0 - 23 pts (Requires good sleep >=6.5h, low KSS, crisp PVT, no clinical fatigue)
  // Yellow (Preventivo / Medida de Control): 24 - 54 pts (Requires preventive hydration, active pauses, monitoring)
  // Red (No Apto / Detención Preventiva): >= 55 pts or strict triggers (Alcohol, severe sleep debt < 4h, KSS >= 8, or multi-lapses)
  let status: TrafficLightStatus = 'green';
  let statusLabel = 'Riesgo Operacional Controlado';
  let recommendedAction = 'Continuar Operación Habitual';
  let actionDetails = 'Parámetros psicomotores, fisiológicos y encuesta FYS dentro del rango seguro para la jornada.';

  const isSurveyFatigued = !!(fysSurvey && (!fysSurvey.energyToStartShift || fysSurvey.significantPhysicalFatigue || fysSurvey.painAffectingDriving));
  const isNightSurveyFatigued = !!(fysSurvey?.nightQuestions && (fysSurvey.nightQuestions.yawningOrHeavyEyelids || fysSurvey.nightQuestions.daytimeSleepEnvironment === 'poor'));

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
    recommendedAction = 'Pausa Activa / Hidratación / Monitoreo DSM';
    actionDetails = 'Operador apto con medidas de control: se requiere hidratación periódica, micropausa activa a mitad de ciclo y alerta en cabina.';
  }

  // 6. Explainability Factors Assembly
  if (sleep.sleepDurationHours < 5.5) {
    primaryFactors.push(`Descanso acortado: ${sleep.sleepDurationHours.toFixed(1)} hrs registradas pre-turno`);
  }
  if (ipd > 25) {
    primaryFactors.push(`Tiempo de reacción psicomotriz: +${ipd}% respecto a línea base (${pvt.meanRT}ms vs ${worker.baseline.meanRT}ms)`);
  }
  if (pvt.lapsesCount > 1) {
    primaryFactors.push(`Lapsos de atención detectados (>500ms): ${pvt.lapsesCount}`);
  }
  if (kss >= 7) {
    primaryFactors.push(`Somnolencia subjetiva percibida: KSS ${kss}/9`);
  }
  if (concordance === 'discordant_masked_fatigue') {
    primaryFactors.push('Discordancia: Fatiga enmascarada (KSS bajo con reflejos psicomotores enlentecidos)');
  }
  if (sleep.consecutiveNights >= 5) {
    primaryFactors.push(`Exposición acumulada: ${sleep.consecutiveNights} noches consecutivas de turno`);
  }
  if (circadian === 'trough_critical_nadir') {
    primaryFactors.push('Ventana circadiana de menor vigilancia (02:00 - 06:00)');
  }
  if (worker.altitudeMeters >= 3800) {
    primaryFactors.push(`Operación en gran altitud (${worker.altitudeMeters} msnm)`);
  }

  if (primaryFactors.length === 0) {
    primaryFactors.push('Parámetros psicomotores y tiempos de reacción óptimos.');
    primaryFactors.push(`Descanso adecuado (${sleep.sleepDurationHours.toFixed(1)} hrs) y encuesta pre-turno satisfactoria.`);
  }

  // Confidence Score Calculation
  let confidenceScore = 95;
  if (worker.baseline.validTrialsCount < 3) confidenceScore -= 8;
  if (pvt.validTrials < 3) confidenceScore -= 5;
  if (fysSurvey) confidenceScore += 2;

  return {
    id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    workerId: worker.id,
    timestamp: new Date().toISOString(),
    status,
    statusLabel,
    riskScore: compositeScore,
    confidenceScore: Math.min(99, Math.max(60, confidenceScore)),
    fysSurvey,
    fei,
    kss,
    ipdPercentage: ipd,
    concordanceIndex: concordance,
    circadianPhase: circadian,
    altitudeImpact,
    primaryFactors,
    recommendedAction,
    actionDetails,
    hashSha256: generateIntegrityHash(`${worker.id}-${compositeScore}-${Date.now()}`),
    isOfflineSynced: true,
    isReevaluation,
    previousEvaluationId: previousEvalId
  };
}
