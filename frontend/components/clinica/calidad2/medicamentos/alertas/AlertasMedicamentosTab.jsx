'use client';

import { useState, useEffect } from 'react';
import { Bell, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCalidad2AlertasMedicamentos } from '@/hooks/useCalidad2AlertasMedicamentos';
import AlertaCard from './AlertaCard';

const TIPOS = [
  { value: 'VENCIMIENTO_MEDICAMENTO', label: 'Vencimiento', icon: '📅' },
  { value: 'STOCK_BAJO', label: 'Stock Bajo', icon: '📉' },
  { value: 'TEMPERATURA_FUERA_RANGO', label: 'Temperatura', icon: '🌡️' },
  { value: 'HUMEDAD_FUERA_RANGO', label: 'Humedad', icon: '💧' },
  { value: 'REPORTE_PENDIENTE_INVIMA', label: 'INVIMA Pendiente', icon: '📋' },
];

const PRIORIDADES = [
  { value: 'CRITICA', label: 'Crítica', color: 'text-red-600' },
  { value: 'ALTA', label: 'Alta', color: 'text-orange-600' },
  { value: 'MEDIA', label: 'Media', color: 'text-yellow-600' },
  { value: 'BAJA', label: 'Baja', color: 'text-blue-600' },
];

export default function AlertasMedicamentosTab({ user }) {
  const {
    alertas,
    estadisticas,
    loading,
    loadAlertas,
    marcarAtendida,
    generarAlertas,
    getEstadisticas,
  } = useCalidad2AlertasMedicamentos();

  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [prioridadFilter, setPrioridadFilter] = useState('TODOS');
  const [atendidaFilter, setAtendidaFilter] = useState('false'); // Default to unattended
  const [generatingAlerts, setGeneratingAlerts] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [tipoFilter, prioridadFilter, atendidaFilter]);

  const loadData = async () => {
    const filters = {};
    if (tipoFilter && tipoFilter !== 'TODOS') filters.tipo = tipoFilter;
    if (prioridadFilter && prioridadFilter !== 'TODOS') filters.prioridad = prioridadFilter;
    if (atendidaFilter !== 'TODAS') filters.atendida = atendidaFilter;

    await Promise.all([
      loadAlertas(filters),
      getEstadisticas(),
    ]);
  };

  const handleGenerarAlertas = async () => {
    setGeneratingAlerts(true);
    await generarAlertas();
    setGeneratingAlerts(false);
    await loadData();
  };

  const handleMarcarAtendida = async (id, observaciones) => {
    await marcarAtendida(id, observaciones);
    await loadData();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                Alertas Automáticas
              </h3>
              <p className="text-sm text-amber-700">
                Sistema centralizado de alertas para vencimientos, stock bajo, y condiciones ambientales
              </p>
            </div>
            <Button
              onClick={handleGenerarAlertas}
              disabled={generatingAlerts}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generatingAlerts ? 'animate-spin' : ''}`} />
              Generar Ahora
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Total Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <span className="text-3xl font-bold text-gray-900">
                  {estadisticas.totalActivas || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-red-700">Críticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl">🔴</span>
                <span className="text-3xl font-bold text-red-700">
                  {estadisticas.criticas || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {estadisticas.porTipo && Object.entries(estadisticas.porTipo).slice(0, 3).map(([tipo, count]) => (
                  <div key={tipo} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      {TIPOS.find(t => t.value === tipo)?.icon || '⚠️'} {TIPOS.find(t => t.value === tipo)?.label || tipo}
                    </span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Por Prioridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {estadisticas.porPrioridad && Object.entries(estadisticas.porPrioridad).map(([prioridad, count]) => (
                  <div key={prioridad} className="flex items-center justify-between text-xs">
                    <span className={PRIORIDADES.find(p => p.value === prioridad)?.color || 'text-gray-600'}>
                      {PRIORIDADES.find(p => p.value === prioridad)?.label || prioridad}
                    </span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">Filtrar Alertas</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los tipos</SelectItem>
                  {TIPOS.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.icon} {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas</SelectItem>
                  {PRIORIDADES.map(prioridad => (
                    <SelectItem key={prioridad.value} value={prioridad.value}>
                      {prioridad.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={atendidaFilter} onValueChange={setAtendidaFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  <SelectItem value="false">Sin Atender</SelectItem>
                  <SelectItem value="true">Atendidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : alertas.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 font-medium">
                {tipoFilter || prioridadFilter || atendidaFilter
                  ? 'No se encontraron alertas con los filtros aplicados'
                  : 'No hay alertas registradas'}
              </p>
              {!(tipoFilter || prioridadFilter || atendidaFilter) && (
                <Button onClick={handleGenerarAlertas} className="mt-4" disabled={generatingAlerts}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${generatingAlerts ? 'animate-spin' : ''}`} />
                  Generar Alertas
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alertas.map((alerta) => (
                <AlertaCard
                  key={alerta.id}
                  alerta={alerta}
                  onMarcarAtendida={handleMarcarAtendida}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">Generación Automática de Alertas</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Las alertas se generan automáticamente todos los días a las 6:00 AM</li>
                <li>• Incluyen: vencimientos (30/60/90 días), stock bajo, temperatura/humedad fuera de rango</li>
                <li>• También puedes generar alertas manualmente usando el botón "Generar Ahora"</li>
                <li>• Las alertas críticas requieren atención inmediata</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
