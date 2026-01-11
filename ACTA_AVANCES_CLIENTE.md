# ACTA DE AVANCES DEL PROYECTO
## Sistema de Gestion Hospitalaria - Clinica Mia

**Fecha:** 29 de Diciembre de 2025
**Cliente:** Clinica Mia
**Version del Sistema:** 2.1.0

---

# INTRODUCCION

El presente documento detalla los avances realizados en el desarrollo del Sistema de Gestion Hospitalaria para Clinica Mia, especificamente en los modulos de **Gestion de Talento Humano**, **Seguridad y Salud en el Trabajo (SST)** y el **Panel del Doctor**.

Estos modulos han sido disenados para optimizar los procesos internos de la clinica, garantizar el cumplimiento de la normatividad colombiana vigente y mejorar la experiencia tanto del personal administrativo como del equipo medico.

---

# MODULO DE TALENTO HUMANO (RECURSOS HUMANOS)

## Descripcion General

El modulo de Talento Humano permite gestionar de manera integral todo el ciclo de vida del empleado dentro de la organizacion, desde el proceso de seleccion hasta la desvinculacion, incluyendo el procesamiento de nomina conforme a la legislacion laboral colombiana 2025.

## Funcionalidades Disponibles

### 1. Reclutamiento y Seleccion de Personal

**Que hace:**
- Permite publicar vacantes de empleo especificando el cargo, departamento, requisitos y salario ofrecido
- Los candidatos pueden registrarse y aplicar a las vacantes disponibles
- El sistema organiza automaticamente los candidatos en un "pipeline" o flujo de seleccion visual

**Flujo de Seleccion:**
```
Aplicado -> Preseleccionado -> Entrevista -> Seleccionado -> Contratado
```

**Asistente de Inteligencia Artificial:**
- Analiza automaticamente las hojas de vida de los candidatos
- Genera preguntas personalizadas para las entrevistas basadas en el perfil del cargo
- Sugiere los candidatos mas idoneos segun los requisitos de la vacante

### 2. Gestion de Empleados

**Que hace:**
- Mantiene un expediente digital completo de cada empleado
- Registra informacion personal, de contacto, documentos y formacion academica
- Permite visualizar la estructura organizacional (organigrama)
- Gestiona las relaciones jerarquicas (jefes y subordinados)

**Informacion del Expediente:**
- Datos personales y de contacto
- Documentos (cedula, certificados, diplomas)
- Historial laboral dentro de la empresa
- Capacitaciones realizadas
- Evaluaciones de desempeno

### 3. Contratos Laborales

**Que hace:**
- Crea y administra diferentes tipos de contratos:
  - Contrato a termino indefinido
  - Contrato a termino fijo
  - Contrato temporal
  - Contrato de practicas (Practicum)
- Registra las modificaciones realizadas a los contratos
- Alerta automaticamente cuando un contrato esta proximo a vencer
- Calcula automaticamente la liquidacion al terminar un contrato

### 4. Procesamiento de Nomina

**Que hace:**
- Procesa la nomina quincenal o mensual de todos los empleados
- Calcula automaticamente todos los conceptos segun la normatividad colombiana 2025:

**Valores Aplicados (2025):**
| Concepto | Valor |
|----------|-------|
| Salario Minimo | $1.423.500 COP |
| Auxilio de Transporte | $200.000 COP |
| Aporte Salud (empleado) | 4% |
| Aporte Pension (empleado) | 4% |
| Caja de Compensacion | 4% |
| SENA | 2% |
| ICBF | 3% |

**Documentos Generados:**
- Colilla de pago individual para cada empleado
- Archivo PILA para pago de seguridad social
- Certificado laboral
- Certificado de ingresos y retenciones

### 5. Control de Asistencia

**Que hace:**
- Registra la hora de entrada y salida de los empleados
- Gestiona los diferentes turnos de trabajo
- Permite crear y asignar turnos personalizados

### 6. Vacaciones y Permisos

**Que hace:**
- Los empleados pueden solicitar vacaciones desde el sistema
- Calcula automaticamente los dias de vacaciones disponibles
- El jefe directo recibe la solicitud y puede aprobarla o rechazarla
- Gestiona permisos especiales (calamidad, citas medicas, etc.)

**Calculo de Vacaciones:**
- 15 dias habiles por cada ano trabajado
- El sistema lleva el control del saldo disponible

