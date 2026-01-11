# Plan de Reestructuración del Sistema de Autenticación y Roles

## 1. Diseño de Autenticación JWT y Seguridad
Implementaremos un sistema de doble token (Access Token + Refresh Token) para mejorar la seguridad y la experiencia de usuario.

### Backend
1.  **Modificar Schema de Base de Datos (`prisma/schema.prisma`):**
    -   Agregar modelo `RefreshToken` para gestionar sesiones seguras y revocación.
    -   Actualizar modelo `Usuario` con campos de auditoría (`lastLogin`, `failedLoginAttempts`, `lockedUntil`).
2.  **Actualizar `AuthService`:**
    -   Implementar rotación de Refresh Tokens.
    -   Configurar tiempos de expiración: Access Token (15 min), Refresh Token (7 días).
    -   Implementar bloqueo de cuenta tras múltiples intentos fallidos.
3.  **Middleware de Seguridad:**
    -   Implementar `rate-limiter` en endpoints de auth.
    -   Configurar Headers de seguridad (Helmet).
    -   Validar origen de peticiones (CORS estricto).

### Frontend
1.  **Actualizar `useAuth` Hook:**
    -   Implementar interceptores de Axios/Fetch para renovación automática de tokens.
    -   Almacenar Access Token en memoria (estado de React) y Refresh Token en Cookie HttpOnly (gestionado por backend).
    -   Manejo de cierre de sesión en todas las pestañas.

## 2. Sistema de Roles y Permisos (RBAC)
Migraremos completamente del sistema basado en strings (`user.rol`) al sistema relacional (`UserRole`, `Role`, `Permission`) que ya existe parcialmente pero no se usa plenamente.

1.  **Migración de Datos:**
    -   Script para crear Roles base (Admin, Doctor, Enfermero, etc.) en la tabla `Role`.
    -   Script para migrar usuarios existentes: mapear campo `rol` (string) a entradas en `UserRole`.
2.  **Refactorización de Middleware:**
    -   Deprecar `roleMiddleware` (basado en string).
    -   Estandarizar uso de `requirePermission` en todas las rutas protegidas.
    -   Implementar caché de permisos en Redis o memoria para mejorar performance.

## 3. Integración y Compatibilidad
Aseguraremos que el sistema actual siga funcionando durante la transición.

1.  **Estrategia de Migración:**
    -   Mantener campo `rol` (string) en `Usuario` como "legacy" y solo lectura por un tiempo.
    -   El login devolverá ambos formatos de claims en el token inicialmente.
2.  **Pruebas:**
    -   Crear tests de integración para flujo completo de Auth (Login -> Access -> Refresh -> Logout).
    -   Validar que los roles actuales (Doctor, Enfermera) mantengan acceso a sus módulos.

## 4. Documentación y Testing
1.  **Documentación:**
    -   Actualizar Swagger/OpenAPI con nuevos endpoints de auth (`/refresh`, `/logout`).
    -   Crear guía de desarrollo "Cómo proteger una nueva ruta".
2.  **Testing:**
    -   Unit Tests para `AuthService` (validación de tokens, hasheo).
    -   Integration Tests para middleware de permisos.

## Pasos de Implementación
1.  **Fase 1: Base de Datos y Modelos** (Schema changes, Migrations).
2.  **Fase 2: Backend Auth Core** (Login, Refresh, Logout, Rate Limiting).
3.  **Fase 3: Migración de Roles** (Scripts de migración, asignación de permisos granulares).
4.  **Fase 4: Frontend Integration** (Interceptor de tokens, manejo de sesión).
5.  **Fase 5: Limpieza y Hardening** (Remover código muerto, auditoría de seguridad).
