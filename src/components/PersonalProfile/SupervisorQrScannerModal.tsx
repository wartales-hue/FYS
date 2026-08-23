import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  QrCode, 
  ShieldCheck, 
  User, 
  Mail, 
  Building2, 
  Sparkles,
  SwitchCamera,
  Layers
} from 'lucide-react';
import { getAllSupervisors, findSupervisorByCode } from '../../lib/supervisorCrewManager';
import { isAuthorizedSupervisorRut } from '../../lib/premiumService';

export interface ScannedSupervisorData {
  code: string;
  name: string;
  rut?: string;
  email: string;
  company?: string;
  faena?: string;
  shiftName?: string;
  isPaid?: boolean;
}

interface SupervisorQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: ScannedSupervisorData) => void;
}

export const SupervisorQrScannerModal: React.FC<SupervisorQrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<ScannedSupervisorData | null>(null);
  const [showSimulateList, setShowSimulateList] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const availableSupervisors = getAllSupervisors();

  // Play pleasant success chime
  const playBeep = () => {
    try {
      if (typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      }
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setHasCameraPermission(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso directo a la cámara web. Puedes subir una imagen con el QR o seleccionar tu supervisor de la lista.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCameraPermission(true);
        setIsScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      setHasCameraPermission(false);
      const errMsg = err instanceof Error ? err.message : 'No se pudo acceder a la cámara.';
      if (errMsg.includes('Permission denied') || errMsg.includes('NotAllowedError')) {
        setCameraError('Permiso de cámara denegado. Puedes habilitar el permiso en tu navegador o usar el selector de imagen/simulación.');
      } else {
        setCameraError('Cámara no disponible en este entorno. Puedes cargar una captura del QR o elegir tu supervisor directamente.');
      }
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Process raw payload string from QR
  const processQrData = (rawData: string) => {
    if (!rawData) return;
    try {
      let parsed: Record<string, unknown> = {};
      let supervisorCode = '';
      let supervisorName = '';
      let supervisorRut = '';
      let supervisorEmail = '';
      let company = '';
      let faena = '';
      let shiftName = '';

      if (rawData.trim().startsWith('{') && rawData.trim().endsWith('}')) {
        parsed = JSON.parse(rawData);
        supervisorCode = String(parsed.code || parsed.supervisorCode || '').trim();
        supervisorName = String(parsed.name || parsed.supervisorName || '').trim();
        supervisorRut = String(parsed.rut || parsed.supervisorRut || '').trim();
        supervisorEmail = String(parsed.email || parsed.supervisorEmail || '').trim();
        company = String(parsed.company || '').trim();
        faena = String(parsed.faena || '').trim();
        shiftName = String(parsed.shiftName || '').trim();
      } else {
        // Plain text code
        supervisorCode = rawData.trim().toUpperCase();
      }

      // If missing data, try to resolve from system directory
      const resolved = findSupervisorByCode(supervisorCode || supervisorRut);
      if (resolved) {
        if (!supervisorName) supervisorName = resolved.name;
        if (!supervisorRut) supervisorRut = resolved.rut;
        if (!supervisorEmail) supervisorEmail = resolved.email;
        if (!company) company = resolved.company;
        if (!faena) faena = resolved.faena;
        if (!shiftName) shiftName = resolved.shiftName;
      }

      const isPaid = isAuthorizedSupervisorRut(supervisorRut) || isAuthorizedSupervisorRut(supervisorCode) || (resolved?.planType === 'pro_crew');

      const finalData: ScannedSupervisorData = {
        code: supervisorCode || 'SUP-ACTIVO',
        name: supervisorName || 'Supervisor de Faena',
        rut: supervisorRut || '12.080.702-1',
        email: supervisorEmail || 'supervisor.hsec@faenaminera.cl',
        company: company || 'Empresa Operadora',
        faena: faena || 'Faena Minera',
        shiftName: shiftName || 'Turno Activo',
        isPaid: isPaid
      };

      playBeep();
      setScannedResult(finalData);
      stopCamera();
    } catch (e) {
      console.warn('QR parse error:', e);
      setCameraError('El código QR escaneado no tiene un formato válido de Supervisor FYS Oplira.');
    }
  };

  // Continuous Canvas Frame Processing for jsQR
  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            processQrData(code.data);
            return;
          }
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  // Handle Image File Upload for QR decode
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            processQrData(code.data);
          } else {
            setCameraError('No se detectó ningún código QR en la imagen seleccionada. Asegúrate de que el código esté bien iluminado y enfocado.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Lifecycle
  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      setCameraError(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  const handleConfirmAndApply = () => {
    if (scannedResult) {
      onScanSuccess(scannedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto text-slate-900 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md flex-shrink-0 font-bold">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                Vinculación de Cuadrilla
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Escanear Cuenta Supervisor QR
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Result view if QR was successfully decoded */}
          {scannedResult ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>¡Código QR de Supervisor Detectado con Éxito!</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Código de Cuadrilla:</span>
                    <span className="font-mono font-black text-sm text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                      {scannedResult.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Supervisor:</span>
                    <span className="font-bold text-slate-900">{scannedResult.name}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">RUT Supervisor:</span>
                    <span className="font-mono font-bold text-slate-800">{scannedResult.rut || '12.080.702-1'}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Email Despacho:</span>
                    <span className="font-medium text-slate-900">{scannedResult.email}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 font-medium">Faena / Turno:</span>
                    <span className="text-slate-700 font-medium text-right">
                      {scannedResult.faena} • {scannedResult.shiftName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-emerald-100/70 rounded-xl text-[11px] text-emerald-950 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>
                    Al aplicar estos datos, tus evaluaciones pre-turno se asociarán automáticamente a este supervisor y se activará el despacho con firma digital.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setScannedResult(null);
                    startCamera();
                  }}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Escanear Otro QR
                </button>

                <button
                  id="confirm-scanned-supervisor-btn"
                  type="button"
                  onClick={handleConfirmAndApply}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aplicar a Datos Personales</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera / Scanner View */
            <div className="space-y-3">
              <div className="relative aspect-video sm:aspect-square max-h-[320px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center shadow-inner">
                
                {/* Hidden canvas for jsQR analysis */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Video feed */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />

                {/* Scanning Frame Overlay & Guides */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-amber-400/90 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    {/* Animated Scanning Laser Line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse top-1/2 -translate-y-1/2" />

                    {/* Corner Accent Markers */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-amber-400 rounded-tl-sm" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-amber-400 rounded-tr-sm" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-amber-400 rounded-bl-sm" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-amber-400 rounded-br-sm" />
                  </div>
                </div>

                {/* Switch Camera Overlay Button */}
                <button
                  type="button"
                  onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 shadow-md backdrop-blur-xs text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Cambiar Cámara"
                >
                  <SwitchCamera className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] hidden sm:inline">Girar Cámara</span>
                </button>
              </div>

              <p className="text-center text-xs text-slate-500">
                Apunta la cámara al <strong>Código QR de tu Supervisor</strong> proyectado en la charla de 5 minutos o en su pantalla.
              </p>

              {/* Error Display */}
              {cameraError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Fallback Tools: Upload Image or Quick Simulation Selection */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cargar Imagen con QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSimulateList(!showSimulateList)}
                  className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Seleccionar de Cuadrilla</span>
                </button>
              </div>

              {/* Fast Supervisor Select Accordion */}
              {showSimulateList && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs animate-in fade-in">
                  <span className="font-bold text-slate-800 block text-[11px]">
                    Supervisores Registrados para Vinculación Rápida:
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {availableSupervisors.map((sup) => (
                      <button
                        key={sup.code}
                        type="button"
                        onClick={() => processQrData(sup.qrPayload)}
                        className="w-full p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-900">
                            {sup.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Código: {sup.code} • RUT: {sup.rut}
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-100 group-hover:bg-indigo-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                          Vincular
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
