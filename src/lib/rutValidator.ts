// Algoritmo oficial de validación de RUT Chileno (Módulo 11)

export function cleanRut(rut: string): string {
  return typeof rut === 'string' ? rut.replace(/[^0-9kK]/g, '').toUpperCase() : '';
}

export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  if (clean.length <= 1) return clean;

  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);

  // Formato con puntos y guion: 12.345.678-9
  let formattedBody = '';
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    formattedBody = body.charAt(i) + (j > 0 && j % 3 === 0 ? '.' : '') + formattedBody;
  }

  return `${formattedBody}-${dv}`;
}

export function validateRut(rut: string): { isValid: boolean; message?: string } {
  if (!rut || typeof rut !== 'string') {
    return { isValid: false, message: 'El campo RUT es obligatorio.' };
  }

  const clean = cleanRut(rut);
  if (clean.length < 8 || clean.length > 9) {
    return { 
      isValid: false, 
      message: 'El RUT debe tener entre 7 y 8 dígitos más el dígito verificador (ej: 12.345.678-9 o 12345678-K).' 
    };
  }

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  // Validar que el cuerpo sean solo números
  if (!/^\d+$/.test(body)) {
    return { isValid: false, message: 'El cuerpo del RUT solo debe contener números.' };
  }

  // Cálculo de Módulo 11
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedRemainder = 11 - (sum % 11);
  let expectedDv = '';
  if (expectedRemainder === 11) {
    expectedDv = '0';
  } else if (expectedRemainder === 10) {
    expectedDv = 'K';
  } else {
    expectedDv = expectedRemainder.toString();
  }

  if (dv !== expectedDv) {
    return {
      isValid: false,
      message: `Dígito verificador incorrecto. Para el número ${body}, el dígito verificador calculado es '${expectedDv}', pero se ingresó '${dv}'.`
    };
  }

  return { isValid: true };
}
