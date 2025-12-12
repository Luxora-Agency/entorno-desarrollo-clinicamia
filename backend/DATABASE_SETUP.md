# Configuración de Base de Datos - Clínica Mía

## Requisitos Previos
- PostgreSQL 15 instalado
- Node.js y npm/yarn instalados

## Instalación desde Cero

### 1. Instalar PostgreSQL (si no está instalado)

```bash
# En Debian/Ubuntu
apt-get update && apt-get install -y postgresql

# Iniciar el servicio
service postgresql start
```

### 2. Crear Usuario y Base de Datos

```bash
# Conectarse como usuario postgres
su - postgres

# Ejecutar comandos SQL
psql <<EOF
CREATE USER clinica_user WITH PASSWORD 'clinica_pass_2025';
ALTER USER clinica_user CREATEDB;
CREATE DATABASE clinica_mia OWNER clinica_user;
GRANT ALL PRIVILEGES ON DATABASE clinica_mia TO clinica_user;
\q
EOF
```

### 3. Aplicar Migraciones de Prisma

```bash
cd /app/backend

# Generar cliente de Prisma
npx prisma generate

# Aplicar todas las migraciones
npx prisma migrate deploy
```

**✅ Las migraciones incluyen automáticamente:**
- ✅ Todas las tablas del sistema
- ✅ Tabla `role_permisos` para permisos dinámicos
- ✅ Campos adicionales en `citas`: `tipo_cita`, `duracion_minutos`, `costo`, `examen_procedimiento_id`
- ✅ Valores del enum `EstadoCita`: `EnEspera`, `Atendiendo`

**🚨 NO es necesario ejecutar scripts SQL adicionales manualmente.**

### 4. Cargar Datos Iniciales (Seeders)

```bash
cd /app/backend
node seeders.js
```

Esto creará:
- 6 usuarios con diferentes roles
- 72 permisos por rol
- 4 departamentos
- 3 especialidades (Medicina General, Pediatría, Ginecología)
- 2 doctores
- 3 pacientes
- 3 categorías de exámenes
- 3 exámenes/procedimientos
- 8 productos farmacéuticos
- 3 unidades de hospitalización con habitaciones y camas
- 8 citas de ejemplo

### 5. Verificar Estado de Migraciones

```bash
cd /app/backend
npx prisma migrate status
```

Debería mostrar: **"Database schema is up to date!"**

## Credenciales de Acceso

Después de ejecutar los seeders, puedes acceder con:

- **SuperAdmin:** superadmin@clinicamia.com / superadmin123
- **Admin:** admin@clinicamia.com / admin123
- **Doctor:** doctor@clinicamia.com / doctor123
- **Enfermera:** enfermera@clinicamia.com / enfermera123
- **Recepcionista:** recepcionista@clinicamia.com / recepcion123

## Reiniciar Base de Datos

Si necesitas reiniciar completamente la base de datos:

```bash
# Eliminar base de datos
su - postgres -c "psql -c \"DROP DATABASE IF EXISTS clinica_mia;\""

# Volver a crear
su - postgres -c "psql -c \"CREATE DATABASE clinica_mia OWNER clinica_user;\""

# Aplicar migraciones
cd /app/backend
npx prisma migrate deploy

# Cargar seeders
node seeders.js
```

## Variables de Entorno

Asegúrate de que tu archivo `.env` en `/app/backend/` contenga:

```env
DATABASE_URL=postgresql://clinica_user:clinica_pass_2025@localhost:5432/clinica_mia
JWT_SECRET=clinica_mia_jwt_secret_key_2024_very_secure_string
```

## Lista de Migraciones

1. `20251204211713_init` - Estructura inicial
2. `20251205005502_add_paciente_extended_fields` - Campos extendidos de pacientes
3. `20251205015221_add_farmacia_models` - Modelos de farmacia
4. `20251205202032_add_documentos_paciente` - Documentos de pacientes
5. `20251205224936_add_hospitalizacion_models` - Modelos de hospitalización
6. `20251205232128_add_facturacion_ordenes_system` - Sistema de facturación y órdenes
7. `20251206000720_add_hce_module` - Módulo de Historia Clínica Electrónica
8. `20251206020840_add_egreso_model` - Modelo de egresos
9. `20251209031000_add_interconsultas_procedimientos` - Interconsultas y procedimientos
10. `20251209034500_add_prescripciones_productos` - Prescripciones y productos
11. `20251210224500_add_citas_improvements_and_role_permissions` - **Mejoras en citas y permisos por rol**

## Solución de Problemas

### Error: "Can't reach database server"
```bash
service postgresql start
```

### Error: "permission denied for table"
```bash
su - postgres -c "psql -d clinica_mia -c \"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO clinica_user;\""
su - postgres -c "psql -d clinica_mia -c \"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clinica_user;\""
```

### Verificar conexión
```bash
psql -U clinica_user -d clinica_mia -h localhost -c "SELECT version();"
```
