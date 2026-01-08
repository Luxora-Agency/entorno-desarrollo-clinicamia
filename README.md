# 🏥 Clínica Mía - Sistema Integral de Gestión Hospitalaria

Sistema completo de gestión hospitalaria desarrollado para **Clínica Mía** en Ibagué, Tolima, Colombia. Incluye panel de administración, sitio web público para pacientes, y una API REST robusta con más de 60 módulos médicos y administrativos.

[![Estado](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)](https://github.com/Luxora-Agency/entorno-desarrollo-clinicamia)
[![License](https://img.shields.io/badge/License-Privado-red)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Hono.js](https://img.shields.io/badge/Hono.js-4.6-orange)](https://hono.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)

---

## 📋 Descripción General

**Clínica Mía** es un sistema hospitalario integral que cumple con los estándares IPS de Colombia, diseñado para gestionar todos los aspectos de una institución de salud moderna:

- ✅ Historia Clínica Electrónica (HCE) completa
- ✅ Gestión de citas y agenda médica
- ✅ Sistema de hospitalización y urgencias
- ✅ Farmacia con inventario inteligente
- ✅ Laboratorio e imagenología
- ✅ Quirófano y cirugías programadas
- ✅ Sistema de calidad IPS (Calidad 2.0)
- ✅ Talento Humano y SST
- ✅ Facturación y reportes
- ✅ AI Medical Assistant integrado
- ✅ E-commerce para pacientes

---

## 🏗️ Arquitectura del Proyecto

Este es un **monorepo** que contiene 3 aplicaciones principales:

```
clinica-mia/
├── backend/                    # API REST (Hono.js + Prisma + PostgreSQL)
├── frontend/                   # Panel Admin (Next.js 16)
├── Front_Usuario_ClinicaMia/   # Sitio Público (Next.js 14)
└── docker-compose.yml          # Orquestación de servicios
```

### 1. 🔧 Backend API
**Tecnología**: Hono.js + Prisma ORM + PostgreSQL
**Puerto**: 4000
**Lenguaje**: JavaScript (Pure JS)

API REST completa con más de 60 módulos médicos y administrativos.

**Características**:
- JWT con Access + Refresh tokens (7d + 30d)
- Sistema RBAC granular con herencia de roles
- Validación con Zod
- Generación de PDFs y Excel
- AI Medical Assistant (OpenAI GPT-5.2)
- Model Context Protocol (MCP) server
- Cron jobs para tareas programadas
- Auditoría completa de acciones

📖 [Ver documentación del Backend](backend/CLAUDE.md)

### 2. 💻 Frontend Admin
**Tecnología**: Next.js 16 + React 18
**Puerto**: 3000
**Lenguaje**: JavaScript (Pure JS)

Panel de administración para personal médico y administrativo.

**Módulos principales**:
- Dashboard por rol (Doctor, Enfermera, Admin)
- Gestión de pacientes y HCE con timeline
- Agenda médica interactiva
- Farmacia, laboratorio, imagenología
- Quirófano y hospitalización
- Sistema de calidad (Calidad 2.0)
- Talento humano y SST
- Facturación y reportes

📖 [Ver documentación del Frontend Admin](CLAUDE.md)

### 3. 🌐 Frontend Usuario
**Tecnología**: Next.js 14 + React 18 + TypeScript
**Puerto**: 3001
**Lenguaje**: JavaScript + TypeScript (migración gradual)

Sitio web público para pacientes basado en el template ProHealth.

**Características**:
- Sistema de citas online (4 pasos)
- Catálogo de departamentos y especialidades
- Perfiles de doctores
- Blog de salud
- Tour virtual de instalaciones
- E-commerce de farmacia

📖 [Ver documentación del Frontend Usuario](Front_Usuario_ClinicaMia/CLAUDE.md)

---

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+ y npm
- PostgreSQL 15+
- Docker y Docker Compose (opcional)

### Opción 1: Con Docker (Recomendado)

```bash
# 1. Clonar repositorio
git clone https://github.com/Luxora-Agency/entorno-desarrollo-clinicamia.git
cd entorno-desarrollo-clinicamia

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Iniciar con Docker
./build.sh
docker-compose up -d

# 4. Ejecutar migraciones y seeders
docker exec -it clinica_mia_backend npm run prisma:migrate
docker exec -it clinica_mia_backend node seeders/rolesAndPermissions.js
```

### Opción 2: Desarrollo Local

#### 1. Base de Datos
```bash
# Iniciar PostgreSQL
docker-compose up -d postgres
```

#### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales

npm run prisma:generate
npm run prisma:migrate
node seeders/rolesAndPermissions.js
npm run dev
```

#### 3. Frontend Admin
```bash
cd frontend
npm install
cp .env.example .env.local
# Editar .env.local

npm run dev
```

#### 4. Frontend Usuario (Opcional)
```bash
cd Front_Usuario_ClinicaMia
npm install
npm run dev
```

### Acceso a las Aplicaciones

| Aplicación | URL | Credenciales |
|------------|-----|--------------|
| **API Backend** | http://localhost:4000 | - |
| **Swagger Docs** | http://localhost:4000/api-docs | - |
| **Frontend Admin** | http://localhost:3000 | admin@clinicamia.com / admin123 |
| **Frontend Usuario** | http://localhost:3001 | - |
| **Prisma Studio** | http://localhost:5555 | Ejecutar: `npm run prisma:studio` |

---

## 📚 Documentación

- 📖 **[CLAUDE.md](CLAUDE.md)** - Guía principal para desarrollo
- 📖 **[ORGANIZACION_REPOSITORIO.md](ORGANIZACION_REPOSITORIO.md)** - Estructura organizacional completa
- 📖 **[Backend/CLAUDE.md](backend/CLAUDE.md)** - Documentación del backend
- 📖 **[Backend/AUTH_GUIDE.md](backend/AUTH_GUIDE.md)** - Sistema de autenticación
- 📖 **[Backend/PERMISSIONS_GUIDE.md](backend/PERMISSIONS_GUIDE.md)** - Sistema RBAC
- 📖 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía de despliegue
- 📖 **[MODULOS_CALIDAD_2.0.md](MODULOS_CALIDAD_2.0.md)** - Sistema de calidad IPS

---

## 🛠️ Tecnologías Principales

### Backend
![Hono.js](https://img.shields.io/badge/Hono.js-4.6-orange)
![Prisma](https://img.shields.io/badge/Prisma-5.16-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933)

- **Hono.js** - Framework HTTP ultrarrápido
- **Prisma** - ORM con type-safety
- **PostgreSQL** - Base de datos relacional
- **Zod** - Validación de esquemas
- **JWT** - Autenticación y autorización
- **pdfkit** - Generación de PDFs
- **exceljs** - Exportación Excel
- **OpenAI** - AI Medical Assistant
- **node-cron** - Jobs programados

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC)

- **Next.js 16** - Framework React (Frontend Admin)
- **Next.js 14** - Framework React (Frontend Usuario)
- **shadcn/ui** - Componentes UI (Admin)
- **Bootstrap 5** - Framework CSS (Usuario)
- **React Hook Form** - Manejo de formularios
- **react-big-calendar** - Calendario médico
- **echarts/recharts** - Visualización de datos
- **SWR** - Data fetching y caché

### DevOps
![Docker](https://img.shields.io/badge/Docker-20.10-2496ED)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI/CD-2088FF)

- **Docker & Docker Compose** - Containerización
- **GitHub Actions** - CI/CD
- **Jest** - Testing framework

---

## 📊 Módulos del Sistema

### Módulos Médicos
- 👥 **Pacientes** - Registro y gestión de pacientes
- 📅 **Citas** - Agendamiento y seguimiento de citas
- 📋 **HCE** - Historia Clínica Electrónica completa
- 🏥 **Consultas** - Registro de consultas médicas
- 🚑 **Urgencias** - Gestión de emergencias
- 🛏️ **Hospitalización** - Admisiones, camas, movimientos
- 💊 **Farmacia** - Inventario y dispensación
- 🔬 **Laboratorio** - Órdenes y resultados
- 📸 **Imagenología** - Estudios de imágenes
- ⚕️ **Quirófano** - Programación de cirugías

### Módulos Administrativos
- 👨‍⚕️ **Doctores** - Gestión de personal médico
- 🏢 **Departamentos** - Organización por departamentos
- 💰 **Facturación** - Generación de facturas
- 📊 **Reportes** - Reportes y estadísticas
- 👤 **Usuarios y Roles** - Sistema RBAC completo
- 📝 **Auditoría** - Trazabilidad de acciones

### Módulos de Calidad IPS
- ✅ **Habilitación** - Cumplimiento normativo
- 🏆 **Acreditación** - Estándares de calidad
- 📈 **PAMEC** - Planes de mejoramiento
- ⚠️ **Eventos Adversos** - Reporte y seguimiento
- 📬 **PQRS** - Quejas, reclamos y sugerencias
- 📊 **Indicadores SIC** - Métricas de calidad
- 📚 **Calidad 2.0** - Sistema completo (4 submódulos)

### Módulos Adicionales
- 👥 **Talento Humano** - Gestión de RRHH
- 🦺 **SST** - Salud y Seguridad en el Trabajo
- 🎫 **MiaPass** - Programa de suscripciones
- 🛒 **E-commerce** - Tienda online
- 🤖 **AI Assistant** - Asistente médico con IA

---

## 🧪 Testing

```bash
# Backend
cd backend
npm test                 # Todos los tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Coverage report

# Frontend Admin
cd frontend
npm test

# Frontend Usuario
cd Front_Usuario_ClinicaMia
npm test
```

---

## 🔒 Seguridad

El sistema implementa múltiples capas de seguridad:

- ✅ **JWT con tokens de acceso y refresco** (7d + 30d)
- ✅ **Rotación automática de refresh tokens**
- ✅ **Sistema RBAC granular** con herencia de roles
- ✅ **Account lockout** (5 intentos = 15 min)
- ✅ **Auditoría completa** de todas las acciones críticas
- ✅ **Validación de entrada** con Zod en todas las rutas
- ✅ **Hashing de passwords** con bcrypt (10 rounds)
- ✅ **HTTPS en producción**
- ✅ **Protección CSRF**
- ✅ **Rate limiting**

📖 [Ver guía de autenticación completa](backend/AUTH_GUIDE.md)

---

## 🌍 Variables de Entorno

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/clinica_mia
JWT_SECRET=your_secret_key_here
PORT=4000

# OpenAI (Opcional)
OPENAI_API_KEY=sk-your-api-key
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
```

---

## 👥 Usuarios de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| **Administrador** | admin@clinicamia.com | admin123 |
| **Doctor** | doctor@clinicamia.com | doctor123 |
| **Recepcionista** | recepcion@clinicamia.com | recepcion123 |

---

## 🤝 Contribución

Este es un proyecto privado para **Clínica Mía**. Para contribuir:

1. Crear una rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit cambios: `git commit -m 'Añadir nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request para revisión

---

## 📝 Roadmap

### ✅ Completado
- [x] Sistema de autenticación JWT con refresh tokens
- [x] Sistema RBAC granular con herencia
- [x] Módulos médicos principales (HCE, Citas, Agenda)
- [x] Sistema de farmacia con inventario
- [x] Laboratorio e imagenología
- [x] Sistema de calidad IPS (Calidad 2.0)
- [x] AI Medical Assistant con OpenAI
- [x] Generación de PDFs y reportes
- [x] Frontend admin responsive
- [x] Sistema de auditoría completo

### 🔄 En Desarrollo
- [ ] Frontend usuario (customización ProHealth)
- [ ] E-commerce de farmacia
- [ ] Tour virtual de instalaciones
- [ ] Integración con pasarelas de pago
- [ ] Notificaciones push y SMS
- [ ] App móvil para pacientes

### 📋 Planeado
- [ ] Integración con RIPS (Resolución 3374 de 2000)
- [ ] Integración con sistema de pagos EPS
- [ ] Telemedicina (videoconsultas)
- [ ] Firma digital de documentos médicos
- [ ] Dashboard ejecutivo avanzado
- [ ] Machine Learning para predicción de demanda

---

## 📞 Contacto

**Clínica Mía**
📍 Cra. 5 #28-85, Ibagué, Tolima, Colombia
📱 324 333 8555
📧 info@clinicamiacolombia.com
🌐 [clinicamiacolombia.com](https://clinicamiacolombia.com)

**Desarrollo por**: [Luxora Agency](https://github.com/Luxora-Agency)

---

## 📄 Licencia

Este proyecto es de código propietario y está bajo licencia privada de **Clínica Mía**. Todos los derechos reservados.

---

## 🙏 Agradecimientos

- Equipo médico de Clínica Mía por su colaboración
- Luxora Agency por el desarrollo
- Comunidad de open source por las herramientas utilizadas

---

<p align="center">
  Desarrollado con ❤️ por <a href="https://github.com/Luxora-Agency">Luxora Agency</a>
</p>

<p align="center">
  <sub>Clínica Mía - Ibagué, Tolima, Colombia - 2026</sub>
</p>
