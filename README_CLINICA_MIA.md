# 🏥 Sistema de Gestión Hospitalaria - Clínica Mía

Sistema integral de gestión hospitalaria desarrollado con **Next.js**, **Hono.js** y **PostgreSQL**.

## 🚀 Tecnologías

### Frontend
- **Next.js 14** - Framework React con App Router
- **React 18** - Biblioteca UI
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **Lucide React** - Iconos

### Backend
- **Hono.js** - Framework web ultra-rápido
- **Node.js** - Runtime
- **PostgreSQL 15** - Base de datos
- **JWT** - Autenticación
- **bcrypt** - Encriptación de contraseñas

## 📋 Características Implementadas

### ✅ Módulo de Autenticación
- Login con email y contraseña
- Registro de usuarios
- JWT tokens (válidos por 7 días)
- 8 roles de usuario:
  - `SUPER_ADMIN` - Acceso total al sistema
  - `ADMIN` - Administración general
  - `DOCTOR` - Personal médico
  - `NURSE` - Enfermería
  - `RECEPTIONIST` - Recepción
  - `PATIENT` - Pacientes
  - `PHARMACIST` - Farmacia
  - `LAB_TECHNICIAN` - Laboratorio

### ✅ Módulo de Gestión de Pacientes
- **CRUD completo** de pacientes
- Campos almacenados:
  - Datos personales (nombre, apellido, cédula)
  - Fecha de nacimiento y género
  - Contacto (teléfono, email, dirección)
  - Información médica (tipo de sangre, alergias)
  - Contacto de emergencia
- **Búsqueda** por nombre, apellido o cédula
- **Paginación** de resultados
- **Validación** de cédula única
- **Soft delete** (no se eliminan registros)

### ✅ Módulo de Agenda de Citas
- **CRUD completo** de citas médicas
- Campos almacenados:
  - Paciente y doctor asignado
  - Fecha y hora de la cita
  - Motivo de consulta
  - Notas adicionales
  - Estado (Programada, Confirmada, En Consulta, Completada, Cancelada, No Asistió)
- **Validación** de disponibilidad del doctor
- **Filtrado** por fecha
- **Vista** de citas del día
- **Estados** con badges de colores

## 🗄️ Estructura de la Base de Datos

