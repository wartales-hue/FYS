import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ThumbsUp, 
  Flame, 
  ShieldCheck,
  History,
  Sparkles,
  User,
  Building2,
  Mail
} from 'lucide-react';
import { WorkerProfile, UserRole } from '../types';
import { OpliraLogo } from './OpliraLogo';

export interface FeedbackEntry {
  id: string;
  type: 'sugerencia' | 'reclamo' | 'consulta' | 'reporte_faena' | 'felicitacion';
  title: string;
  description: string;
  userName: string;
  userRut: string;
  userRole: string;
  company: string;
  faena: string;
  isAnonymous: boolean;
  contactEmail?: string;
  timestamp: string;
  status: 'enviado' | 'en_revision' | 'resuelto';
}

const STORAGE_KEY_FEEDBACK = 'oplira_feedback_submissions';

export const getStoredFeedback = (): FeedbackEntry[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(STORAGE_KEY_FEEDBACK);
      if (data) return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading feedback:', e);
  }
  return [];
};

export const saveFeedbackEntry = (entry: FeedbackEntry): void => {
  try {
    const list = getStoredFeedback();
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving feedback:', e);
  }
};

interface FeedbackSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: WorkerProfile;
  currentRole: UserRole;
}

export const FeedbackSupportModal: React.FC<FeedbackSupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentRole
}) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackEntry['type']>('sugerencia');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [history, setHistory] = useState<FeedbackEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHistory(getStoredFeedback());
      setIsSuccess(false);
      setTitle('');
      setDescription('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newEntry: FeedbackEntry = {
      id: `fb-${Date.now()}`,
      type: feedbackType,
      title: title.trim(),
      description: description.trim(),
      userName: isAnonymous ? 'Anónimo (Trabajador Faena)' : (currentUser?.name || 'Usuario'),
      userRut: isAnonymous ? 'Protegido' : (currentUser?.rut || 'Sin RUT'),
      userRole: currentRole === 'worker' ? 'Trabajador / Operador' : currentRole === 'supervisor' ? 'Supervisor de Cuadrilla' : 'Subdirector HSEC',
      company: currentUser?.company || 'Faena Operacional',
      faena: currentUser?.faena || 'Faena Principal',
      isAnonymous,
      contactEmail: contactEmail.trim() || currentUser?.supervisorEmail || undefined,
      timestamp: new Date().toISOString(),
      status: 'enviado'
    };

    saveFeedbackEntry(newEntry);
    setHistory(getStoredFeedback());
    setIsSuccess(true);
  };

  const getTypeBadge = (type: FeedbackEntry['type']) => {
    switch (type) {
      case 'sugerencia':
        return { label: 'Sugerencia de Mejora', color: 'bg-blue-50 text-blue-800 border-blue-200', icon: <Sparkles className="w-3.5 h-3.5 text-blue-600" /> };
      case 'reclamo':
        return { label: 'Reclamo Operacional', color: 'bg-rose-50 text-rose-800 border-rose-200', icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> };
      case 'consulta':
        return { label: 'Consulta Técnica / Médica', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> };
      case 'reporte_faena':
        return { label: 'Reporte de Condición en Faena', color: 'bg-orange-50 text-orange-800 border-orange-200', icon: <Flame className="w-3.5 h-3.5 text-orange-600" /> };
      case 'felicitacion':
        return { label: 'Felicitación / Buen Desempeño', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" /> };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                Canal de Comunicación Directa & Mejora Continua
              </span>
              <h2 className="text-base font-bold text-white">
                Buzón de Comentarios, Reclamos y Sugerencias
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">¡Mensaje Enviado con Éxito!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Tu aporte ha sido registrado en el sistema de gestión de faena. El equipo de HSEC y Mejora Continua revisa permanentemente las retroalimentaciones de los trabajadores y supervisores.
              </p>
            </div>
            <div className="pt-3 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Enviar Otro Comentario
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Buzón
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
            {/* Top Toggle: New Message vs History */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    !showHistory ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Nuevo Comentario / Reclamo
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    showHistory ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Historial ({history.length})</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Rol: <strong className="text-slate-700">{currentRole === 'worker' ? 'Trabajador' : 'Supervisor'}</strong>
              </span>
            </div>

            {showHistory ? (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Aún no has registrado comentarios o reclamos.</p>
                    <p className="text-[11px]">Tus opiniones y sugerencias enviadas aparecerán guardadas aquí.</p>
                  </div>
                ) : (
                  history.map((item) => {
                    const badge = getTypeBadge(item.type);
                    return (
                      <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleString('es-CL')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{item.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                          <span>Remitente: <strong>{item.userName}</strong></span>
                          <span className="text-emerald-700 font-semibold">✓ Recepcionado</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block text-xs">
                    Tipo de Aporte o Solicitud:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { type: 'sugerencia', label: '💡 Sugerencia', desc: 'Mejora en faena' },
                      { type: 'reclamo', label: '⚠️ Reclamo', desc: 'Condición operacional' },
                      { type: 'consulta', label: '❓ Consulta', desc: 'Técnica o médica' },
                      { type: 'reporte_faena', label: '🔥 Reporte Faena', desc: 'Ruta, clima o equipo' },
                      { type: 'felicitacion', label: '👏 Felicitación', desc: 'Reconocimiento' },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setFeedbackType(item.type as any)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          feedbackType === item.type
                            ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300 font-bold text-blue-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs block">{item.label}</span>
                        <span className="text-[10px] text-slate-500 font-normal block">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-xs">
                    Asunto o Título Breve:
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Iluminación en área de descanso / Sugerencia sobre tiempos de pausa"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-xs text-slate-900 font-medium focus:outline-none transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-xs">
                    Detalle del Comentario, Sugerencia o Reclamo:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe claramente la situación, sugerencia o reclamo para que el equipo operacional pueda gestionarlo..."
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-xs text-slate-900 font-medium focus:outline-none transition-colors"
                  />
                </div>

                {/* Sender & Privacy settings */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="font-bold text-slate-800 text-xs">
                        Enviar de forma 100% Anónima
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Ley N° 21.719
                    </span>
                  </div>
                  {!isAnonymous && (
                    <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200">
                      <span>Remitente: <strong>{currentUser?.name || 'Trabajador de Turno'}</strong> ({currentUser?.rut || 'Sin RUT'})</span>
                      <span className="text-slate-400 font-mono">{currentUser?.faena || 'Faena'}</span>
                    </div>
                  )}
                </div>

                {/* Contact Email (Optional) */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-xs">
                    Correo de Contacto para Respuesta (Opcional):
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="tu.correo@faena.cl (si deseas recibir respuesta)"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-xs text-slate-900 font-medium focus:outline-none transition-colors"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                    <span>Enviar Comentario al Buzón de Faena</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
