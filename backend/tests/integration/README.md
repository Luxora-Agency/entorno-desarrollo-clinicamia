# Tests de Integración - Módulo de Pacientes

Este directorio contiene las pruebas de integración para el módulo de pacientes.

## Requisitos

- Node.js
- Base de datos configurada en `.env` (se recomienda una base de datos de pruebas, aunque los tests limpian los datos creados).

## Ejecución

Para ejecutar las pruebas de integración:

```bash
# Desde el directorio backend
npm test
# o específicamente
npx jest tests/integration/paciente_flow.test.js
```

## Cobertura

El archivo `tests/integration/paciente_flow.test.js` cubre los siguientes escenarios:

1.  **Validación de Creación**:
    -   Verifica que se rechacen peticiones sin campos obligatorios.
    -   Verifica que se validen formatos específicos (ej. email).
2.  **Flujo Exitoso**:
    -   Creación de paciente con todos los datos (incluyendo contactos de emergencia).
    -   Lectura del paciente creado.
    -   Actualización de información.
    -   Eliminación lógica (Soft Delete).

## Notas

- Los tests utilizan la base de datos real configurada. Se aseguran de eliminar los datos de prueba al finalizar (`afterAll`), pero se recomienda precaución en entornos de producción.
- Se utiliza `supertest` para simular peticiones HTTP contra la aplicación Hono.
