# Organización del Repositorio - Clínica Mía

Este documento describe la estructura organizacional del monorepo de Clínica Mía.

## 📋 Visión General

**Clínica Mía** es un sistema integral de gestión hospitalaria compuesto por múltiples aplicaciones interconectadas. El repositorio está organizado como un monorepo que contiene:
- 2 aplicaciones frontend (Admin + Usuario)
- 1 backend API
- Documentación técnica y de calidad
- Docker compose para orquestación

**Ubicación**: Ibagué, Tolima, Colombia
**Enfoque**: Sistema de gestión hospitalaria con cumplimiento de estándares IPS Colombia

---

## 🏗️ Proyectos Principales

### 1. Backend API (`/backend`)
**Tecnología**: Hono.js + Prisma ORM + PostgreSQL
**Puerto**: 4000
**Lenguaje**: JavaScript (Pure JS, no TypeScript)

**Descripción**: API REST completa para el sistema hospitalario con más de 60 módulos.

**Características principales**:
- JWT con Access + Refresh tokens (7 días + 30 días)
- Sistema RBAC granular con herencia de roles
- Middleware de autenticación y permisos
- Validación con Zod
- Generación de PDFs (facturas, historias clínicas)
- Exportación a Excel/XML
- AI Medical Assistant (OpenAI GPT-5.2)
- Model Context Protocol (MCP) server para agentes AI
- Cron jobs para tareas programadas
- Auditoría completa de acciones

**Módulos principales**:
- Auth/Users, Clinical, Hospitalization
- Medical Records (HCE), Orders, Billing
- Emergency/Nursing, Diagnostic, Surgery
- Quality Management (IPS Colombia)
- HR/Talent Management, SST
- MiaPass (subscriptions), E-commerce, Reports

**Comandos**:
```bash
cd backend
npm run dev              # Servidor desarrollo
npm run mcp              # MCP server
npm run prisma:generate  # Regenerar Prisma client
npm run prisma:migrate   # Migraciones
npm run prisma:studio    # GUI de base de datos
npm test                 # Tests con Jest
```

**Archivos clave**:
- `server.js` - Punto de entrada
- `prisma/schema.prisma` - Esquema de base de datos
- `routes/` - Endpoints HTTP
- `services/` - Lógica de negocio
- `middleware/` - Auth, validación, auditoría
- `validators/` - Esquemas Zod

---

### 2. Frontend Admin (`/frontend`)
**Tecnología**: Next.js 16 + React 18
**Puerto**: 3000
**Lenguaje**: JavaScript (Pure JS, no TypeScript)

**Descripción**: Panel de administración para personal médico y administrativo.

**Características principales**:
- Dashboard por rol (Doctor, Enfermera, Admin)
- Gestión completa de pacientes y citas
- Historia Clínica Electrónica (HCE) con timeline
- Agenda médica con calendario interactivo
- Módulo de farmacia con inventario
- Imagenología y laboratorio
- Quirófano y cirugías
- Sistema de calidad (Calidad 2.0)
- Talento humano (RRHH)
- Facturación y reportes
- AI Medical Assistant integrado
- Exportación de reportes (Excel, PDF)

**Módulos principales**:
- Admisiones, Consultas, Urgencias
- HCE, Hospitalización, Enfermería
- Farmacia, Laboratorio, Imagenología
- Calidad 2.0 (4 submódulos)
- Usuarios y Roles (RBAC)
- Reportes y Dashboard

**Comandos**:
```bash
cd frontend
npm run dev    # Desarrollo (4GB memoria)
npm run build  # Build producción
npm test       # Tests con Jest
```

**Componentes clave**:
- `components/clinica/` - Módulos de dominio
- `components/ui/` - shadcn/ui components
- `hooks/` - Hooks personalizados (useAuth, usePacientes, etc.)
- `services/api.js` - Cliente HTTP con token refresh
- `constants/` - Constantes del sistema

---

### 3. Frontend Usuario (`/Front_Usuario_ClinicaMia`)
**Tecnología**: Next.js 14 + React 18 + TypeScript (migración gradual)
**Puerto**: 3001
**Lenguaje**: JavaScript + TypeScript

**Descripción**: Sitio web público para pacientes (ProHealth template customizado).

**Características principales**:
- Información pública de la clínica
- Catálogo de departamentos y especialidades
- Perfiles de doctores
- Sistema de citas online (4 pasos)
- Blog de salud
- Galería de instalaciones
- Contacto
- E-commerce de farmacia

**Características estratégicas de Clínica Mía**:
- **Enfermedades Metabólicas**: Contenido especializado validado por endocrinólogo
- **Tiroides y Metabolismo**: Posicionamiento como líder nacional en cáncer de tiroides
- **Cirugía Plástica**: Catálogo de procedimientos
- **Rutas de Atención**: Cumplimiento Resolución 3280
- **Tour Virtual**: Recorrido por instalaciones (quirófanos, salas VIP)
- **Clínica Verde**: Compromiso ambiental (paneles solares)
- **Farmacia Online**: Catálogo con precios en COP

