# Medicamentos Module - Deployment Checklist ✅

**Guía paso a paso para desplegar el módulo de Medicamentos en producción.**

---

## 📋 Pre-Deployment Checklist

### 1. Verificación de Archivos

- [ ] Todos los archivos backend creados (23 files)
- [ ] Todos los archivos frontend creados (60+ files)
- [ ] Documentación presente (README.md, API_REFERENCE.md)
- [ ] Git status limpio (sin conflictos)

### 2. Dependencies

**Backend:**
```bash
cd backend
npm install node-cron
npm install # Verificar que todas las deps estén instaladas
```

- [ ] node-cron instalado
- [ ] Prisma actualizado
- [ ] Todas las dependencias sin errores

**Frontend:**
```bash
cd frontend
npm install echarts echarts-for-react xlsx
npm install # Verificar que todas las deps estén instaladas
```

- [ ] echarts instalado
- [ ] echarts-for-react instalado
- [ ] xlsx instalado (para exportaciones)
- [ ] Todas las dependencias sin errores

---

## 🗄️ Database Setup

### 1. Backup de Base de Datos (IMPORTANTE)

```bash
# PostgreSQL backup
pg_dump -U postgres -d clinica_mia > backup_pre_medicamentos_$(date +%Y%m%d).sql
```

- [ ] Backup creado exitosamente
- [ ] Backup verificado (tamaño > 0)
- [ ] Backup guardado en ubicación segura

### 2. Prisma Migrations

```bash
cd backend

# Ver el estado actual
npx prisma migrate status

# Ejecutar migración
npx prisma migrate dev --name add_medicamentos_complete_module

# Generar cliente Prisma
npx prisma generate
```

- [ ] Migración ejecutada sin errores
- [ ] Cliente Prisma generado
- [ ] Verificar en Prisma Studio que los modelos existen

### 3. Verificación de Modelos

```bash
npx prisma studio
```

**Verificar que existen:**
- [ ] ProtocoloMedicamento
- [ ] DocumentoProtocoloMedicamento
- [ ] InventarioMedicamento
- [ ] RegistroTemperaturaHumedad
- [ ] FormatoMedicamento
- [ ] InstanciaFormatoMedicamento
- [ ] DocumentoReporte
- [ ] ReporteFarmacovigilancia (con campos nuevos)
- [ ] ReporteTecnovigilancia (con campos nuevos)
- [ ] AlertaCalidad2 (existente)

---

## ⚙️ Backend Configuration

### 1. Activar Cron Job (Opcional pero Recomendado)

Editar `/backend/server.js`:

```javascript
// Después de configurar rutas y antes de app.listen()

// ==========================================
// CRON JOBS
// ==========================================
if (process.env.NODE_ENV !== 'test') {
  // Alertas automáticas de medicamentos
  require('./cron/alertasMedicamentos');
  console.log('✅ Cron job de alertas medicamentos activado (6:00 AM diario)');
}
```

- [ ] Código agregado a server.js
- [ ] Verificar consola al iniciar servidor
- [ ] Mensaje de confirmación visible

### 2. Verificar Rutas

```bash
cd backend
npm run dev
```

**Abrir:** `http://localhost:4000/`

- [ ] Servidor inicia sin errores
- [ ] Endpoint raíz lista todas las rutas
- [ ] Rutas `/calidad2/medicamentos/*` visibles

### 3. Test de Endpoints

```bash
# Obtener token (ajustar credenciales)
TOKEN=$(curl -s -X POST http://localhost:4000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicamia.com","password":"admin123"}' \
  | jq -r '.data.token')

# Test dashboard
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/calidad2/medicamentos/dashboard/resumen-general

# Test inventario
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/calidad2/medicamentos/inventario
```

- [ ] Login exitoso
- [ ] Token recibido
- [ ] Dashboard endpoint responde (200 OK)
- [ ] Inventario endpoint responde (200 OK)

---

## 🎨 Frontend Setup

### 1. Verificar Integración