### 7. Evaluacion de Desempeno

**Que hace:**
- Permite crear periodos de evaluacion (anual, semestral)
- Realiza evaluaciones 360 grados:
  - Autoevaluacion del empleado
  - Evaluacion del jefe directo
  - Evaluacion de companeros (pares)
  - Evaluacion de subordinados (si aplica)
- Permite establecer y dar seguimiento a objetivos individuales
- Genera reportes de resultados y tendencias

### 8. Capacitaciones

**Que hace:**
- Programa cursos y capacitaciones para el personal
- Registra la asistencia de los participantes
- Genera certificados de participacion automaticamente
- Lleva estadisticas de cobertura de capacitacion

### 9. Bienestar Laboral

**Que hace:**
- Administra el catalogo de beneficios de la empresa
- Asigna beneficios a los empleados elegibles
- Crea y publica encuestas de clima laboral
- Analiza los resultados de las encuestas
- Programa eventos de bienestar (cumpleanos, integraciones)
- Registra reconocimientos y logros de los empleados

---

# MODULO DE SEGURIDAD Y SALUD EN EL TRABAJO (SST)

## Descripcion General

El modulo SST permite gestionar el Sistema de Gestion de Seguridad y Salud en el Trabajo conforme al Decreto 1072 de 2015 y la Resolucion 0312 de 2019. Incluye todas las herramientas necesarias para cumplir con los estandares minimos exigidos por el Ministerio de Trabajo.

## Funcionalidades Disponibles

### 1. Panel de Control (Dashboard)

**Que muestra:**
- Indicadores clave de seguridad en tiempo real
- Alertas de vencimientos proximos (examenes, documentos, EPP)
- Resumen de accidentes e incidentes del periodo
- Porcentaje de cumplimiento del plan anual
- Graficos de tendencias de accidentalidad

### 2. Gestion de Accidentes de Trabajo

**Que hace:**
- Permite registrar todos los accidentes laborales con informacion detallada:
  - Fecha, hora y lugar del accidente
  - Tipo de lesion y parte del cuerpo afectada
  - Descripcion de como ocurrio
  - Testigos presenciales
  - Atencion medica recibida
  - Dias de incapacidad

**Documentos Generados:**
- FURAT (Formato Unico de Reporte de Accidente de Trabajo) en PDF
- Este documento es el requerido para reportar a la ARL

### 3. Investigacion de Accidentes

**Que hace:**
- Crea investigaciones formales siguiendo la metodologia de la Resolucion 1401 de 2007
- Aplica la tecnica de los "5 Por Que" para identificar causas raiz
- Registra los miembros del equipo investigador
- Define medidas de control con responsables y fechas limite
- Hace seguimiento al cumplimiento de las medidas

### 4. Registro de Incidentes (Casi-Accidentes)

**Que hace:**
- Permite reportar situaciones que pudieron causar un accidente pero no lo hicieron
- Clasifica los incidentes segun su potencial de gravedad
- Ayuda a tomar acciones preventivas antes de que ocurra un accidente real

### 5. Enfermedades Laborales

**Que hace:**
- Registra los casos de enfermedad laboral diagnosticados
- Utiliza la clasificacion internacional CIE-10
- Registra el porcentaje de perdida de capacidad laboral (PCL)
- Hace seguimiento medico a los casos
- Genera el FUREL (Formato Unico de Reporte de Enfermedad Laboral)

### 6. Matriz de Identificacion de Peligros (Matriz IPVR)

**Que hace:**
- Identifica todos los peligros presentes en cada area de trabajo
- Clasifica los peligros por tipo:
  - Biomecanicos (posturas, movimientos repetitivos)
  - Fisicos (ruido, iluminacion, temperatura)
  - Quimicos (sustancias, vapores)
  - Biologicos (virus, bacterias)
  - Psicosociales (estres, carga mental)
- Valora el nivel de riesgo de cada peligro usando la metodologia GTC 45
- Define medidas de control para reducir los riesgos

**Niveles de Riesgo:**
| Nivel | Significado | Accion |
|-------|-------------|--------|
| I | No Aceptable | Intervencion inmediata |
| II | No Aceptable | Corregir y adoptar medidas |
| III | Aceptable | Mejorar si es posible |
| IV | Aceptable | Mantener medidas actuales |

