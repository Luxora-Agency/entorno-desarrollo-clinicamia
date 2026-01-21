# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hospital management system (Clínica Mía) with a Next.js 16 frontend and Hono.js backend, using PostgreSQL with Prisma ORM. Pure JavaScript throughout (no TypeScript). Timezone is America/Bogota (Colombia).

## Commands

**Frontend (`/frontend`):**
```bash
npm run dev              # Dev server on port 3000 (with 4GB memory limit)
npm run build            # Production build
npm test                 # Run Jest tests
```

**Backend (`/backend`):**
```bash
npm run dev              # Start server (node server.js) on port 4000
npm run mcp              # Start MCP server for AI agent tools (Model Context Protocol)
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma visual database editor
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

**Running Specific Tests:**
```bash
cd backend && npm test -- --testPathPattern=paciente     # Match test file name
cd backend && npm test -- paciente.service.test.js       # Run single test file
cd frontend && npm test -- --testPathPattern=component   # Match frontend test
```

**Seeders:**
```bash
cd backend && node seeders/rolesAndPermissions.js   # Initialize roles and permissions
cd backend && node run_all_seeds.js                 # Run all seeders sequentially
```

**Docker:**
```bash
./build.sh               # Build both images
docker-compose up -d     # Start all services
```

## Architecture

### Request Flow
```
Frontend Component → Hook → api.js → Backend Route → Auth Middleware → Permission Middleware → Service → Prisma → PostgreSQL
```

### Backend (`/backend`)
- **Routes** (`/routes`): HTTP handlers only, call services and return standardized responses. Routes mounted in `server.js`
  - **CRITICAL**: Hono.js requires specific routes BEFORE dynamic param routes (e.g., `/stats` before `/:id`)
  - All 84+ route files are imported and mounted in `server.js` - check there for route organization
- **Services** (`/services`): Business logic, validation, Prisma queries. Exported as singleton instances (`module.exports = new ServiceClass()`)
- **Middleware** (`/middleware`):
  - `auth.js`: `authMiddleware` verifies JWT (header or query param), `permissionMiddleware('module')` checks dynamic permissions, `requirePermission('resource.action')` for granular RBAC
  - `validate.js`: Zod schema validation middleware - validated data available via `c.req.validData`
  - `audit.js`: Audit logging middleware
- **Validators** (`/validators`): Zod schemas for request validation (e.g., `paciente.schema.js`). Use `.partial()` for update schemas
- **Utils** (`/utils`): `response.js` (response helpers), `auth.js` (JWT/bcrypt), `validators.js` (simple validators), `errors.js` (custom error classes)
- **Database**: Prisma client singleton in `/db/prisma.js`, schema in `/prisma/schema.prisma`
- **Seeders** (`/seeders`): Database seed scripts organized by domain (catalogs, calidad, roles, etc.)
- **See** `backend/CLAUDE.md` for backend-specific details and patterns

### Frontend (`/frontend`)
- **Components**: `/components/ui` (shadcn/ui), `/components/clinica` (domain modules)
- **Hooks**: `/hooks` - `useAuth`, `useApi`, `usePacientes`, `useCitas`, `useFarmacia`, `useImagenologia`, etc.
- **Services**: `/services/api.js` (centralized HTTP client with auto token refresh and 401 retry queue)
- **Constants**: `/constants` - `roles.js`, `estados.js`, `colors.js`
- **Data**: `/data` - Static JSON files (e.g., `colombia.json` for geographic data)
- **Schemas**: `/schemas` - Zod validation schemas for forms

## Key Patterns

### Backend Route with Validation
```javascript
const { validate } = require('../middleware/validate');
const { createPacienteSchema } = require('../validators/paciente.schema');
const { success, error } = require('../utils/response');

router.post('/', authMiddleware, permissionMiddleware('pacientes'), validate(createPacienteSchema), async (c) => {
  try {
    const data = c.req.validData; // Validated and transformed data
    const result = await pacienteService.create(data);
    return c.json(success(result, 'Paciente creado'), 201);
  } catch (err) {
    return c.json(error(err.message, err.details), err.statusCode || 500);
  }
});
```

### Backend Service Pattern
```javascript
const { ValidationError, NotFoundError } = require('../utils/errors');

