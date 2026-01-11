# Plan de Optimización del Módulo de Admisiones

## 1. Análisis y Diagnóstico
He realizado una revisión exhaustiva del código y encontrado las siguientes áreas de mejora crítica:

*   **Inconsistencia en Lógica de Egreso**: Existe duplicidad entre `AdmisionService.egreso` (lógica antigua/simple) y `EgresoService.create` (lógica nueva/robusta). El servicio de admisión libera la cama a "Disponible" inmediatamente, mientras que el de egreso la pasa a "Mantenimiento" y genera registros de auditoría y firma digital.
*   **Eficiencia de Consultas**: `AdmisionService.getAll` realiza consultas manuales ("N+1 queries") para buscar nombres de usuarios responsables, lo cual es ineficiente.
*   **Relaciones en Base de Datos**: Faltan relaciones formales (Foreign Keys) en `schema.prisma` para `responsableIngreso` y `responsableEgreso`.
*   **Validación**: La validación actual es básica y no utiliza la infraestructura de `Zod` disponible en el proyecto.

## 2. Plan de Implementación

### Fase 1: Optimización de Base de Datos y Esquema
1.  **Actualizar `schema.prisma`**:
    *   Agregar relaciones `@relation` para `responsableIngreso` y `responsableEgreso` en el modelo `Admision`.
    *   Esto permitirá usar `include` en Prisma y eliminar consultas manuales.

### Fase 2: Estandarización y Limpieza de Lógica
1.  **Refactorizar `AdmisionService`**:
    *   Optimizar `getAll` y `getById` para usar las nuevas relaciones de Prisma.
    *   Eliminar la carga manual de usuarios.
    *   Alinear la lógica de egreso para que utilice o delegue a `EgresoService`, garantizando que siempre se cree el registro de `Egreso` y la cama pase a "Mantenimiento".

### Fase 3: Validación Robusta
1.  **Crear Esquemas de Validación (`backend/validators/admision.schema.js`)**:
    *   Implementar `createAdmisionSchema` con `zod` para validar UUIDs, fechas y campos requeridos.
2.  **Integrar Middleware**:
    *   Aplicar el middleware `validate` en las rutas de `backend/routes/admision.js`.

### Fase 4: Pruebas Automatizadas
1.  **Crear Suite de Pruebas (`tests/integration/admision_flow.test.js`)**:
    *   Prueba de flujo completo: Crear Admisión -> Verificar Estado Cama -> Listar Admisiones -> Registrar Egreso -> Verificar Liberación Cama.

## 3. Beneficios Esperados
*   **Integridad de Datos**: Garantizada por las nuevas relaciones en BD.
*   **Rendimiento**: Reducción drástica de consultas a la base de datos en listados.
*   **Seguridad**: Validación estricta de datos de entrada.
*   **Mantenibilidad**: Código más limpio y centralizado para la lógica de egreso.
