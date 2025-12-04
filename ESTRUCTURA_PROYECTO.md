# 📁 Estructura del Proyecto - Clínica Mía

## 🎯 Separación de Responsabilidades

El proyecto está completamente separado en **Backend** y **Frontend**:

```
/app
├── backend/                    # 🔧 API con Hono.js (Puerto 4000)
│   ├── db/
│   │   └── index.js           # Conexión PostgreSQL y schemas
│   ├── models/                # 📊 MODELOS (Capa de datos)
│   │   ├── Usuario.js         # Modelo de Usuario
│   │   ├── Paciente.js        # Modelo de Paciente
│   │   └── Cita.js            # Modelo de Cita
│   ├── routes/                # 🛣️ Rutas de la API
│   │   ├── auth.js            # Autenticación
│   │   ├── pacientes.js       # Gestión de pacientes
│   │   └── citas.js           # Gestión de citas
│   ├── middleware/            # 🔒 Middlewares
│   │   └── auth.js            # Autenticación y roles
│   └── server.js              # 🚀 Servidor principal
│
├── app/                        # 🎨 Frontend con Next.js (Puerto 3000)
│   ├── page.js                # Página principal
│   └── layout.js              # Layout de Next.js
│
├── components/                # 🧩 Componentes React
│   ├── clinica/              # Componentes específicos
│   │   ├── Login.jsx         # Página de login
│   │   ├── Dashboard.jsx     # Dashboard principal
│   │   ├── Sidebar.jsx       # Barra lateral
│   │   ├── DashboardHome.jsx # Home del dashboard
│   │   ├── PacientesModule.jsx # Módulo de pacientes
│   │   └── CitasModule.jsx   # Módulo de citas
│   └── ui/                   # Componentes shadcn/ui
│
├── public/                    # 📸 Archivos públicos
│   └── clinica-mia-logo.png  # Logo oficial
│
├── .env                       # ⚙️ Variables de entorno
├── package.json              # 📦 Dependencias
└── README_CLINICA_MIA.md     # 📖 Documentación
```

---

## 🔧 Backend (Hono.js + PostgreSQL)

### Arquitectura de 3 Capas

#### 1. **Capa de Modelos** (`/backend/models/`)
Abstrae toda la lógica de base de datos. **NO se usan queries directas en las rutas**.

**Usuario.js**
```javascript
class Usuario {
  static async findAll({ search, page, limit })
  static async findById(id)
  static async findByEmail(email)
  static async create(data)
  static async update(id, data)
  static async delete(id)
  static async verifyPassword(plain, hashed)
}
```

**Paciente.js**
```javascript
class Paciente {
  static async findAll({ search, page, limit })
  static async findById(id)
  static async findByCedula(cedula)
  static async create(data)
  static async update(id, data)
  static async delete(id)  // Soft delete
}
```

**Cita.js**
```javascript
class Cita {
  static async findAll({ fecha, estado, page, limit })
  static async findById(id)
  static async findByDoctor(doctorId, fecha)
  static async create(data)
  static async update(id, data)
  static async cancel(id)
}
```

#### 2. **Capa de Rutas** (`/backend/routes/`)
Maneja las peticiones HTTP y usa los modelos para operaciones de datos.

```javascript
// Ejemplo: routes/pacientes.js
const Paciente = require('../models/Paciente');

pacientes.get('/', async (c) => {
  const result = await Paciente.findAll(c.req.query());
  return c.json({ pacientes: result.pacientes, ... });
});
```

#### 3. **Capa de Base de Datos** (`/backend/db/`)
Configuración de PostgreSQL y definición de schemas.

---

## 🎨 Frontend (Next.js + React)

### Componentes Modulares

**Login** → Usuario ingresa credenciales
↓
**Dashboard** → Contenedor principal con Sidebar
↓
**Módulos**:
- `DashboardHome` - Estadísticas generales
- `PacientesModule` - CRUD de pacientes
- `CitasModule` - Agenda de citas

### Comunicación con Backend

```javascript
// Todas las peticiones van a http://localhost:4000
const response = await fetch('http://localhost:4000/pacientes', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 🔑 Ventajas de esta Arquitectura

### ✅ Backend con Modelos

**Antes** (queries directas):
```javascript
// ❌ Mal - Query directo en ruta
pacientes.get('/', async (c) => {
  const result = await pool.query('SELECT * FROM pacientes WHERE activo = true');
  return c.json(result.rows);
});
```

**Ahora** (con modelos):
```javascript
// ✅ Bien - Usando modelo
pacientes.get('/', async (c) => {
  const result = await Paciente.findAll(c.req.query());
  return c.json(result);
});
```

**Beneficios**:
1. ✅ **Reutilización**: El mismo modelo se usa en múltiples rutas
2. ✅ **Mantenibilidad**: Cambios en queries solo se hacen una vez
3. ✅ **Testeable**: Fácil de probar modelos independientemente
4. ✅ **Validación centralizada**: Toda la lógica de negocio en un lugar
5. ✅ **Abstracción**: Las rutas no necesitan saber cómo funcionan las queries

### ✅ Separación Backend/Frontend

**Beneficios**:
1. ✅ **Escalabilidad**: Pueden desplegarse por separado
2. ✅ **Desarrollo paralelo**: Equipos pueden trabajar independientemente
3. ✅ **Tecnología independiente**: Se puede cambiar uno sin afectar el otro
4. ✅ **API RESTful**: Backend puede servir múltiples clientes (web, móvil, etc.)
5. ✅ **Deployment flexible**: Backend en un servidor, frontend en CDN

---

## 🚀 Despliegue

### Backend (Puerto 4000)
```bash
cd /app/backend
DATABASE_URL="..." JWT_SECRET="..." node server.js
```

### Frontend (Puerto 3000)
```bash
cd /app
yarn dev
```

### Ambos servicios (Supervisor)
```bash
supervisorctl restart all
```

---

## 🎨 Logo de Clínica Mía

El logo oficial está en `/app/public/clinica-mia-logo.png` y se usa en:
- Página de login
- Sidebar del dashboard
- Favicon (potencial)

**Colores del logo**:
- Verde teal: `#4ECDC4` - Principal
- Azul marino: `#1A3A52` - Texto
- Amarillo dorado: `#FFD700` - Acento

---

## 📝 Próximos Pasos

1. **Separar completamente**: Mover frontend a carpeta independiente fuera de `/app`
2. **Dockerizar**: Crear Dockerfiles para backend y frontend
3. **Variables de entorno**: Configurar para diferentes ambientes (dev, staging, prod)
4. **Tests**: Agregar tests unitarios para modelos y tests de integración para rutas
5. **CI/CD**: Configurar pipeline de deployment automático

---

**Arquitectura implementada**: ✅ Clean Architecture con separación de responsabilidades
