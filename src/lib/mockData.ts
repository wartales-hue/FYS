import { WorkerProfile, FRARiskEvaluation, InterventionRecord, StopBangRecord, AlgorithmVersionLog, WeatherData } from '../types';

export const DEFAULT_SAMPLE_WEATHER: WeatherData = {
  latitude: -23.8647,
  longitude: -69.0438,
  altitudeMeters: 1240,
  faenaName: 'Faena Barreal Seco (1.240 msnm)',
  isGpsConnected: true,
  lastUpdated: '14-Ago-2026 11:30',
  forecast: [
    {
      dayLabel: 'Hoy (Día 0)',
      date: '2026-08-14',
      tempMinC: 14,
      tempMaxC: 25,
      currentTempC: 21,
      thermalSensationC: 20,
      condition: 'Despejado / Templado',
      windSpeedKmh: 14,
      windGustsKmh: 22,
      uvIndex: 7,
      humidityPercent: 38,
      barometricPressureHpa: 895,
      hypoxiaRiskLevel: 'Baja',
      fatigueWeatherImpactScore: 2
    },
    {
      dayLabel: 'Mañana (+1 Día)',
      date: '2026-08-15',
      tempMinC: 13,
      tempMaxC: 26,
      currentTempC: 22,
      thermalSensationC: 21,
      condition: 'Despejado',
      windSpeedKmh: 12,
      windGustsKmh: 18,
      uvIndex: 7,
      humidityPercent: 35,
      barometricPressureHpa: 896,
      hypoxiaRiskLevel: 'Baja',
      fatigueWeatherImpactScore: 2
    },
    {
      dayLabel: 'Pasado Mañana (+2 Días)',
      date: '2026-08-16',
      tempMinC: 15,
      tempMaxC: 27,
      currentTempC: 23,
      thermalSensationC: 22,
      condition: 'Despejado',
      windSpeedKmh: 15,
      windGustsKmh: 24,
      uvIndex: 8,
      humidityPercent: 32,
      barometricPressureHpa: 894,
      hypoxiaRiskLevel: 'Baja',
      fatigueWeatherImpactScore: 2
    }
  ]
};