**Archivo:** `/frontend/components/clinica/Dashboard.jsx`

Buscar líneas:
```javascript
import MedicamentosModule from './calidad2/medicamentos/MedicamentosModule';
// ...
case 'calidad2-medicamentos':
  return <MedicamentosModule user={user} />;
```

- [ ] Import presente
- [ ] Case statement presente
- [ ] Sin errores de sintaxis

### 2. Verificar Sidebar

**Archivo:** `/frontend/components/clinica/Sidebar.jsx`

Buscar:
```javascript
activeModule === 'calidad2-medicamentos'
```

- [ ] Botón de menú "Medicamentos y Dispositivos" presente
- [ ] Click event configurado correctamente

### 3. Test de Compilación

```bash
cd frontend
npm run build
```

- [ ] Build completa sin errores
- [ ] Sin warnings críticos
- [ ] Archivos generados en `.next/`

### 4. Test de Desarrollo

```bash
npm run dev
```

**Abrir:** `http://localhost:3000`

- [ ] Frontend inicia sin errores
- [ ] Login funcional
- [ ] Navegación a Calidad 2.0 funciona

---

## 🧪 Functional Testing

### Test 1: Navegación

1. Login como admin
2. Click en menú lateral → **Calidad 2.0**
3. Click en **Medicamentos y Dispositivos**

- [ ] Módulo se carga
- [ ] Vista default: **Dashboard** tab
- [ ] 8 tabs visibles (Dashboard, Protocolos, Farmacovigilancia, Tecnovigilancia, Inventarios, Temperatura, Formatos, Alertas)
- [ ] Cambio entre tabs funciona

### Test 2: Dashboard

**En Dashboard tab:**

- [ ] 13 tarjetas de resumen se muestran
- [ ] Gráfica de reportes mensuales visible (Echarts)
- [ ] Gráfica de distribución de inventario visible
- [ ] Gráfica de alertas por prioridad visible
- [ ] Botón "Exportar a Excel" visible
- [ ] Click en exportar descarga archivo

### Test 3: Inventario - Create

**En Inventarios tab → Medicamentos:**

1. Click **Nuevo Medicamento**
2. Llenar formulario:
   - Código: TEST-001
   - Nombre: Medicamento de Prueba
   - Tipo: MEDICAMENTO
   - Lote: L-TEST
   - Fecha Vencimiento: +90 días
   - Cantidad: 100
   - Unidad: Tabletas
   - Stock Mín: 20
3. Guardar

- [ ] Formulario se abre
- [ ] Campos se llenan sin errores
- [ ] Validación funciona (campos requeridos)
- [ ] Toast de éxito aparece
- [ ] Item aparece en la lista
- [ ] Días para vencer se calcula automáticamente

### Test 4: Alertas - Generación Manual

**En Alertas tab:**

1. Click **Generar Ahora**
2. Esperar confirmación

- [ ] Botón se deshabilita durante generación
- [ ] Toast de éxito aparece
- [ ] Alertas se muestran en la lista
- [ ] Alerta del medicamento de prueba (TEST-001) aparece

### Test 5: Alertas - Atención

**En lista de alertas:**

1. Click en una alerta
2. Click **Marcar como Atendida**
3. Agregar observaciones
4. Confirmar

- [ ] Diálogo se abre
- [ ] Campo de observaciones funciona
- [ ] Toast de éxito
- [ ] Alerta desaparece de lista de activas
- [ ] Badge "Atendida" aparece en la alerta

### Test 6: Temperatura - Registro con Alerta

**En Temperatura tab:**

1. Click **Nuevo Registro**
2. Llenar:
   - Área: FARMACIA
   - Fecha: Hoy
   - Hora: 8
   - Temperatura: 30°C (fuera de rango 15-25)
   - Humedad: 50%
   - Acción correctiva: "Ajuste de aire acondicionado"
3. Guardar

- [ ] Rangos se autocompletan al seleccionar área
- [ ] Warning visible (temperatura fuera de rango)
- [ ] Campo acción correctiva se muestra
- [ ] Toast de éxito
- [ ] Registro aparece con badge rojo
- [ ] Alerta automática se crea

