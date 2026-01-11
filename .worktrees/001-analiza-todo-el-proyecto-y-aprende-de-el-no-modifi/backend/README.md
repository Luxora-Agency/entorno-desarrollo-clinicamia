# 🏗️ Backend - Clínica Mía

Backend API desarrollado con **Hono.js**, **Prisma ORM** y **PostgreSQL** siguiendo una arquitectura limpia y mantenible.

## 📁 Estructura del Proyecto

```
backend/
├── db/
│   └── prisma.js          # Cliente de Prisma
├── middleware/
│   └── auth.js            # Autenticación y autorización
├── routes/
│   ├── auth.js            # Rutas de autenticación
│   ├── pacientes.js       # Rutas de pacientes
│   ├── citas.js           # Rutas de citas
│   ├── departamentos.js   # Rutas de departamentos
│   ├── especialidades.js  # Rutas de especialidades
│   └── usuarios.js        # Rutas de usuarios
├── services/
│   ├── auth.service.js    # Lógica de autenticación
│   ├── paciente.service.js
│   ├── cita.service.js
│   ├── departamento.service.js
│   ├── especialidad.service.js
│   └── usuario.service.js
├── utils/
│   ├── response.js        # Respuestas estandarizadas
│   ├── auth.js            # Utilidades de JWT y bcrypt
│   ├── validators.js      # Validadores comunes
│   └── errors.js          # Clases de errores personalizadas
├── prisma/
│   └── schema.prisma      # Esquema de base de datos
├── .env                   # Variables de entorno
├── server.js              # Servidor principal
└── package.json
```

## 🎯 Arquitectura

### Principios

1. **Separación de responsabilidades**: Cada capa tiene una función específica
2. **DRY (Don't Repeat Yourself)**: Código reutilizable en utils y services
3. **Clean Code**: Código legible y fácil de mantener
4. **Respuestas estandarizadas**: Formato consistente en todas las respuestas

### Capas

#### 🛣️ Routes (Rutas)
- **Responsabilidad**: Solo recibir requests y parsear datos
- **Qué hace**: Llama al service correspondiente y retorna la respuesta
- **Qué NO hace**: Lógica de negocio, validaciones complejas, consultas a DB

```javascript
// ✅ CORRECTO
pacientes.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await pacienteService.getAll(query);
    return c.json(paginated(result.pacientes, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ❌ INCORRECTO - No hacer consultas directas aquí
pacientes.get('/', async (c) => {
  const pacientes = await prisma.paciente.findMany(...);
  return c.json({ pacientes });
});
```

#### 🔧 Services (Servicios)
- **Responsabilidad**: Toda la lógica de negocio
- **Qué hace**: Validaciones, consultas a Prisma, transformación de datos
- **Qué retorna**: Datos listos o lanza errores

```javascript
class PacienteService {
  async create(data) {
    // Validar
    const missing = validateRequired(['nombre', 'apellido'], data);
    if (missing) throw new ValidationError('...');
    
    // Lógica de negocio
    const existing = await prisma.paciente.findUnique(...);
    if (existing) throw new ValidationError('...');
    
    // Crear y retornar
    return await prisma.paciente.create({ data });
  }
}
```

#### 🛠️ Utils (Utilidades)
- **Responsabilidad**: Funciones comunes reutilizables
- **Tipos**:
  - `response.js`: success(), error(), paginated()
  - `auth.js`: generateToken(), hashPassword(), comparePassword()
  - `validators.js`: isValidEmail(), validateRequired()
  - `errors.js`: Clases de errores personalizadas

#### 🔒 Middleware
- **Responsabilidad**: Autenticación, autorización, validaciones
- `authMiddleware`: Verifica token JWT
- `roleMiddleware`: Verifica roles permitidos

## 📝 Formato de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

### Respuesta con Paginación
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Mensaje de error"
}
```

## 🔐 Autenticación

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@clinicamia.com",
  "password": "admin123"
}

# Respuesta
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": { ... },
    "token": "eyJhbGci..."
  }
}
```

### Usar Token
```bash
GET /pacientes
Authorization: Bearer eyJhbGci...
```

## 📚 Endpoints Principales

### Auth
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Login
- `GET /auth/me` - Perfil (requiere auth)

### Pacientes
- `GET /pacientes` - Listar (requiere auth)
- `GET /pacientes/:id` - Obtener uno
- `POST /pacientes` - Crear (requiere rol)
- `PUT /pacientes/:id` - Actualizar
- `DELETE /pacientes/:id` - Eliminar (soft delete)

### Citas
- `GET /citas` - Listar
- `GET /citas/:id` - Obtener una
- `POST /citas` - Crear
- `PUT /citas/:id` - Actualizar
- `DELETE /citas/:id` - Cancelar

### Departamentos
- `GET /departamentos` - Listar
- `GET /departamentos/:id` - Obtener uno
- `POST /departamentos` - Crear
- `PUT /departamentos/:id` - Actualizar
- `DELETE /departamentos/:id` - Eliminar

### Especialidades
- `GET /especialidades` - Listar
- `GET /especialidades/:id` - Obtener una
- `POST /especialidades` - Crear
- `PUT /especialidades/:id` - Actualizar
- `DELETE /especialidades/:id` - Eliminar

## 🚀 Comandos

```bash
# Desarrollo
cd /app/backend
node server.js

# Prisma
npx prisma generate        # Generar cliente
npx prisma studio          # Interfaz visual de DB
npx prisma migrate dev     # Crear migración
```

## ⚙️ Variables de Entorno

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/clinica_mia
JWT_SECRET=tu_secreto_super_seguro
PORT=4000
NODE_ENV=development
```

## 🎨 Buenas Prácticas Implementadas

### 1. Manejo de Errores Centralizado
```javascript
// Usar clases de error personalizadas
throw new ValidationError('Campo requerido');
throw new NotFoundError('Recurso no encontrado');
throw new UnauthorizedError('No autorizado');
```

### 2. Validaciones Reutilizables
```javascript
const missing = validateRequired(['nombre', 'email'], data);
if (missing) throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
```

### 3. Respuestas Consistentes
```javascript
// Usar helpers de response
return c.json(success(data, 'Mensaje'));
return c.json(error('Error'), 400);
return c.json(paginated(items, pagination));
```

### 4. Services como Clases Singleton
```javascript
class PacienteService {
  async create(data) { ... }
}

module.exports = new PacienteService();
```

## 🔄 Flujo de una Request

```
Cliente
  ↓
Route (recibe request)
  ↓
Middleware (auth, validaciones)
  ↓
Service (lógica de negocio)
  ↓
Prisma (consulta a DB)
  ↓
Service (formatea respuesta)
  ↓
Route (retorna JSON)
  ↓
Cliente
```

## 📊 Esquema de Base de Datos

Ver `prisma/schema.prisma` para el esquema completo.

Tablas principales:
- `usuarios` - Usuarios del sistema
- `pacientes` - Pacientes de la clínica
- `citas` - Citas médicas
- `departamentos` - Departamentos médicos
- `especialidades` - Especialidades médicas

## 🧪 Testing

```bash
# Probar login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicamia.com","password":"admin123"}'

# Probar endpoint protegido
TOKEN="tu_token_aqui"
curl http://localhost:4000/pacientes \
  -H "Authorization: Bearer $TOKEN"
```

## 📝 Notas de Desarrollo

- **Sin arquitectura excesiva**: Simple pero profesional
- **Fácil de escalar**: Agregar nuevos módulos es directo
- **Mantenible**: Código limpio y organizado
- **Documentado**: Comentarios claros en código crítico

---

**Desarrollado con ❤️ para Clínica Mía**
