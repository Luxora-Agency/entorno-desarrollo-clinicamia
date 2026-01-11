# Plan de Implementación: Módulo Infraestructura - Calidad 2.0

**Fecha:** 2026-01-05
**Proyecto:** Clínica Mía - Sistema de Gestión de Calidad
**Módulo:** Infraestructura (submódulo de Calidad 2.0)

---

## 📋 Resumen Ejecutivo

Implementar el submódulo "Infraestructura" dentro de Calidad 2.0 con 3 apartados principales y 7 subsecciones PGIRASA. Incluye gestión documental tipo Drive, formularios digitales RH1, indicadores automáticos/manuales, y sistema de alertas multicanal.

**Complejidad:** Alta
**Tiempo Estimado:** 4-6 semanas
**Dependencias:** Calidad 2.0 existente, Prisma, Resend (emails)

---

## 🎯 Alcance del Módulo

### 1. Documentos Legales
- Sistema de carpetas jerárquico (tipo Drive)
- Upload de documentos con metadata
- **Alertas de vencimiento con 3 canales:**
  - Emails automáticos (Resend)
  - Widget de notificaciones en dashboard
  - Badges/colores en listado
- CRUD completo

### 2. Procesos Documentados
- Reutilizar componente existente `ProcesosTab.jsx`
- Crear tipo `PROCESOS_INFRAESTRUCTURA` para diferenciar

### 3. PGIRASA (7 apartados)
#### 3.1. Conceptos Sanitarios
- Organización por años (carpetas: 2024, 2025, etc)
- Listas de chequeo (28 ítems evaluación)
- Solicitudes de visita con documentos

#### 3.2. Auditoría Interna
- Gestión de auditorías internas con documentos

#### 3.3. Auditoría Externa
- Gestión de auditorías externas con documentos

#### 3.4. RH1 (Residuos Hospitalarios)
- **Formulario digital** con campos (no solo upload)
- Registro DIARIO (31 días/mes)
- Cálculos automáticos de totales
- Manifiestos de recolección
- Actas de desactivación

#### 3.5. Formula RH1
- Documentación de metodología RH1

#### 3.6. Indicadores
- **7 indicadores principales** (mixto: automáticos + manuales)
- Automáticos desde RH1: Destinación Incineración, Reciclaje, Otro Sistema
- Manuales: Capacitaciones, Accidentes (Frecuencia, Gravedad, Incidencia)
- Dashboard con gráficas

#### 3.7. Reportes
- Reportes consolidados mensual/semestral
- Exportación Excel/PDF

#### 3.8. Formatos
- Plantillas de formatos PGIRASA

---

## 🗄️ FASE 1: Modelos de Base de Datos (Prisma)

**Archivo:** `/backend/prisma/schema.prisma`

### Modelos Nuevos a Agregar