**Comandos**:
```bash
cd Front_Usuario_ClinicaMia
npm run dev    # Desarrollo (puerto 3001)
npm run build  # Build producción
npm run lint   # ESLint
```

**Componentes clave**:
- `src/app/(defaultLayout)/` - Páginas públicas
- `src/app/ui/` - Componentes reutilizables
- `src/app/ui/AppointmentForm/` - Sistema de citas (multi-step)
- `src/app/sass/` - Estilos SCSS

---

## 📁 Documentación y Recursos

### Documentación Técnica (Raíz)
```
CLAUDE.md                                    # Guía principal para Claude Code
README_CLINICA_MIA.md                        # README del proyecto
DEPLOYMENT.md                                # Guía de despliegue
ESTRUCTURA_PROYECTO.md                       # Estructura del proyecto
```

### Documentación de Backend
```
backend/CLAUDE.md                            # Guía específica del backend
backend/AUTH_GUIDE.md                        # Sistema de autenticación
backend/PERMISSIONS_GUIDE.md                 # Sistema RBAC
backend/RESTART_SERVER.md                    # Guía de reinicio
backend/INFRA_ITERACION_8_COMPLETO.md       # Documentación infraestructura
```

### Documentación de Módulos
```
DOCS_DOCTOR_MODULE.md                        # Módulo de doctor
HCE_MODULE_DOCS.md                           # Historia Clínica Electrónica
PLAN_MAESTRO_CLINICA_MIA.md                 # Plan maestro del proyecto
```

### Documentación de Calidad IPS
```
MODULOS_CALIDAD_2.0.md                      # Sistema Calidad 2.0
PLAN_INFRAESTRUCTURA.md                     # Infraestructura hospitalaria
Requerimientos_Modulo_Calidad_IPS_Colombia.docx
```

### Actas y Reportes
```
ACTA_AVANCES_CLIENTE.md                     # Avances con cliente
ACTA_MODULOS.md                             # Acta de módulos
actacalidad2.md                             # Acta Calidad 2.0
actadeentrega.md                            # Acta de entrega
```

### Documentación de Medicamentos
```
MEDICAMENTOS_DEPLOYMENT_CHECKLIST.md        # Checklist despliegue
MEDICAMENTOS_FINAL_STATUS.md                # Estado final
MEDICAMENTOS_IMPLEMENTATION_SUMMARY.md      # Resumen implementación
```

### Directorios de Documentación
```
4. MEDICAMENTOS, DISPOSITIVOS E INSUMOS/   # Docs de medicamentos
5. PROCESOS PRIORITARIOS/                   # Procesos prioritarios
6. HISTORIA CLINICA/                        # Historia clínica
TALENTOHUMANO/                              # Recursos humanos
dotaciones/                                 # Dotaciones
epayco/                                     # Integración pagos
formatosinfraestructura/                    # Formatos infraestructura
mantenimientos/                             # Mantenimientos
pgirasa/                                    # PGIRASA
procesos documentados/                      # Procesos documentados
```

---

## 🐳 Docker y Despliegue

### Docker Compose (`docker-compose.yml`)
Orquesta 3 servicios:
- **postgres**: PostgreSQL 15 Alpine (puerto 5432)
- **backend**: API Hono.js (puerto 4000)
- **frontend**: Panel Admin Next.js (puerto 3000)

**Comandos**:
```bash
./build.sh                # Build imágenes
docker-compose up -d      # Iniciar servicios
docker-compose down       # Detener servicios
```

**Volúmenes**:
- `postgres_data`: Persistencia de base de datos

**Network**: `clinica_network` (bridge)

---

## 🗄️ Base de Datos

**Motor**: PostgreSQL 15
**ORM**: Prisma
**Esquema**: `backend/prisma/schema.prisma`

**Tablas principales** (80+ modelos):
- Usuarios, Roles, Permissions, RefreshTokens
- Pacientes, Citas, Agenda, Disponibilidad
- Doctores, Especialidades, Departamentos
- Consultas, Evoluciones, SignosVitales, Diagnosticos
- OrdenesMedicas, Prescripciones, Administraciones
- Admisiones, Habitaciones, Camas, Movimientos
- Urgencias, NotasEnfermeria, Glucometrias
- Examenes, Procedimientos, Imagenologia
- Facturas, Productos, Pagos
- EventosAdversos, PQRS, IndicadoresSIC
- AuditLogs

**Seeders**:
```bash
cd backend
node seeders/rolesAndPermissions.js   # Roles y permisos
node run_all_seeds.js                 # Todos los seeders
```

---

## 🔧 Configuración de Entorno

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/clinica_mia
JWT_SECRET=your_secret_key
PORT=4000

# Opcional - AI Assistant
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-5.2
```

### Frontend Admin (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Frontend Usuario (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
# Otros según necesidad
```

---

## 👥 Usuarios de Prueba

```
Admin:         admin@clinicamia.com / admin123
Doctor:        doctor@clinicamia.com / doctor123
Recepcionista: recepcion@clinicamia.com / recepcion123
```

---

## 🚀 Quick Start

### Desarrollo Local Completo

