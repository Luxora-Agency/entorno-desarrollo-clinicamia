# Implementación de Submódulo "Formatos" en Talento Humano (Calidad 2.0)

Este plan detalla la creación de un nuevo submódulo "Formatos" dentro de Talento Humano, permitiendo la gestión documental y la creación de formularios dinámicos (Checklists y Actas) con funcionalidades de carga de archivos, alertas y seguimiento.

## 1. Backend: Base de Datos y API

### 1.1. Modelado de Datos (Prisma Schema)
Crearemos dos nuevos modelos para manejar la flexibilidad requerida:
*   `FormatoTemplate`: Almacenará la estructura de los formularios dinámicos (Checklists, Actas, etc.).
    *   Campos: `nombre`, `descripcion`, `tipo` (CHECKLIST, ACTA, OTRO), `estructura` (JSON definiciendo secciones y campos), `activo`.
*   `FormatoRegistro`: Almacenará los datos diligenciados.
    *   Campos: `templateId`, `datos` (JSON con las respuestas), `estado`, `creadoPor`.
*   Actualización del esquema y ejecución de migración.

### 1.2. Servicios y Controladores
*   **Servicio**: `backend/services/calidad2/formato.service.js` para lógica de negocio (CRUD de templates y registros).
*   **Controlador**: `backend/controllers/calidad2/formato.controller.js` para manejar peticiones HTTP.
*   **Rutas**: Agregar endpoints en `backend/routes/calidad2.js` para `/formatos/templates` y `/formatos/registros`.

### 1.3. Seeding (Datos Iniciales)
*   Crear un script para insertar las plantillas solicitadas:
    1.  **Lista de Verificación del Personal**: Con las secciones (Información General, Antecedentes, etc.) y campos tipo "Cumplimiento" (C, NC, NA, Observaciones).
    2.  **Plantilla de Acta**: Con campos de encabezado, lista dinámica de temas y compromisos.

## 2. Frontend: Interfaz de Usuario

### 2.1. Estructura de Directorios
Crear `frontend/components/clinica/calidad2/talento-humano/formatos/` con:
*   `FormatosTab.jsx`: Componente principal que integra el gestor y los formularios.
*   `GestorDocumental.jsx`: Vista para subir y listar archivos generales.
*   `FormatoBuilder.jsx`: Interfaz para crear/editar plantillas de formularios dinámicos.
*   `FormatoFiller.jsx`: Componente que renderiza el formulario basado en el JSON de la plantilla (soporta campos de texto, selección, fecha, y carga de archivos).
*   `FormatoLista.jsx`: Listado de formatos diligenciados.

### 2.2. Integración en Talento Humano
*   Modificar `TalentoHumanoModule.jsx` para agregar la pestaña "Formatos".

## 3. Funcionalidades Clave

*   **Gestor Documental**: Subida de archivos (PDF, imágenes) asociados al módulo.
*   **Formularios Dinámicos**:
    *   Renderizado automático basado en JSON.
    *   Tipos de campos soportados: Texto, Fecha, Select, Checkbox, Archivo, Lista Dinámica (para temas de actas), Tabla de Cumplimiento (C/NC/NA).
*   **Validación**: Asegurar que los campos obligatorios se llenen.

## 4. Verificación
*   Verificar la creación de la plantilla "Lista de Verificación".
*   Diligenciar un formulario de prueba y verificar que se guarden los datos y archivos.
*   Verificar la visualización del Acta.
