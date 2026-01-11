# ACTA DE ESTADO ACTUAL - CLINICA MIA
## Modulos: Talento Humano, SST y Panel del Doctor

**Fecha de generacion:** 29 de Diciembre de 2025
**Proyecto:** Clinica Mia - Sistema de Gestion Hospitalaria
**Version:** 2.1.0

---

# INDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Modulo Talento Humano (RRHH)](#modulo-talento-humano-rrhh)
3. [Modulo SST](#modulo-sst)
4. [Panel del Doctor](#panel-del-doctor)
5. [Integraciones Entre Modulos](#integraciones-entre-modulos)
6. [Cumplimiento Normativo](#cumplimiento-normativo)
7. [Estadisticas Generales](#estadisticas-generales)

---

# RESUMEN EJECUTIVO

El sistema Clinica Mia cuenta con tres modulos empresariales robustos y completamente funcionales:

| Modulo | Modelos BD | Servicios | Endpoints | Componentes | Estado |
|--------|------------|-----------|-----------|-------------|--------|
| **Talento Humano** | 34 | 12 | 110+ | 12 | 100% Funcional |
| **SST** | 71 | 24 | 80+ | 18 | 100% Funcional |
| **Panel Doctor** | 14 | 8 | 50+ | 20 | 100% Funcional |

**Stack Tecnologico:**
- Backend: Hono.js + Prisma ORM + PostgreSQL
- Frontend: Next.js 14 + React + Tailwind CSS + shadcn/ui
- IA: OpenAI GPT-5.2 con function calling
- Autenticacion: JWT (access 15min, refresh 7 dias)

---

# MODULO TALENTO HUMANO (RRHH)

## 1. Entidades de Base de Datos (34 modelos)

### Reclutamiento y Seleccion
| Modelo | Proposito |
|--------|-----------|
| `THCargo` | Definicion de cargos organizacionales con nivel jerarquico |
| `THVacante` | Gestion de vacantes de empleo |
| `THCandidato` | Registro de candidatos |
| `THCandidatoVacante` | Relacion candidato-vacante con estado de proceso |
| `THEntrevista` | Programacion y seguimiento de entrevistas |

### Gestion de Empleados
| Modelo | Proposito |
|--------|-----------|
| `THEmpleado` | Datos maestros (incluye jefeDirecto, subordinados, usuario) |
| `THContrato` | Contratos laborales (INDEFINIDO, FIJO, TEMPORAL, PRACTICUM) |
| `THModificacionContrato` | Historial de cambios a contratos |
| `THMovimiento` | Cambios administrativos (promociones, traslados) |
| `THDocumentoEmpleado` | Documentos asociados (cedula, carne, diplomas) |

### Nomina
| Modelo | Proposito |
|--------|-----------|
| `THPeriodoNomina` | Periodos de nomina (anual, mes, quincena) |
| `THNominaDetalle` | Detalles de nomina por empleado |
| `THNovedadNomina` | Novedades (horas extras, ausencias, bonos) |

### Asistencia y Control
| Modelo | Proposito |
|--------|-----------|
| `THTurno` | Definicion de turnos laborales |
| `THAsignacionTurno` | Asignacion de turnos a empleados |
| `THAsistencia` | Registros diarios de entrada/salida |
| `THVacacion` | Solicitudes de vacaciones |
| `THPermiso` | Solicitudes de permisos |

### Evaluacion de Desempeno
| Modelo | Proposito |
|--------|-----------|
| `THPeriodoEvaluacion` | Periodos de evaluacion anual |
| `THEvaluacionDesempeno` | Evaluaciones 360 (auto, jefe, pares, subordinados) |
| `THObjetivo` | Objetivos SMART del empleado |
| `THFeedback` | Retroalimentacion estructurada |

### Capacitacion
| Modelo | Proposito |
|--------|-----------|
| `THCapacitacion` | Programas de capacitacion |
| `THSesionCapacitacion` | Sesiones/modulos |
| `THAsistenteCapacitacion` | Registro de asistencia |

### Bienestar Laboral
| Modelo | Proposito |
|--------|-----------|
| `THBeneficio` | Catalogo de beneficios |
| `THBeneficioEmpleado` | Asignacion de beneficios |
| `THEncuesta` | Encuestas de clima laboral |
| `THRespuestaEncuesta` | Respuestas a encuestas |
| `THEvento` | Eventos de bienestar |
| `THAsistenteEvento` | Asistencia a eventos |
| `THReconocimiento` | Reconocimientos y logros |

### IA
| Modelo | Proposito |
|--------|-----------|
| `THConversacionIA` | Historial conversaciones IA (screening, analisis) |

---

## 2. Servicios Backend (12 servicios)

**Ubicacion:** `/backend/services/talento-humano/`

| Servicio | Funcionalidades Principales |
|----------|----------------------------|
| `empleado.service.js` | CRUD empleados, expediente, organigrama, vinculacion usuario |
| `vacante.service.js` | CRUD vacantes, cambio de estado, estadisticas |
| `candidato.service.js` | CRUD candidatos, pipeline, conversion a empleado |
| `contrato.service.js` | CRUD contratos, renovacion, terminacion, liquidacion |
| `nomina.service.js` | Periodos, procesamiento, novedades, PILA, certificados |
| `asistencia.service.js` | Entrada/salida, turnos, vacaciones, permisos |
| `evaluacion.service.js` | Periodos, evaluaciones 360, objetivos, feedback |
| `capacitacion.service.js` | Programas, sesiones, inscripcion, certificados |
| `bienestar.service.js` | Beneficios, encuestas, eventos, reconocimientos |
| `calculos-laborales.service.js` | Nomina, IBC, deducciones, provisiones, retencion |
| `reportes-legales.service.js` | PILA, certificado laboral, certificado ingresos |
| `talentoHumanoAI.service.js` | Screening CV, preguntas, prediccion rotacion |

---

## 3. Endpoints API (110+ rutas)

**Base:** `/talento-humano`

### Dashboard y Estadisticas
```
GET /dashboard/stats
```

### Cargos
```
GET    /cargos
POST   /cargos
PUT    /cargos/:id
GET    /cargos/organigrama
```

### Vacantes
```
GET    /vacantes
GET    /vacantes/:id
POST   /vacantes
PUT    /vacantes/:id
DELETE /vacantes/:id
PATCH  /vacantes/:id/estado
GET    /vacantes/:id/pipeline
```

### Candidatos
```
GET    /candidatos
GET    /candidatos/:id
POST   /candidatos
PUT    /candidatos/:id
DELETE /candidatos/:id
POST   /candidatos/:id/aplicar
PATCH  /candidatos/:candidatoId/vacantes/:vacanteId/estado
POST   /candidatos/:id/contratar
```

### Empleados
```
GET    /empleados
GET    /empleados/search
GET    /empleados/:id
GET    /empleados/:id/expediente
POST   /empleados
PUT    /empleados/:id
PATCH  /empleados/:id/estado
POST   /empleados/:id/vincular-usuario
```

### Contratos
```
GET    /contratos
GET    /contratos/:id
GET    /contratos/proximos-vencer
POST   /contratos
POST   /contratos/:id/terminar
POST   /contratos/:id/renovar
GET    /empleados/:empleadoId/liquidacion
```

### Nomina
```
GET    /nomina/periodos
POST   /nomina/periodos
GET    /nomina/periodos/:id
POST   /nomina/periodos/:id/procesar
POST   /nomina/periodos/:id/cerrar
GET    /nomina/periodos/:id/resumen
GET    /nomina/colilla/:empleadoId/:periodoId
GET    /nomina/novedades
POST   /nomina/novedades
PATCH  /nomina/novedades/:id/aprobar
POST   /nomina/liquidacion/:empleadoId
GET    /nomina/periodos/:id/pila
```

### Normatividad Colombia 2025
```
GET    /normatividad/parametros
GET    /normatividad/fechas-importantes
POST   /normatividad/validar-contrato
POST   /normatividad/calcular-incapacidad
GET    /certificados/laboral/:empleadoId
GET    /certificados/ingresos-retenciones/:empleadoId/:anio
```

### Asistencia
```
GET    /asistencia
POST   /asistencia/entrada
POST   /asistencia/salida
GET    /asistencia/reporte
GET    /turnos
POST   /turnos
POST   /turnos/asignar
GET    /vacaciones
POST   /vacaciones
PATCH  /vacaciones/:id/aprobar
PATCH  /vacaciones/:id/rechazar
GET    /vacaciones/saldo/:empleadoId
GET    /permisos
POST   /permisos
PATCH  /permisos/:id/aprobar
```

### Evaluaciones
```
GET    /evaluaciones/periodos
POST   /evaluaciones/periodos
GET    /evaluaciones/periodos/:id
POST   /evaluaciones/periodos/:id/iniciar
GET    /evaluaciones/pendientes
POST   /evaluaciones/:id/responder
GET    /evaluaciones/resultados/:empleadoId
GET    /objetivos
POST   /objetivos
PATCH  /objetivos/:id/progreso
GET    /feedback
POST   /feedback
```

### Capacitaciones
```
GET    /capacitaciones
GET    /capacitaciones/stats
GET    /capacitaciones/:id
POST   /capacitaciones
PUT    /capacitaciones/:id
POST   /capacitaciones/:id/sesiones
POST   /capacitaciones/:id/inscribir
GET    /capacitaciones/certificados/:empleadoId
```

### Bienestar
```
GET    /beneficios
POST   /beneficios
POST   /beneficios/asignar
GET    /beneficios/empleado/:empleadoId
GET    /encuestas
POST   /encuestas
GET    /encuestas/:id
PATCH  /encuestas/:id/activar
POST   /encuestas/:id/responder
GET    /encuestas/:id/resultados
GET    /eventos
POST   /eventos
POST   /eventos/:id/confirmar
GET    /reconocimientos
GET    /reconocimientos/publicos
POST   /reconocimientos
```

### IA
```
GET    /ai/status
POST   /ai/screening-cv
POST   /ai/generar-preguntas
POST   /ai/analizar-desempeno
POST   /ai/predecir-rotacion
POST   /ai/sugerir-capacitacion
POST   /ai/chat
```

---

## 4. Componentes Frontend (12 componentes)

**Ubicacion:** `/frontend/components/clinica/rrhh/`

| Componente | Funcion |
|------------|---------|
| `RRHHModule.jsx` | Modulo principal con tabs |
| `dashboard/DashboardRRHH.jsx` | Dashboard con KPIs |
| `reclutamiento/ReclutamientoTab.jsx` | Vacantes y candidatos (pipeline) |
| `empleados/EmpleadosTab.jsx` | CRUD empleados |
| `empleados/PerfilSSTEmpleado.jsx` | Perfil SST integrado |
| `contratos/ContratosTab.jsx` | Gestion de contratos |
| `nomina/NominaTab.jsx` | Procesamiento nomina, colillas |
| `asistencia/AsistenciaTab.jsx` | Entrada/salida, turnos, vacaciones |
| `evaluacion/EvaluacionTab.jsx` | Evaluaciones 360, objetivos |
| `capacitacion/CapacitacionTab.jsx` | Programas, inscripciones |
| `bienestar/BienestarTab.jsx` | Beneficios, encuestas, eventos |
| `ai/AIAssistantTab.jsx` | Asistente IA para HR |

---

## 5. Funcionalidades Implementadas

### Reclutamiento y Seleccion
- Creacion de vacantes por cargo/departamento
- Pipeline visual de seleccion (Aplicado -> Preseleccionado -> Entrevista -> Seleccionado)
- Screening automatico de CV con IA (GPT-5.2)
- Generacion de preguntas personalizadas por IA
- Programacion de entrevistas
- Conversion de candidato a empleado

### Gestion de Empleados
- CRUD completo con expediente digital
- Jerarquia organizacional (jefe-subordinados)
- Vinculacion con usuarios del sistema
- Busqueda avanzada por multiples criterios

### Contratos
- Tipos: Indefinido, Termino Fijo, Temporal, Practicum
- Historial de modificaciones
- Renovacion y terminacion
- Calculo de liquidacion automatico
- Alertas de vencimiento

### Nomina (Normatividad Colombia 2025)
- Procesamiento automatico
- Calculo de devengados, deducciones, provisiones
- SMLV 2025: $1.423.500 COP
- Auxilio transporte: $200.000 COP
- Aportes seguridad social (salud 4%, pension 4%)
- Parafiscales (caja 4%, SENA 2%, ICBF 3%)
- Retencion en la fuente
- Generacion PILA, certificados laborales

### Asistencia y Control
- Registro entrada/salida
- Gestion de turnos
- Solicitud y aprobacion de vacaciones
- Calculo automatico de saldo disponible

### Evaluacion de Desempeno
- Evaluaciones 360 (auto, jefe, pares, subordinados)
- Objetivos SMART con seguimiento
- Feedback estructurado
- Resultados historicos

### IA Integrada
- Screening automatico de CV
- Generacion de preguntas de entrevista
- Analisis de desempeno
- Prediccion de rotacion
- Sugerencias de capacitacion

---

# MODULO SST

## 1. Entidades de Base de Datos (71 modelos)

### Accidentes y Investigacion (6 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTAccidenteTrabajo` | Registro de accidentes laborales |
| `SSTInvestigacionAccidente` | Investigacion formal Res. 1401/2007 |
| `SSTMiembroInvestigacion` | Miembros del equipo investigador |
| `SSTMedidaControlAccidente` | Medidas de control derivadas |
| `SSTDocumentoInvestigacion` | Documentos soporte |
| `SSTTestigoAccidente` | Registro de testigos |

### Incidentes (1 modelo)
| Modelo | Proposito |
|--------|-----------|
| `SSTIncidente` | Near-miss, cuasi-accidentes |

### Enfermedades Laborales (2 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTEnfermedadLaboral` | Diagnostico CIE-10, calificacion, PCL% |
| `SSTSeguimientoEnfermedad` | Seguimiento medico continuado |

### Matriz IPVR - GTC 45 (5 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTMatrizIPVR` | Identificacion de Peligros y Valoracion de Riesgos |
| `SSTMatrizIPVRCargo` | Vinculacion matriz -> cargos |
| `SSTPeligro` | Peligros identificados con clasificacion |
| `SSTValoracionRiesgo` | Calculo GTC 45: ND x NE = NP, NC, NR |
| `SSTMedidaIntervencion` | Medidas de control por peligro |

### Examenes Medicos Ocupacionales (3 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTExamenMedico` | Ingreso, periodicos, egreso (Res. 1843/2025) |
| `SSTComponenteExamen` | Componentes medicos (audiometria, etc.) |
| `SSTProveedorMedico` | Catalogo de IPS |

### Profesiogramas (1 modelo)
| Modelo | Proposito |
|--------|-----------|
| `SSTProfesiograma` | Perfil de riesgos por cargo |

### COPASST (5 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTCopasst` | Comite Paritario de SST |
| `SSTCopasstIntegrante` | Miembros del COPASST |
| `SSTCopasstReunion` | Reuniones mensuales |
| `SSTAsistenteReunion` | Registro de asistencia |
| `SSTCompromisoReunion` | Compromisos asignados |

### Comite Convivencia Laboral (5 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTComiteConvivencia` | CCL (prevencion acoso) |
| `SSTCCLIntegrante` | Miembros del comite |
| `SSTCCLReunion` | Reuniones del CCL |
| `SSTQuejaAcosoLaboral` | Registro de quejas |
| `SSTSeguimientoQuejaAcoso` | Historial de tramitacion |

### Plan Anual de Trabajo (4 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTPlanAnualTrabajo` | Plan anual SST por ano |
| `SSTMetaPlan` | Metas estrategicas |
| `SSTActividadPlan` | Actividades con responsables |
| `SSTEvidenciaActividad` | Evidencias de cumplimiento |

### Capacitaciones SST (3 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTCapacitacionSST` | Capacitaciones de seguridad |
| `SSTAsistenteCapacitacionSST` | Registro de asistentes |
| `SSTEvaluacionCapacitacionSST` | Evaluaciones post-capacitacion |

### Inspecciones y Hallazgos (5 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTInspeccion` | Inspecciones de areas |
| `SSTInspectorAdicional` | Inspectores adicionales |
| `SSTHallazgoInspeccion` | Hallazgos identificados |
| `SSTListaVerificacion` | Listas de verificacion |
| `SSTItemListaVerificacion` | Items dentro de listas |

### Indicadores (2 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTIndicador` | Frecuencia, severidad, ausentismo |
| `SSTMedicionIndicador` | Valores mensuales/anuales |

### EPP (2 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTElementoEPP` | Catalogo de EPP |
| `SSTEntregaEPP` | Registro de entregas |

### Plan de Emergencias y Brigada (7 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTPlanEmergencias` | Plan integral de respuesta |
| `SSTBrigadaEmergencia` | Brigada de emergencia |
| `SSTMiembroBrigada` | Miembros con roles |
| `SSTCapacitacionBrigada` | Entrenamientos |
| `SSTSimulacro` | Simulacros de emergencia |
| `SSTAccionMejoraSimulacro` | Mejoras post-simulacro |
| `SSTParticipanteSimulacro` | Participantes |

### Documentos SST (2 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTDocumentoSST` | Documento maestro (politicas, procedimientos) |
| `SSTHistorialDocumento` | Control de versiones |

### Auditorias (3 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTAuditoria` | Auditorias internas |
| `SSTAuditorEquipo` | Equipo auditor |
| `SSTHallazgoAuditoria` | Hallazgos por criterio |

### Acciones Correctivas (1 modelo)
| Modelo | Proposito |
|--------|-----------|
| `SSTAccionCorrectiva` | ACAP con implementacion y verificacion |

### Evaluacion Estandares - Res. 0312/2019 (5 modelos)
| Modelo | Proposito |
|--------|-----------|
| `SSTEvaluacionEstandares` | Evaluacion anual (13 estandares) |
| `SSTEvaluacionCiclo` | Ciclos de evaluacion |
| `SSTItemEvaluacionEstandar` | Items por estandar (80+ preguntas) |
| `SSTPlanMejoramientoEstandar` | Plan de mejora |
| `SSTAccionMejoramientoEstandar` | Acciones de mejora |

### Sistema de Alertas (4 modelos)
| Modelo | Proposito |
|--------|-----------|
| `AlertaConfiguracion` | Configuracion de tipos de alerta |
| `AlertaDestinatario` | Destinatarios por tipo |
| `AlertaHistorial` | Historial de envios |
| `AlertaProgramada` | Cola de alertas programadas |

---

## 2. Servicios Backend (24 servicios)

**Ubicacion:** `/backend/services/sst/`

| Servicio | Funcionalidades |
|----------|-----------------|
| `accidente.service.js` | CRUD accidentes, FURAT, estadisticas |
| `investigacion.service.js` | Investigacion Res. 1401/2007, 5 porques |
| `incidente.service.js` | Registro near-miss |
| `enfermedad.service.js` | CIE-10, calificacion, FUREL |
| `matrizIPVR.service.js` | GTC 45: peligros, valoracion, medidas |
| `examenMedico.service.js` | Ingreso/periodicos/egreso, alertas |
| `profesiograma.service.js` | Profesiogramas por cargo |
| `copasst.service.js` | Gestion COPASST, reuniones, actas |
| `comiteConvivencia.service.js` | CCL, quejas acoso laboral |
| `planAnual.service.js` | Plan SST anual, metas, actividades |
| `capacitacionSST.service.js` | Capacitaciones, asistencia, evaluacion |
| `inspeccion.service.js` | Inspecciones, hallazgos, listas |
| `indicadores.service.js` | Frecuencia, severidad, ausentismo |
| `epp.service.js` | Catalogo EPP, entregas, alertas |
| `planEmergencias.service.js` | Plan emergencias, amenazas |
| `brigada.service.js` | Brigada, entrenamientos, directorio |
| `simulacro.service.js` | Simulacros, participantes, mejoras |
| `documentoSST.service.js` | Documentos versionados, listado maestro |
| `auditoria.service.js` | Auditorias internas, programa anual |
| `accionCorrectiva.service.js` | ACAP, implementacion, verificacion |
| `evaluacionEstandares.service.js` | Res. 0312/2019, plan mejora |
| `furat.service.js` | Generacion PDF FURAT/FUREL |
| `dashboardSST.service.js` | KPIs, alertas criticas |
| `integracion.service.js` | Integracion SST-RRHH, onboarding |

---

## 3. Endpoints API (80+ rutas)

**Base:** `/sst`

### Dashboard
```
GET /dashboard
```

### Accidentes
```
GET    /accidentes
GET    /accidentes/pendientes-investigacion
GET    /accidentes/estadisticas
GET    /accidentes/:id
POST   /accidentes
PUT    /accidentes/:id
POST   /accidentes/:id/testigo
GET    /accidentes/:id/furat/pdf
DELETE /accidentes/:id
```

### Investigaciones
```
GET    /investigaciones
GET    /investigaciones/medidas-vencidas
GET    /investigaciones/:id
POST   /investigaciones
PUT    /investigaciones/:id
POST   /investigaciones/:id/miembros
POST   /investigaciones/:id/medidas
POST   /investigaciones/:id/completar
POST   /investigaciones/:id/cerrar
```

### Incidentes
```
GET    /incidentes
GET    /incidentes/:id
POST   /incidentes
PUT    /incidentes/:id
```

### Enfermedades
```
GET    /enfermedades
GET    /enfermedades/:id
POST   /enfermedades
PUT    /enfermedades/:id
POST   /enfermedades/:id/seguimiento
GET    /enfermedades/:id/furel/pdf
```

### Matriz IPVR
```
GET    /matriz-ipvr
GET    /matriz-ipvr/vigente
GET    /matriz-ipvr/factores-riesgo
GET    /matriz-ipvr/resumen
GET    /matriz-ipvr/:id
POST   /matriz-ipvr
POST   /matriz-ipvr/:id/peligros
POST   /peligros/:id/valoracion
POST   /peligros/:id/medidas
```

### Examenes Medicos
```
GET    /examenes-medicos
GET    /examenes-medicos/proximos-vencer
GET    /examenes-medicos/vencidos
GET    /examenes-medicos/cobertura
GET    /examenes-medicos/proveedores
GET    /examenes-medicos/:id
POST   /examenes-medicos
PUT    /examenes-medicos/:id/resultado
```

### Profesiogramas
```
GET    /profesiogramas
GET    /profesiogramas/sin-profesiograma
GET    /profesiogramas/cargo/:cargoId
GET    /profesiogramas/:id
POST   /profesiogramas
POST   /profesiogramas/:id/examenes
POST   /profesiogramas/:id/riesgos
```

### COPASST
```
GET    /copasst
GET    /copasst/vigente
GET    /copasst/compromisos-pendientes
GET    /copasst/:id
POST   /copasst
POST   /copasst/:id/integrantes
POST   /copasst/:id/reuniones
GET    /copasst/reuniones/:reunionId
PUT    /copasst/reuniones/:reunionId
POST   /copasst/reuniones/:reunionId/compromisos
```

### Comite Convivencia
```
GET    /comite-convivencia
GET    /comite-convivencia/vigente
GET    /comite-convivencia/quejas-pendientes
GET    /comite-convivencia/:id
POST   /comite-convivencia
POST   /comite-convivencia/:id/quejas
PUT    /comite-convivencia/quejas/:quejaId
```

### Plan Anual
```
GET    /plan-anual
GET    /plan-anual/actual
GET    /plan-anual/:id/cumplimiento
POST   /plan-anual
POST   /plan-anual/:id/metas
POST   /plan-anual/:id/actividades
PUT    /plan-anual/actividades/:actividadId
POST   /plan-anual/clonar/:anio
```

### Capacitaciones SST
```
GET    /capacitaciones
GET    /capacitaciones/proximas
GET    /capacitaciones/cobertura
GET    /capacitaciones/:id
POST   /capacitaciones
POST   /capacitaciones/:id/inscribir
POST   /capacitaciones/:id/asistencia
POST   /capacitaciones/:id/finalizar
```

### Inspecciones
```
GET    /inspecciones
GET    /inspecciones/hallazgos-abiertos
GET    /inspecciones/listas-verificacion
GET    /inspecciones/:id
POST   /inspecciones
POST   /inspecciones/:id/hallazgos
PUT    /inspecciones/hallazgos/:hallazgoId
POST   /inspecciones/:id/finalizar
```

### Indicadores
```
GET    /indicadores
GET    /indicadores/dashboard
GET    /indicadores/accidentalidad
GET    /indicadores/enfermedad-laboral
GET    /indicadores/ausentismo
GET    /indicadores/coberturas
POST   /indicadores/medicion
```

### EPP
```
GET    /epp
GET    /epp/entregas
GET    /epp/proximos-vencer
GET    /epp/vencidos
GET    /epp/empleado/:empleadoId
POST   /epp
POST   /epp/entrega
POST   /epp/entrega/:id/devolucion
```

### Plan Emergencias
```
GET    /plan-emergencias/vigente
GET    /plan-emergencias/:id
POST   /plan-emergencias
POST   /plan-emergencias/:id/amenazas
POST   /plan-emergencias/:id/procedimientos
POST   /plan-emergencias/:id/recursos
```

### Brigada
```
GET    /brigada/activa
GET    /brigada/:id
GET    /brigada/:id/directorio
POST   /brigada
POST   /brigada/:id/miembros
POST   /brigada/:id/entrenamiento
```

### Simulacros
```
GET    /simulacros
GET    /simulacros/proximos
GET    /simulacros/:id
POST   /simulacros
POST   /simulacros/:id/participantes
POST   /simulacros/:id/resultados
POST   /simulacros/:id/acciones-mejora
```

### Documentos SST
```
GET    /documentos
GET    /documentos/listado-maestro
GET    /documentos/proximos-vencer
GET    /documentos/:id
POST   /documentos
PUT    /documentos/:id
POST   /documentos/:id/aprobar
```

### Auditorias
```
GET    /auditorias
GET    /auditorias/programa-anual
GET    /auditorias/hallazgos-abiertos
GET    /auditorias/:id
POST   /auditorias
POST   /auditorias/:id/hallazgos
POST   /auditorias/:id/finalizar
```

### Acciones Correctivas
```
GET    /acciones-correctivas
GET    /acciones-correctivas/vencidas
GET    /acciones-correctivas/:id
POST   /acciones-correctivas
PUT    /acciones-correctivas/:id
POST   /acciones-correctivas/:id/implementar
POST   /acciones-correctivas/:id/seguimiento
POST   /acciones-correctivas/:id/verificar
POST   /acciones-correctivas/:id/cerrar
```

### Evaluacion Estandares
```
GET    /evaluacion-estandares
GET    /evaluacion-estandares/actual
GET    /evaluacion-estandares/comparativo
GET    /evaluacion-estandares/:id
POST   /evaluacion-estandares
PUT    /evaluacion-estandares/items/:itemId
POST   /evaluacion-estandares/:id/calcular
POST   /evaluacion-estandares/:id/plan-mejoramiento
```

### Integracion SST-RRHH
```
GET    /empleado/:id/perfil-sst
GET    /cargo/:id/riesgos
POST   /empleado/:id/onboarding-sst
POST   /capacitaciones/:id/sincronizar-rrhh
GET    /alertas/documentos-vencer
GET    /alertas/examenes-vencer
POST   /alertas/programar
POST   /alertas/programar-documentos
POST   /alertas/programar-examenes
```

---

## 4. Componentes Frontend (18 componentes)

**Ubicacion:** `/frontend/components/clinica/sst/`

| Componente | Funcion |
|------------|---------|
| `SSTModule.jsx` | Modulo principal con 18 tabs |
| `dashboard/SSTDashboard.jsx` | KPIs, graficos, alertas |
| `accidentes/AccidentesTab.jsx` | CRUD accidentes |
| `accidentes/AccidenteForm.jsx` | Formulario accidente |
| `accidentes/AccidenteDetail.jsx` | Detalle con investigacion |
| `enfermedades/EnfermedadesTab.jsx` | Listado enfermedades |
| `matriz-ipvr/MatrizIPVRTab.jsx` | Matriz GTC 45 |
| `examenes-medicos/ExamenesMedicosTab.jsx` | Gestion examenes |
| `copasst/CopasstTab.jsx` | COPASST, reuniones |
| `comite-convivencia/ComiteConvivenciaTab.jsx` | CCL, quejas |
| `plan-anual/PlanAnualTab.jsx` | Plan anual SST |
| `capacitaciones/CapacitacionesSSTTab.jsx` | Capacitaciones |
| `inspecciones/InspeccionesTab.jsx` | Inspecciones, hallazgos |
| `indicadores/IndicadoresTab.jsx` | Indicadores |
| `epp/EPPTab.jsx` | Catalogo EPP, entregas |
| `emergencias/EmergenciasTab.jsx` | Plan emergencias, brigada |
| `documentos/DocumentosSSTTab.jsx` | Documentos versionados |
| `auditorias/AuditoriasTab.jsx` | Auditorias internas |
| `estandares/EstandaresTab.jsx` | Res. 0312/2019 |
| `configuracion/AlertasConfigTab.jsx` | Configuracion alertas email |

---

## 5. Funcionalidades Implementadas

### Gestion de Accidentes (Res. 1401/2007)
- Registro completo: tipo, lesion, parte afectada, agente, mecanismo
- Testigos, duracion incapacidad, atencion medica
- Generacion automatica FURAT (PDF)
- Investigacion formal con 5 porques
- Medidas de control con seguimiento
- Firmas digitales

### Incidentes y Enfermedades
- Near-miss con clasificacion por potencial
- Diagnostico CIE-10
- Calificacion y PCL%
- Generacion FUREL

### Matriz IPVR (GTC 45)
- Identificacion de peligros por proceso/zona
- Clasificacion: Biomecanicos, Fisicos, Quimicos, Biologicos, Psicosociales
- Valoracion: ND x NE = NP, NC, NR
- Medidas de intervencion
- Control de versiones

### Examenes Medicos (Res. 1843/2025)
- Ingreso, periodicos, egreso
- Conceptos: Apto, Apto con restricciones, No apto
- IPS y medicos ocupacionales
- Alertas de vencimiento automaticas

### Comites Paritarios
- COPASST: reuniones mensuales, actas digitales
- CCL: prevencion acoso laboral
- Seguimiento de compromisos

### Plan Anual SST
- Metas estrategicas
- Actividades con responsables
- Evidencias de cumplimiento
- Calculo automatico de cumplimiento (%)

### Capacitaciones Obligatorias
- Induccion SST
- Seguridad especifica por cargo
- Brigadas de emergencia
- Inscripcion, asistencia, evaluacion
- Certificados automaticos

### Indicadores Obligatorios
- Frecuencia: (Accidentes / Horas) x 240,000
- Severidad: (Dias perdidos / Horas) x 240,000
- Ausentismo: (Horas ausentes / Horas disponibles) x 100
- Coberturas: Examenes, capacitacion, EPP

### Evaluacion Estandares (Res. 0312/2019)
- 13 estandares minimos
- 80+ items de evaluacion
- Plan de mejora automatico

### Sistema de Alertas con Resend
- Configuracion de tipos de alerta
- Destinatarios por rol/cargo/email
- Dias de anticipacion (30, 15, 7, 1)
- Prioridades (Baja, Media, Alta, Urgente)
- Historial de envios

---

# PANEL DEL DOCTOR

## 1. Entidades Relacionadas (14 modelos)

| Modelo | Proposito |
|--------|-----------|
| `Doctor` | Perfil profesional: licencia, universidad, experiencia, horarios |
| `DoctorEspecialidad` | Especialidades del doctor (M-a-M) |
| `Cita` | Citas medicas con estados |
| `EvolucionClinica` | Notas SOAP con firma digital |
| `SignoVital` | Temperatura, PA, FC, FR, SatO2, peso, talla, IMC |
| `DiagnosticoHCE` | Diagnosticos CIE-11 |
| `AlertaClinica` | Alertas (alergias, riesgos) |
| `OrdenMedica` | Ordenes de examenes/procedimientos |
| `OrdenMedicamento` | Ordenes para farmacia |
| `Prescripcion` | Recetas medicas |
| `Especialidad` | Tipos de consulta |
| `Departamento` | Departamentos medicos |
| `Admision` | Hospitalizaciones |
| `AiConversationLog` | Auditoria de conversaciones IA |

---

## 2. Componentes Frontend (20 componentes)

**Ubicacion:** `/frontend/components/clinica/doctor/`

### Dashboard y Workspace
| Componente | Funcion |
|------------|---------|
| `DashboardDoctor.jsx` | Dashboard principal con cola de atencion |
| `ClinicalWorkspace.jsx` | Workspace completo de consulta |
| `PatientContextBar.jsx` | Informacion del paciente |
| `AttentionTypeSelector.jsx` | Selector tipo de atencion |

### Formularios de Consulta
| Componente | Funcion |
|------------|---------|
| `AnamnesisForm.jsx` | Historia del paciente |
| `AntecedentesEstructurados.jsx` | Antecedentes medicos por categoria |
| `FormularioSOAPConsulta.jsx` | Notas SOAP (obligatorio) |
| `FormularioSignosVitalesConsulta.jsx` | Signos vitales con IMC automatico |
| `FormularioDiagnosticoConsulta.jsx` | Diagnosticos CIE-11 |
| `FormularioPrescripcionesConsulta.jsx` | Medicamentos |
| `FormularioProcedimientosExamenesConsulta.jsx` | Ordenes |
| `FormularioRevisionSistemas.jsx` | Revision por sistemas |
| `FormularioPlanManejo.jsx` | Plan de manejo |

### Asistente IA
| Componente | Funcion |
|------------|---------|
| `AIMedicalAssistant.jsx` | Panel flotante con chat IA |
| `AnalizadorHCE.jsx` | Analisis de HCE externa con IA |

### Hospitalizacion
| Componente | Funcion |
|------------|---------|
| `EpicrisisGenerator.jsx` | Generador de epicrisis |
| `RondaMedicaPanel.jsx` | Ronda medica |
| `DashboardDoctorHospitalizacion.jsx` | Dashboard hospitalizacion |
| `ModalOrdenesMedicas.jsx` | Ordenes en hospitalizacion |
| `ModalEvolucionHospitalizacion.jsx` | Evoluciones |
| `PanelHistorialClinico.jsx` | Historial clinico |

---

## 3. Flujo de Consulta

```
1. Cita (EnEspera) -> Doctor presiona "Llamar"
2. Cita (Atendiendo) -> ClinicalWorkspace abierto
3. Captura datos en 6 etapas:
   - Historia (Anamnesis)
   - Revision Sistemas
   - Signos Vitales
   - SOAP (obligatorio)
   - Diagnostico (CIE-11)
   - Tratamiento (Recetas/Procedimientos)
4. Doctor presiona "Finalizar Consulta"
5. Transaccion atomica crea:
   - EvolucionClinica + firma digital
   - SignosVitales + IMC
   - DiagnosticoHCE
   - AlertaClinica (si aplica)
   - OrdenMedica + Cita para procedimientos
   - Prescripcion + OrdenMedicamento
   - AuditoriaHCE
6. Cita (Completada)
```

---

## 4. Sistema de Agenda y Disponibilidad

### Estructura de Horarios
```javascript
horarios: {
  // Dia de semana (0=Domingo, 6=Sabado)
  "1": [
    { inicio: "08:00", fin: "12:00" },
    { inicio: "14:00", fin: "18:00" }
  ],
  // Fecha especifica (sobreescribe)
  "2025-01-15": [
    { inicio: "09:00", fin: "11:00" }
  ]
}
```

### Endpoints de Disponibilidad
```
GET /disponibilidad/{doctorId}?fecha=YYYY-MM-DD
GET /disponibilidad/{doctorId}/semana?fecha_inicio=YYYY-MM-DD
POST /disponibilidad/validar
```

### Endpoints de Agenda
```
GET /agenda/bloques/{doctorId}?fecha=YYYY-MM-DD
GET /agenda/citas?fecha=YYYY-MM-DD&doctorId={ID}
GET /agenda/checksum
```

---

## 5. AI Medical Assistant (GPT-5.2)

### Funciones Disponibles
| Funcion | Proposito |
|---------|-----------|
| `get_patient_full_history` | Historia medica completa |
| `get_patient_allergies` | Alergias y severidad |
| `get_current_medications` | Medicamentos activos |
| `get_previous_diagnoses` | Diagnosticos previos |
| `get_vitals_trend` | Tendencias de vitales |
| `check_drug_interactions` | Validacion de interacciones |
| `get_similar_cases` | Casos similares previos |

### Quick Actions
- **diagnosis**: Sugerencias CIE-10
- **prescription**: Validacion medicamentos
- **soap**: Generacion notas SOAP
- **summary**: Resumen ejecutivo

### Endpoints IA
```
GET  /ai-assistant/status
POST /ai-assistant/chat
POST /ai-assistant/chat/stream
POST /ai-assistant/diagnosis-suggestions
POST /ai-assistant/check-prescription
POST /ai-assistant/analyze-vitals
POST /ai-assistant/generate-soap
GET  /ai-assistant/patient-context/{id}
```

---

## 6. Endpoints API para Doctores

### Doctores
```
GET    /doctores
GET    /doctores/:id
POST   /doctores
PUT    /doctores/:id
DELETE /doctores/:id
```

### Citas
```
GET    /citas
GET    /citas/:id
POST   /citas
PUT    /citas/:id
POST   /citas/estado/:id
DELETE /citas/:id
```

### Consultas
```
POST   /consultas/finalizar
```

### Evoluciones
```
GET    /evoluciones?pacienteId={ID}
POST   /evoluciones
GET    /evoluciones/:id
```

### Signos Vitales
```
GET    /signos-vitales?pacienteId={ID}
POST   /signos-vitales
```

### Diagnosticos
```
GET    /diagnosticos?pacienteId={ID}
POST   /diagnosticos
```

### Ordenes Medicas
```
GET    /ordenes-medicas?pacienteId={ID}
POST   /ordenes-medicas
PUT    /ordenes-medicas/:id
```

### Prescripciones
```
GET    /prescripciones?pacienteId={ID}
POST   /prescripciones
```

---

# INTEGRACIONES ENTRE MODULOS

## SST <-> RRHH

| Funcionalidad | Descripcion |
|---------------|-------------|
| Onboarding SST automatico | Al crear empleado se inicializa perfil SST |
| Cambio de cargo | Actualiza riesgos y examenes ocupacionales |
| Sincronizacion capacitaciones | Capacitaciones SST se reflejan en RRHH |
| Perfil SST en RRHH | Componente `PerfilSSTEmpleado.jsx` integrado |
| Accidentes | Notifican a RRHH, crean movimiento incapacidad |

**Servicio:** `/backend/services/sst/integracion.service.js`

## Doctor <-> HCE

| Funcionalidad | Descripcion |
|---------------|-------------|
| Evoluciones clinicas | Firmas digitales, hash, auditoria |
| Signos vitales | Calculo automatico de IMC |
| Diagnosticos CIE-11 | Busqueda y registro estandarizado |
| Alertas clinicas | Alergias, riesgos visibles en consulta |
| Ordenes medicas | Generan citas para procedimientos |
| Prescripciones | Generan ordenes para farmacia |

## Doctor <-> IA

| Funcionalidad | Descripcion |
|---------------|-------------|
| Chat en tiempo real | GPT-5.2 con streaming |
| Sugerencias diagnostico | Basadas en sintomas y antecedentes |
| Validacion medicamentos | Interacciones y contraindicaciones |
| Analisis vitales | Deteccion de anomalias |
| Generacion SOAP | Automatica desde datos capturados |

---

# CUMPLIMIENTO NORMATIVO

## Talento Humano
| Normativa | Aplicacion |
|-----------|------------|
| Codigo Sustantivo del Trabajo | Contratos, liquidaciones, vacaciones |
| Ley 100 de 1993 | Aportes seguridad social |
| Estatuto Tributario | Retencion en la fuente |
| Decretos 2025 | SMLV $1.423.500, Aux. Transporte $200.000 |

## SST
| Normativa | Aplicacion |
|-----------|------------|
| Decreto 1072/2015 | Marco general SG-SST |
| Resolucion 0312/2019 | 13 Estandares minimos |
| Resolucion 1401/2007 | Investigacion de accidentes |
| Resolucion 1843/2025 | Examenes medicos ocupacionales |
| GTC 45:2012 | Matriz IPVR |
| Resolucion 1356/2012 | Reportes estadisticos |

## Panel Doctor
| Normativa | Aplicacion |
|-----------|------------|
| Resolucion 1995/1999 | Historia clinica electronica |
| Ley 23 de 1981 | Etica medica |
| CIE-11 | Clasificacion diagnosticos |
| Firma digital | Ley 527 de 1999 |

---

# ESTADISTICAS GENERALES

| Metrica | Talento Humano | SST | Panel Doctor | **Total** |
|---------|---------------|-----|--------------|-----------|
| Modelos Prisma | 34 | 71 | 14 | **119** |
| Servicios Backend | 12 | 24 | 8 | **44** |
| Endpoints API | 110+ | 80+ | 50+ | **240+** |
| Componentes Frontend | 12 | 18 | 20 | **50** |
| Lineas codigo (aprox.) | 8,000+ | 15,000+ | 10,000+ | **33,000+** |

---

# ARCHIVOS CLAVE

## Talento Humano
```
/backend/routes/talento-humano.js (1,512 lineas)
/backend/services/talento-humano/ (12 servicios)
/frontend/hooks/useTalentoHumano.js
/frontend/components/clinica/rrhh/
```

## SST
```
/backend/routes/sst.js (1,906 lineas)
/backend/services/sst/ (24 servicios)
/frontend/hooks/useSST.js (1,013 lineas)
/frontend/components/clinica/sst/
```

## Panel Doctor
```
/frontend/components/clinica/DashboardDoctor.jsx
/frontend/components/clinica/doctor/ (20 componentes)
/backend/routes/consultas.js
/backend/routes/doctores.js
/backend/routes/agenda.js
/backend/routes/disponibilidad.js
/backend/routes/ai-assistant.js
```

---

**Fin del Acta**

*Documento generado automaticamente por Claude Code*
*Fecha: 29 de Diciembre de 2025*
