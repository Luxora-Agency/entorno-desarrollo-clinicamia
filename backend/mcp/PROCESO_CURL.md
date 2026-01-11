# Proceso de Pruebas MCP con CURL

Este documento muestra el flujo completo de pruebas del MCP de Clínica Mía usando curl.

**Fecha de ejecución:** 19 de Diciembre de 2025
**Base URL:** `http://localhost:4000`

---

## Paso 1: Verificar que el MCP está activo

```bash
curl -s http://localhost:4000/api/v1/mcp
```

**Respuesta:**
```json
{
  "success": true,
  "service": "clinicamia-mcp",
  "version": "1.0.0",
  "tools_count": 28,
  "endpoints": {
    "list_tools": "GET /api/v1/mcp/tools",
    "tool_info": "GET /api/v1/mcp/tools/:name",
    "execute_tool": "POST /api/v1/mcp/tools/:name",
    "batch_execute": "POST /api/v1/mcp/batch",
    "clinic_info": "GET /api/v1/mcp/info"
  }
}
```

---

## Paso 2: Listar Especialidades Disponibles

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/tools/listar_especialidades \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "listar_especialidades",
  "result": {
    "total": 3,
    "especialidades": [
      {
        "id": "c4317f89-6a2d-42b0-9252-3d41513d11a6",
        "nombre": "Ginecología",
        "departamento": "Ginecología",
        "descripcion": "Consulta ginecológica",
        "costo": "$70.000 COP",
        "duracion": "45 minutos",
        "doctores_disponibles": 0
      },
      {
        "id": "56ca07d9-9ab7-4efa-b38b-f5179d7a2dba",
        "nombre": "Medicina General",
        "departamento": "Medicina General",
        "descripcion": "Consulta médica general",
        "costo": "$50.000 COP",
        "duracion": "30 minutos",
        "doctores_disponibles": 1
      },
      {
        "id": "9a9d9083-4d60-4acb-9e01-5c847976f332",
        "nombre": "Pediatría General",
        "departamento": "Pediatría",
        "descripcion": "Consulta pediátrica",
        "costo": "$60.000 COP",
        "duracion": "40 minutos",
        "doctores_disponibles": 1
      }
    ],
    "nota": "Use buscar_doctores con el nombre de especialidad para ver los doctores disponibles"
  }
}
```

**IDs importantes obtenidos:**
- Medicina General: `56ca07d9-9ab7-4efa-b38b-f5179d7a2dba`

---

## Paso 3: Buscar Doctores de Medicina General

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/tools/buscar_doctores \
  -H "Content-Type: application/json" \
  -d '{"especialidad": "Medicina General"}'
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "buscar_doctores",
  "result": {
    "encontrados": 1,
    "doctores": [
      {
        "id": "f5ef8ea4-625a-4966-9f08-b244a6ca011a",
        "nombre": "Dr. Carlos Rodríguez",
        "especialidades": [
          {
            "id": "56ca07d9-9ab7-4efa-b38b-f5179d7a2dba",
            "nombre": "Medicina General",
            "costo": "$50.000 COP"
          }
        ],
        "experiencia": "10 años"
      }
    ],
    "nota": "Use buscar_disponibilidad con el ID del doctor para ver horarios disponibles"
  }
}
```

**IDs importantes obtenidos:**
- Doctor Carlos Rodríguez: `f5ef8ea4-625a-4966-9f08-b244a6ca011a`

---

## Paso 4: Buscar Disponibilidad del Doctor

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/tools/buscar_disponibilidad \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "f5ef8ea4-625a-4966-9f08-b244a6ca011a",
    "fecha": "2025-12-22"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "buscar_disponibilidad",
  "result": {
    "doctor": "Dr. Carlos Rodríguez",
    "especialidades": ["Medicina General"],
    "fecha": "2025-12-22",
    "total_slots": 16,
    "slots_disponibles": 16,
    "horarios": [
      { "hora": "08:00", "hora_fin": "08:30" },
      { "hora": "08:30", "hora_fin": "09:00" },
      { "hora": "09:00", "hora_fin": "09:30" },
      { "hora": "09:30", "hora_fin": "10:00" },
      { "hora": "10:00", "hora_fin": "10:30" },
      { "hora": "10:30", "hora_fin": "11:00" },
      { "hora": "11:00", "hora_fin": "11:30" },
      { "hora": "11:30", "hora_fin": "12:00" },
      { "hora": "14:00", "hora_fin": "14:30" },
      { "hora": "14:30", "hora_fin": "15:00" },
      { "hora": "15:00", "hora_fin": "15:30" },
      { "hora": "15:30", "hora_fin": "16:00" },
      { "hora": "16:00", "hora_fin": "16:30" },
      { "hora": "16:30", "hora_fin": "17:00" },
      { "hora": "17:00", "hora_fin": "17:30" },
      { "hora": "17:30", "hora_fin": "18:00" }
    ],
    "mensaje": "Hay 16 horarios disponibles para el 2025-12-22"
  }
}
```

---

## Paso 5: Buscar Paciente por Documento

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/tools/buscar_paciente \
  -H "Content-Type: application/json" \
  -d '{"documento": "1098765432"}'
```

