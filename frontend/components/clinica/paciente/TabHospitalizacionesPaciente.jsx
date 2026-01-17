'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bed, Calendar, Eye, MapPin } from 'lucide-react';

const ESTADO_BADGES = {
  'Activa': 'bg-green-100 text-green-700 border-green-200',
  'Egresada': 'bg-blue-100 text-blue-700 border-blue-200',
  'Cancelada': 'bg-red-100 text-red-700 border-red-200',
};

export default function TabHospitalizacionesPaciente({ pacienteId }) {
  const [admisiones, setAdmisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admisionSeleccionada, setAdmisionSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    if (pacienteId) {
      cargarAdmisiones();
    }
  }, [pacienteId]);

  const cargarAdmisiones = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/admisiones?pacienteId=${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setAdmisiones(data.data.admisiones || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = (admision) => {
    setAdmisionSeleccionada(admision);
    setMostrarModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    ,
      timeZone: 'America/Bogota'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-600 py-8">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-lg">
              <Bed className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Hospitalizaciones</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Historial de admisiones</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-700">{admisiones.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-700">
                {admisiones.filter(a => a.estado === 'Activa').length}
              </p>
              <p className="text-sm text-green-600">Activas</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-700">
                {admisiones.filter(a => a.estado === 'Egresada').length}
              </p>
              <p className="text-sm text-blue-600">Egresadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {admisiones.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Bed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay hospitalizaciones</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingreso</TableHead>
                  <TableHead>Egreso</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admisiones.map((admision) => (
                  <TableRow key={admision.id}>
                    <TableCell>{formatDate(admision.fechaIngreso)}</TableCell>
                    <TableCell>{admision.fechaEgreso ? formatDate(admision.fechaEgreso) : '-'}</TableCell>
                    <TableCell>{admision.unidad?.nombre || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{admision.motivoIngreso}</TableCell>
                    <TableCell>
                      <Badge className={`${ESTADO_BADGES[admision.estado]} border`}>
                        {admision.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => verDetalle(admision)}>
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

      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de Hospitalización</DialogTitle>
          </DialogHeader>
          {admisionSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Unidad:</span>
                  <p className="font-semibold">{admisionSeleccionada.unidad?.nombre}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Cama:</span>
                  <p className="font-semibold">{admisionSeleccionada.cama?.numero}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Ingreso:</span>
                  <p className="font-semibold">{formatDate(admisionSeleccionada.fechaIngreso)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Egreso:</span>
                  <p className="font-semibold">{admisionSeleccionada.fechaEgreso ? formatDate(admisionSeleccionada.fechaEgreso) : 'Activo'}</p>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Motivo:</span>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{admisionSeleccionada.motivoIngreso}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Diagnóstico:</span>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{admisionSeleccionada.diagnosticoIngreso}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
