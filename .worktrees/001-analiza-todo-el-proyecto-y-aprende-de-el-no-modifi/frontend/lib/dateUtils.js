/**
 * Formatea una fecha en formato: "27 de nov de 2025"
 * con el día de la semana abajo: "jueves"
 */
export function formatDateLong(dateString) {
  if (!dateString) return { fecha: '-', dia: '-' };
  
  const date = new Date(dateString);
  
  const meses = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];
  
  const dias = [
    'domingo', 'lunes', 'martes', 'miércoles', 
    'jueves', 'viernes', 'sábado'
  ];
  
  const dia = date.getDate();
  const mes = meses[date.getMonth()];
  const año = date.getFullYear();
  const diaSemana = dias[date.getDay()];
  
  return {
    fecha: `${dia} de ${mes} de ${año}`,
    dia: diaSemana
  };
}

/**
 * Formatea una fecha en formato corto: "27/11/2025"
 */
export function formatDateShort(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const año = date.getFullYear();
  
  return `${dia}/${mes}/${año}`;
}

/**
 * Formatea una fecha y hora: "27/11/2025 10:30"
 */
export function formatDateTime(dateString, timeString) {
  const fecha = formatDateShort(dateString);
  return timeString ? `${fecha} ${timeString}` : fecha;
}
