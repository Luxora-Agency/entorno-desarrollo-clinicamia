# Guía de Implementación de Middleware de Permisos

## Descripción General

Este sistema de permisos utiliza la tabla `role_permisos` en la base de datos para controlar el acceso a diferentes módulos de la aplicación de forma dinámica. En lugar de hardcodear roles en cada ruta, el sistema consulta la base de datos para verificar si el rol del usuario tiene acceso al módulo solicitado.

## Ventajas

✅ **Flexible**: Cambias permisos desde la base de datos sin tocar código  
✅ **Dinámico**: Los permisos se pueden modificar en tiempo real  
✅ **Escalable**: Fácil de replicar en todas las rutas del backend  
✅ **Mantenible**: Un solo lugar para gestionar permisos (tabla `role_permisos`)  
✅ **Auditable**: Los permisos están en la DB y se pueden rastrear

## Estructura de la Tabla `role_permisos`

```sql
CREATE TABLE role_permisos (
  id UUID PRIMARY KEY,
  rol VARCHAR(50) NOT NULL,        -- Nombre del rol (ej: 'superadmin', 'admin', 'doctor')
  modulo VARCHAR(100) NOT NULL,    -- Nombre del módulo (ej: 'citas', 'pacientes', 'usuarios')
  acceso BOOLEAN DEFAULT true,     -- Si tiene acceso o no
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(rol, modulo)
);
```

## Middleware de Permisos

El middleware `permissionMiddleware` está ubicado en `/app/backend/middleware/auth.js`

### Funcionamiento

1. Extrae el usuario del contexto (previamente autenticado con JWT)
2. Normaliza el rol a minúsculas para comparación case-insensitive
3. Consulta en `role_permisos` si existe un registro con ese rol y módulo
4. Si existe y `acceso = true`, permite continuar
5. Si no existe o `acceso = false`, retorna 403

## Cómo Implementar en Tus Rutas

### Paso 1: Importar el Middleware

```javascript
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
```

### Paso 2: Aplicar en Tus Rutas

Tienes dos opciones:

#### Opción A: Aplicar a Todas las Rutas del Módulo (Recomendado)

```javascript
const { Hono } = require('hono');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');

const miModulo = new Hono();

// Primero autenticación
miModulo.use('*', authMiddleware);

// Luego verificar permisos del módulo
miModulo.use('*', permissionMiddleware('nombre_del_modulo'));

// Ahora todas las rutas requieren permiso
miModulo.get('/', async (c) => { ... });
miModulo.post('/', async (c) => { ... });
miModulo.put('/:id', async (c) => { ... });
miModulo.delete('/:id', async (c) => { ... });

module.exports = miModulo;
```

#### Opción B: Aplicar a Rutas Específicas

```javascript
// Solo proteger ciertas rutas
miModulo.get('/', permissionMiddleware('nombre_modulo'), async (c) => { ... });
miModulo.post('/', permissionMiddleware('nombre_modulo'), async (c) => { ... });
```

## Ejemplo Real: Rutas de Citas

**Archivo:** `/app/backend/routes/citas.js`

```javascript
const { Hono } = require('hono');
const citaService = require('../services/cita.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const citas = new Hono();

// Todas las rutas requieren autenticación
citas.use('*', authMiddleware);

// Todas las rutas requieren permiso al módulo 'citas'
citas.use('*', permissionMiddleware('citas'));

// Ahora las rutas son simples, sin verificación de roles
citas.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await citaService.getAll(query);
    return c.json(paginated(result.citas, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

citas.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const cita = await citaService.create(data);
    return c.json(success({ cita }, 'Cita creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ... más rutas sin roleMiddleware

module.exports = citas;
```

## Lista de Módulos Disponibles

Para ver qué módulos están configurados en la base de datos:

```sql
SELECT DISTINCT modulo FROM role_permisos ORDER BY modulo;
```

Módulos actualmente configurados:
- `admisiones`
- `alertas`
- `auditorias`
- `camas`
- `citas`
- `configuracion`
- `cupones-miapass`
- `departamentos`
- `documentos`
- `especialidades`
- `estadisticas`
- `examenes`
- `facturacion`
- `farmacia`
- `hce` (Historia Clínica Electrónica)
- `hospitalizacion`
- `laboratorio`
- `ordenes`
- `pacientes`
- `planes-miapass`
- `productos`
- `suscripciones-miapass`
- `suscriptores-miapass`
- `unidades`
- `urgencias`
- `usuarios`