### Tabla: usuarios
```sql
- id (UUID, Primary Key)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- nombre (VARCHAR)
- apellido (VARCHAR)
- rol (ENUM)
- telefono (VARCHAR)
- cedula (VARCHAR)
- activo (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabla: pacientes
```sql
- id (UUID, Primary Key)
- nombre (VARCHAR)
- apellido (VARCHAR)
- cedula (VARCHAR, UNIQUE)
- fecha_nacimiento (DATE)
- genero (VARCHAR)
- telefono (VARCHAR)
- email (VARCHAR)
- direccion (TEXT)
- tipo_sangre (VARCHAR)
- alergias (TEXT)
- contacto_emergencia_nombre (VARCHAR)
- contacto_emergencia_telefono (VARCHAR)
- activo (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabla: citas
```sql
- id (UUID, Primary Key)
- paciente_id (UUID, Foreign Key)
- doctor_id (UUID, Foreign Key)
- fecha (DATE)
- hora (TIME)
- motivo (TEXT)
- estado (VARCHAR)
- notas (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🎨 Diseño UI

El diseño sigue la identidad visual de Clínica Mía:

### Colores Principales
- **Verde Teal**: `#4ECDC4` - Botones principales, logo, acciones
- **Azul Marino**: `#1A3A52` - Textos principales, branding
- **Blanco**: `#FFFFFF` - Fondos
- **Gris**: Textos secundarios

### Layout
- **Página de Login**: Diseño de 2 columnas
  - Izquierda: Formulario de login
  - Derecha: Preview del sistema con estadísticas
- **Dashboard**: Sidebar lateral con navegación
  - Logo de Clínica Mía
  - Menú de navegación
  - Perfil de usuario
- **Módulos**: Diseño limpio con cards y tablas

## 🔌 API Endpoints

### Base URL
```
http://localhost:4000
```

### Autenticación

#### POST /auth/register
Registrar nuevo usuario
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "rol": "DOCTOR",
  "telefono": "555-0100",
  "cedula": "001-1234567-8"
}
```

#### POST /auth/login
Iniciar sesión
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

#### GET /auth/me
Obtener perfil del usuario actual (requiere token)

### Pacientes

#### GET /pacientes
Obtener lista de pacientes (requiere token)
- Query params: `page`, `limit`, `search`

#### GET /pacientes/:id
Obtener un paciente por ID (requiere token)

#### POST /pacientes
Crear nuevo paciente (requiere token y rol autorizado)
```json
{
  "nombre": "María",
  "apellido": "González",
  "cedula": "001-9876543-2",
  "fecha_nacimiento": "1990-05-15",
  "genero": "Femenino",
  "telefono": "555-0200",
  "email": "maria@ejemplo.com",
  "tipo_sangre": "O+",
  "alergias": "Penicilina"
}
```

#### PUT /pacientes/:id
Actualizar paciente (requiere token y rol autorizado)

#### DELETE /pacientes/:id
Eliminar paciente (soft delete) (requiere token y rol autorizado)

### Citas

#### GET /citas
Obtener lista de citas (requiere token)
- Query params: `page`, `limit`, `fecha`, `estado`

#### GET /citas/:id
Obtener una cita por ID (requiere token)

#### GET /citas/doctor/:doctorId
Obtener citas de un doctor específico (requiere token)
- Query param: `fecha`

#### POST /citas
Crear nueva cita (requiere token y rol autorizado)
```json
{
  "paciente_id": "uuid-del-paciente",
  "doctor_id": "uuid-del-doctor",
  "fecha": "2025-12-05",
  "hora": "10:00",
  "motivo": "Consulta general",
  "notas": "Primera consulta"
}
```

#### PUT /citas/:id
Actualizar cita (requiere token y rol autorizado)

#### DELETE /citas/:id
Cancelar cita (requiere token y rol autorizado)

## 👤 Usuarios de Prueba

Se han creado los siguientes usuarios para pruebas:

### Super Admin
- **Email**: `admin@clinicamia.com`
- **Password**: `admin123`
- **Rol**: SUPER_ADMIN

### Doctor
- **Email**: `doctor@clinicamia.com`
- **Password**: `doctor123`
- **Rol**: DOCTOR

### Recepcionista
- **Email**: `recepcion@clinicamia.com`
- **Password**: `recepcion123`
- **Rol**: RECEPTIONIST

## 🚀 Servicios en Ejecución

### Frontend (Next.js)
- **Puerto**: 3000
- **URL**: http://localhost:3000
- **Comando**: `yarn dev`

### Backend (Hono.js)
- **Puerto**: 4000
- **URL**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

### Base de Datos (PostgreSQL)
- **Puerto**: 5432
- **Database**: `clinica_mia`
- **Usuario**: `clinica_user`
- **Password**: `clinica_pass_2024`

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ Autenticación JWT con expiración
- ✅ Middleware de autenticación en rutas protegidas
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Validación de datos en backend
- ✅ Prevención de cédulas duplicadas
- ✅ Validación de disponibilidad de doctores

## 📁 Estructura del Proyecto

```
/app
├── backend/
│   ├── db/
│   │   └── index.js          # Conexión PostgreSQL y schemas
│   ├── middleware/
│   │   └── auth.js           # Middleware de autenticación
│   ├── routes/
│   │   ├── auth.js           # Rutas de autenticación
│   │   ├── pacientes.js      # Rutas de pacientes
│   │   └── citas.js          # Rutas de citas
│   └── server.js             # Servidor Hono.js
├── app/
│   ├── page.js               # Página principal
│   └── layout.js             # Layout de Next.js
├── components/
│   ├── clinica/
│   │   ├── Login.jsx         # Componente de login
│   │   ├── Dashboard.jsx     # Dashboard principal
│   │   ├── Sidebar.jsx       # Barra lateral
│   │   ├── DashboardHome.jsx # Home del dashboard
│   │   ├── PacientesModule.jsx # Módulo de pacientes
│   │   └── CitasModule.jsx   # Módulo de citas
│   └── ui/                   # Componentes shadcn/ui
├── .env                      # Variables de entorno
└── package.json
```

## 🔧 Variables de Entorno

```env
# PostgreSQL
DATABASE_URL=postgresql://clinica_user:clinica_pass_2024@localhost:5432/clinica_mia

# JWT
JWT_SECRET=clinica_mia_jwt_secret_key_2024_very_secure_string

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🎯 Próximas Funcionalidades

Las siguientes funcionalidades están planeadas para futuras versiones:

- 📋 **Historia Clínica**: Registro completo de consultas y diagnósticos
- 💊 **Módulo de Farmacia**: Gestión de medicamentos e inventario
- 🔬 **Laboratorio**: Gestión de exámenes y resultados
- 🏨 **Hospitalización**: Control de camas y pacientes hospitalizados
- 📊 **Reportes**: Estadísticas y análisis de datos
- 💰 **Facturación**: Sistema de cobros y pagos
- 📧 **Notificaciones**: Recordatorios de citas por email/SMS
- 📱 **App Móvil**: Aplicación para pacientes

## 🐛 Troubleshooting

### El backend no inicia
```bash
# Verificar que PostgreSQL esté corriendo
service postgresql status

# Reiniciar PostgreSQL
service postgresql restart

# Verificar logs
tail -f /var/log/supervisor/hono.out.log
```

### El frontend no carga
```bash
# Verificar que Next.js esté corriendo
supervisorctl status nextjs

# Reiniciar Next.js
supervisorctl restart nextjs
```

### Error de conexión a la base de datos
```bash
# Verificar conexión a PostgreSQL
psql -h localhost -U clinica_user -d clinica_mia

# Recrear usuario si es necesario
sudo -u postgres psql -c "ALTER USER clinica_user WITH SUPERUSER;"
```

## 📝 Notas de Desarrollo

- El sistema utiliza UUIDs en lugar de ObjectIDs de MongoDB para mejor compatibilidad
- Todas las eliminaciones son "soft deletes" para mantener integridad de datos
- La autenticación es stateless usando JWT
- Los tokens tienen una duración de 7 días
- El sistema incluye índices en campos frecuentemente consultados

## 🎨 Créditos de Diseño

Diseño basado en la identidad visual de **Clínica Mía - Medicina Integral Avanza**

## 📄 Licencia

Sistema propietario desarrollado para Clínica Mía.

---

**Desarrollado con ❤️ para Clínica Mía**
