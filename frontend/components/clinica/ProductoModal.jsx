'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

export default function ProductoModal({ isOpen, onClose, editingProducto, onSuccess }) {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    categoriaId: '',
    sku: '',
    laboratorio: '',
    descripcion: '',
    etiquetasIds: [],
    principioActivo: '',
    concentracion: '',
    viaAdministracion: '',
    presentacion: '',
    registroSanitario: '',
    temperaturaAlmacenamiento: '',
    requiereReceta: false,
    cantidadTotal: '',
    cantidadConsumida: '',
    cantidadMinAlerta: '',
    lote: '',
    fechaVencimiento: '',
    precioVenta: '',
    precioCompra: '',
    activo: true,
    imagenUrl: '',
  });

  const viasAdministracion = [
    'Oral',
    'Inhalatoria',
    'Subcutánea',
    'Intramuscular',
    'Intravenosa',
    'Tópica',
    'Oftálmica',
    'Ótica',
    'Rectal',
    'Vaginal',
  ];

  const temperaturasAlmacenamiento = [
    'Temperatura ambiente (15-30°C)',
    'Refrigeración (2-8°C)',
    'Congelación (-20°C)',
    'Lugar fresco y seco',
  ];

  useEffect(() => {
    if (isOpen) {
      loadCategorias();
      loadEtiquetas();
      
      if (editingProducto) {
        setFormData({
          nombre: editingProducto.nombre || '',
          categoriaId: editingProducto.categoriaId || '',
          sku: editingProducto.sku || '',
          laboratorio: editingProducto.laboratorio || '',
          descripcion: editingProducto.descripcion || '',
          etiquetasIds: editingProducto.etiquetas?.map(e => e.id) || [],
          principioActivo: editingProducto.principioActivo || '',
          concentracion: editingProducto.concentracion || '',
          viaAdministracion: editingProducto.viaAdministracion || '',
          presentacion: editingProducto.presentacion || '',
          registroSanitario: editingProducto.registroSanitario || '',
          temperaturaAlmacenamiento: editingProducto.temperaturaAlmacenamiento || '',
          requiereReceta: editingProducto.requiereReceta || false,
          cantidadTotal: editingProducto.cantidadTotal?.toString() || '',
          cantidadConsumida: editingProducto.cantidadConsumida?.toString() || '',
          cantidadMinAlerta: editingProducto.cantidadMinAlerta?.toString() || '',
          lote: editingProducto.lote || '',
          fechaVencimiento: editingProducto.fechaVencimiento ? editingProducto.fechaVencimiento.slice(0, 16) : '',
          precioVenta: editingProducto.precioVenta?.toString() || '',
          precioCompra: editingProducto.precioCompra?.toString() || '',
          activo: editingProducto.activo !== undefined ? editingProducto.activo : true,
          imagenUrl: editingProducto.imagenUrl || '',
        });
        setImagePreview(editingProducto.imagenUrl || null);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingProducto]);

  const loadCategorias = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/categorias-productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCategorias(data.data || []);
    } catch (error) {
      console.error('Error loading categorias:', error);
    }
  };

  const loadEtiquetas = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/etiquetas-productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEtiquetas(data.data || []);
    } catch (error) {
      console.error('Error loading etiquetas:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoriaId: '',
      sku: '',
      laboratorio: '',
      descripcion: '',
      etiquetasIds: [],
      principioActivo: '',
      concentracion: '',
      viaAdministracion: '',
      presentacion: '',
      registroSanitario: '',
      temperaturaAlmacenamiento: '',
      requiereReceta: false,
      cantidadTotal: '',
      cantidadConsumida: '',
      cantidadMinAlerta: '',
      lote: '',
      fechaVencimiento: '',
      precioVenta: '',
      precioCompra: '',
      activo: true,
      imagenUrl: '',
    });
    setImagePreview(null);
  };

  const handleEtiquetaToggle = (etiquetaId) => {
    if (formData.etiquetasIds.includes(etiquetaId)) {
      setFormData({
        ...formData,
        etiquetasIds: formData.etiquetasIds.filter(id => id !== etiquetaId)
      });
    } else {
      setFormData({
        ...formData,
        etiquetasIds: [...formData.etiquetasIds, etiquetaId]
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, imagenUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre.trim()) {
      toast({ description: 'El nombre es obligatorio' });
      return;
    }
    if (!formData.categoriaId) {
      toast({ description: 'La categoría es obligatoria' });
      return;
    }
    if (!formData.sku.trim()) {
      toast({ description: 'El SKU es obligatorio' });
      return;
    }
    if (!formData.descripcion?.trim()) {
      toast({ description: 'La descripción es obligatoria' });
      return;
    }
    if (!formData.cantidadTotal) {
      toast({ description: 'La cantidad total es obligatoria' });
      return;
    }
    if (!formData.cantidadMinAlerta) {
      toast({ description: 'La cantidad mínima de alerta es obligatoria' });
      return;
    }
    if (!formData.precioVenta) {
      toast({ description: 'El precio de venta es obligatorio' });
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const payload = {
        ...formData,
        cantidadTotal: parseInt(formData.cantidadTotal),
        cantidadConsumida: parseInt(formData.cantidadConsumida) || 0,
        cantidadMinAlerta: parseInt(formData.cantidadMinAlerta),
        precioVenta: parseFloat(formData.precioVenta),
        precioCompra: formData.precioCompra ? parseFloat(formData.precioCompra) : null,
      };

      const url = editingProducto
        ? `${apiUrl}/productos/${editingProducto.id}`
        : `${apiUrl}/productos`;
      
      const method = editingProducto ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al guardar el producto');
      }
    } catch (error) {
      console.error('Error saving producto:', error);
      toast({ description: 'Error al guardar el producto' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECCIÓN 1: Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Nombre del Producto *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: Acetaminofén"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Categoría *</Label>
                <Select value={formData.categoriaId} onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar categoría..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">SKU *</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: MED-001"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Laboratorio</Label>
                <Input
                  value={formData.laboratorio}
                  onChange={(e) => setFormData({ ...formData, laboratorio: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: Laboratorios XYZ"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold">Descripción *</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="mt-2"
                  rows={3}
                  placeholder="Descripción del producto..."
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold">Etiquetas</Label>
                <div className="mt-2 border-2 border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {etiquetas.map(etq => (
                    <div key={etq.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`etq-${etq.id}`}
                        checked={formData.etiquetasIds.includes(etq.id)}
                        onCheckedChange={() => handleEtiquetaToggle(etq.id)}
                      />
                      <label htmlFor={`etq-${etq.id}`} className="text-sm cursor-pointer">
                        {etq.nombre}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.etiquetasIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.etiquetasIds.map(etqId => {
                      const etq = etiquetas.find(e => e.id === etqId);
                      return etq ? (
                        <Badge key={etqId} className="bg-blue-100 text-blue-700">
                          {etq.nombre}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleEtiquetaToggle(etqId)} />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Información Farmacológica */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Información Farmacológica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Principio Activo</Label>
                <Input
                  value={formData.principioActivo}
                  onChange={(e) => setFormData({ ...formData, principioActivo: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: Paracetamol"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Concentración</Label>
                <Input
                  value={formData.concentracion}
                  onChange={(e) => setFormData({ ...formData, concentracion: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: 500mg"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Vía de Administración</Label>
                <Select value={formData.viaAdministracion} onValueChange={(value) => setFormData({ ...formData, viaAdministracion: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {viasAdministracion.map(via => (
                      <SelectItem key={via} value={via}>{via}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Presentación</Label>
                <Input
                  value={formData.presentacion}
                  onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: Caja x 20 tabletas"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Registro Sanitario</Label>
                <Input
                  value={formData.registroSanitario}
                  onChange={(e) => setFormData({ ...formData, registroSanitario: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: INVIMA 2024M-0001234"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Temperatura de Almacenamiento</Label>
                <Select value={formData.temperaturaAlmacenamiento} onValueChange={(value) => setFormData({ ...formData, temperaturaAlmacenamiento: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {temperaturasAlmacenamiento.map(temp => (
                      <SelectItem key={temp} value={temp}>{temp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="requiereReceta"
                    checked={formData.requiereReceta}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiereReceta: checked })}
                  />
                  <label htmlFor="requiereReceta" className="text-sm font-semibold cursor-pointer">
                    Requiere Receta Médica
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Inventario y Lote */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Inventario y Lote</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-semibold">Cantidad Total *</Label>
                <Input
                  type="number"
                  value={formData.cantidadTotal}
                  onChange={(e) => setFormData({ ...formData, cantidadTotal: e.target.value })}
                  className="mt-2"
                  placeholder="100"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Cantidad Consumida</Label>
                <Input
                  type="number"
                  value={formData.cantidadConsumida}
                  onChange={(e) => setFormData({ ...formData, cantidadConsumida: e.target.value })}
                  className="mt-2"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Cantidad Mínima Alerta *</Label>
                <Input
                  type="number"
                  value={formData.cantidadMinAlerta}
                  onChange={(e) => setFormData({ ...formData, cantidadMinAlerta: e.target.value })}
                  className="mt-2"
                  placeholder="10"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Lote</Label>
                <Input
                  value={formData.lote}
                  onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: L2024-001"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold">Fecha de Vencimiento</Label>
                <Input
                  type="datetime-local"
                  value={formData.fechaVencimiento}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Precios */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Precio de Venta *</Label>
                <Input
                  type="number"
                  value={formData.precioVenta}
                  onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                  className="mt-2"
                  placeholder="15000"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Precio de Compra</Label>
                <Input
                  type="number"
                  value={formData.precioCompra}
                  onChange={(e) => setFormData({ ...formData, precioCompra: e.target.value })}
                  className="mt-2"
                  placeholder="10000"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <label htmlFor="activo" className="text-sm font-semibold cursor-pointer">
                    Producto Activo
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 5: Imagen */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Imagen del Producto</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="imagen" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="text-sm text-gray-600">Click para subir imagen</p>
                        <p className="text-xs text-gray-400">PNG, JPG hasta 5MB</p>
                      </div>
                    </div>
                  </Label>
                  <Input
                    id="imagen"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {imagePreview && (
                  <div className="relative w-32 h-32">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, imagenUrl: '' });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              disabled={loading}
            >
              {loading ? 'Guardando...' : editingProducto ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
