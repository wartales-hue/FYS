import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, 
  ExternalLink, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  RotateCw,
  Award,
  Zap,
  ShieldAlert,
  Info,
  CheckCircle2,
  HeartHandshake,
  Lock
} from 'lucide-react';
import { UserRole } from '../types';
import { detectAdBlocker, onAdBlockStatusChange, AdBlockStatus, attachDomGuardian } from '../lib/adBlockDetector';

interface AdItem {
  id: string;
  category: string;
  sponsorName: string;
  sponsorBadge: string;
  badgeColor: string;
  title: string;
  description: string;
  actionTip: string;
  ctaText: string;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
  sponsorLogoText: string;
}

const WORKER_ADS: AdItem[] = [
  {
    id: 'w-1',
    category: 'HIGIENE DEL SUEÑO EN FAENA',
    sponsorName: 'SomnoRest Camp®',
    sponsorBadge: 'Acreditado Minería',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    title: 'Módulos de Aislamiento Acústico y Regulación Circadiana',
    description: 'Mejora tu calidad de sueño en faena con cortinas blackout térmicas y colchones ergonómicos diseñados para altura geográfica.',
    actionTip: '💡 Consejo: Mantén tu habitación en campamento a 19°C para facilitar la conciliación de sueño profundo.',
    ctaText: 'Ver Guía de Sueño',
    iconBg: 'bg-indigo-600 text-white',
    iconColor: 'text-indigo-600',
    accentBorder: 'border-indigo-200/80 hover:border-indigo-300',
    sponsorLogoText: 'SOMNO-REST',
  },
  {
    id: 'w-2',
    category: 'EPP & ERGONOMÍA OPERACIONAL',
    sponsorName: '3M Peltor™ Mining',
    sponsorBadge: 'EPP Certificado',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    title: 'Protectores Auditivos Inteligentes con Comunicación Segura',
    description: 'Atenuación activa de ruidos de maquinaria pesada sin perder la comunicación radial ni las alertas críticas en cabina de camiones CAEX.',
    actionTip: '💡 Consejo: La exposición prolongada a ruido >85 dB acelera la fatiga del sistema nervioso central.',
    ctaText: 'Explorar Catálogo EPP',
    iconBg: 'bg-emerald-600 text-white',
    iconColor: 'text-emerald-600',
    accentBorder: 'border-emerald-200/80 hover:border-emerald-300',
    sponsorLogoText: '3M-PELTOR',
  },
  {
    id: 'w-3',
    category: 'HIDRATACIÓN & NUTRICIÓN EN ALTURA',
    sponsorName: 'ElectroFaena™ IsoDrink',
    sponsorBadge: 'Salud Ocupacional',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    title: 'Puntos de Hidratación Isotónica con Electrolitos en Terreno',
    description: 'Combate la deshidratación por gran altitud (hipoxia) y previene la fatiga prematura con sales minerales sin azúcares añadidos.',
    actionTip: '💡 Consejo: En faena a >3.000m bebe 250ml de agua o electrolitos cada 90 minutos de turno.',
    ctaText: 'Conocer Beneficio Faena',
    iconBg: 'bg-cyan-600 text-white',
    iconColor: 'text-cyan-600',
    accentBorder: 'border-cyan-200/80 hover:border-cyan-300',
    sponsorLogoText: 'ELECTRO-FAENA',
  },
  {
    id: 'w-4',
    category: 'PREVENCIÓN MUTUALIDADES',
    sponsorName: 'Mutual de Seguridad CChC',
    sponsorBadge: 'Campaña Cero Fatalidad',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    title: 'Protocolo de Autocuidado y Pausas Activas en Ruta',
    description: 'Aplica los 5 minutos de estiramiento y oxigenación antes de abordar tu turno. Tu familia te espera de vuelta seguro.',
    actionTip: '💡 Consejo: La fatiga es el factor causal en el 35% de incidentes viales mineros en ruta.',
    ctaText: 'Descargar Protocolo',
    iconBg: 'bg-teal-600 text-white',
    iconColor: 'text-teal-600',
    accentBorder: 'border-teal-200/80 hover:border-teal-300',
    sponsorLogoText: 'MUTUAL-CChC',
  }
];

