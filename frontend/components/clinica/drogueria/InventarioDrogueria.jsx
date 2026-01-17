'use client';

import { useState, useEffect } from 'react';
import {
  Package, Search, Import, Plus, AlertTriangle,
  Trash2, Edit, CheckCircle2, Pill, RefreshCw,
  Download, Filter, ChevronLeft, ChevronRight, Database,
  Eye, X, Tag, Building2, Beaker, Layers, DollarSign,
  BarChart3, Calendar, Hash, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useDrogueria } from '@/hooks/useDrogueria';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export default function InventarioDrogueria({ user }) {
  const {
    productos, fetchProductos, loading, pagination,
    importarDesdeFarmacia, importarTodosPBS, upsertProducto, deleteProducto,
    categorias, fetchCategorias, productosFarmacia, fetchProductosFarmacia
  } = useDrogueria();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('all');
  const [filtroBajoStock, setFiltroBajoStock] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedToImport, setSelectedToImport] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [importSearch, setImportSearch] = useState('');
  const [importCategoria, setImportCategoria] = useState('');

  // Cargar categorías al montar
  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // Cargar productos con filtros (debounce para búsqueda)
  useEffect(() => {
    const params = {
      limit: 50,
      page: currentPage
    };
    if (searchTerm) params.search = searchTerm;
    if (selectedCategoria && selectedCategoria !== 'all') params.categoriaId = selectedCategoria;
    if (filtroBajoStock) params.bajoStock = true;

    // Solo usar debounce si hay término de búsqueda
    if (searchTerm) {
      const timer = setTimeout(() => {
        fetchProductos(params);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Cargar inmediatamente si no hay búsqueda
      fetchProductos(params);
    }
  }, [searchTerm, selectedCategoria, filtroBajoStock, currentPage, fetchProductos]);

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setShowProductModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este producto del catálogo retail?')) {
      await deleteProducto(id);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      sku: editingProduct?.sku || formData.get('sku'),
      nombre: formData.get('nombre'),
      precioVenta: parseFloat(formData.get('precioVenta')),
      porcentajeIva: parseFloat(formData.get('porcentajeIva')),
      stockActual: parseInt(formData.get('stockActual')),
      stockMinimo: parseInt(formData.get('stockMinimo')),
      activo: true
    };
    await upsertProducto(data);
    setShowProductModal(false);
    setEditingProduct(null);
    fetchProductos({ limit: 50, page: currentPage });
  };

  const handleOpenImport = () => {
    fetchProductosFarmacia({ limit: 100 });
    setShowImportModal(true);
  };

  const handleImport = async () => {
    if (selectedToImport.length === 0) return;
    await importarDesdeFarmacia(selectedToImport);
    setShowImportModal(false);
    setSelectedToImport([]);
  };

  const handleImportarTodos = async () => {
    if (confirm('¿Importar TODOS los productos PBS? Esto puede tomar unos segundos.')) {
      await importarTodosPBS();
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val || 0);

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-1 gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, SKU, principio activo, laboratorio..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Select value={selectedCategoria} onValueChange={(v) => { setSelectedCategoria(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.nombre}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtroBajoStock && (
            <Badge
              className="bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer flex items-center gap-1 px-3 py-1"
              onClick={() => { setFiltroBajoStock(false); setCurrentPage(1); }}
            >
              <AlertTriangle className="w-3 h-3" />
              Bajo Stock
              <span className="ml-1 text-amber-500 hover:text-amber-700">&times;</span>
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const params = { limit: 50, page: currentPage };
              if (searchTerm) params.search = searchTerm;
              if (selectedCategoria && selectedCategoria !== 'all') params.categoriaId = selectedCategoria;
              if (filtroBajoStock) params.bajoStock = true;
              fetchProductos(params);
            }}
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={handleOpenImport}>
            <Import className="w-4 h-4 mr-2" /> Importar Seleccionados
          </Button>
          <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleImportarTodos}>
            <Database className="w-4 h-4 mr-2" /> Importar Todos PBS
          </Button>
          <Button className="bg-blue-600" onClick={() => { setEditingProduct(null); setShowProductModal(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Item
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg"><Package className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total en Catálogo</p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`bg-white shadow-sm cursor-pointer transition-all hover:shadow-md ${filtroBajoStock ? 'border-2 border-amber-500 ring-2 ring-amber-200' : 'border-none'}`}
          onClick={() => { setFiltroBajoStock(!filtroBajoStock); setCurrentPage(1); }}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${filtroBajoStock ? 'bg-amber-500' : 'bg-amber-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${filtroBajoStock ? 'text-white' : 'text-amber-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Bajo Stock</p>
              <p className="text-2xl font-bold">{productos.filter(p => p.stockActual <= (p.stockMinimo || 5)).length}</p>
            </div>
            {filtroBajoStock && (
              <Badge className="ml-auto bg-amber-100 text-amber-700 text-xs">Filtro activo</Badge>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Items Activos</p>
              <p className="text-2xl font-bold">{productos.filter(p => p.activo).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg"><Pill className="w-6 h-6 text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Categorías</p>
              <p className="text-2xl font-bold">{categorias.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-bold">Producto</TableHead>
              <TableHead className="font-bold">Categoría</TableHead>
              <TableHead className="font-bold">Laboratorio</TableHead>
              <TableHead className="font-bold text-center">IVA</TableHead>
              <TableHead className="font-bold text-center">Stock</TableHead>
              <TableHead className="font-bold text-right">Precio</TableHead>
              <TableHead className="font-bold">Estado</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {productos.map(p => (
              <TableRow key={p.id} className={p.stockActual <= (p.stockMinimo || 5) ? "bg-amber-50/30" : ""}>
                <TableCell>
                  <div
                    className="cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
                    onClick={() => { setPreviewProduct(p); setShowPreviewModal(true); }}
                  >
                    <p className="font-bold text-gray-900 hover:text-blue-600">{p.nombre}</p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      {p.sku}
                      {p.producto?.principioActivo && ` · ${p.producto.principioActivo}`}
                    </p>
                    {p.producto?.formaFarmaceutica && (
                      <p className="text-[10px] text-blue-600">{p.producto.formaFarmaceutica} - {p.producto.concentracion}</p>
                    )}
                    {p.producto?.presentaciones?.length > 0 && (
                      <Badge variant="outline" className="mt-1 text-[9px] bg-purple-50 text-purple-700">
                        {p.producto.presentaciones.length} presentaciones
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {p.producto?.categoria ? (
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{
                        borderColor: p.producto.categoria.color,
                        color: p.producto.categoria.color,
                        backgroundColor: `${p.producto.categoria.color}10`
                      }}
                    >
                      {p.producto.categoria.nombre}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-600">{p.producto?.laboratorio || '-'}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">{p.porcentajeIva}%</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant={p.stockActual <= (p.stockMinimo || 5) ? "destructive" : "secondary"}>
                      {p.stockActual} unds
                    </Badge>
                    {p.stockActual <= (p.stockMinimo || 5) && (
                      <span className="text-[9px] text-red-600 font-bold uppercase">Pedido Requerido</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-gray-900">
                  {formatCurrency(p.precioVenta)}
                </TableCell>
                <TableCell>
                  <Badge className={p.activo ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-purple-600"
                      onClick={() => { setPreviewProduct(p); setShowPreviewModal(true); }}
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleOpenEdit(p)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {productos.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  {loading ? 'Cargando...' : 'No hay productos en el catálogo retail'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, pagination.total)} de {pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Product Edit/Create Modal */}
      <Dialog open={showProductModal} onOpenChange={(open) => { setShowProductModal(open); if(!open) setEditingProduct(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Item Retail' : 'Nuevo Item Retail'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nombre del Producto</Label>
                <Input name="nombre" defaultValue={editingProduct?.nombre} required />
              </div>
              <div className="space-y-2">
                <Label>SKU / Código</Label>
                <Input name="sku" defaultValue={editingProduct?.sku} required disabled={!!editingProduct} />
              </div>
              <div className="space-y-2">
                <Label>IVA (%)</Label>
                <Input type="number" name="porcentajeIva" defaultValue={editingProduct?.porcentajeIva || 0} required />
              </div>
              <div className="space-y-2">
                <Label>Precio Venta</Label>
                <Input type="number" name="precioVenta" defaultValue={editingProduct?.precioVenta} required />
              </div>
              <div className="space-y-2">
                <Label>Stock Actual</Label>
                <Input type="number" name="stockActual" defaultValue={editingProduct?.stockActual || 0} required />
              </div>
              <div className="space-y-2">
                <Label>Stock Mínimo</Label>
                <Input type="number" name="stockMinimo" defaultValue={editingProduct?.stockMinimo || 5} required />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setShowProductModal(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Importar desde Catálogo de Farmacia</DialogTitle>
          </DialogHeader>

          <div className="flex gap-3 py-3 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar productos..."
                className="pl-10"
                value={importSearch}
                onChange={(e) => {
                  setImportSearch(e.target.value);
                  fetchProductosFarmacia({ search: e.target.value, categoriaId: importCategoria, limit: 100 });
                }}
              />
            </div>
            <Select value={importCategoria} onValueChange={(v) => {
              setImportCategoria(v);
              fetchProductosFarmacia({ search: importSearch, categoriaId: v, limit: 100 });
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categorias.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-auto py-4">
            <p className="text-sm text-gray-500 mb-4">
              Seleccione los productos que desea agregar al catálogo de la droguería.
              Los productos con presentaciones importarán todas sus variantes.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Laboratorio</TableHead>
                  <TableHead>Presentaciones</TableHead>
                  <TableHead>Precio Base</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFarmacia.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded"
                        checked={selectedToImport.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedToImport([...selectedToImport, p.id]);
                          else setSelectedToImport(selectedToImport.filter(id => id !== p.id));
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-[10px] text-gray-500">{p.principioActivo}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.categoria && (
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          style={{ borderColor: p.categoria.color, color: p.categoria.color }}
                        >
                          {p.categoria.nombre}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">{p.laboratorio || '-'}</TableCell>
                    <TableCell>
                      {p.presentaciones?.length > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {p.presentaciones.length} variantes
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">Simple</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{formatCurrency(p.precioVenta)}</TableCell>
                  </TableRow>
                ))}
                {productosFarmacia.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-gray-400">
                      {loading ? 'Cargando...' : 'No se encontraron productos'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setShowImportModal(false)}>Cancelar</Button>
            <Button className="bg-blue-600" onClick={handleImport} disabled={selectedToImport.length === 0}>
              Importar {selectedToImport.length} Seleccionados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={(open) => { setShowPreviewModal(open); if(!open) setPreviewProduct(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Vista Previa del Producto
            </DialogTitle>
          </DialogHeader>

          {previewProduct && (
            <div className="space-y-6">
              {/* Header del producto */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{previewProduct.nombre}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        <Hash className="w-3 h-3 mr-1" />
                        {previewProduct.sku}
                      </Badge>
                      <Badge className={previewProduct.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                        {previewProduct.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-700">{formatCurrency(previewProduct.precioVenta)}</p>
                    <p className="text-xs text-gray-500">Precio de venta</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Stock */}
                <div className={`p-4 rounded-lg border ${previewProduct.stockActual <= (previewProduct.stockMinimo || 5) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs font-medium">Stock Actual</span>
                  </div>
                  <p className={`text-2xl font-bold ${previewProduct.stockActual <= (previewProduct.stockMinimo || 5) ? 'text-red-600' : 'text-gray-900'}`}>
                    {previewProduct.stockActual}
                  </p>
                  <p className="text-xs text-gray-400">Mín: {previewProduct.stockMinimo || 5} unidades</p>
                </div>

                {/* IVA */}
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium">IVA</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{previewProduct.porcentajeIva}%</p>
                  <p className="text-xs text-gray-400">Impuesto</p>
                </div>

                {/* Categoría */}
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Tag className="w-4 h-4" />
                    <span className="text-xs font-medium">Categoría</span>
                  </div>
                  {previewProduct.producto?.categoria ? (
                    <Badge
                      className="mt-1"
                      style={{
                        backgroundColor: `${previewProduct.producto.categoria.color}20`,
                        color: previewProduct.producto.categoria.color,
                        borderColor: previewProduct.producto.categoria.color
                      }}
                    >
                      {previewProduct.producto.categoria.nombre}
                    </Badge>
                  ) : (
                    <p className="text-gray-400 text-sm">Sin categoría</p>
                  )}
                </div>
              </div>

              {/* Información Farmacéutica */}
              {previewProduct.producto && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-purple-50 px-4 py-2 border-b border-purple-100">
                    <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                      <Beaker className="w-4 h-4" />
                      Información Farmacéutica
                    </h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                    {previewProduct.producto.principioActivo && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Principio Activo</p>
                        <p className="font-medium text-gray-900">{previewProduct.producto.principioActivo}</p>
                      </div>
                    )}
                    {previewProduct.producto.concentracion && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Concentración</p>
                        <p className="font-medium text-gray-900">{previewProduct.producto.concentracion}</p>
                      </div>
                    )}
                    {previewProduct.producto.formaFarmaceutica && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Forma Farmacéutica</p>
                        <p className="font-medium text-gray-900">{previewProduct.producto.formaFarmaceutica}</p>
                      </div>
                    )}
                    {previewProduct.producto.viaAdministracion && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Vía de Administración</p>
                        <p className="font-medium text-gray-900">{previewProduct.producto.viaAdministracion}</p>
                      </div>
                    )}
                    {previewProduct.producto.laboratorio && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Laboratorio</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {previewProduct.producto.laboratorio}
                        </p>
                      </div>
                    )}
                    {previewProduct.producto.codigoAtc && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Código ATC</p>
                        <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block">{previewProduct.producto.codigoAtc}</p>
                      </div>
                    )}
                    {previewProduct.producto.registroInvima && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Registro INVIMA</p>
                        <p className="font-mono text-xs bg-green-50 text-green-700 px-2 py-1 rounded inline-block">{previewProduct.producto.registroInvima}</p>
                      </div>
                    )}
                    {previewProduct.producto.tipoPbs && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Tipo PBS</p>
                        <Badge variant="outline" className="text-xs">{previewProduct.producto.tipoPbs}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Presentaciones */}
              {previewProduct.producto?.presentaciones?.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
                    <h3 className="font-semibold text-indigo-800 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Presentaciones ({previewProduct.producto.presentaciones.length})
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="grid gap-2">
                      {previewProduct.producto.presentaciones.map((pres, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{pres.descripcion || pres.nombre}</p>
                            {pres.unidadesPorCaja && (
                              <p className="text-xs text-gray-500">{pres.unidadesPorCaja} unidades por caja</p>
                            )}
                          </div>
                          {pres.precioVenta && (
                            <p className="font-bold text-gray-900">{formatCurrency(pres.precioVenta)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fechas */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Creado: {new Date(previewProduct.createdAt).toLocaleDateString('es-CO')}</span>
                </div>
                {previewProduct.updatedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Actualizado: {new Date(previewProduct.updatedAt).toLocaleDateString('es-CO')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Cerrar
            </Button>
            <Button
              className="bg-blue-600"
              onClick={() => {
                setShowPreviewModal(false);
                handleOpenEdit(previewProduct);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
