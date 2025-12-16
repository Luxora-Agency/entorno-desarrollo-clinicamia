# 📋 Análisis Comparativo: Campos de Paciente

## Comparación entre el Formulario Actual y el Modelo de Base de Datos

---

## ✅ CAMPOS QUE YA ESTÁN IMPLEMENTADOS

### 📝 Datos Básicos
| Campo en Formulario | Campo en BD | Estado |
|---------------------|-------------|---------|
| Nombres | `nombre` | ✅ |
| Apellidos | `apellido` | ✅ |
| Cédula de Ciudadanía | `tipoDocumento` + `cedula` | ✅ |
| País | `paisNacimiento` | ✅ |
| Dirección | `direccion` | ✅ |
| Estado | `estado` + `activo` | ✅ |

### 📞 Contacto
| Campo en Formulario | Campo en BD | Estado |
|---------------------|-------------|---------|
| Teléfono | `telefono` | ✅ |
| Celular | Se puede guardar en `telefono` | ✅ |
| E-mail | `email` | ✅ |

### 👤 Información Personal
| Campo en Formulario | Campo en BD | Estado |
|---------------------|-------------|---------|
| Fecha de Nacimiento | `fechaNacimiento` | ✅ |
| Sexo | `genero` | ✅ |
| Tipo de Sangre | `tipoSangre` | ✅ |

### 🏥 Aseguramiento
| Campo en Formulario | Campo en BD | Estado |
|---------------------|-------------|---------|
| EPS | `eps` | ✅ |

### 👨‍👩‍👧 Personas de Contacto
| Campo en Formulario | Campo en BD | Estado |
|---------------------|-------------|---------|
| Acompañante | `contactosEmergencia` (JSON) | ✅ |
| Teléfono Acompañante | `contactosEmergencia` (JSON) | ✅ |
| Responsable | `contactosEmergencia` (JSON) | ✅ |
| Teléfono Responsable | `contactosEmergencia` (JSON) | ✅ |
| Parentesco Responsable | `contactosEmergencia` (JSON) | ✅ |

---

## ❌ CAMPOS QUE FALTAN EN LA BASE DE DATOS

### 🆕 Campos Nuevos Requeridos

#### 1. **Ubicación Geográfica Detallada**
- `zona` - Zona de la ciudad/región
- Nota: Ya tenemos `departamento`, `municipio`, `barrio`

#### 2. **Información de Seguros y Convenios**
- `convenio` - Convenio médico (puede ser un código o nombre)
- `carnetPoliza` - Número de carnet o póliza
- `arl` - Administradora de Riesgos Laborales

#### 3. **Información Demográfica**
- `edad` - Edad (puede calcularse desde fechaNacimiento, pero algunos sistemas lo almacenan)
- `estadoCivil` - Estado civil del paciente
- `nivelEducacion` - Nivel de educación alcanzado
- `ocupacion` - Ocupación o profesión actual

#### 4. **Información Laboral**
- `empleadorActual` - Empleador actual del paciente
- `tipoUsuario` - Tipo de usuario (Particular, Empresa, etc.)

#### 5. **Información de Referencia**
- `referidoPor` - Quién refirió al paciente (médico, institución, etc.)
- `nombreRefiere` - Nombre completo de quien refiere
- `tipoPaciente` - Clasificación del tipo de paciente
- `categoria` - Categoría del paciente (puede ser por plan, riesgo, etc.)

#### 6. **Información de Contacto Adicional**
- `celular` - Campo separado para número de celular (actualmente solo tenemos `telefono`)

---

## 📊 RESUMEN ESTADÍSTICO

- **Total de campos en formulario**: ~35 campos
- **Campos implementados**: ~20 campos (57%)
- **Campos faltantes**: ~15 campos (43%)

---

## 🎯 RECOMENDACIONES DE IMPLEMENTACIÓN

### Prioridad Alta (Campos Críticos)
1. **celular** - Separar teléfono fijo de celular
2. **estadoCivil** - Información demográfica importante
3. **ocupacion** - Relevante para estadísticas de salud ocupacional
4. **convenio** - Crítico para facturación y administración
5. **arl** - Requerido para casos de accidentes laborales
6. **carnetPoliza** - Necesario para validación de seguros

### Prioridad Media
7. **zona** - Útil para análisis geográfico
8. **nivelEducacion** - Importante para estadísticas
9. **empleadorActual** - Útil para casos laborales
10. **tipoUsuario** - Clasificación administrativa

### Prioridad Baja (Pueden ser opcionales o calculados)
11. **edad** - Puede calcularse desde fechaNacimiento
12. **referidoPor** - Útil para análisis de marketing/captación
13. **nombreRefiere** - Complemento de referidoPor
14. **tipoPaciente** - Puede ser una categorización interna
15. **categoria** - Similar a tipoPaciente, puede ser opcional

---

## 💡 NOTAS ADICIONALES

### Campos Existentes que Podrían Mejorarse:
1. **contactosEmergencia** (JSON) - Funciona bien pero podría tener campos más estructurados
2. **tipoDocumento** - Agregar más tipos (Pasaporte, Cédula Extranjería, etc.)

### Campos Calculables:
- **edad** - No es necesario almacenarla, se calcula desde `fechaNacimiento`

### Consideraciones de Diseño:
- El campo **convenio** podría ser una relación con otra tabla si hay muchos convenios
- **EPS** y **ARL** podrían ser relaciones a tablas de catálogo
- **referidoPor** podría relacionarse con la tabla de doctores/usuarios
