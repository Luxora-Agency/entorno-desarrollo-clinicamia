# Checklist de Deployment: 10 Mejoras Sistema de Consultas

## 📋 Pre-requisitos

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL con acceso a la base de datos
- [ ] OpenAI API Key configurada en .env
- [ ] Backup de la base de datos realizado

## 🔧 Backend

### 1. Actualizar dependencias
```bash
cd backend
npm install
```

### 2. Regenerar cliente Prisma
```bash
npm run prisma:generate
```

### 3. Ejecutar migración manual de base de datos
```bash
# Opción A: Usando psql (recomendado)
psql -U usuario -d clinica_mia -f migrations_manual/add_special_diagnosis_fields.sql

# Opción B: Desde Prisma Studio
npm run prisma:studio
# Luego ejecutar el SQL manualmente en la pestaña Query
```

**SQL a ejecutar:**
```sql
ALTER TABLE diagnosticos_hce 
ADD COLUMN IF NOT EXISTS fecha_diagnostico_exacta TIMESTAMP,
ADD COLUMN IF NOT EXISTS estado_confirmacion TEXT,
ADD COLUMN IF NOT EXISTS metodo_confirmacion TEXT,
ADD COLUMN IF NOT EXISTS metodo_confirmacion_detalle TEXT,
ADD COLUMN IF NOT EXISTS documento_respaldo_url TEXT,
ADD COLUMN IF NOT EXISTS documento_respaldo_nombre TEXT;
```

### 4. Verificar variables de entorno
```bash
# .env debe contener:
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o  # Para OCR Vision
```

### 5. Reiniciar servidor
```bash
npm run dev  # Desarrollo
# o
pm2 restart backend  # Producción
```

## 🎨 Frontend

### 1. Actualizar dependencias
```bash
cd frontend
npm install
```

### 2. Verificar variables de entorno
```bash
# .env.local debe contener:
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Build y deploy
```bash
npm run build
npm start  # Producción
# o
npm run dev  # Desarrollo
```

## ✅ Testing Post-Deployment

### Test 1: Validación Diagnósticos Especiales
- [ ] Ir a nueva consulta
- [ ] Seleccionar diagnóstico C50.9 (Cáncer de mama)
- [ ] Verificar que aparezca card amarilla "Validación Especial Requerida"
- [ ] Completar fecha, estado y método
- [ ] Intentar finalizar sin completar → debe mostrar error
- [ ] Completar todos los campos → debe permitir finalizar

### Test 2: OCR Extracción de Documentos
- [ ] En validación especial, subir PDF o imagen de biopsia
- [ ] Click en botón "Extraer con IA" (morado con Sparkles)
- [ ] Verificar que campos se auto-completen
- [ ] Ajustar datos si es necesario
- [ ] Finalizar consulta exitosamente

### Test 3: Corrector Ortografía
- [ ] En SOAP Subjetivo, escribir texto con errores: "El pasiente refiere dolr de cabesa"
- [ ] Click en "Corregir ortografía" (botón morado)
- [ ] Verificar que corrija a: "El paciente refiere dolor de cabeza"
- [ ] Repetir en los 4 campos SOAP
- [ ] Probar en Revisión por Sistemas → Observaciones Generales

### Test 4: Sistema "Otros Hallazgos"
- [ ] Ir a Revisión por Sistemas
- [ ] Scroll hasta el final
- [ ] Verificar que aparezca Sistema 14: "Otros Hallazgos"
- [ ] Marcar checkbox
- [ ] Verificar que aparezca textarea para texto libre
- [ ] Escribir hallazgos no clasificados
- [ ] Guardar consulta

### Test 5: Gráfico Peso + IMC
- [ ] Abrir Historia Clínica de paciente con varios registros
- [ ] Click en "Ver histórico de signos vitales"
- [ ] Seleccionar tab "IMC"
- [ ] Verificar que aparezcan 2 líneas:
   - Línea morada (IMC) en eje izquierdo
   - Línea cyan (Peso) en eje derecho
- [ ] Verificar leyenda con ambas métricas

### Test 6: Antecedentes con Defaults
- [ ] Crear nuevo antecedente patológico
- [ ] No llenar campo observaciones
- [ ] Guardar
- [ ] Verificar que se guarde con: "No manifiesta antecedentes patológicos"
- [ ] Repetir con los 6 tipos de antecedentes

### Test 7: Endpoints Backend
```bash
# Test corrector ortografía
curl -X POST http://localhost:4000/ai-assistant/corregir-ortografia \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"texto":"El pasiente refiere dolr de cabesa","contexto":"medico"}'

