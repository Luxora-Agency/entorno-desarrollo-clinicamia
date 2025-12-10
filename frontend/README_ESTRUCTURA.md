# 📁 Estructura del Frontend - Clínica Mía

## 🎯 Arquitectura Organizada

Este documento describe la nueva estructura organizada del frontend después del Sprint 0.

---

## 📦 Carpetas Principales

```
/frontend/
├── app/                    # Next.js App Router
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   └── clinica/          # Componentes del dominio hospitalario
├── services/             # 🆕 Servicios compartidos
├── hooks/                # 🆕 Hooks personalizados
├── constants/            # 🆕 Constantes del sistema
└── public/              # Archivos estáticos
```

---

## 🔧 Servicios (`/services/`)

### `api.js` - Cliente HTTP Centralizado

Maneja todas las llamadas API del sistema de forma unificada.

**Funciones disponibles:**
- `apiGet(endpoint, params)` - GET request
- `apiPost(endpoint, data)` - POST request
- `apiPut(endpoint, data)` - PUT request
- `apiDelete(endpoint)` - DELETE request
- `apiPatch(endpoint, data)` - PATCH request
- `apiUpload(endpoint, formData)` - Upload de archivos

**Ejemplo de uso:**
```javascript
import { apiGet, apiPost } from '@/services/api';

// GET request
const pacientes = await apiGet('/pacientes', { limit: 50 });

// POST request
const nuevoPaciente = await apiPost('/pacientes', {
  nombre: 'Juan',
  apellido: 'Pérez',
  cedula: '12345678'
});
```

**Características:**
- ✅ Manejo automático de tokens JWT
- ✅ Headers configurados automáticamente
- ✅ Manejo centralizado de errores
- ✅ Base URL desde variables de entorno

---

### `formatters.js` - Utilidades de Formateo

Funciones para formatear datos de forma consistente en toda la aplicación.

**Funciones disponibles:**
- `formatCurrency(value)` - Moneda colombiana (COP)
- `formatDate(date)` - Fecha corta (DD/MM/YYYY)
- `formatDateISO(date)` - Fecha ISO (YYYY-MM-DD)
- `formatDateTime(date)` - Fecha y hora completa
- `formatTime(time)` - Hora (HH:MM)
- `formatFullName(nombre, apellido)` - Nombre completo capitalizado
- `formatDocument(cedula)` - Cédula con separadores
- `formatPhone(phone)` - Teléfono colombiano
- `truncateText(text, maxLength)` - Truncar con ellipsis
- `getInitials(nombre, apellido)` - Iniciales

**Ejemplo de uso:**
```javascript
import { formatCurrency, formatDate, formatFullName } from '@/services/formatters';

// Formatear moneda
const precio = formatCurrency(50000); // "$50.000"

// Formatear fecha
const fecha = formatDate('2025-01-15'); // "15/01/2025"

// Formatear nombre
const nombre = formatFullName('juan', 'pérez'); // "Juan Pérez"
```

---

### `validators.js` - Validadores de Datos

Funciones para validar datos de entrada.

**Funciones disponibles:**
- `isValidEmail(email)` - Validar email
- `isValidCedula(cedula)` - Validar cédula colombiana
- `isValidPhone(phone)` - Validar teléfono colombiano
- `isValidDate(date)` - Validar fecha
- `isNotFutureDate(date)` - Fecha no futura
- `isNotPastDate(date)` - Fecha no pasada
- `isValidAge(birthDate, minAge, maxAge)` - Validar edad
- `isRequired(value)` - Campo requerido
- `minLength(value, min)` - Longitud mínima
- `maxLength(value, max)` - Longitud máxima
- `isPositiveNumber(value)` - Número positivo
- `isInRange(value, min, max)` - Rango numérico

**Ejemplo de uso:**
```javascript
import { isValidEmail, isValidCedula } from '@/services/validators';

// Validar email
if (!isValidEmail('usuario@ejemplo.com')) {
  console.error('Email inválido');
}

// Validar cédula
if (!isValidCedula('12345678')) {
  console.error('Cédula inválida');
}
```

---

## 🎣 Hooks Personalizados (`/hooks/`)

### `useAuth.js` - Autenticación

Hook para manejo de autenticación y sesión de usuario.

