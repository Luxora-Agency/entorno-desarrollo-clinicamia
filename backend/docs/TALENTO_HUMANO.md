# Módulo de Talento Humano - Documentación Técnica

## Resumen

El módulo de Talento Humano es un sistema completo de gestión de recursos humanos integrado en el sistema hospitalario Clínica Mía. Implementa funcionalidades para todo el ciclo de vida del empleado y cumple con la normatividad laboral colombiana 2025.

## Arquitectura

```
Backend                                    Frontend
/backend/                                  /frontend/
├── services/talento-humano/              ├── hooks/
│   ├── empleado.service.js               │   └── useTalentoHumano.js (65+ funciones)
│   ├── vacante.service.js                │
│   ├── candidato.service.js              ├── components/clinica/rrhh/
│   ├── contrato.service.js               │   ├── RRHHModule.jsx (contenedor)
│   ├── nomina.service.js                 │   ├── dashboard/DashboardRRHH.jsx
│   ├── asistencia.service.js             │   ├── reclutamiento/ReclutamientoTab.jsx
│   ├── evaluacion.service.js             │   ├── empleados/EmpleadosTab.jsx
│   ├── capacitacion.service.js           │   ├── contratos/ContratosTab.jsx
│   ├── bienestar.service.js              │   ├── nomina/NominaTab.jsx
│   ├── calculos-laborales.service.js     │   ├── asistencia/AsistenciaTab.jsx
│   ├── reportes-legales.service.js       │   ├── evaluacion/EvaluacionTab.jsx
│   └── talentoHumanoAI.service.js        │   ├── capacitacion/CapacitacionTab.jsx
│                                         │   ├── bienestar/BienestarTab.jsx
├── routes/talento-humano.js              │   └── ai/AIAssistantTab.jsx
├── config/normatividad-colombia-2025.js  │
└── prisma/schema.prisma (25 modelos TH)  └── components/clinica/calidad2/talento-humano/
```

## Servicios Backend

### 1. EmpleadoService (`empleado.service.js`)
Gestión del directorio y expediente de empleados.

**Métodos principales:**
- `list(filters)` - Listar empleados con filtros y paginación
- `getById(id)` - Obtener empleado por ID
- `getExpediente(id)` - Expediente completo con historial
- `create(data)` - Crear nuevo empleado
- `update(id, data)` - Actualizar datos
- `changeStatus(id, estado)` - Cambiar estado (ACTIVO, RETIRADO, etc.)
- `linkToUser(empleadoId, usuarioId)` - Vincular con usuario del sistema
- `getOrganigrama()` - Árbol jerárquico de la organización
- `getStats()` - Estadísticas generales
- `search(query)` - Búsqueda para autocompletado

### 2. VacanteService (`vacante.service.js`)
Gestión de vacantes abiertas.

**Métodos principales:**
- `list(filters)` - Listar vacantes
- `getById(id)` - Detalle con candidatos
- `create(data, userId)` - Crear vacante
- `update(id, data)` - Actualizar
- `delete(id)` - Eliminar (si no tiene candidatos activos)
- `changeStatus(id, estado)` - Cambiar estado
- `getStats()` - Estadísticas de vacantes

### 3. CandidatoService (`candidato.service.js`)
Pipeline de selección de candidatos.

**Estados del candidato:**
```
APLICADO → EN_REVISION → PRESELECCIONADO → ENTREVISTA_PROGRAMADA →
ENTREVISTA_REALIZADA → PRUEBAS → SELECCIONADO → OFERTA → CONTRATADO
```

**Métodos principales:**
- `list(filters)` - Listar candidatos
- `getById(id)` - Detalle del candidato
- `create(data)` - Registrar candidato
- `aplicarVacante(candidatoId, vacanteId)` - Aplicar a vacante
- `updateEstado(id, estado, datos)` - Cambiar estado en pipeline
- `getByVacante(vacanteId)` - Candidatos por vacante

### 4. NominaService (`nomina.service.js`)
Procesamiento de nómina según normativa colombiana.

