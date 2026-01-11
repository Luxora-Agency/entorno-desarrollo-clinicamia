/**
 * Constantes del Módulo de Calidad IPS Colombia
 * Basado en normativa colombiana: Res. 3100/2019, Res. 256/2016, Res. 5095/2018
 */

// ==========================================
// ESTÁNDARES DE HABILITACIÓN
// ==========================================
export const TIPOS_ESTANDAR_HABILITACION = {
  TALENTO_HUMANO: { label: 'Talento Humano', codigo: 'TH', color: '#3B82F6' },
  INFRAESTRUCTURA: { label: 'Infraestructura', codigo: 'INF', color: '#10B981' },
  DOTACION: { label: 'Dotación', codigo: 'DOT', color: '#F59E0B' },
  MEDICAMENTOS_DISPOSITIVOS: { label: 'Medicamentos y Dispositivos', codigo: 'MED', color: '#EF4444' },
  PROCESOS_PRIORITARIOS: { label: 'Procesos Prioritarios', codigo: 'PP', color: '#8B5CF6' },
  HISTORIA_CLINICA: { label: 'Historia Clínica', codigo: 'HC', color: '#EC4899' },
  INTERDEPENDENCIA: { label: 'Interdependencia', codigo: 'INT', color: '#06B6D4' },
};

export const ESTADOS_CUMPLIMIENTO = {
  CUMPLE: { label: 'Cumple', color: '#10B981', bgColor: '#D1FAE5' },
  CUMPLE_PARCIAL: { label: 'Cumple Parcialmente', color: '#F59E0B', bgColor: '#FEF3C7' },
  NO_CUMPLE: { label: 'No Cumple', color: '#EF4444', bgColor: '#FEE2E2' },
  NO_APLICA: { label: 'No Aplica', color: '#6B7280', bgColor: '#F3F4F6' },
};

export const ESTADOS_AUTOEVALUACION = {
  EN_PROCESO: { label: 'En Proceso', color: '#3B82F6', bgColor: '#DBEAFE' },
  COMPLETADA: { label: 'Completada', color: '#10B981', bgColor: '#D1FAE5' },
  CERRADA: { label: 'Cerrada', color: '#6B7280', bgColor: '#F3F4F6' },
};

export const TIPOS_VISITA = {
  PREVIA: { label: 'Visita Previa', color: '#3B82F6' },
  VERIFICACION: { label: 'Verificación', color: '#10B981' },
  REACTIVA: { label: 'Reactiva', color: '#EF4444' },
  SEGUIMIENTO: { label: 'Seguimiento', color: '#F59E0B' },
};

// ==========================================
// EVENTOS ADVERSOS Y SEGURIDAD DEL PACIENTE
// ==========================================
export const TIPOS_EVENTO_ADVERSO = {
  EVENTO_ADVERSO_PREVENIBLE: { label: 'Evento Adverso Prevenible', color: '#EF4444' },
  EVENTO_ADVERSO_NO_PREVENIBLE: { label: 'Evento Adverso No Prevenible', color: '#F59E0B' },
  INCIDENTE: { label: 'Incidente', color: '#3B82F6' },
  CUASI_INCIDENTE: { label: 'Cuasi Incidente', color: '#10B981' },
  COMPLICACION: { label: 'Complicación', color: '#8B5CF6' },
};

export const SEVERIDADES_EVENTO = {
  LEVE: { label: 'Leve', color: '#10B981', bgColor: '#D1FAE5', descripcion: 'Sin daño o daño mínimo' },
  MODERADO: { label: 'Moderado', color: '#F59E0B', bgColor: '#FEF3C7', descripcion: 'Requiere intervención adicional' },
  GRAVE: { label: 'Grave', color: '#EF4444', bgColor: '#FEE2E2', descripcion: 'Daño permanente o riesgo de muerte' },
  CENTINELA: { label: 'Centinela', color: '#7C3AED', bgColor: '#EDE9FE', descripcion: 'Evento centinela - requiere análisis inmediato' },
};

export const ESTADOS_EVENTO = {
  REPORTADO: { label: 'Reportado', color: '#3B82F6' },
  EN_ANALISIS: { label: 'En Análisis', color: '#F59E0B' },
  CON_PLAN_ACCION: { label: 'Con Plan de Acción', color: '#8B5CF6' },
  CERRADO: { label: 'Cerrado', color: '#10B981' },
};

