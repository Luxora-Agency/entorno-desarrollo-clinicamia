# Implementación del Módulo de Publicaciones y Contenidos

## 1. Backend: Base de Datos y API
### 1.1. Actualización del Esquema Prisma (`prisma/schema.prisma`)
- Crear modelo `CategoriaPublicacion`:
  - `id`, `nombre`, `descripcion`, `slug`, `activo`.
- Crear modelo `Publicacion`:
  - `id`, `titulo`, `slug`, `contenido`, `extracto`, `imagenPortada`, `estado` (Borrador, Publicado, Archivado).
  - `fechaPublicacion`, `autorId`, `categoriaId`.
  - Relación con `Usuario` (autor).
  - Relación con `CategoriaPublicacion`.
  - **Compatibilidad HCE**: Relación Many-to-Many con `CatalogoCie11` para recomendar contenido según diagnósticos.
- Ejecutar migración para actualizar la base de datos.

### 1.2. Servicios y Controladores
- Crear `backend/services/publicacion.service.js`:
  - Métodos CRUD para categorías y publicaciones.
  - Método para buscar publicaciones por diagnóstico (CIE-11).
- Crear `backend/routes/publicaciones.js`:
  - Endpoints protegidos para gestión de contenido.
  - Endpoints públicos (o autenticados) para lectura.
- Registrar rutas en `backend/server.js`.

### 1.3. Testing
- Crear `backend/tests/unit/publicacion.service.test.js` para validar la lógica de negocio.
- Verificar creación, listado y filtrado por diagnóstico.

## 2. Frontend: Interfaz de Usuario
### 2.1. Estructura de Componentes (`frontend/components/clinica/publicaciones/`)
- `PublicacionesModule.jsx`: Contenedor principal.
- `PublicacionList.jsx`: Tabla/Lista de publicaciones con filtros.
- `PublicacionForm.jsx`: Formulario con editor de texto enriquecido (o textarea simple por ahora) y selector de diagnósticos CIE-11.
- `CategoriasList.jsx`: Gestión de categorías.

### 2.2. Integración en Dashboard (`frontend/components/clinica/Dashboard.jsx`)
- Agregar casos en el `switch(activeModule)`:
  - `case 'post-todas'`: Renderizar `PublicacionesModule` (vista lista).
  - `case 'post-categorias'`: Renderizar `PublicacionesModule` (vista categorías).

## 3. Compatibilidad HCE
- La relación con `CatalogoCie11` permitirá que en el futuro (o en esta iteración si el tiempo permite) el módulo de HCE sugiera artículos educativos al paciente basándose en sus diagnósticos activos.

## 4. Pasos de Ejecución
1.  Modificar `prisma/schema.prisma` y migrar.
2.  Implementar backend (Service -> Route -> Server).
3.  Crear componentes frontend.
4.  Integrar en Dashboard.
5.  Realizar pruebas de flujo completo.
