# 📋 MÓDULOS DEL SISTEMA DE CALIDAD 2.0 - CLÍNICA MÍA

**Fecha:** 2026-01-06
**Sistema:** Clínica Mía - Hospital Management System
**Módulo:** Calidad 2.0 (Sistema Integral de Gestión de Calidad para IPS Colombia)

---

## 📑 TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Documentos de Inscripción](#1-documentos-de-inscripción)
3. [Talento Humano](#2-talento-humano)
4. [Infraestructura PGIRASA](#3-infraestructura-pgirasa)
5. [Medicamentos y Dispositivos](#4-medicamentos-y-dispositivos)
6. [Procesos Prioritarios](#5-procesos-prioritarios)
7. [Historia Clínica](#6-historia-clínica)
8. [Configuración de Checklists](#7-configuración-de-checklists)
9. [Integración entre Módulos](#integración-entre-módulos)
10. [API y Endpoints](#api-y-endpoints)

---

## 🎯 VISIÓN GENERAL

El **Sistema de Calidad 2.0** es un conjunto integral de 7 módulos diseñados específicamente para el cumplimiento normativo de IPS (Instituciones Prestadoras de Servicios de Salud) en Colombia. Cubre todos los aspectos requeridos por:

- ✅ **Habilitación** (Resolución 3100/2019)
- ✅ **Acreditación** (Resolución 123/2012)
- ✅ **PAMEC** (Sistema de Gestión de la Calidad)
- ✅ **PGIRASA** (Plan de Gestión Integral de Residuos)
- ✅ **Historia Clínica** (Resolución 1995/1999)
- ✅ **Seguridad del Paciente** (Resolución 2003/2014)
- ✅ **SIAU** (Sistema de Información y Atención al Usuario)

### Arquitectura del Sistema

```
CALIDAD 2.0
├── Documentos de Inscripción (Habilitación/Acreditación)
├── Talento Humano (Gestión de Personal)
├── Infraestructura PGIRASA (Mantenimiento/Residuos)
├── Medicamentos y Dispositivos (Farmacovigilancia/Tecnovigilancia)
├── Procesos Prioritarios (PAMEC/Seguridad/SIAU)
├── Historia Clínica (Normativa/Auditoría)
└── Config. Checklists (SuperAdmin)
```

---

## 1. 📄 DOCUMENTOS DE INSCRIPCIÓN

**Módulo:** `docs-inscripcion`
**Ubicación:** `/calidad2/docs-inscripcion`
**Propósito:** Gestión de documentos requeridos para habilitación y acreditación de IPS

### 1.1 Funcionalidades Principales

#### 📁 **Gestión de Carpetas Documentales**

- **Carpetas por Categoría:**
  - 📋 Documentos Legales
  - 🏥 Documentos Institucionales
  - 👥 Documentos de Talento Humano
  - 🏗️ Documentos de Infraestructura
  - 💊 Documentos de Medicamentos
  - 📊 Documentos de Procesos Prioritarios

- **Operaciones:**
  - Crear carpetas personalizadas
  - Organización jerárquica (carpetas/subcarpetas)
  - Control de acceso por roles
  - Auditoría de cambios

#### 📄 **Gestión de Documentos**

- **Tipos de Documentos:**
  - Certificados de habilitación
  - Licencias y permisos
  - Pólizas de seguros
  - Contratos con terceros
  - Protocolos institucionales
  - Manuales de procesos

- **Características:**
  - Carga de archivos (PDF, Word, Excel, imágenes)
  - Versionamiento de documentos
  - Fechas de vigencia y vencimiento
  - Alertas automáticas de vencimiento
  - Firma digital (opcional)
  - Trazabilidad completa

#### ✅ **Checklists de Verificación**

- **Checklists Precargados:**
  - Checklist de Habilitación (Resolución 3100/2019)
  - Checklist de Acreditación (Estándares de Acreditación)
  - Checklist de PAMEC
  - Checklists personalizados

- **Funcionalidades:**
  - Evaluación por criterios
  - Puntuación automática
  - Generación de reportes de cumplimiento
  - Planes de mejora automáticos
  - Seguimiento de no conformidades

#### 🚨 **Sistema de Alertas**

- **Tipos de Alertas:**
  - Documentos próximos a vencer (60, 30, 15 días)
  - Documentos vencidos
  - Checklists pendientes
  - Evaluaciones vencidas

- **Canales:**
  - Notificaciones en el sistema
  - Correos electrónicos automáticos
  - Dashboard de alertas

### 1.2 Modelos de Base de Datos

```prisma
model CarpetaCalidad {
  id                String
  nombre            String
  descripcion       String?
  tipo              String      // LEGAL, INSTITUCIONAL, TH, etc.
  carpetaPadreId    String?
  documentos        DocumentoCalidad[]
  subcarpetas       CarpetaCalidad[]
}

model DocumentoCalidad {
  id                String
  carpetaId         String
  nombre            String
  tipo              String
  archivoUrl        String
  fechaEmision      DateTime
  fechaVencimiento  DateTime?
  estado            String      // VIGENTE, VENCIDO, PROXIMO_VENCER
  responsable       String
}

model ChecklistCalidad {
  id                String
  nombre            String
  tipo              String
  criterios         Json
  evaluaciones      EvaluacionChecklist[]
}

model EvaluacionChecklist {
  id                String
  checklistId       String
  evaluador         String
  fecha             DateTime
  resultados        Json
  puntaje           Float
  hallazgos         String?
}
```

### 1.3 Endpoints API

```javascript
GET    /calidad2/carpetas                    // Listar carpetas
POST   /calidad2/carpetas                    // Crear carpeta
GET    /calidad2/carpetas/:id                // Obtener carpeta
PUT    /calidad2/carpetas/:id                // Actualizar carpeta
DELETE /calidad2/carpetas/:id                // Eliminar carpeta

GET    /calidad2/documentos                  // Listar documentos
POST   /calidad2/documentos                  // Subir documento
GET    /calidad2/documentos/:id              // Descargar documento
PUT    /calidad2/documentos/:id              // Actualizar documento
DELETE /calidad2/documentos/:id              // Eliminar documento

GET    /calidad2/checklists                  // Listar checklists
POST   /calidad2/checklists                  // Crear checklist
GET    /calidad2/checklists/:id/evaluar      // Evaluar checklist
GET    /calidad2/checklists/stats            // Estadísticas
```

---

## 2. 👥 TALENTO HUMANO

**Módulo:** `talento-humano`
**Ubicación:** `/calidad2/talento-humano`
**Propósito:** Gestión integral del personal de salud y cumplimiento de requisitos de habilitación

### 2.1 Funcionalidades Principales

#### 👨‍⚕️ **Gestión de Personal**

- **Carpetas Digitales del Personal:**
  - Información básica (datos personales, contacto)
  - Documentos de identidad
  - Hojas de vida
  - Certificados de estudio
  - Licencias profesionales (RethUS, etc.)
  - Certificados de afiliación (ARL, EPS, Pensión)
  - Exámenes médicos ocupacionales
  - Capacitaciones recibidas

- **Categorización:**
  - Personal asistencial (médicos, enfermeras, auxiliares)
  - Personal administrativo
  - Personal de apoyo
  - Contratistas y temporales

#### 🎓 **Capacitaciones**

- **Gestión de Capacitaciones:**
  - Categorías de capacitación (clínica, administrativa, SST, etc.)
  - Programación de sesiones
  - Registro de asistencia
  - Evaluaciones de conocimiento
  - Certificados automáticos
  - Control de horas de capacitación

- **Plan de Capacitación Anual:**
  - Detección de necesidades
  - Cronograma anual
  - Presupuesto
  - Indicadores de cumplimiento

#### 📚 **Inducción y Reinducción**

- **Programa de Inducción:**
  - Inducción institucional
  - Inducción al cargo
  - Evaluación de inducción
  - Seguimiento a nuevos empleados

- **Reinducción:**
  - Programación anual
  - Temas obligatorios
  - Control de asistencia

#### 📜 **Certificados**

- **Gestión de Certificados:**
  - Certificados laborales
  - Certificados de capacitación
  - Constancias de asistencia
  - Plantillas personalizables
  - Generación automática en PDF
  - Firma digital

#### 📋 **Manual de Funciones**

- **Perfiles de Cargo:**
  - Descripción del cargo
  - Requisitos (educación, experiencia)
  - Competencias requeridas
  - Responsabilidades
  - Funciones específicas

- **Gestión:**
  - Versionamiento
  - Aprobación por gerencia
  - Distribución controlada

#### 📊 **Capacidad Instalada**

- **Registro de Capacidad:**
  - Personal disponible por servicio
  - Personal disponible por turno
  - Cálculo de capacidad instalada
  - Proyecciones de demanda
  - Indicadores de productividad

#### ⚠️ **Alertas de Talento Humano**

- **Tipos de Alertas:**
  - Documentos del personal próximos a vencer
  - Licencias profesionales vencidas
  - Exámenes médicos pendientes
  - Capacitaciones obligatorias pendientes
  - Evaluaciones de desempeño vencidas

#### 📑 **Formatos**

- **Formatos Disponibles:**
  - Solicitud de vacaciones
  - Permisos y ausencias
  - Evaluación de desempeño
  - Actas de reunión
  - Formatos de nómina

### 2.2 Modelos de Base de Datos

```prisma
model PersonalCalidad {
  id                    String
  usuarioId             String?
  numeroDocumento       String        @unique
  nombres               String
  apellidos             String
  cargo                 String
  tipo                  String        // ASISTENCIAL, ADMINISTRATIVO, APOYO
  fechaIngreso          DateTime
  estado                String        // ACTIVO, INACTIVO, LICENCIA
  carpetaDocumentos     Json
  capacitaciones        CapacitacionPersonal[]
  certificados          CertificadoPersonal[]
}

model CategoriaCapacitacion {
  id                    String
  nombre                String
  descripcion           String?
  capacitaciones        Capacitacion[]
}

model Capacitacion {
  id                    String
  categoriaId           String
  nombre                String
  objetivo              String
  duracionHoras         Int
  instructor            String
  sesiones              SesionCapacitacion[]
}

model SesionCapacitacion {
  id                    String
  capacitacionId        String
  fecha                 DateTime
  lugar                 String
  asistencias           AsistenciaCapacitacion[]
  evaluaciones          EvaluacionCapacitacion[]
}

model AsistenciaCapacitacion {
  id                    String
  sesionId              String
  personalId            String
  asistio               Boolean
  observaciones         String?
}

model EvaluacionCapacitacion {
  id                    String
  sesionId              String
  personalId            String
  puntaje               Float
  aprobado              Boolean
}

model CertificadoPersonal {
  id                    String
  personalId            String
  tipo                  String        // LABORAL, CAPACITACION, ASISTENCIA
  titulo                String
  descripcion           String?
  fechaEmision          DateTime
  archivoUrl            String?
}

model ManualFunciones {
  id                    String
  cargo                 String
  descripcion           String
  requisitos            Json
  competencias          Json
  responsabilidades     Json
  funciones             Json
  version               String
  fechaAprobacion       DateTime
}

model InduccionPersonal {
  id                    String
  personalId            String
  tipo                  String        // INDUCCION, REINDUCCION
  fecha                 DateTime
  temas                 Json
  evaluacionPuntaje     Float?
  completado            Boolean
}

model CapacidadInstalada {
  id                    String
  servicio              String
  turno                 String
  personalDisponible    Int
  capacidadMaxima       Int
  fecha                 DateTime
}
```

### 2.3 Endpoints API

```javascript
// Personal
GET    /calidad2/personal                    // Listar personal
POST   /calidad2/personal                    // Crear empleado
GET    /calidad2/personal/:id                // Obtener empleado
PUT    /calidad2/personal/:id                // Actualizar empleado
DELETE /calidad2/personal/:id                // Eliminar empleado
GET    /calidad2/personal/:id/carpeta        // Ver carpeta digital

// Capacitaciones
GET    /calidad2/capacitaciones/categorias   // Categorías
POST   /calidad2/capacitaciones              // Crear capacitación
GET    /calidad2/capacitaciones/:id/sesiones // Sesiones
POST   /calidad2/capacitaciones/:id/asistencia // Registrar asistencia
POST   /calidad2/capacitaciones/:id/evaluar  // Evaluar sesión

// Certificados
GET    /calidad2/certificados                // Listar certificados
POST   /calidad2/certificados                // Generar certificado
GET    /calidad2/certificados/:id/pdf        // Descargar PDF

// Inducción
GET    /calidad2/induccion                   // Listar inducciones
POST   /calidad2/induccion                   // Registrar inducción

// Capacidad
GET    /calidad2/capacidad                   // Ver capacidad instalada
POST   /calidad2/capacidad                   // Registrar capacidad

// Manual de Funciones
GET    /calidad2/manual-funciones            // Listar perfiles
POST   /calidad2/manual-funciones            // Crear perfil

// Alertas
GET    /calidad2/alertas-th                  // Alertas de TH
```

---

## 3. 🏗️ INFRAESTRUCTURA PGIRASA

**Módulo:** `infraestructura`
**Ubicación:** `/calidad2/infraestructura`
**Propósito:** Gestión de infraestructura, mantenimientos, PGIRASA y seguridad industrial

### 3.1 Funcionalidades Principales

#### 🏥 **Procesos de Infraestructura**

- **Documentos de Procesos:**
  - Procedimientos de mantenimiento
  - Protocolos de limpieza
  - Planes de contingencia
  - Manuales de equipos
  - Planos de instalaciones

#### 🔧 **Mantenimiento de Equipos**

- **Gestión de Equipos:**
  - Inventario de equipos biomédicos
  - Fichas técnicas
  - Hojas de vida
  - Cronograma de mantenimiento (preventivo/correctivo)
  - Registro de mantenimientos
  - Control de calibraciones
  - Alertas de vencimiento

- **Tipos de Mantenimiento:**
  - Preventivo (programado)
  - Correctivo (por falla)
  - Calibración
  - Verificación metrológica

#### ♻️ **PGIRASA (Plan de Gestión de Residuos)**

- **Gestión de Residuos:**
  - Clasificación de residuos (peligrosos, no peligrosos, reciclables)
  - Puntos de generación
  - Rutas de recolección
  - Registro de pesajes
  - Control de disposición final
  - Empresas gestoras autorizadas

- **Indicadores PGIRASA:**
  - Kg residuos/cama/mes
  - Segregación en la fuente
  - % aprovechamiento
  - Costos de disposición

#### 📊 **Indicadores de Infraestructura**

- **Indicadores Medidos:**
  - Disponibilidad de equipos
  - Tiempo medio entre fallas (MTBF)
  - Tiempo medio de reparación (MTTR)
  - % cumplimiento de mantenimientos
  - Indicadores ambientales

- **Dashboard:**
  - Gráficas de tendencias
  - Semáforos de cumplimiento
  - Alertas en tiempo real

### 3.2 Modelos de Base de Datos

```prisma
model ProcesoInfraestructura {
  id                    String
  nombre                String
  descripcion           String
  archivoUrl            String
  version               String
  fechaAprobacion       DateTime
}

model EquipoMedico {
  id                    String
  codigo                String        @unique
  nombre                String
  marca                 String
  modelo                String
  serie                 String
  ubicacion             String
  fechaAdquisicion      DateTime
  estado                String        // OPERATIVO, EN_MANTENIMIENTO, FUERA_SERVICIO
  riesgo                String        // ALTO, MEDIO, BAJO
  mantenimientos        MantenimientoEquipo[]
}

model MantenimientoEquipo {
  id                    String
  equipoId              String
  tipo                  String        // PREVENTIVO, CORRECTIVO, CALIBRACION
  fechaProgramada       DateTime
  fechaEjecucion        DateTime?
  tecnico               String
  descripcion           String
  observaciones         String?
  costoTotal            Decimal?
  estado                String        // PROGRAMADO, EJECUTADO, VENCIDO
}

model ResiduoPGIRASA {
  id                    String
  fecha                 DateTime
  tipoResiduo           String        // PELIGROSO, NO_PELIGROSO, RECICLABLE
  clasificacion         String        // BIOLOGICO, ANATOMOPATOLOGICO, CORTO_PUNZANTE, etc.
  puntoGeneracion       String
  peso                  Decimal       // kg
  empresaGestora        String?
  certificadoUrl        String?
}

model IndicadorInfraestructura {
  id                    String
  codigo                String
  nombre                String
  formula               String
  meta                  Float
  frecuencia            String        // MENSUAL, TRIMESTRAL
  mediciones            MedicionIndicadorInfra[]
}

model MedicionIndicadorInfra {
  id                    String
  indicadorId           String
  periodo               String
  resultado             Float
  cumpleMeta            Boolean
  analisis              String?
}
```

### 3.3 Endpoints API

```javascript
// Procesos
GET    /calidad2/infraestructura/procesos-documentados  // Listar procesos
POST   /calidad2/infraestructura/procesos-documentados  // Crear proceso

// Mantenimientos
GET    /calidad2/infraestructura/mantenimientos/equipos // Listar equipos
POST   /calidad2/infraestructura/mantenimientos/equipos // Registrar equipo
GET    /calidad2/infraestructura/mantenimientos/cronograma // Cronograma
POST   /calidad2/infraestructura/mantenimientos/mantenimientos // Registrar mantenimiento
GET    /calidad2/infraestructura/mantenimientos/stats   // Estadísticas

// PGIRASA
GET    /calidad2/infraestructura/pgirasa/residuos       // Listar residuos
POST   /calidad2/infraestructura/pgirasa/residuos       // Registrar pesaje
GET    /calidad2/infraestructura/pgirasa/stats          // Estadísticas
GET    /calidad2/infraestructura/pgirasa/indicadores    // Indicadores ambientales

// Indicadores
GET    /calidad2/infraestructura/indicadores            // Listar indicadores
POST   /calidad2/infraestructura/indicadores/:id/mediciones // Registrar medición
GET    /calidad2/infraestructura/indicadores/dashboard  // Dashboard
```

---

## 4. 💊 MEDICAMENTOS Y DISPOSITIVOS

**Módulo:** `medicamentos`
**Ubicación:** `/calidad2/medicamentos`
**Propósito:** Gestión de calidad de medicamentos, farmacovigilancia, tecnovigilancia y control de cadena de frío

### 4.1 Funcionalidades Principales

#### 📋 **Protocolos de Medicamentos**

- **Gestión de Protocolos:**
  - Protocolos de preparación
  - Protocolos de administración
  - Guías de uso seguro
  - Listados de medicamentos de alto riesgo
  - Alertas de medicamentos

#### 📦 **Inventarios Especializados**

- **Inventario de Medicamentos:**
  - Medicamentos controlados (II, III, IV)
  - Medicamentos de alto costo
  - Medicamentos INVIMA
  - Control de lotes
  - Fechas de vencimiento
  - Alertas de vencimientos próximos

- **Inventario de Dispositivos Médicos:**
  - Dispositivos de uso único
  - Dispositivos reutilizables
  - Implantes
  - Control de registros INVIMA

- **Inventario de Insumos:**
  - Material de curación
  - Elementos de protección
  - Insumos de laboratorio

#### 💉 **Farmacovigilancia**

- **Reportes de RAM (Reacciones Adversas a Medicamentos):**
  - Registro de eventos adversos
  - Clasificación de severidad
  - Notificación a INVIMA (FOREAM)
  - Seguimiento de casos
  - Análisis de causalidad
  - Medidas preventivas

- **Consolidado Trimestral:**
  - Generación automática
  - Reportes a INVIMA
  - Estadísticas de RAM

#### 🔬 **Tecnovigilancia**

- **Reportes de Incidentes con Dispositivos:**
  - Fallas de dispositivos
  - Eventos adversos
  - Casi incidentes
  - Notificación a INVIMA
  - Seguimiento correctivo
  - Alertas sanitarias

- **Consolidado Trimestral:**
  - Reportes obligatorios
  - Estadísticas por tipo de dispositivo

#### 🌡️ **Control de Temperatura y Humedad**

- **Monitoreo de Cadena de Frío:**
  - Registro de temperatura (refrigeradores, neveras)
  - Registro de humedad
  - Frecuencia configurable (diaria, cada turno)
  - Gráficas de tendencias
  - Alertas de desviaciones
  - Bitácoras digitales

- **Equipos Monitoreados:**
  - Refrigeradores de medicamentos
  - Neveras de vacunas
  - Cuartos fríos
  - Áreas de almacenamiento

#### 📄 **Formatos de Medicamentos**

- **Formatos Disponibles:**
  - Formato de devolución de medicamentos
  - Formato de destrucción de medicamentos vencidos
  - Actas de recepción
  - Control de estupefacientes
  - Conciliación de medicamentos

#### ⚠️ **Alertas de Medicamentos**

- **Tipos de Alertas:**
  - Medicamentos próximos a vencer
  - Medicamentos vencidos
  - Stock crítico de medicamentos controlados
  - Temperatura fuera de rango
  - Reportes de farmacovigilancia pendientes

### 4.2 Modelos de Base de Datos

```prisma
model ProtocoloMedicamento {
  id                    String
  nombre                String
  tipo                  String        // PREPARACION, ADMINISTRACION, USO_SEGURO
  contenido             String        @db.Text
  archivoUrl            String?
  version               String
  fechaAprobacion       DateTime
}

model InventarioMedicamento {
  id                    String
  nombre                String
  principioActivo       String
  concentracion         String
  formaFarmaceutica     String
  categoria             String        // CONTROLADO_II, ALTO_RIESGO, etc.
  lote                  String
  fechaVencimiento      DateTime
  cantidad              Int
  ubicacion             String
}

model InventarioDispositivo {
  id                    String
  nombre                String
  tipo                  String        // USO_UNICO, REUTILIZABLE, IMPLANTE
  clasificacion         String        // I, IIA, IIB, III
  registroInvima        String
  lote                  String
  fechaVencimiento      DateTime
  cantidad              Int
}

model ReporteFarmacovigilancia {
  id                    String
  pacienteId            String
  medicamento           String
  reaccionAdversa       String        @db.Text
  gravedad              String        // LEVE, MODERADA, GRAVE
  fecha                 DateTime
  reportadoPor          String
  estadoReporte         String        // REGISTRADO, NOTIFICADO_INVIMA, CERRADO
  foreanUrl             String?       // PDF del FOREAM
}

model ConsolidadoFarmacovigilancia {
  id                    String
  trimestre             Int
  anio                  Int
  totalReportes         Int
  reportesPorGravedad   Json
  archivoUrl            String
  fechaGeneracion       DateTime
}

model ReporteTecnovigilancia {
  id                    String
  dispositivo           String
  tipoIncidente         String        // FALLA, EVENTO_ADVERSO, CASI_INCIDENTE
  descripcion           String        @db.Text
  gravedad              String
  fecha                 DateTime
  reportadoPor          String
  estadoReporte         String
}

model RegistroTemperaturaHumedad {
  id                    String
  equipo                String        // REFRIGERADOR_FARMACIA, NEVERA_VACUNAS
  ubicacion             String
  temperatura           Decimal
  humedad               Decimal?
  fecha                 DateTime
  turno                 String
  registradoPor         String
  observaciones         String?
  fueraRango            Boolean
}

model FormatoMedicamento {
  id                    String
  nombre                String
  tipo                  String
  plantilla             Json
  instancias            FormatoInstanciaMedicamento[]
}

model FormatoInstanciaMedicamento {
  id                    String
  formatoId             String
  datos                 Json
  fecha                 DateTime
  registradoPor         String
}
```

### 4.3 Endpoints API

```javascript
// Dashboard General
GET    /calidad2/medicamentos/dashboard      // Dashboard principal

// Protocolos
GET    /calidad2/medicamentos/protocolos     // Listar protocolos
POST   /calidad2/medicamentos/protocolos     // Crear protocolo

// Inventarios
GET    /calidad2/medicamentos/inventarios/medicamentos // Medicamentos
GET    /calidad2/medicamentos/inventarios/dispositivos // Dispositivos
GET    /calidad2/medicamentos/inventarios/insumos      // Insumos
POST   /calidad2/medicamentos/inventarios/medicamentos // Registrar medicamento

// Farmacovigilancia
GET    /calidad2/medicamentos/farmacovigilancia        // Listar reportes
POST   /calidad2/medicamentos/farmacovigilancia        // Nuevo reporte
GET    /calidad2/medicamentos/farmacovigilancia/stats  // Estadísticas
POST   /calidad2/medicamentos/farmacovigilancia/consolidado // Generar consolidado

// Tecnovigilancia
GET    /calidad2/medicamentos/tecnovigilancia          // Listar reportes
POST   /calidad2/medicamentos/tecnovigilancia          // Nuevo reporte
GET    /calidad2/medicamentos/tecnovigilancia/stats    // Estadísticas
POST   /calidad2/medicamentos/tecnovigilancia/consolidado // Generar consolidado

// Temperatura y Humedad
GET    /calidad2/medicamentos/temperatura-humedad      // Registros
POST   /calidad2/medicamentos/temperatura-humedad      // Nuevo registro
GET    /calidad2/medicamentos/temperatura-humedad/graficas // Gráficas

// Formatos
GET    /calidad2/medicamentos/formatos                 // Templates
POST   /calidad2/medicamentos/formatos/:id/instancias  // Crear instancia

// Alertas
GET    /calidad2/medicamentos/alertas                  // Alertas activas
```

---

## 5. ⚡ PROCESOS PRIORITARIOS

**Módulo:** `procesos-prioritarios`
**Ubicación:** `/calidad2/procesos-prioritarios`
**Propósito:** PAMEC, Seguridad del Paciente, SIAU, Indicadores, Comités, GPC

### 5.1 Funcionalidades Principales

#### 🎯 **Dashboard de Procesos Prioritarios**

- **Resumen Ejecutivo:**
  - Indicadores clave de calidad
  - Estado de eventos adversos
  - PQRSF pendientes
  - Próximas reuniones de comités
  - Alertas críticas

#### 📊 **Indicadores de Calidad**

- **Gestión de Indicadores:**
  - Indicadores PAMEC
  - Indicadores de seguridad del paciente
  - Indicadores de satisfacción (SIAU)
  - Indicadores institucionales

- **Características:**
  - Definición de indicadores (nombre, fórmula, meta)
  - Registro de mediciones
  - Cálculo automático de cumplimiento
  - Gráficas de tendencias
  - Análisis de brechas
  - Planes de mejora

#### 🚨 **Seguridad del Paciente**

##### 🔴 **Eventos Adversos**

- **Registro de Eventos:**
  - Eventos adversos
  - Incidentes
  - Casi incidentes (near miss)
  - Eventos centinela

- **Clasificación:**
  - Por tipo de evento
  - Por severidad (ningún daño, daño leve, moderado, grave, muerte)
  - Por servicio
  - Por causa raíz

- **Análisis de Eventos:**
  - Análisis de causa raíz (RCA)
  - Protocolo de Londres
  - Identificación de factores contribuyentes
  - Barreras de seguridad
  - Planes de acción

##### 📋 **Alertas de Seguridad**

- **Sistema de Alertas:**
  - Alertas institucionales
  - Alertas del Sistema Obligatorio de Garantía de Calidad
  - Alertas de medicamentos
  - Alertas de dispositivos
  - Seguimiento de alertas

#### 💬 **SIAU (Sistema de Información y Atención al Usuario)**

##### 📝 **PQRSF (Peticiones, Quejas, Reclamos, Sugerencias, Felicitaciones)**

- **Gestión de PQRSF:**
  - Radicación de solicitudes
  - Clasificación automática
  - Asignación a responsables
  - Seguimiento de tiempos de respuesta
  - Respuestas formales
  - Cierre de casos
  - Análisis de tendencias

- **Indicadores PQRSF:**
  - Tiempo promedio de respuesta
  - % de PQRSF vencidas
  - Causas más frecuentes
  - Satisfacción con la respuesta

##### 📋 **Encuestas de Satisfacción**

- **Gestión de Encuestas:**
  - Creación de encuestas personalizadas
  - Aplicación digital (tablet, web)
  - Tabulación automática
  - Análisis de resultados
  - NPS (Net Promoter Score)
  - Planes de mejora

- **Tipos de Encuestas:**
  - Satisfacción con la atención
  - Hospitalización
  - Urgencias
  - Consulta externa
  - Servicios ambulatorios

#### 👥 **Comités**

- **Gestión de Comités:**
  - Comité de Calidad
  - Comité de Seguridad del Paciente
  - Comité de Infecciones
  - Comité de Ética
  - Comité de Farmacia
  - Comités personalizados

- **Funcionalidades:**
  - Cronograma anual
  - Convocatorias automáticas
  - Actas de reunión
  - Compromisos y seguimiento
  - Indicadores de asistencia
  - Biblioteca de actas

#### 📚 **GPC (Guías de Práctica Clínica)**

- **Gestión de Guías:**
  - Biblioteca de GPC
  - GPC institucionales
  - GPC del Ministerio de Salud
  - Protocolos clínicos
  - Rutas de atención
  - Versionamiento

- **Seguimiento:**
  - Adherencia a guías
  - Indicadores de cumplimiento
  - Auditoría de historias clínicas
  - Planes de mejora

#### 📜 **Protocolos Institucionales**

- **Gestión de Protocolos:**
  - Protocolos asistenciales
  - Protocolos administrativos
  - Protocolos de bioseguridad
  - Control de versiones
  - Socialización
  - Evaluación de cumplimiento

#### ⚠️ **Alertas de Procesos Prioritarios**

- **Dashboard de Alertas:**
  - Eventos adversos críticos
  - PQRSF vencidas
  - Indicadores fuera de meta
  - Comités próximos
  - GPC por actualizar

### 5.2 Modelos de Base de Datos

```prisma
model IndicadorCalidad {
  id                    String
  codigo                String        @unique
  nombre                String
  tipo                  String        // PAMEC, SEGURIDAD_PACIENTE, SIAU
  formula               String        @db.Text
  meta                  Decimal
  unidadMedida          String
  frecuencia            String        // MENSUAL, TRIMESTRAL, SEMESTRAL
  responsable           String
  mediciones            MedicionIndicador[]
}

model MedicionIndicador {
  id                    String
  indicadorId           String
  periodo               String
  numerador             Decimal?
  denominador           Decimal?
  resultado             Decimal
  cumpleMeta            Boolean
  analisis              String?       @db.Text
  planMejora            String?       @db.Text
  registradoPor         String
  fecha                 DateTime
}

model EventoAdverso {
  id                    String
  tipo                  String        // EVENTO_ADVERSO, INCIDENTE, CASI_INCIDENTE
  fecha                 DateTime
  servicio              String
  pacienteId            String?
  descripcion           String        @db.Text
  severidad             String        // NINGUNO, LEVE, MODERADO, GRAVE, MUERTE
  clasificacion         String
  causaRaiz             String?       @db.Text
  factoresContribuyentes Json?
  planAccion            String?       @db.Text
  responsable           String
  estado                String        // ABIERTO, EN_ANALISIS, CERRADO
  fechaCierre           DateTime?
}

model PQRSF {
  id                    String
  tipo                  String        // PETICION, QUEJA, RECLAMO, SUGERENCIA, FELICITACION
  radicado              String        @unique
  fechaRadicacion       DateTime
  solicitante           String
  contacto              String
  descripcion           String        @db.Text
  servicio              String?
  asignadoA             String?
  fechaLimite           DateTime
  respuesta             String?       @db.Text
  fechaRespuesta        DateTime?
  estado                String        // RADICADA, EN_TRAMITE, RESPONDIDA, CERRADA
  vencida               Boolean       @default(false)
}

model EncuestaSatisfaccion {
  id                    String
  nombre                String
  tipo                  String        // HOSPITALIZACION, URGENCIAS, CONSULTA_EXTERNA
  preguntas             Json
  activa                Boolean       @default(true)
  respuestas            RespuestaEncuesta[]
}

model RespuestaEncuesta {
  id                    String
  encuestaId            String
  pacienteId            String?
  respuestas            Json
  nps                   Int?
  fecha                 DateTime
  observaciones         String?       @db.Text
}

model Comite {
  id                    String
  nombre                String
  tipo                  String
  periodicidad          String        // MENSUAL, BIMENSUAL, TRIMESTRAL
  miembros              Json
  cronograma            Json
  actas                 ActaComite[]
}

model ActaComite {
  id                    String
  comiteId              String
  numeroActa            String
  fecha                 DateTime
  asistentes            Json
  temas                 Json
  compromisos           Json
  archivoUrl            String?
  aprobada              Boolean       @default(false)
}

model GuiaPracticaClinica {
  id                    String
  codigo                String        @unique
  nombre                String
  tipo                  String        // INSTITUCIONAL, MINISTERIO, INTERNACIONAL
  especialidad          String
  contenido             String        @db.Text
  archivoUrl            String?
  version               String
  fechaPublicacion      DateTime
  vigente               Boolean       @default(true)
}

model ProtocoloInstitucional {
  id                    String
  codigo                String        @unique
  nombre                String
  tipo                  String        // ASISTENCIAL, ADMINISTRATIVO, BIOSEGURIDAD
  contenido             String        @db.Text
  archivoUrl            String
  version               String
  fechaAprobacion       DateTime
  responsable           String
  estado                String        // VIGENTE, OBSOLETO
}

model AlertaProcesosPrioritarios {
  id                    String
  tipo                  String        // EVENTO_CRITICO, PQRSF_VENCIDA, INDICADOR_CRITICO
  prioridad             String        // ALTA, MEDIA, BAJA
  descripcion           String
  referencia            String?       // ID del registro relacionado
  estado                String        // ACTIVA, ATENDIDA, CERRADA
  fechaGeneracion       DateTime
  fechaAtencion         DateTime?
}
```

### 5.3 Endpoints API

```javascript
// Dashboard
GET    /calidad2/procesos-prioritarios/dashboard        // Dashboard principal

// Indicadores
GET    /calidad2/indicadores                            // Listar indicadores
POST   /calidad2/indicadores                            // Crear indicador
GET    /calidad2/indicadores/:id                        // Ver indicador
POST   /calidad2/indicadores/:id/mediciones             // Registrar medición
GET    /calidad2/indicadores/dashboard                  // Dashboard de indicadores

// Eventos Adversos
GET    /calidad2/eventos-adversos                       // Listar eventos
POST   /calidad2/eventos-adversos                       // Registrar evento
GET    /calidad2/eventos-adversos/:id                   // Ver evento
PUT    /calidad2/eventos-adversos/:id/analizar          // Análisis causa raíz
GET    /calidad2/eventos-adversos/stats                 // Estadísticas

// PQRSF
GET    /calidad2/pqrsf                                  // Listar PQRSF
POST   /calidad2/pqrsf                                  // Radicar PQRSF
GET    /calidad2/pqrsf/:id                              // Ver PQRSF
PUT    /calidad2/pqrsf/:id/responder                    // Responder
GET    /calidad2/pqrsf/stats                            // Estadísticas
GET    /calidad2/pqrsf/vencidas                         // PQRSF vencidas

// Encuestas
GET    /calidad2/encuestas                              // Listar encuestas
POST   /calidad2/encuestas                              // Crear encuesta
POST   /calidad2/encuestas/:id/responder                // Responder encuesta
GET    /calidad2/encuestas/:id/resultados               // Ver resultados
GET    /calidad2/encuestas/:id/nps                      // Calcular NPS

// Comités
GET    /calidad2/comites                                // Listar comités
POST   /calidad2/comites                                // Crear comité
GET    /calidad2/comites/:id/cronograma                 // Ver cronograma
POST   /calidad2/comites/:id/actas                      // Crear acta
GET    /calidad2/comites/proximas-reuniones             // Próximas reuniones

// GPC
GET    /calidad2/gpc                                    // Listar guías
POST   /calidad2/gpc                                    // Crear guía
GET    /calidad2/gpc/:id                                // Ver guía
GET    /calidad2/gpc/stats                              // Estadísticas

// Protocolos
GET    /calidad2/protocolos                             // Listar protocolos
POST   /calidad2/protocolos                             // Crear protocolo
GET    /calidad2/protocolos/:id                         // Ver protocolo

// Alertas
GET    /calidad2/alertas                                // Alertas activas
PUT    /calidad2/alertas/:id/atender                    // Atender alerta
```

---

## 6. 🏥 HISTORIA CLÍNICA

**Módulo:** `historia-clinica`
**Ubicación:** `/calidad2/historia-clinica`
**Propósito:** Gestión de calidad de historias clínicas, cumplimiento normativo, auditoría y control de certificaciones

### 6.1 Funcionalidades Principales

#### 📊 **Dashboard General**

- **Resumen Ejecutivo:**
  - Total de documentos normativos
  - Certificaciones vigentes/vencidas
  - Consentimientos aplicados en el período
  - Auditorías abiertas/cerradas
  - Indicadores de calidad HC

- **Gráficas Echarts:**
  - Timeline de auditorías (por mes)
  - Distribución de consentimientos por servicio
  - Tendencias de indicadores
  - Top 5 hallazgos recurrentes

- **Filtros:**
  - Filtro por año
  - Actualización en tiempo real

#### 📄 **Documentos Normativos**

- **Gestión de Documentos:**
  - Manuales (Manual de Diligenciamiento HC)
  - Procedimientos (Consentimiento Informado)
  - Instructivos
  - Formatos
  - Políticas institucionales
  - Certificaciones de software
  - Contratos
  - Referencias

- **Sistema de Versiones:**
  - Versionamiento automático
  - Historial de cambios
  - Comparación de versiones
  - Restauración de versiones anteriores

- **Workflow de Aprobación:**
  - Elaborador → Revisor → Aprobador
  - Estados: Borrador, En Revisión, Vigente, Obsoleto, Archivado
  - Notificaciones automáticas

- **Distribución Controlada:**
  - Asignación a usuarios específicos
  - Control de entrega
  - Confirmación de lectura
  - Trazabilidad completa

#### 🏆 **Certificaciones**

- **Tipos de Certificaciones:**
  - Software de Historia Clínica (Saludtools, etc.)
  - Habilitación de servicios
  - Acreditación
  - Certificaciones ISO
  - Otras certificaciones

- **Control de Vigencias:**
  - Fecha de emisión
  - Fecha de vencimiento
  - Entidad emisora
  - Número de registro

- **Sistema de Alertas Automáticas:**
  - Alerta 60 días antes del vencimiento
  - Alerta 30 días antes del vencimiento
  - Alerta 15 días antes del vencimiento
  - Notificaciones por correo
  - Dashboard de vencimientos

- **Semáforo de Estado:**
  - 🟢 Verde: > 60 días para vencer
  - 🟡 Amarillo: 30-60 días
  - 🟠 Naranja: 15-30 días
  - 🔴 Rojo: < 15 días o vencida

#### ✍️ **Consentimientos Informados**

##### 📚 **Biblioteca de Consentimientos**

- **Gestión de Plantillas:**
  - Consentimientos por procedimiento
  - Consentimientos por servicio (Cirugía, Procedimientos, Consulta)
  - Plantillas personalizables con variables
  - Editor de contenido HTML
  - Versionamiento

- **Configuración:**
  - Requiere firma del paciente
  - Requiere firma de testigo
  - Requiere firma de familiar
  - Firma del médico

##### 📝 **Aplicación de Consentimientos**

- **Proceso de Aplicación:**
  1. Selección del tipo de consentimiento
  2. Asociación con paciente y procedimiento
  3. Generación del documento con datos del paciente
  4. Firma digital táctil (canvas)
  5. Almacenamiento en HCE
  6. Auditoría digital

- **Firma Digital:**
  - Firma del paciente (obligatoria)
  - Firma de testigo (opcional)
  - Firma de familiar (opcional)
  - Firma del médico (obligatoria)
  - Soporte táctil (tablet, pantalla táctil)

- **Auditoría Digital:**
  - IP de origen
  - Navegador utilizado
  - Dispositivo ID
  - Fecha y hora exacta
  - Usuario que registró
  - Trazabilidad completa

##### 🔍 **Consulta de Consentimientos**

- **Filtros de Búsqueda:**
  - Por paciente
  - Por servicio
  - Por procedimiento
  - Por fecha
  - Por médico

- **Estadísticas:**
  - Total de consentimientos aplicados
  - Distribución por servicio
  - % de consentimientos con firmas completas
  - Consentimientos por período

#### ✅ **Auditoría de Calidad HC**

##### 📋 **Registro de Auditorías**

- **Tipos de Auditoría:**
  - Auditoría interna
  - Auditoría externa
  - Auditoría concurrente (durante la atención)
  - Auditoría retrospectiva (después del egreso)

- **Datos de la Auditoría:**
  - Fecha de auditoría
  - Auditor responsable
  - Área auditada
  - Tamaño de la muestra
  - Criterio de selección
  - Historias revisadas

- **Resultados:**
  - Hallazgos positivos (fortalezas)
  - Hallazgos negativos (oportunidades de mejora)
  - Hallazgos críticos
  - Observaciones generales
  - Conclusiones
  - Plan de mejoramiento

##### 🔎 **Checklist de Auditoría HC**

- **50+ Criterios de Evaluación basados en Resolución 1995/1999:**

**1. Identificación del Paciente (10 criterios):**
- Nombre completo
- Tipo y número de documento
- Fecha de nacimiento
- Sexo
- Dirección y teléfono
- Aseguradora
- Tipo de afiliación
- Nombre del acompañante
- Parentesco y teléfono
- Datos claros y legibles

**2. Anamnesis (8 criterios):**
- Motivo de consulta
- Enfermedad actual
- Antecedentes personales
- Antecedentes familiares
- Antecedentes farmacológicos
- Revisión por sistemas
- Historia completa y coherente
- Redacción clara

**3. Examen Físico (7 criterios):**
- Signos vitales completos
- Examen físico general
- Examen por sistemas
- Hallazgos positivos y negativos
- Descripción clara
- Peso y talla (cuando aplica)
- IMC calculado

**4. Diagnóstico (6 criterios):**
- Diagnóstico principal
- Diagnósticos secundarios
- Código CIE-10
- Impresión diagnóstica clara
- Correlación clínica
- Diagnóstico definitivo al egreso

**5. Plan de Manejo (8 criterios):**
- Ordenes médicas claras
- Prescripciones completas
- Paraclínicos solicitados
- Interconsultas justificadas
- Recomendaciones al egreso
- Evolución programada
- Plan terapéutico
- Firma y sello del médico

**6. Evoluciones (6 criterios):**
- Evolución diaria en hospitalización
- Hora y fecha de evolución
- Descripción del estado del paciente
- Análisis de paraclínicos
- Ajustes al plan de manejo
- Firma del profesional

**7. Órdenes Médicas (4 criterios):**
- Órdenes con fecha y hora
- Medicamentos con dosis, vía, frecuencia
- Firma del médico
- Legibilidad

**8. Consentimientos Informados (3 criterios):**
- Consentimiento firmado para procedimientos
- Explicación de riesgos documentada
- Firma del paciente/familiar

**9. Calidad Formal (5 criterios):**
- Sin tachones o enmendaduras
- Letra legible
- Sin espacios en blanco
- Continuidad
- Identificación en cada hoja

**10. Oportunidad (3 criterios):**
- HC diligenciada en < 24 horas
- Epicrisis al egreso
- Resumen de atención

- **Evaluación Automática:**
  - Cálculo de porcentaje de cumplimiento
  - Identificación de criterios incumplidos
  - Generación automática de hallazgos
  - Clasificación de severidad

- **Exportación:**
  - Exportar a archivo de texto
  - Generación de reportes PDF
  - Compartir resultados

##### 🚨 **Gestión de Hallazgos**

- **Tipos de Hallazgos:**
  - Fortaleza
  - Oportunidad de mejora
  - No conformidad menor
  - No conformidad mayor

- **Severidad:**
  - Crítica
  - Mayor
  - Menor
  - Observación

- **Gestión del Hallazgo:**
  - Descripción del hallazgo
  - Criterio normativo incumplido
  - Evidencia
  - Acción correctiva propuesta
  - Responsable de la acción
  - Fecha límite
  - Estado (Abierto, En Proceso, Cerrado, Verificado)
  - Verificación del cierre

- **Validaciones:**
  - No se puede cerrar una auditoría con hallazgos críticos abiertos
  - Alerta de hallazgos críticos en dashboard
  - Seguimiento de planes de acción

##### 📊 **Indicadores de Calidad HC**

- **Gestión de Indicadores:**
  - Código del indicador
  - Nombre
  - Descripción
  - Fórmula de cálculo
  - Meta
  - Unidad de medida (%, días, número)
  - Sentido (ascendente/descendente)
  - Frecuencia (mensual, trimestral, semestral, anual)
  - Responsable

- **Indicadores Predefinidos:**
  - % HC completas y oportunas
  - % Consentimientos informados aplicados
  - Tiempo promedio de diligenciamiento HC
  - % Cumplimiento en auditorías HC
  - Número de hallazgos críticos
  - % HC con diagnóstico CIE-10
  - % Evoluciones diarias completas

- **Registro de Mediciones:**
  - Período (2025-01, 2025-Q1, 2025)
  - Numerador y denominador
  - Resultado calculado automáticamente
  - Evaluación automática de cumplimiento de meta
  - Análisis de la medición
  - Acciones de mejora

- **Dashboard de Indicadores:**
  - Gráficas de tendencias
  - Semáforos de cumplimiento
  - Comparación con metas
  - Análisis de brechas

#### 📁 **Formatos Operativos**

##### 📥 **Registro de Entrada/Salida de HC Físicas**

- **Control de Préstamos:**
  - Registro de salida de HC física
  - Número de HC
  - Datos del paciente
  - Solicitante (nombre, área)
  - Motivo del préstamo
  - Fecha y hora de salida
  - Estado: Pendiente de devolución

- **Registro de Devolución:**
  - Fecha y hora de entrada
  - Estado de la HC (completa, incompleta, daños)
  - Observaciones
  - Estado: Devuelta

- **Estadísticas:**
  - Total de movimientos
  - HC prestadas (pendientes)
  - HC devueltas
  - Tiempo promedio de préstamo
  - HC no devueltas (alerta)

- **Búsqueda:**
  - Por número de HC
  - Por paciente
  - Por solicitante
  - Por estado

##### 📄 **Formatos Descargables**

- **Formatos Disponibles:**

1. **HC-FR-001 - Registro Entrada/Salida HC** (Excel)
   - Control de préstamos de historias clínicas físicas
   - Formato editable

2. **Plan de Contingencia HC** (Word/PDF)
   - Formato de historia clínica manual
   - Para uso en caso de falla del sistema
   - Incluye todos los apartados obligatorios

3. **HC-FR-002 - Solicitud de HC** (PDF)
   - Formato para solicitar historia clínica física
   - Autorización de préstamo

4. **HC-FR-003 - Inventario HC** (Excel)
   - Formato para inventario de historias clínicas físicas
   - Control de archivos

- **Características:**
  - Descarga directa
  - Formatos en blanco
  - Plantillas editables
  - Cumplimiento normativo

##### 📚 **Manuales y Documentos de Referencia**

- **Documentos Disponibles:**

1. **Manual de Manejo y Diligenciamiento de HC** (PDF - 45 páginas)
   - Guía completa oficial
   - Versión 3.0

2. **Procedimiento Consentimiento Informado** (PDF - 12 páginas)
   - Procedimiento para aplicación
   - Versión 2.1

3. **Resolución 1995/1999 - Ministerio de Salud** (PDF - 28 páginas)
   - Normativa colombiana oficial
   - Versión oficial

- **Enlaces Externos:**
  - Ministerio de Salud - Resoluciones HC
  - Supersalud - Normativa Calidad HC
  - Habilitación - Requisitos HC

### 6.2 Modelos de Base de Datos

```prisma
// Documentos Normativos
model DocumentoHC {
  id                String   @id @default(uuid())
  codigo            String   @unique
  nombre            String
  tipo              TipoDocHC         // MANUAL, PROCEDIMIENTO, FORMATO, etc.
  categoria         CategoriaDocHC    // NORMATIVA, CUMPLIMIENTO, OPERATIVO
  version           String
  estado            EstadoDocHC       // BORRADOR, VIGENTE, OBSOLETO
  descripcion       String?           @db.Text
  archivoUrl        String
  fechaEmision      DateTime
  fechaRevision     DateTime?
  fechaVencimiento  DateTime?
  elaboradoPor      String            @db.Uuid
  revisadoPor       String?           @db.Uuid
  aprobadoPor       String?           @db.Uuid
  versiones         VersionDocHC[]
  distribucion      DistribucionDocHC[]
}

model VersionDocHC {
  id                String   @id @default(uuid())
  documentoId       String
  version           String
  cambiosRealizados String   @db.Text
  archivoUrl        String
  fechaVersion      DateTime
  creadoPor         String   @db.Uuid
}

model DistribucionDocHC {
  id              String   @id @default(uuid())
  documentoId     String
  usuarioId       String   @db.Uuid
  fechaEntrega    DateTime
  fechaLectura    DateTime?
  confirmado      Boolean
  observaciones   String?  @db.Text
}

// Certificaciones
model CertificacionHC {
  id                String   @id @default(uuid())
  tipo              String   // SOFTWARE_HC, HABILITACION, etc.
  nombre            String
  entidadEmisora    String
  numeroRegistro    String?
  fechaEmision      DateTime
  fechaVencimiento  DateTime
  estado            String   // VIGENTE, VENCIDA, EN_RENOVACION
  archivoUrl        String
  responsable       String   @db.Uuid
  alertaGenerada60  Boolean
  alertaGenerada30  Boolean
  alertaGenerada15  Boolean
}

// Consentimientos
model ConsentimientoTipo {
  id              String   @id @default(uuid())
  codigo          String   @unique
  nombre          String
  servicio        String
  procedimiento   String
  plantilla       String   @db.Text
  version         String
  requiereFirma   Boolean
  requiereTestigo Boolean
  requiereFamiliar Boolean
  aplicaciones    ConsentimientoAplicado[]
}

model ConsentimientoAplicado {
  id                    String   @id @default(uuid())
  tipoId                String
  pacienteId            String   @db.Uuid
  medicoId              String   @db.Uuid
  fechaAplicacion       DateTime
  firmaPaciente         String?
  firmaTestigo          String?
  firmaFamiliar         String?
  firmaMedico           String?
  observaciones         String?  @db.Text
  ipOrigen              String?
  navegador             String?
}

// Auditorías
model AuditoriaHC {
  id                    String   @id @default(uuid())
  tipo                  TipoAuditoriaHC
  fechaAuditoria        DateTime
  auditor               String   @db.Uuid
  areaAuditada          String
  historiasRevisadas    Int
  hallazgosPositivos    Int
  hallazgosNegativos    Int
  hallazgosCriticos     Int
  observaciones         String?  @db.Text
  conclusiones          String?  @db.Text
  planMejoramiento      String?  @db.Text
  estado                String   // ABIERTA, CERRADA
  hallazgos             HallazgoHC[]
}

model HallazgoHC {
  id                String   @id @default(uuid())
  auditoriaId       String
  tipo              TipoHallazgoHC
  severidad         SeveridadHallazgoHC
  criterio          String
  descripcion       String   @db.Text
  evidencia         String?  @db.Text
  accionCorrectiva  String?  @db.Text
  responsable       String?  @db.Uuid
  fechaLimite       DateTime?
  estado            EstadoHallazgoHC
  fechaCierre       DateTime?
}

// Indicadores
model IndicadorCalidadHC {
  id                String   @id @default(uuid())
  codigo            String   @unique
  nombre            String
  descripcion       String   @db.Text
  formula           String   @db.Text
  meta              Float
  unidadMedida      String
  sentido           String   // ASCENDENTE, DESCENDENTE
  frecuencia        FrecuenciaIndicadorHC
  responsable       String   @db.Uuid
  mediciones        MedicionIndicadorHC[]
}

model MedicionIndicadorHC {
  id                Int      @id @default(autoincrement())
  indicadorId       String
  periodo           String
  mes               Int?
  trimestre         Int?
  anio              Int
  numerador         Float?
  denominador       Float?
  resultado         Float
  cumpleMeta        Boolean
  analisis          String?  @db.Text
  accionesMejora    String?  @db.Text
  registradoPor     String   @db.Uuid
}
```

### 6.3 Endpoints API

```javascript
// Dashboard
GET    /calidad2/historia-clinica/dashboard/resumen
GET    /calidad2/historia-clinica/dashboard/tendencias-indicadores
GET    /calidad2/historia-clinica/dashboard/timeline-auditorias
GET    /calidad2/historia-clinica/dashboard/distribucion-consentimientos
GET    /calidad2/historia-clinica/dashboard/top-hallazgos

// Documentos (12 endpoints)
GET    /calidad2/historia-clinica/documentos
POST   /calidad2/historia-clinica/documentos
GET    /calidad2/historia-clinica/documentos/:id
PUT    /calidad2/historia-clinica/documentos/:id
DELETE /calidad2/historia-clinica/documentos/:id
POST   /calidad2/historia-clinica/documentos/:id/aprobar
POST   /calidad2/historia-clinica/documentos/:id/distribuir
POST   /calidad2/historia-clinica/documentos/:id/versiones
GET    /calidad2/historia-clinica/documentos/:id/versiones
POST   /calidad2/historia-clinica/documentos/:id/confirmar-lectura
GET    /calidad2/historia-clinica/documentos/stats

// Certificaciones (8 endpoints)
GET    /calidad2/historia-clinica/certificaciones
POST   /calidad2/historia-clinica/certificaciones
GET    /calidad2/historia-clinica/certificaciones/:id
PUT    /calidad2/historia-clinica/certificaciones/:id
DELETE /calidad2/historia-clinica/certificaciones/:id
GET    /calidad2/historia-clinica/certificaciones/vencimientos
GET    /calidad2/historia-clinica/certificaciones/stats

// Consentimientos (15 endpoints)
GET    /calidad2/historia-clinica/consentimientos/tipos
POST   /calidad2/historia-clinica/consentimientos/tipos
GET    /calidad2/historia-clinica/consentimientos/tipos/:id
PUT    /calidad2/historia-clinica/consentimientos/tipos/:id
DELETE /calidad2/historia-clinica/consentimientos/tipos/:id
POST   /calidad2/historia-clinica/consentimientos/aplicar
GET    /calidad2/historia-clinica/consentimientos/aplicados
GET    /calidad2/historia-clinica/consentimientos/paciente/:pacienteId
GET    /calidad2/historia-clinica/consentimientos/stats

// Auditorías (12 endpoints)
GET    /calidad2/historia-clinica/auditorias
POST   /calidad2/historia-clinica/auditorias
GET    /calidad2/historia-clinica/auditorias/:id
PUT    /calidad2/historia-clinica/auditorias/:id
DELETE /calidad2/historia-clinica/auditorias/:id
POST   /calidad2/historia-clinica/auditorias/:id/hallazgos
GET    /calidad2/historia-clinica/auditorias/:id/hallazgos
PUT    /calidad2/historia-clinica/auditorias/hallazgos/:hallazgoId
POST   /calidad2/historia-clinica/auditorias/:id/cerrar
GET    /calidad2/historia-clinica/auditorias/stats

// Indicadores (8 endpoints)
GET    /calidad2/historia-clinica/indicadores
POST   /calidad2/historia-clinica/indicadores
GET    /calidad2/historia-clinica/indicadores/:id
PUT    /calidad2/historia-clinica/indicadores/:id
DELETE /calidad2/historia-clinica/indicadores/:id
POST   /calidad2/historia-clinica/indicadores/:id/mediciones
GET    /calidad2/historia-clinica/indicadores/:id/mediciones
GET    /calidad2/historia-clinica/indicadores/dashboard
```

---

## 7. ⚙️ CONFIGURACIÓN DE CHECKLISTS

**Módulo:** `checklists`
**Ubicación:** `/calidad2/checklists`
**Propósito:** Configuración de checklists personalizados (Solo SuperAdmin)
**Acceso:** Restringido a usuarios con rol SuperAdmin

### 7.1 Funcionalidades Principales

#### 🛠️ **Gestión de Checklists**

- **Crear Checklists Personalizados:**
  - Nombre del checklist
  - Tipo (Habilitación, Acreditación, Proceso)
  - Descripción
  - Secciones organizadas
  - Criterios de evaluación

- **Configuración de Criterios:**
  - Texto del criterio
  - Peso/ponderación
  - Tipo de respuesta (Sí/No, Escala, Texto)
  - Obligatoriedad
  - Referencias normativas

- **Edición y Versionamiento:**
  - Modificar checklists existentes
  - Crear nuevas versiones
  - Marcar como obsoletos
  - Historial de cambios

### 7.2 Usos de los Checklists

Los checklists configurados aquí se utilizan en:
- Módulo de Documentos de Inscripción
- Auditorías de Historia Clínica
- Evaluaciones de procesos
- Verificaciones de cumplimiento normativo

---

## 🔗 INTEGRACIÓN ENTRE MÓDULOS

### Flujos de Trabajo Integrados

#### 1. Flujo de Habilitación

```
Documentos de Inscripción → Checklist de Habilitación → Talento Humano (Personal)
→ Infraestructura (Equipos) → Medicamentos (Inventarios) → Procesos Prioritarios (Indicadores)
```

#### 2. Flujo de Capacitación

```
Talento Humano (Necesidades) → Programación → Sesiones → Asistencia → Evaluaciones
→ Certificados → Indicadores de Calidad
```

#### 3. Flujo de Evento Adverso

```
Procesos Prioritarios (Registro) → Análisis de Causa Raíz → Plan de Acción
→ Indicadores → Comité de Seguridad → Seguimiento
```

#### 4. Flujo de PQRSF

```
SIAU (Radicación) → Asignación → Respuesta → Cierre → Análisis de Tendencias
→ Planes de Mejora → Indicadores
```

#### 5. Flujo de Auditoría HC

```
Historia Clínica (Programación) → Checklist → Hallazgos → Planes de Acción
→ Seguimiento → Indicadores → Dashboard
```

### Datos Compartidos

- **Usuarios/Personal:** Compartido entre todos los módulos
- **Indicadores:** Consolidados en Procesos Prioritarios
- **Alertas:** Centralizadas en cada módulo
- **Documentos:** Referencias cruzadas entre módulos

---

## 📊 API Y ENDPOINTS

### Estructura de Rutas

Todas las rutas de Calidad 2.0 están bajo el prefijo `/calidad2`:

```
/calidad2/
├── carpetas                    # Documentos de Inscripción
├── documentos
├── checklists
├── personal                    # Talento Humano
├── capacitaciones
├── certificados
├── induccion
├── capacidad
├── manual-funciones
├── formatos
├── infraestructura/           # Infraestructura
│   ├── procesos-documentados
│   ├── mantenimientos
│   └── pgirasa
├── medicamentos/              # Medicamentos
│   ├── protocolos
│   ├── inventarios
│   ├── farmacovigilancia
│   ├── tecnovigilancia
│   └── temperatura-humedad
├── indicadores                # Procesos Prioritarios
├── eventos-adversos
├── pqrsf
├── encuestas
├── comites
├── gpc
├── protocolos
├── historia-clinica/          # Historia Clínica
│   ├── dashboard
│   ├── documentos
│   ├── certificaciones
│   ├── consentimientos
│   ├── auditorias
│   └── indicadores
└── alertas                    # Alertas generales
```

### Formato de Respuestas

**Éxito:**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

**Con Paginación:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Descripción del error",
  "details": "Detalles adicionales"
}
```

---

## 📈 INDICADORES Y REPORTES

### Indicadores Globales de Calidad 2.0

El sistema permite medir y monitorear:

1. **Cumplimiento Normativo:**
   - % de documentos vigentes
   - % de certificaciones vigentes
   - % de cumplimiento en checklists

2. **Talento Humano:**
   - % de personal con documentos al día
   - Horas de capacitación por empleado
   - % de cumplimiento del plan de capacitación

3. **Seguridad del Paciente:**
   - Tasa de eventos adversos
   - Densidad de incidentes
   - % de eventos analizados

4. **Satisfacción del Usuario:**
   - NPS (Net Promoter Score)
   - % de PQRSF respondidas a tiempo
   - Tiempo promedio de respuesta

5. **Calidad de HC:**
   - % de HC completas
   - % de consentimientos aplicados
   - % de cumplimiento en auditorías

### Reportes Disponibles

Cada módulo genera reportes en:
- **PDF** (para impresión y archivo)
- **Excel** (para análisis de datos)
- **Dashboards interactivos** (Echarts)

---

## 🎓 CAPACITACIÓN Y SOPORTE

### Recursos de Ayuda

- Manuales integrados en cada módulo
- Tooltips contextuales
- Videos tutoriales
- Documentación PDF descargable

### Roles y Permisos

El sistema maneja permisos granulares:
- **SuperAdmin:** Acceso completo + configuración de checklists
- **Admin:** Acceso a todos los módulos
- **Coordinador de Calidad:** Gestión de procesos prioritarios
- **Auditor:** Auditorías y revisión
- **Usuario:** Consulta y registro según asignación

---

## 📞 CONTACTO Y SOPORTE

Para soporte técnico o consultas sobre el Sistema de Calidad 2.0:

- **Email:** soporte@clinicamia.com
- **GitHub Issues:** https://github.com/clinica-mia/calidad2.0/issues
- **Documentación:** https://docs.clinicamia.com/calidad2.0

---

## 📝 CONTROL DE CAMBIOS

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| 2.0.0 | 2026-01-06 | Implementación completa del Sistema de Calidad 2.0 |
| 2.1.0 | 2026-01-06 | Módulo de Historia Clínica agregado |

---

**Documento generado automáticamente por Claude Code**
**Clínica Mía - Sistema de Gestión Hospitalaria**
**© 2025-2026 Todos los derechos reservados**