export const METODOS_ANALISIS = {
  PROTOCOLO_LONDRES: { label: 'Protocolo de Londres', descripcion: 'Análisis sistemático de incidentes clínicos' },
  ESPINA_PESCADO: { label: 'Espina de Pescado (Ishikawa)', descripcion: 'Diagrama de causas y efectos' },
  CINCO_PORQUES: { label: '5 Porqués', descripcion: 'Técnica iterativa de análisis causal' },
};

export const FACTORES_CONTRIBUTIVOS = {
  PACIENTE: { label: 'Factores del Paciente', subcategorias: ['Condición clínica', 'Factores sociales', 'Características personales'] },
  TAREA: { label: 'Factores de la Tarea', subcategorias: ['Diseño de la tarea', 'Protocolos disponibles', 'Ayudas a decisiones'] },
  INDIVIDUO: { label: 'Factores del Individuo', subcategorias: ['Conocimiento/habilidades', 'Competencia', 'Salud física/mental'] },
  EQUIPO: { label: 'Factores del Equipo', subcategorias: ['Comunicación', 'Supervisión', 'Estructura del equipo'] },
  AMBIENTE: { label: 'Factores del Ambiente', subcategorias: ['Personal disponible', 'Carga de trabajo', 'Equipos/suministros'] },
  ORGANIZACION: { label: 'Factores Organizacionales', subcategorias: ['Políticas/procedimientos', 'Cultura organizacional', 'Gestión'] },
};

export const CATEGORIAS_PRACTICA_SEGURA = {
  Identificacion: { label: 'Identificación de Pacientes', icon: 'badge' },
  Comunicacion: { label: 'Comunicación Efectiva', icon: 'message-square' },
  MedicamentosAltoRiesgo: { label: 'Medicamentos de Alto Riesgo', icon: 'pill' },
  CirugiaSegura: { label: 'Cirugía Segura', icon: 'heart-pulse' },
  IAAS: { label: 'Prevención de IAAS', icon: 'shield' },
  Caidas: { label: 'Prevención de Caídas', icon: 'alert-triangle' },
  UPP: { label: 'Prevención de UPP', icon: 'activity' },
};

// ==========================================
// INDICADORES SIC (Resolución 256/2016)
// ==========================================
export const DOMINIOS_INDICADOR_SIC = {
  EFECTIVIDAD: { label: 'Efectividad', color: '#3B82F6', descripcion: 'Resultados esperados en salud' },
  SEGURIDAD: { label: 'Seguridad', color: '#EF4444', descripcion: 'Prevención de eventos adversos' },
  EXPERIENCIA: { label: 'Experiencia de la Atención', color: '#10B981', descripcion: 'Percepción del usuario' },
};

export const COLORES_SEMAFORO = {
  Verde: { color: '#10B981', bgColor: '#D1FAE5', label: 'Cumple Meta' },
  Amarillo: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'En Riesgo' },
  Rojo: { color: '#EF4444', bgColor: '#FEE2E2', label: 'No Cumple' },
};

export const PERIODICIDADES_REPORTE = {
  MENSUAL: { label: 'Mensual', meses: 1 },
  TRIMESTRAL: { label: 'Trimestral', meses: 3 },
  SEMESTRAL: { label: 'Semestral', meses: 6 },
  ANUAL: { label: 'Anual', meses: 12 },
};

// ==========================================
// PQRS
// ==========================================
export const TIPOS_PQRS = {
  PETICION: { label: 'Petición', color: '#3B82F6', diasHabiles: 15 },
  QUEJA: { label: 'Queja', color: '#F59E0B', diasHabiles: 15 },
  RECLAMO: { label: 'Reclamo', color: '#EF4444', diasHabiles: 15 },
  SUGERENCIA: { label: 'Sugerencia', color: '#10B981', diasHabiles: 15 },
  DENUNCIA: { label: 'Denuncia', color: '#7C3AED', diasHabiles: 10 },
  FELICITACION: { label: 'Felicitación', color: '#EC4899', diasHabiles: null },
};

export const CANALES_PQRS = {
  PRESENCIAL: { label: 'Presencial', icon: 'user' },
  TELEFONICO: { label: 'Telefónico', icon: 'phone' },
  WEB: { label: 'Web', icon: 'globe' },
  BUZON: { label: 'Buzón de Sugerencias', icon: 'inbox' },
  EMAIL: { label: 'Correo Electrónico', icon: 'mail' },
  REDES_SOCIALES: { label: 'Redes Sociales', icon: 'share-2' },
};

