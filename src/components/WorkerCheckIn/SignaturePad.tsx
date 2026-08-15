import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  id?: string;
  onSaveSignature: (signatureBase64: string) => void;
  title: string;
  subtitle?: string;
  signeeName: string;
  signeeRole?: string;
  signeeRut?: string;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  id = 'signature-canvas',
  onSaveSignature,
  title,
  subtitle,
  signeeName,
  signeeRole,
  signeeRut,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Keep canvas 100% transparent (no solid white fill) so exported PNG is transparent
    ctx.clearRect(0, 0, rect.width, rect.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a'; // Deep slate ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    exportSignature();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    setHasSignature(false);
    onSaveSignature('');
  };

  const exportSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Exports clean PNG with full alpha channel transparency on background
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-slate-900">
            <PenTool className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold">{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="text-left sm:text-right text-xs">
          <span className="font-bold text-slate-900 block">{signeeName}</span>
          <span className="text-slate-500 text-[11px]">
            {signeeRole} {signeeRut ? `• RUT: ${signeeRut}` : ''}
          </span>
        </div>
      </div>

      {/* Signature Canvas Box (UI background is crisp white, canvas itself is transparent) */}
      <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white touch-none">
        {/* Visual guideline behind the transparent canvas */}
        <div className="absolute inset-x-5 bottom-9 border-b border-dashed border-slate-200 pointer-events-none" />

        <canvas
          id={id}
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-44 cursor-crosshair block relative z-10"
        />

        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs z-20">
            <span className="bg-slate-50/90 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-medium">
              Firme aquí con el dedo o puntero
            </span>
          </div>
        )}

        <div className="absolute bottom-2 left-4 pointer-events-none text-[10px] text-slate-400 font-mono z-20">
          Firma Manuscrita Digital Certificada DS 44 / Ley 21.719
        </div>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={clearSignature}
          disabled={!hasSignature || disabled}
          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 font-medium disabled:opacity-30 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Borrar Firma</span>
        </button>

        <div className="flex items-center gap-2">
          {hasSignature ? (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Firma capturada</span>
            </span>
          ) : (
            <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Firma requerida para emisión
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
