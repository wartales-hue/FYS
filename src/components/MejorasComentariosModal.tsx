import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  CheckCircle2, 
  History,
  Sparkles,
  Ticket,
  Mail,
  User,
  Copy,
  Check,
  HelpCircle,
  AlertCircle,
  ThumbsUp,
  ShieldCheck
} from 'lucide-react';
import { WorkerProfile, UserRole } from '../types';
import { formatRut } from '../lib/rutValidator';

export type FeedbackCategory = 
  | 'mejora' 
  | 'consulta' 
  | 'reclamo' 
  | 'comentario' 
  | 'reporte_faena' 
  | 'felicitacion';

export interface CommentSubmission {
  id: string;
  correlativeNumber: string;
  category: FeedbackCategory;
  name: string;
  rut: string;
  correo: string;
  comentario: string;
  timestamp: string;
  status: 'enviado';
}

const STORAGE_KEY_FEEDBACK_HISTORY = 'oplira_mejoras_comentarios_history';
const STORAGE_KEY_DAILY_LIMIT = 'oplira_last_feedback_date';

export const getStoredComments = (): CommentSubmission[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(STORAGE_KEY_FEEDBACK_HISTORY);
      if (data) return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading stored comments:', e);
  }
  return [];
};

export const hasSentToday = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const lastDate = localStorage.getItem(STORAGE_KEY_DAILY_LIMIT);
      const today = new Date().toISOString().split('T')[0];
      return lastDate === today;
    }
  } catch (e) {}
  return false;
};

interface MejorasComentariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: WorkerProfile;
  currentRole: UserRole;
}

