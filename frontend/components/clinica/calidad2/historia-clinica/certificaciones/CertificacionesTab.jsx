'use client';

import { useState, useEffect } from 'react';
import { useCalidad2CertificacionesHC } from '@/hooks/useCalidad2CertificacionesHC';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileCheck,
  FileX,
  Clock,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import CertificacionCard from './CertificacionCard';
import CertificacionForm from './CertificacionForm';

export default function CertificacionesTab() {
  const {
    certificaciones,
    stats,
    loading,
    pagination,
    loadCertificaciones,
    loadStats,
    checkAlerts,
    createCertificacion,
    updateCertificacion,
    deleteCertificacion,
  } = useCalidad2CertificacionesHC();

  const [showForm, setShowForm] = useState(false);
  const [selectedCertificacion, setSelectedCertificacion] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    tipo: 'all',
    estado: 'all',
    search: '',
  });

  // Cargar datos iniciales
  useEffect(() => {
    const cleanFilters = { ...filters };
    if (cleanFilters.tipo === 'all') delete cleanFilters.tipo;
    if (cleanFilters.estado === 'all') delete cleanFilters.estado;
    loadCertificaciones(cleanFilters);
    loadStats();
  }, [filters]);

  // Handlers
  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleCreateNew = () => {
    setSelectedCertificacion(null);
    setShowForm(true);
  };

  const handleEdit = (certificacion) => {
    setSelectedCertificacion(certificacion);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta certificación?')) {
      const success = await deleteCertificacion(id);
      if (success) {
        loadCertificaciones(filters);
        loadStats();
      }
    }
  };

  const handleSubmit = async (data) => {
    const success = selectedCertificacion
      ? await updateCertificacion(selectedCertificacion.id, data)
      : await createCertificacion(data);

    if (success) {
      setShowForm(false);
      setSelectedCertificacion(null);
      loadCertificaciones(filters);
      loadStats();
    }
  };

  const handleCheckAlerts = async () => {
    await checkAlerts();
    loadCertificaciones(filters);
    loadStats();
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  // Stats cards
  const statsCards = [
    {
      title: 'Total Certificaciones',
      value: stats?.total || 0,
      icon: FileCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Vigentes',
      value: stats?.vigentes || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'En Renovación',
      value: stats?.enRenovacion || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Vencidas',
      value: stats?.vencidas || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Vencen en 30 días',
      value: stats?.proximasVencer30 || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Vencen en 60 días',
      value: stats?.proximasVencer60 || 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros y acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Certificaciones de Historia Clínica</span>
            <div className="flex gap-2">
              <Button
                onClick={handleCheckAlerts}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Alertas
              </Button>
              <Button onClick={handleCreateNew} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Certificación
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Buscador */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, entidad emisora o número de registro..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            {/* Filtro por tipo */}
            <Select
              value={filters.tipo}
              onValueChange={(value) => handleFilterChange('tipo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="SOFTWARE_HC">Software HC</SelectItem>
                <SelectItem value="HABILITACION">Habilitación</SelectItem>
                <SelectItem value="ACREDITACION">Acreditación</SelectItem>
                <SelectItem value="ISO">Certificación ISO</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por estado */}
            <Select
              value={filters.estado}
              onValueChange={(value) => handleFilterChange('estado', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="VIGENTE">Vigente</SelectItem>
                <SelectItem value="EN_RENOVACION">En Renovación</SelectItem>
                <SelectItem value="VENCIDA">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resultado del filtro */}
          {filters.search || (filters.tipo !== 'all') || (filters.estado !== 'all') ? (
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary">
                {pagination.total} resultado{pagination.total !== 1 ? 's' : ''}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ page: 1, limit: 12, tipo: '', estado: '', search: '' })}
              >
                Limpiar filtros
              </Button>
            </div>
          ) : null}

          {/* Grid de certificaciones */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Cargando certificaciones...</p>
            </div>
          ) : certificaciones.length === 0 ? (
            <div className="text-center py-8">
              <FileX className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No se encontraron certificaciones</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificaciones.map((cert) => (
                  <CertificacionCard
                    key={cert.id}
                    certificacion={cert}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} -{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} certificaciones
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === pagination.totalPages ||
                            Math.abs(page - pagination.page) <= 1
                        )
                        .map((page, index, array) => (
                          <div key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2">...</span>
                            )}
                            <Button
                              variant={page === pagination.page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      {showForm && (
        <CertificacionForm
          certificacion={selectedCertificacion}
          onClose={() => {
            setShowForm(false);
            setSelectedCertificacion(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
