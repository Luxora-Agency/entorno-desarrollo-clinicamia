# Plan para Completar Módulo de Admisiones según Requerimientos

## 🎯 OBJETIVO
Completar el módulo de Admisiones para cumplir 100% con los requerimientos, separando la gestión avanzada de camas al módulo de Hospitalización.

---

## 📦 FASE 1: COMPLETAR ADMISIONES (CRÍTICO)

### 1.1 Backend para Documentos de Paciente
**Status**: Frontend listo (90%), Backend falta (0%)
**Prioridad**: ⭐⭐⭐ ALTA

**Tareas**:
- [ ] Crear modelo `DocumentoPaciente` en Prisma:
  ```prisma
  model DocumentoPaciente {
    id              String   @id @default(uuid())
    paciente_id     String
    paciente        Paciente @relation(fields: [paciente_id], references: [id])
    nombre_archivo  String
    tipo_documento  String   // "cedula", "autorizacion", "historia", "otro"
    ruta_archivo    String
    tamano_bytes    Int
    mime_type       String
    subido_por      String
    fecha_subida    DateTime @default(now())
  }
  ```
- [ ] Endpoint POST `/api/pacientes/:id/documentos` - Subir archivo
- [ ] Endpoint GET `/api/pacientes/:id/documentos` - Listar documentos
- [ ] Endpoint DELETE `/api/pacientes/:id/documentos/:docId` - Eliminar documento
- [ ] Almacenamiento: Decidir entre filesystem local o S3
- [ ] Configurar límite de tamaño (10MB por archivo)
- [ ] Validar tipos permitidos (PDF, JPG, PNG, DOCX)

**Tiempo estimado**: 3-4 horas

---

### 1.2 Asignación Simple de Camas en Admisiones
**Status**: 0% - No está integrado en el flujo
**Prioridad**: ⭐⭐⭐ ALTA

**Tareas**:
- [ ] Agregar campo en Tab "Admisiones" para asignar cama al crear admisión
- [ ] Select/Dropdown que muestre:
  - Camas disponibles (estado "Disponible")
  - Filtradas por tipo de unidad seleccionada (UCI, General, etc.)
  - Formato: "Habitación 101 - Cama A (UCI - Disponible)"
- [ ] Al asignar cama:
  - Crear relación Admision -> Cama
  - Cambiar estado de cama a "Ocupada"
  - Registrar fecha/hora de asignación
- [ ] Al hacer movimiento o egreso:
  - Liberar cama anterior (estado "Disponible" o "Limpieza")
  - Si aplica, asignar nueva cama

**Diseño UI**:
```
┌─────────────────────────────────────┐
│ Nueva Admisión                       │
├─────────────────────────────────────┤
│ Motivo: [_________________]          │
│ Tipo: [General ▼]                   │
│                                      │
│ Asignar Cama:                        │
│ [Seleccionar cama... ▼]             │
│   └─ 🏥 Hab. 101 - Cama A (General) │
│   └─ 🏥 Hab. 101 - Cama B (General) │
│   └─ 🏥 Hab. 102 - Cama A (UCI)     │
│                                      │
│ [Cancelar] [Crear Admisión]         │
└─────────────────────────────────────┘
```

**Tiempo estimado**: 2-3 horas

---

### 1.3 Formulario de Egreso Completo
**Status**: 0% - No existe
**Prioridad**: ⭐⭐⭐⭐ CRÍTICA

**Tareas Backend**:
- [ ] Crear modelo `Egreso` en Prisma:
  ```prisma
  model Egreso {
    id                      String    @id @default(uuid())
    admision_id             String    @unique
    admision                Admision  @relation(fields: [admision_id], references: [id])
    fecha_egreso            DateTime  @default(now())
    diagnostico_salida      String    // Código CIE-10 o CIE-11
    descripcion_diagnostico String
    resumen_clinico         String    @db.Text
    tratamiento_domiciliario String?  @db.Text
    recomendaciones         String?   @db.Text
    profesional_responsable String
    tipo_egreso             String    // "Alta médica", "Remisión", "Voluntario", "Fallecimiento"
    estado_paciente         String    // "Mejorado", "Estable", "Otro"
    requiere_control        Boolean   @default(false)
    fecha_control           DateTime? @db.Date
    observaciones           String?   @db.Text
    createdAt               DateTime  @default(now())
  }
  ```
- [ ] Endpoint POST `/api/egresos` - Crear egreso
- [ ] Endpoint GET `/api/egresos/:admisionId` - Obtener egreso de admisión
- [ ] Endpoint GET `/api/egresos` - Listar egresos (con filtros)
- [ ] Al crear egreso:
  - Marcar admisión como "Egresada" (campo estado)
  - Liberar cama asignada (estado "Limpieza")
  - Cerrar factura pendiente (o marcarla para revisión)