export const ESTADOS_PQRS = {
  RADICADA: { label: 'Radicada', color: '#6B7280' },
  ASIGNADA: { label: 'Asignada', color: '#3B82F6' },
  EN_PROCESO: { label: 'En Proceso', color: '#F59E0B' },
  RESPONDIDA: { label: 'Respondida', color: '#10B981' },
  CERRADA: { label: 'Cerrada', color: '#6B7280' },
  VENCIDA: { label: 'Vencida', color: '#EF4444' },
};

export const PRIORIDADES_PQRS = {
  Alta: { label: 'Alta', color: '#EF4444' },
  Normal: { label: 'Normal', color: '#F59E0B' },
  Baja: { label: 'Baja', color: '#10B981' },
};

// ==========================================
// COMITÉS INSTITUCIONALES
// ==========================================
export const COMITES_OBLIGATORIOS = {
  CSP: { nombre: 'Comité de Seguridad del Paciente', normativa: 'Res. 3100/2019' },
  COVE: { nombre: 'Comité de Vigilancia Epidemiológica', normativa: 'Res. 3100/2019' },
  CFT: { nombre: 'Comité de Farmacia y Terapéutica', normativa: 'Decreto 2200/2005' },
  CHC: { nombre: 'Comité de Historias Clínicas', normativa: 'Res. 1995/1999' },
  CEH: { nombre: 'Comité de Ética Hospitalaria', normativa: 'Ley 23/1981' },
  COPASST: { nombre: 'Comité Paritario de SST', normativa: 'Decreto 1072/2015' },
};

export const ROLES_COMITE = {
  PRESIDENTE: { label: 'Presidente', descripcion: 'Dirige las reuniones y representa al comité' },
  SECRETARIO: { label: 'Secretario', descripcion: 'Levanta actas y gestiona documentación' },
  MIEMBRO: { label: 'Miembro', descripcion: 'Participa en reuniones y aporta desde su área' },
};

export const ESTADOS_REUNION = {
  PROGRAMADA: { label: 'Programada', color: '#3B82F6' },
  REALIZADA: { label: 'Realizada', color: '#10B981' },
  CANCELADA: { label: 'Cancelada', color: '#EF4444' },
  REPROGRAMADA: { label: 'Reprogramada', color: '#F59E0B' },
};

export const ESTADOS_COMPROMISO = {
  PENDIENTE: { label: 'Pendiente', color: '#F59E0B' },
  EN_PROCESO: { label: 'En Proceso', color: '#3B82F6' },
  CUMPLIDO: { label: 'Cumplido', color: '#10B981' },
  VENCIDO: { label: 'Vencido', color: '#EF4444' },
};

// ==========================================
// VIGILANCIA EN SALUD PÚBLICA
// ==========================================
export const TIPOS_NOTIFICACION_SIVIGILA = {
  INMEDIATA: { label: 'Inmediata', color: '#EF4444', descripcion: 'Notificar dentro de las 24 horas' },
  SEMANAL: { label: 'Semanal', color: '#3B82F6', descripcion: 'Notificar en la semana epidemiológica' },
};

export const TIPOS_REPORTE_FARMACOVIGILANCIA = {
  RAM: { label: 'Reacción Adversa a Medicamento', color: '#EF4444' },
  PRM: { label: 'Problema Relacionado con Medicamento', color: '#F59E0B' },
  FALLA_TERAPEUTICA: { label: 'Falla Terapéutica', color: '#3B82F6' },
};

export const GRAVEDADES_REACCION = {
  Leve: { label: 'Leve', color: '#10B981' },
  Moderada: { label: 'Moderada', color: '#F59E0B' },
  Grave: { label: 'Grave', color: '#EF4444' },
  Mortal: { label: 'Mortal', color: '#7C3AED' },
};

export const CAUSALIDADES = {
  Definitiva: { label: 'Definitiva', descripcion: 'Causa-efecto demostrado' },
  Probable: { label: 'Probable', descripcion: 'Alta probabilidad de relación' },
  Posible: { label: 'Posible', descripcion: 'Relación posible pero no confirmada' },
  Improbable: { label: 'Improbable', descripcion: 'Baja probabilidad de relación' },
};