### 7. Examenes Medicos Ocupacionales

**Que hace:**
- Programa los examenes medicos de ingreso, periodicos y de egreso
- Registra los resultados y conceptos medicos:
  - Apto
  - Apto con restricciones
  - No apto
- Alerta cuando un examen esta proximo a vencer
- Muestra la cobertura de examenes del personal
- Administra el directorio de IPS proveedoras

### 8. Profesiogramas

**Que hace:**
- Define el perfil de riesgos para cada cargo de la empresa
- Especifica que examenes medicos requiere cada cargo
- Lista los elementos de proteccion personal (EPP) necesarios
- Identifica las capacitaciones obligatorias por cargo

### 9. COPASST (Comite Paritario de SST)

**Que hace:**
- Registra los integrantes del comite (representantes del empleador y trabajadores)
- Programa y documenta las reuniones mensuales
- Genera las actas de reunion automaticamente
- Registra los compromisos adquiridos y hace seguimiento
- Alerta cuando hay compromisos pendientes

### 10. Comite de Convivencia Laboral

**Que hace:**
- Administra los integrantes del comite
- Registra las reuniones trimestrales
- Recibe y gestiona las quejas de acoso laboral
- Hace seguimiento a los casos reportados
- Documenta las acciones tomadas

### 11. Plan Anual de Trabajo SST

**Que hace:**
- Permite crear el plan de trabajo anual con metas y actividades
- Asigna responsables y fechas a cada actividad
- Permite adjuntar evidencias de cumplimiento
- Calcula automaticamente el porcentaje de avance
- Permite clonar el plan del ano anterior como base

### 12. Capacitaciones de Seguridad

**Que hace:**
- Programa las capacitaciones obligatorias de SST:
  - Induccion en SST para nuevos empleados
  - Capacitacion especifica segun el cargo
  - Entrenamiento para brigadistas
  - Actualizaciones normativas
- Registra la asistencia de los participantes
- Aplica evaluaciones post-capacitacion
- Genera certificados automaticamente
- Muestra estadisticas de cobertura

### 13. Inspecciones de Seguridad

**Que hace:**
- Programa inspecciones periodicas de las areas de trabajo
- Utiliza listas de verificacion predefinidas
- Registra los hallazgos encontrados (actos y condiciones inseguras)
- Clasifica los hallazgos por prioridad
- Asigna responsables para corregir los hallazgos
- Hace seguimiento hasta el cierre

### 14. Indicadores de SST

**Que hace:**
- Calcula automaticamente los indicadores obligatorios:

| Indicador | Formula | Meta Tipica |
|-----------|---------|-------------|
| Frecuencia | (Accidentes x 240,000) / Horas trabajadas | < 10 |
| Severidad | (Dias perdidos x 240,000) / Horas trabajadas | < 100 |
| Ausentismo | (Horas ausentes / Horas programadas) x 100 | < 3% |

- Genera graficos de tendencias
- Compara con periodos anteriores
- Muestra coberturas (examenes, capacitacion, EPP)

### 15. Elementos de Proteccion Personal (EPP)

**Que hace:**
- Mantiene el catalogo de EPP disponibles
- Registra las entregas de EPP a cada empleado
- El empleado firma digitalmente al recibir
- Alerta cuando un EPP esta proximo a vencer
- Muestra el historial de entregas por empleado

### 16. Plan de Emergencias

**Que hace:**
- Documenta el plan de respuesta ante emergencias
- Identifica las amenazas (incendio, sismo, inundacion, etc.)
- Define los procedimientos de evacuacion
- Lista los recursos disponibles (extintores, camillas, botiquines)
- Registra los puntos de encuentro

### 17. Brigada de Emergencias

**Que hace:**
- Registra los miembros de la brigada y sus roles:
  - Brigada de evacuacion
  - Brigada de primeros auxilios
  - Brigada contra incendios
- Programa los entrenamientos de la brigada
- Genera el directorio de emergencias

### 18. Simulacros

**Que hace:**
- Programa y documenta los simulacros de emergencia
- Registra los participantes
- Evalua los tiempos de respuesta
- Identifica oportunidades de mejora
- Hace seguimiento a las acciones de mejora

### 19. Documentos del Sistema SST

