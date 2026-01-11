# Plan de Reestructuración Integral del Módulo de Enfermería

Este plan aborda la reestructuración completa solicitada, cubriendo backend, frontend, testing y documentación.

## 1. Backend: Ampliación del Modelo de Datos y API

### 1.1. Actualización del Schema Prisma (`backend/prisma/schema.prisma`)
Se crearán nuevos modelos para soportar las funcionalidades requeridas:
*   **`Glucometria`**:
    *   Campos: `pacienteId`, `valor` (mg/dL), `momento` (Ayunas, Pre-prandial, Post-prandial), `insulinaAdministrada` (Unidades), `observaciones`, `registradoPor`.
    *   Relaciones: `Paciente`, `Usuario`.
*   **`BalanceLiquidos`**:
    *   Campos: `pacienteId`, `tipo` (Ingreso/Egreso), `via` (Oral, IV, Sonda / Orina, Vómito, Drenaje), `cantidad` (ml), `fluido` (Tipo de líquido), `observaciones`, `registradoPor`.
    *   Relaciones: `Paciente`, `Usuario`, `Admision`.
*   **`Transfusion`**:
    *   Campos: `pacienteId`, `hemocomponente`, `grupoSanguineo`, `rh`, `volumen`, `velocidad`, `reaccionAdversa` (Boolean), `signosVitalesPre`, `signosVitalesPost` (Json), `registradoPor`, `verificadoPor` (Doble chequeo).
    *   Relaciones: `Paciente`, `Usuario`.
*   **`PlantillaNotaEnfermeria`**:
    *   Campos: `nombre`, `contenido` (texto con placeholders), `tipoNota`, `creadoPor`.
*   **`ProcedimientoEnfermeria`** (Opcional, si `Procedimiento` es muy estricto):
    *   Evaluaremos usar el modelo existente `Procedimiento` adaptando validaciones, o crear uno ligero para curaciones rutinarias.

### 1.2. Nuevos Servicios y Controladores
*   `glucometria.service.js` / `.controller.js`: CRUD y lógica de alertas (ej. valor < 70 o > 180).
*   `balanceLiquidos.service.js` / `.controller.js`: CRUD y cálculo de acumulados (6h, 12h, 24h).
*   `transfusion.service.js` / `.controller.js`: Registro con validación de doble chequeo.
*   `plantillaNota.service.js` / `.controller.js`: Gestión de plantillas.
*   **Actualización**: `notaEnfermeria.service.js` para integrar uso de plantillas.

### 1.3. Rutas API
*   Definición de rutas en `backend/routes/` para cada nuevo módulo, protegidas por autenticación JWT y roles (`NURSE`).

## 2. Frontend: Rediseño UI/UX y Nuevas Funcionalidades

### 2.1. Arquitectura y Navegación
*   **Layout**: Implementar un layout con Sidebar persistente y **Breadcrumbs** para navegación jerárquica.
*   **Dashboard**: Refactorizar `DashboardEnfermera.jsx` para ser el "Hub" central, mostrando alertas críticas y tareas inmediatas.

### 2.2. Desarrollo de Componentes Modulares
Se crearán componentes en `frontend/components/clinica/enfermeria/`:
*   **`NotasEnfermeria.jsx`**:
    *   Editor de texto enriquecido o áreas de texto amplias.
    *   Selector de **Plantillas Configurables** (SOAP, DAR, etc.).
*   **`SignosVitales.jsx`**:
    *   Tabla histórica y **Gráficos** (Recharts) para temperatura, TA, FC.
*   **`GlucometriaModule.jsx`**:
    *   Registro rápido.
    *   Indicadores visuales de hipo/hiperglucemia.
*   **`BalanceLiquidosModule.jsx`**:
    *   Dos columnas: Ingresos vs Egresos.
    *   Calculadora automática de balance total/parcial.
*   **`CuracionesProcedimientos.jsx`**:
    *   Formulario detallado: descripción de herida, insumos gastados, fotos (si es posible), evolución.
*   **`TransfusionesModule.jsx`**:
    *   Checklist de seguridad pre-transfusional.
    *   Registro de constantes vitales durante el procedimiento.

### 2.3. Integración
*   Conectar todos los formularios a las nuevas APIs.
*   Implementar **Guardado Automático** (drafts) en notas extensas.
*   Validaciones con `zod` en el frontend antes de enviar.

## 3. Calidad y Testing

### 3.1. Pruebas Unitarias (Backend)
*   Tests con Jest para los cálculos de balance de líquidos y lógica de alertas de glucometría.

### 3.2. Pruebas de Integración
*   Verificar flujos completos: Crear paciente -> Asignar enfermera -> Registrar nota -> Registrar signos.

## 4. Documentación
*   Generar especificación OpenAPI (Swagger) para los nuevos endpoints.
*   Crear guía de usuario en Markdown para el panel de enfermería.

## Pasos de Ejecución Inmediata
1.  Modificar `schema.prisma` y aplicar migración.
2.  Crear servicios y controladores backend.
3.  Implementar componentes frontend base.
4.  Integrar y probar.
