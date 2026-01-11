import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Pill, Image as ImageIcon, Plus, AlertTriangle } from 'lucide-react';
import { formatDateLong } from '@/lib/dateUtils';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductList({ productos, loading, onEdit, onDelete, onAddFirst }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Lista de Productos</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>
            ))}
           </div>
        </CardContent>
      </Card>
    );
  }

  if (productos.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Lista de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Pill className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No hay productos registrados</p>
            <Button 
              onClick={onAddFirst}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Producto
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {productos.map((producto) => {
             const disponible = producto.cantidadTotal - producto.cantidadConsumida;
             const bajoStock = disponible < producto.cantidadMinAlerta;
             const fechaVenc = producto.fechaVencimiento ? formatDateLong(producto.fechaVencimiento) : null;

             return (
               <Card key={producto.id} className="shadow-sm">
                 <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
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
                       <Badge className={producto.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                         {producto.activo ? 'Activo' : 'Inactivo'}
                       </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                            <p className="text-gray-500 text-xs">Precio</p>
                            <p className="font-semibold">{formatCurrency(producto.precioVenta)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Stock</p>
                            <div className="flex items-center gap-2">
                                <span className={bajoStock ? "text-red-600 font-bold" : "text-gray-900"}>
                                    {disponible} unds
                                </span>
                                {bajoStock && <AlertTriangle className="w-4 h-4 text-red-600" />}
                            </div>
                        </div>
                         <div>
                            <p className="text-gray-500 text-xs">Categoría</p>
                            <p>{producto.categoria?.nombre || '-'}</p>
                        </div>
                        <div>
                             <p className="text-gray-500 text-xs">Vencimiento</p>
                             <p>{fechaVenc ? fechaVenc.fecha : '-'}</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(producto)}
                          className="text-blue-600 hover:bg-blue-50 border-blue-200"
                        >
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(producto.id)}
                          className="text-red-600 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </Button>
                    </div>
                 </CardContent>
               </Card>
             );
        })}
      </div>

      {/* Desktop Table View */}
      <Card className="shadow-sm hidden md:block">
        <CardHeader>
          <CardTitle className="text-xl">Lista de Productos</CardTitle>
        </CardHeader>
        <CardContent>
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
                  const disponible = producto.cantidadTotal - producto.cantidadConsumida;
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
                            {producto.codigoAtc && (
                              <Badge variant="outline" className="text-[10px] h-4 mt-1 border-blue-200 text-blue-600 bg-blue-50">
                                ATC: {producto.codigoAtc}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 w-fit">
                            {producto.categoria?.nombre || '-'}
                          </Badge>
                          {producto.principioActivo && (
                            <span className="text-[10px] text-gray-500 font-medium italic">
                              {producto.principioActivo}
                            </span>
                          )}
                        </div>
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
                          <p className="text-xs text-gray-500 capitalize">{fechaVenc.dia}</p>
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
                            onClick={() => onEdit(producto)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(producto.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