export const EVENTOS_SIVIGILA = [
  { codigo: '345', nombre: 'DENGUE', tipo: 'Semanal' },
  { codigo: '346', nombre: 'MALARIA', tipo: 'Semanal' },
  { codigo: '348', nombre: 'LEISHMANIASIS CUTANEA', tipo: 'Semanal' },
  { codigo: '410', nombre: 'VARICELA', tipo: 'Semanal' },
  { codigo: '420', nombre: 'SARAMPION RUBEOLA', tipo: 'Inmediata' },
  { codigo: '455', nombre: 'INTOXICACIONES', tipo: 'Inmediata' },
  { codigo: '813', nombre: 'VIOLENCIA DE GENERO E INTRAFAMILIAR', tipo: 'Semanal' },
  { codigo: '875', nombre: 'INTENTO DE SUICIDIO', tipo: 'Inmediata' },
  { codigo: '340', nombre: 'COVID-19 CONFIRMADO', tipo: 'Semanal' },
  { codigo: '550', nombre: 'TUBERCULOSIS', tipo: 'Semanal' },
  { codigo: '210', nombre: 'DENGUE GRAVE', tipo: 'Inmediata' },
  { codigo: '350', nombre: 'LEISHMANIASIS VISCERAL', tipo: 'Inmediata' },
  { codigo: '570', nombre: 'INFECCION RESPIRATORIA AGUDA GRAVE (IRAG)', tipo: 'Semanal' },
];

// ==========================================
// GESTIÓN DOCUMENTAL
// ==========================================
export const TIPOS_DOCUMENTO_CALIDAD = {
  POLITICA: { label: 'Política', color: '#7C3AED' },
  MANUAL: { label: 'Manual', color: '#3B82F6' },
  GUIA: { label: 'Guía', color: '#10B981' },
  PROTOCOLO: { label: 'Protocolo', color: '#EC4899' },
  PROCEDIMIENTO: { label: 'Procedimiento', color: '#F59E0B' },
  INSTRUCTIVO: { label: 'Instructivo', color: '#06B6D4' },
  FORMATO: { label: 'Formato', color: '#6B7280' },
  PLAN: { label: 'Plan', color: '#EF4444' },
  PROGRAMA: { label: 'Programa', color: '#8B5CF6' },
};

export const ESTADOS_DOCUMENTO = {
  BORRADOR: { label: 'Borrador', color: '#6B7280' },
  EN_REVISION: { label: 'En Revisión', color: '#F59E0B' },
  APROBADO: { label: 'Aprobado', color: '#3B82F6' },
  VIGENTE: { label: 'Vigente', color: '#10B981' },
  OBSOLETO: { label: 'Obsoleto', color: '#EF4444' },
};

// ==========================================
// PLANES DE ACCIÓN
// ==========================================
export const ORIGENES_PLAN_ACCION = {
  Habilitacion: { label: 'Habilitación', color: '#3B82F6' },
  PAMEC: { label: 'PAMEC', color: '#10B981' },
  EventoAdverso: { label: 'Evento Adverso', color: '#EF4444' },
  Auditoria: { label: 'Auditoría', color: '#F59E0B' },
  Ronda: { label: 'Ronda de Seguridad', color: '#8B5CF6' },
  VisitaVerificacion: { label: 'Visita de Verificación', color: '#EC4899' },
  PQRS: { label: 'PQRS', color: '#06B6D4' },
};

export const TIPOS_ACCION = {
  Correctiva: { label: 'Acción Correctiva', color: '#EF4444', descripcion: 'Elimina causa de no conformidad' },
  Preventiva: { label: 'Acción Preventiva', color: '#F59E0B', descripcion: 'Previene ocurrencia de no conformidad' },
  Mejora: { label: 'Acción de Mejora', color: '#10B981', descripcion: 'Mejora del proceso sin no conformidad' },
};

export const ESTADOS_PLAN_ACCION = {
  Abierto: { label: 'Abierto', color: '#3B82F6' },
  En_Proceso: { label: 'En Proceso', color: '#F59E0B' },
  Cerrado: { label: 'Cerrado', color: '#10B981' },
  Cancelado: { label: 'Cancelado', color: '#6B7280' },
  Vencido: { label: 'Vencido', color: '#EF4444' },
};

// ==========================================
// ACREDITACIÓN (SUA)
// ==========================================
export const GRUPOS_ACREDITACION = {
  ATENCION_CLIENTE: { label: 'Atención al Cliente Asistencial', color: '#3B82F6' },
  APOYO_ADMINISTRATIVO: { label: 'Apoyo Administrativo', color: '#10B981' },
  DIRECCIONAMIENTO: { label: 'Direccionamiento', color: '#F59E0B' },
  GERENCIA: { label: 'Gerencia', color: '#EF4444' },
  RECURSO_HUMANO: { label: 'Gerencia del Recurso Humano', color: '#8B5CF6' },
  AMBIENTE_FISICO: { label: 'Gerencia del Ambiente Físico', color: '#EC4899' },
  INFORMACION: { label: 'Gerencia de la Información', color: '#06B6D4' },
  MEJORAMIENTO_CALIDAD: { label: 'Mejoramiento de la Calidad', color: '#84CC16' },
};