**Métodos principales:**
- `listPeriodos(filters)` - Periodos de nómina
- `createPeriodo(data)` - Crear periodo
- `getPeriodo(id)` - Detalle con empleados
- `procesarNomina(periodoId, userId)` - Calcular nómina completa
- `calcularNominaEmpleado(contrato, novedades)` - Cálculo individual
- `cerrarPeriodo(periodoId)` - Cerrar periodo
- `getColilla(empleadoId, periodoId)` - Colilla de pago
- `createNovedad(data)` - Registrar novedad
- `aprobarNovedad(id, userId)` - Aprobar novedad
- `getResumenPeriodo(periodoId)` - Resumen consolidado
- `generarLiquidacion(empleadoId, fechaRetiro, motivo)` - Liquidación definitiva

### 5. AsistenciaService (`asistencia.service.js`)
Control de asistencia y turnos.

**Métodos principales:**
- `registrarAsistencia(data)` - Registro entrada/salida
- `getAsistencia(fecha)` - Asistencia del día
- `getTurnos()` - Lista de turnos
- `createTurno(data)` - Crear turno
- `asignarTurno(data)` - Asignar turno a empleado

### 6. CapacitacionService (`capacitacion.service.js`)
Gestión de capacitaciones.

**Métodos principales:**
- `list(filters)` - Listar capacitaciones
- `getById(id)` - Detalle con asistentes
- `create(data)` - Crear capacitación
- `addSesion(capacitacionId, data)` - Agregar sesión
- `inscribirEmpleado(capacitacionId, empleadoId)` - Inscribir
- `registrarAsistencia(capacitacionId, empleadoId, asistio)` - Marcar asistencia
- `registrarEvaluacion(capacitacionId, empleadoId, data)` - Evaluar y certificar
- `getCertificados(empleadoId)` - Certificados del empleado
- `getStats()` - Estadísticas

### 7. BienestarService (`bienestar.service.js`)
Beneficios, encuestas, eventos y reconocimientos.

**Secciones:**
- Beneficios: Crear, asignar, listar
- Encuestas: Crear, activar, responder, resultados
- Eventos: Crear, confirmar asistencia, registrar asistencia
- Reconocimientos: Crear, listar públicos

### 8. EvaluacionService (`evaluacion.service.js`)
Evaluación de desempeño 360°.

**Métodos principales:**
- `createPeriodo(data)` - Crear periodo de evaluación
- `iniciarPeriodo(id)` - Iniciar evaluaciones
- `responderEvaluacion(id, data)` - Completar evaluación
- `getResultados(empleadoId)` - Resultados consolidados

### 9. CalculosLaboralesService (`calculos-laborales.service.js`)
Cálculos según normatividad colombiana 2025.

**Constantes 2025:**
- SMLV: $1.300.000
- Auxilio Transporte: $162.000
- Salud Empleado: 4%, Empleador: 8.5%
- Pensión Empleado: 4%, Empleador: 12%
- ARL: 0.522% - 6.96% según riesgo
- Parafiscales: SENA 2%, ICBF 3%, Caja 4%

**Métodos principales:**
- `calcularNominaMensual(datosEmpleado, novedades, deducciones)`
- `calcularLiquidacionDefinitiva(datos, fechaIngreso, fechaRetiro, motivo)`
- `calcularRetencionFuente(ibc, deducciones)`
- `calcularIncapacidad(salarioBase, dias, tipo)`
- `getParametrosVigentes()`
- `validarContrato(contrato)`

### 10. ReportesLegalesService (`reportes-legales.service.js`)
Generación de reportes oficiales.

**Reportes:**
- `generarPILA(periodoId)` - Planilla PILA
- `generarCertificadoLaboral(empleadoId, dirigidoA)` - Certificado laboral
- `generarCertificadoIngresosRetenciones(empleadoId, anio)` - Certificado ingresos
- `generarColillaPago(empleadoId, periodoId)` - Colilla detallada

### 11. TalentoHumanoAIService (`talentoHumanoAI.service.js`)
Funcionalidades con IA (GPT-5.2).

