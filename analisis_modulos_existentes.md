# Análisis de Módulos Existentes vs Módulo de Hospitalización

## ✅ LO QUE YA EXISTE

### 1. CamasModule.jsx (CRUD Administrativo)
**Función**: Gestión administrativa de camas
**Características**:
- ✅ Tabla de todas las camas
- ✅ Crear/Editar/Eliminar camas
- ✅ Filtro por estado
- ✅ Stats básicas (total, disponibles, ocupadas, mantenimiento)
- ✅ Selección de habitación al crear cama

**Usuarios objetivo**: Administradores, IT

### 2. HabitacionesModule.jsx (CRUD Administrativo)
**Función**: Gestión administrativa de habitaciones
**Características**:
- ✅ Tabla de habitaciones
- ✅ Crear/Editar/Eliminar habitaciones
- ✅ Asociar a unidades
- ✅ Definir tipo, capacidad, servicios

**Usuarios objetivo**: Administradores

### 3. UnidadesModule.jsx (CRUD Administrativo)
**Función**: Gestión administrativa de unidades
**Características**:
- ✅ Tabla de unidades
- ✅ Crear/Editar/Eliminar unidades
- ✅ Departamentos asociados

**Usuarios objetivo**: Administradores

---

## 🆕 LO QUE FALTA: Módulo de Hospitalización (Operacional)

### Diferencias Clave:
| Aspecto | Módulos CRUD (existentes) | Módulo Hospitalización (nuevo) |
|---------|---------------------------|--------------------------------|
| **Propósito** | Configurar estructura | Operar día a día |
| **Vista** | Tablas con lista | Mapa visual tipo grid |
| **Usuarios** | Administradores | Enfermería, doctores, limpieza |
| **Enfoque** | Datos de cama (número, habitación) | Estado actual y paciente |
| **Acciones** | CRUD completo | Cambio rápido de estado |
| **Información** | Técnica | Clínica (quién está en la cama) |

### Características del Nuevo Módulo (HospitalizacionModule):

#### 1. Vista de Mapa/Grid Visual
```
┌─────────────────────────────────────────┐
│ 🏥 Unidad: UCI ▼    📊 Ocupación: 75%  │
├─────────────────────────────────────────┤
│                                          │
│  Habitación 101 (Doble - Masculino)     │
│  ┌──────────┐ ┌──────────┐             │
│  │ Cama A   │ │ Cama B   │             │
│  │ 🟢 Dispon│ │ 🔴 Ocupada│             │
│  │          │ │ J. Pérez  │             │
│  └──────────┘ └──────────┘             │
│                                          │
│  Habitación 102 (Individual - Femenino) │
│  ┌──────────┐                           │
│  │ Cama A   │                           │
│  │ 🟡 Limpieza│                          │
│  └──────────┘                           │
└─────────────────────────────────────────┘
```

#### 2. Dashboard de Métricas en Tiempo Real
- Ocupación total: 45/60 camas (75%)
- Por unidad: UCI 8/10, General 30/40
- Camas en limpieza: 5
- Camas disponibles: 12
- Gráfica de ocupación por día/semana

#### 3. Acciones Rápidas (sin formularios complejos)
- Click en cama → Modal con:
  - Paciente actual (si ocupada)
  - Botones: "Marcar Limpieza", "Disponible", "Mantenimiento"
  - Historial de ocupación
- Cambio de estado inmediato con confirmación simple

#### 4. Filtros Operacionales
- Por unidad (UCI, General, Pediatría)
- Por estado (disponibles, ocupadas, en limpieza)
- Por tipo de habitación
- Por género (para asignación)

#### 5. Información en Tiempo Real
- Nombre del paciente en cama ocupada
- Días de hospitalización
- Alertas visuales (camas que necesitan limpieza hace >1h)
- Refresh automático cada 30 segundos

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Opción A: Módulo Completamente Nuevo ⭐ (RECOMENDADO)
**Archivo**: `/app/frontend/components/clinica/HospitalizacionModule.jsx`

**Ventajas**:
- ✅ No modificar código existente (menos riesgo)
- ✅ Interfaz específica para operaciones diarias
- ✅ Puede coexistir con CamasModule
- ✅ Usuarios diferentes (operacional vs administrativo)

**Menú en Sidebar**:
```
📋 Gestión Hospitalaria
  ├── Unidades
  ├── Habitaciones  
  ├── Camas (CRUD)
  
🏥 Operaciones
  ├── Hospitalización (NUEVO - Mapa Visual)
  ├── Admisiones
  ├── HCE
```

---

### Opción B: Agregar Tab en CamasModule ⚠️ (No recomendado)
**Cambios**: Agregar "Vista de Mapa" como tab adicional en CamasModule

**Desventajas**:
- ❌ Mezcla propósitos (configuración vs operación)
- ❌ Sobrecarga el módulo
- ❌ Usuarios administradores verían info operacional innecesaria

---

## 📋 DECISIÓN FINAL

**Crear HospitalizacionModule.jsx como módulo SEPARADO**

**Características**:
1. Vista principal: Mapa/Grid de habitaciones y camas
2. Dashboard con métricas
3. Botones rápidos para cambiar estado
4. Información de pacientes en tiempo real
5. Filtros operacionales
6. Refresh automático

**Tiempo estimado**: 8-10 horas
- Backend (ya completado): 2h ✅
- Frontend componente principal: 3-4h
- Frontend mapa visual: 3-4h
- Frontend dashboard: 1-2h

---

## 🚀 PRÓXIMO PASO

Crear `/app/frontend/components/clinica/HospitalizacionModule.jsx` con:
- Integración con API `/api/camas/mapa` (ya lista)
- Integración con API `/api/camas/estadisticas` (ya lista)
- Vista de grid/mapa visual
- Dashboard de métricas
- Acciones rápidas para enfermería