```prisma
// ==========================================
// MÓDULO INFRAESTRUCTURA - CALIDAD 2.0
// ==========================================

// 1. DOCUMENTOS LEGALES CON ALERTAS
model DocumentoLegalInfraestructura {
  id                String    @id @default(uuid())
  carpetaId         String?   @map("carpeta_id")
  nombre            String
  descripcion       String?
  tipoDocumento     String    @map("tipo_documento") // CONCEPTO_SANITARIO, CERTIFICADO, LICENCIA, etc
  numeroDocumento   String?   @map("numero_documento")
  entidadEmisora    String?   @map("entidad_emisora")

  // Archivo
  archivoUrl        String    @map("archivo_url")
  archivoNombre     String    @map("archivo_nombre")
  archivoTipo       String    @map("archivo_tipo")
  archivoTamano     Int       @map("archivo_tamano")

  // Vencimiento y Alertas
  fechaEmision      DateTime? @map("fecha_emision")
  fechaVencimiento  DateTime? @map("fecha_vencimiento")
  tieneVencimiento  Boolean   @default(false) @map("tiene_vencimiento")
  diasAlerta        Int[]     @default([30, 15, 7]) @map("dias_alerta") // Días antes para alertar

  // Auditoría
  subidoPor         String    @map("subido_por") @db.Uuid
  activo            Boolean   @default(true)
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relaciones
  carpeta           CarpetaCalidad2? @relation(fields: [carpetaId], references: [id])
  usuario           Usuario          @relation("DocumentoLegalCreador", fields: [subidoPor], references: [id])
  alertas           AlertaDocumentoLegal[]

  @@map("documentos_legales_infraestructura")
}

model AlertaDocumentoLegal {
  id                String    @id @default(uuid())
  documentoId       String    @map("documento_id")
  tipo              String    // POR_VENCER_30, POR_VENCER_15, POR_VENCER_7, VENCIDO
  mensaje           String
  fechaAlerta       DateTime  @map("fecha_alerta")
  diasRestantes     Int?      @map("dias_restantes")

  // Estado
  estado            String    @default("PENDIENTE") // PENDIENTE, NOTIFICADO, RESUELTO
  fechaNotificacion DateTime? @map("fecha_notificacion")
  emailEnviado      Boolean   @default(false) @map("email_enviado")

  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relaciones
  documento         DocumentoLegalInfraestructura @relation(fields: [documentoId], references: [id], onDelete: Cascade)

  @@map("alertas_documentos_legales")
}

// 2. CONCEPTOS SANITARIOS (PGIRASA)
model ConceptoSanitario {
  id                    String    @id @default(uuid())
  anio                  Int
  numeroConcepto        String    @map("numero_concepto")
  fechaInspeccion       DateTime  @map("fecha_inspeccion")
  entidadInspectora     String    @map("entidad_inspectora")
  tipoInspeccion        String    @map("tipo_inspeccion") // ORDINARIA, EXTRAORDINARIA, SEGUIMIENTO

  // Estado General
  estadoGeneral         String    @map("estado_general") // CONFORME, NO_CONFORME, REQUIERE_MEJORA
  porcentajeCompliance  Float     @map("porcentaje_compliance")
  observaciones         String?

  // Auditoría
  evaluadoPor           String    @map("evaluado_por") @db.Uuid
  fechaEvaluacion       DateTime  @map("fecha_evaluacion")
  activo                Boolean   @default(true)
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  // Relaciones
  evaluador             Usuario                        @relation("ConceptoSanitarioEvaluador", fields: [evaluadoPor], references: [id])
  items                 ItemConceptoSanitario[]
  documentos            DocumentoConceptoSanitario[]
  solicitudesVisita     SolicitudVisitaInspeccion[]

  @@unique([anio, numeroConcepto])
  @@map("conceptos_sanitarios")
}

model ItemConceptoSanitario {
  id                  String    @id @default(uuid())
  conceptoId          String    @map("concepto_id")
  numero              Int       // 1-28
  pregunta            String
  respuesta           String    // SI, NO, N/A, o texto libre
  observaciones       String?
  cumple              Boolean?  // true si respuesta = SI, false si NO, null si N/A
  evidenciaUrl        String?   @map("evidencia_url")

  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relaciones
  concepto            ConceptoSanitario @relation(fields: [conceptoId], references: [id], onDelete: Cascade)

  @@unique([conceptoId, numero])
  @@map("items_concepto_sanitario")
}

model DocumentoConceptoSanitario {
  id                  String    @id @default(uuid())
  conceptoId          String    @map("concepto_id")
  nombre              String
  descripcion         String?
  archivoUrl          String    @map("archivo_url")
  archivoNombre       String    @map("archivo_nombre")
  archivoTipo         String    @map("archivo_tipo")
  tipoDocumento       String    @map("tipo_documento") // CHECKLIST, EVIDENCIA, ACTA, OTRO

  subidoPor           String    @map("subido_por") @db.Uuid
  createdAt           DateTime  @default(now()) @map("created_at")

  // Relaciones
  concepto            ConceptoSanitario @relation(fields: [conceptoId], references: [id], onDelete: Cascade)
  usuario             Usuario           @relation("DocumentoConceptoCreador", fields: [subidoPor], references: [id])

  @@map("documentos_concepto_sanitario")
}

model SolicitudVisitaInspeccion {
  id                  String    @id @default(uuid())
  conceptoId          String?   @map("concepto_id")
  anio                Int
  fechaSolicitud      DateTime  @map("fecha_solicitud")
  fechaProgramada     DateTime? @map("fecha_programada")
  entidadSolicitante  String    @map("entidad_solicitante")
  motivo              String
  estado              String    @default("PROGRAMADA") // PROGRAMADA, REALIZADA, CANCELADA
  observaciones       String?

  // Auditoría
  solicitadoPor       String    @map("solicitado_por") @db.Uuid
  activo              Boolean   @default(true)
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relaciones
  concepto            ConceptoSanitario? @relation(fields: [conceptoId], references: [id])
  solicitante         Usuario            @relation("SolicitudVisitaCreador", fields: [solicitadoPor], references: [id])
  documentos          DocumentoSolicitudVisita[]

  @@map("solicitudes_visita_inspeccion")
}

model DocumentoSolicitudVisita {
  id                  String    @id @default(uuid())
  solicitudId         String    @map("solicitud_id")
  nombre              String
  descripcion         String?
  archivoUrl          String    @map("archivo_url")
  archivoNombre       String    @map("archivo_nombre")
  archivoTipo         String    @map("archivo_tipo")
  tipoDocumento       String    @map("tipo_documento") // REQUISITO, SOPORTE, CERTIFICADO, OTRO

  subidoPor           String    @map("subido_por") @db.Uuid
  createdAt           DateTime  @default(now()) @map("created_at")

  // Relaciones
  solicitud           SolicitudVisitaInspeccion @relation(fields: [solicitudId], references: [id], onDelete: Cascade)
  usuario             Usuario                   @relation("DocumentoSolicitudVisitaCreador", fields: [subidoPor], references: [id])

  @@map("documentos_solicitud_visita")
}

// 3. AUDITORÍAS (INTERNAS Y EXTERNAS)
model AuditoriaInfraestructura {
  id                  String    @id @default(uuid())
  tipo                String    // INTERNA, EXTERNA
  codigo              String    @unique
  nombre              String
  fechaInicio         DateTime  @map("fecha_inicio")
  fechaFin            DateTime? @map("fecha_fin")
  objetivo            String
  alcance             String
  equipo              String[]  // Lista de auditores
  hallazgos           String?
  conclusiones        String?

  // Estado
  estado              String    @default("PROGRAMADA") // PROGRAMADA, EN_CURSO, COMPLETADA, CANCELADA

  // Auditoría
  creadoPor           String    @map("creado_por") @db.Uuid
  activo              Boolean   @default(true)
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relaciones
  creador             Usuario                            @relation("AuditoriaCreador", fields: [creadoPor], references: [id])
  documentos          DocumentoAuditoriaInfraestructura[]

  @@map("auditorias_infraestructura")
}

model DocumentoAuditoriaInfraestructura {
  id                  String    @id @default(uuid())
  auditoriaId         String    @map("auditoria_id")
  nombre              String
  descripcion         String?
  archivoUrl          String    @map("archivo_url")
  archivoNombre       String    @map("archivo_nombre")
  archivoTipo         String    @map("archivo_tipo")
  tipoDocumento       String    @map("tipo_documento") // PLAN, CHECKLIST, INFORME, EVIDENCIA, OTRO

  subidoPor           String    @map("subido_por") @db.Uuid
  createdAt           DateTime  @default(now()) @map("created_at")

  // Relaciones
  auditoria           AuditoriaInfraestructura @relation(fields: [auditoriaId], references: [id], onDelete: Cascade)
  usuario             Usuario                  @relation("DocumentoAuditoriaCreador", fields: [subidoPor], references: [id])

  @@map("documentos_auditoria_infraestructura")
}

// 4. FORMULARIO RH1 (RESIDUOS HOSPITALARIOS)
model ResiduoRH1 {
  id                        String    @id @default(uuid())
  fecha                     DateTime  @unique
  mes                       Int
  anio                      Int
  dia                       Int

  // Residuos No Peligrosos (kg/día)
  residuosAprovechables     Float     @default(0) @map("residuos_aprovechables")
  residuosNoAprovechables   Float     @default(0) @map("residuos_no_aprovechables")

  // Residuos Peligrosos (kg/día)
  residuosInfecciosos       Float     @default(0) @map("residuos_infecciosos")
  residuosBiosanitarios     Float     @default(0) @map("residuos_biosanitarios")

  // Totales Calculados Automáticamente
  totalNoPeligrosos         Float     @default(0) @map("total_no_peligrosos")
  totalPeligrosos           Float     @default(0) @map("total_peligrosos")
  totalGenerado             Float     @default(0) @map("total_generado")

  // Auditoría
  registradoPor             String    @map("registrado_por") @db.Uuid
  modificadoPor             String?   @map("modificado_por") @db.Uuid
  activo                    Boolean   @default(true)
  createdAt                 DateTime  @default(now()) @map("created_at")
  updatedAt                 DateTime  @updatedAt @map("updated_at")

  // Relaciones
  registrador               Usuario   @relation("ResiduoRH1Registrador", fields: [registradoPor], references: [id])
  modificador               Usuario?  @relation("ResiduoRH1Modificador", fields: [modificadoPor], references: [id])

  @@unique([anio, mes, dia])
  @@map("residuos_rh1")
}

model ManifiestoRecoleccion {
  id                  String    @id @default(uuid())
  numeroManifiesto    String    @unique @map("numero_manifiesto")
  fecha               DateTime
  empresaRecolectora  String    @map("empresa_recolectora")
  tipoResiduo         String    @map("tipo_residuo") // PELIGROSO, NO_PELIGROSO
  cantidadKg          Float     @map("cantidad_kg")
  responsable         String
  observaciones       String?

  // Archivo adjunto
  archivoUrl          String?   @map("archivo_url")
  archivoNombre       String?   @map("archivo_nombre")

  // Auditoría
  registradoPor       String    @map("registrado_por") @db.Uuid
  activo              Boolean   @default(true)
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relaciones
  registrador         Usuario   @relation("ManifiestoCreador", fields: [registradoPor], references: [id])

  @@map("manifiestos_recoleccion")
}

model ActaDesactivacion {
  id                  String    @id @default(uuid())
  numeroActa          String    @unique @map("numero_acta")
  fecha               DateTime
  tipoEquipo          String    @map("tipo_equipo")
  numeroSerie         String?   @map("numero_serie")
  motivoDesactivacion String    @map("motivo_desactivacion")
  responsable         String
  testigos            String[]
  observaciones       String?

  // Archivo adjunto
  archivoUrl          String?   @map("archivo_url")
  archivoNombre       String?   @map("archivo_nombre")

  // Auditoría
  registradoPor       String    @map("registrado_por") @db.Uuid
  activo              Boolean   @default(true)
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relaciones
  registrador         Usuario   @relation("ActaDesactivacionCreador", fields: [registradoPor], references: [id])

  @@map("actas_desactivacion")
}

// 5. INDICADORES PGIRASA
model IndicadorPGIRASA {
  id                      String    @id @default(uuid())
  codigo                  String    @unique
  nombre                  String
  objetivo                String
  alcance                 String
  dominio                 String    // SEGURIDAD, AMBIENTAL

  // Fórmula
  numeradorDescripcion    String    @map("numerador_descripcion")
  denominadorDescripcion  String    @map("denominador_descripcion")
  formulaCalculo          String?   @map("formula_calculo")

  // Tipo
  tipoCalculo             String    @map("tipo_calculo") // AUTOMATICO, MANUAL, MIXTO
  fuenteDatos             String[]  @map("fuente_datos")

  // Responsabilidades
  responsableKPI          String    @map("responsable_kpi")
  responsableMedicion     String    @map("responsable_medicion")

  // Periodicidad
  frecuencia              String    // MENSUAL, TRIMESTRAL, CUATRIMESTRAL, SEMESTRAL, ANUAL

  // Metas
  metaValor               Float?    @map("meta_valor")
  metaTipo                String?   @map("meta_tipo") // MAYOR_IGUAL, MENOR_IGUAL, IGUAL

  // Auditoría
  activo                  Boolean   @default(true)
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")

  // Relaciones
  mediciones              MedicionIndicadorPGIRASA[]

  @@map("indicadores_pgirasa")
}

model MedicionIndicadorPGIRASA {
  id                  String    @id @default(uuid())
  indicadorId         String    @map("indicador_id")
  periodo             String    // "2025-01", "2025-Q1", etc
  mes                 Int?
  anio                Int

  // Valores
  numerador           Float
  denominador         Float
  resultado           Float

  // Metadata
  notas               String?
  calculoAutomatico   Boolean   @default(false) @map("calculo_automatico")

  // Archivos adjuntos
  adjuntos            String[]  // Array de URLs de archivos

  // Auditoría
  registradoPor       String    @map("registrado_por") @db.Uuid
  fechaRegistro       DateTime  @default(now()) @map("fecha_registro")
  estado              String    @default("REGISTRADO") // PENDIENTE, REGISTRADO, VERIFICADO
  verificadoPor       String?   @map("verificado_por") @db.Uuid
  fechaVerificacion   DateTime? @map("fecha_verificacion")
  activo              Boolean   @default(true)
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relaciones
  indicador           IndicadorPGIRASA @relation(fields: [indicadorId], references: [id], onDelete: Cascade)
  registrador         Usuario          @relation("MedicionIndicadorRegistrador", fields: [registradoPor], references: [id])
  verificador         Usuario?         @relation("MedicionIndicadorVerificador", fields: [verificadoPor], references: [id])

  @@unique([indicadorId, periodo])
  @@map("mediciones_indicadores_pgirasa")
}

// 6. FORMATOS Y REPORTES
model FormatoInfraestructura {
  id                  String    @id @default(uuid())
  codigo              String    @unique
  nombre              String
  descripcion         String?
  categoria           String    // RH1, CONCEPTO_SANITARIO, AUDITORIA, OTRO
  version             String    @default("1.0")

  // Archivo plantilla
  plantillaUrl        String?   @map("plantilla_url")
  plantillaNombre     String?   @map("plantilla_nombre")

  // Auditoría
  creadoPor           String    @map("creado_por") @db.Uuid
  activo              Boolean   @default(true)
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relaciones
  creador             Usuario   @relation("FormatoInfraestructuraCreador", fields: [creadoPor], references: [id])

  @@map("formatos_infraestructura")
}

model ReporteInfraestructura {
  id                  String    @id @default(uuid())
  tipo                String    // MENSUAL_RH1, SEMESTRAL_INDICADORES, ANUAL_CONCEPTO, PERSONALIZADO
  periodo             String    // "2025-01", "2025-S1", "2025"
  nombre              String
  descripcion         String?

  // Filtros aplicados
  filtros             String?   @db.Text // JSON string

  // Archivo generado
  archivoUrl          String?   @map("archivo_url")
  archivoNombre       String?   @map("archivo_nombre")
  archivoTipo         String?   @map("archivo_tipo") // PDF, EXCEL

  // Estado
  estado              String    @default("GENERANDO") // GENERANDO, COMPLETADO, ERROR

  // Auditoría
  generadoPor         String    @map("generado_por") @db.Uuid
  fechaGeneracion     DateTime  @default(now()) @map("fecha_generacion")
  activo              Boolean   @default(true)
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relaciones
  generador           Usuario   @relation("ReporteInfraestructuraGenerador", fields: [generadoPor], references: [id])

  @@map("reportes_infraestructura")
}
```

