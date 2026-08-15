import { jsPDF } from 'jspdf';

/**
 * Authentic Subtle Security Guilloché Pattern Renderer
 * Generates an ultra-light, elegant security watermark background.
 * 
 * Features:
 * - High luminosity / attenuated pastel palette (lightened by blending with white ~80-85%).
 * - Prevents high saturation while maintaining crisp vector security curves.
 * - Leaves text, signatures, and stamps with maximum contrast and readability.
 */

function getLightGuillocheGradientColor(x: number, pageWidth: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, x / pageWidth));
  
  // Base delicate pastel stops with high luminance (lightened by 80% white blend):
  // 0.00: Pale Sky Tint      [232, 244, 252]
  // 0.25: Pale Lavender Tint [242, 239, 252]
  // 0.50: Pale Rose Tint     [252, 238, 245]
  // 0.75: Pale Peach Tint    [253, 245, 238]
  // 1.00: Pale Mint Tint     [236, 250, 243]
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
  const stepX = 3.0; // mm step for smooth curves
  const lineSpacing = 3.5; // mm between wave ribbons
  const waveFreq1 = 0.15; // primary wavelength
  const waveFreq2 = 0.30; // secondary harmonic
  const amp1 = 2.0; // wave amplitude in mm
  const amp2 = 0.5; // modulation amplitude

  // Ultra-fine stroke for a discreet watermark effect
  doc.setLineWidth(0.09);

  // 1. Primary multi-harmonic intertwined sinusoidal ribbon wave grid
  for (let y0 = 3; y0 <= pageHeight - 3; y0 += lineSpacing) {
    const phases = [
      (y0 * 0.15), 
      (y0 * 0.15) + Math.PI * 0.65
    ];

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

  // 2. Secondary counter-harmonic fine micro-lattice
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
      
      // Even softer tone for secondary lattice
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

  // 3. Very subtle light perimeter line
  doc.setLineWidth(0.18);
  for (let x = 3; x <= pageWidth - 3; x += 6) {
    const col = getLightGuillocheGradientColor(x, pageWidth);
    doc.setDrawColor(col[0], col[1], col[2]);
    doc.line(x, 3, Math.min(pageWidth - 3, x + 6), 3);
    doc.line(x, pageHeight - 3, Math.min(pageWidth - 3, x + 6), pageHeight - 3);
  }
}
