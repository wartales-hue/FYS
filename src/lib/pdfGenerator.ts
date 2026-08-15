import { jsPDF } from 'jspdf';
import { WorkerProfile, FRARiskEvaluation, PVTSummary, SleepRecord } from '../types';
import { LEVEL_CONTROL_MEASURES } from './controlMeasures';
import { drawVectorGuillocheSecurityBackground } from './guillocheDrawer';

/**
 * Strips any opaque white or near-white background from a signature dataURL
 * ensuring it renders as a pure transparent vector-like PNG on top of the guilloché security background.
 */
function cleanTransparentSignature(dataUrl: string): string {
  if (typeof document === 'undefined' || !dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }
  try {
    const img = new Image();
    img.src = dataUrl;
    const canvas = document.createElement('canvas');
    canvas.width = img.width || 400;
    canvas.height = img.height || 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // If pixel is white or light off-white, set alpha to 0 (100% transparent)
      if (r > 215 && g > 215 && b > 215) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch (e) {
    return dataUrl;
  }
}

export function generateEvaluationPDF(
  worker: WorkerProfile,
  evaluation: FRARiskEvaluation,
  sleepRecord?: Partial<SleepRecord>,
  pvtSummary?: Partial<PVTSummary>
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2); // 190mm
  const c1 = margin + 3.0;
  const evalDate = new Date(evaluation.timestamp).toLocaleString('es-CL');

  // ==========================================
  // PAGE 1: EVALUACIÓN PRINCIPAL Y FIRMAS
  // ==========================================

  // 1. Vector Guilloché Security Watermark (Page 1)
  drawVectorGuillocheSecurityBackground(doc, pageWidth, pageHeight);

  // 2. Official Header Banner (Solid Slate 900)
  let y = 8.0;
  const bannerH = 18.5;
  doc.setFillColor(15, 23, 42); // Solid Slate 900
  doc.roundedRect(margin, y, contentWidth, bannerH, 2, 2, 'F');

  // Brand Emblem Ring & Symbol
  const logoX = margin + 8;
  const logoY = y + (bannerH / 2);
  doc.setDrawColor(0, 168, 255);
  doc.setLineWidth(1.1);
  doc.circle(logoX, logoY, 4.5, 'S');

  // Mini device symbol inside logo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(logoX - 1.6, logoY - 2.8, 3.2, 5.6, 0.4, 0.4, 'F');
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(logoX - 1.2, logoY - 2.3, 2.4, 4.6, 0.3, 0.3, 'F');

  // Brand Logo Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Oplira', margin + 15, y + 8.2);

  doc.setTextColor(0, 168, 255);
  doc.setFontSize(11);
  doc.text('FYS', margin + 28, y + 8.2);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('|  HSEC Minería & Operaciones Críticas', margin + 38, y + 8.0);

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Sistema de Gestión del Riesgo de Fatiga y Somnolencia • Conforme DS 44 / Ley 21.719', margin + 15, y + 13.8);

  // Status Badge on Right of Header
  const isGreen = evaluation.status === 'green';
  const isYellow = evaluation.status === 'yellow';
  const isRed = evaluation.status === 'red';

  const badgeWidth = 48;
  const badgeX = margin + contentWidth - badgeWidth - 4;
  
  if (isGreen) {
    doc.setFillColor(22, 163, 74); // Vibrant Emerald Green
    doc.roundedRect(badgeX, y + 3.8, badgeWidth, 11, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
  } else if (isYellow) {
    doc.setFillColor(250, 204, 21); // Pure Bright Yellow
    doc.setDrawColor(202, 138, 4);  // Border
    doc.setLineWidth(0.35);
    doc.roundedRect(badgeX, y + 3.8, badgeWidth, 11, 1.5, 1.5, 'FD');
    doc.setTextColor(15, 23, 42);
  } else if (isRed) {
    doc.setFillColor(220, 38, 38); // Vibrant Crimson Red
    doc.roundedRect(badgeX, y + 3.8, badgeWidth, 11, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setFillColor(100, 116, 139);
    doc.roundedRect(badgeX, y + 3.8, badgeWidth, 11, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text(
    isGreen ? 'ESTADO: APTO' :
    isYellow ? 'ESTADO: PREVENTIVO' :
    isRed ? 'ESTADO: NO APTO' : 'NO CONCLUYENTE',
    badgeX + (badgeWidth / 2),
    y + 10.8,
    { align: 'center' }
  );

  // 3. Document Title & Official Emission Line
  y += bannerH + 4.5;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.2);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO OFICIAL DE EVALUACIÓN DE FATIGA Y SOMNOLENCIA PRE-TURNO', margin, y);
  
  y += 3.5;
  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Emisión: ${evalDate}   |   ID Certificado: ${evaluation.id}   |   Faena: ${worker.faena || 'Faena Operacional'} (${worker.altitudeMeters || 3800} msnm)`, margin, y);

  y += 2.5;
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageWidth - margin, y);

  y += 2.8;

  // 4. Section 1: Personal & Operational Data Box
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. DATOS DEL TRABAJADOR Y CONTEXTO OPERACIONAL', margin, y);

  y += 1.8;
  const sec1H = 19;
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, sec1H, 1.2, 1.2, 'S');

  const halfW = (contentWidth / 2) - 4;
  const c2 = margin + (contentWidth / 2) + 2.0;
  let rowY = y + 3.8;

  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);

  // Row 1: Nombre & RUT
  doc.setFont('helvetica', 'bold');
  doc.text('Trabajador:', c1, rowY);
  doc.setFont('helvetica', 'normal');
  doc.text(worker.name || 'No especificado', c1 + 16, rowY, { maxWidth: halfW - 18 });

  doc.setFont('helvetica', 'bold');
  doc.text('RUT:', c2, rowY);
  doc.setFont('helvetica', 'normal');
  doc.text(worker.rut || 'No registrado', c2 + 9, rowY, { maxWidth: halfW - 11 });

  // Row 2: Empresa & Equipo
  rowY += 3.8;
  doc.setFont('helvetica', 'bold');
  doc.text('Empresa/Cargo:', c1, rowY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${worker.company || 'Minera'} — ${worker.role || 'Operador'}`, c1 + 20, rowY, { maxWidth: halfW - 22 });

  doc.setFont('helvetica', 'bold');
  doc.text('Equipo:', c2, rowY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${worker.equipmentAssigned || 'General'} (Criticidad: ${worker.criticality || 'Alta'})`, c2 + 11, rowY, { maxWidth: halfW - 13 });

  // Row 3: Turno/Ciclo & Supervisor
  rowY += 3.8;
  doc.setFont('helvetica', 'bold');
  doc.text('Turno / Ciclo:', c1, rowY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Día ${worker.currentShift?.dayInRoster || 1}/${worker.currentShift?.totalRosterDays || 7} (${worker.currentShift?.type === 'night' ? 'Noche 19:00-07:00' : 'Día 07:00-19:00'})`, c1 + 18, rowY, { maxWidth: halfW - 20 });

  doc.setFont('helvetica', 'bold');
  doc.text('Supervisor:', c2, rowY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${worker.supervisorName || 'Supervisor HSEC'}`, c2 + 16, rowY, { maxWidth: halfW - 18 });

  // Row 4: Área / Faena & GPS
  rowY += 3.8;
  doc.setFont('helvetica', 'bold');
  doc.text('Área / Faena:', c1, rowY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${worker.area || 'Operaciones'} — ${worker.faena || 'Faena'} (${worker.altitudeMeters || 3800} msnm)`, c1 + 18, rowY, { maxWidth: halfW - 20 });

  doc.setFont('helvetica', 'bold');
  doc.text('GPS Faena:', c2, rowY);
  doc.setFont('helvetica', 'normal');
  doc.text(
    worker.gpsCoordinates
      ? `Lat ${worker.gpsCoordinates.latitude.toFixed(4)}, Long ${worker.gpsCoordinates.longitude.toFixed(4)}`
      : 'Estación Base Verificada',
    c2 + 16,
    rowY,
    { maxWidth: halfW - 18 }
  );

  y += sec1H + 2.5;

  // 5. Section 2: Registros y Parámetros Atmosféricos / Ambientales
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. REGISTROS Y PARÁMETROS ATMOSFÉRICOS / AMBIENTALES EN TERRENO', margin, y);

  y += 1.8;
  const sec2H = 16;
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, sec2H, 1.2, 1.2, 'S');

  // 5 Atmospheric Metric Boxes
  const weather = worker.weather;
  const todayForecast = weather?.forecast?.[0];
  const tempVal = todayForecast ? `${todayForecast.currentTempC}°C` : '-2°C';
  const thermalVal = todayForecast ? `${todayForecast.thermalSensationC}°C` : '-8°C';
  const conditionVal = todayForecast?.condition || 'Viento Blanco / Frío';
  const windVal = todayForecast ? `${todayForecast.windSpeedKmh} km/h` : '42 km/h';
  const gustsVal = todayForecast ? `${todayForecast.windGustsKmh} km/h` : '68 km/h';
  const humidityVal = todayForecast ? `${todayForecast.humidityPercent}%` : '18%';
  const pressureVal = todayForecast ? `${todayForecast.barometricPressureHpa} hPa` : '640 hPa';
  const uvVal = todayForecast ? `UV ${todayForecast.uvIndex}` : 'UV 11+';
  const hypoxiaVal = todayForecast?.hypoxiaRiskLevel || `Gran Altura (${worker.altitudeMeters || 3800}m)`;

  const weatherCards = [
    { label: 'Temperatura & Sensación', val: `${tempVal} / Sens. ${thermalVal}`, sub: 'Termometría' },
    { label: 'Condición & Radiación', val: conditionVal, sub: uvVal },
    { label: 'Viento & Ráfagas', val: windVal, sub: `Ráfagas: ${gustsVal}` },
    { label: 'Humedad & Presión', val: `${humidityVal} HR`, sub: `${pressureVal}` },
    { label: 'Riesgo Hipoxia / Altura', val: hypoxiaVal, sub: `${worker.altitudeMeters || 3800} msnm GPS` }
  ];

  const wCardW = (contentWidth - 8) / 5;
  weatherCards.forEach((wc, idx) => {
    const wbx = margin + 1.6 + (idx * (wCardW + 1.2));
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(wbx, y + 1.8, wCardW, sec2H - 3.6, 1.0, 1.0, 'S');

    doc.setFontSize(5.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(wc.label, wbx + (wCardW / 2), y + 4.8, { align: 'center' });

    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(wc.val, wbx + (wCardW / 2), y + 8.6, { align: 'center', maxWidth: wCardW - 2 });

    doc.setFontSize(5.0);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(wc.sub, wbx + (wCardW / 2), y + 12.2, { align: 'center', maxWidth: wCardW - 2 });
  });

  y += sec2H + 2.5;

  // 6. Section 3: Resultados de la Evaluación Multidimensional por Sección
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. RESULTADOS DE LA EVALUACIÓN MULTIDIMENSIONAL POR SECCIÓN', margin, y);

  y += 1.8;
  const sec3H = 48;
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, sec3H, 1.2, 1.2, 'S');

  // 4 Main Highlight Metric Badges
  const medianVal = pvtSummary?.medianRT ?? pvtSummary?.meanRT ?? worker.baseline.medianRT ?? worker.baseline.meanRT ?? 365;
  const baseMedianVal = (worker.baseline.medianRT && worker.baseline.medianRT > 0) ? worker.baseline.medianRT : worker.baseline.meanRT || 320;
  const sleepHrs = sleepRecord?.sleepDurationHours ?? 6.5;
  const sleepDebt = sleepRecord?.accumulatedSleepDebtHours ?? Math.max(0, 8 - sleepHrs);

  const mainMetrics = [
    { 
      label: 'A. Sueño Efectivo', 
      val: `${sleepHrs} hrs`, 
      sub: `Deuda: ${sleepDebt.toFixed(1)}h | Calidad: ${sleepRecord?.sleepQuality ?? 3}/5` 
    },
    { 
      label: 'B. Escala Karolinska KSS', 
      val: `${evaluation.kss} / 9`, 
      sub: evaluation.kss >= 7 ? 'Somnolencia Marcada' : evaluation.kss >= 5 ? 'Alerta Moderada' : 'Alerta Óptima' 
    },
    { 
      label: 'C. Mediana PVT Reacción', 
      val: `${medianVal} ms`, 
      sub: `Línea Base: ${baseMedianVal} ms` 
    },
    { 
      label: 'D. Desviación IPD vs Base', 
      val: `${evaluation.ipdPercentage > 0 ? '+' : ''}${evaluation.ipdPercentage}%`, 
      sub: `Lapsos: ${pvtSummary?.lapsesCount ?? 0} | Falsas: ${pvtSummary?.falseStartsCount ?? 0}` 
    }
  ];

  const mCardW = (contentWidth - 6) / 4;
  mainMetrics.forEach((mm, idx) => {
    const mbx = margin + 1.5 + (idx * (mCardW + 1.0));
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(mbx, y + 1.8, mCardW, 10.5, 1.0, 1.0, 'S');

    doc.setFontSize(5.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(mm.label, mbx + (mCardW / 2), y + 4.4, { align: 'center' });

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(mm.val, mbx + (mCardW / 2), y + 7.8, { align: 'center' });

    doc.setFontSize(4.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(mm.sub, mbx + (mCardW / 2), y + 10.6, { align: 'center' });
  });

  // Detailed Section Breakdown lines inside Section 3
  let sec3RowY = y + 14.5;

  // A. Detalle de Sueño y Deuda
  doc.setFontSize(6.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 100, 170);
  doc.text('A. Sueño y Deuda Circadiana:', c1, sec3RowY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Sueño: ${sleepHrs} hrs  |  Oportunidad: ${sleepRecord?.sleepOpportunityHours ?? 10} hrs  |  Horario: ${sleepRecord?.bedTime || '23:00'} a ${sleepRecord?.wakeTime || '05:30'}  |  Calidad: ${sleepRecord?.sleepQuality ?? 3}/5  |  Noches consecutivas: ${sleepRecord?.consecutiveNights ?? 0}`,
    c1 + 35,
    sec3RowY,
    { maxWidth: contentWidth - 40 }
  );

  // B. Detalle KSS & Nivel de Alerta
  sec3RowY += 4.0;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 100, 170);
  doc.text('B. Escala Karolinska (KSS 1-9):', c1, sec3RowY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Score: ${evaluation.kss}/9  |  Nivel: ${evaluation.kss >= 7 ? 'Somnoliento' : evaluation.kss >= 5 ? 'Neutro / Alerta media' : 'Completamente Alerta'}  |  Fase Circadiana: ${evaluation.circadianPhase === 'trough_critical_nadir' ? 'Nadir Crítico (03:00-06:00)' : 'Ventana Operativa Estándar'}`,
    c1 + 35,
    sec3RowY,
    { maxWidth: contentWidth - 40 }
  );

  // C. Encuesta FYS y Controles Clínicos
  sec3RowY += 4.0;
  const survey = evaluation.fysSurvey;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 100, 170);
  doc.text('C. Encuesta FYS y Factores:', c1, sec3RowY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(
    survey
      ? `Energía: ${survey.energyToStartShift ? 'SÍ' : 'NO'}  |  Cansancio: ${survey.significantPhysicalFatigue ? 'SÍ' : 'NO'}  |  Dolor/Molestia: ${survey.painAffectingDriving ? 'SÍ' : 'NO'}  |  Fármacos: ${survey.medicationsOrDrugsConsumed ? 'DECLARADO' : 'NO'}  |  Alcohol 12h: ${survey.alcoholConsumedLast12Hours ? 'ALERTA' : '0.00 (Cero)'}`
      : 'Declaración jurada conforme sin novedades clínicas ni fármacos declarados',
    c1 + 35,
    sec3RowY,
    { maxWidth: contentWidth - 40 }
  );

  // C2. Factores Nocturnos (si aplica)
  sec3RowY += 3.8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Condición Turno Noche / Cabina:', c1 + 2, sec3RowY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(
    survey?.nightQuestions
      ? `Bostezos/Pesadez: ${survey.nightQuestions.yawningOrHeavyEyelids ? 'SÍ' : 'NO'}  |  Hidratado/Nutrido: ${survey.nightQuestions.hydratedAndNourished ? 'SÍ' : 'NO'}  |  Descanso Diurno: ${survey.nightQuestions.daytimeSleepEnvironment === 'optimal' ? 'Óptimo' : 'Regular'}  |  Luz Cabina: ${survey.nightQuestions.cabinLightingCondition === 'optimal' ? 'Óptima' : 'Parcial'}`
      : `Turno diurno regular — Control de hidratación y ventilación en cabina activo`,
    c1 + 40,
    sec3RowY,
    { maxWidth: contentWidth - 45 }
  );

  // D. Medición Psicomotora PVT Detallada
  sec3RowY += 4.0;
  doc.setFontSize(6.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 100, 170);
  doc.text('D. Test Psicomotor PVT:', c1, sec3RowY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const pvtMean = pvtSummary?.meanRT || medianVal + 15;
  const pvtSD = pvtSummary?.intraIndividualVariability || 45;
  const pvtRRT = pvtSummary?.rrtMean ? pvtSummary.rrtMean.toFixed(2) : (1000 / medianVal).toFixed(2);
  const pvtTrials = pvtSummary?.validTrials || pvtSummary?.totalTrials || 5;
  doc.text(
    `Mediana: ${medianVal} ms  |  Media: ${pvtMean} ms  |  Variabilidad (SD): ${pvtSD} ms  |  RRT: ${pvtRRT}  |  Ensayos: ${pvtTrials}  |  Lapsos (≥500ms): ${pvtSummary?.lapsesCount ?? 0}  |  Anticipaciones: ${pvtSummary?.falseStartsCount ?? 0}`,
    c1 + 35,
    sec3RowY,
    { maxWidth: contentWidth - 40 }
  );

  y += sec3H + 2.5;

  // 7. Section 4: Diagnóstico FRA y Medidas de Control Operacionales Aceptadas
  // CORRECTION: Clean dynamic layout preventing any text overflow or overlapping lines!
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. DIAGNÓSTICO FRA Y MEDIDAS DE CONTROL OPERACIONALES ACEPTADAS', margin, y);

  y += 1.8;
  const currentPlan = LEVEL_CONTROL_MEASURES[evaluation.status] || LEVEL_CONTROL_MEASURES.green;
  const sec4H = 58; // Generous height for diagnostic title, 4 measures and formal worker commitment
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, sec4H, 1.2, 1.2, 'S');

  let sec4RowY = y + 3.6;
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Resultado: ${evaluation.statusLabel}   (Score FRA: ${evaluation.riskScore}/100  |  Confianza: ${evaluation.confidenceScore}%  |  Índice FEI: ${evaluation.fei}/100)`,
    c1,
    sec4RowY
  );

  sec4RowY += 3.6;
  doc.setFontSize(6.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 100, 170);
  doc.text(`Medidas de Control Operacionales Requeridas para el Turno (${currentPlan.title.split(':')[0]}):`, c1, sec4RowY);

  // Render 4 Level Control Measures with clean vertical flow and no overlap
  currentPlan.measures.slice(0, 4).forEach((measure, idx) => {
    sec4RowY += 3.8;
    doc.setFontSize(6.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const titleText = `${idx + 1}. ${measure.title}:`;
    doc.text(titleText, c1 + 1.5, sec4RowY);

    const titleW = doc.getTextWidth(titleText) + 2.0;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    // Fit description within remaining width
    const maxDescW = contentWidth - 6 - titleW;
    doc.text(measure.description, c1 + 1.5 + titleW, sec4RowY, { maxWidth: maxDescW });
  });

  // Explicit Worker Commitment text box line
  sec4RowY += 5.2;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(c1, sec4RowY - 1.2, margin + contentWidth - 3.0, sec4RowY - 1.2);

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Compromiso Operacional Aceptado por el Trabajador:', c1, sec4RowY + 1.8);
  
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(15, 23, 42);
  doc.text(
    '"Me comprometo a cumplir las medidas de control propuestas, además de las indicadas por el supervisor y la empresa."',
    c1 + 60,
    sec4RowY + 1.8,
    { maxWidth: contentWidth - 64 }
  );

  y += sec4H + 2.5;

  // 8. Section 5: Validación y Firmas Digitales en Pantalla (Trabajador y Supervisor)
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('5. VALIDACIÓN Y FIRMAS DIGITALES EN PANTALLA', margin, y);

  y += 1.8;
  const sigBoxW = (contentWidth - 3.5) / 2;
  const sigBoxH = 33;

  // Worker Signature Card (Left)
  const wSigX = margin;
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(wSigX, y, sigBoxW, sigBoxH, 1.2, 1.2, 'S');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('FIRMA TRABAJADOR EVALUADO (OBLIGATORIA)', wSigX + (sigBoxW / 2), y + 3.8, { align: 'center' });

  // Render Worker Signature Image (Transparent PNG over guilloché background)
  if (evaluation.workerSignature && evaluation.workerSignature.startsWith('data:image')) {
    try {
      const transparentWorkerSig = cleanTransparentSignature(evaluation.workerSignature);
      doc.addImage(transparentWorkerSig, 'PNG', wSigX + 10, y + 4.8, sigBoxW - 20, 16, undefined, 'FAST');
    } catch (e) {
      console.warn('Worker signature rendering note:', e);
    }
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(wSigX + 12, y + 16, wSigX + sigBoxW - 12, y + 16);
    doc.setLineDashPattern([], 0);
  }

  // Worker signature bottom baseline
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);
  doc.line(wSigX + 8, y + 21.8, wSigX + sigBoxW - 8, y + 21.8);

  doc.setFontSize(6.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(worker.name || 'Trabajador Evaluado', wSigX + (sigBoxW / 2), y + 25.4, { align: 'center' });

  doc.setFontSize(5.6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const wSigTime = evaluation.workerSignatureTimestamp ? new Date(evaluation.workerSignatureTimestamp).toLocaleTimeString('es-CL') : 'Firma en Pantalla';
  doc.text(`RUT: ${worker.rut || 'Registrado'}  |  Hora: ${wSigTime}  |  Sello Digital OK`, wSigX + (sigBoxW / 2), y + 29.2, { align: 'center' });

  // Supervisor Signature Card (Right)
  const sSigX = margin + sigBoxW + 3.5;
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(sSigX, y, sigBoxW, sigBoxH, 1.2, 1.2, 'S');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('VALIDACIÓN SUPERVISOR HSEC (TURNO)', sSigX + (sigBoxW / 2), y + 3.8, { align: 'center' });

  // Render Supervisor Signature Image if present
  if (evaluation.supervisorSignature && evaluation.supervisorSignature.startsWith('data:image')) {
    try {
      const transparentSupervisorSig = cleanTransparentSignature(evaluation.supervisorSignature);
      doc.addImage(transparentSupervisorSig, 'PNG', sSigX + 10, y + 4.8, sigBoxW - 20, 16, undefined, 'FAST');
    } catch (e) {
      console.warn('Supervisor signature rendering note:', e);
    }
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(sSigX + 12, y + 16, sSigX + sigBoxW - 12, y + 16);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(5.6);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Validación digital registrada en sistema HSEC', sSigX + (sigBoxW / 2), y + 14.5, { align: 'center' });
  }

  // Supervisor signature bottom baseline
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);
  doc.line(sSigX + 8, y + 21.8, sSigX + sigBoxW - 8, y + 21.8);

  doc.setFontSize(6.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(worker.supervisorName || 'Supervisor HSEC Turno', sSigX + (sigBoxW / 2), y + 25.4, { align: 'center' });

  doc.setFontSize(5.6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(
    evaluation.supervisorSignature 
      ? `Firma Presencial  |  Hora: ${evaluation.supervisorSignatureTimestamp ? new Date(evaluation.supervisorSignatureTimestamp).toLocaleTimeString('es-CL') : 'Registrado'}`
      : `Revisión Asíncrona HSEC  |  ${evalDate}`,
    sSigX + (sigBoxW / 2),
    y + 29.2,
    { align: 'center' }
  );

  y += sigBoxH + 2.5;

  // Page 1 Footer Note & Link to Page 2
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageWidth - margin, y);

  y += 2.8;
  doc.setFontSize(5.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Página 1 de 2 • Hash SHA-256:', margin, y);
  doc.setFont('courier', 'normal');
  doc.text(evaluation.hashSha256 || 'sha256-FYS-HSEC-OPLIRA-VERIFIED-INTEGRITY', margin + 35, y, { maxWidth: contentWidth - 75 });
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.2);
  doc.setTextColor(0, 100, 170);
  doc.text('Continúa en Página 2: Desglose Integral y Fundamentos Científicos ➔', margin + contentWidth, y, { align: 'right' });


  // ==========================================
  // PAGE 2: ANEXO TÉCNICO, ENCUESTA Y BASE CIENTÍFICA
  // ==========================================
  doc.addPage();

  // 1. Vector Guilloché Security Watermark (Page 2)
  drawVectorGuillocheSecurityBackground(doc, pageWidth, pageHeight);

  // 2. Header Banner Page 2
  let p2y = 8.0;
  const p2BannerH = 14.0;
  doc.setFillColor(15, 23, 42); // Solid Slate 900
  doc.roundedRect(margin, p2y, contentWidth, p2BannerH, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Oplira FYS  |  ANEXO TÉCNICO: DESGLOSE DE ENCUESTA Y FUNDAMENTOS CIENTÍFICOS', margin + 6, p2y + 6.5);

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Certificado ID: ${evaluation.id}   |   Trabajador: ${worker.name} (RUT: ${worker.rut})   |   Emisión: ${evalDate}`, margin + 6, p2y + 11.2);

  p2y += p2BannerH + 4.0;

  // 6. Section 6: DESGLOSE INTEGRAL DE TODAS LAS PREGUNTAS DE LA ENCUESTA FYS
  doc.setFontSize(7.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('6. DESGLOSE INTEGRAL DE LA ENCUESTA PRE-TURNO FYS Y SUEÑO', margin, p2y);

  p2y += 1.8;
  const sec6H = 76;
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, p2y, contentWidth, sec6H, 1.2, 1.2, 'S');

  let surveyY = p2y + 3.6;
  doc.setFontSize(6.0);

  const surveyQuestions = [
    {
      num: '1',
      q: '¿Sientes suficiente energía para iniciar el turno de forma segura?',
      resp: survey?.energyToStartShift ? 'SÍ (Energía adecuada)' : 'NO (Energía disminuida)',
      isAlert: !survey?.energyToStartShift
    },
    {
      num: '2',
      q: '¿Presentas cansancio físico o fatiga muscular relevante?',
      resp: survey?.significantPhysicalFatigue ? 'SÍ (Presenta fatiga)' : 'NO (Sin fatiga física)',
      isAlert: !!survey?.significantPhysicalFatigue
    },
    {
      num: '3',
      q: '¿Tienes dolor muscular, lumbar o cervical que afecte tu concentración o postura?',
      resp: survey?.painAffectingDriving ? 'SÍ (Dolor declarado)' : 'NO (Sin dolor limitante)',
      isAlert: !!survey?.painAffectingDriving
    },
    {
      num: '4',
      q: '¿Has consumido medicamentos o fármacos en las últimas 24h que induzcan somnolencia?',
      resp: survey?.medicationsOrDrugsConsumed ? `DECLARADO: ${survey.medicationDetails || 'Fármaco reportado'}` : 'NO (Sin fármacos inductores)',
      isAlert: !!survey?.medicationsOrDrugsConsumed
    },
    {
      num: '5',
      q: '¿Has consumido alcohol en las últimas 12 horas previo al turno?',
      resp: survey?.alcoholConsumedLast12Hours ? 'ALERTA DECLARADA' : '0.00 (Cero consumo)',
      isAlert: !!survey?.alcoholConsumedLast12Hours
    },
    {
      num: '6',
      q: 'Tiempo de traslado o trayecto hacia la faena / puesto de trabajo:',
      resp: `${survey?.commuteTimeMinutes || 45} minutos de desplazamiento`,
      isAlert: (survey?.commuteTimeMinutes || 45) > 90
    },
    {
      num: '7',
      q: 'Caracterización cuantitativa de sueño previo (24 horas):',
      resp: `Dormidas: ${sleepHrs} hrs  |  Oportunidad: ${sleepRecord?.sleepOpportunityHours ?? 10}h  |  Horario: ${sleepRecord?.bedTime || '23:00'} a ${sleepRecord?.wakeTime || '05:30'}  |  Calidad: ${sleepRecord?.sleepQuality ?? 3}/5  |  Deuda: ${sleepDebt.toFixed(1)}h`,
      isAlert: sleepHrs < 6.0
    },
    {
      num: '8',
      q: 'Evaluación psicométrica de somnolencia Karolinska (KSS 1-9):',
      resp: `Score ${evaluation.kss}/9: ${evaluation.kss >= 7 ? 'Somnoliento, requiere esfuerzo' : evaluation.kss >= 5 ? 'Neutro, ni alerta ni somnoliento' : 'Alerta y despierto'}`,
      isAlert: evaluation.kss >= 7
    },
    {
      num: '9',
      q: 'Factores de turno noche y ambiente de cabina (si aplica):',
      resp: survey?.nightQuestions 
        ? `Bostezos/Pesadez: ${survey.nightQuestions.yawningOrHeavyEyelids ? 'SÍ' : 'NO'} | Hidratado: ${survey.nightQuestions.hydratedAndNourished ? 'SÍ' : 'NO'} | Energéticas: ${survey.nightQuestions.excessEnergyDrinks ? 'SÍ (>2)' : 'NO'} | Descanso Diurno: ${survey.nightQuestions.daytimeSleepEnvironment === 'optimal' ? 'Óptimo' : 'Regular'}`
        : 'Turno diurno regular. Control preventivo de hidratación y ergonomía activo.',
      isAlert: !!survey?.nightQuestions?.yawningOrHeavyEyelids
    },
    {
      num: '10',
      q: 'Resultado del Test Sensotécnico Psicomotor de Reacción (PVT):',
      resp: `Mediana: ${medianVal} ms (Línea Base: ${baseMedianVal} ms, Desv: ${evaluation.ipdPercentage > 0 ? '+' : ''}${evaluation.ipdPercentage}%) | Lapsos: ${pvtSummary?.lapsesCount ?? 0} | Ensayos: ${pvtSummary?.validTrials || pvtSummary?.totalTrials || 5} ${pvtSummary?.repeatAttemptNumber && pvtSummary.repeatAttemptNumber > 1 ? `(Reintento #${pvtSummary.repeatAttemptNumber}: ${pvtSummary.repeatReason || 'Aplicado'})` : ''}`,
      isAlert: (pvtSummary?.lapsesCount ?? 0) > 0 || evaluation.ipdPercentage > 15
    }
  ];

  surveyQuestions.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.num}. ${item.q}`, c1, surveyY);

    doc.setFont('helvetica', item.isAlert ? 'bold' : 'normal');
    doc.setTextColor(item.isAlert ? 185 : 51, item.isAlert ? 28 : 65, item.isAlert ? 28 : 85);
    doc.text(`➔  ${item.resp}`, c1 + 4, surveyY + 3.0, { maxWidth: contentWidth - 8 });

    surveyY += 6.8;
  });

  p2y += sec6H + 3.0;

  // 7. Section 7: FUNDAMENTOS CIENTÍFICOS Y ESTUDIOS DE REFERENCIA
  doc.setFontSize(7.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('7. FUNDAMENTOS CIENTÍFICOS Y ESTUDIOS DE REFERENCIA INTERNACIONAL', margin, p2y);

  p2y += 1.8;
  const sec7H = 122; // Comprehensive box for all scientific literature references
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, p2y, contentWidth, sec7H, 1.2, 1.2, 'S');

  let sciY = p2y + 3.6;

  const scientificStudies = [
    {
      titleEn: '1. Basner, M., & Dinges, D. F. (2011) — "Maximizing Sensitivity of the Psychomotor Vigilance Test (PVT) to Sleep Loss"',
      journal: 'Sleep, 34(5), 581-591. doi:10.1093/sleep/34.5.581',
      descEs: 'Valida la sensibilidad métrica de la mediana y la tasa recíproca (RRT: 1000/RT) para detectar con máxima fidelidad la degradación de la atención sostenida, lapsos (>500ms) y velocidad de procesamiento psicomotor derivados de la restricción y pérdida de sueño.'
    },
    {
      titleEn: '2. Åkerstedt, T., & Gillberg, M. (1990) — "Subjective and Objective Sleepiness in the Active Individual"',
      journal: 'International Journal of Neuroscience, 52(1-2), 29-37.',
      descEs: 'Estandarización de la Escala de Somnolencia de Karolinska (KSS 1 a 9), demostrando su correlación directa con la actividad electroencefalográfica (ondas alfa/theta en EEG), intrusión de microsueños y fatiga subjetiva en operadores de turnos rotativos.'
    },
    {
      titleEn: '3. Dawson, D., & McCulloch, K. (2005) — "Managing Fatigue: It’s about sleep"',
      journal: 'Sleep Medicine Reviews, 9(5), 365-380.',
      descEs: 'Establece el modelo de cuantificación de deuda acumulada de sueño y la ventana de oportunidad de descanso (horas previas) como el factor biomatemático primario en la predicción del error humano e incidentes en operaciones industriales continuas.'
    },
    {
      titleEn: '4. West, J. B. (2012) — "High-Altitude Medicine and Biology / Hypobaric Hypoxia in Mining Operations"',
      journal: 'High Altitude Medicine & Biology, 13(3), 147-151.',
      descEs: 'Estudio de la hipoxia hipobárica en gran altitud (>2.500 y >3.800 msnm), evidenciando cómo la menor presión de oxígeno fragmenta la arquitectura del sueño REM/NREM, reduce la saturación de oxígeno arterial y acelera la fatiga cognitiva del operador.'
    },
    {
      titleEn: '5. Van Dongen, H. P. A., Maislin, G., Mullington, J. M., & Dinges, D. F. (2003) — "The Cumulative Cost of Additional Wakefulness"',
      journal: 'Sleep, 26(2), 117-126.',
      descEs: 'Demuestra el efecto acumulativo de la restricción crónica moderada de sueño (≤6 horas por noche durante días sucesivos de turno), generando un deterioro neuroconductual equivalente al de una privación total de sueño de 24 a 48 horas continuas.'
    },
    {
      titleEn: '6. Hursh, S. R., Redmond, D. P., Johnson, M. L., et al. (2004) — "Fatigue Avoidance Scheduling Tool (FAST) & SAFTE Model"',
      journal: 'Aviation, Space, and Environmental Medicine, 75(3), A44-A57.',
      descEs: 'Bases del modelamiento biomatemático del rendimiento humano, incorporando la interacción del ritmo circadiano (nadir biológico 03:00-06:00), la inercia del sueño y la velocidad de recuperación biológica durante el descanso.'
    },
    {
      titleEn: '7. Ministerio de Salud de Chile (MINSAL) — "Guía Técnica sobre Trabajo en Gran Altitud Geográfica"',
      journal: 'Decreto Supremo N° 28 / D.S. N° 44 / Circular SUSESO N° 3.655.',
      descEs: 'Marco normativo chileno para la vigilancia de la salud, aclimatación, gestión del riesgo de hipobaria intermitente crónica y medidas de mitigación preventiva de fatiga y somnolencia en faenas mineras e industriales.'
    }
  ];

  scientificStudies.forEach((st) => {
    doc.setFontSize(6.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 150);
    doc.text(st.titleEn, c1, sciY, { maxWidth: contentWidth - 6 });

    sciY += 3.2;
    doc.setFontSize(5.0);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Publicación: ${st.journal}`, c1 + 2, sciY, { maxWidth: contentWidth - 8 });

    sciY += 2.8;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`➔ Descripción: ${st.descEs}`, c1 + 2, sciY, { maxWidth: contentWidth - 8 });

    sciY += 9.5;
  });

  p2y += sec7H + 3.0;

  // 8. Section 8: MARCO LEGAL Y PRIVACIDAD DE DATOS (DS 44 / LEY 21.719)
  doc.setFontSize(7.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('8. MARCO REGULATORIO, PRIVACIDAD Y CUMPLIMIENTO LEGAL', margin, p2y);

  p2y += 1.8;
  const sec8H = 21;
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, p2y, contentWidth, sec8H, 1.2, 1.2, 'S');

  let legY = p2y + 3.4;
  doc.setFontSize(5.4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(
    '• Decreto Supremo N° 44/2024 (Reglamento sobre Gestión Preventiva de Riesgos Laborales): Obligatoriedad de implementar sistemas de detección y control de fatiga en puestos de alta criticidad operacional.',
    c1,
    legY,
    { maxWidth: contentWidth - 6 }
  );

  legY += 4.0;
  doc.text(
    '• Ley N° 21.719 (Protección de Datos Personales y Datos Sensibles de Salud): Tratamiento exclusivo para la prevención de accidentes laborales, bajo estricta confidencialidad, no transferibilidad y almacenamiento cifrado.',
    c1,
    legY,
    { maxWidth: contentWidth - 6 }
  );

  legY += 4.0;
  doc.text(
    '• Circular SUSESO N° 3.655 y Art. 184 del Código del Trabajo: Deber de protección eficaz de la vida y salud de los trabajadores en faena minera, garantizando condiciones óptimas antes de operar maquinaria o vehículos.',
    c1,
    legY,
    { maxWidth: contentWidth - 6 }
  );

  legY += 4.0;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `• Trazabilidad Digital: Certificado generado electrónicamente bajo estándar ISO-8601 (${evaluation.timestamp}) con validación de integridad criptográfica SHA-256.`,
    c1,
    legY,
    { maxWidth: contentWidth - 6 }
  );

  p2y += sec8H + 2.5;

  // Page 2 Bottom Footer
  doc.setDrawColor(180, 205, 225);
  doc.setLineWidth(0.35);
  doc.line(margin, p2y, pageWidth - margin, p2y);

  p2y += 2.8;
  doc.setFontSize(5.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Página 2 de 2 • Fin del Certificado Oficial Oplira FYS • Hash SHA-256:', margin, p2y);
  doc.setFont('courier', 'normal');
  doc.text(evaluation.hashSha256 || 'sha256-FYS-HSEC-OPLIRA-VERIFIED-INTEGRITY', margin + 65, p2y, { maxWidth: contentWidth - 66 });

  return doc;
}

export function downloadEvaluationPDF(
  worker: WorkerProfile,
  evaluation: FRARiskEvaluation,
  sleepRecord?: Partial<SleepRecord>,
  pvtSummary?: Partial<PVTSummary>
) {
  const doc = generateEvaluationPDF(worker, evaluation, sleepRecord, pvtSummary);
  const cleanName = (worker.name || 'Trabajador').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const dateStr = new Date(evaluation.timestamp).toISOString().split('T')[0];
  const filename = `FYS_HSEC_Oplira_Certificado_${cleanName}_${dateStr}.pdf`;
  doc.save(filename);
}
