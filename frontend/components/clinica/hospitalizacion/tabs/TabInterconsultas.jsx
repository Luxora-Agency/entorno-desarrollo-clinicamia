'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TabInterconsultas({ admision, onReload }) {
  const { toast } = useToast();
  const [showNueva, setShowNueva] = useState(false);
  const [citas, setCitas] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [interconsultaData, setInterconsultaData] = useState({
    especialidad: '',
    motivo: '',
    urgente: false,
  });

  useEffect(() => {
    cargarCitasPorAgendar();
  }, [admision.id]);

  useEffect(() => {
    if (showNueva) {
      cargarEspecialidades();
    }
  }, [showNueva]);

  const cargarEspecialidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/especialidades', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEspecialidades(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error cargando especialidades:', error);
    }
  };

  const cargarCitasPorAgendar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/citas?pacienteId=${admision.pacienteId}&estado=PorAgendar&tipoCita=Interconsulta`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCitas(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
    }
  };

  const crearInterconsulta = async () => {
    if (!interconsultaData.especialidad || !interconsultaData.motivo) {
      toast({
        title: 'Campos requeridos',
        description: 'Complete la especialidad y motivo',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Crear Cita con estado PorAgendar para interconsulta
      const fechaHoy = new Date();
      
      // Obtener costo de la especialidad
      const especialidadSeleccionada = especialidades.find(e => e.id === interconsultaData.especialidad);
      const costoInterconsulta = especialidadSeleccionada?.costoCOP || 50000; // Default si no tiene costo
      
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: admision.pacienteId,
          admision_id: admision.id, // Vincula con la admisión
          tipo_cita: 'Interconsulta',
          especialidad_id: interconsultaData.especialidad,
          fecha: fechaHoy.toISOString().split('T')[0], // Fecha actual YYYY-MM-DD
          hora: '00:00:00', // Hora placeholder - recepción la define
          costo: parseFloat(costoInterconsulta), // Costo de la especialidad
          motivo: interconsultaData.motivo,
          estado: 'PorAgendar',
          prioridad: interconsultaData.urgente ? 'Alta' : 'Media',
          // doctor_id es NULL - lo asigna recepción
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Interconsulta solicitada. Recepción deberá agendar la cita.',
        });
        setShowNueva(false);
        setInterconsultaData({
          especialidad: '',
          motivo: '',
          urgente: false,
        });
        cargarCitasPorAgendar();
        onReload();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo crear la interconsulta',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error:', error);
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
        <Button onClick={() => setShowNueva(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Solicitar Interconsulta
        </Button>
      </div>

      {/* Lista de Interconsultas Pendientes */}
      <div className="space-y-3">
        {citas.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay interconsultas solicitadas</p>
        ) : (
          citas.map((cita) => (
            <Card key={cita.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {cita.especialidad?.titulo || cita.especialidad?.nombre || 'Interconsulta'}
                      </Badge>
                      <Badge variant="outline">{cita.estado}</Badge>
                      {cita.prioridad === 'Alta' && (
                        <Badge variant="destructive">Urgente</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{cita.motivo}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Solicitada: {new Date(cita.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Nueva Interconsulta */}
      <Dialog open={showNueva} onOpenChange={setShowNueva}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Interconsulta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Especialidad *</Label>
              <Select
                value={interconsultaData.especialidad}
                onValueChange={(value) => setInterconsultaData({ ...interconsultaData, especialidad: value })}
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
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="urgente"
                checked={interconsultaData.urgente}
                onChange={(e) => setInterconsultaData({ ...interconsultaData, urgente: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="urgente" className="font-normal cursor-pointer">
                Marcar como urgente
              </Label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Nota:</strong> Esta interconsulta quedará como "Por Agendar". Recepción deberá asignar fecha, hora y especialista.
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNueva(false)}>
                Cancelar
              </Button>
              <Button onClick={crearInterconsulta}>
                Solicitar Interconsulta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