### Enums a Agregar

```prisma
enum TipoAlertaDocumento {
  POR_VENCER_30
  POR_VENCER_15
  POR_VENCER_7
  VENCIDO
}

enum EstadoAlerta {
  PENDIENTE
  NOTIFICADO
  RESUELTO
}

enum TipoInspeccion {
  ORDINARIA
  EXTRAORDINARIA
  SEGUIMIENTO
}

enum EstadoConcepto {
  CONFORME
  NO_CONFORME
  REQUIERE_MEJORA
}

enum TipoAuditoria {
  INTERNA
  EXTERNA
}

enum EstadoAuditoria {
  PROGRAMADA
  EN_CURSO
  COMPLETADA
  CANCELADA
}

enum TipoResiduoManifiesto {
  PELIGROSO
  NO_PELIGROSO
}

enum TipoCalculoIndicador {
  AUTOMATICO
  MANUAL
  MIXTO
}

enum FrecuenciaIndicador {
  MENSUAL
  TRIMESTRAL
  CUATRIMESTRAL
  SEMESTRAL
  ANUAL
}

enum TipoReporteInfraestructura {
  MENSUAL_RH1
  SEMESTRAL_INDICADORES
  ANUAL_CONCEPTO
  PERSONALIZADO
}
```

### Migración

```bash
# Crear migración
cd backend
npx prisma migrate dev --name add_infraestructura_module

# Generar cliente
npx prisma generate
```

---

## ⚙️ FASE 2: Servicios Backend

**Directorio:** `/backend/services/calidad2/infraestructura/`

### Estructura de Servicios

```
/backend/services/calidad2/infraestructura/
├── index.js                              # Exportador principal
├── documentoLegal.service.js             # CRUD documentos legales
├── alertaDocumentoLegal.service.js       # Sistema de alertas
├── conceptoSanitario.service.js          # CRUD conceptos sanitarios
├── itemConceptoSanitario.service.js      # Items de checklist (28)
├── solicitudVisita.service.js            # Solicitudes de visita
├── auditoria.service.js                  # Auditorías internas/externas
├── residuoRH1.service.js                 # Formulario RH1 digital
├── manifiestoRecoleccion.service.js      # Manifiestos
├── actaDesactivacion.service.js          # Actas de desactivación
├── indicadorPGIRASA.service.js           # CRUD indicadores
├── medicionIndicador.service.js          # Mediciones de indicadores
├── calculoIndicador.service.js           # Cálculos automáticos
├── formato.service.js                    # Formatos/plantillas
└── reporte.service.js                    # Generación de reportes
```

### Servicios Clave

#### 1. `alertaDocumentoLegal.service.js`

**Responsabilidades:**
- Generar alertas automáticas (cron job o trigger)
- Enviar emails vía Resend
- Marcar alertas como notificadas
- Dashboard de alertas pendientes

**Métodos Principales:**
```javascript
class AlertaDocumentoLegalService {
  async generarAlertasPendientes()  // Cron diario: revisa docs próximos a vencer
  async enviarEmailAlerta(alertaId) // Envía email con Resend
  async marcarComoNotificado(alertaId)
  async getDashboard()               // Contadores para widget
  async getAlertasPorDocumento(documentoId)
}
```

#### 2. `residuoRH1.service.js`

**Responsabilidades:**
- CRUD de registros diarios
- Calcular totales automáticamente
- Validar consistencia de datos
- Exportar a Excel (formato RH1 oficial)

**Métodos Principales:**
```javascript
class ResiduoRH1Service {
  async create(data)                // Calcula totales automáticamente
  async findByMesAnio(mes, anio)    // 31 registros del mes
  async getTotalesMes(mes, anio)    // Suma del mes
  async exportToExcel(mes, anio)    // Genera Excel formato RH1
  async validateConsistencia(registros) // Valida suma de totales
}
```

#### 3. `calculoIndicador.service.js`

**Responsabilidades:**
- Calcular indicadores automáticos desde RH1
- Actualizar mediciones al guardar RH1
- Validar fórmulas

**Métodos Principales:**
```javascript
class CalculoIndicadorService {
  async calcularDesdeRH1(mes, anio) // Calcula indicadores de residuos
  async calcularDestinacionIncineracion(mes, anio)
  async calcularDestinacionReciclaje(mes, anio)
  async calcularDestinacionOtroSistema(mes, anio)
  async actualizarMedicion(indicadorId, periodo, valores)
}
```

#### 4. `conceptoSanitario.service.js`

**Responsabilidades:**
- CRUD de conceptos sanitarios
- Calcular porcentaje de compliance automáticamente
- Generar reporte PDF

**Métodos Principales:**
```javascript
class ConceptoSanitarioService {
  async create(data)                 // Crea concepto con 28 items
  async calcularCompliance(conceptoId) // (SI / (SI + NO)) * 100
  async generarReportePDF(conceptoId)
  async findByAnio(anio)
}
```

### Validaciones Zod

**Archivo:** `/backend/validators/calidad2/infraestructura.schema.js`

```javascript
const { z } = require('zod');

// Documentos Legales
const createDocumentoLegalSchema = z.object({
  nombre: z.string().min(1).max(255),
  descripcion: z.string().optional(),
  tipoDocumento: z.string(),
  numeroDocumento: z.string().optional(),
  fechaEmision: z.string().datetime().optional(),
  fechaVencimiento: z.string().datetime().optional(),
  tieneVencimiento: z.boolean().default(false),
  diasAlerta: z.array(z.number()).default([30, 15, 7]),
  carpetaId: z.string().uuid().optional(),
});

// RH1 Diario
const createResiduoRH1Schema = z.object({
  fecha: z.string().datetime(),
  residuosAprovechables: z.number().min(0),
  residuosNoAprovechables: z.number().min(0),
  residuosInfecciosos: z.number().min(0),
  residuosBiosanitarios: z.number().min(0),
});

// Concepto Sanitario
const createConceptoSanitarioSchema = z.object({
  anio: z.number().int().min(2000).max(2100),
  numeroConcepto: z.string(),
  fechaInspeccion: z.string().datetime(),
  entidadInspectora: z.string(),
  tipoInspeccion: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SEGUIMIENTO']),
  items: z.array(z.object({
    numero: z.number().int().min(1).max(28),
    pregunta: z.string(),
    respuesta: z.string(),
    observaciones: z.string().optional(),
  })).length(28), // Exactamente 28 items
});

// Indicador
const createIndicadorPGIRASASchema = z.object({
  codigo: z.string(),
  nombre: z.string(),
  objetivo: z.string(),
  alcance: z.string(),
  dominio: z.enum(['SEGURIDAD', 'AMBIENTAL']),
  numeradorDescripcion: z.string(),
  denominadorDescripcion: z.string(),
  tipoCalculo: z.enum(['AUTOMATICO', 'MANUAL', 'MIXTO']),
  frecuencia: z.enum(['MENSUAL', 'TRIMESTRAL', 'CUATRIMESTRAL', 'SEMESTRAL', 'ANUAL']),
  fuenteDatos: z.array(z.string()),
  responsableKPI: z.string(),
  responsableMedicion: z.string(),
});

module.exports = {
  createDocumentoLegalSchema,
  createResiduoRH1Schema,
  createConceptoSanitarioSchema,
  createIndicadorPGIRASASchema,
  // ... más schemas
};
```

---

## 🌐 FASE 3: Rutas y Endpoints

**Archivo:** `/backend/routes/calidad2/infraestructura.js`

### Estructura de Endpoints

