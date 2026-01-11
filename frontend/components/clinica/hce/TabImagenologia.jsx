'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Scan, Image as ImageIcon, Clock, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TabImagenologia({ pacienteId }) {
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEstudio, setSelectedEstudio] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDownloadPDF = async (estudio) => {
    setDownloadingPDF(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/imagenologia/${estudio.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al descargar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_radiologico_${estudio.codigo || estudio.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error al descargar el PDF: ' + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const fetchEstudios = useCallback(async () => {
    if (!pacienteId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(
        `${apiUrl}/imagenologia?pacienteId=${pacienteId}&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEstudios(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching estudios:', error);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    fetchEstudios();
  }, [fetchEstudios]);

  const getEstadoBadge = (estado) => {
    const styles = {
      Pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Programado: 'bg-blue-100 text-blue-800 border-blue-300',
      EnProceso: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      Completado: 'bg-green-100 text-green-800 border-green-300',
      Cancelado: 'bg-red-100 text-red-800 border-red-300',
    };
    return styles[estado] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadBadge = (prioridad) => {
    const styles = {
      Urgente: 'bg-red-100 text-red-800',
      Alta: 'bg-orange-100 text-orange-800',
      Normal: 'bg-blue-100 text-blue-800',
      Baja: 'bg-gray-100 text-gray-800',
    };
    return styles[prioridad] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'EnProceso':
        return <Scan className="w-4 h-4 text-indigo-600" />;
      case 'Completado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Cancelado':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Stats
  const stats = {
    total: estudios.length,
    pendientes: estudios.filter((e) => e.estado === 'Pendiente').length,
    completados: estudios.filter((e) => e.estado === 'Completado').length,
    enProceso: estudios.filter((e) => e.estado === 'EnProceso').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Scan className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold">{stats.enProceso}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completados</p>
                <p className="text-2xl font-bold">{stats.completados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Estudios de Imagenología
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600"></div>
                      Cargando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : estudios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No hay estudios de imagenología registrados
                  </TableCell>
                </TableRow>
              ) : (
                estudios.map((estudio) => (
                  <TableRow key={estudio.id}>
                    <TableCell className="font-mono text-xs">
                      {estudio.codigo || estudio.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {estudio.fechaSolicitud &&
                        format(new Date(estudio.fechaSolicitud), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{estudio.tipoEstudio}</TableCell>
                    <TableCell>{estudio.zonaCuerpo}</TableCell>
                    <TableCell>
                      <Badge className={getPrioridadBadge(estudio.prioridad)}>
                        {estudio.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEstadoIcon(estudio.estado)}
                        <Badge className={getEstadoBadge(estudio.estado)}>{estudio.estado}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {estudio.medicoSolicitante?.nombre} {estudio.medicoSolicitante?.apellido}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEstudio(estudio);
                          setShowModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {estudio.estado === 'Completado' ? 'Ver Informe' : 'Ver Detalle'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalle/Informe */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              {selectedEstudio?.estado === 'Completado' ? 'Informe Radiológico' : 'Detalle del Estudio'}
            </DialogTitle>
          </DialogHeader>

          {selectedEstudio && (
            <div className="space-y-6">
              {/* Info del estudio */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Código</p>
                      <p className="font-medium">{selectedEstudio.codigo || selectedEstudio.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Estudio</p>
                      <p className="font-medium">{selectedEstudio.tipoEstudio}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Zona Anatómica</p>
                      <p className="font-medium">{selectedEstudio.zonaCuerpo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha Solicitud</p>
                      <p className="font-medium">
                        {selectedEstudio.fechaSolicitud &&
                          format(new Date(selectedEstudio.fechaSolicitud), 'dd/MM/yyyy HH:mm', {
                            locale: es,
                          })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <Badge className={getEstadoBadge(selectedEstudio.estado)}>
                        {selectedEstudio.estado}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Prioridad</p>
                      <Badge className={getPrioridadBadge(selectedEstudio.prioridad)}>
                        {selectedEstudio.prioridad}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-1">Indicación Clínica</p>
                    <p className="text-sm">{selectedEstudio.indicacionClinica}</p>
                  </div>

                  {selectedEstudio.observaciones && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500 mb-1">Observaciones</p>
                      <p className="text-sm">{selectedEstudio.observaciones}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-1">Médico Solicitante</p>
                    <p className="font-medium">
                      {selectedEstudio.medicoSolicitante?.nombre}{' '}
                      {selectedEstudio.medicoSolicitante?.apellido}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Informe - solo si está completado */}
              {selectedEstudio.estado === 'Completado' && selectedEstudio.hallazgos && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800">Informe Radiológico</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedEstudio.hallazgos && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">HALLAZGOS:</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded border">
                          {selectedEstudio.hallazgos}
                        </p>
                      </div>
                    )}

                    {selectedEstudio.conclusion && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">CONCLUSIÓN:</p>
                        <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap bg-white p-3 rounded border">
                          {selectedEstudio.conclusion}
                        </p>
                      </div>
                    )}

                    {selectedEstudio.recomendaciones && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">RECOMENDACIONES:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                          {selectedEstudio.recomendaciones}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-green-200 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Radiólogo</p>
                        <p className="font-medium">
                          {selectedEstudio.radiologo?.nombre} {selectedEstudio.radiologo?.apellido}
                        </p>
                      </div>
                      {selectedEstudio.fechaInforme && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Fecha de Informe</p>
                          <p className="font-medium">
                            {format(new Date(selectedEstudio.fechaInforme), 'dd/MM/yyyy HH:mm', {
                              locale: es,
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Si no está completado */}
              {selectedEstudio.estado !== 'Completado' && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-6 text-center">
                    <Clock className="w-12 h-12 mx-auto text-yellow-600 mb-2" />
                    <p className="text-yellow-800 font-medium">Informe pendiente</p>
                    <p className="text-sm text-yellow-600">
                      El estudio aún no ha sido informado por el radiólogo.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Botón de descarga PDF */}
              {selectedEstudio.estado === 'Completado' && (
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => handleDownloadPDF(selectedEstudio)}
                    disabled={downloadingPDF}
                    className="bg-gradient-to-r from-cyan-600 to-blue-700"
                  >
                    {downloadingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Informe PDF
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