**Funciones:**
- `screenCV(cvText, vacante)` - Análisis automático de CV
- `generateInterviewQuestions(candidato, vacante, tipo)` - Preguntas de entrevista
- `analyzePerformance(empleado, evaluaciones)` - Análisis de desempeño
- `predictTurnover(departamentoId, limit)` - Predicción de rotación
- `suggestTraining(empleado)` - Sugerencias de capacitación
- `chat(messages, context)` - Chat asistente RRHH

## Endpoints API

### Base URL: `/talento-humano`

```
Dashboard:
  GET  /dashboard/stats              - Estadísticas generales

Cargos:
  GET  /cargos                       - Listar cargos
  POST /cargos                       - Crear cargo
  PUT  /cargos/:id                   - Actualizar cargo
  GET  /cargos/organigrama           - Organigrama

Vacantes:
  GET  /vacantes                     - Listar vacantes
  POST /vacantes                     - Crear vacante
  GET  /vacantes/:id                 - Detalle vacante
  PUT  /vacantes/:id                 - Actualizar
  DELETE /vacantes/:id               - Eliminar
  PATCH /vacantes/:id/estado         - Cambiar estado

Candidatos:
  GET  /candidatos                   - Listar candidatos
  POST /candidatos                   - Crear candidato
  GET  /candidatos/:id               - Detalle
  PUT  /candidatos/:id               - Actualizar
  POST /candidatos/:id/aplicar       - Aplicar a vacante
  PATCH /candidatos/:id/estado       - Cambiar estado
  GET  /candidatos/por-vacante/:id   - Por vacante

Entrevistas:
  GET  /entrevistas                  - Listar
  POST /entrevistas                  - Programar
  PATCH /entrevistas/:id/completar   - Completar

Empleados:
  GET  /empleados                    - Listar
  POST /empleados                    - Crear
  GET  /empleados/:id                - Detalle
  PUT  /empleados/:id                - Actualizar
  GET  /empleados/:id/expediente     - Expediente completo
  PATCH /empleados/:id/estado        - Cambiar estado

Contratos:
  GET  /contratos                    - Listar
  POST /contratos                    - Crear
  GET  /contratos/:id                - Detalle
  POST /contratos/:id/terminar       - Terminar
  POST /contratos/:id/renovar        - Renovar

Nómina:
  GET  /nomina/periodos              - Listar periodos
  POST /nomina/periodos              - Crear periodo
  GET  /nomina/periodos/:id          - Detalle
  POST /nomina/periodos/:id/procesar - Procesar nómina
  POST /nomina/periodos/:id/cerrar   - Cerrar
  GET  /nomina/colilla/:emp/:per     - Colilla de pago
  POST /nomina/novedades             - Crear novedad
  GET  /nomina/novedades             - Listar novedades
  PATCH /nomina/novedades/:id/aprobar - Aprobar novedad
  POST /nomina/liquidacion/:empId    - Generar liquidación
  GET  /nomina/periodos/:id/pila     - Generar PILA

Asistencia:
  GET  /asistencia                   - Asistencia del día
  POST /asistencia                   - Registrar
  GET  /asistencia/turnos            - Listar turnos
  POST /asistencia/turnos            - Crear turno
  POST /asistencia/turnos/asignar    - Asignar turno

Vacaciones:
  GET  /vacaciones                   - Listar solicitudes
  POST /vacaciones                   - Solicitar
  PATCH /vacaciones/:id/aprobar      - Aprobar
  PATCH /vacaciones/:id/rechazar     - Rechazar
  GET  /vacaciones/saldo/:empId      - Saldo vacaciones

Permisos:
  GET  /permisos                     - Listar
  POST /permisos                     - Solicitar
  PATCH /permisos/:id/aprobar        - Aprobar
  PATCH /permisos/:id/rechazar       - Rechazar

Evaluaciones:
  GET  /evaluaciones/periodos        - Periodos de evaluación
  POST /evaluaciones/periodos        - Crear periodo
  POST /evaluaciones/periodos/:id/iniciar - Iniciar
  POST /evaluaciones/:id/responder   - Responder evaluación
  GET  /evaluaciones/resultados/:emp - Resultados empleado

Objetivos:
  GET  /objetivos                    - Listar
  POST /objetivos                    - Crear
  PATCH /objetivos/:id/progreso      - Actualizar progreso

Feedback:
  GET  /feedback                     - Listar
  POST /feedback                     - Crear

Capacitaciones:
  GET  /capacitaciones               - Listar
  POST /capacitaciones               - Crear
  GET  /capacitaciones/:id           - Detalle
  PUT  /capacitaciones/:id           - Actualizar
  POST /capacitaciones/:id/inscribir - Inscribir empleado
  GET  /capacitaciones/stats         - Estadísticas

Beneficios:
  GET  /beneficios                   - Listar
  POST /beneficios                   - Crear
  POST /beneficios/asignar           - Asignar a empleado
  GET  /beneficios/empleado/:id      - Por empleado

Encuestas:
  GET  /encuestas                    - Listar
  POST /encuestas                    - Crear
  GET  /encuestas/:id                - Detalle
  POST /encuestas/:id/activar        - Activar
  POST /encuestas/:id/responder      - Responder
  GET  /encuestas/:id/resultados     - Resultados

Eventos:
  GET  /eventos                      - Listar
  POST /eventos                      - Crear
  POST /eventos/:id/confirmar        - Confirmar asistencia
  POST /eventos/:id/asistencia       - Registrar asistencia

Reconocimientos:
  GET  /reconocimientos              - Listar
  POST /reconocimientos/:empId       - Crear
  GET  /reconocimientos/publicos     - Públicos recientes

AI:
  POST /ai/screening-cv              - Screening de CV
  POST /ai/generar-preguntas         - Preguntas entrevista
  POST /ai/analizar-desempeno        - Análisis desempeño
  POST /ai/predecir-rotacion         - Predicción rotación
  POST /ai/sugerir-capacitacion      - Sugerencias capacitación
  POST /ai/chat                      - Chat asistente

Normatividad:
  GET  /normatividad/parametros      - Parámetros vigentes
  GET  /normatividad/fechas-importantes - Fechas del año
  POST /normatividad/validar-contrato - Validar contrato
  POST /normatividad/calcular-incapacidad - Calcular incapacidad

Certificados:
  GET  /certificados/laboral/:empId  - Certificado laboral
  GET  /certificados/ingresos-retenciones/:empId/:anio - Certificado ingresos
```

