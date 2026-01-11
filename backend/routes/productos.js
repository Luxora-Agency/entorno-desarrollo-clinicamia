const { Hono } = require('hono');
const ProductoService = require('../services/producto.service');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const app = new Hono();

app.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Producto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         codigo:
 *           type: string
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         categoria_id:
 *           type: string
 *           format: uuid
 *         precio_unitario:
 *           type: number
 *         stock_actual:
 *           type: integer
 *         stock_minimo:
 *           type: integer
 *         activo:
 *           type: boolean
 *     ProductoInput:
 *       type: object
 *       required:
 *         - codigo
 *         - nombre
 *         - precio_unitario
 *         - stock_actual
 *       properties:
 *         codigo:
 *           type: string
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         categoria_id:
 *           type: string
 *           format: uuid
 *         precio_unitario:
 *           type: number
 *         stock_actual:
 *           type: integer
 *         stock_minimo:
 *           type: integer
 * tags:
 *   name: Productos
 *   description: Gestión de inventario y productos
 */

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Obtener productos (con filtros y búsqueda)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o código
 *       - in: query
 *         name: categoriaId
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de productos
 *       500:
 *         description: Error del servidor
 */
app.get('/', async (c) => {
  try {
    const { activo, categoriaId, search } = c.req.query();
    const productos = await ProductoService.getAll({ activo, categoriaId, search });
    return c.json(success(productos));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /productos/stats:
 *   get:
 *     summary: Obtener estadísticas de inventario
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de productos
 *       500:
 *         description: Error del servidor
 */
app.get('/stats', async (c) => {
  try {
    const stats = await ProductoService.getStats();
    return c.json(success(stats));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /productos/import-pbs:
 *   post:
 *     summary: Importar medicamentos desde la API de Datos Abiertos (PBS)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Importación completada
 *       500:
 *         description: Error del servidor
 */
app.post('/import-pbs', async (c) => {
  try {
    const result = await ProductoService.importFromSocrata();
    return c.json(success(result, 'Importación de PBS completada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /productos/import-csv:
 *   post:
 *     summary: Importar productos desde un archivo CSV
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - csv
 *             properties:
 *               csv:
 *                 type: string
 *                 description: Contenido del CSV en texto
 *               categoriaId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Importación completada
 */
app.post('/import-csv', async (c) => {
  try {
    const { csv, categoriaId } = await c.req.json();
    if (!csv) return c.json(error('Contenido CSV es requerido'), 400);
    
    const result = await ProductoService.importFromCSV(csv, categoriaId);
    return c.json(success(result, 'Importación CSV completada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /productos/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Datos del producto
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const producto = await ProductoService.getById(id);
    return c.json(success(producto));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /productos:
 *   post:
 *     summary: Crear nuevo producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductoInput'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       500:
 *         description: Error del servidor
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const producto = await ProductoService.create(body);
    return c.json(success(producto), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /productos/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductoInput'
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const producto = await ProductoService.update(id, body);
    return c.json(success(producto));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /productos/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await ProductoService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = app;
