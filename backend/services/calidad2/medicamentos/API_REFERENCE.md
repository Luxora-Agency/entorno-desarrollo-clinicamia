# API Reference - Módulo Medicamentos

**Guía completa de endpoints para el módulo de Medicamentos, Dispositivos e Insumos.**

---

## Índice

- [Autenticación](#autenticación)
- [Respuestas Estándar](#respuestas-estándar)
- [Dashboard](#dashboard)
- [Inventario](#inventario)
- [Farmacovigilancia](#farmacovigilancia)
- [Tecnovigilancia](#tecnovigilancia)
- [Temperatura y Humedad](#temperatura-y-humedad)
- [Formatos](#formatos)
- [Alertas](#alertas)
- [Códigos de Error](#códigos-de-error)

---

## Autenticación

Todos los endpoints requieren autenticación y el permiso `calidad2`.

### Headers Requeridos

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Permisos

- **Middleware:** `permissionMiddleware('calidad2')`
- **Validación:** Usuario debe tener rol con acceso a Calidad 2.0

---

## Respuestas Estándar

### Éxito

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

### Paginación

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Descripción del error"
}
```

---

## Dashboard

### GET /calidad2/medicamentos/dashboard/resumen-general

Obtiene resumen consolidado de todo el módulo.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "inventario": {
      "totales": {
        "total": 250,
        "medicamentos": 150,
        "dispositivos": 70,
        "insumos": 30
      },
      "alertas": {
        "proximosVencer30": 15,
        "proximosVencer60": 25,
        "vencidos": 3,
        "stockBajo": 8
      },
      "distribucion": { ... },
      "top": {
        "proximosVencer": [...],
        "itemsStockBajo": [...]
      }
    },
    "farmacovigilancia": { ... },
    "tecnovigilancia": { ... },
    "alertas": { ... },
    "temperatura": { ... },
    "formatos": { ... },
    "protocolos": { ... }
  }
}
```

### GET /calidad2/medicamentos/dashboard/inventario

Estadísticas detalladas de inventario.

### GET /calidad2/medicamentos/dashboard/farmacovigilancia

Estadísticas de farmacovigilancia.

### GET /calidad2/medicamentos/dashboard/tecnovigilancia

Estadísticas de tecnovigilancia.

### GET /calidad2/medicamentos/dashboard/alertas

Estadísticas de alertas.

### GET /calidad2/medicamentos/dashboard/temperatura

Estadísticas de temperatura/humedad.

### GET /calidad2/medicamentos/dashboard/reportes-mensuales/:anio

Tendencias mensuales de reportes.

**Parámetros:**
- `anio` (path) - Año (ej: 2026)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "anio": 2026,
    "farmacovigilancia": [
      { "mes": 1, "count": 5 },
      { "mes": 2, "count": 8 },
      ...
    ],
    "tecnovigilancia": [...]
  }
}
```

### GET /calidad2/medicamentos/dashboard/graficas-temperatura/:area

Datos para gráfica de temperatura.

**Parámetros:**
- `area` (path) - Área a consultar
- `periodo` (query) - `semana` | `mes` | `trimestre` (default: `mes`)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "area": "FARMACIA",
    "periodo": "mes",
    "fechaInicio": "2026-01-05T00:00:00.000Z",
    "fechaFin": "2026-02-05T00:00:00.000Z",
    "registros": [
      {
        "fecha": "2026-01-06T08:00:00.000Z",
        "temperatura": 22.5,
        "humedad": 45.0,
        "temperaturaMin": 15,
        "temperaturaMax": 25,
        "humedadMin": 30,
        "humedadMax": 60,
        "temperaturaEnRango": true,
        "humedadEnRango": true
      },
      ...
    ]
  }
}
```

---

## Inventario

### GET /calidad2/medicamentos/inventario

Lista todos los items de inventario.

**Query Parameters:**
- `tipo` - Filtrar por tipo (`MEDICAMENTO` | `DISPOSITIVO_MEDICO` | `INSUMO_MEDICO_QUIRURGICO`)
- `search` - Búsqueda por código o nombre
- `tieneAlertaVencimiento` - `true` | `false`
- `tieneAlertaStock` - `true` | `false`
- `page` - Número de página (default: 1)
- `limit` - Items por página (default: 50)

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "codigo": "MED-001",
      "nombre": "Acetaminofén 500mg",
      "tipo": "MEDICAMENTO",
      "lote": "L123456",
      "fechaVencimiento": "2027-12-31T00:00:00.000Z",
      "cantidadActual": 500,
      "unidadMedida": "Tabletas",
      "stockMinimo": 100,
      "stockMaximo": 1000,
      "ubicacionFisica": "Farmacia - Estante A3",
      "laboratorio": "Laboratorios XYZ",
      "registroSanitario": "INVIMA-2023-123456",
      "tieneAlertaVencimiento": false,
      "diasParaVencer": 720,
      "tieneAlertaStock": false,
      "activo": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "registrador": {
        "id": "uuid",
        "nombre": "Usuario Admin"
      }
    },
    ...
  ],
  "pagination": { ... }
}
```

### POST /calidad2/medicamentos/inventario

Crea un nuevo item de inventario.

**Request Body:**
```json
{
  "tipo": "MEDICAMENTO",
  "codigo": "MED-001",
  "nombre": "Acetaminofén 500mg",
  "descripcion": "Analgésico antipirético",
  "principioActivo": "Acetaminofén",
  "concentracion": "500mg",
  "formaFarmaceutica": "Tableta",
  "via": "Oral",
  "registroSanitario": "INVIMA-2023-123456",
  "laboratorio": "Laboratorios XYZ",
  "lote": "L123456",
  "fechaVencimiento": "2027-12-31",
  "cantidadActual": 500,
  "unidadMedida": "Tabletas",
  "stockMinimo": 100,
  "stockMaximo": 1000,
  "ubicacionFisica": "Farmacia - Estante A3"
}
```

**Validación (Zod):**
- `codigo` - Required, string, unique
- `nombre` - Required, string
- `tipo` - Required, enum
- `lote` - Required, string
- `fechaVencimiento` - Required, date (transforma string a Date)
- `cantidadActual` - Required, number > 0
- `unidadMedida` - Required, string

**Respuesta:**
```json
{
  "success": true,
  "message": "Item de inventario creado exitosamente",
  "data": { ... }
}
```

### GET /calidad2/medicamentos/inventario/:id

Obtiene un item específico.

### PUT /calidad2/medicamentos/inventario/:id

Actualiza un item existente.

**Request Body:** Igual que POST, todos los campos opcionales

### DELETE /calidad2/medicamentos/inventario/:id

Soft delete (marca `activo: false`).

### GET /calidad2/medicamentos/inventario/medicamentos

Lista solo medicamentos (equivalente a `?tipo=MEDICAMENTO`).

### GET /calidad2/medicamentos/inventario/dispositivos

Lista solo dispositivos médicos.

### GET /calidad2/medicamentos/inventario/insumos

Lista solo insumos.

### GET /calidad2/medicamentos/inventario/proximos-vencer

Items próximos a vencer.

**Query Parameters:**
- `dias` - Días de anticipación (default: 30)

**Ejemplo:** `/inventario/proximos-vencer?dias=60`

### GET /calidad2/medicamentos/inventario/vencidos

Items ya vencidos.

### GET /calidad2/medicamentos/inventario/stock-bajo

Items con stock por debajo del mínimo.

### GET /calidad2/medicamentos/inventario/estadisticas

Estadísticas generales del inventario.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totales": {
      "total": 250,
      "medicamentos": 150,
      "dispositivos": 70,
      "insumos": 30
    },
    "alertas": {
      "proximosVencer30": 15,
      "vencidos": 3,
      "stockBajo": 8
    },
    "porTipo": {
      "MEDICAMENTO": 150,
      "DISPOSITIVO_MEDICO": 70,
      "INSUMO_MEDICO_QUIRURGICO": 30
    }
  }
}
```

---

## Farmacovigilancia

### GET /calidad2/medicamentos/farmacovigilancia

Lista reportes de farmacovigilancia.

**Query Parameters:**
- `estado` - Filtrar por estado
- `gravedadReaccion` - Filtrar por gravedad
- `reportadoINVIMA` - `true` | `false`
- `page`, `limit`

### POST /calidad2/medicamentos/farmacovigilancia

Crea un nuevo reporte.

**Request Body:**
```json
{
  "pacienteId": "uuid",
  "tipoReporte": "RAM",
  "medicamento": "Acetaminofén 500mg",
  "lote": "L123456",
  "fechaVencimiento": "2027-12-31",
  "laboratorio": "Laboratorios XYZ",
  "fechaEvento": "2026-01-05",
  "descripcionReaccion": "Erupciones cutáneas leves en brazos",
  "gravedadReaccion": "Leve",
  "causalidad": "PROBABLE",
  "indicacion": "Cefalea",
  "desenlace": "Recuperado sin secuelas",
  "accionesTomadas": "Suspensión del medicamento, tratamiento sintomático"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Reporte de farmacovigilancia creado exitosamente",
  "data": { ... }
}
```

### GET /calidad2/medicamentos/farmacovigilancia/:id

Obtiene un reporte específico.

### PUT /calidad2/medicamentos/farmacovigilancia/:id

Actualiza un reporte.

### DELETE /calidad2/medicamentos/farmacovigilancia/:id

Elimina un reporte (soft delete).

### POST /calidad2/medicamentos/farmacovigilancia/:id/reportar-invima

Marca el reporte como reportado a INVIMA.

**Request Body:**
```json
{
  "numeroReporteINVIMA": "INVIMA-RAM-2026-001234"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Reporte marcado como reportado a INVIMA",
  "data": {
    "id": "uuid",
    "reportadoINVIMA": true,
    "numeroReporteINVIMA": "INVIMA-RAM-2026-001234",
    "fechaReporteINVIMA": "2026-01-05T10:30:00.000Z"
  }
}
```

### POST /calidad2/medicamentos/farmacovigilancia/:id/documentos

Sube un documento adjunto al reporte.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` - Archivo
- `nombre` - Nombre descriptivo

### DELETE /calidad2/medicamentos/farmacovigilancia/documentos/:documentoId

Elimina un documento adjunto.

### GET /calidad2/medicamentos/farmacovigilancia/estadisticas

Estadísticas de farmacovigilancia.

---

## Tecnovigilancia

Los endpoints son similares a Farmacovigilancia.

### GET /calidad2/medicamentos/tecnovigilancia
### POST /calidad2/medicamentos/tecnovigilancia
### GET /calidad2/medicamentos/tecnovigilancia/:id
### PUT /calidad2/medicamentos/tecnovigilancia/:id
### DELETE /calidad2/medicamentos/tecnovigilancia/:id
### POST /calidad2/medicamentos/tecnovigilancia/:id/reportar-invima

### POST /calidad2/medicamentos/tecnovigilancia

**Request Body:**
```json
{
  "pacienteId": "uuid",
  "dispositivoMedico": "Monitor de signos vitales",
  "fabricante": "Medtronic",
  "modelo": "MSV-2000",
  "numeroSerie": "SN123456",
  "lote": "L789",
  "registroSanitario": "INVIMA-DM-2024-456",
  "fechaEvento": "2026-01-05",
  "descripcionEvento": "Falla en la lectura de presión arterial",
  "clasificacion": "INCIDENTE",
  "tipoEvento": "FALLA_DISPOSITIVO",
  "gravedadEvento": "LEVE",
  "desenlace": "Dispositivo reemplazado, paciente sin consecuencias",
  "accionesTomadas": "Retiro del dispositivo, reemplazo inmediato"
}
```

### GET /calidad2/medicamentos/tecnovigilancia/consolidado/:trimestre/:anio

Consolidado trimestral para reporte INVIMA.

**Parámetros:**
- `trimestre` - 1, 2, 3, 4
- `anio` - Año (ej: 2026)

**Ejemplo:** `/tecnovigilancia/consolidado/2/2026`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "trimestre": 2,
    "anio": 2026,
    "fechaInicio": "2026-04-01T00:00:00.000Z",
    "fechaFin": "2026-06-30T23:59:59.999Z",
    "total": 12,
    "reportes": [...],
    "resumen": {
      "porTipo": {
        "FALLA_DISPOSITIVO": 5,
        "USO_INADECUADO": 3,
        "LESION": 2,
        "MUERTE": 0
      },
      "porGravedad": {
        "LEVE": 7,
        "MODERADA": 3,
        "GRAVE": 2,
        "MORTAL": 0
      },
      "porClasificacion": {
        "INCIDENTE": 6,
        "EVENTO_ADVERSO_NO_SERIO": 4,
        "EVENTO_ADVERSO_SERIO": 2,
        "CASI_EVENTO": 0
      }
    }
  }
}
```

### GET /calidad2/medicamentos/tecnovigilancia/estadisticas

Estadísticas de tecnovigilancia.

---

## Temperatura y Humedad

### GET /calidad2/medicamentos/temperatura-humedad

Lista registros de temperatura y humedad.

**Query Parameters:**
- `area` - Filtrar por área
- `requiereAlerta` - `true` | `false`
- `fechaInicio` - Fecha inicio (ISO 8601)
- `fechaFin` - Fecha fin
- `page`, `limit`

### POST /calidad2/medicamentos/temperatura-humedad

Crea un nuevo registro.

**Request Body:**
```json
{
  "fecha": "2026-01-05T08:00:00.000Z",
  "hora": 8,
  "area": "FARMACIA",
  "temperatura": 22.5,
  "humedad": 45.0,
  "temperaturaMin": 15,
  "temperaturaMax": 25,
  "humedadMin": 30,
  "humedadMax": 60,
  "accionCorrectiva": "" // Solo si fuera de rango
}
```

**Validación automática:**
```javascript
temperaturaEnRango = temperatura >= temperaturaMin && temperatura <= temperaturaMax
humedadEnRango = humedad >= humedadMin && humedad <= humedadMax
requiereAlerta = !temperaturaEnRango || !humedadEnRango
```

**Si `requiereAlerta = true`**, se crea automáticamente una alerta del tipo `TEMPERATURA_FUERA_RANGO` o `HUMEDAD_FUERA_RANGO`.

**Respuesta:**
```json
{
  "success": true,
  "message": "Registro de temperatura y humedad creado exitosamente",
  "data": {
    "id": "uuid",
    "fecha": "2026-01-05T08:00:00.000Z",
    "area": "FARMACIA",
    "temperatura": 22.5,
    "humedad": 45.0,
    "temperaturaEnRango": true,
    "humedadEnRango": true,
    "requiereAlerta": false,
    ...
  }
}
```

### GET /calidad2/medicamentos/temperatura-humedad/:id

Obtiene un registro específico.

### PUT /calidad2/medicamentos/temperatura-humedad/:id

Actualiza un registro.

### DELETE /calidad2/medicamentos/temperatura-humedad/:id

Elimina un registro.

### GET /calidad2/medicamentos/temperatura-humedad/area/:area

Registros de un área específica.

**Query Parameters:**
- `fechaInicio`, `fechaFin`

### GET /calidad2/medicamentos/temperatura-humedad/alertas

Registros que requieren alerta.

**Query Parameters:**
- `area` - Opcional

### GET /calidad2/medicamentos/temperatura-humedad/tendencias/:area

Datos para gráfica de tendencias.

**Query Parameters:**
- `periodo` - `semana` | `mes` | `trimestre`

---

## Formatos

### GET /calidad2/medicamentos/formatos

Lista formatos (plantillas).

**Query Parameters:**
- `categoria` - Filtrar por categoría
- `estado` - Filtrar por estado
- `search` - Búsqueda por código o nombre

### POST /calidad2/medicamentos/formatos

Crea un nuevo formato.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `codigo` - Código del formato (ej: DM-FOR-001)
- `nombre` - Nombre del formato
- `categoria` - Categoría
- `version` - Versión (ej: 1.0)
- `periodicidad` - Periodicidad sugerida (opcional)
- `file` - Archivo plantilla

### GET /calidad2/medicamentos/formatos/:id

Obtiene un formato específico.

### PUT /calidad2/medicamentos/formatos/:id

Actualiza un formato.

### DELETE /calidad2/medicamentos/formatos/:id

Elimina un formato.

### GET /calidad2/medicamentos/formatos/:id/instancias

Lista instancias (llenados) de un formato.

**Query Parameters:**
- `periodo` - Filtrar por período
- `estado` - Filtrar por estado

### POST /calidad2/medicamentos/formatos/:id/instancias

Crea una nueva instancia.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `periodo` - Período (ej: "2026-Q1", "2026-01")
- `observaciones` - Observaciones (opcional)
- `file` - Archivo llenado

**Prevención de duplicados:** No permite crear instancia si ya existe una del mismo formato para el mismo período.

### PUT /calidad2/medicamentos/formatos/instancias/:instanciaId

Actualiza una instancia.

### DELETE /calidad2/medicamentos/formatos/instancias/:instanciaId

Elimina una instancia.

### POST /calidad2/medicamentos/formatos/instancias/:instanciaId/revisar

Marca una instancia como revisada.

**Request Body:**
```json
{
  "observaciones": "Formato completo y correcto" // Opcional
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Instancia revisada exitosamente",
  "data": {
    "id": "uuid",
    "revisadoPor": "uuid-usuario",
    "fechaRevision": "2026-01-05T10:00:00.000Z",
    ...
  }
}
```

---

## Alertas

### GET /calidad2/medicamentos/alertas

Lista todas las alertas.

**Query Parameters:**
- `tipo` - Filtrar por tipo de alerta
- `prioridad` - Filtrar por prioridad
- `atendida` - `true` | `false`
- `page`, `limit`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tipo": "VENCIMIENTO_MEDICAMENTO",
      "prioridad": "ALTA",
      "titulo": "⚠️ Vence en 25 días",
      "descripcion": "Acetaminofén 500mg (MED-001) lote L123456",
      "fechaAlerta": "2026-01-05T06:00:00.000Z",
      "atendida": false,
      "moduloOrigen": "MEDICAMENTOS",
      "entityType": "InventarioMedicamento",
      "entityId": "uuid-item",
      "creador": {
        "id": "SYSTEM",
        "nombre": "Sistema Automático"
      }
    },
    ...
  ],
  "pagination": { ... }
}
```

### GET /calidad2/medicamentos/alertas/activas

Solo alertas no atendidas (equivalente a `?atendida=false`).

### POST /calidad2/medicamentos/alertas/:id/atender

Marca una alerta como atendida.

**Request Body:**
```json
{
  "observaciones": "Se procedió a dar de baja el medicamento vencido" // Opcional
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Alerta marcada como atendida",
  "data": {
    "id": "uuid",
    "atendida": true,
    "atendidoPor": "uuid-usuario",
    "fechaAtencion": "2026-01-05T10:15:00.000Z",
    "observacionesAtencion": "Se procedió a dar de baja el medicamento vencido"
  }
}
```

### POST /calidad2/medicamentos/alertas/generar

Genera todas las alertas manualmente (trigger on-demand del cron job).

**No requiere body.**

**Respuesta:**
```json
{
  "success": true,
  "message": "Alertas generadas exitosamente",
  "data": {
    "mensaje": "Se generaron 15 nuevas alertas",
    "vencimientos": 10,
    "stock": 3,
    "temperatura": 2,
    "humedad": 0
  }
}
```

### GET /calidad2/medicamentos/alertas/estadisticas

Estadísticas de alertas.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalActivas": 25,
    "criticas": 5,
    "porTipo": {
      "VENCIMIENTO_MEDICAMENTO": 15,
      "STOCK_BAJO": 7,
      "TEMPERATURA_FUERA_RANGO": 2,
      "HUMEDAD_FUERA_RANGO": 1
    },
    "porPrioridad": {
      "CRITICA": 5,
      "ALTA": 10,
      "MEDIA": 7,
      "BAJA": 3
    }
  }
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Error de validación |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: duplicado) |
| 500 | Internal Server Error - Error del servidor |

### Errores Comunes

#### Error de Validación (400)

```json
{
  "success": false,
  "message": "Error de validación",
  "details": {
    "codigo": "Required field",
    "fechaVencimiento": "Invalid date format"
  }
}
```

#### Duplicado (409)

```json
{
  "success": false,
  "message": "Ya existe un registro para FARMACIA en la fecha 2026-01-05 08:00"
}
```

#### No Encontrado (404)

```json
{
  "success": false,
  "message": "Item de inventario no encontrado"
}
```

---

## Notas Importantes

### Fechas

- Todas las fechas deben enviarse en formato **ISO 8601**: `"2026-01-05T08:00:00.000Z"`
- El backend usa Prisma que convierte strings a objetos Date automáticamente
- Las respuestas siempre incluyen fechas en UTC

### Soft Delete

- Los deletes son **soft** (marcan `activo: false`)
- Los registros inactivos no aparecen en listados por defecto
- Se mantiene la integridad referencial

### Paginación

- **Default:** `page=1`, `limit=50`
- **Máximo:** `limit=200`
- Siempre incluye objeto `pagination` en la respuesta

### Permisos

- Todos los endpoints requieren el permiso `calidad2`
- `SUPER_ADMIN` bypasea todas las validaciones de permisos
- El `userId` se extrae automáticamente del token JWT

---

## Ejemplo de Uso Completo

### Flujo: Crear y Gestionar Alerta de Vencimiento

```javascript
// 1. Crear item de inventario
POST /calidad2/medicamentos/inventario
{
  "tipo": "MEDICAMENTO",
  "codigo": "MED-100",
  "nombre": "Ibuprofeno 400mg",
  "lote": "L999",
  "fechaVencimiento": "2026-02-10", // Vence en 35 días
  "cantidadActual": 50,
  "unidadMedida": "Tabletas",
  "stockMinimo": 20,
  "stockMaximo": 200
}

// Respuesta: Item creado con diasParaVencer = 35

// 2. Generar alertas (o esperar al cron de las 6 AM)
POST /calidad2/medicamentos/alertas/generar

// Respuesta: Se crea alerta ALTA para vencimiento en 35 días

// 3. Listar alertas activas
GET /calidad2/medicamentos/alertas/activas

// 4. Atender la alerta
POST /calidad2/medicamentos/alertas/{alerta-id}/atender
{
  "observaciones": "Se realizó pedido de reposición"
}

// Respuesta: Alerta marcada como atendida
```

---

**Última actualización:** Enero 2026
**Versión API:** 1.0.0
