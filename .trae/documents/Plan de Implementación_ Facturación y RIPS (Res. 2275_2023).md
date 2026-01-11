# Plan de Implementación del Módulo de Facturación y RIPS (Res. 2275/2023)

## Objetivo
Implementar y verificar el módulo de facturación completo, asegurando compatibilidad con HCE, Citas, y otros módulos, y cumplimiento estricto de la normativa colombiana para la generación de RIPS en formato JSON (Resolución 2275 de 2023) actualizado a Diciembre 2025.

## 1. Implementación Backend (Facturación y RIPS)

### 1.1. Servicio de Exportación RIPS (`exportadorRIPS.service.js`)
Crear un nuevo servicio en `backend/services/exportadores/` que maneje la lógica de generación de archivos JSON requeridos por la norma:
- **Estructura JSON:** Implementar la estructura de "Archivos de Transacción" que agrupa los demás archivos.
- **Módulos RIPS a implementar:**
  - **Usuarios (US):** Extracción de datos desde el modelo `Paciente`.
  - **Consultas (AC):** Extracción desde `Cita` y `FacturaItem` (tipo Consulta). Mapeo de CIE-10/11.
  - **Procedimientos (AP):** Extracción desde `Procedimiento`, `OrdenMedica` y `FacturaItem`.
  - **Urgencias (AU):** Extracción desde `AtencionUrgencia`.
  - **Hospitalización (AH):** Extracción desde `Admision`.
  - **Medicamentos (AM):** Extracción desde `OrdenMedicamento` y `FacturaItem`.
  - **Otros Servicios (AT):** Insumos y otros cobros.
- **Validaciones:** Implementar validaciones de campos obligatorios según anexos técnicos (tipos de documentos, códigos de municipio, etc.).

### 1.2. Actualización de `FacturaService` y Rutas
- **Integración RIPS:** Agregar método `generarRIPS(facturaIds)` en `FacturaService` o controlador asociado.
- **Endpoint:** Crear ruta `POST /api/facturas/rips` para descargar el JSON/ZIP generado.
- **Validación de Datos:** Asegurar que al crear/actualizar facturas se validen campos críticos para RIPS (códigos CUPS, diagnósticos principales).

### 1.3. Integración con Módulos Existentes
- **HCE -> Facturación:** Asegurar que los diagnósticos (CIE-10/11) de las evoluciones fluyan correctamente hacia la factura/RIPS.
- **Citas -> Facturación:** Verificar que la creación automática de facturas desde citas (ya existente) incluya los datos necesarios para RIPS (modalidad de atención, finalidad).

## 2. Implementación Frontend (Facturación)

### 2.1. Conexión con API Real
- Refactorizar `frontend/components/clinica/FacturacionModule.jsx` para dejar de usar datos simulados (mock) y consumir los endpoints de `FacturaService`.
- Implementar hooks (`useFacturas`) para gestión de estado y peticiones.

### 2.2. Funcionalidad de RIPS en UI
- **Botón "Generar RIPS":** Permitir seleccionar múltiples facturas (o un rango de fechas/convenio) para generar el paquete RIPS.
- **Vista Previa:** Modal para visualizar el resumen de lo que se va a exportar antes de generar el archivo.
- **Validaciones Visuales:** Mostrar alertas si faltan datos críticos en una factura para generar RIPS válido.

## 3. Testing y Validación

### 3.1. Tests de Integración
- Crear `backend/tests/integration/rips_flow.test.js`.
- **Escenarios:**
  1. Crear Paciente y Cita médica completa.
  2. Generar atención y diagnósticos (HCE).
  3. Generar Factura.
  4. Ejecutar `generarRIPS` y validar que el JSON resultante cumpla con el esquema de la Res. 2275.

### 3.2. Verificación de Normativa
- Validar campos específicos: Código habilitación, códigos CUPS, códigos CIE, tipos de usuario, tipos de documento.

## Entregables
1. Código fuente backend actualizado (`exportadorRIPS.service.js`, `factura.service.js`, rutas).
2. Frontend funcional conectado al backend.
3. Reporte de pruebas de integración exitosas.
4. Archivos de ejemplo RIPS JSON generados.
