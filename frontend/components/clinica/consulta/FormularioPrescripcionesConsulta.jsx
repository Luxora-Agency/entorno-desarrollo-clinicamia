'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pill, Plus, X, AlertCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function FormularioPrescripcionesConsulta({ onChange, data }) {
  const { toast } = useToast();
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined);
  const [formData, setFormData] = useState(data || {
    diagnostico: '',
    medicamentos: [],
  });
  const [medicamentoActual, setMedicamentoActual] = useState({
    productoId: '',
    nombre: '',
    precio: 0,
    dosis: '',
    via: 'Oral',
    frecuencia: 'Cada8Horas',
    duracionDias: '',
    instrucciones: '',
  });
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [loadingProductos, setLoadingProductos] = useState(false);

  useEffect(() => {
    if (quiereAgregar) {
      cargarProductos();
    }
  }, [quiereAgregar]);

  useEffect(() => {
    // Filtrar productos cuando cambie la búsqueda
    if (busquedaProducto.trim() === '') {
      setProductosFiltrados(productos);
    } else {
      const busqueda = busquedaProducto.toLowerCase();
      const filtrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda) ||
        p.principioActivo?.toLowerCase().includes(busqueda) ||
        p.sku?.toLowerCase().includes(busqueda)
      );
      setProductosFiltrados(filtrados);
    }
  }, [busquedaProducto, productos]);

  const cargarProductos = async () => {
    setLoadingProductos(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/productos?activo=true&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setProductos(result.data || []);
        setProductosFiltrados(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProductos([]);
      setProductosFiltrados([]);
    } finally {
      setLoadingProductos(false);
    }
  };

  const handleToggle = (agregar) => {
    setQuiereAgregar(agregar);
    if (!agregar) {
      setFormData({ diagnostico: '', medicamentos: [] });
      onChange(null, true);
    } else {
      onChange(formData, isComplete());
    }
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData, isComplete(newData));
  };

  const handleProductoChange = (productoId) => {
    const producto = productos.find(p => p.id === productoId);
    if (producto) {
      setMedicamentoActual({
        ...medicamentoActual,
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precioVenta,
      });
    }
  };

  const agregarMedicamento = () => {
    if (!medicamentoActual.productoId || !medicamentoActual.dosis) {
      toast({ description: 'Seleccione un medicamento y complete la dosis' });
      return;
    }
    
    const newMedicamentos = [...formData.medicamentos, { ...medicamentoActual }];
    const newData = { ...formData, medicamentos: newMedicamentos };
    setFormData(newData);
    onChange(newData, isComplete(newData));
    
    // Reset medicamento actual
    setMedicamentoActual({
      productoId: '',
      nombre: '',
      precio: 0,
      dosis: '',
      via: 'Oral',
      frecuencia: 'Cada8Horas',
      duracionDias: '',
      instrucciones: '',
    });
  };

  const eliminarMedicamento = (index) => {
    const newMedicamentos = formData.medicamentos.filter((_, i) => i !== index);
    const newData = { ...formData, medicamentos: newMedicamentos };
    setFormData(newData);
    onChange(newData, isComplete(newData));
  };

  const isComplete = (data = formData) => {
    return data.medicamentos.length > 0;
  };

  if (!quiereAgregar) {
    return (
      <Card className="border-teal-200">
        <CardContent className="p-6 text-center">
          <Pill className="h-12 w-12 text-teal-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">¿Desea prescribir medicamentos?</p>
          <Button 
            onClick={() => handleToggle(true)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sí, agregar prescripción
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-teal-200">
      <CardHeader className="bg-teal-50">
        <CardTitle className="flex items-center gap-2 text-teal-900">
          <Pill className="h-5 w-5" />
          Prescripción de Medicamentos (Opcional)
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggle(false)}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            No agregar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {!isComplete() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Agregue al menos un medicamento a la prescripción
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="diagnostico">Diagnóstico para la prescripción</Label>
          <Textarea
            id="diagnostico"
            value={formData.diagnostico}
            onChange={(e) => handleChange('diagnostico', e.target.value)}
            placeholder="Diagnóstico que justifica la prescripción..."
            rows={2}
          />
        </div>

        {/* Lista de medicamentos agregados */}
        {formData.medicamentos.length > 0 && (
          <div className="space-y-2">
            <Label>Medicamentos Prescritos ({formData.medicamentos.length})</Label>
            {formData.medicamentos.map((med, index) => (
              <div key={index} className="bg-teal-50 border border-teal-200 rounded-md p-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-teal-600">Medicamento</Badge>
                    <p className="font-semibold text-teal-900">{med.nombre}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Dosis: {med.dosis} | Vía: {med.via} | {med.frecuencia}
                  </p>
                  {med.duracionDias && <p className="text-sm text-gray-600">Duración: {med.duracionDias} días</p>}
                  {med.instrucciones && <p className="text-xs text-gray-500 mt-1">{med.instrucciones}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminarMedicamento(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para agregar medicamento */}
        <div className="border-t pt-4 space-y-3">
          <Label className="text-base font-semibold">Agregar Medicamento</Label>
          
          <div>
            <Label htmlFor="busquedaMed" className="text-sm">Buscar Medicamento</Label>
            <Input
              id="busquedaMed"
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
              placeholder="Buscar por nombre, principio activo o SKU..."
              className="mt-1"
            />
            {busquedaProducto && (
              <p className="text-xs text-gray-500 mt-1">
                {productosFiltrados.length} producto(s) encontrado(s)
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="productoMed" className="text-sm">Seleccionar del Catálogo</Label>
            {loadingProductos ? (
              <p className="text-sm text-gray-500 mt-2">Cargando productos...</p>
            ) : (
              <Select
                value={medicamentoActual.productoId}
                onValueChange={handleProductoChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccione un medicamento" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {productosFiltrados.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No se encontraron productos</div>
                  ) : (
                    productosFiltrados.map((producto) => (
                      <SelectItem key={producto.id} value={producto.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{producto.nombre}</span>
                          <span className="text-xs text-gray-500">
                            {producto.principioActivo && `${producto.principioActivo} | `}
                            ${producto.precioVenta?.toLocaleString()}
                            {producto.requiereReceta && ' | Requiere receta'}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div>
            <Label htmlFor="dosisMed" className="text-sm">Dosis</Label>
            <Input
              id="dosisMed"
              value={medicamentoActual.dosis}
              onChange={(e) => setMedicamentoActual({ ...medicamentoActual, dosis: e.target.value })}
              placeholder="Ej: 1 tableta, 500mg, etc."
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="viaMed" className="text-xs">Vía</Label>
              <Select
                value={medicamentoActual.via}
                onValueChange={(value) => setMedicamentoActual({ ...medicamentoActual, via: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oral">Oral</SelectItem>
                  <SelectItem value="Intravenosa">Intravenosa</SelectItem>
                  <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                  <SelectItem value="Topica">Tópica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="frecuenciaMed" className="text-xs">Frecuencia</Label>
              <Select
                value={medicamentoActual.frecuencia}
                onValueChange={(value) => setMedicamentoActual({ ...medicamentoActual, frecuencia: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cada4Horas">Cada 4 horas</SelectItem>
                  <SelectItem value="Cada6Horas">Cada 6 horas</SelectItem>
                  <SelectItem value="Cada8Horas">Cada 8 horas</SelectItem>
                  <SelectItem value="Cada12Horas">Cada 12 horas</SelectItem>
                  <SelectItem value="Cada24Horas">Cada 24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duracionMed" className="text-xs">Duración (días)</Label>
              <Input
                id="duracionMed"
                type="number"
                value={medicamentoActual.duracionDias}
                onChange={(e) => setMedicamentoActual({ ...medicamentoActual, duracionDias: e.target.value })}
                placeholder="7"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instruccionesMed" className="text-xs">Instrucciones</Label>
            <Input
              id="instruccionesMed"
              value={medicamentoActual.instrucciones}
              onChange={(e) => setMedicamentoActual({ ...medicamentoActual, instrucciones: e.target.value })}
              placeholder="Ej: Tomar después de las comidas"
            />
          </div>

          <Button
            onClick={agregarMedicamento}
            className="w-full bg-teal-600 hover:bg-teal-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar a la prescripción
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