**Que hace:**
- Almacena todos los documentos del sistema:
  - Politica de SST
  - Reglamento de higiene y seguridad
  - Procedimientos
  - Instructivos
  - Formatos
- Controla las versiones de los documentos
- Registra las aprobaciones
- Alerta cuando un documento requiere actualizacion

### 20. Auditorias Internas

**Que hace:**
- Programa las auditorias internas del sistema
- Registra el equipo auditor
- Documenta los hallazgos (conformidades y no conformidades)
- Genera acciones correctivas automaticamente
- Hace seguimiento al cierre de hallazgos

### 21. Acciones Correctivas y Preventivas

**Que hace:**
- Registra las acciones derivadas de:
  - Investigaciones de accidentes
  - Auditorias
  - Inspecciones
  - Quejas y sugerencias
- Asigna responsables y fechas
- Hace seguimiento a la implementacion
- Verifica la eficacia de las acciones
- Cierra formalmente cuando se completa

### 22. Evaluacion de Estandares Minimos (Resolucion 0312/2019)

**Que hace:**
- Permite evaluar el cumplimiento de los 13 estandares minimos exigidos
- Cada estandar tiene multiples items de verificacion
- Calcula automaticamente el porcentaje de cumplimiento
- Genera el plan de mejoramiento para los items incumplidos
- Permite comparar evaluaciones de diferentes periodos

**Clasificacion segun Resultado:**
| Porcentaje | Clasificacion | Accion |
|------------|---------------|--------|
| < 60% | Critico | Plan de mejora inmediato |
| 60-85% | Moderadamente aceptable | Plan de mejora |
| > 85% | Aceptable | Mantener y mejorar |

### 23. Sistema de Alertas Automaticas

**Que hace:**
- Envia correos electronicos automaticos para alertar sobre:
  - Examenes medicos proximos a vencer
  - Documentos que requieren actualizacion
  - EPP proximos a vencer
  - Compromisos pendientes
  - Fechas limite de actividades

**Configuracion de Alertas:**
- Se pueden definir los destinatarios por tipo de alerta
- Se configuran los dias de anticipacion (30, 15, 7, 1 dia antes)
- Se establece la prioridad de cada tipo de alerta
- Se mantiene historial de todas las alertas enviadas

---

# PANEL DEL DOCTOR

## Descripcion General

El Panel del Doctor es el espacio de trabajo disenado especificamente para el personal medico. Permite gestionar la agenda de citas, realizar consultas medicas completas, generar ordenes y prescripciones, y cuenta con un asistente de inteligencia artificial que apoya la toma de decisiones clinicas.

## Funcionalidades Disponibles

### 1. Dashboard del Doctor

**Que muestra:**
- Lista de pacientes en espera de ser atendidos
- Citas programadas para el dia
- Pacientes hospitalizados a cargo del doctor
- Alertas clinicas importantes
- Resumen de actividad del dia

### 2. Cola de Atencion

**Como funciona:**
- Los pacientes aparecen en orden de llegada
- El doctor presiona "Llamar" para iniciar la atencion
- El sistema muestra el nombre del paciente en pantalla (llamado)
- El estado de la cita cambia automaticamente

**Estados de la Cita:**
```
Programada -> En Espera -> Atendiendo -> Completada
```

### 3. Consulta Medica Digital

**Flujo de la Consulta:**

El doctor completa la consulta en etapas organizadas:

**Etapa 1 - Historia del Paciente (Anamnesis)**
- Motivo de consulta
- Enfermedad actual
- Revision de antecedentes del paciente

**Etapa 2 - Revision por Sistemas**
- Permite revisar sistematicamente cada sistema corporal
- Registra los hallazgos positivos y negativos

**Etapa 3 - Signos Vitales**
- Temperatura
- Presion arterial
- Frecuencia cardiaca
- Frecuencia respiratoria
- Saturacion de oxigeno
- Peso y talla
- El sistema calcula automaticamente el IMC

**Etapa 4 - Nota SOAP (Obligatoria)**
- **S**ubjetivo: Lo que refiere el paciente
- **O**bjetivo: Hallazgos del examen fisico
- **A**nalisis: Interpretacion y diagnosticos
- **P**lan: Tratamiento y recomendaciones

**Etapa 5 - Diagnosticos**
- Busqueda de diagnosticos usando codigos CIE-11
- Permite agregar multiples diagnosticos
- Clasifica entre principal y secundarios

