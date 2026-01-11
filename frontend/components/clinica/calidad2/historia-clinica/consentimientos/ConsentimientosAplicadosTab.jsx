'use client';

import { useState, useEffect } from 'react';
import { useCalidad2ConsentimientosHC } from '@/hooks/useCalidad2ConsentimientosHC';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileSignature,
  Plus,
  Search,
  User,
  Calendar,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AplicarConsentimientoModal from './AplicarConsentimientoModal';

export default function ConsentimientosAplicadosTab() {
  const {
    aplicados,
    loading,
    pagination,
    loadAplicados,
  } = useCalidad2ConsentimientosHC();

  const [showAplicarModal, setShowAplicarModal] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  // Cargar aplicados al montar y cuando cambien filtros
  useEffect(() => {
    loadAplicados(filters);
  }, [filters]);

  const handleSearch = (value) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleAplicarNuevo = () => {
    setShowAplicarModal(true);
  };

  const handleModalClose = () => {
    setShowAplicarModal(false);
    loadAplicados(filters);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Consentimientos Aplicados</span>
            <Button onClick={handleAplicarNuevo} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Aplicar Consentimiento
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Buscador */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por paciente, tipo de consentimiento..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de aplicados */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Cargando consentimientos...</p>
            </div>
          ) : aplicados.length === 0 ? (
            <div className="text-center py-8">
              <FileSignature className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No hay consentimientos aplicados</p>
              <Button onClick={handleAplicarNuevo} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Aplicar Primer Consentimiento
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {aplicados.map((aplicado) => (
                  <Card key={aplicado.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Información del consentimiento */}
                        <div className="md:col-span-5">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileSignature className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm line-clamp-2">
                                {aplicado.tipo?.nombre || 'Sin tipo'}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Código: {aplicado.tipo?.codigo || 'N/A'}
                              </p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {aplicado.tipo?.servicio || 'Sin servicio'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Información del paciente */}
                        <div className="md:col-span-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">
                                {aplicado.paciente?.nombre} {aplicado.paciente?.apellido}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 pl-6">
                              Doc: {aplicado.paciente?.documentoIdentidad || 'N/A'}
                            </p>
                            <div className="flex items-center gap-2 text-sm pl-6">
                              <span className="text-gray-500">Médico:</span>
                              <span className="text-xs">
                                {aplicado.medico?.nombre} {aplicado.medico?.apellido}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Firmas y fecha */}
                        <div className="md:col-span-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(aplicado.fechaAplicacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </div>

                            {/* Indicadores de firmas */}
                            <div className="flex flex-wrap gap-1">
                              {aplicado.firmaPaciente && (
                                <Badge variant="default" className="text-xs bg-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Paciente
                                </Badge>
                              )}
                              {aplicado.firmaTestigo && (
                                <Badge variant="default" className="text-xs bg-blue-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Testigo
                                </Badge>
                              )}
                              {aplicado.firmaFamiliar && (
                                <Badge variant="default" className="text-xs bg-purple-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Familiar
                                </Badge>
                              )}
                              {aplicado.firmaMedico && (
                                <Badge variant="default" className="text-xs bg-orange-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Médico
                                </Badge>
                              )}
                            </div>

                            {aplicado.lugarAplicacion && (
                              <p className="text-xs text-gray-500">
                                Lugar: {aplicado.lugarAplicacion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Observaciones si existen */}
                      {aplicado.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500">Observaciones:</p>
                          <p className="text-sm line-clamp-2 mt-1">{aplicado.observaciones}</p>
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        <Button size="sm" variant="outline">
                          <FileText className="h-3 w-3 mr-1" />
                          Ver Detalle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} -{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} consentimientos
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

      {/* Modal para aplicar consentimiento */}
      {showAplicarModal && (
        <AplicarConsentimientoModal onClose={handleModalClose} />
      )}
    </div>
  );
}
