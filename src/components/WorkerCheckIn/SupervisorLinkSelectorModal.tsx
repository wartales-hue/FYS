import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  QrCode, 
  Search, 
  Check, 
  CheckCircle2, 
  Lock, 
  AlertCircle, 
  Sparkles, 
  X, 
  Camera, 
  Radio, 
  ArrowRight,
  ShieldCheck,
  History,
  Trash2
} from 'lucide-react';
import { SupervisorCrewProfile, SavedSupervisorLink, WorkerProfile } from '../../types';
import { 
  getSavedSupervisorsForWorker, 
  saveSupervisorToWorkerHistory, 
  findSupervisorByCode,
  parseSupervisorQrPayload,
  getAllSupervisors,
  isSupervisorPaid
} from '../../lib/supervisorCrewManager';

interface SupervisorLinkSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  currentSupervisorCode?: string;
  onSupervisorSelected: (supervisor: SupervisorCrewProfile | SavedSupervisorLink) => void;
}

export const SupervisorLinkSelectorModal: React.FC<SupervisorLinkSelectorModalProps> = ({
  isOpen,
  onClose,
  worker,
  currentSupervisorCode,
  onSupervisorSelected,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'code' | 'scanner'>('history');
  const [savedList, setSavedList] = useState<SavedSupervisorLink[]>([]);
  const [inputCode, setInputCode] = useState<string>('');
  const [validatedSupervisor, setValidatedSupervisor] = useState<SupervisorCrewProfile | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      const history = getSavedSupervisorsForWorker(worker);
      setSavedList(history);
      setValidationError(null);
      setValidatedSupervisor(null);
      setInputCode('');
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleStartCamera = async () => {
    setIsScanning(true);
    setValidationError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        setValidationError('La cámara no está disponible en este dispositivo o navegador.');
        setIsScanning(false);
      }
    } catch (e) {
      setValidationError('No se pudo acceder a la cámara. Por favor ingresa el código alfanumérico manualmente.');
      setIsScanning(false);
    }
  };

  const handleValidateCode = (codeToTest?: string) => {
    const code = (codeToTest || inputCode).trim().toUpperCase();
    if (!code) {
      setValidationError('Por favor ingresa un código de supervisor válido (ej: YTR024).');
      setValidatedSupervisor(null);
      return;
    }

    const resolved = findSupervisorByCode(code);
    if (resolved) {
      setValidatedSupervisor(resolved);
      setValidationError(null);
    } else {
      setValidationError(`El código "${code}" no fue reconocido. Verifica con tu supervisor de turno.`);
      setValidatedSupervisor(null);
    }
  };

  const handleSelectSupervisor = (sup: SupervisorCrewProfile | SavedSupervisorLink) => {
    saveSupervisorToWorkerHistory(sup);
    onSupervisorSelected(sup);
    stopCamera();
    onClose();
  };

  const handleSimulateScan = (supCode: string) => {
    const resolved = findSupervisorByCode(supCode);
    if (resolved) {
      handleSelectSupervisor(resolved);
    }
  };

  if (!isOpen) return null;

  const allAvailable = getAllSupervisors();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-xl text-slate-800 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                Vinculación de Cuadrilla
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold border border-emerald-200">
                Plan Pro
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Vincular Supervisor de Turno
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona tu supervisor habitual o ingresa su código para reportar tus evaluaciones.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('history');
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Mis Supervisores ({savedList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('code');
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Digitar Código</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('scanner');
              handleStartCamera();
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Escanear QR</span>
          </button>
        </div>

        {/* TAB 1: Saved Supervisors History (Dropdown List) */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium">
              Supervisores con los que has trabajado previamente:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {savedList.map((s) => {
                const isSelected = s.code.toUpperCase() === currentSupervisorCode?.toUpperCase();
                return (
                  <div
                    key={s.code}
                    onClick={() => handleSelectSupervisor(s)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                          {s.code}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                        {isSupervisorPaid(s.code) ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                            Pro Crew
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded">
                            Gratuito
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                            Actual
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        RUT: <strong className="font-mono">{s.rut}</strong> • {s.company}
                      </p>
                      <p className="text-slate-600 font-medium text-[11px]">
                        {s.shiftName || 'Turno Operacional'} • {s.faena}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      <span>{isSelected ? 'Seleccionado' : 'Vincular'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>+ Agregar otro supervisor no listado</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Manual Code Input */}
        {activeTab === 'code' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ingresa el Código de Cuadrilla (ej: YTR024, YTR025):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setValidationError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleValidateCode();
                  }}
                  placeholder="Ej: YTR024"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleValidateCode()}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Validar
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                El código te lo entrega tu supervisor durante la charla de inicio de turno.
              </p>
            </div>

            {/* Error Message */}
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Validated Supervisor Resolved Preview */}
            {validatedSupervisor && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono">
                    ✓ Código Válido ({validatedSupervisor.code})
                  </span>
                  <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Inmutable
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-sm text-slate-900">{validatedSupervisor.name}</p>
                  <p className="text-slate-600 font-mono">RUT: <strong>{validatedSupervisor.rut}</strong></p>
                  <p className="text-slate-700">{validatedSupervisor.company} • {validatedSupervisor.faena}</p>
                  <p className="text-amber-800 font-semibold">{validatedSupervisor.shiftName}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectSupervisor(validatedSupervisor)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Guardar en Mis Supervisores</span>
                </button>
              </div>
            )}

            {/* Quick Suggestions for Demo */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-1.5">Códigos de prueba en faena:</span>
              <div className="flex flex-wrap gap-1.5">
                {allAvailable.map(s => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => {
                      setInputCode(s.code);
                      handleValidateCode(s.code);
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 px-2.5 py-1 rounded-md border border-slate-200 font-mono font-medium cursor-pointer transition-colors"
                  >
                    {s.code} ({s.name.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QR Camera Scanner */}
        {activeTab === 'scanner' && (
          <div className="space-y-3 text-center">
            <p className="text-xs text-slate-600">
              Apunta tu cámara al código QR que proyecta tu supervisor en la charla:
            </p>

            <div className="relative w-full aspect-square max-w-[240px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-amber-400 flex items-center justify-center shadow-md">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <div className="absolute inset-0 border-2 border-dashed border-amber-400/80 m-6 rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
                <span className="text-[10px] bg-slate-900/80 text-amber-300 px-2 py-0.5 rounded font-mono">
                  Enfoca el código QR
                </span>
              </div>
            </div>

            {validationError && (
              <p className="text-xs text-rose-600">{validationError}</p>
            )}

            {/* Fast scan test buttons */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-1">Simular escaneo rápido con 1 clic:</span>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateScan('YTR024')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200 cursor-pointer"
                >
                  Escanear YTR024 (José Valdivia)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateScan('YTR025')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200 cursor-pointer"
                >
                  Escanear YTR025 (Juan Castro)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Security Notice */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            El RUT del supervisor está protegido y garantiza que tus evaluaciones se asocien con validez legal.
          </span>
        </div>
      </div>
    </div>
  );
};