## Modelos Prisma

### Principales (25 modelos):

```prisma
THCargo            - Cargos y estructura organizacional
THEmpleado         - Empleados con datos completos
THDocumentoEmpleado - Documentos digitalizados
THVacante          - Vacantes abiertas
THCandidato        - Candidatos
THCandidatoVacante - Relación candidato-vacante
THEntrevista       - Entrevistas programadas
THContrato         - Contratos laborales
THMovimiento       - Movimientos de personal
THPeriodoNomina    - Periodos de nómina
THNominaDetalle    - Detalle por empleado
THNovedadNomina    - Novedades (horas extra, etc.)
THTurno            - Turnos de trabajo
THAsistencia       - Registros de asistencia
THAsignacionTurno  - Asignación de turnos
THVacacion         - Solicitudes de vacaciones
THPermiso          - Solicitudes de permisos
THPeriodoEvaluacion - Periodos de evaluación
THEvaluacionDesempeno - Evaluaciones individuales
THObjetivo         - Objetivos y KPIs
THFeedback         - Feedback continuo
THCapacitacion     - Capacitaciones
THSesionCapacitacion - Sesiones de capacitación
THAsistenteCapacitacion - Asistentes inscritos
THBeneficio        - Beneficios disponibles
THBeneficioEmpleado - Beneficios asignados
THEncuesta         - Encuestas
THRespuestaEncuesta - Respuestas
THEvento           - Eventos de bienestar
THAsistenteEvento  - Asistentes a eventos
THReconocimiento   - Reconocimientos
```

## Hook Frontend

### `useTalentoHumano()`

Retorna 65+ funciones organizadas por módulo:

