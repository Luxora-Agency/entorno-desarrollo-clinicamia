# Guía para Agentes de IA - Clínica Mía MCP

Esta guía explica cómo usar las herramientas MCP para gestionar pacientes y citas médicas.

## Configuración Base

```
BASE_URL: https://tu-backend.com/api/v1/mcp
```

## Autenticación (Opcional)

Si el sistema tiene `MCP_API_KEY` configurado, incluir en todas las peticiones:

```
Authorization: Bearer TU_API_KEY
```

---

# FLUJO COMPLETO PARA AGENDAR UNA CITA

## Paso 1: Buscar Especialidades Disponibles

Primero, lista las especialidades para que el paciente elija.

```http
POST /api/v1/mcp/tools/listar_especialidades
Content-Type: application/json

{}
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "listar_especialidades",
  "result": {
    "total": 5,
    "especialidades": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "nombre": "Medicina General",
        "departamento": "Consulta Externa",
        "costo": "$50,000 COP",
        "duracion": "30 minutos",
        "doctores_disponibles": 3
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "nombre": "Cardiología",
        "departamento": "Especialidades",
        "costo": "$120,000 COP",
        "duracion": "45 minutos",
        "doctores_disponibles": 2
      }
    ]
  }
}
```

---

## Paso 2: Buscar Doctores de la Especialidad

Una vez el paciente elige especialidad, busca los doctores disponibles.

```http
POST /api/v1/mcp/tools/buscar_doctores
Content-Type: application/json

{
  "especialidad": "Medicina General"
}
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "buscar_doctores",
  "result": {
    "encontrados": 2,
    "doctores": [
      {
        "id": "doc-uuid-12345",
        "nombre": "Dr. Juan Pérez García",
        "especialidades": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "nombre": "Medicina General",
            "costo": "$50,000 COP"
          }
        ],
        "experiencia": "10 años"
      },
      {
        "id": "doc-uuid-67890",
        "nombre": "Dra. María López Ruiz",
        "especialidades": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "nombre": "Medicina General",
            "costo": "$50,000 COP"
          }
        ],
        "experiencia": "8 años"
      }
    ]
  }
}
```

**IMPORTANTE:** Guarda el `id` del doctor y el `id` de la especialidad, los necesitarás para agendar.

---

## Paso 3: Buscar Disponibilidad del Doctor

Busca los horarios disponibles para una fecha específica.

```http
POST /api/v1/mcp/tools/buscar_disponibilidad
Content-Type: application/json

{
  "doctor_id": "doc-uuid-12345",
  "fecha": "2025-01-15"
}
```

**Respuesta (con disponibilidad):**
```json
{
  "success": true,
  "tool": "buscar_disponibilidad",
  "result": {
    "doctor": "Dr. Juan Pérez García",
    "especialidades": ["Medicina General"],
    "fecha": "2025-01-15",
    "total_slots": 16,
    "slots_disponibles": 8,
    "horarios": [
      { "hora": "08:00", "hora_fin": "08:30" },
      { "hora": "08:30", "hora_fin": "09:00" },
      { "hora": "09:00", "hora_fin": "09:30" },
      { "hora": "10:00", "hora_fin": "10:30" },
      { "hora": "14:00", "hora_fin": "14:30" },
      { "hora": "14:30", "hora_fin": "15:00" },
      { "hora": "15:00", "hora_fin": "15:30" },
      { "hora": "16:00", "hora_fin": "16:30" }
    ],
    "mensaje": "Hay 8 horarios disponibles para el 2025-01-15"
  }
}
```

**Respuesta (sin disponibilidad):**
```json
{
  "success": true,
  "tool": "buscar_disponibilidad",
  "result": {
    "doctor": "Dr. Juan Pérez García",
    "fecha": "2025-01-15",
    "slots_disponibles": 0,
    "horarios": [],
    "mensaje": "No hay horarios disponibles para el 2025-01-15. Intente con otra fecha."
  }
}
```

---

## Paso 4: Buscar si el Paciente Ya Existe

Antes de agendar, verifica si el paciente ya está registrado.

```http
POST /api/v1/mcp/tools/buscar_paciente
Content-Type: application/json

{
  "documento": "1234567890"
}
```

**Respuesta (paciente encontrado):**
```json
{
  "success": true,
  "tool": "buscar_paciente",
  "result": {
    "encontrado": true,
    "paciente": {
      "id": "pac-uuid-11111",
      "nombre": "Carlos Martínez Rodríguez",
      "documento": "CC 1234567890",
      "telefono": "3001234567",
      "email": "carlos@email.com",
      "fecha_nacimiento": "15/3/1985",
      "genero": "Masculino",
      "eps": "Sura",
      "estadisticas": {
        "total_citas": 5,
        "hospitalizaciones": 0
      }
    }
  }
}
```

