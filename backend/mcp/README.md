# MCP Server - Clínica Mía

Herramientas MCP (Model Context Protocol) para integración con agentes de IA (n8n, WhatsApp bots, etc.).

## Integración con Backend Principal

Las herramientas MCP están **integradas directamente** en el backend principal.

**Base URL:** `http://tu-backend.com/api/v1/mcp`

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/mcp` | Info del servicio MCP |
| GET | `/api/v1/mcp/tools` | Lista todas las herramientas |
| GET | `/api/v1/mcp/tools/:name` | Info de una herramienta |
| POST | `/api/v1/mcp/tools/:name` | Ejecuta una herramienta |
| POST | `/api/v1/mcp/batch` | Ejecuta múltiples herramientas |
| GET | `/api/v1/mcp/info` | Info de la clínica |

### Autenticación (Opcional)

Si configuras `MCP_API_KEY` en el `.env`, los endpoints requieren:

```
Authorization: Bearer tu_api_key
```

## Uso con n8n

1. **HTTP Request Node** en n8n
2. URL: `https://tu-backend.com/api/v1/mcp/tools/buscar_paciente`
3. Method: POST
4. Body: `{ "documento": "123456789" }`

## Servidor Standalone (Opcional)

Para uso con Claude Desktop u otros clientes MCP via stdio:

```bash
node mcp/index.js
```

### Configuración Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):

```json
{
  "mcpServers": {
    "clinicamia": {
      "command": "node",
      "args": ["/ruta/completa/backend/mcp/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/clinica_mia"
      }
    }
  }
}
```

## Herramientas Disponibles

### Citas (7 herramientas)

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `buscar_disponibilidad` | Busca horarios disponibles para un doctor en una fecha | `doctor_id` (requerido), `fecha` (requerido, YYYY-MM-DD) |
| `agendar_cita` | Agenda una nueva cita médica | `paciente_documento`, `doctor_id`, `especialidad_id`, `fecha`, `hora`, `motivo` |
| `cancelar_cita` | Cancela una cita existente | `cita_id` (requerido), `motivo_cancelacion` (opcional) |
| `reprogramar_cita` | Cambia fecha/hora de una cita | `cita_id`, `nueva_fecha`, `nueva_hora`, `motivo` |
| `consultar_citas_paciente` | Lista citas de un paciente | `documento` (requerido), `estado` (opcional), `limite` |
| `detalle_cita` | Obtiene detalles completos de una cita | `cita_id` (requerido) |
| `confirmar_asistencia` | Confirma asistencia a una cita | `cita_id` (requerido) |

### Pacientes (4 herramientas)

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `buscar_paciente` | Busca paciente por documento | `documento` (requerido) |
| `registrar_paciente` | Registra nuevo paciente | `documento`, `nombre`, `apellido`, `telefono`, etc. |
| `actualizar_contacto_paciente` | Actualiza datos de contacto | `documento`, `telefono`, `email`, `direccion` |
| `historial_visitas_paciente` | Historial de visitas médicas | `documento` (requerido), `limite` |

### Doctores (3 herramientas)

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `buscar_doctores` | Busca doctores por especialidad/nombre | `especialidad`, `nombre`, `limite` |
| `informacion_doctor` | Info detallada de un doctor | `doctor_id` (requerido) |
| `horarios_doctor` | Horarios de atención | `doctor_id` (requerido), `dias` |

### Historia Clínica - HCE (8 herramientas)

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `resumen_hce` | Resumen de historia clínica | `documento` (requerido) |
| `solicitar_copia_hce` | Solicita copia de HCE | `documento`, `motivo` (requeridos) |
| `consultar_resultados_laboratorio` | Resultados de laboratorio | `documento`, `limite` |
| `consultar_resultados_imagenologia` | Resultados de imagenología | `documento`, `limite` |
| `consultar_medicamentos_activos` | Medicamentos actuales | `documento` (requerido) |
| `consultar_alergias` | Alergias registradas | `documento` (requerido) |
| `consultar_diagnosticos` | Diagnósticos del paciente | `documento`, `limite` |
| `consultar_signos_vitales` | Últimos signos vitales | `documento`, `limite` |

### Catálogos (6 herramientas)

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `listar_especialidades` | Lista especialidades médicas | `departamento` (opcional) |
| `listar_departamentos` | Lista departamentos/áreas | ninguno |
| `informacion_especialidad` | Info de una especialidad | `especialidad_id` o `nombre_especialidad` |
| `consultar_precios` | Consulta precios de servicios | `busqueda` (opcional) |
| `verificar_cobertura_eps` | Verifica cobertura EPS | `eps`, `servicio` (requeridos) |
| `proximas_citas_disponibles` | Próximas citas disponibles | `especialidad` (requerido), `dias_busqueda` |

## Recursos

El servidor expone los siguientes recursos:

- `clinica://info` - Información general de la clínica
- `clinica://horarios` - Horarios de atención
- `clinica://contacto` - Información de contacto

## Ejemplos de Flujos

### Agendar Cita Nueva

