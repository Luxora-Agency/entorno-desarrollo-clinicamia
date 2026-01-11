# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hospital management system backend (Clínica Mía) built with Hono.js framework, Prisma ORM, and PostgreSQL. Pure JavaScript, no TypeScript.

## Commands

```bash
npm run dev              # Start development server on port 4000
npm run prisma:generate  # Generate Prisma client after schema changes
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio GUI
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Running specific tests
npm test -- --testPathPattern=paciente     # Match test file name
npm test -- paciente.service.test.js       # Run single test file
npm test -- tests/unit/                    # Run all unit tests
npm test -- tests/integration/             # Run all integration tests

# Seeders (run from backend/)
node seeders/rolesAndPermissions.js        # Initialize roles and permissions
node run_all_seeds.js                      # Run all seeders sequentially
```

## Architecture

**Request Flow:**
```
Route → Middleware (Auth/Validation/Permission) → Service → Prisma → Response
```

**Layer Responsibilities:**
- **Routes** (`/routes`): HTTP handlers only, no business logic. Call services and return standardized responses.
- **Services** (`/services`): All business logic, validation, and Prisma queries. Exported as singleton instances (`module.exports = new ServiceClass()`).
- **Middleware** (`/middleware`):
  - `auth.js`: `authMiddleware` verifies JWT, `permissionMiddleware('module')` for module access, `requirePermission('resource.action')` for granular RBAC
  - `validate.js`: Zod schema validation - validated data available via `c.req.validData`
- **Validators** (`/validators`): Zod schemas for request validation (e.g., `paciente.schema.js`). Use `.partial()` for update schemas.
- **Utils** (`/utils`): `response.js` (response helpers), `auth.js` (JWT/bcrypt), `errors.js` (custom error classes).

**Database:** Prisma client singleton in `/db/prisma.js`. Schema in `/prisma/schema.prisma`.

**Tests:** Jest with setup in `tests/setup.js`. Organized as `tests/unit/*.test.js` and `tests/integration/*.test.js`.

## Key Patterns

**Standardized Responses** (from `utils/response.js`):
```javascript
// In routes: return c.json(success(data, 'Message'))
success(data, message)       // { success: true, message, data }
error(message, details)      // { success: false, message, details? }
paginated(data, pagination)  // { success: true, data, pagination }
```

**Custom Errors** (from `utils/errors.js`):
- `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `AppError` (500)
- Services throw these; routes catch and return via `error()` helper

**Route Pattern with Validation:**
```javascript
const { validate } = require('../middleware/validate');
const { createSchema } = require('../validators/example.schema');

router.post('/', authMiddleware, permissionMiddleware('module'), validate(createSchema), async (c) => {
  const data = c.req.validData; // Validated and transformed data
  const result = await service.create(data);
  return c.json(success(result, 'Created'), 201);
});
```

**Zod Validator Pattern:**
```javascript
// validators/example.schema.js
const { z } = require('zod');
const createSchema = z.object({
  name: z.string().min(1, 'Required'),
  date: z.string().optional().transform(val => val ? new Date(val) : null),
});
const updateSchema = createSchema.partial(); // All fields optional for updates
module.exports = { createSchema, updateSchema };
```

**Service Pattern:**
```javascript
class MyService {
  async create(data) {
    const existing = await prisma.table.findUnique({ where: { ... } });
    if (existing) throw new ValidationError('Already exists');
    return prisma.table.create({ data });
  }
}
module.exports = new MyService();
```

**IMPORTANT - Hono.js Route Ordering:**
Specific routes must be defined BEFORE dynamic parameter routes, otherwise parameters capture the path segment:
```javascript
// CORRECT ORDER:
router.get('/stats', ...)           // Specific first
router.get('/resumen/:mes/:anio', ...) // Specific with params
router.get('/:id', ...)             // Dynamic last

// WRONG: /:id before /stats would match "stats" as an id
```

## Authentication

- **Access Token (JWT)**: 7-day expiry, sent via `Authorization: Bearer <token>` header or `?token=` query param
- **Refresh Token**: 30-day expiry, stored in `refresh_tokens` table, rotates on each use
- Password hashing with bcrypt (10 rounds)
- Account lockout: 5 failed attempts = 15 minutes lockout
- SUPER_ADMIN role bypasses all permission checks

**Two Permission Systems (coexist):**
- **Legacy**: `permissionMiddleware('module')` checks `role_permisos` table
- **Granular RBAC**: `requirePermission('resource.action')` checks `roles`, `permissions`, `role_permissions`, `user_roles` tables

## Environment Variables

```
DATABASE_URL=postgresql://user:pass@localhost:5432/clinica_mia
JWT_SECRET=your_secret_key
PORT=4000

