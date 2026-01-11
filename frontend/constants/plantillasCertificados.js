/**
 * Plantillas de Certificados Médicos
 * Para uso en el módulo de consulta médica
 */

export const TIPOS_CERTIFICADO = [
  { value: 'ConstanciaAtencion', label: 'Constancia de Atención Médica' },
  { value: 'AptitudLaboral', label: 'Certificado de Aptitud Laboral' },
  { value: 'JustificacionEscolar', label: 'Justificación Escolar' },
  { value: 'ContraindicacionActividad', label: 'Contraindicación de Actividad' },
  { value: 'CondicionSalud', label: 'Certificado de Condición de Salud' },
  { value: 'RecomendacionesMedicas', label: 'Recomendaciones Médicas' },
  { value: 'Otro', label: 'Otro Tipo de Certificado' },
];

export const PLANTILLAS_CERTIFICADO = {
  ConstanciaAtencion: {
    titulo: 'Constancia de Atención Médica',
    contenido: `Por medio del presente se hace constar que el/la paciente {{NOMBRE_PACIENTE}}, identificado(a) con {{TIPO_DOCUMENTO}} número {{NUMERO_DOCUMENTO}}, asistió a consulta médica el día {{FECHA_CONSULTA}} en las instalaciones de Clínica Mía.

El motivo de consulta fue: {{MOTIVO_CONSULTA}}.

Se expide la presente constancia a solicitud del interesado(a) para los fines que estime convenientes.`,
    campos: ['NOMBRE_PACIENTE', 'TIPO_DOCUMENTO', 'NUMERO_DOCUMENTO', 'FECHA_CONSULTA', 'MOTIVO_CONSULTA'],
  },

  AptitudLaboral: {
    titulo: 'Certificado de Aptitud Laboral',
    contenido: `El suscrito médico certifica que el/la paciente {{NOMBRE_PACIENTE}}, identificado(a) con {{TIPO_DOCUMENTO}} número {{NUMERO_DOCUMENTO}}, de {{EDAD}} años de edad, fue valorado(a) médicamente el día {{FECHA_CONSULTA}}.

Después de realizar el examen médico correspondiente y analizar los antecedentes, se conceptúa que el paciente se encuentra:

{{CONCEPTO_APTITUD}}

{{RESTRICCIONES}}

El presente certificado tiene una vigencia de {{VIGENCIA_DIAS}} días a partir de la fecha de expedición.`,
    campos: ['NOMBRE_PACIENTE', 'TIPO_DOCUMENTO', 'NUMERO_DOCUMENTO', 'EDAD', 'FECHA_CONSULTA', 'CONCEPTO_APTITUD', 'RESTRICCIONES', 'VIGENCIA_DIAS'],
  },

  JustificacionEscolar: {
    titulo: 'Justificación Médica Escolar',
    contenido: `Señores
Institución Educativa
{{DESTINATARIO}}

Por medio del presente se certifica que el/la estudiante {{NOMBRE_PACIENTE}}, identificado(a) con {{TIPO_DOCUMENTO}} número {{NUMERO_DOCUMENTO}}, asistió a consulta médica el día {{FECHA_CONSULTA}}.

Diagnóstico: {{DIAGNOSTICO}}

Por concepto médico, el paciente requiere reposo y cuidados domiciliarios por un período de {{DIAS_REPOSO}} días, comprendido entre el {{FECHA_INICIO}} y el {{FECHA_FIN}}.

Se expide la presente para justificar la inasistencia escolar del paciente durante el período indicado.`,
    campos: ['DESTINATARIO', 'NOMBRE_PACIENTE', 'TIPO_DOCUMENTO', 'NUMERO_DOCUMENTO', 'FECHA_CONSULTA', 'DIAGNOSTICO', 'DIAS_REPOSO', 'FECHA_INICIO', 'FECHA_FIN'],
  },

  ContraindicacionActividad: {
    titulo: 'Certificado de Contraindicación de Actividad',
    contenido: `El suscrito médico certifica que el/la paciente {{NOMBRE_PACIENTE}}, identificado(a) con {{TIPO_DOCUMENTO}} número {{NUMERO_DOCUMENTO}}, fue valorado(a) médicamente el día {{FECHA_CONSULTA}}.

Por motivos de salud y como parte del tratamiento médico indicado, se recomienda que el paciente se abstenga de realizar las siguientes actividades:

{{ACTIVIDADES_CONTRAINDICADAS}}

Período de restricción: {{PERIODO_RESTRICCION}}

Motivo médico: {{MOTIVO_MEDICO}}

Se expide el presente certificado para los fines pertinentes.`,
    campos: ['NOMBRE_PACIENTE', 'TIPO_DOCUMENTO', 'NUMERO_DOCUMENTO', 'FECHA_CONSULTA', 'ACTIVIDADES_CONTRAINDICADAS', 'PERIODO_RESTRICCION', 'MOTIVO_MEDICO'],
  },

  CondicionSalud: {
    titulo: 'Certificado de Condición de Salud',
    contenido: `El suscrito médico certifica que el/la paciente {{NOMBRE_PACIENTE}}, identificado(a) con {{TIPO_DOCUMENTO}} número {{NUMERO_DOCUMENTO}}, presenta la siguiente condición de salud:

Diagnóstico: {{DIAGNOSTICO}}
Código CIE-10: {{CODIGO_CIE10}}

{{DESCRIPCION_CONDICION}}

Tratamiento actual: {{TRATAMIENTO}}

El paciente requiere: {{REQUERIMIENTOS}}

Se expide el presente certificado a solicitud del interesado(a).`,
    campos: ['NOMBRE_PACIENTE', 'TIPO_DOCUMENTO', 'NUMERO_DOCUMENTO', 'DIAGNOSTICO', 'CODIGO_CIE10', 'DESCRIPCION_CONDICION', 'TRATAMIENTO', 'REQUERIMIENTOS'],
  },

  RecomendacionesMedicas: {
    titulo: 'Recomendaciones Médicas',
    contenido: `Paciente: {{NOMBRE_PACIENTE}}
Documento: {{TIPO_DOCUMENTO}} {{NUMERO_DOCUMENTO}}
Fecha de consulta: {{FECHA_CONSULTA}}

Con base en la valoración médica realizada, se emiten las siguientes recomendaciones:

{{RECOMENDACIONES}}

Nota: Estas recomendaciones son parte integral del tratamiento médico y deben ser seguidas para una adecuada recuperación.`,
    campos: ['NOMBRE_PACIENTE', 'TIPO_DOCUMENTO', 'NUMERO_DOCUMENTO', 'FECHA_CONSULTA', 'RECOMENDACIONES'],
  },

  Otro: {
    titulo: 'Certificado Médico',
    contenido: `{{CONTENIDO_LIBRE}}`,
    campos: ['CONTENIDO_LIBRE'],
  },
};

export const CONCEPTOS_APTITUD = [
  { value: 'APTO_SIN_RESTRICCIONES', label: 'APTO sin restricciones para desempeñar el cargo' },
  { value: 'APTO_CON_RESTRICCIONES', label: 'APTO con restricciones (ver observaciones)' },
  { value: 'APLAZADO', label: 'APLAZADO - Requiere valoración adicional' },
  { value: 'NO_APTO_TEMPORAL', label: 'NO APTO temporalmente para el cargo' },
];

export default {
  TIPOS_CERTIFICADO,
  PLANTILLAS_CERTIFICADO,
  CONCEPTOS_APTITUD,
};