```
1. buscar_paciente(documento: "123456789")
   → Si no existe: registrar_paciente(...)

2. listar_especialidades()
   → Usuario elige especialidad

3. buscar_doctores(especialidad: "Cardiología")
   → Usuario elige doctor

4. buscar_disponibilidad(doctor_id: "xxx", fecha: "2024-12-20")
   → Usuario elige horario

5. agendar_cita(
     paciente_documento: "123456789",
     doctor_id: "xxx",
     especialidad_id: "yyy",
     fecha: "2024-12-20",
     hora: "09:00"
   )
```

### Consultar Historial Médico

```
1. buscar_paciente(documento: "123456789")
   → Verificar que existe

2. resumen_hce(documento: "123456789")
   → Muestra resumen general

3. Si necesita detalles específicos:
   - consultar_diagnosticos(documento: "123456789")
   - consultar_medicamentos_activos(documento: "123456789")
   - consultar_resultados_laboratorio(documento: "123456789")
```

### Cancelar/Reprogramar Cita

```
1. consultar_citas_paciente(documento: "123456789", estado: "Programada")
   → Lista citas activas

2. Para cancelar:
   cancelar_cita(cita_id: "xxx", motivo_cancelacion: "Viaje")

3. Para reprogramar:
   buscar_disponibilidad(doctor_id: "yyy", fecha: "2024-12-25")
   reprogramar_cita(cita_id: "xxx", nueva_fecha: "2024-12-25", nueva_hora: "10:00")
```

## Integración con WhatsApp

Para integrar con un bot de WhatsApp, el bot debe:

1. Conectarse al servidor MCP via stdio
2. Listar herramientas disponibles con `tools/list`
3. Invocar herramientas con `tools/call`

### Ejemplo de invocación

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "buscar_paciente",
    "arguments": {
      "documento": "123456789"
    }
  }
}
```

### Respuesta

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"encontrado\": true, \"paciente\": {...}}"
      }
    ]
  }
}
```

## Notas de Seguridad

- El servidor accede directamente a la base de datos
- No incluye autenticación propia - confía en el cliente MCP
- Para producción, considerar ejecutar en ambiente aislado
- Los datos de HCE son sensibles - asegurar cumplimiento con normativas

## Estructura de Archivos

```
backend/mcp/
├── index.js          # Servidor principal
├── README.md         # Esta documentación
└── tools/
    ├── appointments.js   # Herramientas de citas
    ├── patients.js       # Herramientas de pacientes
    ├── doctors.js        # Herramientas de doctores
    ├── hce.js            # Herramientas de HCE
    └── catalogs.js       # Herramientas de catálogos
```

## Variables de Entorno

Agregar al `.env` del backend:

```env
# Opcional - Si se configura, los endpoints MCP requieren este token
MCP_API_KEY=tu_api_key_secreta
```

---

## Integración con n8n

### Configuración Básica

1. En n8n, agregar nodo **HTTP Request**
2. Configurar:
   - **Method:** POST
   - **URL:** `https://tu-backend.com/api/v1/mcp/tools/nombre_herramienta`
   - **Authentication:** Bearer Token (si usas MCP_API_KEY)
   - **Body Content Type:** JSON

### Ejemplo: Agendar Cita

```json
// POST https://tu-backend.com/api/v1/mcp/tools/agendar_cita
{
  "paciente_documento": "123456789",
  "doctor_id": "uuid-del-doctor",
  "especialidad_id": "uuid-especialidad",
  "fecha": "2024-12-25",
  "hora": "09:00",
  "motivo": "Consulta general"
}
```

### Ejemplo: Buscar Paciente

```json
// POST https://tu-backend.com/api/v1/mcp/tools/buscar_paciente
{
  "documento": "123456789"
}
```

### Ejemplo: Workflow Completo n8n

```
[Webhook Trigger]
       ↓
[HTTP Request: buscar_paciente]
       ↓
[IF: paciente encontrado?]
   ├─ Sí → [HTTP Request: consultar_citas_paciente]
   └─ No → [HTTP Request: registrar_paciente]
       ↓
[Responder al usuario]
```

### Nodo n8n - Configuración Detallada

**Para listar herramientas disponibles:**
```
Method: GET
URL: https://tu-backend.com/api/v1/mcp/tools
Headers:
  Authorization: Bearer tu_api_key
```

**Para ejecutar herramienta:**
```
Method: POST
URL: https://tu-backend.com/api/v1/mcp/tools/{{ $json.tool_name }}
Headers:
  Authorization: Bearer tu_api_key
  Content-Type: application/json
Body:
  {{ $json.parameters }}
```

### Batch de Herramientas

Para ejecutar múltiples herramientas en una sola llamada:

```json
// POST https://tu-backend.com/api/v1/mcp/batch
{
  "calls": [
    {
      "tool": "buscar_paciente",
      "arguments": { "documento": "123456789" }
    },
    {
      "tool": "listar_especialidades",
      "arguments": {}
    }
  ]
}
```

---

## Troubleshooting

### Error de conexión a base de datos

Verificar que `DATABASE_URL` esté configurada correctamente y que PostgreSQL esté corriendo.

### Herramienta no encontrada

Verificar que el nombre de la herramienta esté escrito exactamente como aparece en la lista.

### Respuestas vacías

Algunos datos pueden no existir en la base de datos. Ejecutar seeders si es necesario:

```bash
cd backend
npm run seed
```