**Tareas Frontend**:
- [ ] Crear componente `TabEgreso.jsx` o `ModalEgreso.jsx`
- [ ] Formulario con campos:
  - Fecha y hora de egreso (auto)
  - Diagnóstico de salida (búsqueda CIE-10/11 como en HCE)
  - Resumen clínico (textarea grande)
  - Tratamiento domiciliario (textarea con lista de medicamentos)
  - Recomendaciones (textarea)
  - Tipo de egreso (select)
  - Estado del paciente (select)
  - ¿Requiere control? (checkbox)
  - Fecha control (datepicker condicional)
- [ ] Botón "Generar Resumen PDF" (exportar a PDF)
- [ ] Integración con Tab Facturación (mostrar estado de cuenta)
- [ ] Confirmación: "¿Está seguro de egresar al paciente?"

**Generación de PDF**:
- [ ] Librería: `jsPDF` o `react-pdf`
- [ ] Template con:
  - Logo de la clínica
  - Datos del paciente
  - Diagnóstico de ingreso y salida
  - Resumen clínico
  - Tratamiento y recomendaciones
  - Firma digital del profesional
  - Fecha y hora
- [ ] Botón de descarga y opción de enviar por email

**Tiempo estimado**: 6-8 horas

---

### 1.4 Bitácora y Auditoría en Admisiones
**Status**: 50% (existe en HCE, falta en Admisiones)
**Prioridad**: ⭐⭐ MEDIA

**Tareas**:
- [ ] Crear modelo `AuditoriaAdmision` en Prisma:
  ```prisma
  model AuditoriaAdmision {
    id          String   @id @default(uuid())
    usuario_id  String
    usuario     Usuario  @relation(fields: [usuario_id], references: [id])
    entidad     String   // "Paciente", "Admision", "Movimiento", "Egreso"
    entidad_id  String
    accion      String   // "crear", "modificar", "eliminar", "egresar"
    cambios     Json?    // JSON con campos modificados (antes/después)
    ip_address  String?
    user_agent  String?
    createdAt   DateTime @default(now())
  }
  ```
- [ ] Middleware en backend para registrar automáticamente:
  - Creación de paciente
  - Creación de admisión
  - Modificación de datos críticos
  - Creación de egreso
- [ ] Frontend: Vista de auditoría (opcional, para admin)
  - Tabla con filtros por usuario, entidad, fecha
  - Detalles de cambios en JSON formato legible

**Tiempo estimado**: 3-4 horas

---

### 1.5 Mejoras en Historial de Admisiones
**Status**: 70% - Existe pero falta análisis avanzado
**Prioridad**: ⭐ BAJA (nice to have)

**Tareas**:
- [ ] Agregar filtros avanzados en Tab "Admisiones":
  - Por fecha (rango)
  - Por motivo de admisión
  - Por tipo (ambulatoria, hospitalización, UCI)
  - Por estado (activa, egresada)
- [ ] Función "Comparar Admisiones":
  - Seleccionar 2+ admisiones del mismo paciente
  - Mostrar lado a lado: diagnósticos, duración, tratamientos
  - Gráfica de evolución temporal
- [ ] Indicadores:
  - Tiempo promedio de estancia
  - Recurrencia de diagnósticos
  - Costos totales por episodio

**Tiempo estimado**: 4-5 horas (opcional)

---

## 📦 FASE 2: MÓDULO DE HOSPITALIZACIÓN (SEPARADO)

### 2.1 Mapa Interactivo de Camas
**Status**: 0% - Mover desde Admisiones a módulo propio
**Prioridad**: ⭐⭐⭐ ALTA (pero después de Fase 1)

**Ubicación**: Nuevo módulo "Hospitalización" en el sidebar, submódulo "Mapa de Camas"

**Tareas**:
- [ ] Crear vista de mapa/grid visual:
  ```
  ┌─────────────────────────────────────────────┐
  │ 🏥 Unidad: UCI ▼        🔍 Buscar...        │
  ├─────────────────────────────────────────────┤
  │                                              │
  │  Habitación 101 (Doble - Masculino)         │
  │  ┌────────┐ ┌────────┐                     │
  │  │ Cama A │ │ Cama B │                     │
  │  │ 🟢 Disp│ │ 🔴 Ocup│                     │
  │  │        │ │ J.Pérez│                     │
  │  └────────┘ └────────┘                     │
  │                                              │
  │  Habitación 102 (Individual - Femenino)     │
  │  ┌────────┐                                 │
  │  │ Cama A │                                 │
  │  │ 🟡 Limp│                                 │
  │  └────────┘                                 │
  │                                              │
  └─────────────────────────────────────────────┘
  ```
- [ ] Estados visuales con colores:
  - 🟢 Verde: Disponible
  - 🔴 Rojo: Ocupada (mostrar nombre paciente)
  - 🟡 Amarillo: En limpieza
  - 🔵 Azul: Mantenimiento
  - ⚫ Gris: Fuera de servicio
- [ ] Click en cama para ver:
  - Detalles del paciente (si ocupada)
  - Historial de ocupación
  - Cambiar estado manualmente
  - Asignar/liberar
- [ ] Filtros:
  - Por unidad (UCI, General, Pediatría)
  - Por estado (solo disponibles, solo ocupadas)
  - Por tipo (individual, doble, triple)
  - Por género (si aplica)