**API:**
```javascript
const {
  user,              // Usuario actual (objeto)
  loading,           // Estado de carga
  error,             // Error si existe
  login,             // Función: (email, password) => Promise
  logout,            // Función: () => void
  isAuthenticated,   // Función: () => boolean
} = useAuth();
```

**Ejemplo de uso:**
```javascript
import { useAuth } from '@/hooks/useAuth';

function LoginComponent() {
  const { login, loading, error } = useAuth();
  
  const handleLogin = async () => {
    const result = await login('admin@clinica.com', 'password123');
    if (result.success) {
      console.log('Login exitoso', result.user);
    }
  };
  
  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Cargando...' : 'Iniciar Sesión'}
    </button>
  );
}
```

---

### `useApi.js` - Llamadas API Genéricas

Hook genérico para cualquier llamada API con manejo automático de estado.

**API:**
```javascript
const {
  data,      // Datos retornados por la API
  loading,   // Estado de carga
  error,     // Error si existe
  execute,   // Función para ejecutar la llamada
  reset,     // Función para resetear el estado
} = useApi(apiFunction);
```

**Ejemplo de uso:**
```javascript
import { useApi } from '@/hooks/useApi';
import { apiGet } from '@/services/api';

function PacientesComponent() {
  const { data, loading, execute } = useApi(() => apiGet('/pacientes'));
  
  useEffect(() => {
    execute();
  }, []);
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      {data?.data?.map(p => <div key={p.id}>{p.nombre}</div>)}
    </div>
  );
}
```

---

### `usePacientes.js` - Gestión de Pacientes

Hook especializado para todas las operaciones con pacientes.

**API:**
```javascript
const {
  pacientes,           // Lista de pacientes
  loading,             // Estado de carga
  error,               // Error si existe
  fetchPacientes,      // Obtener lista
  searchPacientes,     // Buscar pacientes
  getPacienteById,     // Obtener por ID
  createPaciente,      // Crear nuevo
  updatePaciente,      // Actualizar existente
  deletePaciente,      // Eliminar
} = usePacientes();
```

**Ejemplo de uso:**
```javascript
import { usePacientes } from '@/hooks/usePacientes';

function PacientesModule() {
  const { pacientes, loading, fetchPacientes, createPaciente } = usePacientes();
  
  useEffect(() => {
    fetchPacientes();
  }, []);
  
  const handleCreate = async () => {
    const result = await createPaciente({
      nombre: 'Juan',
      apellido: 'Pérez',
      cedula: '12345678'
    });
    
    if (result.success) {
      console.log('Paciente creado', result.data);
    }
  };
  
  return (
    <div>
      {loading ? 'Cargando...' : pacientes.map(p => <div key={p.id}>{p.nombre}</div>)}
    </div>
  );
}
```

---

### `useCitas.js` - Gestión de Citas

Hook especializado para todas las operaciones con citas médicas.

**API:**
```javascript
const {
  citas,                    // Lista de citas
  loading,                  // Estado de carga
  error,                    // Error si existe
  fetchCitas,               // Obtener lista
  getCitaById,              // Obtener por ID
  createCita,               // Crear nueva
  updateCita,               // Actualizar
  deleteCita,               // Eliminar
  fetchDisponibilidad,      // Obtener horarios disponibles
  validarDisponibilidad,    // Validar horario específico
} = useCitas();
```

**Ejemplo de uso:**
```javascript
import { useCitas } from '@/hooks/useCitas';

function CitasModule() {
  const { citas, loading, fetchCitas, fetchDisponibilidad } = useCitas();
  
  useEffect(() => {
    fetchCitas({ fecha: '2025-01-15' });
  }, []);
  
  const checkDisponibilidad = async (doctorId, fecha) => {
    const result = await fetchDisponibilidad(doctorId, fecha);
    if (result.success) {
      console.log('Slots disponibles:', result.data.slots_disponibles);
    }
  };
  
  return <div>...</div>;
}
```

---

## 📋 Constantes (`/constants/`)

### `estados.js` - Estados del Sistema

Define todos los estados posibles en el sistema.

