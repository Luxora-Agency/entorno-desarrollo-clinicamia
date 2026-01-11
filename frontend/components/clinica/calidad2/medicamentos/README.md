# Módulo de Medicamentos, Dispositivos e Insumos

**Módulo completo de gestión de calidad para medicamentos, dispositivos médicos e insumos médico-quirúrgicos.**

---

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Arquitectura](#arquitectura)
- [Módulos y Funcionalidades](#módulos-y-funcionalidades)
- [Instalación y Configuración](#instalación-y-configuración)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Exportaciones](#exportaciones)
- [Sistema de Alertas](#sistema-de-alertas)
- [Mantenimiento](#mantenimiento)

---

## Descripción General

Este módulo forma parte del sistema **Calidad 2.0** y proporciona una solución integral para la gestión de medicamentos, dispositivos médicos e insumos médico-quirúrgicos en una IPS (Institución Prestadora de Servicios de Salud) en Colombia.

### Cumplimiento Normativo

El módulo está diseñado para cumplir con:
- **Resolución 3100 de 2019** (Habilitación de servicios de salud)
- **Decreto 780 de 2016** (Sector Salud)
- **Normativa INVIMA** (Farmacovigilancia y Tecnovigilancia)
- **Sistema Obligatorio de Garantía de Calidad (SOGC)**

---

## Características Principales

### ✅ Gestión Integral
- 📁 Protocolos y procedimientos con control de versiones
- 📦 Inventario automatizado con alertas de vencimiento
- 💊 Farmacovigilancia con reporte a INVIMA
- 🔧 Tecnovigilancia para dispositivos médicos
- 🌡️ Monitoreo de temperatura y humedad
- 📋 Biblioteca de formatos con instancias
- 🔔 Sistema centralizado de alertas
- 📊 Dashboards con visualizaciones Echarts

### ⚡ Automatización
- Cálculo automático de días hasta vencimiento
- Validación automática de rangos de temperatura/humedad
- Generación automática de alertas (cron diario a las 6:00 AM)
- Asignación inteligente de prioridades

### 📥 Exportaciones
- Excel para inventarios, reportes y logs
- Exportación completa de dashboard
- Reportes consolidados con estadísticas

---

## Arquitectura

### Stack Tecnológico

**Backend:**
- Hono.js (REST API)
- Prisma ORM
- PostgreSQL
- node-cron (tareas programadas)
- Zod (validación)

**Frontend:**
- Next.js 16
- React
- shadcn/ui
- Echarts (visualizaciones)
- XLSX (exportaciones)

### Estructura de Carpetas

```
medicamentos/
├── DashboardGeneralMedicamentos.jsx      # Dashboard principal
├── MedicamentosModule.jsx                # Módulo contenedor (8 tabs)
├── README.md                             # Esta documentación
│
├── protocolos/                           # Tab 1: Protocolos
│   ├── ProtocolosTab.jsx
│   ├── ProtocoloForm.jsx
│   └── ProtocoloCard.jsx
│
├── farmacovigilancia/                    # Tab 2: Farmacovigilancia
│   ├── FarmacovigilanciaTab.jsx
│   ├── ReporteFarmacoForm.jsx
│   ├── ReporteCard.jsx
│   └── DashboardFarmacovigilancia.jsx
│
├── tecnovigilancia/                      # Tab 3: Tecnovigilancia
│   ├── TecnovigilanciaTab.jsx
│   ├── ReporteTecnoForm.jsx
│   ├── ReporteCard.jsx
│   ├── ConsolidadoTrimestral.jsx
│   └── DashboardTecnovigilancia.jsx
│
├── inventarios/                          # Tab 4: Inventarios
│   ├── InventariosTab.jsx               # (4 sub-tabs)
│   ├── InventarioMedicamentosTab.jsx
│   ├── InventarioDispositivosTab.jsx
│   ├── InventarioInsumosTab.jsx
│   ├── DashboardInventarioTab.jsx
│   ├── InventarioForm.jsx
│   ├── InventarioCard.jsx
│   └── AlertasInventarioWidget.jsx
│
├── temperatura-humedad/                  # Tab 5: Temperatura
│   ├── TemperaturaHumedadTab.jsx
│   ├── RegistroForm.jsx
│   ├── RegistroCard.jsx
│   ├── GraficaTendencias.jsx
│   └── AlertasTemperaturaWidget.jsx
│
├── formatos/                             # Tab 6: Formatos
│   ├── FormatosTab.jsx
│   ├── FormatoForm.jsx
│   ├── InstanciaForm.jsx
│   └── FormatoCard.jsx
│
└── alertas/                              # Tab 7: Alertas
    ├── AlertasMedicamentosTab.jsx
    ├── AlertaCard.jsx
    └── AlertasResumen.jsx
```

---

## Módulos y Funcionalidades

### 1. Dashboard (Tab Principal) 🎯

**Vista consolidada de todo el módulo.**

#### Características:
- **13 tarjetas de resumen** organizadas en 3 filas
- **3 gráficas Echarts** (tendencias, distribución)
- **Top 10 listas** (próximos a vencer, stock bajo)
- **Exportación Excel** de todo el dashboard

#### Métricas Mostradas:
- Total inventario por tipo
- Próximos a vencer (30/60/90 días)
- Stock bajo / Vencidos
- Reportes de vigilancia (mensual/total)
- Alertas activas y críticas
- Registros de temperatura fuera de rango
- Documentos vigentes
- Pendientes INVIMA

---

### 2. Protocolos 📄

**Gestión documental de protocolos y procedimientos.**

#### Tipos de Documentos:
- `PROGRAMA` - Programas de gestión (ej: MD-PG-001)
- `PROCEDIMIENTO` - Procedimientos operativos (ej: MD-PR-001)
- `PROTOCOLO` - Protocolos clínicos (ej: MD-PT-001)
- `POLITICA` - Políticas institucionales (ej: MD-PL-001)
- `MANUAL` - Manuales de uso

#### Funcionalidades:
- ✅ CRUD completo de protocolos
- ✅ Upload de múltiples documentos por protocolo
- ✅ Control de versiones
- ✅ Workflow de aprobación
- ✅ Próximas revisiones programadas
- ✅ Filtros por tipo y estado

#### Estados:
- `BORRADOR` - En elaboración
- `EN_REVISION` - Pendiente aprobación
- `VIGENTE` - Activo y en uso
- `OBSOLETO` - Fuera de vigencia

---

### 3. Inventarios 📦

**Control completo de medicamentos, dispositivos e insumos.**

#### Sub-módulos:
1. **Medicamentos** - Principios activos, concentraciones
2. **Dispositivos Médicos** - Clasificación de riesgo I, IIa, IIb, III
3. **Insumos Médico-Quirúrgicos** - Material médico general
4. **Dashboard** - Estadísticas y gráficas

#### Campos Principales:
- Código único
- Nombre y descripción
- Tipo (MEDICAMENTO / DISPOSITIVO_MEDICO / INSUMO_MEDICO_QUIRURGICO)
- Lote y fecha de vencimiento
- Cantidad actual y unidad de medida
- Stock mínimo/máximo
- Ubicación física
- Registro sanitario INVIMA
- Laboratorio/Fabricante

#### Alertas Automáticas:
- 🔴 **Vencidos** - Fecha vencimiento < hoy (CRÍTICA)
- 🟠 **Vence en 30 días** - (ALTA)
- 🟡 **Vence en 60 días** - (MEDIA)
- 🔵 **Vence en 90 días** - (BAJA)
- 🔴 **Stock crítico** - < 50% del mínimo (CRÍTICA)
- 🟠 **Stock bajo** - < stock mínimo (ALTA)

#### Cálculos Automáticos:
- `diasParaVencer` - Días hasta vencimiento
- `tieneAlertaVencimiento` - Boolean flag
- `tieneAlertaStock` - Boolean flag

---

### 4. Farmacovigilancia 💊

**Reportes de Reacciones Adversas a Medicamentos (RAM).**

#### Datos del Reporte:
- Paciente asociado
- Medicamento (nombre, lote, laboratorio)
- Fecha de evento
- Descripción de la reacción
- Gravedad: `Leve`, `Moderada`, `Grave`, `Mortal`
- Causalidad: `POSIBLE`, `PROBABLE`, `DEFINITIVA`, `NO_RELACIONADA`
- Desenlace
- Acciones tomadas

#### Workflow INVIMA:
1. Crear reporte (estado: `BORRADOR`)
2. Completar información
3. Marcar como `ENVIADO`
4. Reportar a INVIMA (genera número de reporte)
5. Estado final: `REPORTADO_INVIMA` o `CERRADO`

#### Estadísticas:
- Reportes por gravedad
- Reportes por causalidad
- Reportes mensuales/anuales
- Pendientes vs Reportados a INVIMA

---

### 5. Tecnovigilancia 🔧

**Reportes de eventos con dispositivos médicos.**

#### Tipos de Evento:
- `LESION` - Lesión al paciente/usuario
- `MUERTE` - Muerte relacionada con el dispositivo
- `FALLA_DISPOSITIVO` - Mal funcionamiento
- `USO_INADECUADO` - Uso incorrecto

#### Clasificación:
- `INCIDENTE`
- `EVENTO_ADVERSO_SERIO`
- `EVENTO_ADVERSO_NO_SERIO`
- `CASI_EVENTO`

#### Gravedades:
- `LEVE`, `MODERADA`, `GRAVE`, `MORTAL`

#### Consolidado Trimestral:
- Agregación automática por trimestre
- Estadísticas por tipo, gravedad y clasificación
- Reporte lista para INVIMA

---

### 6. Temperatura y Humedad 🌡️

**Monitoreo ambiental para áreas críticas.**

#### Áreas Monitoreadas:
- `FARMACIA` - 15-25°C, 30-60% HR
- `BODEGA` - 15-25°C, 30-70% HR
- `REFRIGERADOR_VACUNAS` - 2-8°C, 30-70% HR
- `LABORATORIO` - 18-25°C, 30-60% HR
- `ALMACEN_DISPOSITIVOS` - 15-25°C, 30-70% HR
- `QUIROFANO` - 19-24°C, 40-60% HR

#### Validación Automática:
```javascript
temperaturaEnRango = temperatura >= temperaturaMin && temperatura <= temperaturaMax
humedadEnRango = humedad >= humedadMin && humedad <= humedadMax
requiereAlerta = !temperaturaEnRango || !humedadEnRango
```

#### Gráficas (Echarts):
- Línea dual (temperatura + humedad)
- Bandas de rango aceptable
- Puntos rojos para valores fuera de rango
- Filtros por período: semana, mes, trimestre

---

### 7. Formatos 📋

**Biblioteca de plantillas y registro de instancias.**

#### Categorías:
- `TEMPERATURA` - Formatos de temperatura
- `INVENTARIO` - Formatos de inventario
- `INSPECCION` - Listas de chequeo
- Otros

#### Periodicidad Sugerida:
- `DIARIO`, `SEMANAL`, `MENSUAL`, `TRIMESTRAL`, `ANUAL`

#### Workflow:
1. Crear **Formato** (plantilla) - estado `VIGENTE`
2. Subir archivo plantilla (Excel/Word/PDF)
3. Crear **Instancia** (llenado) - por período
4. Subir archivo llenado
5. Revisar instancia (opcional)

---

### 8. Alertas 🔔

**Dashboard centralizado de alertas automáticas.**

#### Tipos de Alerta:
- `VENCIMIENTO_MEDICAMENTO`
- `STOCK_BAJO`
- `TEMPERATURA_FUERA_RANGO`
- `HUMEDAD_FUERA_RANGO`
- `REPORTE_PENDIENTE_INVIMA`

#### Prioridades:
- 🔴 `CRITICA` - Requiere acción inmediata
- 🟠 `ALTA` - Importante, pronto
- 🟡 `MEDIA` - Moderada
- 🔵 `BAJA` - Informativa

#### Generación Automática:
- **Cron job diario** a las 6:00 AM (zona horaria Colombia)
- Escanea inventario, temperatura y reportes
- Crea alertas solo si no existen duplicados
- Calcula prioridad según criterios

#### Atención de Alertas:
- Marcar como atendida
- Agregar observaciones
- Registro de atendedor y fecha

---

## Instalación y Configuración

### 1. Prerrequisitos

```bash
# Backend
cd backend
npm install node-cron

# Frontend
cd frontend
npm install echarts echarts-for-react xlsx
```

### 2. Base de Datos

```bash
cd backend
npx prisma migrate dev --name add_medicamentos_module
npx prisma generate
```

### 3. Activar Cron Job (Opcional)

Editar `/backend/server.js`:

```javascript
// ... después de configurar rutas

// Cron jobs
if (process.env.NODE_ENV !== 'test') {
  require('./cron/alertasMedicamentos');
  console.log('✅ Cron job de alertas medicamentos activado');
}

// ... antes de app.listen()
```

### 4. Permisos

Asegurar que los usuarios tengan el permiso `calidad2` en la tabla `role_permisos`.

---

## Uso

### Acceso al Módulo

1. Iniciar sesión en el sistema
2. Ir a **Calidad 2.0** en el menú lateral
3. Seleccionar **Medicamentos y Dispositivos**
4. Vista predeterminada: **Dashboard**

### Navegación

El módulo tiene **8 tabs horizontales**:

```
[Dashboard] [Protocolos] [Farmacovigilancia] [Tecnovigilancia]
[Inventarios] [Temperatura] [Formatos] [Alertas]
```

### Flujos de Trabajo Comunes

#### 1. Registrar Nuevo Medicamento
1. Tab **Inventarios** → Sub-tab **Medicamentos**
2. Clic en **Nuevo Medicamento**
3. Llenar formulario (código, nombre, lote, fecha vencimiento, cantidad)
4. Guardar
5. Sistema calcula automáticamente alertas

#### 2. Reportar Reacción Adversa
1. Tab **Farmacovigilancia**
2. Clic en **Nuevo Reporte**
3. Seleccionar paciente
4. Llenar datos del medicamento y reacción
5. Guardar (estado: BORRADOR)
6. Cuando esté completo → Marcar **Reportar a INVIMA**

#### 3. Registrar Temperatura Diaria
1. Tab **Temperatura**
2. Clic en **Nuevo Registro**
3. Seleccionar área (ej: FARMACIA)
4. Rangos se autocompletan según área
5. Ingresar temperatura y humedad
6. Si fuera de rango → agregar acción correctiva
7. Guardar → Alerta se crea automáticamente si procede

#### 4. Atender Alertas
1. Tab **Alertas**
2. Ver alertas activas (filtrar por prioridad si es necesario)
3. Clic en alerta → **Marcar como Atendida**
4. Agregar observaciones (opcional)
5. Confirmar

---

## API Endpoints

### Dashboard

```
GET  /calidad2/medicamentos/dashboard/resumen-general
GET  /calidad2/medicamentos/dashboard/inventario
GET  /calidad2/medicamentos/dashboard/farmacovigilancia
GET  /calidad2/medicamentos/dashboard/tecnovigilancia
GET  /calidad2/medicamentos/dashboard/alertas
GET  /calidad2/medicamentos/dashboard/temperatura
GET  /calidad2/medicamentos/dashboard/reportes-mensuales/:anio
GET  /calidad2/medicamentos/dashboard/graficas-temperatura/:area?periodo=mes
```

### Inventario

```
GET    /calidad2/medicamentos/inventario
POST   /calidad2/medicamentos/inventario
GET    /calidad2/medicamentos/inventario/:id
PUT    /calidad2/medicamentos/inventario/:id
DELETE /calidad2/medicamentos/inventario/:id
GET    /calidad2/medicamentos/inventario/medicamentos
GET    /calidad2/medicamentos/inventario/dispositivos
GET    /calidad2/medicamentos/inventario/insumos
GET    /calidad2/medicamentos/inventario/proximos-vencer?dias=30
GET    /calidad2/medicamentos/inventario/vencidos
GET    /calidad2/medicamentos/inventario/stock-bajo
GET    /calidad2/medicamentos/inventario/estadisticas
```

### Farmacovigilancia

```
GET    /calidad2/medicamentos/farmacovigilancia
POST   /calidad2/medicamentos/farmacovigilancia
GET    /calidad2/medicamentos/farmacovigilancia/:id
PUT    /calidad2/medicamentos/farmacovigilancia/:id
DELETE /calidad2/medicamentos/farmacovigilancia/:id
POST   /calidad2/medicamentos/farmacovigilancia/:id/reportar-invima
POST   /calidad2/medicamentos/farmacovigilancia/:id/documentos
DELETE /calidad2/medicamentos/farmacovigilancia/documentos/:documentoId
GET    /calidad2/medicamentos/farmacovigilancia/estadisticas
```

### Tecnovigilancia

```
GET    /calidad2/medicamentos/tecnovigilancia
POST   /calidad2/medicamentos/tecnovigilancia
GET    /calidad2/medicamentos/tecnovigilancia/:id
PUT    /calidad2/medicamentos/tecnovigilancia/:id
DELETE /calidad2/medicamentos/tecnovigilancia/:id
POST   /calidad2/medicamentos/tecnovigilancia/:id/reportar-invima
GET    /calidad2/medicamentos/tecnovigilancia/consolidado/:trimestre/:anio
GET    /calidad2/medicamentos/tecnovigilancia/estadisticas
```

### Temperatura y Humedad

```
GET    /calidad2/medicamentos/temperatura-humedad
POST   /calidad2/medicamentos/temperatura-humedad
GET    /calidad2/medicamentos/temperatura-humedad/:id
PUT    /calidad2/medicamentos/temperatura-humedad/:id
DELETE /calidad2/medicamentos/temperatura-humedad/:id
GET    /calidad2/medicamentos/temperatura-humedad/area/:area
GET    /calidad2/medicamentos/temperatura-humedad/alertas
GET    /calidad2/medicamentos/temperatura-humedad/tendencias/:area?periodo=mes
```

### Alertas

```
GET    /calidad2/medicamentos/alertas
GET    /calidad2/medicamentos/alertas/activas
POST   /calidad2/medicamentos/alertas/:id/atender
POST   /calidad2/medicamentos/alertas/generar
GET    /calidad2/medicamentos/alertas/estadisticas
```

### Formatos

```
GET    /calidad2/medicamentos/formatos
POST   /calidad2/medicamentos/formatos
GET    /calidad2/medicamentos/formatos/:id
PUT    /calidad2/medicamentos/formatos/:id
DELETE /calidad2/medicamentos/formatos/:id
GET    /calidad2/medicamentos/formatos/:id/instancias
POST   /calidad2/medicamentos/formatos/:id/instancias
PUT    /calidad2/medicamentos/formatos/instancias/:instanciaId
DELETE /calidad2/medicamentos/formatos/instancias/:instanciaId
POST   /calidad2/medicamentos/formatos/instancias/:instanciaId/revisar
```

---

## Exportaciones

### Funciones Disponibles

Ubicadas en `/frontend/utils/medicamentosExport.js`:

```javascript
// Inventario
exportInventarioToExcel(items, tipo)

// Farmacovigilancia
exportFarmacovigilanciaToExcel(reportes)

// Tecnovigilancia
exportTecnovigilanciaToExcel(reportes)

// Temperatura
exportTemperaturaToExcel(registros, area)

// Alertas
exportAlertasToExcel(alertas)

// Dashboard completo
exportDashboardToExcel(resumenGeneral)
```

### Formato de Archivos Excel

Todos los exports incluyen:
- **Hoja de Datos**: Tabla con todos los registros
- **Hoja de Resumen**: Estadísticas y agregaciones
- Columnas auto-ajustadas
- Timestamp en el nombre del archivo

---

## Sistema de Alertas

### Cron Job

**Archivo:** `/backend/cron/alertasMedicamentos.js`

```javascript
// Ejecuta todos los días a las 6:00 AM (zona horaria Colombia)
cron.schedule('0 6 * * *', async () => {
  await alertaMedicamentoService.generarTodasAlertas();
}, {
  timezone: 'America/Bogota'
});
```

### Lógica de Generación

1. **Vencimientos** (`generarAlertasVencimientos`):
   - Busca items con `fechaVencimiento <= ahora + 90 días`
   - Calcula días para vencer
   - Asigna prioridad según tabla:
     - Vencidos: CRÍTICA
     - ≤ 30 días: ALTA
     - ≤ 60 días: MEDIA
     - ≤ 90 días: BAJA

2. **Stock Bajo** (`generarAlertasStock`):
   - Busca items con `tieneAlertaStock = true`
   - Calcula porcentaje respecto al mínimo
   - Prioridades:
     - < 50% del mínimo: CRÍTICA
     - < mínimo: ALTA

3. **Temperatura** (`generarAlertasTemperatura`):
   - Busca registros con `requiereAlerta = true`
   - Todos son CRÍTICA (desviación inmediata)

4. **Prevención de Duplicados**:
   - Antes de crear, verifica si ya existe alerta activa del mismo tipo para la misma entidad
   - Solo crea si no existe

### Trigger Manual

Botón **"Generar Ahora"** en el tab Alertas ejecuta el mismo proceso on-demand.

---

## Mantenimiento

### Tareas Diarias

✅ **Automáticas** (via cron):
- Generación de alertas a las 6:00 AM

### Tareas Semanales

👤 **Manuales**:
- Revisar alertas críticas
- Atender alertas pendientes
- Verificar registros de temperatura

### Tareas Mensuales

👤 **Manuales**:
- Revisar reportes pendientes de INVIMA
- Actualizar inventarios
- Revisar protocolos próximos a vencer

### Tareas Trimestrales

👤 **Manuales**:
- Generar consolidado de tecnovigilancia
- Revisar estadísticas del dashboard
- Exportar reportes para auditorías

---

## Resolución de Problemas

### Alertas no se generan automáticamente

**Posible causa:** Cron job no está activado

**Solución:**
1. Verificar en `/backend/server.js` que esté la línea:
   ```javascript
   require('./cron/alertasMedicamentos');
   ```
2. Reiniciar servidor backend
3. Verificar logs para mensaje de confirmación

### Gráficas no se muestran

**Posible causa:** Echarts no instalado

**Solución:**
```bash
cd frontend
npm install echarts echarts-for-react
```

### Exportaciones fallan

**Posible causa:** XLSX no instalado

**Solución:**
```bash
cd frontend
npm install xlsx
```

---

## Soporte y Contacto

Para reportar problemas o solicitar nuevas funcionalidades:
- Repositorio: GitHub (si aplica)
- Email del equipo de desarrollo
- Sistema de tickets interno

---

## Licencia

© 2026 Clínica Mía - Todos los derechos reservados

---

**Última actualización:** Enero 2026
**Versión del módulo:** 1.0.0
**Desarrollado por:** Claude Code con supervisión humana
