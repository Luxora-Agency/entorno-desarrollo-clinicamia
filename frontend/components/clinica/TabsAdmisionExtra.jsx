// Tabs adicionales para el módulo de Admisiones
// Este archivo contiene los tabs: Medicamentos, Interconsultas, Egreso y Facturación

import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDateLong } from '@/services/formatters';

// ==================== TAB MEDICAMENTOS ====================
export function TabMedicamentos({ admision, medicamentos, onReload }) {
  const { toast } = useToast();
  const [showAgregar, setShowAgregar] = useState(false);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [medicamentoData, setMedicamentoData] = useState({
    productoId: '',
    cantidad: 1,
    dosis: '',
    frecuencia: 'Cada8Horas',
    via: 'Oral',
    duracionDias: '',
    indicaciones: '',
  });

  useEffect(() => {
    if (showAgregar) {
      cargarProductos();
    }
  }, [showAgregar]);

  useEffect(() => {
    if (busqueda.length >= 2) {
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.principioActivo?.toLowerCase().includes(busqueda.toLowerCase())
      );
      setProductosFiltrados(filtrados);
    } else {
      setProductosFiltrados([]);
    }
  }, [busqueda, productos]);

  const cargarProductos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/productos?activo=true&limit=200', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProductos(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const agregarMedicamento = async () => {
    if (!medicamentoData.productoId || !medicamentoData.dosis) {
      toast({
        title: 'Campos requeridos',
        description: 'Complete producto y dosis',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const producto = productos.find(p => p.id === medicamentoData.productoId);

      const response = await fetch('/api/ordenes-medicamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: admision.pacienteId,
          admision_id: admision.id,
          total: producto.precioVenta * medicamentoData.cantidad,
          observaciones: medicamentoData.indicaciones,
          items: [{
            producto_id: medicamentoData.productoId,
            cantidad: medicamentoData.cantidad,
            precio_unitario: producto.precioVenta,
            subtotal: producto.precioVenta * medicamentoData.cantidad,
            indicaciones: `${medicamentoData.dosis} - ${medicamentoData.via} - ${medicamentoData.frecuencia}${medicamentoData.duracionDias ? ` por ${medicamentoData.duracionDias} días` : ''}`,
          }]
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Medicamento agregado correctamente',
        });
        setShowAgregar(false);
        resetForm();
        onReload();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo agregar el medicamento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error agregando medicamento:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error',
        variant: 'destructive',
      });
    }
  };

  const cambiarEstadoMedicamento = async (itemId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ordenes-medicamentos/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Estado actualizado',
        });
        onReload();
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const resetForm = () => {
    setMedicamentoData({
      productoId: '',
      cantidad: 1,
      dosis: '',
      frecuencia: 'Cada8Horas',
      via: 'Oral',
      duracionDias: '',
      indicaciones: '',
    });
    setBusqueda('');
    setProductosFiltrados([]);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Medicamentos</h3>
        <Button onClick={() => setShowAgregar(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Medicamento
        </Button>
      </div>

      {/* Lista de Medicamentos */}
      <div className="space-y-3">
        {medicamentos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay medicamentos registrados</p>
        ) : (
          medicamentos.map((orden) => (
            <Card key={orden.id}>
              <CardContent className="pt-4 space-y-2">
                {orden.items?.map((item) => (
                  <div key={item.id} className="border-b pb-2 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{item.producto?.nombre}</h4>
                          <Badge className={
                            item.estado === 'Aplicado' ? 'bg-green-100 text-green-800' :
                            item.estado === 'NoAplicado' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {item.estado || 'Pendiente'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{item.indicaciones}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Cantidad: {item.cantidad} - ${parseFloat(item.subtotal).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          defaultValue={item.estado || 'Pendiente'}
                          onValueChange={(value) => cambiarEstadoMedicamento(item.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                            <SelectItem value="Aplicado">Aplicado</SelectItem>
                            <SelectItem value="NoAplicado">No Aplicado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Agregar Medicamento */}
      {showAgregar && (
        <Dialog open={showAgregar} onOpenChange={setShowAgregar}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Medicamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Buscar Medicamento *</Label>
                <Input
                  placeholder="Buscar por nombre o principio activo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {productosFiltrados.length > 0 && (
                  <div className="mt-2 border rounded max-h-40 overflow-y-auto">
                    {productosFiltrados.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setMedicamentoData({ ...medicamentoData, productoId: prod.id });
                          setBusqueda(prod.nombre);
                          setProductosFiltrados([]);
                        }}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{prod.nombre}</div>
                        <div className="text-sm text-gray-500">
                          {prod.principioActivo} - ${prod.precioVenta?.toLocaleString()}
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
                    value={medicamentoData.dosis}
                    onChange={(e) => setMedicamentoData({ ...medicamentoData, dosis: e.target.value })}
                    placeholder="Ej: 500mg, 1 tableta"
                  />
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={medicamentoData.cantidad}
                    onChange={(e) => setMedicamentoData({ ...medicamentoData, cantidad: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Vía</Label>
                  <Select
                    value={medicamentoData.via}
                    onValueChange={(value) => setMedicamentoData({ ...medicamentoData, via: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oral">Oral</SelectItem>
                      <SelectItem value="Intravenosa">Intravenosa</SelectItem>
                      <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                      <SelectItem value="Subcutanea">Subcutánea</SelectItem>
                      <SelectItem value="Topica">Tópica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frecuencia</Label>
                  <Select
                    value={medicamentoData.frecuencia}
                    onValueChange={(value) => setMedicamentoData({ ...medicamentoData, frecuencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cada8Horas">Cada 8 horas</SelectItem>
                      <SelectItem value="Cada12Horas">Cada 12 horas</SelectItem>
                      <SelectItem value="Cada24Horas">Cada 24 horas</SelectItem>
                      <SelectItem value="PRN">PRN (según necesidad)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duración (días)</Label>
                  <Input
                    type="number"
                    value={medicamentoData.duracionDias}
                    onChange={(e) => setMedicamentoData({ ...medicamentoData, duracionDias: e.target.value })}
                    placeholder="Ej: 7"
                  />
                </div>
              </div>

              <div>
                <Label>Indicaciones Adicionales</Label>
                <Textarea
                  value={medicamentoData.indicaciones}
                  onChange={(e) => setMedicamentoData({ ...medicamentoData, indicaciones: e.target.value })}
                  placeholder="Instrucciones especiales..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAgregar(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={agregarMedicamento} className="flex-1">
                  Agregar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ==================== TAB INTERCONSULTAS ====================
export function TabInterconsultas({ admision, interconsultas, onReload }) {
  const { toast } = useToast();
  const [showAgregar, setShowAgregar] = useState(false);
  const [especialidades, setEspecialidades] = useState([]);
  const [interconsultaData, setInterconsultaData] = useState({
    especialidadId: '',
    motivo: '',
    observaciones: '',
  });

  useEffect(() => {
    if (showAgregar) {
      cargarEspecialidades();
    }
  }, [showAgregar]);

  const cargarEspecialidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/especialidades', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEspecialidades(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando especialidades:', error);
    }
  };

  const crearInterconsulta = async () => {
    if (!interconsultaData.especialidadId || !interconsultaData.motivo) {
      toast({
        title: 'Campos requeridos',
        description: 'Complete especialidad y motivo',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Crear cita PorAgendar
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: admision.pacienteId,
          especialidad_id: interconsultaData.especialidadId,
          tipo_cita: 'Especialidad',
          motivo: `Interconsulta: ${interconsultaData.motivo}`,
          notas: interconsultaData.observaciones,
          estado: 'PorAgendar',
          costo: 50000, // Costo base de interconsulta
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Interconsulta creada. La recepcionista debe programarla.',
        });
        setShowAgregar(false);
        setInterconsultaData({
          especialidadId: '',
          motivo: '',
          observaciones: '',
        });
        onReload();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo crear la interconsulta',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creando interconsulta:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Interconsultas</h3>
        <Button onClick={() => setShowAgregar(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Interconsulta
        </Button>
      </div>

      {/* Lista de Interconsultas */}
      <div className="space-y-3">
        {interconsultas.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay interconsultas registradas</p>
        ) : (
          interconsultas.map((inter) => (
            <Card key={inter.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-800">
                        {inter.especialidad?.nombre || inter.especialidad?.titulo}
                      </Badge>
                      <Badge variant="outline">{inter.estado}</Badge>
                    </div>
                    <p className="font-semibold">Motivo: {inter.motivo}</p>
                    {inter.doctor && (
                      <p className="text-sm text-gray-600 mt-1">
                        Doctor: {inter.doctor.usuario?.nombre} {inter.doctor.usuario?.apellido}
                      </p>
                    )}
                    {inter.fecha && (
                      <p className="text-sm text-gray-500 mt-1">
                        Programada: {formatDateLong(inter.fecha)}
                      </p>
                    )}
                    {inter.estado === 'PorAgendar' && (
                      <p className="text-sm text-amber-600 mt-2">
                        ⏳ Pendiente de programación por recepción
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Nueva Interconsulta */}
      {showAgregar && (
        <Dialog open={showAgregar} onOpenChange={setShowAgregar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Interconsulta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Especialidad Requerida *</Label>
                <Select
                  value={interconsultaData.especialidadId}
                  onValueChange={(value) => setInterconsultaData({ ...interconsultaData, especialidadId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id}>
                        {esp.titulo || esp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Motivo de Interconsulta *</Label>
                <Textarea
                  value={interconsultaData.motivo}
                  onChange={(e) => setInterconsultaData({ ...interconsultaData, motivo: e.target.value })}
                  placeholder="Describa el motivo de la interconsulta..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Observaciones Adicionales</Label>
                <Textarea
                  value={interconsultaData.observaciones}
                  onChange={(e) => setInterconsultaData({ ...interconsultaData, observaciones: e.target.value })}
                  placeholder="Información adicional relevante..."
                  rows={2}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                ℹ️ Esta interconsulta se creará sin doctor ni fecha asignados. La recepcionista deberá programarla posteriormente.
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAgregar(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={crearInterconsulta} className="flex-1">
                  Crear Interconsulta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Continuaré con TabEgreso y TabFacturacion...