**Respuesta (paciente NO existe):**
```json
{
  "success": true,
  "tool": "buscar_paciente",
  "result": {
    "encontrado": false,
    "mensaje": "No se encontró ningún paciente con documento 1098765432",
    "sugerencia": "Puede registrar al paciente usando la herramienta registrar_paciente"
  }
}
```

**Respuesta (paciente SÍ existe):**
```json
{
  "success": true,
  "tool": "buscar_paciente",
  "result": {
    "encontrado": true,
    "paciente": {
      "id": "9dc9789a-ed0e-4d12-bad7-b471758fe38a",
      "nombre": "Maria García López",
      "documento": "Cédula de Ciudadanía 1098765432",
      "telefono": "3101234567",
      "email": "maria.garcia@email.com",
      "fecha_nacimiento": "14/3/1985",
      "genero": "Masculino",
      "direccion": "Calle 63 #10-20",
      "ciudad": "No registrada",
      "eps": "Compensar EPS",
      "estadisticas": {
        "total_citas": 3,
        "admisiones": 0
      },
      "registrado_desde": "17/12/2025"
    }
  }
}
```

---

## Paso 6: Agendar Cita (Crea Paciente Automáticamente)

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/tools/agendar_cita \
  -H "Content-Type: application/json" \
  -d '{
    "documento": "1098765432",
    "tipo_documento": "CC",
    "nombre": "Maria",
    "apellido": "García López",
    "telefono": "3101234567",
    "email": "maria.garcia@email.com",
    "doctor_id": "f5ef8ea4-625a-4966-9f08-b244a6ca011a",
    "especialidad_id": "56ca07d9-9ab7-4efa-b38b-f5179d7a2dba",
    "fecha": "2025-12-22",
    "hora": "09:00",
    "motivo": "Control médico general"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "agendar_cita",
  "result": {
    "exito": true,
    "mensaje": "¡Cita agendada exitosamente!",
    "cita": {
      "id": "66c316d5-d8f2-4764-8f44-b599a66e4b08",
      "fecha": "2025-12-22",
      "hora": "09:00",
      "duracion": "30 minutos",
      "doctor": "Dr. Carlos Rodríguez",
      "especialidad": "Medicina General",
      "paciente": "Maria García López",
      "costo": "$50.000 COP",
      "estado": "Programada"
    },
    "recordatorio": "Recuerde llegar 15 minutos antes de su cita. Traiga su documento de identidad y carné de EPS si aplica."
  }
}
```

**ID de cita obtenido:** `66c316d5-d8f2-4764-8f44-b599a66e4b08`

---

## Paso 7: Consultar Citas del Paciente

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/tools/consultar_citas_paciente \
  -H "Content-Type: application/json" \
  -d '{"documento": "1098765432"}'
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "consultar_citas_paciente",
  "result": {
    "encontrado": true,
    "paciente": "Maria García López",
    "total_citas": 1,
    "citas": [
      {
        "id": "66c316d5-d8f2-4764-8f44-b599a66e4b08",
        "fecha": "lunes, 22 de diciembre de 2025",
        "hora": "09:00 a. m.",
        "doctor": "Dr. Carlos Rodríguez",
        "especialidad": "Medicina General",
        "estado": "Programada",
        "costo": "$50.000 COP"
      }
    ]
  }
}
```

---

## Paso 8: Ver Detalle de una Cita

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/tools/detalle_cita \
  -H "Content-Type: application/json" \
  -d '{"cita_id": "66c316d5-d8f2-4764-8f44-b599a66e4b08"}'
```

**Respuesta:**
```json
{
  "success": true,
  "tool": "detalle_cita",
  "result": {
    "id": "66c316d5-d8f2-4764-8f44-b599a66e4b08",
    "estado": "Programada",
    "tipo": "Especialidad",
    "fecha": "lunes, 22 de diciembre de 2025",
    "hora": "09:00 a. m.",
    "duracion": "30 minutos",
    "paciente": {
      "nombre": "Maria García López",
      "documento": "1098765432",
      "telefono": "3101234567",
      "email": "maria.garcia@email.com"
    },
    "doctor": {
      "nombre": "Dr. Carlos Rodríguez",
      "telefono": "3001234567"
    },
    "especialidad": {
      "nombre": "Medicina General",
      "descripcion": "Consulta médica general"
    },
    "costo": "$50.000 COP",
    "motivo": "Control médico general",
    "notas": null,
    "creada": "19/12/2025, 9:46:22 a. m."
  }
}
```

---

## Paso 9: Reprogramar la Cita

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/tools/reprogramar_cita \
  -H "Content-Type: application/json" \
  -d '{
    "cita_id": "66c316d5-d8f2-4764-8f44-b599a66e4b08",
    "nueva_fecha": "2025-12-23",
    "nueva_hora": "10:30",
    "motivo": "Cambio por compromiso laboral"
  }'
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
        "fecha": "22/12/2025",
        "hora": "09:00 a. m."
      },
      "nueva": {
        "fecha": "2025-12-23",
        "hora": "10:30"
      }
    },
    "cita": {
      "id": "66c316d5-d8f2-4764-8f44-b599a66e4b08",
      "doctor": "Dr. Carlos Rodríguez",
      "especialidad": "Medicina General",
      "paciente": "Maria García López"
    },
    "recordatorio": "Recuerde llegar 15 minutos antes de su nueva cita."
  }
}
```

