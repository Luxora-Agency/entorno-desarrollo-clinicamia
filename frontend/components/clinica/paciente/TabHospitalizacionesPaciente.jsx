'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bed, Calendar, Clock, Eye, MapPin, User } from 'lucide-react';

const ESTADO_BADGES = {
  'Activa': 'bg-green-100 text-green-700 border-green-200',
  'Egresada': 'bg-blue-100 text-blue-700 border-blue-200',
  'Cancelada': 'bg-red-100 text-red-700 border-red-200',
};

export default function TabHospitalizacionesPaciente({ pacienteId, paciente }) {
  const [admisiones, setAdmisiones] = useState([]);
  const [admisionActiva, setAdmisionActiva] = useState(null);
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
        const admisionesData = data.data.admisiones || [];
        setAdmisiones(admisionesData);
        
        // Buscar admisión activa
        const activa = admisionesData.find(a => a.estado === 'Activa');
        setAdmisionActiva(activa);
      }
    } catch (error) {
      console.error('Error al cargar admisiones:', error);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularDiasHospitalizacion = (fechaIngreso, fechaEgreso) => {
    const inicio = new Date(fechaIngreso);
    const fin = fechaEgreso ? new Date(fechaEgreso) : new Date();
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className=\"p-6\">
          <p className=\"text-center text-gray-600 py-8\">Cargando hospitalizaciones...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <Card className=\"border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white\">
        <CardHeader>
          <div className=\"flex items-center gap-3\">
            <div className=\"p-3 bg-indigo-600 rounded-lg\">
              <Bed className=\"w-6 h-6 text-white\" />
            </div>
            <div>
              <CardTitle className=\"text-2xl\">Hospitalizaciones</CardTitle>
              <p className=\"text-sm text-gray-600 mt-1\">
                Historial de admisiones hospitalarias del paciente
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
            <div className=\"text-center p-4 bg-gray-50 rounded-lg\">
              <p className=\"text-3xl font-bold text-gray-700\">{admisiones.length}</p>
              <p className=\"text-sm text-gray-600\">Total Admisiones</p>
            </div>
            <div className=\"text-center p-4 bg-green-50 rounded-lg\">
              <p className=\"text-3xl font-bold text-green-700\">
                {admisiones.filter(a => a.estado === 'Activa').length}
              </p>
              <p className=\"text-sm text-green-600\">Activas</p>
            </div>
            <div className=\"text-center p-4 bg-blue-50 rounded-lg\">
              <p className=\"text-3xl font-bold text-blue-700\">
                {admisiones.filter(a => a.estado === 'Egresada').length}
              </p>
              <p className=\"text-sm text-blue-600\">Egresadas</p>
            </div>
            <div className=\"text-center p-4 bg-orange-50 rounded-lg\">
              <p className=\"text-3xl font-bold text-orange-700\">
                {admisionActiva ? calcularDiasHospitalizacion(admisionActiva.fechaIngreso) : 0}
              </p>
              <p className=\"text-sm text-orange-600\">Días Actual</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admisión Activa */}
      {admisionActiva && (
        <Card className=\"border-2 border-green-300 bg-green-50\">
          <CardHeader>
            <CardTitle className=\"text-lg flex items-center gap-2\">
              <Bed className=\"h-5 w-5 text-green-600\" />
              Admisión Activa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
              <div>
                <span className=\"text-sm text-gray-600\">Unidad:</span>
                <p className=\"font-semibold\">{admisionActiva.unidad?.nombre || 'N/A'}</p>
              </div>
              <div>
                <span className=\"text-sm text-gray-600\">Cama:</span>
                <p className=\"font-semibold\">{admisionActiva.cama?.numero || 'N/A'}</p>
              </div>
              <div>
                <span className=\"text-sm text-gray-600\">Fecha Ingreso:</span>
                <p className=\"font-semibold\">{formatDate(admisionActiva.fechaIngreso)}</p>
              </div>
              <div>
                <span className=\"text-sm text-gray-600\">Días:</span>
                <p className=\"font-semibold\">{calcularDiasHospitalizacion(admisionActiva.fechaIngreso)} días</p>
              </div>
            </div>
            <div className=\"mt-4\">
              <Button 
                size=\"sm\" 
                onClick={() => verDetalle(admisionActiva)}
                className=\"bg-green-600 hover:bg-green-700\"
              >
                <Eye className=\"w-4 h-4 mr-2\" />
                Ver Detalles
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Admisiones */}
      {admisiones.length === 0 ? (
        <Card>
          <CardContent className=\"p-6\">
            <div className=\"text-center py-12\">
              <Bed className=\"w-16 h-16 text-gray-300 mx-auto mb-4\" />
              <p className=\"text-gray-600\">No hay admisiones registradas para este paciente</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Admisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Ingreso</TableHead>
                  <TableHead>Fecha Egreso</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Cama</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Diagnóstico Ingreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className=\"text-right\">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admisiones.map((admision) => (
                  <TableRow key={admision.id}>
                    <TableCell>{formatDate(admision.fechaIngreso)}</TableCell>
                    <TableCell>{admision.fechaEgreso ? formatDate(admision.fechaEgreso) : '-'}</TableCell>
                    <TableCell>{admision.unidad?.nombre || 'N/A'}</TableCell>
                    <TableCell>{admision.cama?.numero || 'N/A'}</TableCell>
                    <TableCell className=\"max-w-xs truncate\">{admision.motivoIngreso}</TableCell>
                    <TableCell className=\"max-w-xs truncate\">{admision.diagnosticoIngreso}</TableCell>
                    <TableCell>
                      <Badge className={`${ESTADO_BADGES[admision.estado]} border`}>
                        {admision.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className=\"text-right\">
                      <Button
                        size=\"sm\"
                        variant=\"ghost\"
                        onClick={() => verDetalle(admision)}
                        className=\"hover:bg-indigo-50\"
                      >
                        <Eye className=\"w-4 h-4\" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalle de Admisión */}
      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className=\"max-w-3xl max-h-[80vh] overflow-y-auto\">
          <DialogHeader>
            <DialogTitle className=\"flex items-center gap-2\">
              <Bed className=\"h-5 w-5 text-indigo-600\" />
              Detalle de Hospitalización
            </DialogTitle>
          </DialogHeader>
          {admisionSeleccionada && (
            <div className=\"space-y-6\">
              {/* Información General */}
              <Card>
                <CardHeader>
                  <CardTitle className=\"text-lg\">Información General</CardTitle>
                </CardHeader>
                <CardContent className=\"space-y-3\">
                  <div className=\"grid grid-cols-2 gap-4\">
                    <div>
                      <span className=\"text-sm text-gray-600\">Estado:</span>
                      <div className=\"mt-1\">
                        <Badge className={`${ESTADO_BADGES[admisionSeleccionada.estado]} border`}>
                          {admisionSeleccionada.estado}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className=\"text-sm text-gray-600\">Días de Hospitalización:</span>
                      <p className=\"font-semibold text-lg\">{calcularDiasHospitalizacion(admisionSeleccionada.fechaIngreso, admisionSeleccionada.fechaEgreso)} días</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ubicación */}
              <Card>
                <CardHeader>
                  <CardTitle className=\"text-lg flex items-center gap-2\">
                    <MapPin className=\"h-5 w-5\" />
                    Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"grid grid-cols-2 gap-4\">
                    <div>
                      <span className=\"text-sm text-gray-600\">Unidad:</span>
                      <p className=\"font-semibold\">{admisionSeleccionada.unidad?.nombre || 'N/A'}</p>
                      <p className=\"text-xs text-gray-500\">{admisionSeleccionada.unidad?.tipo || ''}</p>
                    </div>
                    <div>
                      <span className=\"text-sm text-gray-600\">Cama:</span>
                      <p className=\"font-semibold\">{admisionSeleccionada.cama?.numero || 'N/A'}</p>
                      <p className=\"text-xs text-gray-500\">
                        Habitación: {admisionSeleccionada.cama?.habitacion?.numero || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fechas */}
              <Card>
                <CardHeader>
                  <CardTitle className=\"text-lg flex items-center gap-2\">
                    <Calendar className=\"h-5 w-5\" />
                    Fechas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"grid grid-cols-2 gap-4\">
                    <div>
                      <span className=\"text-sm text-gray-600\">Fecha y Hora de Ingreso:</span>
                      <p className=\"font-semibold\">{formatDate(admisionSeleccionada.fechaIngreso)}</p>
                    </div>
                    <div>
                      <span className=\"text-sm text-gray-600\">Fecha y Hora de Egreso:</span>
                      <p className=\"font-semibold\">
                        {admisionSeleccionada.fechaEgreso ? formatDate(admisionSeleccionada.fechaEgreso) : 'Aún hospitalizado'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información Clínica */}
              <Card>
                <CardHeader>
                  <CardTitle className=\"text-lg\">Información Clínica</CardTitle>
                </CardHeader>
                <CardContent className=\"space-y-3\">
                  <div>
                    <span className=\"text-sm text-gray-600\">Motivo de Ingreso:</span>
                    <p className=\"mt-1 p-3 bg-gray-50 rounded text-sm\">{admisionSeleccionada.motivoIngreso}</p>
                  </div>
                  <div>
                    <span className=\"text-sm text-gray-600\">Diagnóstico de Ingreso:</span>
                    <p className=\"mt-1 p-3 bg-gray-50 rounded text-sm\">{admisionSeleccionada.diagnosticoIngreso}</p>
                  </div>
                  {admisionSeleccionada.diagnosticoEgreso && (
                    <div>
                      <span className=\"text-sm text-gray-600\">Diagnóstico de Egreso:</span>
                      <p className=\"mt-1 p-3 bg-blue-50 rounded text-sm\">{admisionSeleccionada.diagnosticoEgreso}</p>
                    </div>
                  )}
                  {admisionSeleccionada.observaciones && (
                    <div>
                      <span className=\"text-sm text-gray-600\">Observaciones:</span>
                      <p className=\"mt-1 p-3 bg-gray-50 rounded text-sm\">{admisionSeleccionada.observaciones}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Información del Egreso */}
              {admisionSeleccionada.egreso && (
                <Card className=\"border-2 border-blue-200 bg-blue-50\">
                  <CardHeader>
                    <CardTitle className=\"text-lg\">Información de Egreso</CardTitle>
                  </CardHeader>
                  <CardContent className=\"space-y-3\">
                    <div className=\"grid grid-cols-2 gap-4\">
                      <div>
                        <span className=\"text-sm text-gray-600\">Tipo de Egreso:</span>
                        <Badge className=\"mt-1\">{admisionSeleccionada.egreso.tipoEgreso}</Badge>
                      </div>
                      <div>
                        <span className=\"text-sm text-gray-600\">Estado del Paciente:</span>
                        <Badge className=\"mt-1\">{admisionSeleccionada.egreso.estadoPaciente}</Badge>
                      </div>
                    </div>
                    {admisionSeleccionada.egreso.resumenClinico && (
                      <div>
                        <span className=\"text-sm text-gray-600\">Resumen Clínico:</span>
                        <p className=\"mt-1 p-3 bg-white rounded text-sm\">{admisionSeleccionada.egreso.resumenClinico}</p>
                      </div>
                    )}
                    {admisionSeleccionada.egreso.recomendaciones && (
                      <div>
                        <span className=\"text-sm text-gray-600\">Recomendaciones:</span>
                        <p className=\"mt-1 p-3 bg-white rounded text-sm\">{admisionSeleccionada.egreso.recomendaciones}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
