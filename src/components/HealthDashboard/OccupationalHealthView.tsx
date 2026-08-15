import React, { useState } from 'react';
import { 
  Stethoscope, 
  Lock, 
  ShieldAlert, 
  FileCheck, 
  AlertCircle, 
  UserCheck, 
  CheckCircle2, 
  Info, 
  Moon,
  HeartPulse,
  Award
} from 'lucide-react';
import { WorkerProfile, StopBangRecord } from '../../types';

interface OccupationalHealthViewProps {
  workers: WorkerProfile[];
  stopBangRecords: StopBangRecord[];
  onSaveStopBang: (record: StopBangRecord) => void;
}

export const OccupationalHealthView: React.FC<OccupationalHealthViewProps> = ({
  workers,
  stopBangRecords,
  onSaveStopBang,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || '');
  
  // STOP-BANG Form State
  const [snoring, setSnoring] = useState<boolean>(false);
  const [tiredness, setTiredness] = useState<boolean>(false);
  const [observedApnea, setObservedApnea] = useState<boolean>(false);
  const [highBloodPressure, setHighBloodPressure] = useState<boolean>(false);
  const [bmiOver35, setBmiOver35] = useState<boolean>(false);
  const [ageOver50, setAgeOver50] = useState<boolean>(true);
  const [neckCircumferenceOver40cm, setNeckCircumferenceOver40cm] = useState<boolean>(false);
  const [genderMale, setGenderMale] = useState<boolean>(true);
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [referToStudy, setReferToStudy] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const selectedWorker = workers.find(w => w.id === selectedWorkerId) || workers[0];
  const existingRecord = stopBangRecords.find(r => r.workerId === selectedWorkerId);

  // Calculate STOP-BANG score 0-8
  const score = [
    snoring,
    tiredness,
    observedApnea,
    highBloodPressure,
    bmiOver35,
    ageOver50,
    neckCircumferenceOver40cm,
    genderMale
  ].filter(Boolean).length;

  const riskCategory: 'low' | 'intermediate' | 'high' = 
    score >= 5 ? 'high' : score >= 3 ? 'intermediate' : 'low';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: StopBangRecord = {
      id: `sb-${Date.now()}`,
      workerId: selectedWorker.id,
      date: new Date().toISOString().split('T')[0],
      snoring,
      tiredness,
      observedApnea,
      highBloodPressure,
      bmiOver35,
      ageOver50,
      neckCircumferenceOver40cm,
      genderMale,
      totalScore: score,
      riskCategory,
      medicalRecommendation: score >= 5 
        ? 'Derivación preventiva a Poligrafía / Polisomnografía ambulatoria en policlínico faena.'
        : 'Seguimiento preventivo y hábitos de higiene de sueño en campamento.',
      referredToSleepStudy: referToStudy,
      doctorNotes,
    };

    onSaveStopBang(newRecord);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 py-2">
      {/* Restricted Medical Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4" />
                <span>Dominio Médico Segregado (Salud Ocupacional)</span>
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 font-mono font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" /> Confidencial
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Tamizaje Clínico de Trastornos del Sueño y Apnea Obstructiva
            </h1>
            <p className="text-xs text-slate-500">
              Evaluación médica bajo secreto profesional (Cuestionario STOP-BANG validado).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-900"
            >
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.equipmentAssigned}) - {w.rut}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ethical Medical Guardrails Banner */}
        <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl text-xs space-y-2 text-indigo-900">
          <div className="flex items-center gap-2 font-bold text-indigo-800">
            <HeartPulse className="w-4 h-4 text-indigo-600" />
            <span>Principio Fundamental de Medicina Ocupacional FRA-HSEC (Sección 19):</span>
          </div>
          <p className="leading-relaxed text-indigo-950/80">
            El STOP-BANG es un instrumento exclusivo de <strong>tamizaje preventivo</strong>. NO diagnostica por sí solo apnea, NO determina aptitud médica definitiva, NO bloquea automáticamente al trabajador en el sistema operacional y <strong>NUNCA es visible para la supervisión directa</strong>.
          </p>
        </div>
      </div>

      {/* STOP-BANG Interactive Questionnaire */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Evaluación STOP-BANG: {selectedWorker.name}
            </h2>
            <p className="text-xs text-slate-500">
              RUT: {selectedWorker.rut} • Cargo: {selectedWorker.role}
            </p>
          </div>

          {/* Dynamic Score Indicator */}
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Puntaje STOP-BANG</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-bold text-indigo-800">{score} / 8</span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                riskCategory === 'high'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : riskCategory === 'intermediate'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {riskCategory === 'high' ? 'Riesgo Alto AOS' : riskCategory === 'intermediate' ? 'Riesgo Intermedio' : 'Riesgo Bajo'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* S: Snoring */}
            <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
              snoring ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <span className="font-bold block text-sm text-slate-900">S - Snoring (Ronquido)</span>
                <span className="text-slate-500 text-[11px]">¿Ronca lo suficientemente fuerte como para ser escuchado a través de puertas cerradas?</span>
              </div>
              <input
                type="checkbox"
                checked={snoring}
                onChange={(e) => setSnoring(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </label>

            {/* T: Tiredness */}
            <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
              tiredness ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <span className="font-bold block text-sm text-slate-900">T - Tiredness (Cansancio)</span>
                <span className="text-slate-500 text-[11px]">¿Se siente frecuentemente cansado o con somnolencia durante el día?</span>
              </div>
              <input
                type="checkbox"
                checked={tiredness}
                onChange={(e) => setTiredness(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </label>

            {/* O: Observed */}
            <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
              observedApnea ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <span className="font-bold block text-sm text-slate-900">O - Observed (Apnea Observada)</span>
                <span className="text-slate-500 text-[11px]">¿Alguien ha observado que deja de respirar o se ahoga mientras duerme?</span>
              </div>
              <input
                type="checkbox"
                checked={observedApnea}
                onChange={(e) => setObservedApnea(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </label>

            {/* P: Blood Pressure */}
            <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
              highBloodPressure ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <span className="font-bold block text-sm text-slate-900">P - Pressure (Presión Arterial)</span>
                <span className="text-slate-500 text-[11px]">¿Tiene diagnóstico de hipertensión arterial o toma antihipertensivos?</span>
              </div>
              <input
                type="checkbox"
                checked={highBloodPressure}
                onChange={(e) => setHighBloodPressure(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </label>

            {/* B: BMI */}
            <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
              bmiOver35 ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <span className="font-bold block text-sm text-slate-900">B - Body Mass Index (IMC &gt; 35 kg/m²)</span>
                <span className="text-slate-500 text-[11px]">Índice de masa corporal en rango de obesidad grado II o superior.</span>
              </div>
              <input
                type="checkbox"
                checked={bmiOver35}
                onChange={(e) => setBmiOver35(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </label>

            {/* A: Age */}
            <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
              ageOver50 ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <span className="font-bold block text-sm text-slate-900">A - Age (Edad &gt; 50 años)</span>
                <span className="text-slate-500 text-[11px]">Factor demográfico de prevalencia de trastornos de vía aérea superior.</span>
              </div>
              <input
                type="checkbox"
                checked={ageOver50}
                onChange={(e) => setAgeOver50(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </label>

            {/* N: Neck */}
            <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
              neckCircumferenceOver40cm ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <span className="font-bold block text-sm text-slate-900">N - Neck (Circunferencia Cuello &gt; 40cm)</span>
                <span className="text-slate-500 text-[11px]">Medición en cartílago tiroides (varones &gt;43cm, damas &gt;40cm).</span>
              </div>
              <input
                type="checkbox"
                checked={neckCircumferenceOver40cm}
                onChange={(e) => setNeckCircumferenceOver40cm(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </label>

            {/* G: Gender */}
            <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
              genderMale ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <span className="font-bold block text-sm text-slate-900">G - Gender (Género Masculino)</span>
                <span className="text-slate-500 text-[11px]">Mayor predisposición anatómica a colapso de faringe durante sueño.</span>
              </div>
              <input
                type="checkbox"
                checked={genderMale}
                onChange={(e) => setGenderMale(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </label>
          </div>

          {/* Doctor Referral & Notes */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-semibold flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={referToStudy}
                  onChange={(e) => setReferToStudy(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>Derivar a Poligrafía del Sueño / Polisomnografía Ambulatoria en Policlínico Faena</span>
              </label>
              <span className="text-indigo-700 font-bold">Protocolo Preventivo</span>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">
                Evolución Clínica & Observaciones del Médico Ocupacional:
              </label>
              <textarea
                rows={2}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Ej: Paciente asintomático en turno, se programa estudio de sueño ambulatorio sin suspensión laboral preventiva..."
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs text-center flex items-center justify-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Registro médico STOP-BANG guardado con éxito en Base Clínica Segregada.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Guardar Evaluación Médica Confidencial</span>
          </button>
        </form>
      </div>
    </div>
  );
};