**Etapa 6 - Tratamiento**
- Prescripcion de medicamentos
- Ordenes de examenes de laboratorio
- Ordenes de imagenes diagnosticas
- Ordenes de procedimientos
- Recomendaciones al paciente

### 4. Finalizacion de la Consulta

**Que sucede al finalizar:**
- Se crea la evolucion clinica con firma digital del doctor
- Se registran los signos vitales en el historial
- Se guardan los diagnosticos en la historia clinica
- Se generan las ordenes medicas
- Se crean las prescripciones (recetas)
- Se programa automaticamente la cita de control si aplica
- Todo queda auditado con fecha, hora y usuario

### 5. Historia Clinica Electronica (HCE)

**Que contiene:**
- Todas las consultas anteriores del paciente
- Signos vitales historicos con graficas de tendencia
- Diagnosticos previos
- Medicamentos formulados
- Examenes y procedimientos realizados
- Alertas clinicas (alergias, factores de riesgo)

**Caracteristicas de Seguridad:**
- Cada registro tiene firma digital del medico
- No se pueden modificar registros anteriores
- Todo cambio queda auditado
- Cumple con la Resolucion 1995 de 1999

### 6. Gestion de la Agenda

**Que permite:**
- Ver la agenda diaria, semanal o mensual
- Configurar los horarios de atencion del doctor
- Bloquear horarios para reuniones o actividades
- Ver la disponibilidad en tiempo real

**Configuracion de Horarios:**
- Se definen los dias y horas de atencion
- Se puede configurar horario diferente para cada dia
- Se pueden crear excepciones para fechas especificas
- El sistema respeta automaticamente los horarios al agendar

### 7. Prescripciones Medicas (Recetas)

**Que permite:**
- Buscar medicamentos del catalogo
- Especificar dosis, frecuencia y duracion
- Agregar indicaciones especiales
- El sistema valida interacciones entre medicamentos
- Se genera la receta en formato imprimible

**Informacion de la Receta:**
- Nombre del medicamento
- Presentacion
- Dosis
- Via de administracion
- Frecuencia
- Duracion del tratamiento
- Cantidad total a dispensar

### 8. Ordenes Medicas

**Tipos de Ordenes:**
- Examenes de laboratorio
- Imagenes diagnosticas (Rx, ecografia, TAC, RM)
- Procedimientos medicos
- Interconsultas con especialistas

**Que incluye cada orden:**
- Diagnostico presuntivo
- Examen o procedimiento solicitado
- Indicaciones especiales
- Prioridad (urgente, prioritario, rutinario)

### 9. Asistente de Inteligencia Artificial

**Que puede hacer el asistente:**

**Consulta de Historia Clinica:**
- "¿Cuales son las alergias de este paciente?"
- "Muestrame los medicamentos actuales"
- "¿Que diagnosticos previos tiene?"
- "¿Como han evolucionado sus signos vitales?"

**Apoyo Diagnostico:**
- Sugiere posibles diagnosticos basados en los sintomas
- Proporciona diagnosticos diferenciales
- Indica examenes sugeridos para confirmar

**Validacion de Tratamiento:**
- Verifica interacciones entre medicamentos
- Alerta sobre contraindicaciones
- Sugiere ajustes de dosis segun el paciente

**Generacion de Documentos:**
- Ayuda a redactar la nota SOAP
- Resume la consulta automaticamente
- Genera cartas de referencia

**Caracteristicas:**
- Responde en tiempo real
- Accede a toda la historia clinica del paciente
- Las conversaciones quedan registradas para auditoria
- No reemplaza el criterio medico, solo apoya

### 10. Modulo de Hospitalizacion

**Para pacientes hospitalizados, el doctor puede:**

**Ronda Medica:**
- Ver todos sus pacientes hospitalizados
- Revisar las notas de enfermeria
- Ver los signos vitales del dia
- Escribir evoluciones diarias

**Ordenes en Hospitalizacion:**
- Ordenar medicamentos para administrar
- Solicitar examenes urgentes
- Indicar dieta y cuidados especiales
- Programar procedimientos

**Epicrisis:**
- Al dar de alta al paciente
- Resume toda la hospitalizacion
- Incluye diagnosticos, procedimientos realizados
- Indica recomendaciones al egreso
- Se genera automaticamente como borrador