export const MejorasComentariosModal: React.FC<MejorasComentariosModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [categoria, setCategoria] = useState<FeedbackCategory>('mejora');
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [correo, setCorreo] = useState('');
  const [comentarios, setComentarios] = useState('');

  const [alreadySentToday, setAlreadySentToday] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<CommentSubmission[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNombre(currentUser?.name || '');
      setRut(currentUser?.rut || '');
      setCorreo(currentUser?.supervisorEmail || 'wartales@gmail.com');
      setComentarios('');
      setSubmittedTicket(null);
      setCopiedText(false);
      setShowHistory(false);
      setAlreadySentToday(hasSentToday());
      setHistoryList(getStoredComments());
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const getCategoryLabel = (cat: FeedbackCategory) => {
    switch (cat) {
      case 'mejora':
        return 'Solicitud de Mejora';
      case 'consulta':
        return 'Consulta Operacional';
      case 'reclamo':
        return 'Reclamo o Inconformidad';
      case 'reporte_faena':
        return 'Reporte Preventivo de Fatiga';
      case 'felicitacion':
        return 'Felicitación / Agradecimiento';
      default:
        return 'Comentario General';
    }
  };

  const getFormattedMessage = (correlative: string) => {
    return `SISTEMA OPLIRA FYS - BUZÓN OFICIAL DE MEJORAS Y COMENTARIOS
----------------------------------------------------------------------
N° CORRELATIVO: #${correlative}
TIPO DE SOLICITUD: ${getCategoryLabel(categoria).toUpperCase()}
FECHA Y HORA: ${new Date().toLocaleString('es-CL')}

DATOS DEL REMITENTE:
• Nombre: ${nombre.trim()}
• RUT: ${rut.trim() || 'No especificado'}
• Correo Electrónico: ${correo.trim()}

COMENTARIOS / MENSAJE:
${comentarios.trim()}
----------------------------------------------------------------------
Enviado desde Oplira SGFS`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (alreadySentToday) return;

    if (!nombre.trim() || !correo.trim() || !comentarios.trim()) {
      return;
    }

    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const correlative = `MC-${year}-${randomSeq}`;

    const newSubmission: CommentSubmission = {
      id: `sub-${Date.now()}`,
      correlativeNumber: correlative,
      category: categoria,
      name: nombre.trim(),
      rut: rut.trim() ? formatRut(rut.trim()) : '',
      correo: correo.trim(),
      comentario: comentarios.trim(),
      timestamp: new Date().toISOString(),
      status: 'enviado'
    };

    try {
      const list = getStoredComments();
      list.unshift(newSubmission);
      localStorage.setItem(STORAGE_KEY_FEEDBACK_HISTORY, JSON.stringify(list));
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEY_DAILY_LIMIT, today);
      setHistoryList(list);
    } catch (err) {
      console.warn('Error saving submission:', err);
    }

    const fullBody = getFormattedMessage(correlative);
    const emailSubject = encodeURIComponent(`[${getCategoryLabel(categoria)}] #${correlative} - ${nombre.trim()}`);
    const mailtoUrl = `mailto:wartales@hotmail.com?subject=${emailSubject}&body=${encodeURIComponent(fullBody)}`;

    if (typeof window !== 'undefined') {
      window.location.href = mailtoUrl;
    }

    setSubmittedTicket(correlative);
    setAlreadySentToday(true);
  };

  const handleCopyClipboard = (correlative: string) => {
    const text = getFormattedMessage(correlative);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 3000);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[92vh] overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Buzón de Sugerencias
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                Mejoras o Comentarios
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer border border-slate-700"
              title="Ver historial de envíos previos"
            >
              <History className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Historial ({historyList.length})</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white space-y-4 text-xs text-slate-700">
          {showHistory ? (
            /* History view */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900 text-sm">Mis Envíos Anteriores</span>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer"
                >
                  ← Volver al Formulario
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-1">
                  <p>No tienes envíos registrados en este dispositivo.</p>
                </div>
              ) : (
                historyList.map((item) => (
                  <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                          #{item.correlativeNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-200">
                          {getCategoryLabel(item.category || 'mejora')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {item.comentario}
                    </p>
                    <div className="text-[10px] text-slate-500 flex flex-wrap gap-2 pt-1 border-t border-slate-200">
                      <span>Remitente: <strong>{item.name}</strong> {item.rut ? `(${item.rut})` : ''}</span>
                      <span>•</span>
                      <span>Correo: {item.correo}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : submittedTicket ? (
            /* Success confirmation card */
            <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-center space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                  Comentario Registrado con Éxito
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  N° Correlativo: #{submittedTicket}
                </h3>
              </div>
              <p className="text-xs text-emerald-950 max-w-md mx-auto leading-relaxed">
                Tu solicitud ha sido registrada para su despacho a <strong>wartales@hotmail.com</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyClipboard(submittedTicket)}
                  className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>¡Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Copiar Reporte Completo</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Cerrar Ventana
                </button>
              </div>
            </div>
          ) : (
            /* Main Simple Form: Category Dropdown, Name, RUT, Email, Comments */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {alreadySentToday && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  ℹ️ Ya has enviado una solicitud hoy. Puedes registrar un nuevo envío mañana.
                </div>
              )}

              {/* 1. Tipo de Solicitud (Dropdown desplegable) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-xs">
                  Tipo de Solicitud:
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as FeedbackCategory)}
                  disabled={alreadySentToday}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <option value="mejora">Solicitud de Mejora</option>
                  <option value="consulta">Consulta Operacional</option>
                  <option value="reclamo">Reclamo o Inconformidad</option>
                  <option value="comentario">Comentario General</option>
                  <option value="felicitacion">Felicitación / Agradecimiento</option>
                  <option value="reporte_faena">Reporte Preventivo de Fatiga</option>
                </select>
              </div>

              {/* 2. Nombre */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-xs flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>Nombre Completo:</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez Morales"
                  required
                  disabled={alreadySentToday}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* 3. RUT */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-xs flex items-center gap-1">
                  <Ticket className="w-3 h-3 text-slate-500" />
                  <span>RUT:</span>
                </label>
                <input
                  type="text"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="Ej: 12.345.678-9"
                  disabled={alreadySentToday}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-mono font-medium text-xs transition-colors"
                />
              </div>

              {/* 4. Mail */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-xs flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>Correo Electrónico:</span>
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="Ej: usuario@empresa.cl"
                  required
                  disabled={alreadySentToday}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              {/* 5. Cajón de Comentarios */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-xs">
                  Cajón de Comentarios:
                </label>
                <textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Escribe aquí tu comentario, mejora, consulta o sugerencia..."
                  required
                  rows={5}
                  disabled={alreadySentToday}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-slate-900 text-xs leading-relaxed transition-colors resize-none"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={alreadySentToday || !comentarios.trim() || !nombre.trim() || !correo.trim()}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Enviar Comentario</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