```javascript
const { Hono } = require('hono');
const { authMiddleware, permissionMiddleware } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const router = new Hono();

// Middleware global
router.use('/*', authMiddleware, permissionMiddleware('calidad2'));

// ==========================================
// DOCUMENTOS LEGALES
// ==========================================
router.get('/documentos-legales', async (c) => { /* ... */ });
router.get('/documentos-legales/:id', async (c) => { /* ... */ });
router.post('/documentos-legales', validate(createDocumentoLegalSchema), async (c) => { /* ... */ });
router.put('/documentos-legales/:id', async (c) => { /* ... */ });
router.delete('/documentos-legales/:id', async (c) => { /* ... */ });

// Alertas de Documentos Legales
router.get('/documentos-legales/:id/alertas', async (c) => { /* ... */ });
router.get('/alertas/dashboard', async (c) => { /* ... */ });
router.post('/alertas/:id/notificar', async (c) => { /* ... */ });
router.put('/alertas/:id/resolver', async (c) => { /* ... */ });

// ==========================================
// CONCEPTOS SANITARIOS
// ==========================================
router.get('/conceptos-sanitarios', async (c) => { /* ... */ });
router.get('/conceptos-sanitarios/anio/:anio', async (c) => { /* ... */ });
router.get('/conceptos-sanitarios/:id', async (c) => { /* ... */ });
router.post('/conceptos-sanitarios', validate(createConceptoSanitarioSchema), async (c) => { /* ... */ });
router.put('/conceptos-sanitarios/:id', async (c) => { /* ... */ });
router.delete('/conceptos-sanitarios/:id', async (c) => { /* ... */ });
router.get('/conceptos-sanitarios/:id/pdf', async (c) => { /* ... */ });

// Items de Concepto Sanitario
router.get('/conceptos-sanitarios/:id/items', async (c) => { /* ... */ });
router.put('/conceptos-sanitarios/:id/items/:itemId', async (c) => { /* ... */ });

// Solicitudes de Visita
router.get('/solicitudes-visita', async (c) => { /* ... */ });
router.get('/solicitudes-visita/anio/:anio', async (c) => { /* ... */ });
router.post('/solicitudes-visita', async (c) => { /* ... */ });
router.put('/solicitudes-visita/:id', async (c) => { /* ... */ });
router.post('/solicitudes-visita/:id/documentos', async (c) => { /* ... */ });

// ==========================================
// AUDITORÍAS
// ==========================================
router.get('/auditorias', async (c) => { /* ... */ });
router.get('/auditorias/:id', async (c) => { /* ... */ });
router.post('/auditorias', async (c) => { /* ... */ });
router.put('/auditorias/:id', async (c) => { /* ... */ });
router.delete('/auditorias/:id', async (c) => { /* ... */ });
router.post('/auditorias/:id/documentos', async (c) => { /* ... */ });

// ==========================================
// RH1 (RESIDUOS HOSPITALARIOS)
// ==========================================
router.get('/rh1', async (c) => { /* ... */ });
router.get('/rh1/mes/:mes/anio/:anio', async (c) => { /* ... */ });
router.get('/rh1/totales/:mes/:anio', async (c) => { /* ... */ });
router.post('/rh1', validate(createResiduoRH1Schema), async (c) => { /* ... */ });
router.put('/rh1/:id', async (c) => { /* ... */ });
router.delete('/rh1/:id', async (c) => { /* ... */ });
router.get('/rh1/export/:mes/:anio', async (c) => { /* ... */ });

// Manifiestos de Recolección
router.get('/manifiestos', async (c) => { /* ... */ });
router.post('/manifiestos', async (c) => { /* ... */ });
router.put('/manifiestos/:id', async (c) => { /* ... */ });

// Actas de Desactivación
router.get('/actas-desactivacion', async (c) => { /* ... */ });
router.post('/actas-desactivacion', async (c) => { /* ... */ });
router.put('/actas-desactivacion/:id', async (c) => { /* ... */ });

// ==========================================
// INDICADORES PGIRASA
// ==========================================
router.get('/indicadores', async (c) => { /* ... */ });
router.get('/indicadores/:id', async (c) => { /* ... */ });
router.post('/indicadores', validate(createIndicadorPGIRASASchema), async (c) => { /* ... */ });
router.put('/indicadores/:id', async (c) => { /* ... */ });
router.delete('/indicadores/:id', async (c) => { /* ... */ });

// Mediciones de Indicadores
router.get('/indicadores/:id/mediciones', async (c) => { /* ... */ });
router.post('/indicadores/:id/mediciones', async (c) => { /* ... */ });
router.put('/mediciones/:id', async (c) => { /* ... */ });
router.get('/mediciones/periodo/:periodo', async (c) => { /* ... */ });

// Dashboard de Indicadores
router.get('/indicadores/dashboard/resumen', async (c) => { /* ... */ });

// Cálculo Automático (trigger manual)
router.post('/indicadores/calcular/:mes/:anio', async (c) => { /* ... */ });

// ==========================================
// FORMATOS Y REPORTES
// ==========================================
router.get('/formatos', async (c) => { /* ... */ });
router.post('/formatos', async (c) => { /* ... */ });

router.get('/reportes', async (c) => { /* ... */ });
router.post('/reportes/generar', async (c) => { /* ... */ });
router.get('/reportes/:id/descargar', async (c) => { /* ... */ });

module.exports = router;
```

### Montaje en Rutas Principal

**Archivo:** `/backend/routes/calidad2.js`

Agregar al final:

```javascript
// Módulo Infraestructura
const infraestructuraRoutes = require('./calidad2/infraestructura');
app.route('/infraestructura', infraestructuraRoutes);
```

---

## 🎨 FASE 4: Componentes Frontend

**Directorio:** `/frontend/components/clinica/calidad2/infraestructura/`

### Estructura de Componentes

```
/frontend/components/clinica/calidad2/infraestructura/
├── InfraestructuraModule.jsx                # Módulo principal con tabs
│
├── documentos-legales/                      # 1. DOCUMENTOS LEGALES
│   ├── DocumentosLegalesTab.jsx             # Tab principal
│   ├── DocumentoLegalForm.jsx               # Modal crear/editar
│   ├── AlertasWidget.jsx                    # Widget de alertas
│   └── DocumentoLegalCard.jsx               # Card con badge de vencimiento
│
├── procesos-documentados/                   # 2. PROCESOS DOCUMENTADOS
│   └── ProcesosInfraestructuraTab.jsx       # Reutiliza ProcesosTab existente
│
├── pgirasa/                                 # 3. PGIRASA (7 apartados)
│   ├── PGIRASAModule.jsx                    # Módulo PGIRASA con sub-tabs
│   │
│   ├── conceptos-sanitarios/                # 3.1. Conceptos Sanitarios
│   │   ├── ConceptosSanitariosTab.jsx       # Tab principal con carpetas por año
│   │   ├── ConceptoSanitarioForm.jsx        # Formulario 28 items
│   │   ├── ChecklistTable.jsx               # Tabla de 28 items editables
│   │   ├── SolicitudesVisitaList.jsx        # Lista de solicitudes
│   │   └── SolicitudVisitaForm.jsx          # Modal crear solicitud
│   │
│   ├── auditorias/                          # 3.2 y 3.3. Auditorías
│   │   ├── AuditoriasTab.jsx                # Tab con filtro INTERNA/EXTERNA
│   │   ├── AuditoriaForm.jsx                # Modal crear/editar
│   │   └── AuditoriaDocumentos.jsx          # Gestor de documentos adjuntos
│   │
│   ├── rh1/                                 # 3.4. RH1
│   │   ├── RH1Tab.jsx                       # Tab principal con selector mes/año
│   │   ├── RH1FormularioMensual.jsx         # Tabla 31 días editable inline
│   │   ├── RH1TotalesMes.jsx                # Resumen del mes
│   │   ├── ManifiestosRecoleccionList.jsx   # Listado de manifiestos
│   │   ├── ManifiestoForm.jsx               # Modal crear manifiesto
│   │   ├── ActasDesactivacionList.jsx       # Listado de actas
│   │   └── ActaDesactivacionForm.jsx        # Modal crear acta
│   │
│   ├── formula-rh1/                         # 3.5. Formula RH1
│   │   └── FormulaRH1Tab.jsx                # Documentación de metodología
│   │
│   ├── indicadores/                         # 3.6. Indicadores
│   │   ├── IndicadoresTab.jsx               # Tab principal
│   │   ├── IndicadoresDashboard.jsx         # Gráficas y resumen
│   │   ├── IndicadorCard.jsx                # Card de indicador con mediciones
│   │   ├── MedicionForm.jsx                 # Modal registrar medición manual
│   │   ├── IndicadorConfigForm.jsx          # Modal crear/editar indicador
│   │   └── FichaTecnicaIndicador.jsx        # Vista detalle de ficha técnica
│   │
│   ├── reportes/                            # 3.7. Reportes
│   │   ├── ReportesTab.jsx                  # Tab principal
│   │   ├── ReporteGeneratorForm.jsx         # Formulario generar reporte
│   │   └── ReportesList.jsx                 # Historial de reportes
│   │
│   └── formatos/                            # 3.8. Formatos
│       ├── FormatosTab.jsx                  # Tab principal
│       ├── FormatoForm.jsx                  # Modal crear formato
│       └── FormatoCard.jsx                  # Card de formato con descarga
│
└── shared/                                  # Componentes compartidos
    ├── InfraestructuraFolderTree.jsx        # Árbol de carpetas (reutiliza FolderTree)
    ├── InfraestructuraDocumentGrid.jsx      # Grid de documentos (reutiliza)
    └── AlertaBadge.jsx                      # Badge de alerta (colores según días)
```

### Componente Principal

**Archivo:** `/frontend/components/clinica/calidad2/infraestructura/InfraestructuraModule.jsx`