**Respuesta (paciente NO encontrado):**
```json
{
  "success": true,
  "tool": "buscar_paciente",
  "result": {
    "encontrado": false,
    "mensaje": "No se encontró ningún paciente con documento 1234567890",
    "sugerencia": "Puede registrar al paciente usando la herramienta registrar_paciente"
  }
}
```

---

## Paso 5: Agendar la Cita

Ahora tienes toda la información para agendar. Si el paciente no existe, se crea automáticamente.

```http
POST /api/v1/mcp/tools/agendar_cita
Content-Type: application/json

{
  "documento": "1234567890",
  "tipo_documento": "CC",
  "nombre": "Carlos",
  "apellido": "Martínez Rodríguez",
  "telefono": "3001234567",
  "email": "carlos@email.com",
  "doctor_id": "doc-uuid-12345",
  "especialidad_id": "550e8400-e29b-41d4-a716-446655440001",
  "fecha": "2025-01-15",
  "hora": "09:00",
  "motivo": "Control de rutina"
}
```

**Parámetros:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| documento | string | Sí | Número de cédula |
| tipo_documento | string | No | CC, CE, TI, PP, NIT (default: CC) |
| nombre | string | Sí | Nombre del paciente |
| apellido | string | Sí | Apellido del paciente |
| telefono | string | Sí | Teléfono de contacto |
| email | string | No | Correo electrónico |
| doctor_id | string | Sí | UUID del doctor |
| especialidad_id | string | Sí | UUID de la especialidad |
| fecha | string | Sí | Formato YYYY-MM-DD |
| hora | string | Sí | Formato HH:MM (24h) |
| motivo | string | No | Razón de la consulta |

**Respuesta exitosa:**
```json
{
  "success": true,
  "tool": "agendar_cita",
  "result": {
    "exito": true,
    "mensaje": "¡Cita agendada exitosamente!",
    "cita": {
      "id": "cita-uuid-99999",
      "fecha": "2025-01-15",
      "hora": "09:00",
      "duracion": "30 minutos",
      "doctor": "Dr. Juan Pérez García",
      "especialidad": "Medicina General",
      "paciente": "Carlos Martínez Rodríguez",
      "costo": "$50,000 COP",
      "estado": "Programada"
    },
    "recordatorio": "Recuerde llegar 15 minutos antes de su cita. Traiga su documento de identidad y carné de EPS si aplica."
  }
}
```

**IMPORTANTE:** Guarda el `id` de la cita para futuras operaciones (cancelar, reprogramar, consultar).

---

# CONSULTAR CITAS DE UN PACIENTE

```http
POST /api/v1/mcp/tools/consultar_citas_paciente
Content-Type: application/json

{
  "documento": "1234567890",
  "estado": "Programada"
}
```

**Parámetros opcionales:**
| Campo | Descripción |
|-------|-------------|
| estado | Programada, Completada, Cancelada, NoAsistio, EnProceso |
| desde | Fecha inicio (YYYY-MM-DD) |
| hasta | Fecha fin (YYYY-MM-DD) |
| limite | Número máximo de resultados |

**Respuesta:**
```json
{
  "success": true,
  "tool": "consultar_citas_paciente",
  "result": {
    "encontrado": true,
    "paciente": "Carlos Martínez Rodríguez",
    "total_citas": 2,
    "citas": [
      {
        "id": "cita-uuid-99999",
        "fecha": "miércoles, 15 de enero de 2025",
        "hora": "09:00",
        "doctor": "Dr. Juan Pérez García",
        "especialidad": "Medicina General",
        "estado": "Programada",
        "costo": "$50,000 COP"
      },
      {
        "id": "cita-uuid-88888",
        "fecha": "viernes, 20 de enero de 2025",
        "hora": "14:30",
        "doctor": "Dra. María López Ruiz",
        "especialidad": "Cardiología",
        "estado": "Programada",
        "costo": "$120,000 COP"
      }
    ]
  }
}
```

---

# REPROGRAMAR UNA CITA

Primero busca disponibilidad en la nueva fecha, luego reprograma.