# Test extracción OCR
curl -X POST http://localhost:4000/ai-assistant/extract-document \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"BASE64_IMAGE_HERE"}'
```

## 🐛 Troubleshooting

### Error: "OpenAI no configurado"
**Causa**: Falta OPENAI_API_KEY en .env  
**Solución**: Agregar `OPENAI_API_KEY=sk-...` al archivo .env y reiniciar servidor

### Error: "Column does not exist: fecha_diagnostico_exacta"
**Causa**: Migración SQL no ejecutada  
**Solución**: Ejecutar migrations_manual/add_special_diagnosis_fields.sql

### Error: "Cannot find module '@/constants/diagnosticosEspeciales'"
**Causa**: Archivo de constantes no creado  
**Solución**: Verificar que exista frontend/constants/diagnosticosEspeciales.js

### Corrector ortografía no funciona
**Causa**: OPENAI_API_KEY inválida o modelo incorrecto  
**Solución**: Verificar API key y usar modelo gpt-4o o gpt-5.2

### OCR no extrae datos
**Causa 1**: Imagen de mala calidad  
**Solución**: Usar imágenes claras, alta resolución  
**Causa 2**: Modelo incorrecto  
**Solución**: Usar gpt-4o (con vision)

## 📊 Monitoreo

### Logs a vigilar
```bash
# Backend
tail -f backend/logs/app.log | grep -i "error\|warning"

# Prisma
tail -f backend/logs/prisma.log

# OpenAI
tail -f backend/logs/app.log | grep -i "openai"
```

### Métricas clave
- Tiempo de respuesta OCR: < 5 segundos
- Tasa de éxito corrector: > 95%
- Errores validación especial: Monitorear rechazos

## 🔒 Seguridad

- [ ] Nunca commitear OPENAI_API_KEY al repo
- [ ] Rotar API key cada 90 días
- [ ] Monitorear uso de tokens OpenAI
- [ ] Validar uploads de archivos (tamaño, tipo)
- [ ] Sanitizar datos extraídos por OCR antes de guardar

## 📝 Notas Adicionales

- **Costo OpenAI**: Cada extracción OCR ~$0.01-0.03 USD
- **Performance**: Corrector ortografía ~1-2 seg, OCR ~3-5 seg
- **Límites**: OpenAI tiene rate limits (verificar plan)
- **Fallback**: Si OpenAI falla, permitir entrada manual

## ✨ Features Completadas

1. ✅ Validación diagnósticos especiales (cáncer/huérfanas)
2. ✅ Antecedentes con valores por defecto
3. ✅ Corrector ortografía con IA (6 campos)
4. ✅ Sistema "Otros Hallazgos" en Revisión Sistemas
5. ✅ Peso en gráfico dual-axis con IMC
6. ✅ OCR extracción de documentos médicos
7. ✅ Motivo antes de anamnesis (ya existía)
8. ✅ Saturación opcional (ya existía)
9. ✅ Detección primera vez vs control (ya existía)
10. ✅ SOAP primero en consultas control (ya existía)

---

**Fecha de deployment**: _______________  
**Responsable**: _______________  
**Versión**: 1.0.0-mejoras-consultas
