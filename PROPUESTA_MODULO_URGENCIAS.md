# 🚨 Propuesta: Módulo de Urgencias - Flujo Completo

## 📋 Análisis Actual

### ✅ Lo que YA existe:
- ✅ Frontend de Urgencias con UI de triaje Manchester (datos mock)
- ✅ Modelo `Admision` con `camaId` **opcional** (soporta hospitalización sin cama)
- ✅ Modelo `EvolucionClinica` con tipo `Urgencia`
- ✅ Sistema de Citas
- ✅ Sistema de Hospitalización

### ❌ Lo que FALTA:
- ❌ Modelo de Triaje en BD
- ❌ Backend para urgencias (rutas, servicios)
- ❌ Conexión Urgencias → Consulta
- ❌ Conexión Urgencias → Hospitalización

---

## 🎯 Propuesta de Diseño

### Modelo de Base de Datos

```prisma
// Nuevo modelo: AtencionUrgencias
model AtencionUrgencias {
  id                    String              @id @default(uuid())
  pacienteId            String
  
  // Triaje Manchester
  categoriaManchester   CategoriaManchester // Enum: Rojo, Naranja, Amarillo, Verde, Azul
  nivelUrgencia         String              // Reanimación, Muy Urgente, Urgente, Poco Urgente, No Urgente
  prioridad             Int                 // 1-5
  
  // Información de Llegada
  motivoConsulta        String              @db.Text
  horaLlegada           DateTime            @default(now())
  horaTriaje            DateTime?
  
  // Signos Vitales Iniciales
  presionSistolica      Int?
  presionDiastolica     Int?
  frecuenciaCardiaca    Int?
  frecuenciaRespiratoria Int?
  temperatura           Decimal?            @db.Decimal(4, 1)
  saturacionOxigeno     Decimal?            @db.Decimal(5, 2)
  escalaGlasgow         Int?
  
  // Atención
  estado                EstadoUrgencia      @default(Espera)
  areaAsignada          String?             // Shock, Consultorio 1, Observación
  medicoAsignado        String?             @db.Uuid
  horaInicioAtencion    DateTime?
  horaFinAtencion       DateTime?
  
  // Diagnóstico y Observaciones
  diagnosticoInicial    String?             @db.Text
  observaciones         String?             @db.Text
  
  // Disposición Final
  disposicion           DisposicionUrgencia? // Alta, Hospitalizar, Remitir, Fallecido
  citaId                String?             // Si se programa cita
  admisionId            String?             // Si se hospitaliza
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  
  // Relaciones
  paciente              Paciente            @relation(fields: [pacienteId], references: [id])
  medico                Usuario?            @relation(fields: [medicoAsignado], references: [id])
  cita                  Cita?               @relation(fields: [citaId], references: [id])
  admision              Admision?           @relation(fields: [admisionId], references: [id])
}

// Enums necesarios
enum CategoriaManchester {
  Rojo      // Reanimación - Inmediato
  Naranja   // Muy Urgente - 10 min
  Amarillo  // Urgente - 60 min
  Verde     // Poco Urgente - 120 min
  Azul      // No Urgente - 240 min
}

enum EstadoUrgencia {
  Espera
  EnAtencion
  Completada
  Alta
  Hospitalizado
  Remitido
  Cancelado
}

enum DisposicionUrgencia {
  Alta
  Hospitalizar
  Remitir
  Fallecido
  Observacion
}
```

---

## 🔄 Flujo Propuesto

### 1️⃣ **Llegada del Paciente**
```
Paciente llega → Búsqueda/Registro → Triaje
```
- Buscar paciente existente o crear nuevo
- Registrar información de triaje
- Asignar categoría Manchester (Rojo/Naranja/Amarillo/Verde/Azul)
- Registrar signos vitales iniciales

### 2️⃣ **En Sala de Espera**
```
Triaje → Lista de Espera (ordenada por prioridad)
```
- Vista tipo tablero con códigos de color
- Ordenado por prioridad (1-5)
- Tiempo de espera visible

### 3️⃣ **Atención Médica**
```
Espera → En Atención → Evaluación
```
- Médico toma el paciente
- Registra evolución clínica tipo "Urgencia"
- Registra signos vitales actualizados
- Registra diagnóstico

### 4️⃣ **Disposición Final** (3 opciones)

