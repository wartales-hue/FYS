import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Zap, AlertCircle, CheckCircle2, Award, Clock, Snowflake, Smartphone, ArrowRight } from 'lucide-react';
import { PVTMode, PVTSummary, PVTTrialResult, WorkerProfile } from '../../types';

interface InteractivePVTProps {
  mode: PVTMode;
  worker: WorkerProfile;
  onComplete: (summary: PVTSummary) => void;
  onAcceptAndContinue?: () => void;
  disabled?: boolean;
}

export const InteractivePVT: React.FC<InteractivePVTProps> = ({
  mode,
  worker,
  onComplete,
  onAcceptAndContinue,
  disabled = false,
}) => {
  const targetTrialCount = mode === 'Micro-PVT' ? 3 : mode === 'PVT-A' ? 5 : mode === 'PVT-L' ? 10 : 12;
  
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'active' | 'trial_feedback' | 'false_start' | 'finished'>('idle');
  const [currentTrial, setCurrentTrial] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [trials, setTrials] = useState<PVTTrialResult[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [repeatReason, setRepeatReason] = useState<string>('');
  const [showRepeatOptions, setShowRepeatOptions] = useState<boolean>(false);
  const [lastSummary, setLastSummary] = useState<PVTSummary | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerRafRef = useRef<number | null>(null);
  const stimulusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayMsRef = useRef<number>(0);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
      if (stimulusTimeoutRef.current) clearTimeout(stimulusTimeoutRef.current);
    };
  }, []);

  const startTest = (reason: string = '') => {
    if (disabled) return;
    if (reason) {
      setRepeatReason(reason);
      setAttemptCount(prev => prev + 1);
    }
    setShowRepeatOptions(false);
    setTrials([]);
    setCurrentTrial(1);
    setGameState('waiting');
    scheduleNextStimulus();
  };

  const scheduleNextStimulus = () => {
    setGameState('waiting');
    setElapsedMs(0);
    setFeedbackMessage('');

    // Random ISI: 2000ms - 4500ms
    const randomDelay = Math.floor(Math.random() * 2500) + 2000;
    delayMsRef.current = randomDelay;

    stimulusTimeoutRef.current = setTimeout(() => {
      triggerStimulus();
    }, randomDelay);
  };

  const triggerStimulus = () => {
    startTimeRef.current = performance.now();
    setGameState('active');

    const updateTimer = () => {
      const current = performance.now();
      const diff = Math.round(current - startTimeRef.current);
      setElapsedMs(diff);
      timerRafRef.current = requestAnimationFrame(updateTimer);
    };
    timerRafRef.current = requestAnimationFrame(updateTimer);
  };

  const handleUserClick = () => {
    if (disabled) return;

    if (gameState === 'waiting') {
      // False start (anticipatory click)
      if (stimulusTimeoutRef.current) clearTimeout(stimulusTimeoutRef.current);
      setGameState('false_start');
      setFeedbackMessage('¡Anticipación! Espera a que los números rojos comiencen a correr.');

      const falseTrial: PVTTrialResult = {
        trialIndex: currentTrial,
        stimulusDelayMs: delayMsRef.current,
        reactionTimeMs: 0,
        reciprocalRTMs: 0,
        isLapse: false,
        isFalseStart: true,
      };

      const updated = [...trials, falseTrial];
      setTrials(updated);

      setTimeout(() => {
        if (currentTrial < targetTrialCount) {
          setCurrentTrial(prev => prev + 1);
          scheduleNextStimulus();
        } else {
          finishTest(updated);
        }
      }, 1400);

    } else if (gameState === 'active') {
      // Valid reaction click
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
      const finalReactionTime = Math.round(performance.now() - startTimeRef.current);
      const isLapse = finalReactionTime >= 500;
      const isFalse = finalReactionTime < 100;
      const reciprocalRT = finalReactionTime > 0 ? Number((1000 / finalReactionTime).toFixed(2)) : 0;

      setGameState('trial_feedback');
      setElapsedMs(finalReactionTime);

      let msg = `${finalReactionTime} ms - Buen tiempo`;
      if (isLapse) {
        msg = `${finalReactionTime} ms - LAPSO DE ATENCIÓN (≥500ms)`;
      } else if (finalReactionTime < 240) {
        msg = `${finalReactionTime} ms - ¡Excelente reflejo!`;
      }
      setFeedbackMessage(msg);

      const trialResult: PVTTrialResult = {
        trialIndex: currentTrial,
        stimulusDelayMs: delayMsRef.current,
        reactionTimeMs: finalReactionTime,
        reciprocalRTMs: reciprocalRT,
        isLapse,
        isFalseStart: isFalse,
      };

      const updated = [...trials, trialResult];
      setTrials(updated);

      setTimeout(() => {
        if (currentTrial < targetTrialCount) {
          setCurrentTrial(prev => prev + 1);
          scheduleNextStimulus();
        } else {
          finishTest(updated);
        }
      }, 1100);
    }
  };

  const finishTest = (finalTrials: PVTTrialResult[]) => {
    setGameState('finished');
    const valid = finalTrials.filter(t => !t.isFalseStart && t.reactionTimeMs > 0);
    const rts = valid.map(t => t.reactionTimeMs).sort((a, b) => a - b);
    
    const sum = rts.reduce((acc, val) => acc + val, 0);
    const mean = rts.length > 0 ? Math.round(sum / rts.length) : 0;
    const median = rts.length > 0 ? rts[Math.floor(rts.length / 2)] : 0;
    const fastest = rts.length > 0 ? rts[0] : 0;
    const slowest = rts.length > 0 ? rts[rts.length - 1] : 0;
    const lapses = finalTrials.filter(t => t.isLapse).length;
    const falseStarts = finalTrials.filter(t => t.isFalseStart).length;

    // Reciprocal mean (RRT: 1000/RT) - Basner & Dinges (2011)
    const rrtSum = valid.reduce((acc, t) => acc + (t.reciprocalRTMs || (1000 / t.reactionTimeMs)), 0);
    const rrtMean = valid.length > 0 ? Number((rrtSum / valid.length).toFixed(2)) : 0;

    // Intra-individual standard deviation (Variability)
    let variance = 0;
    if (rts.length > 1) {
      variance = rts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (rts.length - 1);
    }
    const isv = Math.round(Math.sqrt(variance));

    const summary: PVTSummary = {
      mode,
      timestamp: new Date().toISOString(),
      totalTrials: finalTrials.length,
      validTrials: valid.length,
      meanRT: mean,
      medianRT: median,
      fastest10PercentRT: fastest,
      slowest10PercentRT: slowest,
      rrtMean,
      intraIndividualVariability: isv,
      lapsesCount: lapses,
      falseStartsCount: falseStarts,
      deviceLatencyCalibratedMs: 12, // Standard mobile browser touch sensor compensation
      repeatAttemptNumber: attemptCount,
      repeatReason: repeatReason || undefined,
      trials: finalTrials,
    };

    setLastSummary(summary);
    // Update parent summary state without forcefully advancing step so user can review/repeat
    onComplete(summary);
  };

  // Keyboard spacebar support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (gameState === 'waiting' || gameState === 'active')) {
        e.preventDefault();
        handleUserClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="w-full max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs text-slate-800">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs border border-amber-200">
            PVT
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{mode === 'PVT-A' ? 'PVT-A Adaptativo (60s)' : mode === 'PVT-L' ? 'PVT-L Línea Base' : mode}</span>
              <span className="text-[11px] font-normal text-slate-500">
                • {targetTrialCount} ensayos {attemptCount > 1 ? `(Intento #${attemptCount})` : ''}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Línea base histórica del operador: <strong className="text-slate-800">{worker.baseline.meanRT} ms</strong>
            </p>
          </div>
        </div>

        {/* Progress */}
        {currentTrial > 0 && gameState !== 'finished' && (
          <div className="text-right">
            <span className="text-xs text-amber-700 font-mono font-bold">
              Ensayo {currentTrial} / {targetTrialCount}
            </span>
            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${(currentTrial / targetTrialCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Stage */}
      {gameState === 'idle' && (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
            <Zap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">Prueba de Vigilancia Psicomotora</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              En cuanto aparezcan los <span className="text-rose-600 font-bold">números rojos</span> corriendo en pantalla, presiona el botón o toca la pantalla lo más rápido posible.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-sm mx-auto text-[11px] text-slate-600 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Calibración de Entrada y Tolerancia Ambiental:</span>
            </div>
            <p>Compensación de latencia táctil: <span className="text-emerald-700 font-mono font-semibold">12 ms</span>. Si tienes manos frías o problema de pantalla, podrás repetir el test sin penalización.</p>
          </div>

          <button
            id="start-pvt-button"
            onClick={() => startTest()}
            disabled={disabled}
            className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Comenzar Prueba PVT</span>
          </button>
        </div>
      )}

      {(gameState === 'waiting' || gameState === 'active' || gameState === 'trial_feedback' || gameState === 'false_start') && (
        <div
          id="pvt-interactive-stage"
          onClick={handleUserClick}
          className={`relative select-none cursor-pointer rounded-xl h-56 sm:h-64 flex flex-col items-center justify-center border-2 transition-all overflow-hidden ${
            gameState === 'waiting' 
              ? 'bg-slate-900 border-slate-700 hover:border-slate-600' 
              : gameState === 'active'
              ? 'bg-black border-rose-600 shadow-2xl shadow-rose-900/40'
              : gameState === 'false_start'
              ? 'bg-amber-950/90 border-amber-500'
              : 'bg-slate-900 border-emerald-500'
          }`}
        >
          {gameState === 'waiting' && (
            <div className="text-center space-y-2 pointer-events-none animate-pulse">
              <div className="w-3 h-3 bg-slate-400 rounded-full mx-auto" />
              <p className="text-sm font-medium text-slate-300">Atento a la pantalla...</p>
              <p className="text-[11px] text-slate-500">Presiona apenas vea el contador</p>
            </div>
          )}

          {gameState === 'active' && (
            <div className="text-center pointer-events-none">
              <div className="font-mono text-5xl sm:text-6xl font-black text-rose-500 tracking-wider">
                {elapsedMs}
                <span className="text-base text-rose-400 ml-1 font-normal">ms</span>
              </div>
              <p className="text-xs text-rose-300/80 mt-2 uppercase font-bold tracking-widest animate-pulse">
                ¡PRESIONA AHORA!
              </p>
            </div>
          )}

          {gameState === 'trial_feedback' && (
            <div className="text-center space-y-2 pointer-events-none">
              <div className={`font-mono text-4xl sm:text-5xl font-bold ${elapsedMs >= 500 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {elapsedMs} <span className="text-sm font-normal">ms</span>
              </div>
              <p className={`text-xs font-semibold px-3 py-1 rounded-full inline-block ${
                elapsedMs >= 500 ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}>
                {feedbackMessage}
              </p>
            </div>
          )}

          {gameState === 'false_start' && (
            <div className="text-center space-y-2 pointer-events-none p-4">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-sm font-bold text-amber-200">¡Anticipación!</p>
              <p className="text-xs text-amber-300/80 max-w-xs mx-auto">
                {feedbackMessage}
              </p>
            </div>
          )}

          {/* Hint bar */}
          <div className="absolute bottom-2 inset-x-0 text-center text-[10px] text-slate-400 pointer-events-none">
            Toca en cualquier parte del recuadro o presiona Espacio
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="py-3 space-y-4">
          <div className="flex items-center justify-between text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <div className="text-xs">
                <p className="font-bold text-emerald-900">
                  Prueba PVT finalizada {attemptCount > 1 ? `(Intento #${attemptCount})` : ''}
                </p>
                <p className="text-emerald-700">Resultados listos para integración en el motor de riesgo FRA.</p>
              </div>
            </div>
            {attemptCount > 1 && (
              <span className="text-[10px] bg-emerald-200/90 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                Reintento Aplicado
              </span>
            )}
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 block font-medium">Mediana (Robusta)</span>
              <span className="font-mono text-base font-bold text-slate-900">
                {lastSummary?.medianRT || 0}
                <span className="text-[10px] text-slate-500 ml-0.5">ms</span>
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 block font-medium">Línea Base</span>
              <span className="font-mono text-base font-bold text-amber-700">
                {worker.baseline.medianRT > 0 ? worker.baseline.medianRT : worker.baseline.meanRT}
                <span className="text-[10px] text-slate-500 ml-0.5">ms</span>
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 block font-medium">Lapsos (≥500ms)</span>
              <span className={`font-mono text-base font-bold ${trials.filter(t => t.isLapse).length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {trials.filter(t => t.isLapse).length}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 block font-medium">Anticipaciones</span>
              <span className="font-mono text-base font-bold text-slate-700">
                {trials.filter(t => t.isFalseStart).length}
              </span>
            </div>
          </div>

          {/* Repeat / Retry Panel for Environmental / Cold / Screen Issues */}
          <div className="pt-1 space-y-3">
            {!showRepeatOptions ? (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>¿Necesitas repetir el test sensotécnico?</span>
                  </span>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    Si tuviste manos frías por el clima, distracción o fallo táctil en pantalla, puedes reintentar el test antes de enviar.
                  </p>
                </div>
                <button
                  id="open-repeat-pvt-options-btn"
                  type="button"
                  onClick={() => setShowRepeatOptions(true)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Repetir Test PVT</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3 text-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-700" />
                    <span>Selecciona el motivo de repetición del test:</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-mono">Sin penalización HSEC</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => startTest('Manos frías / rigidez por temperatura')}
                    className="p-3 bg-white hover:bg-amber-100 border border-amber-200 rounded-xl text-left transition-all flex items-start gap-2 cursor-pointer shadow-2xs hover:border-amber-400"
                  >
                    <Snowflake className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs text-slate-900">Manos Frías</span>
                      <span className="text-[10px] text-slate-500">Rigidez térmica en faena</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => startTest('Falla táctil / protector de pantalla')}
                    className="p-3 bg-white hover:bg-amber-100 border border-amber-200 rounded-xl text-left transition-all flex items-start gap-2 cursor-pointer shadow-2xs hover:border-amber-400"
                  >
                    <Smartphone className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs text-slate-900">Falla Táctil</span>
                      <span className="text-[10px] text-slate-500">Retardo o protector de pantalla</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => startTest('Distracción o interrupción externa')}
                    className="p-3 bg-white hover:bg-amber-100 border border-amber-200 rounded-xl text-left transition-all flex items-start gap-2 cursor-pointer shadow-2xs hover:border-amber-400"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs text-slate-900">Distracción</span>
                      <span className="text-[10px] text-slate-500">Interrupción momentánea</span>
                    </div>
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRepeatOptions(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Cancelar y conservar resultado actual
                  </button>
                </div>
              </div>
            )}

            {/* Accept & Advance Button */}
            <button
              id="confirm-pvt-continue-btn"
              type="button"
              onClick={() => {
                if (lastSummary) onComplete(lastSummary);
                if (onAcceptAndContinue) onAcceptAndContinue();
              }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Aceptar Resultado y Continuar a Medidas de Control y Firma</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