### Test 7: Farmacovigilancia - Reporte INVIMA

**En Farmacovigilancia tab:**

1. Click **Nuevo Reporte**
2. Llenar formulario básico
3. Guardar (estado: BORRADOR)
4. Abrir reporte
5. Click **Reportar a INVIMA**
6. Ingresar número INVIMA
7. Confirmar

- [ ] Formulario completo se muestra
- [ ] Guardar funciona
- [ ] Estado inicial: BORRADOR
- [ ] Botón "Reportar a INVIMA" visible
- [ ] Modal se abre
- [ ] Badge cambia a "Reportado a INVIMA"
- [ ] Fecha de reporte se registra

### Test 8: Exportaciones

**Probar exports en diferentes módulos:**

1. Dashboard → Exportar a Excel
2. Inventarios → Exportar
3. Farmacovigilancia → Exportar
4. Temperatura → Exportar

- [ ] Archivo se descarga (no error)
- [ ] Nombre de archivo incluye timestamp
- [ ] Archivo abre en Excel
- [ ] Hoja "Datos" tiene contenido
- [ ] Hoja "Resumen" tiene estadísticas

---

## 🔐 Security Verification

### Permisos

**Verificar que solo usuarios con permiso `calidad2` pueden acceder:**

1. Login con usuario sin permiso calidad2
2. Intentar acceder a `/calidad2/medicamentos/*`

- [ ] Usuario sin permiso recibe 403 Forbidden
- [ ] Usuario con permiso accede correctamente
- [ ] SUPER_ADMIN accede sin restricciones

### Autenticación

- [ ] Requests sin token reciben 401 Unauthorized
- [ ] Token expirado redirige a login
- [ ] Refresh token funciona

---

## ⏰ Cron Job Verification

### Test Manual del Cron

```bash
cd backend
node -e "require('./cron/alertasMedicamentos')"
```

- [ ] Script ejecuta sin errores
- [ ] Mensaje de confirmación
- [ ] Alertas se crean en DB

### Verificar Schedule

```javascript
// En alertasMedicamentos.js
cron.schedule('0 6 * * *', ..., { timezone: 'America/Bogota' })
```

- [ ] Schedule correcto: 6:00 AM
- [ ] Timezone: America/Bogota
- [ ] Función `generarTodasAlertas()` se llama

### Monitoreo (Post-Deploy)

**Día siguiente a las 6:00 AM:**

- [ ] Verificar logs del servidor
- [ ] Verificar nuevas alertas en DB
- [ ] Verificar que no hay errores

---

## 📊 Performance Testing

### Load Test Básico

```bash
# Test de carga simple (100 requests)
for i in {1..100}; do
  curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:4000/calidad2/medicamentos/inventario &
done
wait
```

- [ ] Todas las requests completan
- [ ] Tiempo de respuesta < 500ms promedio
- [ ] Sin errores 500
- [ ] Sin memory leaks

### Database Query Performance

```sql
-- Verificar índices
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename LIKE '%medicamento%';
```

- [ ] Índices en `fechaVencimiento`
- [ ] Índices en `area`
- [ ] Índices en `tipo`
- [ ] Queries < 100ms en promedio

---

## 🐛 Error Handling Verification

### Test Casos de Error

1. **Duplicado:**
   - Crear item de inventario
   - Intentar crear otro con mismo código

- [ ] Error 409 Conflict
- [ ] Mensaje descriptivo
- [ ] Frontend muestra toast de error

2. **Validación:**
   - Enviar POST sin campos requeridos

- [ ] Error 400 Bad Request
- [ ] Details con campos faltantes
- [ ] Frontend muestra errores en formulario

3. **Not Found:**
   - GET de ID inexistente

- [ ] Error 404 Not Found
- [ ] Mensaje claro

4. **Unauthorized:**
   - Request sin token

- [ ] Error 401 Unauthorized
- [ ] Redirect a login (frontend)