```javascript
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, FileText, Recycle } from 'lucide-react';
import DocumentosLegalesTab from './documentos-legales/DocumentosLegalesTab';
import ProcesosInfraestructuraTab from './procesos-documentados/ProcesosInfraestructuraTab';
import PGIRASAModule from './pgirasa/PGIRASAModule';

export default function InfraestructuraModule({ user }) {
  const [activeTab, setActiveTab] = useState('documentos-legales');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            Infraestructura
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión de documentos legales, procesos y PGIRASA
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documentos-legales">
            <FileText className="w-4 h-4 mr-2" />
            Documentos Legales
          </TabsTrigger>
          <TabsTrigger value="procesos">
            <FileText className="w-4 h-4 mr-2" />
            Procesos Documentados
          </TabsTrigger>
          <TabsTrigger value="pgirasa">
            <Recycle className="w-4 h-4 mr-2" />
            PGIRASA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentos-legales">
          <DocumentosLegalesTab user={user} />
        </TabsContent>

        <TabsContent value="procesos">
          <ProcesosInfraestructuraTab user={user} />
        </TabsContent>

        <TabsContent value="pgirasa">
          <PGIRASAModule user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Componente PGIRASA Module

**Archivo:** `/frontend/components/clinica/calidad2/infraestructura/pgirasa/PGIRASAModule.jsx`

```javascript
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConceptosSanitariosTab from './conceptos-sanitarios/ConceptosSanitariosTab';
import AuditoriasTab from './auditorias/AuditoriasTab';
import RH1Tab from './rh1/RH1Tab';
import FormulaRH1Tab from './formula-rh1/FormulaRH1Tab';
import IndicadoresTab from './indicadores/IndicadoresTab';
import ReportesTab from './reportes/ReportesTab';
import FormatosTab from './formatos/FormatosTab';

