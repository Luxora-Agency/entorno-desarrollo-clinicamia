const { Hono } = require('hono');
const CategoriaProductoService = require('../services/categoriaProducto.service');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const app = new Hono();

// Aplicar autenticación a todas las rutas
app.use('*', authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoriaProducto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         activa:
 *           type: boolean
 *     CategoriaProductoInput:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 * tags:
 *   name: CategoriasProductos
 *   description: Gestión de categorías de productos
 */

/**
 * @swagger
 * /categorias-productos:
 *   get:
 *     summary: Obtener todas las categorías de productos
 *     tags: [CategoriasProductos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 *       500:
 *         description: Error del servidor
 */
app.get('/', async (c) => {
  try {
    const categorias = await CategoriaProductoService.getAll();
    return c.json(success(categorias));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * @swagger
 * /categorias-productos/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [CategoriasProductos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Datos de la categoría
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error del servidor
 */
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const categoria = await CategoriaProductoService.getById(id);
    return c.json(success(categoria));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /categorias-productos:
 *   post:
 *     summary: Crear categoría de producto
 *     tags: [CategoriasProductos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoriaProductoInput'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       500:
 *         description: Error del servidor
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const categoria = await CategoriaProductoService.create(body);
    return c.json(success(categoria), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /categorias-productos/{id}:
 *   put:
 *     summary: Actualizar categoría de producto
 *     tags: [CategoriasProductos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoriaProductoInput'
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error del servidor
 */
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const categoria = await CategoriaProductoService.update(id, body);
    return c.json(success(categoria));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /categorias-productos/{id}:
 *   delete:
 *     summary: Eliminar categoría de producto
 *     tags: [CategoriasProductos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error del servidor
 */
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await CategoriaProductoService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = app;