```javascript
const {
  // Estados
  loading, error,
  dashboardStats, empleados, vacantes, candidatos,
  capacitaciones, periodosNomina, beneficios, encuestas,
  eventos, reconocimientos,

  // Dashboard
  fetchDashboardStats,

  // Empleados (6 funciones)
  fetchEmpleados, getEmpleado, getExpediente,
  createEmpleado, updateEmpleado, changeEstadoEmpleado,

  // Vacantes (4 funciones)
  fetchVacantes, createVacante, updateVacante, changeVacanteStatus,

  // Candidatos (7 funciones)
  fetchCandidatos, getCandidato, createCandidato,
  updateCandidato, aplicarVacante, updateEstadoCandidato,
  fetchCandidatosPorVacante,

  // Entrevistas (3 funciones)
  fetchEntrevistas, createEntrevista, completarEntrevista,

  // Contratos (4 funciones)
  fetchContratos, createContrato, terminarContrato, renovarContrato,

  // Nómina (5 funciones)
  fetchPeriodosNomina, createPeriodoNomina,
  procesarNomina, cerrarNomina, getColilla,

  // Asistencia (5 funciones)
  fetchAsistencia, registrarAsistencia,
  fetchTurnos, createTurno, asignarTurno,

  // Vacaciones y Permisos (9 funciones)
  fetchVacaciones, solicitarVacaciones, aprobarVacaciones,
  rechazarVacaciones, getSaldoVacaciones,
  fetchPermisos, solicitarPermiso, aprobarPermiso, rechazarPermiso,

  // Evaluaciones (5 funciones)
  fetchPeriodosEvaluacion, createPeriodoEvaluacion,
  iniciarPeriodoEvaluacion, responderEvaluacion, getResultadosEmpleado,

  // Objetivos y Feedback (5 funciones)
  fetchObjetivos, createObjetivo, updateProgresoObjetivo,
  fetchFeedbacks, createFeedback,

  // Capacitaciones (4 funciones)
  fetchCapacitaciones, fetchStatsCapacitacion,
  createCapacitacion, inscribirCapacitacion,

  // Bienestar (9 funciones)
  fetchBeneficios, createBeneficio, asignarBeneficio,
  fetchEncuestas, createEncuesta, responderEncuesta, getResultadosEncuesta,
  fetchEventos, createEvento, confirmarAsistenciaEvento,
  fetchReconocimientos, createReconocimiento,

  // AI (6 funciones)
  aiScreenCV, aiGenerarPreguntas, aiAnalizarDesempeno,
  aiPredecirRotacion, aiSugerirCapacitacion, aiChat,

  // Normatividad (10 funciones)
  getParametrosNormatividad, getFechasImportantes,
  validarContrato, calcularIncapacidad,
  generarLiquidacion, generarPILA,
  generarCertificadoLaboral, generarCertificadoIngresos,
  generarColillaDetallada, calcularNominaEmpleado,
} = useTalentoHumano();
```

## Tests

### Backend Tests (146 tests)
```
/backend/tests/unit/talento-humano/
├── empleado.service.test.js    (31 tests)
├── vacante.service.test.js     (21 tests)
├── nomina.service.test.js      (31 tests)
├── capacitacion.service.test.js (29 tests)
└── bienestar.service.test.js   (34 tests)
```

### Frontend Tests (33 tests)
```
/frontend/tests/hooks/
└── useTalentoHumano.test.js    (33 tests)
```

### Ejecutar tests:
```bash
# Backend
cd backend && npm test -- tests/unit/talento-humano/

# Frontend
cd frontend && npm test -- tests/hooks/useTalentoHumano.test.js
```

## Configuración de Normatividad

El archivo `/backend/config/normatividad-colombia-2025.js` contiene todos los parámetros legales actualizados:

- SMLV y auxilio de transporte
- Porcentajes de aportes de seguridad social
- Tabla de retención en la fuente
- Parafiscales
- Días festivos del año
- Fórmulas de cálculo de prestaciones

## Seguridad

- Todas las rutas requieren autenticación (`authMiddleware`)
- Permisos granulares con `permissionMiddleware('talento-humano')`
- Encuestas pueden ser anónimas
- Datos sensibles de nómina solo accesibles por roles autorizados

## Performance

- Paginación en todos los listados
- Cálculos de nómina optimizados con Promise.all
- Caché de parámetros de normatividad
- Índices en campos de búsqueda frecuente