## Cómo Agregar Permisos para un Nuevo Módulo

### 1. En el Seeder (`/app/backend/seeders.js`)

Agrega el módulo al array de permisos:

```javascript
const modulosYPermisos = [
  // ... módulos existentes
  'mi_nuevo_modulo',
];

// El seeder creará automáticamente los permisos para todos los roles
```

### 2. Manualmente en la Base de Datos

```sql
-- Dar acceso a todos los roles
INSERT INTO role_permisos (rol, modulo, acceso) VALUES
  ('superadmin', 'mi_nuevo_modulo', true),
  ('admin', 'mi_nuevo_modulo', true),
  ('doctor', 'mi_nuevo_modulo', true),
  ('recepcionista', 'mi_nuevo_modulo', false),
  ('enfermera', 'mi_nuevo_modulo', false),
  ('farmaceutico', 'mi_nuevo_modulo', false),
  ('laboratorista', 'mi_nuevo_modulo', false);
```

## Gestión Dinámica de Permisos

Los permisos se pueden gestionar desde:

1. **Panel de Administración**: Módulo "Usuarios y Roles" en el frontend
2. **Base de Datos Directa**: 
   ```sql
   UPDATE role_permisos 
   SET acceso = false 
   WHERE rol = 'enfermera' AND modulo = 'citas';
   ```

## Verificación de Permisos

### Ver permisos de un rol específico:

```sql
SELECT modulo, acceso 
FROM role_permisos 
WHERE rol = 'doctor' 
ORDER BY modulo;
```

### Ver qué roles tienen acceso a un módulo:

```sql
SELECT rol, acceso 
FROM role_permisos 
WHERE modulo = 'citas' 
ORDER BY rol;
```

## Testing

### Probar acceso permitido:

```bash
TOKEN=$(curl -s -X POST "http://localhost:4000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@clinicamia.com","password":"superadmin123"}' | jq -r '.data.token')

curl -s "http://localhost:4000/citas" \
  -H "Authorization: Bearer $TOKEN" | jq '{success, message}'
```

**Respuesta esperada:** `{"success": true, ...}`

### Probar acceso denegado:

```bash
TOKEN=$(curl -s -X POST "http://localhost:4000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"enfermera@clinicamia.com","password":"enfermera123"}' | jq -r '.data.token')

curl -s "http://localhost:4000/citas" \
  -H "Authorization: Bearer $TOKEN" | jq '{success, message}'
```

**Respuesta esperada:** `{"success": false, "message": "No tiene permisos para acceder a este módulo"}`

## Migración de Rutas Existentes

Si tienes rutas con `roleMiddleware`, cámbialas así:

### ANTES:
```javascript
citas.post('/', roleMiddleware(['SuperAdmin', 'Admin', 'Doctor']), async (c) => {
  // ...
});
```

### DESPUÉS:
```javascript
// Aplicar permissionMiddleware una vez para todas las rutas
citas.use('*', permissionMiddleware('citas'));

citas.post('/', async (c) => {
  // ...
});
```

## Troubleshooting

### Error: "No tiene permisos para acceder a este módulo"

1. Verificar que el rol existe en `role_permisos`:
   ```sql
   SELECT * FROM role_permisos WHERE rol = 'tu_rol' AND modulo = 'tu_modulo';
   ```

2. Verificar que `acceso = true`:
   ```sql
   UPDATE role_permisos SET acceso = true WHERE rol = 'tu_rol' AND modulo = 'tu_modulo';
   ```

3. Verificar que el nombre del módulo coincida exactamente (case-insensitive pero debe existir)

### Error: "Usuario no autenticado"

Asegúrate de aplicar `authMiddleware` antes de `permissionMiddleware`:

```javascript
miModulo.use('*', authMiddleware);         // Primero autenticación
miModulo.use('*', permissionMiddleware('modulo')); // Luego permisos
```

## Mejores Prácticas

1. ✅ **Siempre usa nombres de módulos en minúsculas** para consistencia
2. ✅ **Aplica el middleware globalmente** con `use('*')` en lugar de en cada ruta
3. ✅ **Mantén los nombres de módulos descriptivos** ('citas', 'pacientes', 'facturacion')
4. ✅ **Documenta los cambios de permisos** en tus commits
5. ✅ **Prueba con diferentes roles** después de implementar

## Conclusión

Este sistema de permisos basado en base de datos es más flexible y mantenible que hardcodear roles en el código. Una vez implementado en un módulo, es trivial replicarlo en otros siguiendo esta guía.
