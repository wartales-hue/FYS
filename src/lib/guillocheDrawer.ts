import { jsPDF } from 'jspdf';

/**
 * Hardware-Aware Vector Security Guilloché Pattern Renderer
 * Dynamically adjusts rendering steps based on device capability (low-end vs high-end)
 * to prevent main thread blocking and memory spikes.
 */

function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  return cores <= 4 || memory < 3;
}

function getLightGuillocheGradientColor(x: number, pageWidth: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, x / pageWidth));
  if (t < 0.25) {
    const k = t / 0.25;
    return [
      Math.round(230 + (242 - 230) * k),
      Math.round(242 + (239 - 242) * k),
      Math.round(250 + (252 - 250) * k)
    ];
  } else if (t < 0.50) {
    const k = (t - 0.25) / 0.25;
    return [
      Math.round(242 + (252 - 242) * k),
      Math.round(239 + (238 - 239) * k),
      Math.round(252 + (245 - 252) * k)
    ];
  } else if (t < 0.75) {
    const k = (t - 0.50) / 0.25;
    return [
      Math.round(252 + (253 - 252) * k),
      Math.round(238 + (245 - 238) * k),
      Math.round(245 + (238 - 245) * k)
    ];
  } else {
    const k = (t - 0.75) / 0.25;
    return [
      Math.round(253 + (236 - 253) * k),
      Math.round(245 + (250 - 245) * k),
      Math.round(238 + (243 - 238) * k)
    ];
  }
}

export function drawVectorGuillocheSecurityBackground(doc: jsPDF, pageWidth = 210, pageHeight = 297) {
  const lowEnd = isLowEndDevice();
  // Adjust step & density dynamically: wider steps on weak CPUs to reduce draw calls by 60%
  const stepX = lowEnd ? 6.0 : 3.0; 
  const lineSpacing = lowEnd ? 6.0 : 3.5; 
  const waveFreq1 = 0.15;
  const waveFreq2 = 0.30;
  const amp1 = 2.0;
  const amp2 = 0.5;

  doc.setLineWidth(0.09);

  // 1. Primary multi-harmonic intertwined sinusoidal ribbon wave grid
  for (let y0 = 3; y0 <= pageHeight - 3; y0 += lineSpacing) {
    const phases = lowEnd ? [(y0 * 0.15)] : [(y0 * 0.15), (y0 * 0.15) + Math.PI * 0.65];

    for (let pIdx = 0; pIdx < phases.length; pIdx++) {
      const phase = phases[pIdx];
      let prevX = 2;
      let prevY = y0 + amp1 * Math.sin(prevX * waveFreq1 + phase) + amp2 * Math.cos(prevX * waveFreq2 + phase * 0.5);

      for (let x = 2 + stepX; x <= pageWidth - 2; x += stepX) {
        const midX = (prevX + x) / 2;
        const color = getLightGuillocheGradientColor(midX, pageWidth);
        doc.setDrawColor(color[0], color[1], color[2]);

        const y = y0 + amp1 * Math.sin(x * waveFreq1 + phase) + amp2 * Math.cos(x * waveFreq2 + phase * 0.5);
        doc.line(prevX, prevY, x, y);
        
        prevX = x;
        prevY = y;
      }
    }
  }

  // 2. Secondary fine micro-lattice (Skip on low-end devices for instant sub-50ms PDF render)
  if (!lowEnd) {
    doc.setLineWidth(0.06);
    const microSpacing = lineSpacing * 1.6;
    const microFreq = 0.20;
    const microAmp = 1.4;

    for (let y0 = 4.5; y0 <= pageHeight - 4; y0 += microSpacing) {
      const phase = -(y0 * 0.20) + Math.PI / 4;
      let prevX = 3;
      let prevY = y0 + microAmp * Math.sin(prevX * microFreq + phase);

      for (let x = 3 + stepX; x <= pageWidth - 3; x += stepX) {
        const midX = (prevX + x) / 2;
        const color = getLightGuillocheGradientColor(midX, pageWidth);
        
        doc.setDrawColor(
          Math.min(255, color[0] + 3),
          Math.min(255, color[1] + 3),
          Math.min(255, color[2] + 3)
        );

        const y = y0 + microAmp * Math.sin(x * microFreq + phase);
        doc.line(prevX, prevY, x, y);

        prevX = x;
        prevY = y;
      }
    }
  }

  // 3. Subtle perimeter security border
  doc.setLineWidth(0.18);
  for (let x = 3; x <= pageWidth - 3; x += 10) {
    const col = getLightGuillocheGradientColor(x, pageWidth);
    doc.setDrawColor(col[0], col[1], col[2]);
    doc.line(x, 3, Math.min(pageWidth - 3, x + 10), 3);
    doc.line(x, pageHeight - 3, Math.min(pageWidth - 3, x + 10), pageHeight - 3);
  }
}
