# Plan de Sincronización y Mejoras de Agenda Médica

Este plan asegura la consistencia de datos en tiempo real entre Doctor y Admin, implementa validaciones robustas y completa las funcionalidades de gestión.

## 1. Estrategia de Sincronización (Real-time & Consistencia)

Para garantizar que Doctor y Admin vean exactamente lo mismo sin la complejidad de WebSockets (si no están ya configurados), implementaremos un modelo de **"SWR (Stale-While-Revalidate) con Checksum"**.

### Backend (`cita.service.js` / `schedule.controller.js`)
-   **Endpoint de Checksum**: Crear `GET /api/schedule/checksum?doctorId={id}`. Retornará un hash generado a partir de la última modificación de citas de ese doctor.
-   **Middleware de Auditoría**: Implementar un logger que registre cada creación/modificación/cancelación en una tabla `AuditLog` (Actor, Acción, Fecha, Datos Previos/Nuevos).
-   **Validación de Concurrencia**: Usar `version` (Optimistic Concurrency Control) en los registros de citas para evitar sobrescrituras accidentales si dos usuarios editan el mismo slot simultáneamente.

### Frontend (`DoctorScheduleManager.jsx`)
-   **Migración a SWR**: Reemplazar el estado local `useEffect` por el hook `useSWR` para obtener las citas. Esto habilita:
    -   Actualización automática en segundo plano (Polling inteligente).
    -   Revalidación al enfocar la ventana.
    -   Deduplicación de peticiones.
-   **Indicador de Estado**: Añadir un badge visual "Sincronizado" / "Actualizando..." / "Desconectado".
-   **Manejo de Conflictos**: Si el checksum del servidor difiere del local al intentar guardar, mostrar alerta y forzar recarga.

## 2. Validaciones y Reglas de Negocio
Implementar una capa de reglas (`ScheduleRules.js`) compartida o replicada en FE/BE:
-   **Bloqueos Institucionales**: No permitir citas en horarios de almuerzo (12:00-14:00) salvo excepción.
-   **Duración Mínima/Máxima**: Validar según tipo de cita (Consulta: 30min, Procedimiento: 60min).
-   **Límite de Citas Simultáneas**: Asegurar que `checkAvailability` bloquee solapamientos estrictamente.

## 3. Funcionalidad Doctor (Completar Faltantes)
-   **Vista de Detalles**: Al hacer clic en una cita, mostrar un popover con detalles completos del paciente (no solo nombre).
-   **Acciones Rápidas**: Botones directos en la cita para "Iniciar Consulta" (redirige al Workspace creado anteriormente) o "Marcar No Asistió".

## 4. Pruebas y Documentación
-   **Tests de Carga**: Crear script simple para simular 50 peticiones simultáneas de agenda y verificar consistencia.
-   **Tests E2E**: Verificar flujo: Admin crea cita -> Doctor la ve inmediatamente (max 2s).

## Pasos de Ejecución

1.  **Backend**:
    -   Actualizar `cita.service.js` para incluir generación de checksum y logs.
    -   Asegurar que los endpoints devuelvan headers de control de caché apropiados.
2.  **Frontend**:
    -   Instalar `swr` (si no existe).
    -   Refactorizar `DoctorScheduleManager.jsx` para usar el hook de datos y eliminar la gestión manual de estado inicial.
    -   Integrar validaciones de reglas de negocio en `handleSelectSlot`.
3.  **Verificación**:
    -   Realizar prueba manual abriendo dos navegadores (Admin y Doctor) y verificando la actualización cruzada.

Este enfoque es "exhaustivo" porque ataca la causa raíz de la desincronización (estado local vs estado servidor) y añade capas de seguridad (auditoría, validación).