export default function PGIRASAModule({ user }) {
  const [activeTab, setActiveTab] = useState('conceptos-sanitarios');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="conceptos-sanitarios">Conceptos</TabsTrigger>
          <TabsTrigger value="auditorias">Auditorías</TabsTrigger>
          <TabsTrigger value="rh1">RH1</TabsTrigger>
          <TabsTrigger value="formula-rh1">Formula</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
          <TabsTrigger value="formatos">Formatos</TabsTrigger>
        </TabsList>

        <TabsContent value="conceptos-sanitarios">
          <ConceptosSanitariosTab user={user} />
        </TabsContent>

        <TabsContent value="auditorias">
          <AuditoriasTab user={user} />
        </TabsContent>

        <TabsContent value="rh1">
          <RH1Tab user={user} />
        </TabsContent>

        <TabsContent value="formula-rh1">
          <FormulaRH1Tab user={user} />
        </TabsContent>

        <TabsContent value="indicadores">
          <IndicadoresTab user={user} />
        </TabsContent>

        <TabsContent value="reportes">
          <ReportesTab user={user} />
        </TabsContent>

        <TabsContent value="formatos">
          <FormatosTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Componente Clave: RH1 Formulario Mensual

**Archivo:** `/frontend/components/clinica/calidad2/infraestructura/pgirasa/rh1/RH1FormularioMensual.jsx`

```javascript
'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function RH1FormularioMensual({ mes, anio, registrosIniciales, onSave }) {
  const [registros, setRegistros] = useState([]);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    // Inicializar 31 días
    const dias = Array.from({ length: 31 }, (_, i) => {
      const diaExistente = registrosIniciales?.find(r => r.dia === i + 1);
      return diaExistente || {
        dia: i + 1,
        residuosAprovechables: 0,
        residuosNoAprovechables: 0,
        residuosInfecciosos: 0,
        residuosBiosanitarios: 0,
      };
    });
    setRegistros(dias);
  }, [mes, anio, registrosIniciales]);

  const handleChange = (dia, campo, valor) => {
    setRegistros(prev => prev.map(r => {
      if (r.dia === dia) {
        const updated = { ...r, [campo]: parseFloat(valor) || 0 };
        // Calcular totales automáticamente
        updated.totalNoPeligrosos = updated.residuosAprovechables + updated.residuosNoAprovechables;
        updated.totalPeligrosos = updated.residuosInfecciosos + updated.residuosBiosanitarios;
        updated.totalGenerado = updated.totalNoPeligrosos + updated.totalPeligrosos;
        return updated;
      }
      return r;
    }));
    setChanged(true);
  };

  const handleSave = () => {
    onSave(registros);
    setChanged(false);
  };

  // Calcular totales del mes
  const totalesMes = registros.reduce((acc, r) => ({
    aprovechables: acc.aprovechables + r.residuosAprovechables,
    noAprovechables: acc.noAprovechables + r.residuosNoAprovechables,
    infecciosos: acc.infecciosos + r.residuosInfecciosos,
    biosanitarios: acc.biosanitarios + r.residuosBiosanitarios,
    totalNoPeligrosos: acc.totalNoPeligrosos + (r.totalNoPeligrosos || 0),
    totalPeligrosos: acc.totalPeligrosos + (r.totalPeligrosos || 0),
    totalGenerado: acc.totalGenerado + (r.totalGenerado || 0),
  }), {
    aprovechables: 0,
    noAprovechables: 0,
    infecciosos: 0,
    biosanitarios: 0,
    totalNoPeligrosos: 0,
    totalPeligrosos: 0,
    totalGenerado: 0,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Registro Diario - {mes}/{anio}
        </h3>
        <Button onClick={handleSave} disabled={!changed}>
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Día</TableHead>
              <TableHead className="text-center" colSpan={2}>Residuos No Peligrosos (kg/día)</TableHead>
              <TableHead className="text-center" colSpan={2}>Residuos Peligrosos (kg/día)</TableHead>
              <TableHead className="text-center" colSpan={3}>Totales Calculados (kg)</TableHead>
            </TableRow>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Aprovechables</TableHead>
              <TableHead>No Aprovechables</TableHead>
              <TableHead>Infecciosos</TableHead>
              <TableHead>Biosanitarios</TableHead>
              <TableHead>No Peligrosos</TableHead>
              <TableHead>Peligrosos</TableHead>
              <TableHead>Total Generado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map(registro => (
              <TableRow key={registro.dia}>
                <TableCell className="font-medium">{registro.dia}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={registro.residuosAprovechables}
                    onChange={(e) => handleChange(registro.dia, 'residuosAprovechables', e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={registro.residuosNoAprovechables}
                    onChange={(e) => handleChange(registro.dia, 'residuosNoAprovechables', e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={registro.residuosInfecciosos}
                    onChange={(e) => handleChange(registro.dia, 'residuosInfecciosos', e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={registro.residuosBiosanitarios}
                    onChange={(e) => handleChange(registro.dia, 'residuosBiosanitarios', e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell className="bg-gray-50 text-center">
                  {(registro.totalNoPeligrosos || 0).toFixed(2)}
                </TableCell>
                <TableCell className="bg-gray-50 text-center">
                  {(registro.totalPeligrosos || 0).toFixed(2)}
                </TableCell>
                <TableCell className="bg-blue-50 text-center font-medium">
                  {(registro.totalGenerado || 0).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            {/* Fila de totales */}
            <TableRow className="bg-blue-100 font-bold">
              <TableCell>TOTAL MES</TableCell>
              <TableCell className="text-center">{totalesMes.aprovechables.toFixed(2)}</TableCell>
              <TableCell className="text-center">{totalesMes.noAprovechables.toFixed(2)}</TableCell>
              <TableCell className="text-center">{totalesMes.infecciosos.toFixed(2)}</TableCell>
              <TableCell className="text-center">{totalesMes.biosanitarios.toFixed(2)}</TableCell>
              <TableCell className="text-center">{totalesMes.totalNoPeligrosos.toFixed(2)}</TableCell>
              <TableCell className="text-center">{totalesMes.totalPeligrosos.toFixed(2)}</TableCell>
              <TableCell className="text-center">{totalesMes.totalGenerado.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

---

## 🎣 FASE 5: Hooks Personalizados

**Directorio:** `/frontend/hooks/`

### Hooks a Crear

```
/frontend/hooks/
├── useInfraestructuraDocumentosLegales.js
├── useInfraestructuraAlertasDocumentos.js
├── useInfraestructuraConceptosSanitarios.js
├── useInfraestructuraAuditorias.js
├── useInfraestructuraRH1.js
├── useInfraestructuraManifiestos.js
├── useInfraestructuraActasDesactivacion.js
├── useInfraestructuraIndicadores.js
├── useInfraestructuraMedicionesIndicadores.js
├── useInfraestructuraFormatos.js
└── useInfraestructuraReportes.js
```

### Hook Ejemplo: `useInfraestructuraRH1.js`

```javascript
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useInfraestructuraRH1() {
  const [registros, setRegistros] = useState([]);
  const [totalesMes, setTotalesMes] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMes = useCallback(async (mes, anio) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/rh1/mes/${mes}/anio/${anio}`);
      setRegistros(data || []);
      return data;
    } catch (error) {
      toast.error('Error al cargar registros RH1');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTotalesMes = useCallback(async (mes, anio) => {
    try {
      const data = await apiGet(`/calidad2/infraestructura/rh1/totales/${mes}/${anio}`);
      setTotalesMes(data);
      return data;
    } catch (error) {
      toast.error('Error al cargar totales del mes');
      return null;
    }
  }, []);

  const guardarRegistros = useCallback(async (registros) => {
    try {
      setLoading(true);
      const promises = registros.map(registro =>
        registro.id
          ? apiPut(`/calidad2/infraestructura/rh1/${registro.id}`, registro)
          : apiPost('/calidad2/infraestructura/rh1', registro)
      );
      await Promise.all(promises);
      toast.success('Registros guardados correctamente');
      return true;
    } catch (error) {
      toast.error('Error al guardar registros');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportarExcel = useCallback(async (mes, anio) => {
    try {
      const blob = await apiGet(`/calidad2/infraestructura/rh1/export/${mes}/${anio}`, {}, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RH1_${mes}_${anio}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Excel exportado correctamente');
    } catch (error) {
      toast.error('Error al exportar Excel');
    }
  }, []);

  return {
    registros,
    totalesMes,
    loading,
    loadMes,
    loadTotalesMes,
    guardarRegistros,
    exportarExcel,
  };
}
```

---

## 🚨 FASE 6: Sistema de Alertas

### 6.1. Cron Job para Generar Alertas

**Archivo:** `/backend/jobs/alertasDocumentosLegales.job.js`

```javascript
const cron = require('node-cron');
const alertaDocumentoLegalService = require('../services/calidad2/infraestructura/alertaDocumentoLegal.service');

// Ejecutar todos los días a las 8:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Generando alertas de documentos legales...');
  try {
    await alertaDocumentoLegalService.generarAlertasPendientes();
    console.log('[CRON] Alertas generadas exitosamente');
  } catch (error) {
    console.error('[CRON] Error al generar alertas:', error);
  }
});

module.exports = {};
```

### 6.2. Servicio de Alertas

**Archivo:** `/backend/services/calidad2/infraestructura/alertaDocumentoLegal.service.js`

```javascript
const prisma = require('../../../db/prisma');
const emailService = require('../../email.service');
const { subDays, isAfter, isBefore, differenceInDays } = require('date-fns');

class AlertaDocumentoLegalService {
  async generarAlertasPendientes() {
    const hoy = new Date();

    // Buscar documentos con vencimiento que tengan alertas configuradas
    const documentos = await prisma.documentoLegalInfraestructura.findMany({
      where: {
        tieneVencimiento: true,
        fechaVencimiento: {
          gte: hoy, // Solo futuros o hoy
        },
        activo: true,
      },
      include: {
        usuario: true,
      },
    });

    const alertasCreadas = [];

    for (const doc of documentos) {
      const diasRestantes = differenceInDays(doc.fechaVencimiento, hoy);

      // Verificar si debe crear alerta según los días configurados
      for (const diasAlerta of doc.diasAlerta) {
        if (diasRestantes === diasAlerta) {
          // Crear alerta
          const tipo = `POR_VENCER_${diasAlerta}`;
          const mensaje = `El documento "${doc.nombre}" vencerá en ${diasAlerta} días (${doc.fechaVencimiento.toLocaleDateString()})`;

          const alertaExistente = await prisma.alertaDocumentoLegal.findFirst({
            where: {
              documentoId: doc.id,
              tipo,
              estado: 'PENDIENTE',
            },
          });

          if (!alertaExistente) {
            const alerta = await prisma.alertaDocumentoLegal.create({
              data: {
                documentoId: doc.id,
                tipo,
                mensaje,
                fechaAlerta: hoy,
                diasRestantes,
                estado: 'PENDIENTE',
              },
            });

            // Enviar email
            await this.enviarEmailAlerta(alerta.id);

            alertasCreadas.push(alerta);
          }
        }
      }

      // Verificar si está vencido
      if (diasRestantes < 0) {
        const alertaVencida = await prisma.alertaDocumentoLegal.findFirst({
          where: {
            documentoId: doc.id,
            tipo: 'VENCIDO',
            estado: 'PENDIENTE',
          },
        });

        if (!alertaVencida) {
          const alerta = await prisma.alertaDocumentoLegal.create({
            data: {
              documentoId: doc.id,
              tipo: 'VENCIDO',
              mensaje: `El documento "${doc.nombre}" está VENCIDO desde ${doc.fechaVencimiento.toLocaleDateString()}`,
              fechaAlerta: hoy,
              diasRestantes: Math.abs(diasRestantes),
              estado: 'PENDIENTE',
            },
          });

          await this.enviarEmailAlerta(alerta.id);
          alertasCreadas.push(alerta);
        }
      }
    }

    return alertasCreadas;
  }

  async enviarEmailAlerta(alertaId) {
    const alerta = await prisma.alertaDocumentoLegal.findUnique({
      where: { id: alertaId },
      include: {
        documento: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!alerta || alerta.emailEnviado) return;

    // Obtener emails de administradores de calidad
    const admins = await prisma.usuario.findMany({
      where: {
        rol: { in: ['SUPER_ADMIN', 'ADMIN'] },
        activo: true,
      },
      select: { email: true },
    });

    const emails = [
      alerta.documento.usuario.email,
      ...admins.map(a => a.email),
    ].filter(Boolean);

    const subject = alerta.tipo === 'VENCIDO'
      ? `⚠️ Documento VENCIDO - ${alerta.documento.nombre}`
      : `⏰ Alerta: Documento próximo a vencer - ${alerta.documento.nombre}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: ${alerta.tipo === 'VENCIDO' ? '#dc2626' : '#f59e0b'}; margin-bottom: 20px;">
            ${alerta.tipo === 'VENCIDO' ? '⚠️ Documento VENCIDO' : '⏰ Alerta de Vencimiento'}
          </h2>

          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ${alerta.mensaje}
          </p>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Documento:</strong> ${alerta.documento.nombre}<br>
            <strong>Tipo:</strong> ${alerta.documento.tipoDocumento}<br>
            <strong>Fecha de Vencimiento:</strong> ${alerta.documento.fechaVencimiento.toLocaleDateString()}<br>
            ${alerta.documento.numeroDocumento ? `<strong>Número:</strong> ${alerta.documento.numeroDocumento}<br>` : ''}
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Por favor, tome las acciones necesarias para renovar o actualizar este documento.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #999;">
            Este es un mensaje automático del Sistema de Gestión de Calidad - Clínica Mía.<br>
            No responda a este correo.
          </p>
        </div>
      </div>
    `;

    try {
      await emailService.sendEmail({
        to: emails,
        subject,
        html: htmlContent,
      });

      // Marcar como enviado
      await prisma.alertaDocumentoLegal.update({
        where: { id: alertaId },
        data: {
          emailEnviado: true,
          fechaNotificacion: new Date(),
          estado: 'NOTIFICADO',
        },
      });
    } catch (error) {
      console.error('Error al enviar email de alerta:', error);
      throw error;
    }
  }

  async getDashboard() {
    const [pendientes, notificadas, resueltas, porVencer7, porVencer15, vencidos] = await Promise.all([
      prisma.alertaDocumentoLegal.count({ where: { estado: 'PENDIENTE' } }),
      prisma.alertaDocumentoLegal.count({ where: { estado: 'NOTIFICADO' } }),
      prisma.alertaDocumentoLegal.count({ where: { estado: 'RESUELTO' } }),
      prisma.alertaDocumentoLegal.count({ where: { tipo: 'POR_VENCER_7', estado: { not: 'RESUELTO' } } }),
      prisma.alertaDocumentoLegal.count({ where: { tipo: 'POR_VENCER_15', estado: { not: 'RESUELTO' } } }),
      prisma.alertaDocumentoLegal.count({ where: { tipo: 'VENCIDO', estado: { not: 'RESUELTO' } } }),
    ]);

    const alertasRecientes = await prisma.alertaDocumentoLegal.findMany({
      where: { estado: { not: 'RESUELTO' } },
      include: {
        documento: {
          select: {
            nombre: true,
            tipoDocumento: true,
            fechaVencimiento: true,
          },
        },
      },
      orderBy: [
        { tipo: 'asc' }, // VENCIDO primero
        { diasRestantes: 'asc' },
      ],
      take: 10,
    });

    return {
      contadores: {
        pendientes,
        notificadas,
        resueltas,
        porVencer7,
        porVencer15,
        vencidos,
      },
      alertasRecientes,
    };
  }

  async marcarComoResuelto(alertaId) {
    return prisma.alertaDocumentoLegal.update({
      where: { id: alertaId },
      data: { estado: 'RESUELTO' },
    });
  }
}

module.exports = new AlertaDocumentoLegalService();
```

### 6.3. Widget de Alertas Frontend

**Archivo:** `/frontend/components/clinica/calidad2/infraestructura/documentos-legales/AlertasWidget.jsx`

```javascript
'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInfraestructuraAlertasDocumentos } from '@/hooks/useInfraestructuraAlertasDocumentos';

export default function AlertasWidget() {
  const { dashboard, loading, loadDashboard } = useInfraestructuraAlertasDocumentos();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) return <div>Cargando alertas...</div>;

  const { contadores, alertasRecientes } = dashboard || { contadores: {}, alertasRecientes: [] };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alertas de Vencimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contadores */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{contadores.vencidos || 0}</div>
            <div className="text-xs text-red-700">Vencidos</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{contadores.porVencer7 || 0}</div>
            <div className="text-xs text-orange-700">Próximos 7 días</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{contadores.porVencer15 || 0}</div>
            <div className="text-xs text-yellow-700">Próximos 15 días</div>
          </div>
        </div>

        {/* Lista de alertas recientes */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alertasRecientes.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No hay alertas pendientes</p>
            </div>
          ) : (
            alertasRecientes.map(alerta => (
              <div
                key={alerta.id}
                className={`p-3 rounded-lg border ${
                  alerta.tipo === 'VENCIDO'
                    ? 'bg-red-50 border-red-200'
                    : alerta.tipo === 'POR_VENCER_7'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {alerta.tipo === 'VENCIDO' ? (
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {alerta.documento.nombre}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {alerta.mensaje}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {alerta.documento.tipoDocumento}
                      </Badge>
                      {alerta.estado === 'NOTIFICADO' && (
                        <span className="text-xs text-gray-500">✓ Notificado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 📊 FASE 7: Cálculo Automático de Indicadores

### Servicio de Cálculo

**Archivo:** `/backend/services/calidad2/infraestructura/calculoIndicador.service.js`

```javascript
const prisma = require('../../../db/prisma');
const { ValidationError } = require('../../../utils/errors');

class CalculoIndicadorService {
  /**
   * Calcular indicadores automáticos desde RH1
   */
  async calcularDesdeRH1(mes, anio) {
    const registros = await prisma.residuoRH1.findMany({
      where: { mes, anio, activo: true },
    });

    if (registros.length === 0) {
      throw new ValidationError('No hay registros RH1 para el mes/año especificado');
    }

    // Calcular totales del mes
    const totales = registros.reduce((acc, r) => ({
      totalGenerado: acc.totalGenerado + r.totalGenerado,
      totalPeligrosos: acc.totalPeligrosos + r.totalPeligrosos,
      totalNoPeligrosos: acc.totalNoPeligrosos + r.totalNoPeligrosos,
      totalAprovechables: acc.totalAprovechables + r.residuosAprovechables,
      totalInfecciosos: acc.totalInfecciosos + r.residuosInfecciosos,
      totalBiosanitarios: acc.totalBiosanitarios + r.residuosBiosanitarios,
    }), {
      totalGenerado: 0,
      totalPeligrosos: 0,
      totalNoPeligrosos: 0,
      totalAprovechables: 0,
      totalInfecciosos: 0,
      totalBiosanitarios: 0,
    });

    // Buscar indicadores automáticos
    const indicadores = await prisma.indicadorPGIRASA.findMany({
      where: {
        tipoCalculo: { in: ['AUTOMATICO', 'MIXTO'] },
        activo: true,
      },
    });

    const mediciones = [];
    const periodo = `${anio}-${String(mes).padStart(2, '0')}`;

    for (const indicador of indicadores) {
      let numerador = 0;
      let denominador = totales.totalGenerado;

      // Determinar numerador según código de indicador
      switch (indicador.codigo) {
        case 'DEST_INCINERACION':
          // Asumir que infecciosos van a incineración
          numerador = totales.totalInfecciosos;
          break;

        case 'DEST_RECICLAJE':
          numerador = totales.totalAprovechables;
          break;

        case 'DEST_OTRO_SISTEMA':
          // Biosanitarios van a esterilización
          numerador = totales.totalBiosanitarios;
          break;

        default:
          continue; // Saltar indicadores manuales
      }

      const resultado = denominador > 0 ? (numerador / denominador) * 100 : 0;

      // Crear o actualizar medición
      const medicionExistente = await prisma.medicionIndicadorPGIRASA.findUnique({
        where: {
          indicadorId_periodo: {
            indicadorId: indicador.id,
            periodo,
          },
        },
      });

      if (medicionExistente) {
        const updated = await prisma.medicionIndicadorPGIRASA.update({
          where: { id: medicionExistente.id },
          data: {
            numerador,
            denominador,
            resultado,
            calculoAutomatico: true,
          },
        });
        mediciones.push(updated);
      } else {
        const created = await prisma.medicionIndicadorPGIRASA.create({
          data: {
            indicadorId: indicador.id,
            periodo,
            mes,
            anio,
            numerador,
            denominador,
            resultado,
            calculoAutomatico: true,
            registradoPor: 'SISTEMA', // Usuario sistema
            estado: 'REGISTRADO',
          },
        });
        mediciones.push(created);
      }
    }

    return {
      totales,
      mediciones,
    };
  }

  /**
   * Hook: Calcular automáticamente al guardar RH1
   */
  async onRH1Saved(mes, anio) {
    try {
      await this.calcularDesdeRH1(mes, anio);
    } catch (error) {
      console.error('Error al calcular indicadores automáticos:', error);
      // No lanzar error para no bloquear el guardado de RH1
    }
  }
}

module.exports = new CalculoIndicadorService();
```

---

## 🗂️ FASE 8: Seeders e Inicialización

### Seeder de Indicadores

**Archivo:** `/backend/seeders/infraestructura/indicadoresPGIRASA.seed.js`

```javascript
const prisma = require('../../db/prisma');

const indicadores = [
  {
    codigo: 'DEST_INCINERACION',
    nombre: 'Destinación para Incineración',
    objetivo: 'Dejar evidencia del total de residuos incinerados',
    alcance: 'Monitoria interna del sistema',
    dominio: 'AMBIENTAL',
    numeradorDescripcion: 'Cantidad de residuos incinerados (Kg/mes)',
    denominadorDescripcion: 'Cantidad total de residuos producidos (Kg/mes)',
    formulaCalculo: '(Residuos incinerados / Total residuos) * 100',
    tipoCalculo: 'AUTOMATICO',
    fuenteDatos: ['Registros RH1', 'PGIRHS'],
    responsableKPI: 'Líder de Medio Ambiente',
    responsableMedicion: 'Comité de Medio Ambiente',
    frecuencia: 'MENSUAL',
  },
  {
    codigo: 'DEST_OTRO_SISTEMA',
    nombre: 'Destinación para Otro Sistema (Esterilización)',
    objetivo: 'Evidenciar residuos sometidos a esterilización + relleno industrial',
    alcance: 'Monitoria interna del sistema',
    dominio: 'AMBIENTAL',
    numeradorDescripcion: 'Cantidad de residuos sometidos a esterilización (Kg/mes)',
    denominadorDescripcion: 'Cantidad total de residuos producidos (Kg/mes)',
    formulaCalculo: '(Residuos esterilizados / Total residuos) * 100',
    tipoCalculo: 'AUTOMATICO',
    fuenteDatos: ['Registros RH1', 'PGIRHS'],
    responsableKPI: 'Líder de Medio Ambiente',
    responsableMedicion: 'Comité de Medio Ambiente',
    frecuencia: 'MENSUAL',
  },
  {
    codigo: 'DEST_RECICLAJE',
    nombre: 'Destinación para Reciclaje',
    objetivo: 'Evidenciar el total de residuos reciclados',
    alcance: 'Monitoria interna del sistema',
    dominio: 'AMBIENTAL',
    numeradorDescripcion: 'Cantidad de residuos reciclados (Kg/mes)',
    denominadorDescripcion: 'Cantidad total de residuos producidos (Kg/mes)',
    formulaCalculo: '(Residuos reciclados / Total residuos) * 100',
    tipoCalculo: 'AUTOMATICO',
    fuenteDatos: ['Registros RH1', 'PGIRHS'],
    responsableKPI: 'Líder de Medio Ambiente',
    responsableMedicion: 'Comité de Medio Ambiente',
    frecuencia: 'MENSUAL',
  },
  {
    codigo: 'CUMPLIMIENTO_CAPACITACIONES',
    nombre: 'Cumplimiento de Capacitaciones Presupuestadas',
    objetivo: 'Evidenciar el cumplimiento del plan de capacitaciones',
    alcance: 'Monitoria interna del sistema',
    dominio: 'SEGURIDAD',
    numeradorDescripcion: 'Capacitaciones realizadas',
    denominadorDescripcion: 'Capacitaciones presupuestadas',
    formulaCalculo: '(Capacitaciones realizadas / Capacitaciones presupuestadas) * 100',
    tipoCalculo: 'MANUAL',
    fuenteDatos: ['Plan de capacitaciones', 'Actas de asistencia'],
    responsableKPI: 'Comité de Medio Ambiente',
    responsableMedicion: 'Comité de Medio Ambiente',
    frecuencia: 'CUATRIMESTRAL',
  },
  {
    codigo: 'FRECUENCIA_ACCIDENTES',
    nombre: 'De Frecuencia (Accidentes de Trabajo)',
    objetivo: 'Evidenciar la frecuencia de accidentes por residuos hospitalarios',
    alcance: 'Monitoria interna del sistema',
    dominio: 'SEGURIDAD',
    numeradorDescripcion: 'Número de accidentes mensuales por residuos hospitalarios',
    denominadorDescripcion: 'Horas hombre trabajadas',
    formulaCalculo: '(Accidentes mensuales / Horas hombre trabajadas) * K (constante)',
    tipoCalculo: 'MANUAL',
    fuenteDatos: ['Registro de accidentes', 'Control de horas trabajadas'],
    responsableKPI: 'Líder de Seguridad y Salud en el Trabajo',
    responsableMedicion: 'Comité de SST',
    frecuencia: 'MENSUAL',
  },
  {
    codigo: 'GRAVEDAD_ACCIDENTES',
    nombre: 'De Gravedad (Incapacidad)',
    objetivo: 'Evidenciar la gravedad de los accidentes (días de incapacidad)',
    alcance: 'Monitoria interna del sistema',
    dominio: 'SEGURIDAD',
    numeradorDescripcion: 'Días de incapacidad por accidentes',
    denominadorDescripcion: 'Horas hombre trabajadas',
    formulaCalculo: '(Días incapacidad / Horas hombre trabajadas) * K (constante)',
    tipoCalculo: 'MANUAL',
    fuenteDatos: ['Registro de incapacidades', 'Control de horas trabajadas'],
    responsableKPI: 'Líder de Seguridad y Salud en el Trabajo',
    responsableMedicion: 'Comité de SST',
    frecuencia: 'MENSUAL',
  },
  {
    codigo: 'INCIDENCIA_ACCIDENTES',
    nombre: 'De Incidencia (Accidentes por Personal)',
    objetivo: 'Evidenciar la tasa de accidentes por número de personal expuesto',
    alcance: 'Monitoria interna del sistema',
    dominio: 'SEGURIDAD',
    numeradorDescripcion: 'Número de accidentes mensuales',
    denominadorDescripcion: 'Número de personas expuestas',
    formulaCalculo: '(Accidentes mensuales / Personas expuestas) * K (constante)',
    tipoCalculo: 'MANUAL',
    fuenteDatos: ['Registro de accidentes', 'Nómina de personal'],
    responsableKPI: 'Líder de Seguridad y Salud en el Trabajo',
    responsableMedicion: 'Comité de SST',
    frecuencia: 'MENSUAL',
  },
];

async function seedIndicadoresPGIRASA() {
  console.log('🌱 Seeding Indicadores PGIRASA...');

  for (const indicador of indicadores) {
    await prisma.indicadorPGIRASA.upsert({
      where: { codigo: indicador.codigo },
      update: indicador,
      create: indicador,
    });
    console.log(`✓ Indicador creado: ${indicador.codigo}`);
  }

  console.log('✅ Indicadores PGIRASA seeded exitosamente');
}

module.exports = { seedIndicadoresPGIRASA };

// Ejecutar si se llama directamente
if (require.main === module) {
  seedIndicadoresPGIRASA()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
```

---

## 📝 FASE 9: Integración con Dashboard

### Agregar al Dashboard Principal

**Archivo:** `/frontend/components/clinica/Dashboard.jsx`

```javascript
// Agregar import
import InfraestructuraModule from './calidad2/infraestructura/InfraestructuraModule';

// En renderModule(), agregar caso:
case 'calidad2-infraestructura':
  return <InfraestructuraModule user={user} />;
```

### Agregar al Sidebar

**Archivo:** `/frontend/components/clinica/Sidebar.jsx`

Agregar dentro del grupo de Calidad 2.0:

```javascript
{
  label: 'Infraestructura',
  icon: Building2,
  onClick: () => setActiveModule('calidad2-infraestructura'),
  active: activeModule === 'calidad2-infraestructura',
}
```

---

## 🚀 FASE 10: Orden de Implementación Recomendado

### Iteración 1: Base y Documentos Legales (1 semana)
1. Migración de BD (modelos base)
2. Servicios: `documentoLegal.service.js`, `alertaDocumentoLegal.service.js`
3. Rutas documentos legales y alertas
4. Hooks: `useInfraestructuraDocumentosLegales`, `useInfraestructuraAlertasDocumentos`
5. Componentes: `DocumentosLegalesTab`, `AlertasWidget`
6. Cron job de alertas
7. Testing

### Iteración 2: Procesos Documentados (3 días)
1. Adaptar componente existente `ProcesosTab`
2. Crear wrapper `ProcesosInfraestructuraTab`
3. Agregar tipo `PROCESOS_INFRAESTRUCTURA` a enum
4. Testing

### Iteración 3: Conceptos Sanitarios y Solicitudes (1 semana)
1. Modelos: `ConceptoSanitario`, `ItemConceptoSanitario`, `SolicitudVisitaInspeccion`
2. Servicios correspondientes
3. Rutas y validaciones
4. Hooks
5. Componentes: `ConceptosSanitariosTab`, `ConceptoSanitarioForm`, `ChecklistTable`
6. Testing

### Iteración 4: Auditorías (4 días)
1. Modelos: `AuditoriaInfraestructura`
2. Servicios
3. Rutas
4. Hooks
5. Componentes: `AuditoriasTab`, `AuditoriaForm`
6. Testing

### Iteración 5: RH1 y Residuos (1 semana)
1. Modelos: `ResiduoRH1`, `ManifiestoRecoleccion`, `ActaDesactivacion`
2. Servicios (incluyendo cálculo de totales automáticos)
3. Rutas
4. Hooks
5. Componentes: `RH1FormularioMensual`, `RH1Tab`, `ManifiestosRecoleccionList`
6. Testing intensivo (validación de cálculos)

### Iteración 6: Indicadores (1 semana)
1. Modelos: `IndicadorPGIRASA`, `MedicionIndicadorPGIRASA`
2. Seeder de 7 indicadores
3. Servicios: `indicadorPGIRASA.service.js`, `medicionIndicador.service.js`, `calculoIndicador.service.js`
4. Rutas
5. Hooks
6. Componentes: `IndicadoresTab`, `IndicadoresDashboard`, `MedicionForm`
7. Integración de cálculo automático con RH1
8. Testing de fórmulas

### Iteración 7: Reportes y Formatos (4 días)
1. Modelos: `FormatoInfraestructura`, `ReporteInfraestructura`
2. Servicios de generación de reportes (Excel/PDF)
3. Rutas
4. Hooks
5. Componentes: `ReportesTab`, `FormatosTab`
6. Testing

### Iteración 8: Integración y Testing Final (3 días)
1. Integrar todos los módulos en `InfraestructuraModule`
2. Integrar en Dashboard y Sidebar
3. Testing end-to-end
4. Ajustes de UX
5. Documentación

---

## ✅ Checklist de Verificación

### Backend
- [ ] Migración de BD ejecutada sin errores
- [ ] 14 servicios creados y funcionando
- [ ] 80+ endpoints funcionando
- [ ] Validaciones Zod completas
- [ ] Cron job de alertas funcionando
- [ ] Sistema de emails con Resend funcional
- [ ] Cálculo automático de indicadores funcional
- [ ] Tests unitarios y de integración

### Frontend
- [ ] Todos los hooks creados y funcionando
- [ ] 30+ componentes creados
- [ ] Navegación entre tabs fluida
- [ ] Formularios con validación
- [ ] Upload de archivos funcional
- [ ] Widget de alertas funcionando
- [ ] Dashboard de indicadores con gráficas
- [ ] Exportación de reportes funcional

### Integración
- [ ] Módulo integrado en Dashboard
- [ ] Sidebar actualizado
- [ ] Permisos configurados
- [ ] Rutas protegidas
- [ ] Seeders ejecutados
- [ ] Documentación actualizada

---

## 📚 Archivos Críticos a Modificar

### Backend
1. `/backend/prisma/schema.prisma` - Agregar modelos completos
2. `/backend/routes/calidad2.js` - Montar rutas de infraestructura
3. `/backend/services/calidad2/infraestructura/` - 14 servicios nuevos
4. `/backend/validators/calidad2/infraestructura.schema.js` - Validaciones Zod
5. `/backend/jobs/alertasDocumentosLegales.job.js` - Cron job
6. `/backend/seeders/infraestructura/` - Seeders

### Frontend
1. `/frontend/components/clinica/Dashboard.jsx` - Agregar caso infraestructura
2. `/frontend/components/clinica/Sidebar.jsx` - Agregar item
3. `/frontend/components/clinica/calidad2/infraestructura/` - Todos los componentes
4. `/frontend/hooks/` - 11 hooks nuevos

---

## 🎯 Puntos Clave de Éxito

1. **Reutilización**: Aprovechar componentes existentes (`FolderTree`, `DocumentGrid`, `ProcesosTab`)
2. **Cálculo Automático**: Asegurar que indicadores se actualicen al guardar RH1
3. **Alertas Multicanal**: Email + Widget + Badges funcionando coordinadamente
4. **UX del Formulario RH1**: Tabla inline editable con cálculos en tiempo real
5. **Validaciones**: 28 ítems exactos en concepto sanitario, totales correctos en RH1
6. **Performance**: Optimizar carga de registros RH1 (31 días puede ser pesado)
7. **Testing**: Especialmente en cálculos automáticos y generación de alertas

---

## 📖 Notas Finales

- **Archivos MD de Documentación**: Este plan debe guardarse en `/PLAN_INFRAESTRUCTURA.md` para referencia futura
- **Revisión de Progreso**: Crear archivos MD de progreso por iteración (`/PROGRESO_INFRAESTRUCTURA_ITER1.md`, etc)
- **Adaptaciones**: El plan puede ajustarse según feedback del usuario durante implementación

---

**Fin del Plan**
