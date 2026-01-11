# Optimización Integral del Módulo de Pacientes

Este plan aborda la refactorización completa del módulo de pacientes para garantizar robustez, validación estricta y mejor experiencia de usuario, utilizando **Zod** para la validación de esquemas tanto en frontend como en backend.

## 1. Preparación y Dependencias
Instalación de librerías necesarias para validación y manejo de formularios.

### Backend
- Instalar `zod` para definición de esquemas y validación.

### Frontend
- Instalar `react-hook-form` para gestión de estado del formulario.
- Instalar `zod` y `@hookform/resolvers` para integración de validaciones.

## 2. Backend: Validación y Lógica (API)
Implementación de una capa de validación robusta antes de llegar al servicio.

### Definición de Esquemas
- Crear `backend/validators/paciente.schema.js`:
  - Definir esquema Zod para `createPacienteSchema` y `updatePacienteSchema`.
  - Reglas estrictas: `cedula` (formato), `email` (formato), `fechas` (no futuras), `campos obligatorios` (nombre, apellido, documento).

### Actualización de Rutas y Servicios
- **Rutas (`backend/routes/pacientes.js`)**: Integrar middleware de validación que use los esquemas Zod antes de procesar `POST` y `PUT`.
- **Servicio (`backend/services/paciente.service.js`)**: 
  - Eliminar validaciones manuales redundantes.
  - Mantener lógica de negocio (ej: unicidad de cédula en BD).
  - Sanitizar datos antes de guardar.

## 3. Frontend: Refactorización del Formulario
Reescritura del componente `PacienteStepperForm` para usar `react-hook-form`.

### Esquema de Validación
- Crear `frontend/schemas/paciente.schema.js` (espejo del backend con mensajes amigables para UI).
- Validaciones específicas:
  - Al menos un contacto de emergencia.
  - Fechas lógicas (nacimiento vs afiliación).
  - Campos condicionales (ej: si `genero` es "Otro", `otroGenero` es requerido).

### Componente `PacienteStepperForm`
- Migrar de `useState` monolítico a `useForm`.
- Implementar validación por pasos usando `trigger()` antes de avanzar.
- Mostrar mensajes de error en línea (debajo de cada input) en lugar de toasts genéricos.
- Manejo correcto de tipos (números como numbers, fechas como Date objects).

## 4. Testing e Integración
Verificación de que los cambios funcionan y no rompen nada.

### Pruebas de Integración
- Crear script `backend/tests/integration/paciente_flow.test.js`:
  - Probar creación exitosa.
  - Probar fallos de validación (campos faltantes, formatos inválidos).
  - Probar ciclo completo (Crear -> Leer -> Actualizar -> Borrar).

### Verificación Manual
- Comprobar flujo en UI: Creación de paciente, validación visual, edición y carga de datos existentes.
