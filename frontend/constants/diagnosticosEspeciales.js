/**
 * Constantes para validación de diagnósticos especiales
 * (Cáncer y Enfermedades Huérfanas)
 */

// Rangos CIE-10 para cáncer
const RANGOS_CANCER = [
  { inicio: 'C00', fin: 'C97' }, // Tumores malignos
  { inicio: 'D00', fin: 'D09' }, // Tumores in situ
];

// Rangos CIE-10 para enfermedades huérfanas (ejemplo - ajustar según normativa colombiana)
const RANGOS_HUERFANAS = [
  { inicio: 'E70', fin: 'E90' }, // Trastornos metabólicos
  { inicio: 'G60', fin: 'G65' }, // Neuropatías hereditarias
  { inicio: 'Q00', fin: 'Q99' }, // Malformaciones congénitas (algunas)
];

/**
 * Verificar si un código CIE-10 está en un rango
 */
function estaEnRango(codigo, inicio, fin) {
  if (!codigo) return false;
  const codigoLimpio = codigo.replace(/\./g, '').toUpperCase();
  const inicioLimpio = inicio.replace(/\./g, '').toUpperCase();
  const finLimpio = fin.replace(/\./g, '').toUpperCase();
  
  return codigoLimpio >= inicioLimpio && codigoLimpio <= finLimpio;
}

/**
 * Determinar si un código CIE-10 requiere validación especial
 * @param {string} codigoCIE10 - Código CIE-10 a validar
 * @returns {object} - { requiereValidacion, tipo, nombre }
 */
export function requiereValidacionEspecial(codigoCIE10) {
  if (!codigoCIE10) {
    return { requiereValidacion: false };
  }

  // Verificar si es cáncer
  for (const rango of RANGOS_CANCER) {
    if (estaEnRango(codigoCIE10, rango.inicio, rango.fin)) {
      return {
        requiereValidacion: true,
        tipo: 'cancer',
        nombre: 'Cáncer'
      };
    }
  }

  // Verificar si es enfermedad huérfana
  for (const rango of RANGOS_HUERFANAS) {
    if (estaEnRango(codigoCIE10, rango.inicio, rango.fin)) {
      return {
        requiereValidacion: true,
        tipo: 'huerfana',
        nombre: 'Enfermedad Huérfana'
      };
    }
  }

  return { requiereValidacion: false };
}

/**
 * Estados de confirmación del diagnóstico
 */
export const ESTADOS_CONFIRMACION = [
  { value: 'confirmado', label: 'Confirmado (con pruebas)' },
  { value: 'sospecha', label: 'Sospecha clínica' },
  { value: 'descartado', label: 'Descartado' }
];

/**
 * Métodos de confirmación del diagnóstico
 */
export const METODOS_CONFIRMACION = [
  { value: 'biopsia', label: 'Biopsia' },
  { value: 'histopatologia', label: 'Histopatología' },
  { value: 'imagen', label: 'Estudios de imagen' },
  { value: 'genetico', label: 'Estudio genético' },
  { value: 'clinico', label: 'Diagnóstico clínico' },
  { value: 'otro', label: 'Otro método' }
];
