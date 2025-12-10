# 🗺️ Roadmap - Próximos Pasos para Clínica Mía

## 📍 SITUACIÓN ACTUAL (Completado)
- ✅ Módulo HCE Fase 1 (Evoluciones SOAP, Signos Vitales, Diagnósticos, Alertas)
- ✅ Sprint 1 de Admisiones (Egreso Completo, Documentos, Asignación básica de camas)
- ✅ Módulo de Facturación y Órdenes Médicas/Medicamentos
- ✅ Módulo de Farmacia (Productos, Categorías, Etiquetas)
- ✅ Gestión de Citas, Pacientes, Usuarios, Departamentos, Especialidades
- ✅ Base de Hospitalización (Unidades, Habitaciones, Camas)

---

## 🎯 OPCIONES DE CONTINUACIÓN

### OPCIÓN A: Completar Módulo de Admisiones (Sprint 2)
**Tiempo estimado**: 7-9 horas
**Prioridad**: 🟡 MEDIA (nice to have)
**Beneficio**: Trazabilidad completa y auditoría

**Tareas**:
1. **Sistema de Auditoría Completo** (3-4h)
   - Modelo `AuditoriaAdmision` en Prisma
   - Registro automático de todas las acciones (crear, modificar, egresar)
   - Log de cambios (antes/después en JSON)
   - Vista de auditoría para administradores
   - Bitácora con IP, usuario, timestamp

2. **Mejoras en Historial de Admisiones** (4-5h)
   - Filtros avanzados:
     - Por rango de fechas
     - Por motivo de admisión
     - Por tipo de unidad
     - Por estado (Activa/Egresada)
   - Función de comparación de episodios clínicos
   - Gráfica de evolución temporal
   - Indicadores:
     - Tiempo promedio de estancia
     - Recurrencia de diagnósticos
     - Resumen de costos por episodio

---

### OPCIÓN B: Módulo de Hospitalización (Gestión Visual de Camas)
**Tiempo estimado**: 12-15 horas
**Prioridad**: 🟠 ALTA (operacionalmente muy útil)
**Beneficio**: Visión completa de ocupación en tiempo real

**Tareas**:
1. **Mapa Interactivo de Camas** (8-10h)
   - Vista tipo grid/mapa de todas las habitaciones
   - Estados visuales con colores:
     - 🟢 Verde: Disponible
     - 🔴 Rojo: Ocupada (mostrar nombre paciente)
     - 🟡 Amarillo: En limpieza
     - 🔵 Azul: En mantenimiento
     - ⚫ Gris: Fuera de servicio
   - Click en cama para ver:
     - Detalles del paciente (si ocupada)
     - Historial de ocupación
     - Cambiar estado manualmente
   - Filtros:
     - Por unidad (UCI, General, Pediatría)
     - Por estado
     - Por tipo de habitación
     - Por género (si aplica)
   - Dashboard con métricas:
     - Ocupación total: 45/60 (75%)
     - Por unidad: UCI 8/10, General 30/40
     - Camas en limpieza: 5
     - Camas disponibles: 12

2. **Gestión de Estados de Camas** (4-5h)
   - Endpoints backend para cambiar estado
   - Frontend con botones rápidos:
     - "Marcar en Limpieza"
     - "Marcar Disponible"
     - "Fuera de Servicio" (con motivo)
   - Reglas automáticas:
     - Al egresar → Cama pasa a "Limpieza"
     - Al asignar → Cama pasa a "Ocupada"
   - Historial de cambios de estado por cama

3. **Asignación Inteligente (Algoritmo)** (3-4h)
   - Algoritmo que sugiere automáticamente:
     - Filtrar por tipo de unidad necesaria
     - Validar género en habitaciones compartidas
     - Priorizar por urgencia (UCI primero)
     - Considerar ubicación (mismo piso/ala)
   - Botón "Sugerir Cama Automáticamente"
   - Mostrar top 3 opciones con score/razón

**Ventaja**: Este módulo sería usado por enfermería, limpieza, administración, no solo por médicos.

---

### OPCIÓN C: HCE Fase 2 (Completar Historia Clínica)
**Tiempo estimado**: 10-12 horas
**Prioridad**: 🟠 ALTA (según estándares clínicos)
**Beneficio**: Sistema HCE 100% completo

**Tareas**:
1. **Tab de Interconsultas** (3-4h)
   - Solicitar interconsulta a otra especialidad
   - Formulario: especialidad, motivo, urgencia
   - Lista de interconsultas pendientes/completadas
   - Respuesta del especialista

2. **Tab de Procedimientos Médicos** (3-4h)
   - Registro de procedimientos realizados
   - Tipo de procedimiento (catálogo predefinido)
   - Fecha, profesional, observaciones
   - Consentimiento informado (opcional)
   - Archivos adjuntos (imágenes, resultados)

3. **Tab de Trazabilidad/Auditoría** (4-5h)
   - Línea de tiempo completa de cambios en HCE
   - Quién modificó qué y cuándo
   - Antes/después de cada cambio
   - Filtros por tipo de acción, profesional, fecha
   - Exportar a PDF para auditorías

---

### OPCIÓN D: HCE Fase 3 (Firma Digital Certificada)
**Tiempo estimado**: 8-10 horas
**Prioridad**: 🟡 MEDIA (mejora de seguridad)
**Beneficio**: Cumplimiento legal estricto

**Tareas**:
1. **Integración con Proveedor de Firma Digital** (5-6h)
   - Investigar proveedores colombianos (Certicámara, GSE, etc.)
   - API de firma digital certificada
   - Almacenar certificados
   - Validación de firmas