export const MOCK_WORKERS: WorkerProfile[] = [
  {
    id: 'w-101',
    rut: '14.892.415-3',
    name: 'Alejandro Morales',
    birthDate: '1982-04-18',
    gender: 'Masculino',
    company: 'Minera Los Andes',
    role: 'Operador CAEX Komatsu 930E',
    area: 'Mina Rajo Abierto',
    faena: 'Faena Cordillera Sur',
    altitudeMeters: 3800,
    equipmentAssigned: 'CAEX #42',
    criticality: 4,
    gpsEnabled: true,
    gpsCoordinates: { latitude: -23.8647, longitude: -69.0438 },
    weather: DEFAULT_SAMPLE_WEATHER,
    supervisorName: 'Carlos Henríquez',
    supervisorEmail: 'supervisor.faena@minera.cl',
    currentShift: {
      type: 'night',
      dayInRoster: 5,
      totalRosterDays: 7,
      shiftStart: '19:00',
      shiftEnd: '07:00',
      rosterPattern: '7x7 Continuo (Noche)'
    },
    baseline: {
      meanRT: 420,
      medianRT: 405,
      standardDeviation: 35,
      fastest10Percent: 360,
      lapseThresholdMs: 650,
      validTrialsCount: 42,
      lastUpdated: '2026-08-10'
    },
    chronotype: 'intermediate'
  },
  {
    id: 'w-102',
    rut: '16.320.187-K',
    name: 'Camila Valenzuela',
    birthDate: '1987-11-03',
    gender: 'Femenino',
    company: 'Consorcio Minero Norte',
    role: 'Operadora Pala Hidráulica CAT 6060',
    area: 'Carguío y Transporte',
    faena: 'Faena Altiplano',
    altitudeMeters: 4100,
    equipmentAssigned: 'Pala #08',
    criticality: 3,
    gpsEnabled: true,
    gpsCoordinates: { latitude: -21.4521, longitude: -68.8920 },
    weather: {
      ...DEFAULT_SAMPLE_WEATHER,
      altitudeMeters: 4100,
      faenaName: 'Faena Altiplano (4.100 msnm)'
    },
    supervisorName: 'Rodrigo Araya',
    supervisorEmail: 'supervisor.mina@consorcio.cl',
    currentShift: {
      type: 'day',
      dayInRoster: 2,
      totalRosterDays: 7,
      shiftStart: '07:00',
      shiftEnd: '19:00',
      rosterPattern: '7x7 Continuo (Día)'
    },
    baseline: {
      meanRT: 410,
      medianRT: 398,
      standardDeviation: 30,
      fastest10Percent: 350,
      lapseThresholdMs: 650,
      validTrialsCount: 56,
      lastUpdated: '2026-08-12'
    },
    chronotype: 'morning'
  },
  {
    id: 'w-103',
    rut: '13.441.902-8',
    name: 'Rodrigo Castro P.',
    birthDate: '1979-08-25',
    gender: 'Masculino',
    company: 'Transportes Cordillera S.A.',
    role: 'Conductor Bus Transporte Personal',
    area: 'Logística y Transporte',
    faena: 'Faena Valle Central',
    altitudeMeters: 1800,
    equipmentAssigned: 'Bus Scania K440 #14',
    criticality: 4,
    gpsEnabled: true,
    weather: DEFAULT_SAMPLE_WEATHER,
    currentShift: {
      type: 'night',
      dayInRoster: 6,
      totalRosterDays: 7,
      shiftStart: '20:00',
      shiftEnd: '06:00',
      rosterPattern: '7x7 Continuo (Noche)'
    },
    baseline: {
      meanRT: 430,
      medianRT: 418,
      standardDeviation: 32,
      fastest10Percent: 370,
      lapseThresholdMs: 650,
      validTrialsCount: 38,
      lastUpdated: '2026-08-08'
    },
    chronotype: 'evening'
  },
  {
    id: 'w-104',
    rut: '17.112.584-2',
    name: 'Marcela Soto I.',
    birthDate: '1991-01-14',
    gender: 'Femenino',
    company: 'Perforaciones y Tronadura',
    role: 'Operadora Perforadora Pit Viper 351',
    area: 'Perforación y Tronadura',
    faena: 'Faena Cordillera Sur',
    altitudeMeters: 3800,
    equipmentAssigned: 'PV-351 #03',
    criticality: 3,
    gpsEnabled: true,
    weather: DEFAULT_SAMPLE_WEATHER,
    currentShift: {
      type: 'night',
      dayInRoster: 3,
      totalRosterDays: 7,
      shiftStart: '19:00',
      shiftEnd: '07:00',
      rosterPattern: '7x7 Continuo (Noche)'
    },
    baseline: {
      meanRT: 415,
      medianRT: 405,
      standardDeviation: 28,
      fastest10Percent: 360,
      lapseThresholdMs: 650,
      validTrialsCount: 30,
      lastUpdated: '2026-08-11'
    },
    chronotype: 'intermediate'
  },
  {
    id: 'w-105',
    rut: '15.789.201-4',
    name: 'Gonzalo Díaz E.',
    birthDate: '1984-10-30',
    gender: 'Masculino',
    company: 'Mantenimiento Industrial',
    role: 'Técnico Mecánico Chancador',
    area: 'Planta Concentradora',
    faena: 'Faena Valle Central',
    altitudeMeters: 1800,
    equipmentAssigned: 'Chancador Primario #02',
    criticality: 2,
    gpsEnabled: true,
    weather: DEFAULT_SAMPLE_WEATHER,
    currentShift: {
      type: 'day',
      dayInRoster: 4,
      totalRosterDays: 5,
      shiftStart: '08:00',
      shiftEnd: '17:00',
      rosterPattern: '5x2 Administrativo'
    },
    baseline: {
      meanRT: 425,
      medianRT: 412,
      standardDeviation: 30,
      fastest10Percent: 365,
      lapseThresholdMs: 650,
      validTrialsCount: 24,
      lastUpdated: '2026-08-05'
    },
    chronotype: 'morning'
  }
];

