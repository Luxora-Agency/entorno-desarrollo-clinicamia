/**
 * Constantes de estados del sistema
 */

// Estados de Citas
export const ESTADOS_CITA = {
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  EN_CONSULTA: 'En Consulta',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No Asistió',
};

// Estados de Admisión
export const ESTADOS_ADMISION = {
  ACTIVA: 'Activa',
  EGRESADA: 'Egresada',
  TRASLADADA: 'Trasladada',
};

// Estados de Camas
export const ESTADOS_CAMA = {
  DISPONIBLE: 'Disponible',
  OCUPADA: 'Ocupada',
  EN_LIMPIEZA: 'En Limpieza',
  MANTENIMIENTO: 'Mantenimiento',
  RESERVADA: 'Reservada',
};

// Colores de estados de cama
export const COLORES_CAMA = {
  [ESTADOS_CAMA.DISPONIBLE]: 'bg-green-100 text-green-800 border-green-200',
  [ESTADOS_CAMA.OCUPADA]: 'bg-red-100 text-red-800 border-red-200',
  [ESTADOS_CAMA.EN_LIMPIEZA]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ESTADOS_CAMA.MANTENIMIENTO]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ESTADOS_CAMA.RESERVADA]: 'bg-blue-100 text-blue-800 border-blue-200',
};

// Estados de Diagnósticos
export const ESTADOS_DIAGNOSTICO = {
  ACTIVO: 'Activo',
  EN_CONTROL: 'En Control',
  RESUELTO: 'Resuelto',
  DESCARTADO: 'Descartado',
};

// Tipos de Diagnóstico
export const TIPOS_DIAGNOSTICO = {
  PRINCIPAL: 'Principal',
  SECUNDARIO: 'Secundario',
  COMPLICACION: 'Complicacion',
  PRESUNTIVO: 'Presuntivo',
};

// Severidad de Alertas
export const SEVERIDAD_ALERTA = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Critica',
};

// Colores de severidad
export const COLORES_SEVERIDAD = {
  [SEVERIDAD_ALERTA.BAJA]: 'bg-blue-100 text-blue-800 border-blue-200',
  [SEVERIDAD_ALERTA.MEDIA]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [SEVERIDAD_ALERTA.ALTA]: 'bg-orange-100 text-orange-800 border-orange-200',
  [SEVERIDAD_ALERTA.CRITICA]: 'bg-red-100 text-red-800 border-red-200',
};

// Tipos de Alerta HCE
export const TIPOS_ALERTA_HCE = {
  ALERGIA: 'Alergia',
  CONTRAINDICACION: 'Contraindicacion',
  RIESGO_QUIRURGICO: 'RiesgoQuirurgico',
  OTRO: 'Otro',
};

// Estados de Alerta
export const ESTADOS_ALERTA = {
  ACTIVA: 'Activa',
  RESUELTA: 'Resuelta',
  INACTIVA: 'Inactiva',
};

// Tipos de Egreso
export const TIPOS_EGRESO = {
  ALTA_MEDICA: 'Alta Médica',
  REMISION: 'Remisión',
  ALTA_VOLUNTARIA: 'Alta Voluntaria',
  FUGA: 'Fuga',
  DEFUNCION: 'Defunción',
};

// Géneros
export const GENEROS = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  OTRO: 'Otro',
};

// Tipos de Sangre
export const TIPOS_SANGRE = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];
