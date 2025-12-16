'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TabMedicamentos({ admision, onReload }) {
  const { toast } = useToast();
  const [showAgregar, setShowAgregar] = useState(false);
  const [prescripciones, setPrescripciones] = useState([]);
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

  useEffect(() => {
    cargarPrescripciones();
  }, [admision.id]);

  useEffect(() => {
    if (showAgregar) {
      cargarProductos();
    }
  }, [showAgregar]);

  useEffect(() => {
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
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos?activo=true&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setProductos(result.data || []);
        setProductosFiltrados(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const cargarPrescripciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/prescripciones?pacienteId=${admision.pacienteId}&admisionId=${admision.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setPrescripciones(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando prescripciones:', error);
    }
  };

  const handleProductoChange = (productoId) => {
    const producto = productos.find(p => p.id === productoId);
    if (producto) {
      setMedicamentoActual({
        ...medicamentoActual,
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio || 0,
      });
      setBusquedaProducto(producto.nombre);
    }
  };

  const agregarMedicamento = async () => {
    if (!medicamentoActual.productoId || !medicamentoActual.dosis) {
      toast({
        title: 'Campos requeridos',
        description: 'Seleccione un medicamento y especifique la dosis',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // 1. Crear Prescripción (receta)
      const prescripcionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/prescripciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pacienteId: admision.pacienteId,
          admisionId: admision.id,
          medicoId: user.id,
          diagnostico: '',
          estado: 'Activa',
          medicamentos: [
            {
              productoId: medicamentoActual.productoId,
              dosis: medicamentoActual.dosis,
              via: medicamentoActual.via,
              frecuencia: medicamentoActual.frecuencia,
              duracionDias: medicamentoActual.duracionDias ? parseInt(medicamentoActual.duracionDias) : null,
              instrucciones: medicamentoActual.instrucciones,
            }
          ],
        })
      });

      if (!prescripcionResponse.ok) throw new Error('Error al crear prescripción');

      // 2. Crear OrdenMedicamento (para farmacia)
      const ordenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes-medicamentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: admision.pacienteId,
          admision_id: admision.id,
          doctor_id: user.id,
          estado: 'Pendiente',
          observaciones: medicamentoActual.instrucciones || 'Orden generada desde hospitalización',
          total: parseFloat(medicamentoActual.precio),
          items: [
            {
              producto_id: medicamentoActual.productoId,
              cantidad: 1,
              precio_unitario: parseFloat(medicamentoActual.precio),
              descuento: 0,
              indicaciones: `${medicamentoActual.dosis} - Vía ${medicamentoActual.via} - ${medicamentoActual.frecuencia}${medicamentoActual.duracionDias ? ` por ${medicamentoActual.duracionDias} días` : ''}`,
            }
          ],
        })
      });

      if (!ordenResponse.ok) throw new Error('Error al crear orden de medicamento');

      toast({
        title: 'Éxito',
        description: 'Medicamento prescrito correctamente',
      });

      setShowAgregar(false);
      setBusquedaProducto('');
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
      cargarPrescripciones();
      onReload();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el medicamento',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Prescripciones</h3>
        <Button onClick={() => setShowAgregar(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Prescribir Medicamento
        </Button>
      </div>

      {/* Lista de Prescripciones */}
      <div className="space-y-3">
        {prescripciones.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay prescripciones registradas</p>
        ) : (
          prescripciones.map((presc) => (
            <Card key={presc.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={presc.estado === 'Activa' ? 'default' : 'secondary'}>
                    {presc.estado}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(presc.fechaPrescripcion).toLocaleDateString()}
                  </span>
                </div>
                
                {presc.medicamentos && presc.medicamentos.map((med, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded mb-2">
                    <h4 className="font-semibold text-emerald-900">
                      {med.producto?.nombre}
                    </h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <p><strong>Dosis:</strong> {med.dosis}</p>
                      <p><strong>Vía:</strong> {med.via}</p>
                      <p><strong>Frecuencia:</strong> {med.frecuencia}</p>
                      {med.duracionDias && <p><strong>Duración:</strong> {med.duracionDias} días</p>}
                      {med.instrucciones && <p className="mt-2"><strong>Instrucciones:</strong> {med.instrucciones}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Agregar */}
      <Dialog open={showAgregar} onOpenChange={setShowAgregar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescribir Medicamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Buscar Medicamento *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, principio activo o SKU..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {productosFiltrados.length > 0 && busquedaProducto && (
                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                  {productosFiltrados.slice(0, 10).map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleProductoChange(prod.id)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{prod.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {prod.principioActivo} {prod.precio && `- $${prod.precio.toLocaleString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dosis *</Label>
                <Input
                  value={medicamentoActual.dosis}
                  onChange={(e) => setMedicamentoActual({ ...medicamentoActual, dosis: e.target.value })}
                  placeholder="Ej: 500 mg"
                />
              </div>
              
              <div>
                <Label>Vía de Administración *</Label>
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
                    <SelectItem value="Subcutánea">Subcutánea</SelectItem>
                    <SelectItem value="Tópica">Tópica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Frecuencia *</Label>
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
                <Label>Duración (días)</Label>
                <Input
                  type="number"
                  value={medicamentoActual.duracionDias}
                  onChange={(e) => setMedicamentoActual({ ...medicamentoActual, duracionDias: e.target.value })}
                  placeholder="Ej: 7"
                />
              </div>
            </div>

            <div>
              <Label>Instrucciones Adicionales</Label>
              <Textarea
                value={medicamentoActual.instrucciones}
                onChange={(e) => setMedicamentoActual({ ...medicamentoActual, instrucciones: e.target.value })}
                placeholder="Instrucciones para el paciente..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAgregar(false)}>
                Cancelar
              </Button>
              <Button onClick={agregarMedicamento}>
                Prescribir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
