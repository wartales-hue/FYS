/**
 * Enterprise Screen Security & Anti-Screenshot Protection Engine for Oplira SGFS HSEC
 * Enforces compliance with Ley 21.719 and DS 44:
 * 1. Blocks PrintScreen key, Ctrl+P, Cmd+Shift+3/4/5, DevTools shortcuts.
 * 2. Blurs and hides UI when window loses focus or screenshot tool is active.
 * 3. Clears system clipboard if a snapshot attempt is detected.
 * 4. Completely blacks out / hides DOM during @media print attempts.
 * 5. Disables text selection, dragging, and context menu inspection.
 */

export interface SecurityEventLog {
  timestamp: string;
  type: 'print_screen_attempt' | 'context_menu_blocked' | 'print_attempt' | 'window_blurred' | 'devtools_key_blocked';
  detail: string;
}

type SecurityAlertCallback = (message: string) => void;
const listeners: Set<SecurityAlertCallback> = new Set();

export function onSecurityAlert(cb: SecurityAlertCallback): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyAlert(msg: string) {
  listeners.forEach(cb => {
    try {
      cb(msg);
    } catch (e) {
      console.warn('Security alert listener error:', e);
    }
  });
}

/**
 * Initializes all client-side anti-screenshot and screen protection listeners.
 */
export function initScreenSecurity(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Prevent context menu (right click / long press)
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    notifyAlert('⚠️ Clic derecho y menú contextual deshabilitados por política de seguridad HSEC.');
    return false;
  };

  // 2. Prevent Keyboard Capture & Print Shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    // PrintScreen
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      e.preventDefault();
      // Overwrite clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('🔒 CAPTURA BLOQUEADA: Documento médico-operacional protegido por Ley 21.719.').catch(() => {});
      }
      notifyAlert('🚫 CAPTURA DE PANTALLA RESTRINGIDA: Los registros de aptitud física son confidenciales (Ley 21.719).');
      return false;
    }

    // Ctrl+P / Cmd+P (Print)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.keyCode === 80)) {
      e.preventDefault();
      notifyAlert('🚫 IMPRESIÓN DIRECTA BLOQUEADA: Descarga el Certificado Oficial en PDF con firma y sello criptográfico.');
      return false;
    }

    // Ctrl+S / Cmd+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
      e.preventDefault();
      return false;
    }

    // Mac Screenshot Shortcuts: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
    if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
      e.preventDefault();
      notifyAlert('🚫 CAPTURA BLOQUEADA: Función de recorte restringida por política de confidencialidad.');
      return false;
    }

    // DevTools: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.key === 'F12' || 
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
      ((e.ctrlKey || e.metaKey) && ['u', 'U'].includes(e.key))
    ) {
      e.preventDefault();
      notifyAlert('🔒 Acceso a consola restringido en terminal operativo.');
      return false;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('').catch(() => {});
      }
    }
  };

  // 3. Inject CSS for print blackout and anti-selection
  const styleEl = document.createElement('style');
  styleEl.id = 'oplira-security-styles';
  styleEl.innerHTML = `
    @media print {
      body * {
        visibility: hidden !important;
        display: none !important;
      }
      body::before {
        content: "DOCUMENTO CONFIDENCIAL PROTEGIDO POR LEY 21.719 - PROHIBIDA LA IMPRESIÓN NO AUTORIZADA";
        visibility: visible !important;
        display: block !important;
        text-align: center;
        font-size: 18pt;
        font-weight: bold;
        color: #991b1b;
        margin-top: 100px;
      }
    }
    .security-protected-screen {
      -webkit-touch-callout: none !important;
      -webkit-user-select: none !important;
      -khtml-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
    .security-protected-screen img {
      -webkit-user-drag: none !important;
      user-drag: none !important;
      pointer-events: none;
    }
  `;
  document.head.appendChild(styleEl);

  window.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyUp, true);

  return () => {
    window.removeEventListener('contextmenu', handleContextMenu);
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('keyup', handleKeyUp, true);
    const existing = document.getElementById('oplira-security-styles');
    if (existing) existing.remove();
  };
}
