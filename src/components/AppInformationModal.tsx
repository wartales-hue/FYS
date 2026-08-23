import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Brain, 
  CheckCircle2, 
  Sparkles, 
  Smartphone, 
  Users, 
  FileText, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Activity, 
  Scale, 
  Moon, 
  Sun, 
  Compass, 
  Award,
  AlertTriangle,
  FileCheck2,
  Mail,
  QrCode,
  Layers,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';

interface AppInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'guide' | 'science';
}

export const AppInformationModal: React.FC<AppInformationModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'guide'
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'science'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <Info className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight text-white">
                  Centro de Información
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-400/30">
                  Oplira F&S
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Guía operativa del usuario y fundamentos de validación científica del modelo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal de información"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Selector: 2 Main Options */}
        <div className="p-3 sm:p-4 bg-slate-100/80 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          
          {/* Option 1: Cómo usar la APP */}
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
              activeTab === 'guide' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`font-extrabold text-xs block ${
                  activeTab === 'guide' ? 'text-blue-950' : 'text-slate-900'
                }`}>
                  Cómo usar la APP
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Guía de Uso
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Manual paso a paso para el trabajador, operador y supervisor en faena minera.
              </p>
            </div>
          </button>

          {/* Option 2: Explicación Científica */}
          <button
            type="button"
            onClick={() => setActiveTab('science')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              activeTab === 'science'
                ? 'bg-white border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
              activeTab === 'science' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
            }`}>
              <Brain className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`font-extrabold text-xs block ${
                  activeTab === 'science' ? 'text-indigo-950' : 'text-slate-900'
                }`}>
                  Validación Científica del Modelo
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                  Base Científica
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Fundamentos biomatemáticos (SAFTE/FAST, PVT Dinges, Karolinska KSS y DS 44).
              </p>
            </div>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white space-y-6 text-xs text-slate-700">
          
          {/* TAB 1: CÓMO USAR LA APP */}
          {activeTab === 'guide' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Introduction Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-start gap-3.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs flex-shrink-0 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-blue-950 text-sm">
                    Guía de Operación Diaria Pre-Turno
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Oplira es una aplicación diseñada para evaluar de forma rápida, objetiva y no invasiva la aptitud psicomotriz y el nivel de alerta de los operadores y trabajadores antes de iniciar su jornada laboral en faena, previniendo incidentes por fatiga y somnolencia.
                  </p>
                </div>
              </div>

              {/* Step-by-Step Flow for Worker */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    1
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Flujo de Evaluación para el Trabajador u Operador
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700 text-xs flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        Paso 1: Ficha Personal y Línea Base PVT
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        Obligatorio Inicial
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Al ingresar por primera vez, completa tus datos personales (Nombre, RUT, Empresa, Faena). Luego, realiza la <strong>calibración de línea base de 5 ensayos PVT</strong> tocando la pantalla cuando aparezcan los números rojos para registrar tu velocidad de reacción biológica normal.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700 text-xs flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-blue-600" />
                        Paso 2: Encuesta F&S y Horas de Sueño
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Pre-Turno Diario
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Responde la encuesta de inicio de turno (energía para operar, fatiga física, dolores o fármacos), ingresa tus horas de sueño real, horario de descanso y califica la calidad de tu descanso (1 a 5 estrellas).
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700 text-xs flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-blue-600" />
                        Paso 3: Escala KSS y Test PVT Diario
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Evaluación Objetiva
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Selecciona tu nivel de somnolencia actual en la escala Karolinska (KSS 1 al 9). Luego ejecuta la prueba de reacción PVT en pantalla. Toca el botón rojo apenas aparezca el cronómetro.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700 text-xs flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-blue-600" />
                        Paso 4: Firma y Certificado Oficial PDF
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Reporte Oficial
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Firma con tu dedo en la pantalla táctil y presiona <strong>"Finalizar y Guardar Evaluación"</strong>. Se generará automáticamente el certificado oficial PDF de 2 páginas con hash SHA-256, datos de tu empresa y faena.
                    </p>
                  </div>

                </div>
              </div>

              {/* Step-by-Step Flow for Supervisor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                    2
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Gestión de Cuadrilla para el Supervisor HSEC
                  </h4>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                        <QrCode className="w-4 h-4 text-indigo-600" />
                        <span>Enrolamiento Rápido</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Comparte tu código alfanumérico o muestra el código QR desde tu pantalla para vincular a los trabajadores a tu cuadrilla en segundos.
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>Semáforo Operacional</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Revisa en tiempo real el estado de aptitud de cada trabajador: Verde (Apto), Amarillo (Precaución) o Rojo (No Apto).
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>Plan de Mitigación</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Aplica y registra medidas inmediatas como pausas activas, reasignación de tareas críticas o descanso asistido según protocolo DS 44.
                      </p>
                    </div>

                  </div>

                  {/* Supervisor Premium Callout */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span className="font-bold text-xs text-amber-200">
                        Ventajas de la Cuenta Premium de Supervisor:
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-200 leading-relaxed">
                      Con la versión premium del supervisor, <strong>el supervisor recibirá automáticamente a su correo electrónico una copia de cada una de las evaluaciones de sus trabajadores a cargo</strong>, además, <strong>podrá firmar en la pantalla del móvil cada una de las evaluaciones</strong>, cuya firma manuscrita quedará estampada en el reporte PDF de Fatiga y Somnolencia, con el nombre de la faena y empresa asignada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Offline Operation Feature */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl flex items-start gap-3">
                <Zap className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-emerald-950 text-xs block">
                    Operatividad 100% Offline en Faenas Remotas
                  </span>
                  <p className="text-[11.5px] text-emerald-900 leading-relaxed">
                    La aplicación funciona en su totalidad sin señal de internet ni datos móviles en alta cordillera o faenas subterráneas. Todas las evaluaciones se encriptan y guardan localmente en el dispositivo, sincronizándose automáticamente cuando se detecte conexión.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: VALIDACIÓN CIENTÍFICA DEL MODELO */}
          {activeTab === 'science' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Scientific Header Banner */}
              <div className="p-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-extrabold text-sm text-white">
                    Fundamentos Biomatemáticos y Neurocognitivos del Modelo
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  El algoritmo de Oplira integra modelos biomatemáticos validados internacionalmente por la medicina del sueño, la ergonomía minera y la aviación aeroespacial (NASA, FAA, SERNAGEOMIN y MINSAL), garantizando una evaluación cuantitativa y no invasiva de la aptitud para el trabajo.
                </p>
              </div>

              {/* 4 Pillars of Science Grid */}
              <div className="space-y-4">
                
                {/* Pillar 1: SAFTE / FAST Model */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      1. Modelo Biomatemático de Dos Procesos (SAFTE / FAST - Borbély & Hursh)
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Sleep, Alertness and Fatigue Model
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-700 leading-relaxed">
                    Basado en el modelo clásico de dos procesos de regulación del sueño (Borbély, 1982) y su formulación computacional SAFTE (Hursh et al., 2004). El sistema calcula dinámicamente dos fuerzas biológicas concurrentes:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1 pl-2">
                    <li>
                      <strong>Proceso S (Homeostático):</strong> Mide la acumulación de presión de sueño generada por el tiempo de vigilia continua y la deuda de sueño acumulada en las últimas 24 y 48 horas.
                    </li>
                    <li>
                      <strong>Proceso C (Circadiano):</strong> Oscilador endógeno regulado por el núcleo supraquiasmático que determina las fluctuaciones de alerta según la hora biológica del día.
                    </li>
                    <li>
                      <strong>Inercia del Sueño:</strong> Modela la reducción temporal del rendimiento neurocognitivo en los primeros 30 a 60 minutos posteriores al despertar.
                    </li>
                  </ul>
                </div>

                {/* Pillar 2: PVT Golden Standard */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                      2. Prueba de Vigilancia Psicomotriz (PVT - Dinges & Powell, 1985)
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      Gold Standard Neurocognitivo
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-700 leading-relaxed">
                    La PVT (Psychomotor Vigilance Task) es la prueba psicométrica más sensible y respaldada por la literatura científica para detectar privación de sueño y fatiga aguda sin efectos de aprendizaje ni sesgos de memoria.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-800 block">Tiempos de Reacción (RT)</span>
                      <p className="text-slate-600 text-[10.5px]">
                        Captura la velocidad de respuesta milimétrica y la velocidad psicomotriz recíproca (1/RT).
                      </p>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-800 block">Lapsos Atencionales</span>
                      <p className="text-slate-600 text-[10.5px]">
                        Registra bloqueos corticales y lapsos de atención (&gt;500 ms) equivalentes a micro-sueños.
                      </p>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-800 block">Calibración Individual</span>
                      <p className="text-slate-600 text-[10.5px]">
                        Compara el resultado contra la Línea Base personal del trabajador, eliminando sesgos de edad.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pillar 3: Karolinska Sleepiness Scale */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      3. Escala de Somnolencia de Karolinska (KSS - Åkerstedt & Gillberg, 1990)
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">
                      Correlación Electroencefalográfica
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-700 leading-relaxed">
                    Escala psicométrica validada que evalúa el estado subjetivo de somnolencia del operador en 9 niveles. Numerosos estudios clínicos demuestran que puntuaciones KSS ≥ 7 correlacionan de manera estadísticamente significativa con la aparición de ondas theta y alfa en el EEG cerebral, indicando micro-sueños inminentes al volante o en operación de maquinaria pesada.
                  </p>
                </div>

                {/* Pillar 4: Circadian Nadir and Mining Shift Rosters */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Sun className="w-4 h-4 text-rose-600" />
                      4. Nadir Circadiano y Factores Operacionales Mineros (DS 44 / MINSAL)
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900">
                      Minería y Gran Altitud
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-700 leading-relaxed">
                    El modelo ajusta el índice de riesgo ponderando factores contextuales propios de la industria minera chilena:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1 pl-2">
                    <li>
                      <strong>Nadir Circadiano (02:00 a 06:00 hrs):</strong> Máxima vulnerabilidad biológica donde el cuerpo experimenta su temperatura mínima y menor nivel de alerta.
                    </li>
                    <li>
                      <strong>Ventana Postprandial (14:00 a 16:00 hrs):</strong> Descenso secundario de alerta asociado a la digestión y ritmos ultradianos.
                    </li>
                    <li>
                      <strong>Turnos Rotativos y Noches Consecutivas:</strong> Factor de acumulación por desalineamiento circadiano en turnos 7x7, 4x3 o turnos de noche continuos.
                    </li>
                    <li>
                      <strong>Gran Altitud Geográfica:</strong> Efectos de la hipoxia hipobárica sobre la fragmentación del sueño según la Guía Técnica del Ministerio de Salud (MINSAL).
                    </li>
                  </ul>
                </div>

                {/* Scientific References */}
                <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-2xl space-y-2 text-slate-600">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-slate-700" />
                    Referencias Científicas y Bibliografía de Respaldo
                  </span>
                  <div className="space-y-1 text-[10.5px] text-slate-600">
                    <p>• <strong>Dinges, D. F., & Powell, J. W. (1985).</strong> <em>Microcomputer analyses of performance on a portable, simple visual RT task during sustained operations.</em> Behavior Research Methods, 17(6), 652-655.</p>
                    <p>• <strong>Åkerstedt, T., & Gillberg, M. (1990).</strong> <em>Subjective and objective sleepiness in the active individual.</em> International Journal of Neuroscience, 52(1-2), 29-37.</p>
                    <p>• <strong>Hursh, S. R., et al. (2004).</strong> <em>Fatigue models for applied research in aviation and transport.</em> Aviation, Space, and Environmental Medicine, 75(3), A44-A53.</p>
                    <p>• <strong>Dawson, D., & Reid, K. (1997).</strong> <em>Fatigue, alcohol and performance impairment.</em> Nature, 388(6639), 235.</p>
                    <p>• <strong>Borbély, A. A. (1982).</strong> <em>A two process model of sleep regulation.</em> Human Neurobiology, 1(3), 195-204.</p>
                    <p>• <strong>SERNAGEOMIN & MINSAL (Chile).</strong> <em>Guía Técnica para la Gestión de Riesgos de Fatiga y Somnolencia en Faenas Mineras y Decreto Supremo N° 44.</em></p>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="hidden sm:inline">Conforme a normativas DS 44, OHSAS e ISO 45001</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Cerrar Información
          </button>
        </div>

      </div>
    </div>
  );
};