export const MOCK_EVALUATIONS: FRARiskEvaluation[] = [
  {
    id: 'eval-prev-001',
    workerId: 'w-101',
    timestamp: '2026-08-13T06:45:00.000Z',
    status: 'green',
    statusLabel: 'Riesgo Operacional Controlado',
    riskScore: 22,
    confidenceScore: 94,
    fei: 24,
    kss: 3,
    ipdPercentage: 3.2,
    concordanceIndex: 'concordant_safe',
    circadianPhase: 'intermediate',
    altitudeImpact: 'high',
    primaryFactors: [
      'Sueño adecuado (7.2 hrs) con alta calidad percibida',
      'Tiempo de reacción dentro del rango histórico de línea base'
    ],
    recommendedAction: 'Continuar Operación Habitual',
    actionDetails: 'Parámetros psicomotores y de descanso óptimos.',
    hashSha256: 'sha256-FRA-v2.0-89af41cd-69c3',
    isOfflineSynced: true,
    isReevaluation: false
  },
  {
    id: 'eval-prev-002',
    workerId: 'w-103',
    timestamp: '2026-08-13T04:15:00.000Z',
    status: 'red',
    statusLabel: 'Riesgo Operacional Elevado',
    riskScore: 78,
    confidenceScore: 92,
    fei: 82,
    kss: 7,
    ipdPercentage: 24.5,
    concordanceIndex: 'concordant_risk',
    circadianPhase: 'trough_critical_nadir',
    altitudeImpact: 'low',
    primaryFactors: [
      'Sueño acortado: 4.5 hrs registradas en día 6 de noche',
      'Tiempo de reacción: +24.5% sobre línea base (314ms vs 252ms)',
      '2 lapsos psicomotores detectados (>500ms)',
      'Ventana circadiana crítica de mínima alerta (04:15 hrs)'
    ],
    recommendedAction: 'Detención Preventiva y Activación de Protocolo',
    actionDetails: 'Estacionar bus en zona segura. Notificar a supervisor de logística para relevo y pausa de recuperación.',
    hashSha256: 'sha256-FRA-v2.0-bc41a98e-41a0',
    isOfflineSynced: true,
    isReevaluation: false
  },
  {
    id: 'eval-prev-003',
    workerId: 'w-104',
    timestamp: '2026-08-13T03:30:00.000Z',
    status: 'yellow',
    statusLabel: 'Medida Preventiva Recomendada',
    riskScore: 48,
    confidenceScore: 90,
    fei: 52,
    kss: 4,
    ipdPercentage: 17.8,
    concordanceIndex: 'discordant_masked_fatigue',
    circadianPhase: 'trough_critical_nadir',
    altitudeImpact: 'high',
    primaryFactors: [
      'Discordancia detectada: KSS bajo (4/9) pero PVT ralentizado (+17.8%)',
      '3800 msnm con 3 noches consecutivas de turno',
      '1 lapso de atención registrado'
    ],
    recommendedAction: 'Pausa Activa 15 min + Hidratación + Reevaluación',
    actionDetails: 'Realizar ejercicio de estiramiento en cabina, hidratación y repetir Micro-PVT antes de la siguiente fase de perforación.',
    hashSha256: 'sha256-FRA-v2.0-7dae201b-90f1',
    isOfflineSynced: true,
    isReevaluation: false
  }
];

export const MOCK_INTERVENTIONS: InterventionRecord[] = [
  {
    id: 'int-001',
    workerId: 'w-103',
    evaluationId: 'eval-prev-002',
    supervisorId: 'sup-carlos',
    timestamp: '2026-08-13T04:20:00.000Z',
    interventionType: 'temporary_relief',
    customNotes: 'Conductor relevado por chofer de retén en terminal mina. Asignado a reposo en domo descanso.',
    status: 'in_progress',
    recoveryOutcome: undefined
  },
  {
    id: 'int-002',
    workerId: 'w-104',
    evaluationId: 'eval-prev-003',
    supervisorId: 'sup-carlos',
    timestamp: '2026-08-13T03:35:00.000Z',
    interventionType: 'active_break_15m',
    customNotes: 'Pausa activa de 15 minutos en caseta de perforación, consumo de agua fría y colación liviana.',
    status: 'completed',
    recoveryOutcome: 'recovered_green',
    completedAt: '2026-08-13T03:52:00.000Z'
  }
];

