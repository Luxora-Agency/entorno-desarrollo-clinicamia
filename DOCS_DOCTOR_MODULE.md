# Módulo del Doctor - Documentación Técnica y de Usuario

## Visión General
El Módulo del Doctor de Clínica Mía ha sido reestructurado para ofrecer un flujo de trabajo eficiente, centrado en el paciente y compatible con la normativa colombiana (CIE-11, CUPS, RIPS).

## Arquitectura del Módulo

### Componentes Principales
1.  **Dashboard (`DashboardDoctor.jsx`)**: Centro de comando. Muestra KPIs, cola de atención y accesos rápidos.
2.  **Espacio Clínico (`ClinicalWorkspace.jsx`)**: Entorno de consulta inmersivo. Reemplaza los modales por una vista de pasos (Stepper).
3.  **Anamnesis (`AnamnesisForm.jsx`)**: Formulario detallado para historia clínica completa.
4.  **Epicrisis (`EpicrisisGenerator.jsx`)**: Generador de documentos de egreso y referencia.
5.  **Agenda (`DoctorScheduleManager.jsx`)**: Gestión de disponibilidad.

### Flujo de Datos
- **Backend**: Servicios `doctor.service.js`, `cita.service.js`, `paciente.service.js`, `egreso.service.js`.
- **Estado**: Se maneja estado local en el Workspace para evitar pérdida de datos antes de guardar.
- **Persistencia**: Al finalizar la consulta, se crea una transacción que guarda:
    -   Evolución (SOAP)
    -   Signos Vitales
    -   Diagnósticos (CIE-11)
    -   Prescripciones (Medicamentos)
    -   Órdenes (Procedimientos CUPS)
    -   Firma Digital (Hash SHA-256)

## Guía de Usuario (Doctores)

### 1. Iniciar el Día
- Ingrese al **Panel Médico**.
- Verifique sus KPIs (Pacientes Hoy, En Espera).
- Use la "Cola de Atención" para llamar al siguiente paciente.

### 2. Realizar una Consulta
1.  Haga clic en **"Llamar"** o **"Atender"** en la lista de pacientes.
2.  Se abrirá el **Espacio Clínico**.
3.  **Paso 1 - Historia**: Revise antecedentes y actualice la Anamnesis si es necesario.
4.  **Paso 2 - Vitales**: Registre los signos vitales del paciente.
5.  **Paso 3 - SOAP**: Redacte su evolución (Subjetivo, Objetivo, Análisis, Plan).
6.  **Paso 4 - Diagnóstico**: Busque el código CIE-11. Use la lista de frecuentes para rapidez.
7.  **Paso 5 - Tratamiento**: Genere recetas y órdenes médicas.
8.  **Finalizar**: Haga clic en "Finalizar Consulta". Confirme para firmar digitalmente.

### 3. Generar Epicrisis
- Desde el Panel, haga clic en "Generar Epicrisis".
- Seleccione la admisión activa.
- Complete el resumen de egreso y diagnóstico de salida.
- Imprima o guarde el PDF.

## Normativa Colombiana
- **CIE-11**: El sistema utiliza la codificación oficial de la OMS/MinSalud.
- **Consentimiento Informado**: Se requiere verificación antes de procedimientos.
- **Firma Digital**: Cumple con requisitos de integridad e inalterabilidad de la HCE.

## Soporte
Para reportar errores o solicitar mejoras, contacte al departamento de TI o use el módulo de PQRS interno.