const SUPERVISOR_ADS: AdItem[] = [
  {
    id: 's-1',
    category: 'TELEMETRÍA & DETECCIÓN IoT',
    sponsorName: 'MineStar™ Driver Safety',
    sponsorBadge: 'Integración API Oplira',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    title: 'Cámaras de Fatiga Inteligentes y Sensores DMS para Cabinas CAEX',
    description: 'Correlaciona en tiempo real las evaluaciones pre-turno de Oplira con alertas de microsueño y distracciones en ruta con telemetría satelital.',
    actionTip: '💡 Gestión: Operadores en amarillo deben monitorearse en el dashboard telemático con mayor frecuencia.',
    ctaText: 'Solicitar Demostración',
    iconBg: 'bg-blue-600 text-white',
    iconColor: 'text-blue-600',
    accentBorder: 'border-blue-200/80 hover:border-blue-300',
    sponsorLogoText: 'MINESTAR-IOT',
  },
  {
    id: 's-2',
    category: 'CUMPLIMIENTO NORMATIVO & AUDITORÍA',
    sponsorName: 'Mutual Minera Consultores',
    sponsorBadge: 'Normativa DS 44 / 2024',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    title: 'Acreditación y Auditoría para Comités Paritarios de Faena',
    description: 'Capacitación presencial y digital en gestión del riesgo de fatiga y protocolos de intervención con validez legal ante Sernageomin y SUSESO.',
    actionTip: '💡 Legal: El acta digital firmada con SHA-256 es requerimiento del protocolo SGFS.',
    ctaText: 'Ver Programa Formativo',
    iconBg: 'bg-purple-600 text-white',
    iconColor: 'text-purple-600',
    accentBorder: 'border-purple-200/80 hover:border-purple-300',
    sponsorLogoText: 'AUDIT-MINERA',
  },
  {
    id: 's-3',
    category: 'SALUD OCUPACIONAL & SOMNOLOGÍA',
    sponsorName: 'Dräger & MedMinera',
    sponsorBadge: 'Red Norte Grande',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    title: 'Poligrafías y Tratamiento de Apnea Obstructiva del Sueño en Turnos 7x7',
    description: 'Disminuye la tasa de rechazo pre-turno mediante CPAP portátil y seguimiento médico continuo a operadores de alto riesgo.',
    actionTip: '💡 Médico: El SAHOS no tratado duplica el riesgo de eventos de microsueño en la madrugada.',
    ctaText: 'Contactar Especialista',
    iconBg: 'bg-amber-600 text-white',
    iconColor: 'text-amber-600',
    accentBorder: 'border-amber-200/80 hover:border-amber-300',
    sponsorLogoText: 'DRAGER-SOMNO',
  }
];

interface AdBannerProps {
  role: UserRole;
  className?: string;
  onOpenUpgradeModal?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ role, className = '', onOpenUpgradeModal }) => {
  const [adIndex, setAdIndex] = useState(0);
  const [adBlockStatus, setAdBlockStatus] = useState<AdBlockStatus>({ isBlocked: false });
  const [tipCopied, setTipCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Run active multi-vector adblock probe on mount
    detectAdBlocker();
    const unsub = onAdBlockStatusChange((st) => {
      setAdBlockStatus(st);
    });

    // Attach Self-Healing DOM Guardian (Item 5 Protection)
    let detachGuardian: (() => void) | undefined;
    if (containerRef.current) {
      detachGuardian = attachDomGuardian(containerRef.current, (tamperMsg) => {
        console.warn('DOM Guardian:', tamperMsg);
      });
    }

    return () => {
      unsub();
      if (detachGuardian) detachGuardian();
    };
  }, []);

  const ads = role === 'worker' ? WORKER_ADS : SUPERVISOR_ADS;
  const currentAd = ads[adIndex % ads.length];

  const handleNextAd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdIndex((prev) => (prev + 1) % ads.length);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(`${currentAd.sponsorName} - ${currentAd.title}: ${currentAd.actionTip}`).catch(() => {});
      setTipCopied(true);
      setTimeout(() => setTipCopied(false), 3000);
    }
  };

  return (
    <div 
      ref={containerRef}
      id="oplira-circadian-health-module"
      data-module-type="hsec-operational-protocol"
      className={`oplira-hsec-brief-container space-y-1.5 ${className}`}
    >
      {/* 
        Anti-AdBlock Architecture:
        1. Class names are functional and non-ad-labeled (prevents uBlock / EasyList cosmetic selectors).
        2. Content is delivered 100% First-Party Native (immune to Pi-hole, AdAway, DNS blocking).
        3. Protected by attachDomGuardian against forced display:none injections.
      */}
      <div
        className={`w-full bg-gradient-to-r from-white via-slate-50 to-white rounded-2xl border ${currentAd.accentBorder} shadow-xs p-4 relative overflow-hidden transition-all`}
      >
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Side: Badge + Icon + Text */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Ad Icon Box */}
            <div className={`w-10 h-10 rounded-xl ${currentAd.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 font-mono text-[10px] font-black text-white`}>
              <Sparkles className="w-5 h-5 fill-white" />
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              {/* Header tag and sponsor info */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1">
                  <Megaphone className="w-2.5 h-2.5 text-indigo-600" />
                  <span>PUBLICIDAD • PATROCINIO HSEC</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-black text-slate-900">{currentAd.sponsorName}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentAd.badgeColor}`}>
                  {currentAd.sponsorBadge}
                </span>
                {adBlockStatus.isBlocked && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                    Contenido Nativo Blindado
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                {currentAd.title}
              </h4>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {currentAd.description}
              </p>

              {/* Scientific / Ergonomic Action Tip */}
              <p className="text-[11px] text-indigo-900 bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 rounded-lg font-medium">
                {currentAd.actionTip}
              </p>
            </div>
          </div>

          {/* Right Side: CTA Button + Rotate controls */}
          <div className="flex items-center gap-2.5 flex-shrink-0 self-end md:self-center">
            {/* Rotate Ad button */}
            <button
              onClick={handleNextAd}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Ver siguiente patrocinador de seguridad"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Call to Action Button */}
            <button
              onClick={handleActionClick}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {tipCopied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Consejo Copiado!</span>
                </>
              ) : (
                <>
                  <span>{currentAd.ctaText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Discrete Anti-AdBlock & Free Tier Disclosure (Item 5) */}
      {adBlockStatus.isBlocked && (
        <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-center justify-between gap-2 flex-wrap animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Filtro de Anuncios Detectado:</strong> Oplira opera gratuitamente gracias a patrocinios de seguridad minera y EPP.
            </span>
          </div>
          {onOpenUpgradeModal && (
            <button
              onClick={onOpenUpgradeModal}
              className="text-[10px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Remover Anuncios con Plan Pro ($0.99 USD)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
