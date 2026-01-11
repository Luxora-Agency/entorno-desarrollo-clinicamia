'use client';

import { useState, useEffect } from 'react';
import { Award, Search, Download, Eye, Trash2, CheckCircle, XCircle, Calendar, User, FileText, QrCode, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCalidad2Certificados } from '@/hooks/useCalidad2Certificados';

export default function CertificadosTab({ user }) {
  const {
    certificados,
    currentCertificado,
    stats,
    pagination,
    loading,
    filters,
    setFilters,
    setPagination,
    loadCertificados,
    getCertificado,
    verificarCertificado,
    generarParaSesion,
    deleteCertificado,
    loadStats,
    clearCurrentCertificado,
  } = useCalidad2Certificados();

  const [showDetail, setShowDetail] = useState(false);
  const [showVerificar, setShowVerificar] = useState(false);
  const [codigoVerificar, setCodigoVerificar] = useState('');
  const [resultadoVerificacion, setResultadoVerificacion] = useState(null);
  const [showGenerarModal, setShowGenerarModal] = useState(false);
  const [sesionId, setSesionId] = useState('');

  useEffect(() => {
    loadCertificados();
    loadStats();
  }, []);

  const handleViewDetail = async (id) => {
    await getCertificado(id);
    setShowDetail(true);
  };

  const handleVerificar = async () => {
    if (codigoVerificar) {
      const result = await verificarCertificado(codigoVerificar);
      setResultadoVerificacion(result);
    }
  };

  const handleGenerar = async () => {
    if (sesionId) {
      await generarParaSesion(sesionId);
      setShowGenerarModal(false);
      setSesionId('');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar este certificado?')) {
      await deleteCertificado(id);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total || 0}</p>
                  <p className="text-sm text-gray-500">Total Certificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.esteAnio || 0}</p>
                  <p className="text-sm text-gray-500">Este Anio</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.personalCertificado || 0}</p>
                  <p className="text-sm text-gray-500">Personal con Certificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FileText className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.capacitaciones || 0}</p>
                  <p className="text-sm text-gray-500">Capacitaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o codigo..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && loadCertificados()}
            />
          </div>
          <Select value={filters.anio || '_all'} onValueChange={(v) => setFilters({ ...filters, anio: v === '_all' ? '' : v })}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Anio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadCertificados()}>
            Buscar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowVerificar(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            Verificar
          </Button>
          <Button onClick={() => setShowGenerarModal(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Generar
          </Button>
        </div>
      </div>

      {/* Lista de Certificados */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : certificados.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay certificados registrados
            </CardContent>
          </Card>
        ) : (
          certificados.map((cert) => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{cert.personal?.nombreCompleto}</h3>
                      <p className="text-sm text-gray-500">{cert.temaCapacitacion}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span className="font-mono">{cert.numeroCertificado}</span>
                        <span>|</span>
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(cert.fechaEmision).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-mono text-xs">
                      {cert.horasCapacitacion}h
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleViewDetail(cert.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`/api/calidad2/certificados/${cert.id}/pdf`} target="_blank">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => handleDelete(cert.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Detalle */}
      <Dialog open={showDetail} onOpenChange={(open) => { setShowDetail(open); if (!open) clearCurrentCertificado(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Certificado de Capacitacion
            </DialogTitle>
          </DialogHeader>
          {currentCertificado && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-b from-purple-50 to-white border rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Certifica que</p>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {currentCertificado.personal?.nombreCompleto}
                </h2>
                <p className="text-sm text-gray-500 mb-2">ha completado satisfactoriamente el curso de</p>
                <h3 className="text-lg font-semibold text-purple-700 mb-4">
                  {currentCertificado.temaCapacitacion}
                </h3>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <span>{currentCertificado.horasCapacitacion} horas</span>
                  <span>|</span>
                  <span>{new Date(currentCertificado.fechaEmision).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Numero:</span>
                  <span className="ml-2 font-mono">{currentCertificado.numeroCertificado}</span>
                </div>
                <div>
                  <span className="text-gray-500">Codigo verificacion:</span>
                  <span className="ml-2 font-mono text-xs">{currentCertificado.codigoVerificacion}</span>
                </div>
              </div>

              <div className="flex justify-center">
                <Button asChild>
                  <a href={`/api/calidad2/certificados/${currentCertificado.id}/pdf`} target="_blank">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Verificar */}
      <Dialog open={showVerificar} onOpenChange={(open) => {
        setShowVerificar(open);
        if (!open) {
          setCodigoVerificar('');
          setResultadoVerificacion(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Certificado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Codigo de Verificacion</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={codigoVerificar}
                  onChange={(e) => setCodigoVerificar(e.target.value)}
                  placeholder="Ingrese el codigo del certificado"
                  className="font-mono"
                />
                <Button onClick={handleVerificar} disabled={!codigoVerificar}>
                  Verificar
                </Button>
              </div>
            </div>

            {resultadoVerificacion && (
              <div className={`p-4 rounded-lg ${resultadoVerificacion.valido ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {resultadoVerificacion.valido ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${resultadoVerificacion.valido ? 'text-green-800' : 'text-red-800'}`}>
                    {resultadoVerificacion.valido ? 'Certificado Valido' : 'Certificado No Valido'}
                  </span>
                </div>
                {resultadoVerificacion.valido && resultadoVerificacion.certificado && (
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-500">Nombre:</span> {resultadoVerificacion.certificado.nombreCompleto}</p>
                    <p><span className="text-gray-500">Capacitacion:</span> {resultadoVerificacion.certificado.tema}</p>
                    <p><span className="text-gray-500">Fecha:</span> {new Date(resultadoVerificacion.certificado.fecha).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Generar */}
      <Dialog open={showGenerarModal} onOpenChange={setShowGenerarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Certificados</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Ingrese el ID de la sesion de capacitacion para generar certificados
              automaticamente para todos los asistentes que aprobaron.
            </p>
            <div>
              <Label>ID de Sesion</Label>
              <Input
                value={sesionId}
                onChange={(e) => setSesionId(e.target.value)}
                placeholder="UUID de la sesion"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerar} disabled={!sesionId}>
              Generar Certificados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