export const MOCK_STOP_BANG: StopBangRecord[] = [
  {
    id: 'sb-001',
    workerId: 'w-101',
    date: '2026-05-14',
    snoring: true,
    tiredness: true,
    observedApnea: false,
    highBloodPressure: true,
    bmiOver35: false,
    ageOver50: true,
    neckCircumferenceOver40cm: true,
    genderMale: true,
    totalScore: 6,
    riskCategory: 'high',
    medicalRecommendation: 'Derivación preventiva a Poligrafía / Polisomnografía ambulatoria en policlínico faena.',
    referredToSleepStudy: true,
    doctorNotes: 'Paciente asintomático en turno diurno, pero con ronquidos intensos reportados en campamento. Mantener seguimiento preventivo sin suspensión laboral.'
  },
  {
    id: 'sb-002',
    workerId: 'w-102',
    date: '2026-06-20',
    snoring: false,
    tiredness: false,
    observedApnea: false,
    highBloodPressure: false,
    bmiOver35: false,
    ageOver50: false,
    neckCircumferenceOver40cm: false,
    genderMale: false,
    totalScore: 0,
    riskCategory: 'low',
    medicalRecommendation: 'Control anual de salud ocupacional habitual.',
    referredToSleepStudy: false
  }
];

export const MOCK_ALGORITHM_LOGS: AlgorithmVersionLog[] = [
  {
    version: 'v2.0 (Producción Actual)',
    releaseDate: '2026-08-01',
    leadScientist: 'Dr. Fernando Larenas / Neurofisiología Aplicada HSEC',
    approvalCommittee: 'Comité Científico Multidisciplinario FRA-HSEC',
    changesSummary: 'Eliminación definitiva de multiplicadores arbitrarios de RT. Incorporación del modelo de desempeño esperado, FEI multidimensional, Índice de Concordancia KSS/PVT, y motor de explicabilidad.',
    validationMetrics: {
      sensitivity: 0.93,
      specificity: 0.91,
      aucRoc: 0.96,
      falsePositiveRate: 0.07,
      falseNegativeRate: 0.04
    }
  },
  {
    version: 'v1.4 (Legacy)',
    releaseDate: '2025-11-15',
    leadScientist: 'Equipo I+D FRMS',
    approvalCommittee: 'Dirección Médica Ocupacional',
    changesSummary: 'Calibración de latencia táctil en pantallas OLED/LCD industriales. Primer prototipo de PVT adaptativo en 60s.',
    validationMetrics: {
      sensitivity: 0.84,
      specificity: 0.81,
      aucRoc: 0.88,
      falsePositiveRate: 0.14,
      falseNegativeRate: 0.09
    }
  }
];

import { MeetingSession } from '../types';

