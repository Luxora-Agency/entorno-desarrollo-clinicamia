# 🤝 Guía de Contribución - Clínica Mía

¡Gracias por tu interés en contribuir al proyecto Clínica Mía! Esta guía te ayudará a entender cómo trabajamos y cómo puedes contribuir efectivamente.

---

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Estándares de Código](#estándares-de-código)
- [Commits y Pull Requests](#commits-y-pull-requests)
- [Testing](#testing)
- [Documentación](#documentación)

---

## 📜 Código de Conducta

Este proyecto sigue un código de conducta profesional. Se espera que todos los contribuyentes:

- Sean respetuosos y profesionales
- Acepten críticas constructivas
- Se enfoquen en lo mejor para el proyecto
- Mantengan la confidencialidad de información sensible
- Cumplan con estándares médicos y de privacidad (HIPAA, GDPR)

---

## 🚀 ¿Cómo puedo contribuir?

### Reportar Bugs

1. Verificar que el bug no haya sido reportado antes
2. Crear un issue en GitHub con:
   - **Título descriptivo**
   - **Pasos para reproducir**
   - **Comportamiento esperado vs actual**
   - **Screenshots** (si aplica)
   - **Entorno** (OS, versión de Node, navegador)

### Sugerir Mejoras

1. Abrir un issue con el tag `enhancement`
2. Describir claramente la mejora propuesta
3. Explicar por qué sería útil
4. Proporcionar ejemplos de uso

### Contribuir Código

1. Fork del repositorio
2. Crear una rama feature
3. Implementar cambios siguiendo los estándares
4. Escribir/actualizar tests
5. Actualizar documentación
6. Crear Pull Request

---

## 🛠️ Configuración del Entorno

### Prerrequisitos

- Node.js 18+ y npm
- PostgreSQL 15+
- Git
- Docker y Docker Compose (opcional)

### Setup Inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/Luxora-Agency/entorno-desarrollo-clinicamia.git
cd entorno-desarrollo-clinicamia

# 2. Instalar dependencias del backend
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales

# 3. Setup base de datos
npm run prisma:generate
npm run prisma:migrate
node seeders/rolesAndPermissions.js

# 4. Instalar dependencias del frontend
cd ../frontend
npm install
cp .env.local.example .env.local

# 5. Iniciar desarrollo
# Terminal 1 (Backend)
cd backend && npm run dev

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

---

## 🔄 Flujo de Trabajo

### Estrategia de Branching

Usamos **Git Flow** modificado:

```
main            # Producción - solo merges desde develop
├── develop     # Desarrollo - rama principal de desarrollo
    ├── feature/nombre-feature    # Nuevas funcionalidades
    ├── bugfix/nombre-bug         # Corrección de bugs
    ├── hotfix/nombre-hotfix      # Fixes urgentes de producción
    └── refactor/nombre-refactor  # Refactorizaciones
```

### Crear una Nueva Feature

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear rama feature
git checkout -b feature/nombre-descriptivo

# 3. Trabajar en tu feature
# ... hacer cambios ...

# 4. Commit frecuente con mensajes descriptivos
git add .
git commit -m "feat(modulo): descripción del cambio"

# 5. Push a tu rama
git push origin feature/nombre-descriptivo

# 6. Crear Pull Request a develop
```

### Naming de Branches

- `feature/` - Nueva funcionalidad
  - Ejemplo: `feature/patient-timeline`
- `bugfix/` - Corrección de bug
  - Ejemplo: `bugfix/appointment-date-validation`
- `hotfix/` - Fix urgente de producción
  - Ejemplo: `hotfix/critical-auth-vulnerability`
- `refactor/` - Refactorización sin cambio de funcionalidad
  - Ejemplo: `refactor/appointments-service`
- `docs/` - Solo documentación
  - Ejemplo: `docs/update-api-readme`

---

## 💻 Estándares de Código

### JavaScript/ES6+

Usamos **JavaScript puro** (no TypeScript) en backend y frontend admin.

#### Estilo de Código

```javascript
// ✅ CORRECTO

// Usar const/let, nunca var
const paciente = await prisma.paciente.findUnique({ where: { id } });
let contador = 0;

// Arrow functions para callbacks
const pacientes = data.map(p => p.nombre);

// Async/await en lugar de .then()
async function obtenerPaciente(id) {
  try {
    const paciente = await prisma.paciente.findUnique({ where: { id } });
    return paciente;
  } catch (error) {
    throw new ValidationError('Paciente no encontrado');
  }
}

// Destructuring
const { nombre, apellido, cedula } = req.body;

// Template literals
const mensaje = `Paciente ${nombre} ${apellido} registrado exitosamente`;

// Optional chaining
const email = paciente?.contacto?.email;
```

```javascript
// ❌ INCORRECTO

// No usar var
var paciente = getPaciente();

// No usar .then() chains
getPaciente().then(p => {
  return processPaciente(p);
}).then(result => {
  // ...
});

// No concatenar strings
const mensaje = 'Paciente ' + nombre + ' ' + apellido + ' registrado';
```

#### Naming Conventions

- **Variables y funciones**: camelCase
  - `const pacienteActivo = true;`
  - `function obtenerPacientes() {}`

- **Clases**: PascalCase
  - `class PacienteService {}`

- **Constantes**: UPPER_SNAKE_CASE
  - `const MAX_INTENTOS = 5;`

- **Archivos**: kebab-case o camelCase
  - `paciente.service.js`
  - `ordenMedica.service.js`

- **Componentes React**: PascalCase
  - `PacienteForm.jsx`
  - `DashboardDoctor.jsx`

### Backend - Patrones

#### Services (Lógica de Negocio)

```javascript
// services/paciente.service.js
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class PacienteService {
  async create(data) {
    // 1. Validar datos
    const existing = await prisma.paciente.findUnique({
      where: { cedula: data.cedula }
    });
    if (existing) {
      throw new ValidationError('Ya existe un paciente con esta cédula');
    }

    // 2. Crear registro
    const paciente = await prisma.paciente.create({ data });

    // 3. Retornar resultado
    return paciente;
  }

  async findById(id) {
    const paciente = await prisma.paciente.findUnique({
      where: { id: parseInt(id) }
    });
    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }
    return paciente;
  }

  async update(id, data) {
    await this.findById(id); // Verificar existencia
    return prisma.paciente.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async delete(id) {
    await this.findById(id);
    return prisma.paciente.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new PacienteService();
```

#### Routes (HTTP Handlers)

```javascript
// routes/pacientes.js
const { Hono } = require('hono');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createPacienteSchema } = require('../validators/paciente.schema');
const pacienteService = require('../services/paciente.service');
const { success, error } = require('../utils/response');

const router = new Hono();

// IMPORTANTE: Rutas específicas ANTES de rutas con parámetros dinámicos
router.get('/stats', authMiddleware, async (c) => {
  const stats = await pacienteService.getStats();
  return c.json(success(stats, 'Estadísticas obtenidas'));
});

router.get('/:id', authMiddleware, async (c) => {
  try {
    const paciente = await pacienteService.findById(c.req.param('id'));
    return c.json(success(paciente, 'Paciente encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/', authMiddleware, permissionMiddleware('pacientes'), validate(createPacienteSchema), async (c) => {
  try {
    const data = c.req.validData;
    const paciente = await pacienteService.create(data);
    return c.json(success(paciente, 'Paciente creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = router;
```

#### Validators (Zod Schemas)

```javascript
// validators/paciente.schema.js
const { z } = require('zod');

const createPacienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  apellido: z.string().min(1, 'Apellido es requerido'),
  cedula: z.string().min(6, 'Cédula inválida'),
  fechaNacimiento: z.string().transform(val => new Date(val)),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
});

const updatePacienteSchema = createPacienteSchema.partial();

module.exports = {
  createPacienteSchema,
  updatePacienteSchema,
};
```

### Frontend - Patrones

#### Componentes

```javascript
// components/clinica/PacienteCard.jsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePacientes } from '@/hooks/usePacientes';

export default function PacienteCard({ paciente }) {
  const [isEditing, setIsEditing] = useState(false);
  const { updatePaciente } = usePacientes();

  const handleEdit = async () => {
    try {
      await updatePaciente(paciente.id, { /* data */ });
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{paciente.nombre} {paciente.apellido}</h3>
      <p className="text-sm text-gray-600">{paciente.cedula}</p>
      <Button onClick={() => setIsEditing(true)}>Editar</Button>
    </div>
  );
}
```

#### Custom Hooks

```javascript
// hooks/usePacientes.js
import useSWR from 'swr';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function usePacientes(params = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    `/pacientes?${new URLSearchParams(params)}`,
    apiGet
  );

  const createPaciente = async (data) => {
    const result = await apiPost('/pacientes', data);
    mutate(); // Revalidar
    return result;
  };

  const updatePaciente = async (id, data) => {
    const result = await apiPut(`/pacientes/${id}`, data);
    mutate();
    return result;
  };

  const deletePaciente = async (id) => {
    await apiDelete(`/pacientes/${id}`);
    mutate();
  };

  return {
    pacientes: data?.data || [],
    isLoading,
    error,
    createPaciente,
    updatePaciente,
    deletePaciente,
    refresh: mutate,
  };
}
```

---

## 📝 Commits y Pull Requests

### Commit Messages

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]

[footer opcional]
```

**Tipos**:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Solo documentación
- `style`: Cambios de formato (no afectan código)
- `refactor`: Refactorización
- `test`: Agregar o modificar tests
- `chore`: Mantenimiento, deps, config

**Ejemplos**:

```bash
feat(pacientes): agregar filtro por fecha de nacimiento

fix(auth): corregir validación de refresh token expirado

docs(readme): actualizar instrucciones de instalación

refactor(services): simplificar lógica de creación de citas

test(appointments): agregar tests de integración para cancelación

chore(deps): actualizar dependencias de seguridad
```

### Pull Requests

#### Template de PR

```markdown
## Descripción
Breve descripción de los cambios

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha probado?
Describir las pruebas realizadas

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He realizado un self-review de mi código
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan warnings
- [ ] He agregado tests que prueban mi fix/feature
- [ ] Tests nuevos y existentes pasan localmente
- [ ] He actualizado CHANGELOG.md
```

#### Proceso de Review

1. **Asignar reviewers** (al menos 1)
2. **Pasar CI/CD** (tests, linting)
3. **Aprobar por reviewer**
4. **Merge a develop** (squash and merge preferido)

---

## 🧪 Testing

### Backend - Jest

```javascript
// tests/unit/paciente.service.test.js
const pacienteService = require('../../services/paciente.service');
const prisma = require('../../db/prisma');

jest.mock('../../db/prisma');

describe('PacienteService', () => {
  describe('create', () => {
    it('debe crear un paciente exitosamente', async () => {
      const mockData = {
        nombre: 'Juan',
        apellido: 'Pérez',
        cedula: '123456'
      };

      prisma.paciente.findUnique.mockResolvedValue(null);
      prisma.paciente.create.mockResolvedValue({ id: 1, ...mockData });

      const result = await pacienteService.create(mockData);

      expect(result).toHaveProperty('id');
      expect(result.nombre).toBe('Juan');
      expect(prisma.paciente.create).toHaveBeenCalledWith({ data: mockData });
    });

    it('debe lanzar error si cédula ya existe', async () => {
      prisma.paciente.findUnique.mockResolvedValue({ id: 1 });

      await expect(pacienteService.create({ cedula: '123456' }))
        .rejects
        .toThrow('Ya existe un paciente con esta cédula');
    });
  });
});
```

### Ejecutar Tests

```bash
# Backend
cd backend
npm test                    # Todos los tests
npm test -- paciente        # Tests que coincidan con "paciente"
npm run test:watch          # Mode watch
npm run test:coverage       # Con coverage

# Frontend
cd frontend
npm test
```

### Coverage Mínimo

- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

---

## 📚 Documentación

### Comentarios en Código

```javascript
// ✅ CORRECTO - Explicar el "por qué", no el "qué"

// Verificamos si el paciente tiene citas pendientes antes de permitir eliminación
// para mantener integridad referencial y evitar pérdida de datos médicos
const citasPendientes = await prisma.cita.count({
  where: { pacienteId: id, estado: 'PENDIENTE' }
});

// ❌ INCORRECTO - Obvio y redundante

// Obtener el nombre del paciente
const nombre = paciente.nombre;
```

### JSDoc para Funciones Públicas

```javascript
/**
 * Crea un nuevo paciente en el sistema
 *
 * @param {Object} data - Datos del paciente
 * @param {string} data.nombre - Nombre del paciente
 * @param {string} data.apellido - Apellido del paciente
 * @param {string} data.cedula - Cédula de identidad
 * @returns {Promise<Object>} Paciente creado con ID
 * @throws {ValidationError} Si la cédula ya existe
 */
async create(data) {
  // ...
}
```

### README por Módulo

Cada módulo importante debe tener su README:

```
backend/services/README.md
frontend/components/clinica/README.md
```

---

## 🚫 Errores Comunes a Evitar

### Backend

❌ **NO hacer**:
- Lógica de negocio en routes
- Queries de Prisma directas en routes
- Hardcodear valores (usar constantes/env)
- Ignorar validación de entrada
- Exponer stack traces en producción
- Commits con archivos .env

✅ **SÍ hacer**:
- Toda lógica en services
- Usar middlewares para validación
- Custom errors para casos específicos
- Logs estructurados
- Sanitizar inputs
- Usar .env.example

### Frontend

❌ **NO hacer**:
- Llamadas fetch directas (usar api.js)
- Hardcodear URLs del backend
- Componentes muy grandes (>300 líneas)
- Inline styles extensos
- Mutación directa de state
- Keys incorrectas en listas

✅ **SÍ hacer**:
- Usar custom hooks para lógica reutilizable
- Componentes pequeños y enfocados
- TailwindCSS para estilos
- PropTypes o validación
- Memoización cuando sea necesario
- Keys únicas y estables en listas

---

## 🔐 Seguridad

### Nunca Commitear

- ❌ Archivos `.env`
- ❌ API keys, passwords, secrets
- ❌ Certificados, private keys
- ❌ Datos de pacientes reales
- ❌ Credenciales de base de datos
- ❌ Tokens de acceso

### Siempre

- ✅ Validar entrada de usuario
- ✅ Sanitizar queries SQL
- ✅ Usar prepared statements (Prisma ya lo hace)
- ✅ Implementar rate limiting
- ✅ Logs de auditoría para acciones sensibles
- ✅ Cifrar datos sensibles
- ✅ HTTPS en producción

---

## 📞 ¿Necesitas Ayuda?

- 📖 [CLAUDE.md](CLAUDE.md) - Documentación principal
- 📖 [ORGANIZACION_REPOSITORIO.md](ORGANIZACION_REPOSITORIO.md) - Estructura del proyecto
- 💬 Slack del equipo - Canal #clinica-mia-dev
- 📧 Email - dev@luxora-agency.com
- 🐛 Issues - https://github.com/Luxora-Agency/entorno-desarrollo-clinicamia/issues

---

## 📜 Licencia

Este proyecto es privado y confidencial. Todos los derechos reservados © Clínica Mía 2026.

---

<p align="center">
  <strong>¡Gracias por contribuir al proyecto Clínica Mía!</strong> 💙
</p>
