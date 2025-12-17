'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarIcon, Clock, Eye, Stethoscope, User } from 'lucide-react';

const ESTADO_BADGES = {
  'Programada': 'bg-blue-100 text-blue-700 border-blue-200',
  'Confirmada': 'bg-green-100 text-green-700 border-green-200',
  'EnEspera': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Atendiendo': 'bg-purple-100 text-purple-700 border-purple-200',
  'Completada': 'bg-teal-100 text-teal-700 border-teal-200',
  'Cancelada': 'bg-red-100 text-red-700 border-red-200',
  'NoAsistio': 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function TabCitasPaciente({ pacienteId }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    if (pacienteId) {
      loadCitas();
    }
  }, [pacienteId]);

  const loadCitas = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/citas?paciente_id=${pacienteId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setCitas(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalleCita = (cita) => {
    setCitaSeleccionada(cita);
    setMostrarModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-600 py-8">Cargando citas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Citas Médicas</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Historial de citas del paciente
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-700">{citas.length}</p>
              <p className="text-sm text-blue-600">Total Citas</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-700">
                {citas.filter(c => c.estado === 'Completada').length}
              </p>
              <p className="text-sm text-green-600">Completadas</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-700">
                {citas.filter(c => c.estado === 'Programada' || c.estado === 'Confirmada').length}
              </p>
              <p className="text-sm text-yellow-600">Programadas</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-700">
                {citas.filter(c => c.estado === 'Cancelada' || c.estado === 'NoAsistio').length}
              </p>
              <p className="text-sm text-red-600">Canceladas/No Asistió</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {citas.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay citas registradas para este paciente</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Listado de Citas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citas.map((cita) => (
                  <TableRow key={cita.id}>
                    <TableCell>{formatDate(cita.fecha)}</TableCell>
                    <TableCell>{formatTime(cita.hora)}</TableCell>
                    <TableCell>
                      {cita.doctor ? `Dr. ${cita.doctor.nombre} ${cita.doctor.apellido}` : 'N/A'}
                    </TableCell>
                    <TableCell>{cita.especialidad?.titulo || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{cita.motivo}</TableCell>
                    <TableCell>
                      <Badge className={`${ESTADO_BADGES[cita.estado] || 'bg-gray-100'} border`}>
                        {cita.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => verDetalleCita(cita)}
                        className="hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalle de Cita */}
      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-emerald-600" />
              Detalle de Cita
            </DialogTitle>
          </DialogHeader>
          {citaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Fecha:</span>
                  <p className="font-semibold">{formatDate(citaSeleccionada.fecha)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Hora:</span>
                  <p className="font-semibold">{formatTime(citaSeleccionada.hora)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Doctor:</span>
                  <p className="font-semibold">
                    {citaSeleccionada.doctor ? `Dr. ${citaSeleccionada.doctor.nombre} ${citaSeleccionada.doctor.apellido}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Especialidad:</span>
                  <p className="font-semibold">{citaSeleccionada.especialidad?.titulo || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Estado:</span>
                  <Badge className={`${ESTADO_BADGES[citaSeleccionada.estado]} border`}>
                    {citaSeleccionada.estado}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Costo:</span>
                  <p className="font-semibold">${citaSeleccionada.costo?.toLocaleString('es-CO') || '0'}</p>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Motivo de Consulta:</span>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{citaSeleccionada.motivo}</p>
              </div>
              
              {citaSeleccionada.notas && (
                <div>
                  <span className="text-sm text-gray-600">Notas:</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{citaSeleccionada.notas}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