```http
POST /api/v1/mcp/tools/reprogramar_cita
Content-Type: application/json

{
  "cita_id": "cita-uuid-99999",
  "nueva_fecha": "2025-01-20",
  "nueva_hora": "10:30",
  "motivo": "Cambio por viaje de trabajo"
}
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "reprogramar_cita",
  "result": {
    "exito": true,
    "mensaje": "¡Cita reprogramada exitosamente!",
    "cambio": {
      "anterior": {
        "fecha": "15/1/2025",
        "hora": "09:00"
      },
      "nueva": {
        "fecha": "2025-01-20",
        "hora": "10:30"
      }
    },
    "cita": {
      "id": "cita-uuid-99999",
      "doctor": "Dr. Juan Pérez García",
      "especialidad": "Medicina General",
      "paciente": "Carlos Martínez Rodríguez"
    },
    "recordatorio": "Recuerde llegar 15 minutos antes de su nueva cita."
  }
}
```

---

# CANCELAR UNA CITA

```http
POST /api/v1/mcp/tools/cancelar_cita
Content-Type: application/json

{
  "cita_id": "cita-uuid-99999",
  "motivo": "Ya no puedo asistir por motivos personales"
}
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "cancelar_cita",
  "result": {
    "exito": true,
    "mensaje": "Cita cancelada exitosamente",
    "cita_cancelada": {
      "id": "cita-uuid-99999",
      "fecha": "lunes, 20 de enero de 2025",
      "hora": "10:30",
      "doctor": "Dr. Juan Pérez García",
      "especialidad": "Medicina General",
      "paciente": "Carlos Martínez Rodríguez",
      "motivo_cancelacion": "Ya no puedo asistir por motivos personales"
    },
    "nota": "Si desea reagendar su cita, puede hacerlo en cualquier momento."
  }
}
```

---

# REGISTRAR PACIENTE NUEVO

Si necesitas registrar un paciente sin agendar cita inmediatamente:

```http
POST /api/v1/mcp/tools/registrar_paciente
Content-Type: application/json

{
  "documento": "9876543210",
  "tipo_documento": "CC",
  "nombre": "Ana",
  "apellido": "García López",
  "telefono": "3109876543",
  "email": "ana.garcia@email.com",
  "fecha_nacimiento": "1990-05-20",
  "genero": "Femenino",
  "direccion": "Calle 45 #12-34",
  "ciudad": "Bogotá",
  "eps": "Nueva EPS"
}
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "registrar_paciente",
  "result": {
    "registrado": true,
    "mensaje": "¡Paciente registrado exitosamente!",
    "paciente": {
      "id": "pac-uuid-22222",
      "nombre": "Ana García López",
      "documento": "CC 9876543210",
      "telefono": "3109876543"
    },
    "siguiente_paso": "Ahora puede agendar una cita usando la herramienta agendar_cita"
  }
}
```

---

# PRÓXIMAS CITAS DISPONIBLES (BÚSQUEDA RÁPIDA)

Si el paciente quiere ver las próximas citas disponibles de una especialidad:

```http
POST /api/v1/mcp/tools/proximas_citas_disponibles
Content-Type: application/json

{
  "especialidad": "Cardiología",
  "dias_busqueda": 14
}
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "proximas_citas_disponibles",
  "result": {
    "especialidad": "Cardiología",
    "costo": "$120,000 COP",
    "duracion": "45 minutos",
    "proximas_disponibilidades": [
      {
        "fecha": "martes, 14 de enero",
        "fecha_iso": "2025-01-14",
        "doctor": {
          "id": "doc-uuid-cardio-1",
          "nombre": "Dr. Roberto Sánchez"
        },
        "horarios_disponibles": ["09:00", "10:00", "15:00"],
        "total_slots": 5
      },
      {
        "fecha": "jueves, 16 de enero",
        "fecha_iso": "2025-01-16",
        "doctor": {
          "id": "doc-uuid-cardio-2",
          "nombre": "Dra. Laura Mendoza"
        },
        "horarios_disponibles": ["08:00", "11:00", "14:00"],
        "total_slots": 6
      }
    ],
    "como_agendar": "Use agendar_cita con el ID del doctor, la fecha y una de las horas disponibles"
  }
}
```

---

# CONFIRMAR ASISTENCIA

Para recordatorios de citas:

```http
POST /api/v1/mcp/tools/confirmar_asistencia
Content-Type: application/json

{
  "cita_id": "cita-uuid-99999"
}
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "confirmar_asistencia",
  "result": {
    "confirmada": true,
    "mensaje": "¡Gracias por confirmar su asistencia!",
    "cita": {
      "fecha": "miércoles, 15 de enero de 2025",
      "hora": "09:00",
      "doctor": "Dr. Juan Pérez García",
      "especialidad": "Medicina General"
    },
    "recordatorio": "Recuerde llegar 15 minutos antes. Traiga su documento de identidad."
  }
}
```

