'use client';

import { useState, useEffect } from 'react';
import { 
  Package, Search, Import, Plus, AlertTriangle, 
  Trash2, Edit, CheckCircle2, Pill, RefreshCw
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

export default function InventarioDrogueria({ user }) {
  const { 
    productos, fetchProductos, loading, 
    importarDesdeFarmacia, upsertProducto, deleteProducto
  } = useDrogueria();

  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [internalProducts, setInternalProducts] = useState([]);
  const [selectedToImport, setSelectedToImport] = useState([]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

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
    fetchProductos();
  };

  const loadInternalProducts = async () => {
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const res = await fetch(`${apiUrl}/productos?limit=1000`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setInternalProducts(data.data || []);
  };

  const handleOpenImport = () => {
    loadInternalProducts();
    setShowImportModal(true);
  };

  const handleImport = async () => {
    if (selectedToImport.length === 0) return;
    await importarDesdeFarmacia(selectedToImport);
    setShowImportModal(false);
    setSelectedToImport([]);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val);

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Buscar en inventario..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchProductos()} title="Recargar">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={handleOpenImport}>
            <Import className="w-4 h-4 mr-2" /> Importar de Farmacia
          </Button>
          <Button className="bg-blue-600" onClick={() => { setEditingProduct(null); setShowProductModal(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Agregar Item Retail
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm border-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg"><Package className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Items en Catálogo</p>
              <p className="text-2xl font-bold">{productos.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg"><AlertTriangle className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Bajo Stock</p>
              <p className="text-2xl font-bold">{productos.filter(p => p.stockActual <= p.stockMinimo).length}</p>
            </div>
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
      </div>

      {/* Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-bold">Producto</TableHead>
              <TableHead className="font-bold text-center">IVA</TableHead>
              <TableHead className="font-bold text-center">Stock Actual</TableHead>
              <TableHead className="font-bold text-right">Precio Venta</TableHead>
              <TableHead className="font-bold text-center">Vencimiento</TableHead>
              <TableHead className="font-bold">Estado</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {productos.map(p => (
              <TableRow key={p.id} className={p.stockActual <= p.stockMinimo ? "bg-amber-50/30" : ""}>
                <TableCell>
                  <div>
                    <p className="font-bold text-gray-900">{p.nombre}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{p.sku} {p.producto?.principioActivo && `· ${p.producto.principioActivo}`}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">{p.porcentajeIva}%</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant={p.stockActual <= p.stockMinimo ? "destructive" : "secondary"}>
                      {p.stockActual} unds
                    </Badge>
                    {p.stockActual <= p.stockMinimo && (
                      <span className="text-[9px] text-red-600 font-bold uppercase">Pedido Requerido</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-gray-900">
                  {formatCurrency(p.precioVenta)}
                </TableCell>
                <TableCell className="text-center text-xs">
                  {p.fechaVencimiento ? (
                    <span className={new Date(p.fechaVencimiento) < new Date() ? "text-red-600 font-bold" : "text-gray-600"}>
                      {new Date(p.fechaVencimiento).toLocaleDateString()}
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Badge className={p.activo ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
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
          </TableBody>
        </Table>
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
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Importar Catálogo de Farmacia</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto py-4">
            <p className="text-sm text-gray-500 mb-4">
              Seleccione los productos del catálogo asistencial que desea ofrecer en la droguería para venta al público.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Principio Activo</TableHead>
                  <TableHead>Precio Base</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {internalProducts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={selectedToImport.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedToImport([...selectedToImport, p.id]);
                          else setSelectedToImport(selectedToImport.filter(id => id !== p.id));
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-xs">{p.principioActivo}</TableCell>
                    <TableCell className="text-xs">{formatCurrency(p.precioVenta)}</TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
}