class MyService {
  async create(data) {
    const existing = await prisma.table.findUnique({ where: { ... } });
    if (existing) throw new ValidationError('Ya existe');
    return prisma.table.create({ data });
  }
}
module.exports = new MyService();
```

### Custom Errors (from `utils/errors.js`)
- `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `AppError` (500)
- Services throw these; routes catch and return via `error()` helper

### Standardized Response Format (from `utils/response.js`)
```javascript
// Success: { success: true, message: string, data: any }
success(data, message)       // Return from routes: c.json(success(...))

// Paginated: { success: true, data: [], pagination: { page, limit, total, totalPages } }
paginated(data, pagination)  // Return: c.json(paginated(...))

// Error: { success: false, message: string, details?: any }
error(message, details)      // Return: c.json(error(...), statusCode)
```

### Frontend API Usage
```javascript
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/services/api';

const pacientes = await apiGet('/pacientes', { limit: 50 });
const nuevo = await apiPost('/pacientes', { nombre: 'Juan', ... });

// Token management functions:
// setTokens(accessToken, refreshToken), clearTokens(), getAuthToken()

// Token refresh is automatic - failed requests during refresh are queued
// and retried once new token is obtained
```

### Frontend Hook Pattern
```javascript
const { user, login, logout, isAuthenticated } = useAuth();
```

### Zod Validator Pattern
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

## Authentication

- **Access Token (JWT)**: 7-day expiration, sent via `Authorization: Bearer <token>` header or `?token=` query param
- **Refresh Token**: 30-day expiration, stored in `refresh_tokens` table, rotates on each use
- Token refresh handled automatically by frontend interceptor in `api.js` (queues failed requests during refresh)
- Password hashing with bcrypt (10 rounds)
- Account lockout: 5 failed attempts = 15 minutes lockout

### Permission System
Two permission systems coexist (legacy + new RBAC):
- **Legacy**: `permissionMiddleware('module')` checks `role_permisos` table (role + module + access boolean)
- **Granular RBAC**: `requirePermission('resource.action')` checks `roles`, `permissions`, `role_permissions`, `user_roles` tables
- SUPER_ADMIN role bypasses all permission checks
- Roles support hierarchy (inheritance from parent roles)
- **See** `backend/AUTH_GUIDE.md` and `backend/PERMISSIONS_GUIDE.md` for detailed documentation

## Roles

`SUPER_ADMIN`, `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PATIENT`, `PHARMACIST`, `LAB_TECHNICIAN`

## Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/clinica_mia
JWT_SECRET=your_secret_key
PORT=4000

# OpenAI - AI Medical Assistant (optional)
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-5.2  # or gpt-4o, gpt-4-turbo
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Test Users

- Admin: admin@clinicamia.com / admin123
- Doctor: doctor@clinicamia.com / doctor123
- Receptionist: recepcion@clinicamia.com / recepcion123

## AI Medical Assistant

Optional AI-powered medical assistant for doctors (requires OpenAI API key). Features CIE-10 diagnosis suggestions, drug interaction detection, vital signs analysis, and SOAP note generation.

**Backend**: `/routes/ai-assistant.js`, `/services/openai.service.js`
**Frontend**: `/components/clinica/doctor/AIMedicalAssistant.jsx`, `/hooks/useAIAssistant.js`
**Endpoints**: `/ai-assistant/status`, `/chat`, `/diagnosis-suggestions`, `/check-prescription`, `/analyze-vitals`, `/generate-soap`

## API Documentation

- Swagger UI: `http://localhost:4000/api-docs`
- Swagger JSON: `http://localhost:4000/swagger.json`
- Health check: `GET /health` (returns database connection status)
- Root endpoint: `GET /` (lists all available endpoints)

## Testing

Backend tests use Jest with setup in `tests/setup.js`. Test files organized in `tests/unit/` and `tests/integration/`. Frontend tests use Jest + React Testing Library with setup in `jest.setup.js`.

## API Structure

