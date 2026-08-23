import { WorkerProfile, FRARiskEvaluation, InterventionRecord, AlgorithmVersionLog, WeatherData } from '../types';

export const DEFAULT_SAMPLE_WEATHER: WeatherData = {
  latitude: 0,
  longitude: 0,
  altitudeMeters: 0,
  faenaName: 'Faena Operacional',
  isGpsConnected: false,
  lastUpdated: '',
  forecast: [
    {
      dayLabel: 'Hoy (Día 0)',
      date: new Date().toISOString().split('T')[0],
      tempMinC: 15,
      tempMaxC: 25,
      currentTempC: 20,
      thermalSensationC: 20,
      condition: 'Despejado',
      windSpeedKmh: 10,
      windGustsKmh: 15,
      uvIndex: 5,
      humidityPercent: 40,
      barometricPressureHpa: 1013,
      hypoxiaRiskLevel: 'Baja',
      fatigueWeatherImpactScore: 1
    }
  ]
};

export const DEFAULT_EMPTY_WORKER: WorkerProfile = {
  id: 'w-default',
  rut: '',
  name: '',
  birthDate: '',
  gender: 'Masculino',
  company: '',
  role: '',
  area: '',
  faena: '',
  altitudeMeters: 0,
  equipmentAssigned: '',
  criticality: 1,
  gpsEnabled: false,
  weather: undefined,
  supervisorName: '',
  supervisorEmail: '',
  supervisorRut: '',
  supervisorCode: '',
  shiftPattern: '4x4',
  habitualShiftType: 'day',
  currentShift: {
    type: 'day',
    dayInRoster: 1,
    totalRosterDays: 4,
    shiftStart: '08:00',
    shiftEnd: '20:00',
    rosterPattern: '4x4'
  },
  baseline: {
    meanRT: 0,
    medianRT: 0,
    standardDeviation: 0,
    fastest10Percent: 0,
    lapseThresholdMs: 650,
    validTrialsCount: 0,
    lastUpdated: ''
  },
  chronotype: 'intermediate',
  profileCompleted: false,
  legalConsent: {
    accepted: false,
    timestamp: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedDutyOfDisclosure: false,
    signatureDigital: ''
  }
};

export const MOCK_WORKERS: WorkerProfile[] = [
  DEFAULT_EMPTY_WORKER
];

export const MOCK_EVALUATIONS: FRARiskEvaluation[] = [];

export const MOCK_INTERVENTIONS: InterventionRecord[] = [];

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
    leadScientist: 'Equipo I+D SGFS',
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
    objective: 'Revisión del desempeño del sistema SGFS, análisis del incidente INC-2026-088 y evaluación de descansos en domos presurizados.',
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