---

## 📱 Responsive Testing

**Probar en diferentes dispositivos/viewports:**

- [ ] Desktop (1920x1080) - OK
- [ ] Laptop (1366x768) - OK
- [ ] Tablet (768x1024) - OK
- [ ] Mobile (375x667) - OK

**Elementos a verificar:**
- [ ] Tabs no se solapan
- [ ] Cards responsive
- [ ] Formularios usables
- [ ] Gráficas se ajustan

---

## 📚 Documentation Verification

- [ ] README.md presente y completo
- [ ] API_REFERENCE.md presente y completo
- [ ] IMPLEMENTATION_SUMMARY.md presente
- [ ] Este DEPLOYMENT_CHECKLIST.md completado
- [ ] Comentarios en código crítico

---

## 🚀 Production Deployment

### Pre-Production

- [ ] Todos los tests pasados
- [ ] No hay errores en console
- [ ] No hay warnings críticos
- [ ] Performance aceptable
- [ ] Backup de DB confirmado

### Deployment Steps

1. **Merge a producción:**
```bash
git checkout main
git merge final
git push origin main
```

2. **Deploy Backend:**
```bash
cd backend
npm run build # Si aplica
pm2 restart clinica-backend # O el comando de deploy
```

3. **Deploy Frontend:**
```bash
cd frontend
npm run build
# Deploy según infraestructura (Vercel, etc.)
```

4. **Run migrations en producción:**
```bash
npx prisma migrate deploy
npx prisma generate
```

- [ ] Merge completado
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Migrations ejecutadas
- [ ] Servicios arriba y estables

### Post-Deployment Verification

**Esperar 5 minutos, luego:**

1. Acceder a producción
2. Login
3. Ir a Medicamentos
4. Verificar que carga

- [ ] Producción accesible
- [ ] Login funciona
- [ ] Módulo carga correctamente
- [ ] Dashboard se muestra

### Monitoreo Inicial (Primeras 24h)

- [ ] Verificar logs de errores
- [ ] Monitorear uso de CPU/RAM
- [ ] Verificar que cron ejecuta a las 6 AM
- [ ] Reportar cualquier issue

---

## 🎉 Launch Checklist

### Comunicación

- [ ] Notificar al equipo del deploy
- [ ] Enviar guía de usuario (README.md)
- [ ] Programar capacitación (si es necesario)
- [ ] Establecer canal de soporte

### Feedback Loop

- [ ] Configurar sistema de reporte de bugs
- [ ] Establecer métricas de uso
- [ ] Programar revisión en 1 semana
- [ ] Programar revisión en 1 mes

---

## ✅ Final Verification

**Una vez todo completado:**

- [ ] Módulo funcional en producción
- [ ] Usuarios pueden acceder
- [ ] Todas las features operativas
- [ ] Documentación entregada
- [ ] Equipo capacitado (si aplica)
- [ ] Soporte establecido

---

## 📞 Support Contacts

**En caso de issues:**

1. Revisar logs del servidor
2. Verificar documentación
3. Revisar issues conocidos (GitHub si aplica)
4. Contactar al equipo de desarrollo

---

## 🔄 Rollback Plan (Emergency)

**Si algo sale mal:**

```bash
# 1. Restaurar backup de DB
psql -U postgres -d clinica_mia < backup_pre_medicamentos_YYYYMMDD.sql

# 2. Revertir código
git revert <commit-hash>
git push origin main

# 3. Redeploy versión anterior
# Ejecutar deploy scripts anteriores
```

- [ ] Plan de rollback documentado
- [ ] Backup de DB accesible
- [ ] Commits identificados
- [ ] Procedimiento probado (en dev)

---

**🎊 DEPLOYMENT COMPLETO 🎊**

Una vez todos los checkboxes estén marcados, el módulo de Medicamentos está oficialmente en producción y listo para uso.

---

**Fecha de Deploy:** __________
**Deployado por:** __________
**Versión:** 1.0.0
**Estado:** ✅ PRODUCTION
