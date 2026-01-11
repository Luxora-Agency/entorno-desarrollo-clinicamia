# Plan de Reestructuración del Módulo de Doctor (Clinica Mia)

Este plan aborda la solicitud de un rediseño completo y mejora funcional del módulo del doctor, asegurando el cumplimiento normativo colombiano (CIE-11, CUPS, RIPS) y optimizando la eficiencia clínica.

## 1. Análisis y Arquitectura
El sistema actual cuenta con un backend robusto (Prisma/PostgreSQL) que ya soporta los modelos necesarios (HCE, CIE-11, CUPS, Prescripciones). La reestructuración se centrará principalmente en la **Experiencia de Usuario (UI/UX)**, la **cohesión de los flujos clínicos** y la **implementación de módulos faltantes** (Epicrisis, Anamnesis Detallada).

### Estructura Propuesta
- **Frontend**: Migración de un diseño basado en modales a un **"Espacio de Trabajo Clínico" (Clinical Workspace)** enfocado, libre de distracciones.
- **Backend**: Optimización de servicios existentes y creación de nuevos endpoints para agregación de datos (Patient 360).

## 2. Mejoras de UI/UX (Rediseño Visual y Funcional)

### A. Dashboard del Doctor (Rediseño)
Transformar `DashboardDoctor.jsx` en un centro de comando:
- **KPIs en tiempo real**: Pacientes en espera, tiempo promedio de atención, alertas críticas.
- **Agenda Inteligente**: Vista de línea de tiempo con indicadores de estado y tipo de cita.
- **Acceso Rápido**: Botones grandes para "Iniciar Consulta Inmediata", "Ver Resultados Críticos".

### B. Espacio de Trabajo de Consulta (Nuevo)
Reemplazar el modal actual por una vista de pantalla completa (`/doctor/consulta/[id]`) que incluya:
1.  **Barra Lateral de Contexto**: Datos vitales del paciente siempre visibles (Alergias, Edad, Peso, Alertas).
2.  **Navegación por Pasos (Stepper)**:
    -   **Paso 1: Anamnesis/Historia**: Antecedentes (cargados automáticamente), Motivo de consulta.
    -   **Paso 2: Examen Físico (SOAP)**: Signos vitales (con alertas de rangos), Hallazgos.
    -   **Paso 3: Diagnóstico (CIE-11)**: Buscador optimizado con "Favoritos" y "Recientes".
    -   **Paso 4: Plan y Manejo**: Prescripción (CUPS/Medicamentos), Incapacidades, Órdenes.
    -   **Paso 5: Resumen y Firma**: Vista previa de la evolución y firma digital.

## 3. Nuevas Funcionalidades y Módulos

### A. Módulo de Anamnesis Detallada
Desarrollar `AnamnesisForm.jsx` para "Primera Vez":
- Formulario estructurado para antecedentes patológicos, quirúrgicos, familiares, tóxicos y alérgicos.
- Integración con los campos del modelo `Paciente`.

### B. Módulo de Epicrisis y Referencia
Implementar `EpicrisisGenerator.jsx`:
- Generación automática de resúmenes de egreso basados en las evoluciones de la admisión.
- Formato estándar para impresión o exportación PDF.

### C. Agenda Médica Avanzada
Mejorar `DoctorScheduleManager.jsx`:
- **Bloqueos Recurrentes**: Permitir configurar horarios no disponibles repetitivos.
- **Tipos de Cita Visuales**: Colores distintivos para Primera Vez vs Control vs Procedimiento.

## 4. Integración Normativa y Técnica

### A. Cumplimiento Colombia
- **CIE-11**: Verificar y optimizar el buscador (`CatalogSearch`) para asegurar diagnósticos codificados.
- **CUPS**: Asegurar que todas las órdenes de procedimientos usen códigos CUPS vigentes.
- **Consentimiento Informado**: Integrar validación de consentimiento antes de procedimientos invasivos.

### B. Testing y Calidad
- **Tests de Integración**: Ampliar `doctor_flow.test.js` para cubrir el flujo completo de Anamnesis -> Diagnóstico -> Epicrisis.
- **Validación de Datos**: Implementar esquemas Zod estrictos en el frontend antes del envío.

## 5. Documentación
Crear `DOCS_DOCTOR_MODULE.md` incluyendo:
- Guía de uso del "Espacio de Trabajo Clínico".
- Flujograma de atención estándar.
- Diccionario de datos para CIE-11 y CUPS.

## Paso a Paso de Implementación

1.  **Refactorización de UI**: Crear el layout `ClinicalWorkspace` y rediseñar `DashboardDoctor`.
2.  **Desarrollo de Anamnesis**: Implementar el formulario detallado y conectarlo al servicio de pacientes.
3.  **Mejora de Consulta**: Integrar el flujo paso a paso (Stepper) en la consulta.
4.  **Epicrisis**: Implementar la vista y lógica de generación de Epicrisis.
5.  **Pruebas y Documentación**: Ejecutar tests y escribir manuales.