export const MOCK_MEETINGS: MeetingSession[] = [
  {
    id: 'meet-001',
    code: 'ACTA-2026-0813-T1',
    title: 'Reunión de Inicio de Turno, Diálogo de Seguridad & Control de Fatiga',
    meetingType: 'shift_start',
    date: '2026-08-13',
    startTime: '06:45',
    endTime: '07:15',
    location: 'Sala de Despacho & Capacitación Mina Rajo Sur (Faena Cordillera)',
    facilitatorName: 'Ing. Carlos Mendoza Rivera',
    facilitatorRole: 'Jefe General de Turno HSEC & Operaciones',
    facilitatorRut: '11.458.920-4',
    faena: 'Faena Cordillera Sur (3.800 msnm)',
    altitudeMeters: 3800,
    objective: 'Revisión obligatoria pre-operacional de condiciones de rampa, riesgos críticos, acreditación de aptitud psicomotora pre-turno, compromiso con pausas biológicas y registro formal de asistencia.',
    topics: [
      {
        id: 'top-1',
        title: '1. Condición de Pistas y Rampa Botadero Norte',
        description: 'Presencia de escarcha matinal en cota 3.600. Límite de velocidad reducido a 25 km/h con distancia de seguimiento de 50 metros entre CAEX.',
        category: 'safety_talk',
        durationMinutes: 10
      },
      {
        id: 'top-2',
        title: '2. Protocolo de Fatiga en Altura y Nadir Circadiano',
        description: 'Obligatoriedad del auto-reporte KSS y test PVT. Programación de pausas activas escalonadas entre 03:00 y 05:00 hrs.',
        category: 'fatigue_management',
        durationMinutes: 12
      },
      {
        id: 'top-3',
        title: '3. Chequeo Pre-Uso de Telemetría DSM en Cabinas',
        description: 'Verificación de lente limpia y calibración de FaceMesh de cámara de cabina antes del inicio de marcha.',
        category: 'operational_coordination',
        durationMinutes: 8
      }
    ],
    commitments: [
      {
        id: 'com-1',
        topic: 'Salado de rampa cota 3.600',
        responsibleName: 'Javier Castillo',
        responsibleRole: 'Supervisor Caminos y Movimiento de Tierras',
        deadline: '07:30 hrs',
        status: 'in_progress'
      },
      {
        id: 'com-2',
        topic: 'Pausa activa y siesta asistida para Noche 5 en CAEX #42',
        responsibleName: 'Carlos Mendoza',
        responsibleRole: 'Jefe HSEC',
        deadline: '03:30 hrs',
        status: 'pending'
      },
      {
        id: 'com-3',
        topic: 'Reemplazo de sensor de cabina en Perforadora #04',
        responsibleName: 'Mantenimiento Eléctrico',
        responsibleRole: 'Turno Mantención',
        deadline: '12:00 hrs',
        status: 'completed'
      }
    ],
    attendees: [
      {
        workerId: 'w-101',
        name: 'Alejandro Morales',
        rut: '14.892.415-3',
        role: 'Operador CAEX Komatsu 930E',
        company: 'Minera Los Andes',
        equipmentAssigned: 'CAEX #42',
        status: 'with_prevention_measure',
        checkInTime: '06:48:22',
        digitalSignature: 'VERIFIED_SIG_AM_930E_882',
        signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        fatigueStatus: 'yellow',
        kssScore: 5,
        pvtReactionTimeMs: 278,
        notes: 'Noche 5 de 7 en faena. Se programa pausa activa y siesta controlada de 25 min.',
        signedInPerson: true
      },
      {
        workerId: 'w-102',
        name: 'Camila Valenzuela',
        rut: '16.320.187-K',
        role: 'Operadora Pala Hidráulica CAT 6060',
        company: 'Consorcio Minero Norte',
        equipmentAssigned: 'Pala #08',
        status: 'present',
        checkInTime: '06:46:05',
        digitalSignature: 'VERIFIED_SIG_CV_6060_104',
        signatureHash: '7d4a51e604f10002f4f4942b0cd2cff0d226a27e7d697e0344d188049ad5f231',
        fatigueStatus: 'green',
        kssScore: 2,
        pvtReactionTimeMs: 220,
        notes: 'Apta sin observaciones. Turno Día 2 de 7.',
        signedInPerson: true
      },
      {
        workerId: 'w-103',
        name: 'Rodrigo Fuentes',
        rut: '13.744.902-8',
        role: 'Operador Perforadora Sandvik DR460',
        company: 'Minera Los Andes',
        equipmentAssigned: 'Perforadora #04',
        status: 'present',
        checkInTime: '06:50:11',
        digitalSignature: 'VERIFIED_SIG_RF_DR460_319',
        signatureHash: '1a729e9bc119b48c0840b2f939e99a80e0ee74b2195f2d6588ecbe27b68a6234',
        fatigueStatus: 'green',
        kssScore: 3,
        pvtReactionTimeMs: 236,
        notes: 'Apto para frente de perforación banco 24.',
        signedInPerson: true
      },
      {
        workerId: 'w-104',
        name: 'Patricia Espinoza',
        rut: '17.651.839-2',
        role: 'Conductora Bus Interurbano Personal',
        company: 'Transportes Cordillera S.A.',
        equipmentAssigned: 'Bus Scania #12',
        status: 'present',
        checkInTime: '06:44:50',
        digitalSignature: 'VERIFIED_SIG_PE_BUS_902',
        signatureHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        fatigueStatus: 'green',
        kssScore: 2,
        pvtReactionTimeMs: 218,
        notes: 'Apta para traslado de cambio de turno.',
        signedInPerson: true
      },
      {
        workerId: 'w-105',
        name: 'Gonzalo Tapia',
        rut: '15.204.811-1',
        role: 'Operador Bulldozer Cat D11T',
        company: 'Minera Los Andes',
        equipmentAssigned: 'Bulldozer D11 #02',
        status: 'present',
        checkInTime: '06:49:33',
        digitalSignature: 'VERIFIED_SIG_GT_D11_401',
        signatureHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        fatigueStatus: 'green',
        kssScore: 3,
        pvtReactionTimeMs: 234,
        notes: 'Trabajos de mantenimiento en pretiles de botadero.',
        signedInPerson: true
      },
      {
        workerId: 'w-106',
        name: 'Marcela Contreras',
        rut: '18.112.934-6',
        role: 'Ingeniera de Geotecnia & Monitoreo Radar',
        company: 'Minera Los Andes',
        equipmentAssigned: 'Estación Radar Slope 01',
        status: 'present',
        checkInTime: '06:43:18',
        digitalSignature: 'VERIFIED_SIG_MC_RAD_552',
        signatureHash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
        fatigueStatus: 'green',
        kssScore: 2,
        pvtReactionTimeMs: 215,
        notes: 'Monitoreo de deformaciones en pared oeste.',
        signedInPerson: true
      }
    ],
    status: 'in_progress'
  },
  {
    id: 'meet-002',
    code: 'ACTA-2026-0812-CPHS',
    title: 'Sesión Ordinaria Comité Paritario de Higiene y Seguridad (CPHS)',
    meetingType: 'paritary_committee',
    date: '2026-08-12',
    startTime: '15:00',
    endTime: '16:30',
    location: 'Sala de Directorio HSEC - Campamento Principal',
    facilitatorName: 'Dr. Fernando Larenas / Prev. Riesgos Andrea Morales',
    facilitatorRole: 'Presidente CPHS / Especialista HSEC',
    facilitatorRut: '10.832.190-7',
    faena: 'Faena Cordillera Sur',
    altitudeMeters: 3800,
    objective: 'Revisión del desempeño del sistema FRMS, análisis del incidente INC-2026-088 y evaluación de descansos en domos presurizados.',
    topics: [
      {
        id: 'top-201',
        title: '1. Análisis Forense Caso INC-2026-088 (Pretil CAEX #42)',
        description: 'Reconstrucción de fatiga en noche 6 y validación de la eficacia del protocolo de relevo.',
        category: 'hsec_policy',
        durationMinutes: 40
      },
      {
        id: 'top-202',
        title: '2. Auditoría Ley 21.719 de Protección de Datos',
        description: 'Verificación de la segregación de datos médicos (STOP-BANG) y no punibilidad.',
        category: 'hsec_policy',
        durationMinutes: 30
      }
    ],
    commitments: [
      {
        id: 'com-201',
        topic: 'Ajuste de paradas de flota a las 03:30 hrs en nadir circadiano',
        responsibleName: 'Carlos Mendoza',
        responsibleRole: 'Superintendencia Mina',
        deadline: '14-Agosto-2026',
        status: 'in_progress'
      }
    ],
    attendees: [
      {
        workerId: 'w-101',
        name: 'Alejandro Morales',
        rut: '14.892.415-3',
        role: 'Representante de los Trabajadores (Operador CAEX)',
        company: 'Minera Los Andes',
        equipmentAssigned: 'CAEX #42',
        status: 'present',
        checkInTime: '15:02:10',
        digitalSignature: 'VERIFIED_CPHS_AM_930E',
        signatureHash: '9f83c60517b4d07f5b392c9a227e9d83c1e6973a0c56b3e931328b52f5d6380a',
        fatigueStatus: 'green',
        signedInPerson: true
      },
      {
        workerId: 'w-102',
        name: 'Camila Valenzuela',
        rut: '16.320.187-K',
        role: 'Representante de los Trabajadores (Operadora Pala)',
        company: 'Consorcio Minero Norte',
        equipmentAssigned: 'Pala #08',
        status: 'present',
        checkInTime: '14:58:30',
        digitalSignature: 'VERIFIED_CPHS_CV_6060',
        signatureHash: '4355a46b19d348dc2f57c046f8ef63d4538ebb936000f3c9ee954a27460dd865',
        fatigueStatus: 'green',
        signedInPerson: true
      }
    ],
    status: 'closed'
  }
];