**Constantes disponibles:**
- `ESTADOS_CITA` - Estados de citas (Programada, Confirmada, etc.)
- `ESTADOS_ADMISION` - Estados de admisiones
- `ESTADOS_CAMA` - Estados de camas
- `COLORES_CAMA` - Colores Tailwind por estado de cama
- `ESTADOS_DIAGNOSTICO` - Estados de diagnósticos
- `TIPOS_DIAGNOSTICO` - Tipos de diagnóstico (Principal, Secundario, etc.)
- `SEVERIDAD_ALERTA` - Severidades de alertas
- `COLORES_SEVERIDAD` - Colores por severidad
- `TIPOS_ALERTA_HCE` - Tipos de alertas clínicas
- `ESTADOS_ALERTA` - Estados de alertas
- `TIPOS_EGRESO` - Tipos de egreso hospitalario
- `GENEROS` - Géneros
- `TIPOS_SANGRE` - Tipos de sangre

**Ejemplo de uso:**
```javascript
import { ESTADOS_CITA, ESTADOS_CAMA, COLORES_CAMA } from '@/constants/estados';

// Usar constantes
const estado = ESTADOS_CITA.PROGRAMADA; // "Programada"

// Obtener color por estado de cama
const colorClass = COLORES_CAMA[ESTADOS_CAMA.DISPONIBLE];
// "bg-green-100 text-green-800 border-green-200"
```

---

### `roles.js` - Roles y Permisos

Define los roles del sistema y sus permisos.

**Constantes disponibles:**
- `ROLES` - Todos los roles del sistema
- `ROLES_LABELS` - Nombres legibles de roles
- `MODULOS` - Módulos del sistema
- `PERMISOS_POR_ROL` - Matriz de permisos

**Funciones:**
- `tienePermiso(rol, modulo)` - Verificar si un rol tiene acceso a un módulo

**Ejemplo de uso:**
```javascript
import { ROLES, MODULOS, tienePermiso } from '@/constants/roles';

// Verificar permiso
if (tienePermiso(ROLES.DOCTOR, MODULOS.HCE)) {
  console.log('El doctor tiene acceso a HCE');
}

// Obtener label del rol
const label = ROLES_LABELS[ROLES.DOCTOR]; // "Médico"
```

---

### `colors.js` - Colores del Sistema

Define la paleta de colores del sistema.

**Constantes disponibles:**
- `COLORES_MODULOS` - Colores por módulo
- `BADGE_COLORS` - Colores de badges
- `BUTTON_COLORS` - Colores de botones

**Ejemplo de uso:**
```javascript
import { COLORES_MODULOS, BADGE_COLORS } from '@/constants/colors';

// Obtener colores del módulo HCE
const hceColors = COLORES_MODULOS.HCE;
console.log(hceColors.primary); // "blue"
console.log(hceColors.gradient); // "from-blue-600 to-indigo-600"

// Badge de éxito
const successBadge = BADGE_COLORS.success;
// "bg-green-100 text-green-800 border-green-200"
```

---

## 🔄 Migración de Componentes Existentes

### Antes (Código duplicado):
```javascript
// En cada componente
const token = localStorage.getItem('token');
const response = await fetch(`${apiUrl}/pacientes`, {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();

// Formateo manual
const precio = `$${value.toLocaleString('es-CO')}`;
```

### Después (Código limpio):
```javascript
import { apiGet } from '@/services/api';
import { formatCurrency } from '@/services/formatters';

// Llamada API
const data = await apiGet('/pacientes');

// Formateo
const precio = formatCurrency(value);
```

---

## ✅ Beneficios de la Nueva Estructura

1. **🔧 Menos duplicación de código**
   - Las llamadas API están centralizadas
   - Los formatos son consistentes en toda la app

2. **🧪 Más fácil de testear**
   - Servicios y hooks son funciones puras
   - Se pueden testear independientemente

3. **📚 Mejor mantenibilidad**
   - Cambios en un solo lugar
   - Código más legible y organizado

4. **⚡ Desarrollo más rápido**
   - Reutilización de lógica común
   - Menos código por componente

5. **🎯 Separación de responsabilidades**
   - Componentes: solo UI
   - Hooks: lógica de estado
   - Servicios: lógica de negocio

---

## 📝 Próximos Pasos

1. ✅ Crear servicios, hooks y constantes
2. 🔄 Refactorizar `CitasModule.jsx` usando nuevos servicios
3. 🔄 Refactorizar otros componentes grandes
4. 📄 Crear documentación de cada módulo
5. 🧪 Agregar tests unitarios

---

**Última actualización:** 2025-01-15  
**Versión:** 1.0.0