export const NIVELES_CALIFICACION_ACREDITACION = [
  { nivel: 5, nombre: 'Excelente', rango: '4.5 - 5.0', color: '#10B981' },
  { nivel: 4, nombre: 'Bueno', rango: '3.5 - 4.4', color: '#84CC16' },
  { nivel: 3, nombre: 'Aceptable', rango: '2.5 - 3.4', color: '#F59E0B' },
  { nivel: 2, nombre: 'Deficiente', rango: '1.5 - 2.4', color: '#EF4444' },
  { nivel: 1, nombre: 'Crítico', rango: '1.0 - 1.4', color: '#7C3AED' },
];

// ==========================================
// AUDITORÍAS PAMEC
// ==========================================
export const TIPOS_AUDITORIA = {
  Interna: { label: 'Auditoría Interna', color: '#3B82F6' },
  Externa: { label: 'Auditoría Externa', color: '#10B981' },
  Seguimiento: { label: 'Auditoría de Seguimiento', color: '#F59E0B' },
};

export const TIPOS_HALLAZGO = {
  NC_Mayor: { label: 'No Conformidad Mayor', color: '#EF4444', requiereAccion: true },
  NC_Menor: { label: 'No Conformidad Menor', color: '#F59E0B', requiereAccion: true },
  Observacion: { label: 'Observación', color: '#3B82F6', requiereAccion: false },
  Oportunidad_Mejora: { label: 'Oportunidad de Mejora', color: '#10B981', requiereAccion: false },
  Fortaleza: { label: 'Fortaleza', color: '#84CC16', requiereAccion: false },
};

export const ESTADOS_AUDITORIA = {
  PROGRAMADA: { label: 'Programada', color: '#6B7280' },
  EN_EJECUCION: { label: 'En Ejecución', color: '#3B82F6' },
  FINALIZADA: { label: 'Finalizada', color: '#10B981' },
  CANCELADA: { label: 'Cancelada', color: '#EF4444' },
};

// ==========================================
// RUTA CRÍTICA PAMEC (9 PASOS)
// ==========================================
export const PASOS_RUTA_CRITICA = [
  { paso: 1, nombre: 'Autoevaluación', descripcion: 'Diagnóstico inicial de la organización' },
  { paso: 2, nombre: 'Selección de Procesos', descripcion: 'Identificación de procesos a mejorar' },
  { paso: 3, nombre: 'Priorización', descripcion: 'Priorización de procesos según criterios' },
  { paso: 4, nombre: 'Definición de Calidad Esperada', descripcion: 'Establecer el estándar deseado' },
  { paso: 5, nombre: 'Medición de Calidad Observada', descripcion: 'Medir el estado actual' },
  { paso: 6, nombre: 'Análisis de Brechas', descripcion: 'Comparar esperado vs observado' },
  { paso: 7, nombre: 'Formulación de Plan de Mejora', descripcion: 'Definir acciones de mejora' },
  { paso: 8, nombre: 'Ejecución del Plan', descripcion: 'Implementar las acciones definidas' },
  { paso: 9, nombre: 'Evaluación de Resultados', descripcion: 'Verificar efectividad de acciones' },
];

// ==========================================
// HELPERS
// ==========================================
export const getColorForPercentage = (percentage) => {
  if (percentage >= 90) return '#10B981'; // Verde
  if (percentage >= 70) return '#F59E0B'; // Amarillo
  return '#EF4444'; // Rojo
};

export const getSemaforoForValue = (value, meta, tendencia = 'Ascendente') => {
  const porcentaje = (value / meta) * 100;
  if (tendencia === 'Descendente') {
    // Para indicadores donde menos es mejor
    if (value <= meta) return 'Verde';
    if (value <= meta * 1.3) return 'Amarillo';
    return 'Rojo';
  }
  // Para indicadores donde más es mejor
  if (porcentaje >= 90) return 'Verde';
  if (porcentaje >= 70) return 'Amarillo';
  return 'Rojo';
};

export const calcularDiasHabiles = (fechaInicio, dias) => {
  const fecha = new Date(fechaInicio);
  let diasContados = 0;
  while (diasContados < dias) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasContados++;
    }
  }
  return fecha;
};