---

# INFORMACIÓN DE LA CLÍNICA

```http
GET /api/v1/mcp/info
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "nombre": "Clínica Mía",
    "descripcion": "Centro médico integral con atención especializada",
    "horarios": {
      "lunes_viernes": "6:00 AM - 8:00 PM",
      "sabados": "7:00 AM - 2:00 PM",
      "domingos": "Urgencias 24 horas"
    },
    "contacto": {
      "telefono": "324 333 8555",
      "email": "contacto@clinicamia.com",
      "direccion": "Calle Principal #123, Ciudad"
    },
    "servicios": [
      "Consulta Externa",
      "Urgencias 24h",
      "Hospitalización",
      "Laboratorio Clínico",
      "Imagenología",
      "Cirugía",
      "Farmacia"
    ]
  }
}
```

---

# EJECUTAR MÚLTIPLES HERRAMIENTAS (BATCH)

Para ejecutar varias operaciones en una sola llamada:

```http
POST /api/v1/mcp/batch
Content-Type: application/json

{
  "calls": [
    {
      "tool": "buscar_paciente",
      "arguments": { "documento": "1234567890" }
    },
    {
      "tool": "listar_especialidades",
      "arguments": {}
    }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "results": [
    {
      "tool": "buscar_paciente",
      "success": true,
      "result": { "encontrado": true, "paciente": {...} }
    },
    {
      "tool": "listar_especialidades",
      "success": true,
      "result": { "total": 5, "especialidades": [...] }
    }
  ]
}
```

---

# LISTA COMPLETA DE HERRAMIENTAS

| Herramienta | Descripción |
|-------------|-------------|
| **Pacientes** | |
| `buscar_paciente` | Busca paciente por documento |
| `registrar_paciente` | Registra nuevo paciente |
| `actualizar_contacto_paciente` | Actualiza teléfono/email/dirección |
| `historial_visitas_paciente` | Historial de consultas completadas |
| **Doctores** | |
| `buscar_doctores` | Busca doctores por especialidad o nombre |
| `informacion_doctor` | Info detallada de un doctor |
| `horarios_doctor` | Horarios de atención de un doctor |
| **Citas** | |
| `buscar_disponibilidad` | Slots disponibles de un doctor en una fecha |
| `agendar_cita` | Agenda nueva cita |
| `cancelar_cita` | Cancela cita existente |
| `reprogramar_cita` | Cambia fecha/hora de cita |
| `consultar_citas_paciente` | Lista citas de un paciente |
| `detalle_cita` | Detalle completo de una cita |
| `confirmar_asistencia` | Confirma asistencia a cita |
| **Catálogos** | |
| `listar_especialidades` | Lista especialidades médicas |
| `listar_departamentos` | Lista departamentos/áreas |
| `informacion_especialidad` | Info de una especialidad |
| `consultar_precios` | Consulta precios de servicios |
| `verificar_cobertura_eps` | Verifica si EPS cubre servicio |
| `proximas_citas_disponibles` | Próximas citas disponibles por especialidad |
| **HCE (Historia Clínica)** | |
| `resumen_hce` | Resumen de historia clínica |
| `solicitar_copia_hce` | Solicita copia de HCE |
| `consultar_resultados_laboratorio` | Resultados de laboratorio |
| `consultar_resultados_imagenologia` | Resultados de imágenes |
| `consultar_medicamentos_activos` | Medicamentos actuales |
| `consultar_alergias` | Alergias del paciente |
| `consultar_diagnosticos` | Diagnósticos registrados |
| `consultar_signos_vitales` | Últimos signos vitales |

---

# MANEJO DE ERRORES

Los errores devuelven `success: false`:

```json
{
  "success": false,
  "tool": "agendar_cita",
  "error": "Horario no disponible: El slot de las 09:00 ya está ocupado"
}
```

**Errores comunes:**
- `"Doctor no encontrado"` - ID de doctor inválido
- `"Especialidad no encontrada"` - ID de especialidad inválido
- `"Paciente no encontrado"` - Documento no registrado
- `"Cita no encontrada"` - ID de cita inválido
- `"Formato de fecha inválido. Use YYYY-MM-DD"` - Fecha mal formateada
- `"Formato de hora inválido. Use HH:MM"` - Hora mal formateada
- `"No se puede buscar disponibilidad en fechas pasadas"` - Fecha anterior a hoy
- `"No se puede cancelar una cita en estado X"` - Cita ya completada/cancelada
