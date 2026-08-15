import React from 'react';
import { 
  HeartHandshake, 
  Moon, 
  Sun, 
  AlertTriangle, 
  Pill, 
  Wine, 
  Coffee, 
  Compass, 
  Mountain, 
  CloudSun, 
  Wind, 
  Droplets, 
  HelpCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';
import { WorkerProfile, FYSPreTurnSurvey } from '../../types';

interface FYSPreTurnSurveyProps {
  worker?: WorkerProfile;
  survey: FYSPreTurnSurvey;
  onChange: (updated: FYSPreTurnSurvey) => void;
  shiftType?: 'day' | 'night';
  weather?: WorkerProfile['weather'];
  disabled?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

export const FYSPreTurnSurveyComponent: React.FC<FYSPreTurnSurveyProps> = ({
  worker,
  survey,
  onChange,
  shiftType,
  weather: weatherProp,
  disabled = false,
  onNext,
  onBack,
}) => {
  const isNightShift = shiftType ? shiftType === 'night' : (worker?.currentShift?.type === 'night');
  const currentWeather = weatherProp?.forecast?.[0] || worker?.weather?.forecast?.[0];
  const tomorrowWeather = weatherProp?.forecast?.[1] || worker?.weather?.forecast?.[1];
  const altitude = worker?.altitudeMeters || 3450;
  const faena = worker?.faena || 'Faena Minera';

  const updateGeneral = (field: keyof FYSPreTurnSurvey, val: any) => {
    onChange({
      ...survey,
      [field]: val
    });
  };

  const updateNight = (field: string, val: any) => {
    onChange({
      ...survey,
      nightQuestions: {
        yawningOrHeavyEyelids: false,
        hydratedAndNourished: true,
        excessEnergyDrinks: false,
        daytimeSleepEnvironment: 'optimal',
        cabinLightingCondition: 'optimal',
        ...survey.nightQuestions,
        [field]: val
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
              Encuesta Pre-Turno FYS
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Ponderación directa en IIRF (0-100 pts)
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Test de Fatiga y Somnolencia (FYS) - Pre-Turno
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Declaración psicofisiológica y factores de aptitud operacional inmediata ({isNightShift ? 'Turno Noche' : 'Turno Día'}).
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
          <HeartHandshake className="w-6 h-6" />
        </div>
      </div>

      {/* Visible Weather & Altitude GPS Context Card (Mandatory Requirement) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-100">
              Condición Climática & Altitud GPS Ponderada
            </span>
          </div>
          <span className="text-[10px] bg-slate-700/80 text-amber-300 px-2 py-0.5 rounded-md border border-slate-600 font-mono">
            {altitude} msnm • {faena}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-medium">Temp. & Sensación</span>
            <span className="font-bold text-amber-300">
              {currentWeather ? `${currentWeather.currentTempC}°C (ST: ${currentWeather.thermalSensationC}°C)` : '5.5°C'}
            </span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-medium">Viento y Ráfagas</span>
            <span className="font-bold text-slate-200">
              {currentWeather ? `${currentWeather.windSpeedKmh} km/h (R: ${currentWeather.windGustsKmh})` : '28 km/h'}
            </span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-medium">Condición Actual</span>
            <span className="font-semibold text-slate-200 truncate block">
              {currentWeather ? currentWeather.condition : 'Despejado Cordillera'}
            </span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-medium">Pronóstico a 2 Días</span>
            <span className="font-semibold text-amber-400 text-[11px] block truncate">
              {tomorrowWeather ? `+1d: ${tomorrowWeather.condition} (${tomorrowWeather.tempMinC}°C/${tomorrowWeather.tempMaxC}°C)` : 'Estable'}
            </span>
          </div>
        </div>
      </div>

      {/* General Pre-Turn Questions (1, 2, 3) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <span>Preguntas Generales Pre-Turno</span>
        </h3>

        {/* Question 1 */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-800">
              1. ¿Se siente con energía para comenzar el turno?
            </label>
            <p className="text-[11px] text-slate-500">
              Disposición anímica y vital para la jornada programada.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="q1-yes-btn"
              type="button"
              onClick={() => updateGeneral('energyToStartShift', true)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                survey.energyToStartShift
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              SÍ
            </button>
            <button
              id="q1-no-btn"
              type="button"
              onClick={() => updateGeneral('energyToStartShift', false)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                !survey.energyToStartShift
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              NO
            </button>
          </div>
        </div>

        {/* Question 2 */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-800">
              2. ¿Presenta cansancio físico importante?
            </label>
            <p className="text-[11px] text-slate-500">
              Fatiga muscular, pesadez corporal o agotamiento físico previo.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="q2-yes-btn"
              type="button"
              onClick={() => updateGeneral('significantPhysicalFatigue', true)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                survey.significantPhysicalFatigue
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              SÍ
            </button>
            <button
              id="q2-no-btn"
              type="button"
              onClick={() => updateGeneral('significantPhysicalFatigue', false)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                !survey.significantPhysicalFatigue
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              NO
            </button>
          </div>
        </div>

        {/* Question 3 */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-800">
              3. ¿Tiene algún dolor que afecte la conducción?
            </label>
            <p className="text-[11px] text-slate-500">
              Molestia osteomuscular, cefalea o dolor que impida operar con seguridad.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="q3-yes-btn"
              type="button"
              onClick={() => updateGeneral('painAffectingDriving', true)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                survey.painAffectingDriving
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              SÍ
            </button>
            <button
              id="q3-no-btn"
              type="button"
              onClick={() => updateGeneral('painAffectingDriving', false)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                !survey.painAffectingDriving
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              NO
            </button>
          </div>
        </div>
      </div>

      {/* Health, Medications, Drugs & Alcohol Control Section */}
      <div className="space-y-3 pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Pill className="w-3.5 h-3.5 text-indigo-600" />
          <span>Control de Medicamentos, Drogas y Alcohol</span>
        </h3>

        {/* Medications / Drugs */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>¿Ha consumido medicamentos o fármacos en las últimas 24h?</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Antigripales, relajantes musculares, antihistamínicos o sedantes que induzcan somnolencia.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                id="meds-yes-btn"
                type="button"
                onClick={() => updateGeneral('medicationsOrDrugsConsumed', true)}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  survey.medicationsOrDrugsConsumed
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                SÍ
              </button>
              <button
                id="meds-no-btn"
                type="button"
                onClick={() => updateGeneral('medicationsOrDrugsConsumed', false)}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  !survey.medicationsOrDrugsConsumed
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                NO
              </button>
            </div>
          </div>

          {survey.medicationsOrDrugsConsumed && (
            <input
              type="text"
              placeholder="Indicar nombre del medicamento o tipo (ej. Antialérgico, Paracetamol...)"
              value={survey.medicationDetails || ''}
              onChange={(e) => updateGeneral('medicationDetails', e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-slate-800"
            />
          )}
        </div>

        {/* Alcohol Control (Last 12 Hours) */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Wine className="w-3.5 h-3.5 text-rose-600" />
              <span>¿Ha consumido alcohol en las últimas 12 horas o presenta resaca?</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Política estricta de Tolerancia Cero en faena minera.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="alcohol-yes-btn"
              type="button"
              onClick={() => updateGeneral('alcoholConsumedLast12Hours', true)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                survey.alcoholConsumedLast12Hours
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              SÍ
            </button>
            <button
              id="alcohol-no-btn"
              type="button"
              onClick={() => updateGeneral('alcoholConsumedLast12Hours', false)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                !survey.alcoholConsumedLast12Hours
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              NO
            </button>
          </div>
        </div>
      </div>

      {/* Exclusive Night Shift Module */}
      {isNightShift && (
        <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Preguntas Exclusivas para Turno de Noche
              </h3>
            </div>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
              Checklist 7x7 Noche
            </span>
          </div>

          <div className="space-y-3">
            {/* Question 4: Yawning / Heavy eyelids */}
            <div className="p-3 bg-white rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-800">
                4. ¿En la última hora ha estado bostezando o siente pesadez en los párpados?
              </label>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => updateNight('yawningOrHeavyEyelids', true)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    survey.nightQuestions?.yawningOrHeavyEyelids
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  SÍ
                </button>
                <button
                  type="button"
                  onClick={() => updateNight('yawningOrHeavyEyelids', false)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    !survey.nightQuestions?.yawningOrHeavyEyelids
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>

            {/* Question 5: Hydrated & Nourished */}
            <div className="p-3 bg-white rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-800">
                5. ¿Se alimentó y se encuentra hidratado?
              </label>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => updateNight('hydratedAndNourished', true)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    survey.nightQuestions?.hydratedAndNourished !== false
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  SÍ
                </button>
                <button
                  type="button"
                  onClick={() => updateNight('hydratedAndNourished', false)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    survey.nightQuestions?.hydratedAndNourished === false
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>

            {/* Question 6: Energy Drinks */}
            <div className="p-3 bg-white rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-800">
                6. ¿Ha consumido bebidas energéticas en exceso (+2 latas)?
              </label>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => updateNight('excessEnergyDrinks', true)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    survey.nightQuestions?.excessEnergyDrinks
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  SÍ
                </button>
                <button
                  type="button"
                  onClick={() => updateNight('excessEnergyDrinks', false)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    !survey.nightQuestions?.excessEnergyDrinks
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>
          </div>

          {/* Physiological Control: Daytime Sleep & Lighting */}
          <div className="pt-2 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Control Fisiológico & Somnolencia Nocturna</span>
            </h4>

            {/* Daytime sleep environment */}
            <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Ambiente de Sueño Diurno Pre-Turno:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateNight('daytimeSleepEnvironment', 'optimal')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    survey.nightQuestions?.daytimeSleepEnvironment === 'optimal' || !survey.nightQuestions?.daytimeSleepEnvironment
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold">🟢 Óptimo</span>
                  <span className="text-[10px] text-slate-500 block font-normal">
                    Oscuro, insonorizado y fresco (&lt;20°C)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateNight('daytimeSleepEnvironment', 'regular')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    survey.nightQuestions?.daytimeSleepEnvironment === 'regular'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold">🟡 Regular</span>
                  <span className="text-[10px] text-slate-500 block font-normal">
                    Luz o ruido leve en habitación
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateNight('daytimeSleepEnvironment', 'poor')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    survey.nightQuestions?.daytimeSleepEnvironment === 'poor'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold">🔴 Deficiente</span>
                  <span className="text-[10px] text-slate-500 block font-normal">
                    Calor &gt;23°C, luz solar o ruido campamento
                  </span>
                </button>
              </div>
            </div>

            {/* Cabin Lighting */}
            <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Iluminación en Cabina / Puesto de Trabajo:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateNight('cabinLightingCondition', 'optimal')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    survey.nightQuestions?.cabinLightingCondition === 'optimal' || !survey.nightQuestions?.cabinLightingCondition
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold">🟢 Óptima</span>
                  <span className="text-[10px] text-slate-500 block font-normal">
                    Luz blanca/azulada &gt;250 lux o pausas luminosas
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateNight('cabinLightingCondition', 'partial')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    survey.nightQuestions?.cabinLightingCondition === 'partial'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold">🟡 Parcial</span>
                  <span className="text-[10px] text-slate-500 block font-normal">
                    Luz tenue moderada
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateNight('cabinLightingCondition', 'dim_darkness')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    survey.nightQuestions?.cabinLightingCondition === 'dim_darkness'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold">🔴 Penumbra Continua</span>
                  <span className="text-[10px] text-slate-500 block font-normal">
                    Aumenta secreción de Melatonina
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
        >
          ← Volver
        </button>
        <button
          id="fys-survey-continue-btn"
          type="button"
          onClick={onNext}
          className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <span>Continuar a Caracterización del Sueño</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
