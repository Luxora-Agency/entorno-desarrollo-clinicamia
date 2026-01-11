# Sistema de Selección de Ubicación Jerárquica

Este documento describe la implementación del sistema de selección de ubicación (País -> Departamento -> Ciudad) en el formulario de pacientes.

## Descripción General

El sistema permite la selección de ubicación de manera jerárquica y condicional, optimizado para Colombia pero flexible para otros países.

### Componentes

1.  **Datos Estáticos**:
    *   `frontend/data/colombia.json`: Contiene la estructura completa de los 32 departamentos de Colombia y sus municipios principales.
    *   `frontend/data/paises.json`: Lista de países del mundo para el selector inicial.

2.  **Componente Frontend**:
    *   `PacienteStepperForm.jsx`: Implementa la lógica de selección y renderizado condicional.

## Lógica de Funcionamiento

1.  **Selección de País**:
    *   Por defecto: "Colombia".
    *   Si se selecciona "Colombia", se habilitan los selectores jerárquicos de Departamento y Municipio.
    *   Si se selecciona otro país, los campos de Departamento y Municipio se convierten en campos de texto libre (`Input`) para permitir flexibilidad con formatos internacionales.

2.  **Selección de Departamento (Colombia)**:
    *   Se carga dinámicamente desde `colombia.json`.
    *   Ordenado alfabéticamente.
    *   Al cambiar el departamento, se reinicia automáticamente el campo de Municipio para mantener la consistencia.

3.  **Selección de Municipio (Colombia)**:
    *   Se filtra dinámicamente según el departamento seleccionado.
    *   Solo permite seleccionar municipios válidos pertenecientes al departamento.

## Pruebas

Se han implementado pruebas unitarias usando `jest` y `testing-library` para validar la lógica:

*   **Ubicación**: `frontend/tests/unit/PacienteStepperForm.test.jsx`
    *   Verifica que Colombia sea el valor por defecto.
    *   Verifica que se muestren los selectores correctos para Colombia.
    *   Verifica el cambio a inputs de texto para otros países.

## Uso

El sistema es autocontenido y no requiere llamadas a API para la carga de datos geográficos básicos, lo que garantiza un rendimiento óptimo y carga instantánea.

### Actualización de Datos

Para actualizar la lista de municipios o departamentos, simplemente edite el archivo `frontend/data/colombia.json`. No se requiere recompilación de lógica compleja, solo un rebuild del frontend.