2. **Interfaz de Firma** (3-4h)
   - Modal para firmar documentos críticos
   - Captura de PIN o certificado
   - Verificación de identidad
   - Timestamp notarial
   - Indicador visual de documento firmado

---

### OPCIÓN E: Módulo de Disponibilidad de Doctores
**Tiempo estimado**: 6-8 horas
**Prioridad**: 🟠 ALTA (previene doble asignación)
**Beneficio**: Gestión eficiente de agendas médicas

**Tareas**:
1. **Backend de Disponibilidad** (3-4h)
   - Modelo `DisponibilidadDoctor` en Prisma
   - Campos: doctor_id, fecha, hora_inicio, hora_fin, estado (disponible/ocupado)
   - Endpoint para crear bloques de disponibilidad
   - Endpoint para consultar disponibilidad
   - Validación: no permitir citas en horarios ocupados

2. **Frontend de Gestión** (3-4h)
   - Vista de calendario por doctor
   - Crear/editar bloques de disponibilidad
   - Vista semanal/mensual
   - Bloqueos por vacaciones, permisos, etc.
   - Indicador visual de ocupación
   - Integración con módulo de Citas (al crear cita, validar disponibilidad)

---

### OPCIÓN F: Generación de PDFs y Reportes
**Tiempo estimado**: 4-6 horas
**Prioridad**: 🟠 ALTA (requisito legal)
**Beneficio**: Documentos para entregar a pacientes

**Tareas**:
1. **PDF de Egreso** (2-3h)
   - Librería: `jsPDF` o `@react-pdf/renderer`
   - Template con:
     - Logo de clínica
     - Datos del paciente
     - Diagnóstico ingreso/egreso
     - Resumen clínico
     - Tratamiento domiciliario
     - Recomendaciones
     - Firma digital del profesional
   - Botón de descarga
   - Opción de enviar por email

2. **PDF de Historia Clínica** (2-3h)
   - Consolidar toda la información del paciente
   - Evoluciones, signos vitales, diagnósticos
   - Medicamentos, órdenes médicas
   - Formato profesional para auditorías

---

## 🎯 RECOMENDACIÓN SEGÚN PRIORIDADES

### 📊 Si priorizas OPERACIÓN DIARIA:
**1. Módulo de Hospitalización** (OPCIÓN B)
- Razón: Herramienta visual que todos usarán (enfermería, limpieza, admin)
- Impacto: Reducción de errores en asignación de camas
- Tiempo: 12-15 horas

**2. Disponibilidad de Doctores** (OPCIÓN E)
- Razón: Previene doble asignación de citas
- Impacto: Mejor gestión de agendas
- Tiempo: 6-8 horas

**3. PDFs y Reportes** (OPCIÓN F)
- Razón: Requisito legal para entregar al paciente
- Impacto: Cumplimiento normativo
- Tiempo: 4-6 horas

**Total: 22-29 horas (~3-4 días de trabajo)**

---

### 📋 Si priorizas CUMPLIMIENTO CLÍNICO:
**1. HCE Fase 2** (OPCIÓN C)
- Razón: Completar sistema de historia clínica según estándares
- Impacto: HCE 100% completo
- Tiempo: 10-12 horas

**2. PDFs y Reportes** (OPCIÓN F)
- Razón: Documentos legales requeridos
- Impacto: Cumplimiento normativo
- Tiempo: 4-6 horas

**3. Auditoría de Admisiones** (OPCIÓN A - parte 1)
- Razón: Trazabilidad completa de cambios
- Impacto: Seguridad y transparencia
- Tiempo: 3-4 horas

**Total: 17-22 horas (~2-3 días de trabajo)**

---

### 🚀 Si priorizas PRODUCTO DEMO/MVP COMPLETO:
**1. Módulo de Hospitalización** (OPCIÓN B)
- Mapa visual impresionante para demos
- Tiempo: 12-15 horas

**2. PDFs de Egreso** (OPCIÓN F - parte 1)
- Documento profesional para mostrar
- Tiempo: 2-3 horas

**3. Disponibilidad de Doctores** (OPCIÓN E)
- Funcionalidad visible y útil
- Tiempo: 6-8 horas

**Total: 20-26 horas (~2-3 días de trabajo)**

---

## 📝 PLAN SUGERIDO (Equilibrado)

### SEMANA 1:
**Día 1-2**: Módulo de Hospitalización - Mapa Interactivo (8-10h)
**Día 3**: Gestión de Estados de Camas (4-5h)

### SEMANA 2:
**Día 1**: Disponibilidad de Doctores - Backend (3-4h)
**Día 2**: Disponibilidad de Doctores - Frontend (3-4h)
**Día 3**: PDFs de Egreso (2-3h)

### SEMANA 3:
**Día 1-2**: HCE Fase 2 - Interconsultas y Procedimientos (6-8h)
**Día 3**: Auditoría de Admisiones (3-4h)

**RESULTADO**: Sistema hospitalario prácticamente completo, con gestión visual de camas, agendas médicas, documentación legal, e historia clínica completa.

---

## ❓ PREGUNTA PARA TI

**¿Qué opción prefieres priorizar?**
- A) Completar Auditoría y Mejoras de Admisiones (7-9h)
- B) Módulo de Hospitalización visual (12-15h) ⭐ Recomendado
- C) HCE Fase 2 (10-12h)
- D) HCE Fase 3 con Firma Digital Certificada (8-10h)
- E) Disponibilidad de Doctores (6-8h) ⭐ Recomendado
- F) PDFs y Reportes (4-6h) ⭐ Recomendado

O puedo combinar varias opciones según tus prioridades de negocio.