#### Opción A: **Alta**
```
Alta → Registro de atención → FIN
```
- Indicaciones de alta
- Prescripciones si necesita
- Cerrar atención de urgencias

#### Opción B: **Consulta Externa**
```
Consulta → Crear Cita → FIN
```
- Programar cita de seguimiento
- Asignar especialidad/doctor
- Cerrar atención de urgencias

#### Opción C: **Hospitalización**
```
Hospitalizar → Crear Admisión → Módulo Hospitalización
```
- **CON cama**: Seleccionar unidad + cama específica
- **SIN cama**: Seleccionar solo unidad (salón común/observación)
- `camaId` = null para hospitalizaciones sin cama
- Crear registro de admisión
- Cerrar atención de urgencias

---

## 🏥 Hospitalización Flexible

### Con Cama Asignada
```javascript
{
  unidadId: "uuid-uci",
  camaId: "uuid-cama-101A",  // ✅ Cama específica
  motivoIngreso: "Complicación respiratoria",
  ...
}
```

### Sin Cama (Salón Común/Observación)
```javascript
{
  unidadId: "uuid-observacion",
  camaId: null,  // ❌ Sin cama específica
  motivoIngreso: "Observación 24h",
  observaciones: "Paciente en salón de observación - Monitoreo cada 4h",
  ...
}
```

---

## 📊 Vistas del Módulo de Urgencias

### Tab 1: **Tablero de Triaje** (Vista Principal)
- Cards por categoría Manchester con contadores
- Lista de pacientes ordenada por prioridad
- Indicadores visuales de tiempo de espera
- Botón "Nuevo Ingreso"

### Tab 2: **En Atención**
- Pacientes siendo atendidos actualmente
- Médico asignado
- Tiempo de atención

### Tab 3: **Completados Hoy**
- Atenciones finalizadas del día
- Estadísticas: Altas, Hospitalizados, Remitidos

---

## 🔗 Integraciones Necesarias

### Con Módulo de Pacientes
- ✅ Búsqueda de paciente existente
- ✅ Creación rápida de paciente nuevo

### Con Módulo de Citas
- 🆕 Crear cita de seguimiento desde urgencias
- 🆕 Endpoint: POST /citas con origen "urgencias"

### Con Módulo de Hospitalización
- ✅ Crear admisión desde urgencias
- 🆕 Modo flexible: con o sin cama
- 🆕 Endpoint actualizado: POST /admisiones (camaId opcional)

### Con HCE
- ✅ Registrar evolución tipo "Urgencia"
- ✅ Registrar signos vitales
- ✅ Registrar diagnósticos

---

## 🛠️ Plan de Implementación

### Fase 1: Backend (Base de Datos)
1. ✅ Crear migración con modelo `AtencionUrgencias`
2. ✅ Crear enums necesarios
3. ✅ Agregar relaciones en otros modelos

### Fase 2: Backend (Servicios y Rutas)
1. ✅ Servicio de urgencias (CRUD)
2. ✅ Endpoint triaje: POST /urgencias/triaje
3. ✅ Endpoint listar: GET /urgencias
4. ✅ Endpoint atender: PUT /urgencias/:id/atender
5. ✅ Endpoint dar alta: PUT /urgencias/:id/alta
6. ✅ Endpoint hospitalizar: PUT /urgencias/:id/hospitalizar
7. ✅ Endpoint crear cita: PUT /urgencias/:id/programar-cita

### Fase 3: Frontend
1. ✅ Actualizar UrgenciasModule con datos reales
2. ✅ Formulario de triaje
3. ✅ Conexión con APIs
4. ✅ Botones de disposición (Alta/Cita/Hospitalizar)

---

## ❓ Preguntas para Confirmar

1. **¿Apruebas este flujo?**
   - Llegada → Triaje → Espera → Atención → Disposición (Alta/Cita/Hospitalización)

2. **¿Qué campos adicionales necesitas en el triaje?**
   - Acompañante, Medio de llegada (ambulancia/particular), etc.

3. **¿Las unidades tipo "Observación" no usan camas?**
   - Confirmo que camaId sea null para estos casos

4. **¿Priorizamos implementar primero?**
   - A) Todo el flujo completo
   - B) Solo triaje y espera (sin disposición)
   - C) Flujo mínimo: Triaje → Alta/Hospitalizar

---

**¿Qué dices? ¿Procedemos con esta propuesta?** 🤔