---

## Paso 10: Confirmar Asistencia

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/tools/confirmar_asistencia \
  -H "Content-Type: application/json" \
  -d '{"cita_id": "66c316d5-d8f2-4764-8f44-b599a66e4b08"}'
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
      "fecha": "martes, 23 de diciembre de 2025",
      "hora": "10:30 a. m.",
      "doctor": "Dr. Carlos Rodríguez",
      "especialidad": "Medicina General"
    },
    "recordatorio": "Recuerde llegar 15 minutos antes. Traiga su documento de identidad."
  }
}
```

---

## Paso 11: Cancelar la Cita

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/tools/cancelar_cita \
  -H "Content-Type: application/json" \
  -d '{
    "cita_id": "66c316d5-d8f2-4764-8f44-b599a66e4b08",
    "motivo": "Ya no puedo asistir por viaje de emergencia"
  }'
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
      "id": "66c316d5-d8f2-4764-8f44-b599a66e4b08",
      "fecha": "martes, 23 de diciembre de 2025",
      "hora": "10:30 a. m.",
      "doctor": "Dr. Carlos Rodríguez",
      "especialidad": "Medicina General",
      "paciente": "Maria García López",
      "motivo_cancelacion": "Ya no puedo asistir por viaje de emergencia"
    },
    "nota": "Si desea reagendar su cita, puede hacerlo en cualquier momento."
  }
}
```

---

## BONUS: Ejecutar Múltiples Herramientas (Batch)

```bash
curl -s -X POST http://localhost:4000/api/v1/mcp/batch \
  -H "Content-Type: application/json" \
  -d '{
    "calls": [
      {"tool": "listar_departamentos", "arguments": {}},
      {"tool": "buscar_paciente", "arguments": {"documento": "1098765432"}}
    ]
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "results": [
    {
      "tool": "listar_departamentos",
      "success": true,
      "result": {
        "total": 4,
        "departamentos": [
          {
            "id": "b9aa42b3-3ce9-4f72-be95-c9120f2776ca",
            "nombre": "Ginecología",
            "descripcion": "Salud de la mujer y obstetricia",
            "especialidades": 1
          },
          {
            "id": "b8548a8d-af73-49ad-a3e4-ab94f85479a1",
            "nombre": "Medicina General",
            "descripcion": "Atención médica general y consultas básicas",
            "especialidades": 1
          },
          {
            "id": "1499256c-507d-4bd2-a234-0723b0022b1b",
            "nombre": "Pediatría",
            "descripcion": "Atención médica para niños y adolescentes",
            "especialidades": 1
          },
          {
            "id": "40b91dc3-93d6-4528-a33b-4cd273fe0fa7",
            "nombre": "Urgencias",
            "descripcion": "Atención de emergencias médicas",
            "especialidades": 0
          }
        ]
      }
    },
    {
      "tool": "buscar_paciente",
      "success": true,
      "result": {
        "encontrado": true,
        "paciente": {
          "nombre": "Maria García López",
          "documento": "1098765432",
          "telefono": "3101234567"
        }
      }
    }
  ]
}
```

---

## Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/mcp` | Info del servicio MCP |
| GET | `/api/v1/mcp/tools` | Lista todas las herramientas |
| GET | `/api/v1/mcp/tools/:name` | Info de una herramienta |
| POST | `/api/v1/mcp/tools/:name` | Ejecuta una herramienta |
| POST | `/api/v1/mcp/batch` | Ejecuta múltiples herramientas |
| GET | `/api/v1/mcp/info` | Información de la clínica |

---

## IDs de Referencia Usados en las Pruebas

| Recurso | ID |
|---------|-----|
| Especialidad (Medicina General) | `56ca07d9-9ab7-4efa-b38b-f5179d7a2dba` |
| Doctor (Carlos Rodríguez) | `f5ef8ea4-625a-4966-9f08-b244a6ca011a` |
| Cita creada | `66c316d5-d8f2-4764-8f44-b599a66e4b08` |
| Paciente | `9dc9789a-ed0e-4d12-bad7-b471758fe38a` |

---

## Flujo Resumido para Agendar una Cita

```
1. listar_especialidades      → Obtener ID de especialidad
2. buscar_doctores            → Obtener ID de doctor
3. buscar_disponibilidad      → Ver horarios disponibles
4. buscar_paciente            → Verificar si existe (opcional)
5. agendar_cita               → Crear la cita (crea paciente si no existe)
```

## Flujo para Gestionar Citas Existentes

```
1. consultar_citas_paciente   → Ver citas del paciente
2. detalle_cita               → Ver detalles de una cita
3. reprogramar_cita           → Cambiar fecha/hora
4. confirmar_asistencia       → Confirmar que asistirá
5. cancelar_cita              → Cancelar si es necesario
```
