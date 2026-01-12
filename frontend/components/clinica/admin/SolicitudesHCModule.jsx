'use client';

import React, { useState, useEffect } from 'react';
import { apiGet, apiPut } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Eye, FileText, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Package } from 'lucide-react';
import { toast } from "sonner";

const estadoConfig = {
  'Pendiente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  'En Proceso': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: AlertCircle },
  'Lista': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  'Entregada': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package },
  'Rechazada': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

export default function SolicitudesHCModule({ user }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({
    pendientes: 0,
    enProceso: 0,
    listas: 0,
    entregadas: 0,
    rechazadas: 0,
    total: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState({
    estado: '',
    notas: '',
    archivoUrl: '',
  });

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [pagination.page, estadoFilter, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(estadoFilter && { estado: estadoFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await apiGet(`/solicitudes-hc?${params}`);

      if (response.success) {
        setSolicitudes(response.data || []);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiGet('/solicitudes-hc/stats');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewSolicitud = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setFormData({
      estado: solicitud.estado,
      notas: solicitud.notas || '',
      archivoUrl: solicitud.archivoUrl || '',
    });
    setShowModal(true);
  };

  const handleUpdateEstado = async () => {
    if (!selectedSolicitud) return;

    setUpdating(true);
    try {
      const response = await apiPut(`/solicitudes-hc/${selectedSolicitud.id}/estado`, formData);

      if (response.success) {
        toast.success('Solicitud actualizada correctamente');
        setShowModal(false);
        fetchData();
        fetchStats();
      } else {
        toast.error(response.message || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error updating solicitud:', error);
      toast.error('Error al actualizar la solicitud');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Historia Clinica</h1>
          <p className="text-gray-500">Gestiona las solicitudes de historias clinicas de los pacientes</p>
        </div>
        <Button onClick={() => { fetchData(); fetchStats(); }} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Pendientes" value={stats.pendientes} icon={Clock} color="text-yellow-600" />
        <StatCard title="En Proceso" value={stats.enProceso} icon={AlertCircle} color="text-blue-600" />
        <StatCard title="Listas" value={stats.listas} icon={CheckCircle} color="text-green-600" />
        <StatCard title="Entregadas" value={stats.entregadas} icon={Package} color="text-purple-600" />
        <StatCard title="Rechazadas" value={stats.rechazadas} icon={XCircle} color="text-red-600" />
        <StatCard title="Total" value={stats.total} icon={FileText} color="text-gray-600" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, apellido o cedula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                <SelectItem value="LISTA">Lista</SelectItem>
                <SelectItem value="ENTREGADA">Entregada</SelectItem>
                <SelectItem value="RECHAZADA">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay solicitudes de historia clinica</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Procesado Por</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitudes.map((solicitud) => {
                  const config = estadoConfig[solicitud.estado] || estadoConfig['Pendiente'];
                  const StatusIcon = config.icon;

                  return (
                    <TableRow key={solicitud.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{solicitud.paciente?.nombreCompleto}</p>
                          <p className="text-sm text-gray-500">{solicitud.paciente?.cedula}</p>
                          <p className="text-xs text-gray-400">{solicitud.paciente?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {solicitud.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {solicitud.motivo || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.color} gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {solicitud.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(solicitud.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {solicitud.procesadoPor || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSolicitud(solicitud)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {solicitudes.length} de {pagination.total} solicitudes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Detail/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalle de Solicitud
            </DialogTitle>
          </DialogHeader>

          {selectedSolicitud && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Informacion del Paciente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Nombre</p>
                    <p className="font-medium">{selectedSolicitud.paciente?.nombreCompleto}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cedula</p>
                    <p className="font-medium">{selectedSolicitud.paciente?.cedula}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{selectedSolicitud.paciente?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Telefono</p>
                    <p className="font-medium">{selectedSolicitud.paciente?.telefono || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Request Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Informacion de la Solicitud</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Tipo</p>
                    <p className="font-medium capitalize">{selectedSolicitud.tipo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Periodo</p>
                    <p className="font-medium">{selectedSolicitud.periodo || 'Historia completa'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Motivo</p>
                    <p className="font-medium">{selectedSolicitud.motivo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fecha de Solicitud</p>
                    <p className="font-medium">{formatDate(selectedSolicitud.createdAt)}</p>
                  </div>
                  {selectedSolicitud.fechaProcesado && (
                    <div>
                      <p className="text-gray-500">Fecha Procesado</p>
                      <p className="font-medium">{formatDate(selectedSolicitud.fechaProcesado)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Update Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="En Proceso">En Proceso</SelectItem>
                      <SelectItem value="Lista">Lista</SelectItem>
                      <SelectItem value="Entregada">Entregada</SelectItem>
                      <SelectItem value="Rechazada">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Archivo (opcional)
                  </label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={formData.archivoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, archivoUrl: e.target.value }))}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Link al archivo de la historia clinica (Google Drive, OneDrive, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas internas
                  </label>
                  <Textarea
                    placeholder="Notas sobre el procesamiento de la solicitud..."
                    value={formData.notas}
                    onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateEstado} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700">
              {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
