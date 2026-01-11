# Documentación del Módulo de Historia Clínica Electrónica (HCE)

Este documento detalla la implementación, normativa y funcionamiento técnico del módulo de Historia Clínica Electrónica (HCE), actualizado para cumplir con la legislación colombiana (Resolución 1995 de 1999, Ley 2015 de 2020) y garantizar integridad, confidencialidad y disponibilidad.

## 1. Arquitectura y Componentes

### 1.1 Backend
- **Controlador**: `backend/routes/consultas.js`
  - Endpoint principal: `POST /consultas/finalizar`
  - Orquesta la creación de la evolución, firma digital, diagnósticos, signos vitales y órdenes.
  - Utiliza transacciones de Prisma para garantizar atomicidad.
- **Servicios**:
  - `EvolucionClinicaService`: Maneja la lógica CRUD de evoluciones SOAP.
  - `FirmaDigitalService`: Genera hashes SHA-256 y firmas digitales para garantizar integridad.
  - `AuditoriaService`: Registra cada acción (Creación, Firma, Acceso) en `auditoriaHCE`.
- **Modelos de Datos (Prisma)**:
  - `EvolucionClinica`: Almacena SOAP, `firmada` (bool), `hashRegistro` (SHA-256).
  - `DiagnosticoHCE`: Códigos CIE-11.
  - `SignoVital`: Datos fisiológicos.
  - `OrdenMedica`, `Prescripcion`, `AlertaClinica`.

### 1.2 Frontend
- **Dashboard Doctor**: `frontend/components/clinica/DashboardDoctor.jsx`
  - Interfaz principal para la atención.
  - Integra múltiples formularios (SOAP, Dx, Vitales, Alertas, Recetas).
  - **Validación**: Impide finalizar sin SOAP completo o sin verificar consentimiento.
  - **Consentimiento**: Checkbox explícito para verificar consentimiento informado.
- **Timeline**: `frontend/components/clinica/hce/TabTimeline.jsx`
  - Vista cronológica unificada.
  - **Indicadores de Integridad**: Muestra icono de "Candado" y "Firmado Digitalmente" con el hash verificable para registros cerrados.

## 2. Cumplimiento Normativo (Colombia)

| Requisito | Normativa | Implementación |
|-----------|-----------|----------------|
| **Integridad** | Res. 1995/99, Art. 17 | Firma Digital (SHA-256) al finalizar consulta. Registros firmados son inmutables. |
| **Confidencialidad** | Ley 1581/12 (Habeas Data) | Control de acceso por Roles (Middleware), Auditoría de accesos. |
| **Disponibilidad** | Res. 839/17 | Base de datos relacional (PostgreSQL) con respaldos. Timeline unificado. |
| **Interoperabilidad** | Ley 2015/20 | Uso de estándar CIE-11 para diagnósticos. Estructura SOAP estándar. |
| **Auditoría** | Res. 1995/99 | Tabla `AuditoriaHCE` registra Quién, Cuándo, Qué y Desde Dónde (IP). |

## 3. Flujo de Atención y Seguridad

1.  **Inicio de Consulta**: El médico cambia estado a "Atendiendo".
2.  **Registro**: Se diligencia SOAP, Vitales, Diagnósticos (CIE-11).
3.  **Cierre y Firma**:
    *   El sistema valida campos obligatorios.
    *   El médico confirma consentimiento informado.
    *   **Backend**:
        1.  Crea registro en `EvolucionClinica`.
        2.  Calcula Hash SHA-256 de (Subjetivo + Objetivo + Analisis + Plan + Fecha + DoctorID).
        3.  Actualiza registro con `firmaDigital` y `hashRegistro`.
        4.  Marca `firmada = true`.
        5.  Crea registros asociados (Dx, Rx, Ordenes).
        6.  Registra evento en `AuditoriaHCE`.
4.  **Consulta Posterior**:
    *   Los registros firmados aparecen en el Timeline con distintivo de seguridad.
    *   No es posible editar ni eliminar registros firmados (Validado en Servicios).

## 4. Pruebas y Calidad

- **Tests de Integración**: `backend/tests/integration/hce_flow.test.js`
  - Verifica el flujo completo de finalización de consulta.
  - Asegura que se creen todos los registros y la firma digital.
- **Tests Unitarios**: `backend/tests/unit/firmaDigital.service.test.js`
  - Valida la consistencia y unicidad de la generación de hashes.
- **Validación Manual**:
  - Verificación de UI en Dashboard y Timeline.
  - Bloqueo de edición para registros firmados.

## 5. Mantenimiento y Extensión

- Para agregar nuevos tipos de eventos al Timeline, editar `TabTimeline.jsx` y mapear el nuevo modelo.
- Para cambiar el algoritmo de firma, modificar `FirmaDigitalService`. **Nota**: Esto invalidaría firmas anteriores, requiere estrategia de versionado.
