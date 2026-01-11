'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Pill, DollarSign, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import { formatDateLong } from '@/lib/dateUtils';
import ProductoModal from './ProductoModal';

export default function FarmaciaModule({ user }) {
  const [productos, setProductos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // Cargar productos
      const productosRes = await fetch(`${apiUrl}/productos?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productosData = await productosRes.json();
      setProductos(productosData.data || []);

      // Cargar estadísticas
      const statsRes = await fetch(`${apiUrl}/productos/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      setStats(statsData.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/productos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
    } catch (error) {
      console.error('Error deleting producto:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatInventario = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Farmacia</h1>
          </div>
          <p className="text-gray-600 ml-14">Gestiona el inventario de productos farmacéuticos</p>
        </div>
        <Button 
          onClick={() => {
            setEditingProducto(null);
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Pill className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.activos} Activo · {stats.inactivos} Inactivo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Valor Inventario</p>
                  <p className="text-2xl font-bold text-gray-900">{formatInventario(stats.valorInventario)}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.valorInventario)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Bajo Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.bajoStock}</p>
                  <p className="text-xs text-gray-500 mt-1">Productos con cantidad inferior a la alerta mínima</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Requieren Receta</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.requierenReceta}</p>
                  <p className="text-xs text-gray-500 mt-1">Productos controlados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, SKU o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Lista de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Cargando...</p>
          ) : productos.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No hay productos registrados</p>
              <Button 
                onClick={() => {
                  setEditingProducto(null);
                  setIsModalOpen(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Producto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">Producto</TableHead>
                    <TableHead className="font-bold">Categoría</TableHead>
                    <TableHead className="font-bold">Precio</TableHead>
                    <TableHead className="font-bold">Información</TableHead>
                    <TableHead className="font-bold">Prescripción</TableHead>
                    <TableHead className="font-bold">Vencimiento</TableHead>
                    <TableHead className="font-bold">Estado</TableHead>
                    <TableHead className="font-bold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((producto) => {
                    const disponible = producto.cantidadDisponible;
                    const bajoStock = disponible < producto.cantidadMinAlerta;
                    const fechaVenc = producto.fechaVencimiento ? formatDateLong(producto.fechaVencimiento) : null;

                    return (
                      <TableRow key={producto.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {producto.imagenUrl ? (
                              <img 
                                src={producto.imagenUrl} 
                                alt={producto.nombre}
                                className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-900">{producto.nombre}</p>
                              <p className="text-xs text-gray-500">SKU: {producto.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            {producto.categoria?.nombre || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {formatCurrency(producto.precioVenta)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {producto.concentracion && (
                              <p className="text-gray-600">
                                <strong>Concentración:</strong> {producto.concentracion}
                              </p>
                            )}
                            {producto.presentacion && (
                              <p className="text-gray-600">
                                <strong>Presentación:</strong> {producto.presentacion}
                              </p>
                            )}
                            {producto.descripcion && (
                              <p className="text-gray-500 text-xs truncate max-w-[200px]">
                                {producto.descripcion}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {producto.requiereReceta ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              Con receta
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Sin receta
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {fechaVenc ? (
                            <div className="text-sm">
                              <p className="text-gray-900 font-medium">{fechaVenc.fecha}</p>
                              <p className="text-xs text-gray-500">{fechaVenc.hora}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={producto.activo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                              {producto.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {bajoStock && producto.activo && (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 block">
                                Bajo stock
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingProducto(producto);
                                setIsModalOpen(true);
                              }}
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(producto.id)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <ProductoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProducto(null);
        }}
        editingProducto={editingProducto}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingProducto(null);
          loadData();
        }}
      />
    </div>
  );
}
