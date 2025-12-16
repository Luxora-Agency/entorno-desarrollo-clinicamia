'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TabProcedimientos({ admision, procedimientos, onReload }) {
  const { toast } = useToast();
  const [showAgregar, setShowAgregar] = useState(false);
  const [servicios, setServicios] = useState([]);
  const [ordenActual, setOrdenActual] = useState({
    tipo: 'Procedimiento',
    servicioId: '',
    servicioNombre: '',
    costo: 0,
    observaciones: '',
  });

  useEffect(() => {
    if (showAgregar) {
      cargarServicios(ordenActual.tipo);
    }
  }, [showAgregar, ordenActual.tipo]);

  const cargarServicios = async (tipo) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/examenes-procedimientos?tipo=${tipo}&estado=Activo&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setServicios(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
      setServicios([]);
    }
  };

  const handleServicioChange = (servicioId) => {
    const servicio = servicios.find(s => s.id === servicioId);
    if (servicio) {
      setOrdenActual({
        ...ordenActual,
        servicioId: servicio.id,
        servicioNombre: servicio.nombre,
        costo: servicio.costoBase || 0, // ← Usa costoBase del backend
      });
    }
  };

  const agregarProcedimiento = async () => {
    if (!ordenActual.servicioId) {
      toast({
        title: 'Error',
        description: 'Seleccione un procedimiento',
        variant: 'destructive',
      });
      return;
    }

    // Validar que tenga costo
    const costoFinal = parseFloat(ordenActual.costo);
    if (isNaN(costoFinal) || costoFinal <= 0) {
      toast({
        title: 'Error',
        description: 'El servicio seleccionado no tiene precio configurado',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      console.log('📤 Creando procedimiento:', {
        servicio: ordenActual.servicioNombre,
        costo: costoFinal,
        tipo: ordenActual.tipo
      });

      // 1. Crear OrdenMedica (registro del procedimiento ordenado)
      const ordenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes-medicas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: admision.pacienteId,
          admision_id: admision.id,
          examen_procedimiento_id: ordenActual.servicioId,
          doctor_id: user.id,
          precio_aplicado: costoFinal,
          observaciones: ordenActual.observaciones || '',
          estado: 'Pendiente',
        })
      });

      if (!ordenResponse.ok) {
        const errorData = await ordenResponse.json();
        throw new Error(errorData.message || 'Error al crear orden médica');
      }

      // 2. Crear Cita con estado PorAgendar (para que recepción la agende)
      const fechaHoy = new Date();
      const citaResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/citas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: admision.pacienteId,
          admision_id: admision.id, // Vincula con la admisión
          tipo_cita: ordenActual.tipo,
          examen_procedimiento_id: ordenActual.servicioId,
          fecha: fechaHoy.toISOString().split('T')[0], // Fecha actual
          hora: '00:00:00', // Hora placeholder
          costo: costoFinal, // Usa el mismo costo que la OrdenMedica
          motivo: ordenActual.servicioNombre,
          estado: 'PorAgendar',
          // doctor_id es NULL - lo asigna recepción
        })
      });

      if (!citaResponse.ok) throw new Error('Error al crear cita');

      toast({
        title: 'Éxito',
        description: 'Procedimiento agregado. Recepción deberá agendar la cita.',
      });

      setShowAgregar(false);
      setOrdenActual({
        tipo: 'Procedimiento',
        servicioId: '',
        servicioNombre: '',
        costo: 0,
        observaciones: '',
      });
      onReload();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el procedimiento',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Procedimientos y Exámenes</h3>
        <Button onClick={() => setShowAgregar(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de Procedimientos */}
      <div className="space-y-3">
        {procedimientos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay procedimientos registrados</p>
        ) : (
          procedimientos.map((orden) => (
            <Card key={orden.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-emerald-900">
                      {orden.examenProcedimiento?.nombre || 'Procedimiento'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {orden.examenProcedimiento?.descripcion}
                    </p>
                    {orden.observaciones && (
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>Observaciones:</strong> {orden.observaciones}
                      </p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span>Precio: ${parseFloat(orden.precioAplicado).toLocaleString()}</span>
                      <span>Fecha: {new Date(orden.fechaOrden).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={
                    orden.estado === 'Completada' ? 'default' : 
                    orden.estado === 'Pendiente' ? 'secondary' : 
                    'outline'
                  }>
                    {orden.estado}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Agregar */}
      <Dialog open={showAgregar} onOpenChange={setShowAgregar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Procedimiento / Examen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={ordenActual.tipo}
                onValueChange={(value) => {
                  setOrdenActual({ ...ordenActual, tipo: value, servicioId: '', servicioNombre: '', costo: 0 });
                  cargarServicios(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Procedimiento">Procedimiento</SelectItem>
                  <SelectItem value="Examen">Examen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Seleccionar {ordenActual.tipo}</Label>
              <Select value={ordenActual.servicioId} onValueChange={handleServicioChange}>
                <SelectTrigger>
                  <SelectValue placeholder={`Seleccione un ${ordenActual.tipo.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((servicio) => (
                    <SelectItem key={servicio.id} value={servicio.id}>
                      {servicio.nombre} {servicio.costoBase ? `- $${parseFloat(servicio.costoBase).toLocaleString()}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observaciones / Indicaciones</Label>
              <Textarea
                value={ordenActual.observaciones}
                onChange={(e) => setOrdenActual({ ...ordenActual, observaciones: e.target.value })}
                placeholder="Indicaciones especiales para el procedimiento..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAgregar(false)}>
                Cancelar
              </Button>
              <Button onClick={agregarProcedimiento}>
                Agregar Procedimiento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
