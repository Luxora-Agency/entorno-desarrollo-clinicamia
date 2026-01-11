# Plan de Implementación del Módulo de Tickets y Soporte

Este plan tiene como objetivo consolidar y completar el módulo de "Tickets y Soporte", asegurando su compatibilidad con la Historia Clínica Electrónica (HCE) y cubriendo tanto las necesidades de los pacientes (PQRS) como del personal interno (Soporte Técnico).

## 1. Análisis de la Situación Actual
*   **Módulo PQRS Existente**: Ya existe un módulo funcional de PQRS (`Peticiones, Quejas, Reclamos, Sugerencias`) orientado principalmente a pacientes. Tiene servicio, rutas y pruebas unitarias.
*   **Falta de Soporte Interno**: No existe un módulo dedicado para que el personal médico/administrativo reporte fallos técnicos o de infraestructura (e.g., "Impresora fallando", "Error en pantalla de HCE").
*   **Integración HCE Limitada**: El módulo PQRS actual se vincula al paciente, pero no permite referenciar registros específicos de la HCE (como una Evolución, Cita o Admisión específica), lo cual es un requisito clave ("hazlo compatible con la hce").

## 2. Estrategia de Implementación

### Fase 1: Mejora del Modelo de Datos (Prisma Schema)
1.  **Actualizar Modelo PQRS**:
    *   Agregar relaciones opcionales para vincular una PQRS directamente a contextos clínicos: `admisionId`, `citaId`, `ordenMedicaId`.
    *   Esto permite que una queja pueda ser: "Error en la facturación de la Cita #123".
2.  **Crear Modelo `TicketSoporte` (Nuevo)**:
    *   Diseñado para soporte interno (IT, Mantenimiento, Biomédica).
    *   Campos: `id`, `asunto`, `descripcion`, `prioridad`, `estado`, `categoria` (Software, Hardware, Mantenimiento, HCE), `usuarioReportaId`, `usuarioAsignadoId`.
    *   **Compatibilidad HCE**: Campos para vincular el error a un registro clínico específico (`referenciaId`, `referenciaTipo` o relaciones directas como en PQRS) para facilitar la depuración.

### Fase 2: Implementación de Servicios y Rutas
1.  **Actualizar `pqrs.service.js` y `pqrs.js`**:
    *   Soportar la creación y consulta de los nuevos campos de enlace HCE.
2.  **Crear `ticket.service.js`**:
    *   Lógica CRUD para tickets internos.
    *   Asignación automática o manual de tickets.
    *   Seguimiento y cambio de estados (Abierto, En Progreso, Resuelto).
3.  **Crear `tickets.routes.js`**:
    *   Endpoints protegidos para gestión de tickets internos.

### Fase 3: Pruebas y Validación
1.  **Pruebas de Integración**:
    *   Crear `tests/integration/soporte_flow.test.js` para simular un flujo completo:
        *   Doctor reporta un fallo técnico en una Evolución.
        *   Admin de sistemas recibe y asigna el ticket.
        *   Paciente radica una PQRS sobre una Cita específica.
2.  **Validación de Compatibilidad**:
    *   Verificar que las relaciones con `Admision`, `Cita` y `Paciente` funcionen correctamente a nivel de base de datos y API.

## 3. Entregables
*   `schema.prisma` actualizado con `TicketSoporte` y mejoras en `PQRS`.
*   Nuevo módulo backend: `services/ticket.service.js` y `routes/tickets.js`.
*   Actualización de `services/pqrs.service.js`.
*   Scripts de prueba actualizados y nuevos tests de integración.

¿Desea proceder con este plan de implementación?