**1. Iniciar Base de Datos**:
```bash
docker-compose up -d postgres
```

**2. Iniciar Backend**:
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
node seeders/rolesAndPermissions.js
npm run dev
```

**3. Iniciar Frontend Admin**:
```bash
cd frontend
npm install
npm run dev
```

**4. Iniciar Frontend Usuario** (opcional):
```bash
cd Front_Usuario_ClinicaMia
npm install
npm run dev
```

**Acceso**:
- API: http://localhost:4000
- Admin: http://localhost:3000
- Usuario: http://localhost:3001
- Swagger: http://localhost:4000/api-docs

---

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuarios / Pacientes                      │
└────────────────────┬────────────────────┬───────────────────┘
                     │                    │
          ┌──────────▼─────────┐  ┌──────▼────────────┐
          │ Frontend Usuario   │  │  Frontend Admin   │
          │  (Next.js 14)      │  │  (Next.js 16)     │
          │  Puerto 3001       │  │  Puerto 3000      │
          └──────────┬─────────┘  └──────┬────────────┘
                     │                    │
                     └────────┬───────────┘
                              │
                     ┌────────▼────────────┐
                     │   Backend API       │
                     │   (Hono.js)         │
                     │   Puerto 4000       │
                     └────────┬────────────┘
                              │
                     ┌────────▼────────────┐
                     │   PostgreSQL 15     │
                     │   (Prisma ORM)      │
                     │   Puerto 5432       │
                     └─────────────────────┘
```

### Flujo de Datos

```
Frontend Component → Hook → api.js → Backend Route →
Auth Middleware → Permission Middleware → Service →
Prisma → PostgreSQL
```

---

## 🔑 Características Clave

### Sistema de Autenticación
- JWT dual (Access 7d + Refresh 30d)
- Rotación de refresh tokens
- Account lockout (5 intentos = 15 min)
- RBAC granular con herencia
- Auditoría completa

### Módulos Médicos
- **HCE Completa**: Timeline, evoluciones, diagnósticos
- **Gestión de Citas**: Agenda, disponibilidad, recordatorios
- **Hospitalización**: Admisiones, camas, movimientos
- **Enfermería**: Notas, glucometrías, balance de líquidos
- **Órdenes Médicas**: Medicamentos, procedimientos, exámenes
- **Quirófano**: Programación de cirugías

### Calidad IPS Colombia
- **Habilitación y Acreditación**
- **PAMEC**: Planes de mejoramiento
- **Eventos Adversos**: Reporte y seguimiento
- **PQRS**: Gestión de quejas y reclamos
- **Indicadores SIC**: Métricas de calidad
- **Calidad 2.0**: 4 submódulos especializados

### Integración AI
- **OpenAI GPT-5.2**: Asistente médico
- **MCP Server**: Herramientas para agentes AI
- **HCE Analyzer**: Análisis de documentos médicos

---

## 📦 Tecnologías Principales

### Backend
- **Hono.js**: Framework HTTP ultrarrápido
- **Prisma**: ORM con type-safety
- **Zod**: Validación de esquemas
- **bcrypt**: Hashing de passwords
- **jsonwebtoken**: JWT tokens
- **pdfkit**: Generación de PDFs
- **exceljs**: Exportación Excel
- **node-cron**: Jobs programados

### Frontend
- **Next.js**: Framework React
- **shadcn/ui**: Componentes UI
- **react-hook-form**: Manejo de formularios
- **react-big-calendar**: Calendarios
- **echarts/recharts**: Gráficos
- **swr**: Data fetching
- **sonner**: Notificaciones

---

## 📝 Notas Importantes

### Seguridad
- NUNCA commitear archivos `.env`
- Usar `.auto-claude-security.json` para configuración de seguridad
- Revisar permisos antes de deploy
- Auditoría habilitada en producción

### Desarrollo
- Pure JavaScript (no TypeScript) en backend y frontend admin
- TypeScript opcional en frontend usuario (migración gradual)
- Usar Zod para validación (preferido sobre Joi)
- Seguir patrones establecidos en CLAUDE.md

### Base de Datos
- Siempre crear migraciones para cambios de schema
- Usar seeders para datos iniciales
- Backup regular de `postgres_data`

### Tests
- Tests con Jest en backend y frontend
- Coverage mínimo: 70%
- Tests de integración para flujos críticos

---

## 📞 Información de Contacto

**Clínica Mía**
Ibagué, Tolima, Colombia
📱 324 333 8555
📧 info@clinicamiacolombia.com
📍 Cra. 5 #28-85, Ibagué, Tolima

---

## 🔄 Estado del Proyecto

**Versión**: 1.0.0
**Estado**: En desarrollo activo
**Branch principal**: `main`
**Branch actual**: `feature/procesos-prioritarios-module`

**Últimos cambios**:
- ✅ Módulo de Procesos Prioritarios
- ✅ Sistema Calidad 2.0
- ✅ Talento Humano
- ✅ AI Medical Assistant
- 🔄 Frontend Usuario (en customización)

---

*Documento generado: 2026-01-08*
