# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hospital management system backend (Clínica Mía) built with Hono.js framework, Prisma ORM, and PostgreSQL. Pure JavaScript, no TypeScript.

## Commands

```bash
npm run dev              # Start development server (node server.js)
npm run start            # Start production server
npm run prisma:generate  # Generate Prisma client after schema changes
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio GUI
```

No lint or test commands configured.

## Architecture

**Request Flow:**
```
Route → Middleware (Auth/Permission) → Service → Prisma → Response
```

**Layer Responsibilities:**
- **Routes** (`/routes`): HTTP handlers, no business logic. Call services and return standardized responses.
- **Services** (`/services`): All business logic, validation, and Prisma queries. Exported as singleton instances (`new ServiceClass()`).
- **Middleware** (`/middleware/auth.js`): `authMiddleware` verifies JWT, `permissionMiddleware('module')` checks dynamic permissions from `role_permisos` table.
- **Utils** (`/utils`): Response helpers, JWT/password utilities, validators, custom error classes.

**Database:** Prisma client singleton in `/db/prisma.js`. Schema in `/prisma/schema.prisma`.

## Key Patterns

**Standardized Responses** (from `utils/response.js`):
```javascript
success(c, message, data, statusCode)
error(c, message, details, statusCode)
paginated(c, data, pagination)
```

**Custom Errors** (from `utils/errors.js`):
- `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `AppError`
- Services throw these; routes catch and return via `error()` helper

**Route Pattern:**
```javascript
router.get('/', authMiddleware, permissionMiddleware('module_name'), async (c) => {
  const result = await service.method();
  return success(c, 'Message', result);
});
```

**Service Pattern:**
```javascript
class MyService {
  async method(data) {
    validateRequired(data, ['field1', 'field2']);
    return prisma.table.findMany({ select: { ... } });
  }
}
module.exports = new MyService();
```

## Authentication

- JWT with 7-day expiry via `utils/auth.js`
- Token in `Authorization: Bearer <token>` header
- Password hashing with bcrypt (10 rounds)
- Dynamic permissions via `role_permisos` table (role + module + access boolean)

## Environment Variables

```
DATABASE_URL=postgresql://user:pass@localhost:5432/clinica_mia
JWT_SECRET=your_secret_key
PORT=4000
```

## Module Reference

40+ route/service pairs organized by domain:
- **Auth/Users:** auth, usuarios, roles, doctors
- **Clinical:** pacientes, citas, agenda, departamentos, especialidades
- **Hospitalization:** unidades, habitaciones, camas, admisiones, movimientos, egresos
- **Medical Records:** evoluciones, signos-vitales, diagnosticos, alertas, auditoria
- **Orders:** ordenes-medicas, ordenes-medicamentos, procedimientos, prescripciones, administraciones
- **Billing:** facturas, productos, categorias-productos, paquetes-hospitalizacion
- **Exams:** categorias-examenes, examenes-procedimientos, consultas, interconsultas
