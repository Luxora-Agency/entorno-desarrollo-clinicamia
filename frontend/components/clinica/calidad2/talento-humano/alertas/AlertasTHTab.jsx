'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Calendar, CheckCircle, Clock, Shield, FileText, Stethoscope, Award, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCalidad2AlertasTH } from '@/hooks/useCalidad2AlertasTH';

const TIPO_CONFIG = {
  VACUNAS: { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Vacunas' },
  POLIZA_RC: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Poliza RC' },
  RETHUS: { icon: Stethoscope, color: 'text-green-600', bg: 'bg-green-100', label: 'ReTHUS' },
  CONTRATO: { icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Contrato' },
  EXAMEN_OCUPACIONAL: { icon: Stethoscope, color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Examen Ocupacional' },
  CAPACITACION: { icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Capacitacion' },
  DOCUMENTO: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Documento' },
};

const PRIORIDAD_COLORS = {
  ALTA: 'bg-red-100 text-red-800 border-red-200',
  MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  BAJA: 'bg-green-100 text-green-800 border-green-200',
};

export default function AlertasTHTab({ user }) {
  const {
    alertas,
    dashboard,
    pagination,
    loading,
    filters,
    setFilters,
    setPagination,
    loadAlertas,
    loadDashboard,
    atenderAlerta,
    generarAlertas,
  } = useCalidad2AlertasTH();

  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    loadAlertas();
    loadDashboard();
  }, []);

  const handleGenerar = async () => {
    setGenerando(true);
    await generarAlertas();
    setGenerando(false);
  };

  const handleAtender = async (id) => {
    await atenderAlerta(id);
  };

  const getDiasRestantes = (fecha) => {
    const hoy = new Date();
    const vence = new Date(fecha);
    const diff = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{dashboard.criticas || 0}</p>
                  <p className="text-sm text-gray-500">Alertas Criticas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{dashboard.proximas || 0}</p>
                  <p className="text-sm text-gray-500">Proximas a Vencer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboard.pendientes || 0}</p>
                  <p className="text-sm text-gray-500">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{dashboard.atendidas || 0}</p>
                  <p className="text-sm text-gray-500">Atendidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Por Tipo */}
      {dashboard?.porTipo && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Alertas por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(dashboard.porTipo).map(([tipo, count]) => {
                const config = TIPO_CONFIG[tipo] || TIPO_CONFIG.DOCUMENTO;
                const Icon = config.icon;
                return (
                  <div key={tipo} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-sm font-medium">{config.label}</span>
                    <Badge variant="secondary" className="ml-1">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filters.tipo || '_all'} onValueChange={(v) => { const val = v === '_all' ? '' : v; setFilters({ ...filters, tipo: val }); loadAlertas({ tipo: val }); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los tipos</SelectItem>
              {Object.entries(TIPO_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.atendida || '_all'} onValueChange={(v) => { const val = v === '_all' ? '' : v; setFilters({ ...filters, atendida: val }); loadAlertas({ atendida: val }); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas</SelectItem>
              <SelectItem value="false">Pendientes</SelectItem>
              <SelectItem value="true">Atendidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleGenerar} disabled={generando}>
          <RefreshCw className={`w-4 h-4 mr-2 ${generando ? 'animate-spin' : ''}`} />
          Generar Alertas
        </Button>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : alertas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay alertas pendientes</p>
            </CardContent>
          </Card>
        ) : (
          alertas.map((alerta) => {
            const config = TIPO_CONFIG[alerta.tipo] || TIPO_CONFIG.DOCUMENTO;
            const Icon = config.icon;
            const dias = getDiasRestantes(alerta.fechaVence);

            return (
              <Card
                key={alerta.id}
                className={`hover:shadow-md transition-shadow ${alerta.atendida ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{alerta.personal?.nombreCompleto || 'Personal'}</h3>
                          <Badge className={PRIORIDAD_COLORS[alerta.prioridad]}>
                            {alerta.prioridad}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{alerta.mensaje}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className={`px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Vence: {new Date(alerta.fechaVence).toLocaleDateString()}
                          </span>
                          {dias <= 0 ? (
                            <span className="text-red-600 font-medium">Vencido hace {Math.abs(dias)} dias</span>
                          ) : dias <= 7 ? (
                            <span className="text-red-600 font-medium">{dias} dias restantes</span>
                          ) : dias <= 30 ? (
                            <span className="text-yellow-600">{dias} dias restantes</span>
                          ) : (
                            <span className="text-green-600">{dias} dias restantes</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alerta.atendida ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Atendida
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleAtender(alerta.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Marcar Atendida
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => { setPagination({ ...pagination, page: pagination.page - 1 }); loadAlertas(); }}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500">
            Pagina {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => { setPagination({ ...pagination, page: pagination.page + 1 }); loadAlertas(); }}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
