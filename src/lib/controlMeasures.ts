import { TrafficLightStatus } from '../types';

export interface ControlMeasureItem {
  id: string;
  title: string;
  description: string;
  iconType: 'hydration' | 'ventilation' | 'mobility' | 'monitoring' | 'pause' | 'ergonomics' | 'stoppage' | 'recovery' | 'notification' | 'reevaluation';
}

export interface LevelControlPlan {
  status: TrafficLightStatus;
  title: string;
  subtitle: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  textColor: string;
  measures: ControlMeasureItem[];
}

export const LEVEL_CONTROL_MEASURES: Record<TrafficLightStatus, LevelControlPlan> = {
  green: {
    status: 'green',
    title: 'Nivel Verde: Riesgo Operacional Controlado / Apto',
    subtitle: 'Medidas de mantenimiento psicofisiológico y vigilancia activa durante la jornada',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeText: '🟢 Apto / Controlado',
    badgeBorder: 'border-emerald-200',
    textColor: 'text-emerald-950',
    measures: [
      {
        id: 'g1',
        title: 'Hidratación Continua y Volemia',
        description: 'Ingesta mínima recomendada de 250 ml de agua cada 60–90 min para preservar volemia, oxigenación cerebral y termorregulación en altura geográfica.',
        iconType: 'hydration'
      },
      {
        id: 'g2',
        title: 'Ventilación y Climatización de Cabina / Puesto',
        description: 'Mantener temperatura entre 19°C y 22°C con flujo de aire fresco constante para prevenir somnolencia inducida por hipertermia o acumulación de CO₂.',
        iconType: 'ventilation'
      },
      {
        id: 'g3',
        title: 'Pausas de Movilidad y Estiramientos Ergonómicos',
        description: 'Aprovechar detenciones operacionales programadas, cambios de frente y colación para realizar rotación articular y elongación lumbar/cervical.',
        iconType: 'mobility'
      },
      {
        id: 'g4',
        title: 'Automonitoreo Activo en Ventana Circadiana',
        description: 'Mantener atención en ventanas críticas (03:00–06:00 y post-almuerzo 14:00–16:00). Ante bostezos o pesadez palpebral, reportar de inmediato a supervisión.',
        iconType: 'monitoring'
      }
    ]
  },
  yellow: {
    status: 'yellow',
    title: 'Nivel Amarillo: Medida Preventiva Recomendada / Mitigación en Terreno',
    subtitle: 'Protocolo de control mitigatorio obligatorio para evitar escalamiento a riesgo crítico',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
    badgeText: '🟡 Preventivo / Mitigación',
    badgeBorder: 'border-amber-200',
    textColor: 'text-amber-950',
    measures: [
      {
        id: 'y1',
        title: 'Pausas Activas Programadas en Turno',
        description: 'Ejecutar 2 pausas activas obligatorias de 10 minutos (a las 2h y a las 4h de iniciado el turno) con ejercicios de reactivación motriz y marcha estática.',
        iconType: 'pause'
      },
      {
        id: 'y2',
        title: 'Protocolo de Hidratación Reforzada y Electrolitos',
        description: 'Consumo de agua fría o solución isotónica al inicio del turno y tras pausas para elevar presión de alerta y reactivar la respuesta cardiovascular.',
        iconType: 'hydration'
      },
      {
        id: 'y3',
        title: 'Control Lumínico y Ajuste Ergonómico',
        description: 'En turno de noche, evitar penumbra continua en cabina/puesto en detenciones y verificar soporte lumbar y distancia visual del panel de instrumentos.',
        iconType: 'ergonomics'
      },
      {
        id: 'y4',
        title: 'Prioridad de Monitoreo DSM y Chequeo Radial',
        description: 'Habilitar seguimiento prioritario en telemetría de cabina (cámara DSM) y contacto radial/presencial preventivo por el supervisor a mitad de turno.',
        iconType: 'monitoring'
      }
    ]
  },
  red: {
    status: 'red',
    title: 'Nivel Rojo: Riesgo Operacional Elevado / Detención Preventiva',
    subtitle: 'Protocolo de interrupción inmediata de tareas críticas y recuperación psicofisiológica',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-300',
    badgeText: '🔴 No Apto / Detención Preventiva',
    badgeBorder: 'border-rose-200',
    textColor: 'text-rose-950',
    measures: [
      {
        id: 'r1',
        title: 'Detención Preventiva Inmediata de Equipo Crítico',
        description: 'Suspensión inmediata de la autorización para operar camiones de extracción (CAEX), palas, perforadoras o conducción de vehículos en faena.',
        iconType: 'stoppage'
      },
      {
        id: 'r2',
        title: 'Notificación Operacional HSEC y Despacho',
        description: 'Aviso inmediato a supervisión directa y central de despacho bajo protocolo de confidencialidad, dignidad y respeto (Ley Karin y DS 44).',
        iconType: 'notification'
      },
      {
        id: 'r3',
        title: 'Protocolo de Recuperación Fisiológica (Siesta Táctica)',
        description: 'Derivación a policlínico o sala de descanso para siesta programada de 45 a 90 min en ambiente oscuro/silencioso o reasignación temporal a tareas de bajo riesgo.',
        iconType: 'recovery'
      },
      {
        id: 'r4',
        title: 'Reevaluación Obligatoria Post-Recuperación',
        description: 'Reaplicación del test psicomotor PVT y encuesta abreviada tras 15 min de disipación de inercia del sueño, o relevo definitivo y traslado seguro a campamento.',
        iconType: 'reevaluation'
      }
    ]
  },
  gray: {
    status: 'gray',
    title: 'Nivel No Concluyente / Prueba Inválida',
    subtitle: 'Reintento requerido debido a interferencia o interrupción del test',
    badgeBg: 'bg-slate-50 text-slate-800 border-slate-300',
    badgeText: '⚪ No Concluyente',
    badgeBorder: 'border-slate-200',
    textColor: 'text-slate-950',
    measures: [
      {
        id: 'gr1',
        title: 'Repetición Inmediata del Test Psicomotor',
        description: 'Reiniciar la prueba PVT asegurando un entorno libre de distracciones, con manos atemperadas y buena respuesta táctil en la pantalla.',
        iconType: 'reevaluation'
      }
    ]
  }
};
