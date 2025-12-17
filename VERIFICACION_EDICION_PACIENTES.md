# 🔍 Guía de Verificación - Carga de Datos en Edición de Pacientes

## ✅ Backend - Datos Verificados

He verificado que el backend está devolviendo **TODOS** los campos correctamente:

```json
{
  "estadoCivil": "union_libre",
  "ocupacion": "Médico",
  "nivelEducacion": "universitario_completo",
  "empleadorActual": "Hospital Nacional",
  "convenio": "Plan Empresa ABC",
  "arl": "SURA ARL",
  "carnetPoliza": "ARL-987654",
  "tipoUsuario": "empresa",
  "referidoPor": "Dra. Ana López",
  "nombreRefiere": "Ana López",
  "tipoPaciente": "Corporativo",
  "categoria": "VIP"
}
```

## 📝 Frontend - Mapeo de Campos

El código de carga está correctamente configurado en `PacienteStepperForm.jsx` líneas 150-191:

```javascript
setFormData({
  // ... otros campos ...
  estadoCivil: editingPaciente.estadoCivil || '',
  ocupacion: editingPaciente.ocupacion || '',
  nivelEducacion: editingPaciente.nivelEducacion || '',
  empleadorActual: editingPaciente.empleadorActual || '',
  convenio: editingPaciente.convenio || '',
  arl: editingPaciente.arl || '',
  carnetPoliza: editingPaciente.carnetPoliza || '',
  tipoUsuario: editingPaciente.tipoUsuario || '',
  referidoPor: editingPaciente.referidoPor || '',
  nombreRefiere: editingPaciente.nombreRefiere || '',
  tipoPaciente: editingPaciente.tipoPaciente || '',
  categoria: editingPaciente.categoria || '',
})
```

## 🔍 Para Verificar en el Frontend

He agregado console.logs para debugging. Para verificar:

1. **Abre la aplicación** en http://localhost:3000
2. **Abre las DevTools** del navegador (F12)
3. **Ve a la pestaña Console**
4. **Edita un paciente** con datos completos (ej: María Prueba Completa, cédula 8888888888)
5. **Verifica los logs**:
   - 🔍 "Editando paciente - Datos recibidos" - Debe mostrar TODO el objeto
   - 📋 "Campos clave" - Debe mostrar los valores de los nuevos campos

## ❓ Posibles Problemas y Soluciones

### Problema 1: Los campos aparecen vacíos
**Causa**: El objeto paciente podría venir en una estructura anidada desde algún componente padre
**Solución**: Verificar en los logs qué estructura tiene `editingPaciente`

### Problema 2: Solo algunos campos se cargan
**Causa**: Diferentes formatos de nombres (camelCase vs snake_case)
**Solución**: El backend ya está devolviendo todo en camelCase correcto

### Problema 3: Los selectores (dropdowns) aparecen vacíos
**Causa**: El valor guardado en BD no coincide con los valores del selector
**Solución**: Verificar que los valores sean exactamente iguales:
- ✅ `estadoCivil`: "union_libre" (con guión bajo)
- ✅ `nivelEducacion`: "universitario_completo"
- ✅ `tipoUsuario`: "empresa"
- ✅ `arl`: "SURA ARL" (nombre completo)

## 🧪 Prueba con el Paciente de Ejemplo

Paciente de prueba creado:
- **Nombre**: María Prueba Completa
- **Cédula**: 8888888888
- **ID**: 2fde2e16-dc6c-474f-86e3-06893213f28f

Este paciente tiene **TODOS** los campos nuevos llenos, úsalo para verificar.

## 📞 Qué Hacer Si Sigues Viendo Problemas

1. **Captura los logs** de la consola del navegador
2. **Toma screenshots** de los campos que no se cargan
3. **Compárteme** específicamente cuáles campos no se están cargando

De esta forma podré identificar exactamente cuál es el problema y solucionarlo.