---

# INTEGRACION ENTRE MODULOS

## Talento Humano + SST

Los modulos trabajan de manera integrada:

- **Al contratar un empleado:** Se crea automaticamente su perfil en SST con los examenes medicos y EPP requeridos segun su cargo
- **Al cambiar de cargo:** Se actualizan automaticamente los riesgos y examenes ocupacionales
- **Las capacitaciones de SST:** Aparecen en el expediente del empleado en Talento Humano
- **Los accidentes de trabajo:** Generan automaticamente el registro de incapacidad en nomina

## Panel del Doctor + Farmacia

- Las prescripciones generadas por el doctor llegan automaticamente a farmacia
- Farmacia puede ver el historial de medicamentos del paciente
- Se validan existencias antes de dispensar

## Panel del Doctor + Laboratorio/Imagenologia

- Las ordenes medicas llegan automaticamente al area correspondiente
- Los resultados quedan disponibles en la historia clinica del paciente
- El doctor recibe notificacion cuando los resultados estan listos

---

# CUMPLIMIENTO NORMATIVO

## Normatividad de Talento Humano

| Norma | Que Cumple |
|-------|------------|
| Codigo Sustantivo del Trabajo | Contratos, jornadas, vacaciones, liquidaciones |
| Ley 100 de 1993 | Aportes a seguridad social |
| Decreto 2943 de 2013 | Incapacidades y licencias |
| Estatuto Tributario | Retencion en la fuente |

## Normatividad de SST

| Norma | Que Cumple |
|-------|------------|
| Decreto 1072 de 2015 | Marco general del SG-SST |
| Resolucion 0312 de 2019 | Estandares minimos |
| Resolucion 1401 de 2007 | Investigacion de accidentes |
| GTC 45 | Metodologia de identificacion de peligros |
| Resolucion 2346 de 2007 | Examenes medicos ocupacionales |

## Normatividad de Historia Clinica

| Norma | Que Cumple |
|-------|------------|
| Resolucion 1995 de 1999 | Historia clinica electronica |
| Ley 23 de 1981 | Etica medica |
| Ley 527 de 1999 | Firma digital |
| CIE-11 | Codificacion de diagnosticos |

---

# BENEFICIOS DEL SISTEMA

## Para la Administracion

- **Ahorro de tiempo:** Procesos automatizados que antes eran manuales
- **Reduccion de errores:** Calculos automaticos de nomina, indicadores, etc.
- **Cumplimiento legal:** Alertas y herramientas para cumplir la normatividad
- **Informacion en tiempo real:** Dashboards con indicadores actualizados
- **Trazabilidad:** Todo queda registrado y auditable

## Para el Personal de SST

- **Control centralizado:** Todo el sistema SST en un solo lugar
- **Alertas automaticas:** No se olvidan vencimientos importantes
- **Documentacion organizada:** Facil acceso a todos los documentos
- **Indicadores automaticos:** No mas calculos manuales
- **Cumplimiento de estandares:** Herramienta alineada con la Resolucion 0312

## Para los Doctores

- **Consultas mas agiles:** Flujo de trabajo optimizado
- **Historia clinica completa:** Toda la informacion del paciente disponible
- **Asistente IA:** Apoyo en tiempo real durante la consulta
- **Menos papeleria:** Ordenes y recetas digitales
- **Firma digital:** Validez legal de los registros

## Para los Empleados

- **Portal de autoservicio:** Pueden ver su informacion, solicitar vacaciones
- **Colilla de pago digital:** Acceso a sus pagos
- **Certificados en linea:** Pueden descargar certificados laborales
- **Transparencia:** Ven su evaluacion de desempeno y objetivos

---

# PROXIMOS PASOS SUGERIDOS

1. **Capacitacion del personal** en el uso de cada modulo
2. **Migracion de datos** existentes al nuevo sistema
3. **Configuracion de alertas** segun las necesidades de la clinica
4. **Personalizacion de formatos** (colillas, certificados, ordenes)
5. **Pruebas piloto** con un grupo reducido de usuarios

---

# CONTACTO Y SOPORTE

Para consultas tecnicas o soporte del sistema, comunicarse con el equipo de desarrollo.

---

**Fin del Acta de Avances**

*Documento preparado para: Clinica Mia*
*Fecha: 29 de Diciembre de 2025*
