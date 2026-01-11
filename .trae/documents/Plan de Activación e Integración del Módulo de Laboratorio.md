# Plan de Implementación del Módulo de Laboratorio

Este plan detalla los pasos para activar completamente el módulo de laboratorio, integrarlo con el backend y asegurar su interoperabilidad con la Historia Clínica Electrónica (HCE).

## 1. Backend: Correcciones y Mejoras
### 1.1 Rutas de Órdenes Médicas (`backend/routes/ordenesMedicas.js`)
- **Corregir ruta de completado**: Cambiar `POST /:id/administrar` por `POST /:id/completar` para reflejar mejor la acción de laboratorio (a diferencia de farmacia).
- **Validación de Resultados**: Asegurar que el endpoint acepte un objeto JSON estructurado en el campo `resultados` para permitir tablas de valores (Parámetro, Valor, Referencia).

### 1.2 Servicio de Órdenes Médicas (`backend/services/ordenMedica.service.js`)
- **Lógica de Completado**: Verificar que al completar la orden:
    - Se actualice el estado a `Completada`.
    - Se guarde la `fechaEjecucion`.
    - Se almacenen los `resultados` correctamente (como string JSON si es necesario por la base de datos).

## 2. Frontend: Implementación del Módulo de Laboratorio
### 2.1 Refactorización de `LaboratorioModule.jsx`
- **Integración con API**: Reemplazar los datos simulados (mock data) con llamadas reales a la API (`useApi` hook).
- **Listado de Órdenes**: Implementar `GET /ordenes-medicas` con filtros por estado (Pendiente, En Proceso, Completado).
- **Nueva Orden**:
    - Conectar el formulario de creación con `POST /ordenes-medicas`.
    - Cargar listas reales de Pacientes y Exámenes/Procedimientos para los selectores.

### 2.2 Funcionalidad de Ingreso de Resultados
- **Interfaz de Resultados**: Crear un formulario dinámico que permita al laboratorista ingresar múltiples parámetros para un examen (ej: Hemoglobina, Hematocrito, etc.).
- **Estructura de Datos**: Guardar los resultados en formato JSON:
  ```json
  {
    "Hemoglobina": { "valor": "14.5", "unidad": "g/dL", "referencia": "12-16", "estado": "Normal" }
  }
  ```

## 3. Integración con HCE (Historia Clínica)
### 3.1 Visualización en HCE (`TabExamenesProcedimientosPaciente.jsx`)
- **Mejora de Visualización**: Actualizar el componente para detectar si los `resultados` están en formato JSON.
    - **Si es JSON**: Renderizar una tabla estructurada y legible.
    - **Si es Texto**: Mantener la visualización actual (parrafo simple).
- Esto asegura que los médicos vean los resultados del laboratorio directamente en la ficha del paciente con el mismo formato detallado.

## 4. Pruebas y Validación
### 4.1 Script de Pruebas Automatizadas
- Crear `backend_test_laboratorio.py` para validar el flujo completo:
    1.  Creación de una orden de laboratorio.
    2.  Verificación de estado "Pendiente".
    3.  Ingreso de resultados y completado de orden.
    4.  Verificación de estado "Completada" y persistencia de datos.

### 4.2 Verificación Manual
- Confirmar que una orden creada en el módulo de Laboratorio aparece en la HCE del paciente.
- Confirmar que los resultados ingresados son visibles para el médico.

## Resumen Técnico
- **Archivos a modificar**:
    - `backend/routes/ordenesMedicas.js`
    - `frontend/components/clinica/LaboratorioModule.jsx`
    - `frontend/components/clinica/paciente/TabExamenesProcedimientosPaciente.jsx`
- **Archivos a crear**:
    - `backend_test_laboratorio.py`