**Public Routes** (no auth required):
- `/public/*` - Public endpoints
- `/api/v1/*` - Public API for patient-facing frontend (appointments, doctors, blog, shop)
- `/payments/*` - ePayco payment webhooks

**Protected Routes** (require auth):
All other routes require `authMiddleware` and optionally `permissionMiddleware` or `requirePermission`.

## Module Domains

Backend has 84+ route/service pairs organized by domain. Check `backend/server.js` for the complete route mounting. Main domains:
- **Clinical**: pacientes, citas, agenda, consultas, departamentos, especialidades, disponibilidad, interconsultas
- **Hospitalization**: unidades, habitaciones, camas, admisiones, movimientos, egresos
- **Medical Records (HCE)**: evoluciones, signos-vitales, diagnosticos, alertas, auditoria, hce, hce-analyzer
- **Nursing/Emergency**: urgencias, notas-enfermeria, glucometrias, balance-liquidos, transfusiones
- **Diagnostic**: imagenologia, laboratorio, examenes-procedimientos
- **Pharmacy/Billing**: facturas, productos, ordenes-medicamentos, prescripciones, administraciones
- **Quality (IPS Colombia)**: habilitacion, acreditacion, pamec, eventos-adversos, calidad2 (comprehensive module)
- **Siigo/Accounting**: siigo, compras, contabilidad, bancos, activos-fijos, dashboard-financiero
- **Other**: ai-assistant, mcp, quirofano, ordenes-tienda, mia-pass, publicaciones, tickets

## Siigo Integration (Facturación Electrónica DIAN)

Integración con Siigo Nube para contabilidad y facturación electrónica colombiana. Services in `/backend/services/siigo/` handle invoicing, credit notes, customer/product sync, accounting entries, and Colombian tax withholdings (UVT 2026: $52,263).

**Routes**: `/siigo`, `/compras`, `/contabilidad`, `/bancos`, `/activos-fijos`, `/dashboard-financiero`

**Cron Jobs** (`/backend/cron/`): `depreciacion.js` (monthly), `siigoSync.js` (sync with retries)

**Environment Variables:**
```
SIIGO_USERNAME=email@empresa.com
SIIGO_ACCESS_KEY=tu_access_key
SIIGO_ENVIRONMENT=sandbox  # or production
```

## Ports

- Frontend: 3000
- Backend: 4000
- PostgreSQL: 5432

## Key Libraries

**Backend:** `hono` (HTTP), `@prisma/client` (ORM), `zod`/`joi` (validation - prefer zod), `pdfkit`/`exceljs` (exports), `date-fns`, `openai`, `node-cron`

**Frontend:** `next` 16, `react-big-calendar`, `echarts-for-react`/`recharts`, `react-hook-form` + `zod`, `swr`, `sonner` (toasts), `cmdk`, `@radix-ui/*` (shadcn/ui)

## Important Notes

### Route Mounting Order (Hono.js)
**CRITICAL**: Specific routes MUST come before dynamic parameter routes in `server.js`:
```javascript
// CORRECT: /stats before /:id
app.route('/pacientes/stats', statsRoute);
app.route('/pacientes/:id', byId);
// WRONG: /:id would match "stats" as an id
```

### Cron Jobs
Scheduled tasks in `backend/cron/` managed by `node-cron`, registered in `server.js`.

### Model Context Protocol (MCP)
MCP server (`backend/mcp/index.js`) exposes AI-friendly tools for medical data access. Start with `npm run mcp`.

### Catalogs Integration
Colombian healthcare catalogs: **CUPS** (procedures), **CIE-10/CIE-11** (diagnoses). Search components in `frontend/components/ui/CatalogSearch.jsx`.

### Quality Management (Calidad 2.0)
Colombian IPS compliance system with modules for: Historia Clínica (audits, consents), Medicamentos (farmacovigilancia), Procesos Prioritarios (protocols, indicators), Talento Humano (training, certifications). See `/routes/calidad2/`.

### Frontend Token Refresh
`api.js` implements automatic token refresh with request queuing - failed 401 requests are queued during refresh and retried automatically.