# OpenAI - AI Medical Assistant (optional)
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-5.2  # or gpt-4o, gpt-4-turbo
```

## AI Medical Assistant

The system includes an AI-powered medical assistant for doctors. Configuration:

**Backend:**
- Service: `/services/openai.service.js` - GPT-5.2 integration with function calling
- Routes: `/routes/ai-assistant.js` - Chat, diagnosis suggestions, prescription checks
- Logging: `AiConversationLog` model for audit trail

**Frontend:**
- Component: `/components/clinica/doctor/AIMedicalAssistant.jsx` - Chat panel
- Component: `/components/clinica/consulta/AIInlineSuggestions.jsx` - Inline hints
- Hook: `/hooks/useAIAssistant.js` - API integration

**Features:**
- CIE-10 diagnosis suggestions via function calling
- Drug interaction detection
- Vital signs analysis with alerts
- SOAP note generation
- Free medical chat

**Endpoints:**
- `GET /ai-assistant/status` - Check if configured
- `POST /ai-assistant/chat` - Chat with assistant
- `POST /ai-assistant/diagnosis-suggestions` - Get diagnosis ideas
- `POST /ai-assistant/check-prescription` - Verify drug safety
- `POST /ai-assistant/analyze-vitals` - Analyze vital signs
- `POST /ai-assistant/generate-soap` - Generate SOAP note

## Test Users

- Admin: admin@clinicamia.com / admin123
- Doctor: doctor@clinicamia.com / doctor123

## Module Domains

80+ route/service pairs organized by domain:
- **Auth/Users:** auth, usuarios, roles, permissions, audit, doctores
- **Clinical:** pacientes, citas, agenda, departamentos, especialidades, consultas, disponibilidad, interconsultas
- **Hospitalization:** unidades, habitaciones, camas, admisiones, movimientos, egresos
- **Medical Records (HCE):** evoluciones, signos-vitales, diagnosticos, alertas, auditoria, hce
- **Orders:** ordenes-medicas, ordenes-medicamentos, procedimientos, prescripciones, administraciones
- **Billing:** facturas, productos, categorias-productos, paquetes-hospitalizacion
- **Emergency/Nursing:** urgencias, notas-enfermeria, glucometrias, balance-liquidos, transfusiones, plantillas-notas
- **Diagnostic:** imagenologia, examenes-procedimientos, categorias-examenes
- **Quality (IPS Colombia):** habilitacion, acreditacion, pamec, eventos-adversos, seguridad-paciente, indicadores-sic, pqrs, comites, vigilancia-salud, documentos-calidad, planes-accion, calidad2
- **Siigo/Accounting:** siigo (config), compras (proveedores, ordenes-compra), contabilidad (asientos, centros-costo), bancos (cuentas, conciliacion, tributario), activos-fijos (depreciacion, mantenimientos), dashboard-financiero (KPIs)
- **MiaPass:** mia-pass, formulario-mia-pass
- **Other:** quirofanos, publicaciones, tickets, ordenes-tienda, candidates, mcp, dashboard, reportes

## Siigo Integration (Facturación Electrónica DIAN)

Integración completa con Siigo Nube para contabilidad y facturación electrónica colombiana.

**Servicios Siigo** (`/services/siigo/`):
- `siigo.service.js` - Inicialización SDK, autenticación
- `customer.siigo.service.js` - Sincronización clientes/pacientes
- `product.siigo.service.js` - Sincronización productos farmacia
- `invoice.siigo.service.js` - Facturación electrónica DIAN (CUFE)
- `creditNote.siigo.service.js` - Notas crédito electrónicas
- `voucher.siigo.service.js` - Recibos de caja
- `journal.siigo.service.js` - Asientos contables
- `accountsPayable.siigo.service.js` - Cuentas por pagar
- `payroll.siigo.service.js` - Contabilización de nómina
- `costCenter.siigo.service.js` - Centros de costo por departamento
- `tax.siigo.service.js` - Retenciones colombianas (UVT 2026: $52,263)

**Rutas Principales:**
- `/siigo` - Configuración y credenciales
- `/compras` - Proveedores, órdenes de compra, facturas proveedor
- `/contabilidad` - Asientos, plan de cuentas, reportes
- `/bancos` - Cuentas bancarias, movimientos, conciliación, tributario
- `/activos-fijos` - Equipos médicos, depreciación, mantenimientos
- `/dashboard-financiero` - KPIs ejecutivos, tendencias, liquidez

**Cron Jobs Financieros** (`/cron/`):
- `depreciacion.js` - Depreciación mensual automática (día 1, 2:00 AM)
- `siigoSync.js` - Sincronización con Siigo (reintentos, verificación DIAN)

**Variables de Entorno Siigo:**
```
SIIGO_USERNAME=email@empresa.com
SIIGO_ACCESS_KEY=tu_access_key
SIIGO_ENVIRONMENT=sandbox  # o production
```

## API Documentation

- Swagger UI: `http://localhost:4000/api-docs`
- Health check: `GET /health`
- Root endpoint: `GET /` (lists all endpoints)
