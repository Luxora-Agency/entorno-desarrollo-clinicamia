# Guía de Implementación del Nuevo Sistema de Roles y Permisos (RBAC)

## Descripción General

Se ha implementado un nuevo sistema de **Control de Acceso Basado en Roles (RBAC)** con soporte para permisos granulares, herencia de roles y auditoría. Este sistema reemplaza al anterior basado en módulos simples.

## Estructura de Datos

El sistema se basa en las siguientes entidades:

1.  **Role**: Roles dinámicos (e.g., "Doctor", "Enfermera Jefe"). Soportan jerarquía (un rol puede heredar permisos de otro).
2.  **Permission**: Permisos granulares (e.g., `users.create`, `patients.view`).
3.  **RolePermission**: Relación muchos-a-muchos entre Roles y Permisos.
4.  **UserRole**: Asignación de roles a usuarios, con soporte para fecha de expiración (roles temporales).
5.  **AuditLog**: Registro de auditoría para todas las acciones críticas.

## Middleware de Autorización

El middleware `requirePermission` verifica si el usuario tiene el permiso necesario (directamente o heredado).

### Uso

```javascript
const { requirePermission } = require('../middleware/auth');

// Proteger una ruta específica
app.get('/users', requirePermission('users.view'), async (c) => {
  // ...
});

app.post('/users', requirePermission('users.create'), async (c) => {
  // ...
});
```

El middleware verifica automáticamente si el usuario es `SUPER_ADMIN` (acceso total) o si tiene el permiso requerido asignado a alguno de sus roles.

## Gestión de Roles y Permisos

La gestión se realiza a través del módulo "Usuarios y Roles" en el frontend, que permite:

1.  **Crear/Editar Roles**: Definir nombres, descripciones y jerarquías.
2.  **Asignar Permisos**: Seleccionar permisos agrupados por módulo.
3.  **Asignar Roles a Usuarios**: Asignar uno o más roles a un usuario.

## Auditoría

Todas las acciones críticas (creación de roles, asignación de permisos, cambios en usuarios) se registran en la tabla `AuditLog`. Estos registros se pueden consultar en la pestaña "Auditoría" del módulo de administración.

## Migración

El sistema mantiene compatibilidad hacia atrás con el campo `rol` (string) en la tabla `usuarios` para no romper funcionalidades existentes, pero se recomienda migrar gradualmente a la verificación basada en `requirePermission`.

### Rutas Migradas

Las rutas de `/usuarios` y `/roles` ya han sido migradas al nuevo sistema.

## Seeders

Se ha incluido un seeder (`backend/seeders/rolesAndPermissions.js`) que inicializa los permisos básicos y roles predeterminados (`SUPER_ADMIN`, `ADMIN`, `DOCTOR`, etc.).

Ejecutar con:
```bash
node backend/seeders/rolesAndPermissions.js
```