- [ ] Dashboard con métricas:
  - Ocupación total: 45/60 (75%)
  - Por unidad: UCI 8/10, General 30/40
  - Camas en limpieza: 5
  - Camas disponibles: 12

**Tiempo estimado**: 8-10 horas

---

### 2.2 Gestión de Estados de Camas
**Status**: 0%
**Prioridad**: ⭐⭐⭐ ALTA

**Tareas**:
- [ ] Endpoints backend:
  - POST `/api/camas/:id/cambiar-estado`
  - GET `/api/camas/disponibles?unidad_id=X&tipo=Y`
  - GET `/api/camas/estadisticas`
- [ ] Frontend: Botones rápidos para cambiar estado:
  - "Marcar en Limpieza"
  - "Marcar Disponible"
  - "Fuera de Servicio" (con motivo)
- [ ] Reglas automáticas:
  - Al egresar paciente → Cama pasa a "Limpieza"
  - Al asignar admisión → Cama pasa a "Ocupada"
- [ ] Historial de cambios de estado

**Tiempo estimado**: 4-5 horas

---

### 2.3 Asignación Inteligente de Camas (Algoritmo)
**Status**: 0%
**Prioridad**: ⭐⭐ MEDIA

**Tareas**:
- [ ] Algoritmo de sugerencia automática:
  ```javascript
  function sugerirCama(paciente, tipoAdmision, urgencia) {
    // 1. Filtrar por tipo de unidad necesaria
    // 2. Si es habitación compartida, filtrar por género
    // 3. Priorizar por urgencia (UCI primero)
    // 4. Considerar ubicación geográfica (mismo piso/ala)
    // 5. Retornar top 3 opciones
  }
  ```
- [ ] Frontend: Botón "Sugerir Cama Automáticamente"
- [ ] Mostrar score/razón de cada sugerencia:
  - ✅ Unidad correcta
  - ✅ Género compatible
  - ⚠️ Lejos de enfermería (piso 3)

**Tiempo estimado**: 3-4 horas

---

## 📊 RESUMEN DE TIEMPOS

### Fase 1 - Completar Admisiones:
| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| 1.1 Backend Documentos | 3-4h | ⭐⭐⭐ |
| 1.2 Asignación Simple Camas | 2-3h | ⭐⭐⭐ |
| 1.3 Formulario Egreso | 6-8h | ⭐⭐⭐⭐ |
| 1.4 Auditoría | 3-4h | ⭐⭐ |
| 1.5 Mejoras Historial | 4-5h | ⭐ |
| **TOTAL FASE 1** | **18-24h** | |

### Fase 2 - Hospitalización (Separado):
| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| 2.1 Mapa Interactivo | 8-10h | ⭐⭐⭐ |
| 2.2 Gestión Estados | 4-5h | ⭐⭐⭐ |
| 2.3 Asignación Inteligente | 3-4h | ⭐⭐ |
| **TOTAL FASE 2** | **15-19h** | |

---

## 🎯 PLAN DE EJECUCIÓN RECOMENDADO

### Sprint 1 (Prioridad Máxima):
1. **Formulario de Egreso** (1.3) - 6-8h
2. **Backend Documentos** (1.1) - 3-4h
3. **Asignación Simple Camas** (1.2) - 2-3h
**Total: ~11-15h** ✅ Admisiones funcional al 90%

### Sprint 2 (Completar Admisiones):
4. **Auditoría** (1.4) - 3-4h
5. **Mejoras Historial** (1.5) - 4-5h (opcional)
**Total: ~7-9h** ✅ Admisiones 100% completo

### Sprint 3 (Nuevo Módulo Hospitalización):
6. **Mapa Interactivo** (2.1) - 8-10h
7. **Gestión Estados** (2.2) - 4-5h
**Total: ~12-15h** ✅ Gestión visual de camas

### Sprint 4 (Optimización):
8. **Asignación Inteligente** (2.3) - 3-4h
**Total: ~3-4h** ✅ Sistema completo y optimizado

---

## 📝 NOTAS IMPORTANTES

1. **Separación de conceptos**:
   - **Admisiones**: Gestiona el flujo del paciente (ingreso, estadía, egreso)
   - **Hospitalización**: Gestiona recursos físicos (camas, habitaciones, ocupación)

2. **Ventajas de esta separación**:
   - Módulo de Hospitalización útil para enfermería, limpieza, administración
   - Admisiones más ligero y enfocado en el paciente
   - Escalabilidad: se puede expandir Hospitalización sin afectar Admisiones

3. **Recomendación**:
   - Empezar por **Sprint 1** (crítico: egreso + documentos + camas básicas)
   - Evaluar feedback del usuario antes de Sprint 3 (Hospitalización completo)

4. **Tecnologías sugeridas**:
   - Generación PDF: `jsPDF` o `@react-pdf/renderer`
   - Upload archivos: `multer` (backend) + chunked upload
   - Mapa interactivo: Grid CSS + componentes shadcn/ui (no requiere librerías)
