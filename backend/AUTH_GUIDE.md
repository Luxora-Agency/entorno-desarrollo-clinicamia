# Guía de Autenticación y Seguridad (Actualizado v2.0)

## Resumen de Cambios
Se ha implementado un sistema de autenticación robusto basado en **JWT con Access Token y Refresh Token**, reemplazando el token único simple. Además, se ha migrado a un sistema de roles y permisos (RBAC) granular almacenado en base de datos.

## Estructura de Tokens
1.  **Access Token (JWT)**:
    -   Expiración: **7 días**.
    -   Uso: Autenticación en cada petición (Header `Authorization: Bearer ...`).
    -   Almacenamiento: Memoria (Frontend), `localStorage` (Temporalmente para persistencia).
2.  **Refresh Token (Opaque/Hex)**:
    -   Expiración: **30 días**.
    -   Uso: Obtener nuevo Access Token cuando expira.
    -   Almacenamiento: Base de datos (`refresh_tokens` table) y `localStorage` (Frontend).
    -   **Rotación**: Cada vez que se usa, se revoca y se emite uno nuevo (detección de robo).

## Flujo de Autenticación
1.  **Login (`POST /auth/login`)**:
    -   Recibe email/password.
    -   Verifica credenciales y bloqueo de cuenta (5 intentos fallidos = 15 min bloqueo).
    -   Devuelve `accessToken` y `refreshToken`.
2.  **Uso de API**:
    -   Frontend envía `accessToken`.
    -   Si recibe `401 Unauthorized`, interceptor captura el error.
    -   Interceptor llama a `/auth/refresh` con el `refreshToken`.
    -   Si es exitoso, reintenta la petición original con el nuevo token.
    -   Si falla, redirige a Login.
3.  **Logout (`POST /auth/logout`)**:
    -   Revoca el `refreshToken` en base de datos.

## Roles y Permisos
El sistema usa ahora las tablas `roles`, `permissions`, `role_permissions` y `user_roles`.
-   **Roles**: SUPER_ADMIN, ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT.
-   **Permisos**: Granulares (ej: `patients.view`, `appointments.create`).

### Verificar Permisos en Backend
Usar el middleware `requirePermission`:
```javascript
const { requirePermission } = require('../middleware/auth');

app.post('/usuarios', requirePermission('users.create'), async (c) => {
  // ...
});
```

### Verificar Roles (Legacy/Simple)
El middleware `authMiddleware` inyecta `user` en el contexto (`c.get('user')`), incluyendo su `rol` principal.

## Base de Datos
Nuevos modelos en `schema.prisma`:
-   `RefreshToken`: Almacena tokens de refresco.
-   `Usuario`: Campos `lastLogin`, `failedLoginAttempts`, `lockedUntil`.

## Frontend
-   Hook `useAuth`: Maneja login, logout y estado de usuario.
-   `api.js`: Maneja interceptores y renovación automática de tokens.

## Testing
Tests de integración disponibles en `tests/integration/auth_flow.test.js`.
Ejecutar con:
```bash
npm test tests/integration/auth_flow.test.js
```
