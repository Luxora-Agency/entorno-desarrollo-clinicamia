'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useInfraestructuraIndicadores } from '@/hooks/useInfraestructuraIndicadores';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MedicionFormModal from './MedicionFormModal';
import IndicadorCard from './IndicadorCard';

export default function IndicadoresTab({ user }) {
  const fechaActual = new Date();
  const [anioSeleccionado, setAnioSeleccionado] = useState(fechaActual.getFullYear());
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // TODOS, CUMPLE, NO_CUMPLE
  const [filtroDominio, setFiltroDominio] = useState('TODOS'); // TODOS, AMBIENTAL, SEGURIDAD
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // TODOS, AUTOMATICO, MANUAL
  const [isMedicionModalOpen, setIsMedicionModalOpen] = useState(false);
  const [indicadorSeleccionado, setIndicadorSeleccionado] = useState(null);

  const {
    dashboard,
    loading,
    loadDashboard,
    calcularIndicadores,
    recalcularAnio,
  } = useInfraestructuraIndicadores();

  useEffect(() => {
    loadData();
  }, [anioSeleccionado]);

  const loadData = async () => {
    await loadDashboard(anioSeleccionado);
  };

  const handleCalcularMesActual = async () => {
    const mesActual = fechaActual.getMonth() + 1;
    const anioActual = fechaActual.getFullYear();

    if (window.confirm(`¿Calcular indicadores automáticos para ${mesActual}/${anioActual}?`)) {
      await calcularIndicadores(mesActual, anioActual);
      loadData();
    }
  };

  const handleRecalcularAnio = async () => {
    if (window.confirm(`¿Recalcular todos los meses del año ${anioSeleccionado}?`)) {
      await recalcularAnio(anioSeleccionado);
      loadData();
    }
  };

  const handleAgregarMedicion = (indicador) => {
    setIndicadorSeleccionado(indicador);
    setIsMedicionModalOpen(true);
  };

  const handleCloseMedicionModal = () => {
    setIsMedicionModalOpen(false);
    setIndicadorSeleccionado(null);
    loadData();
  };

  // Filtrar indicadores
  const indicadoresFiltrados = dashboard?.indicadores?.filter(item => {
    if (filtroEstado !== 'TODOS') {
      if (filtroEstado === 'CUMPLE' && item.meta.cumple !== true) return false;
      if (filtroEstado === 'NO_CUMPLE' && item.meta.cumple !== false) return false;
    }

    if (filtroDominio !== 'TODOS' && item.indicador.dominio !== filtroDominio) return false;
    if (filtroTipo !== 'TODOS' && item.indicador.tipoCalculo !== filtroTipo) return false;

    return true;
  }) || [];

  // Años disponibles
  const aniosDisponibles = Array.from(
    { length: 5 },
    (_, i) => fechaActual.getFullYear() - 2 + i
  ).reverse();

  // Preparar datos para gráfica general (tendencia global)
  const datosGraficaGlobal = dashboard?.indicadores
    ?.filter(i => i.serieHistorica.length > 0)
    ?.flatMap(item =>
      item.serieHistorica.map(punto => ({
        periodo: punto.periodo,
        [item.indicador.codigo]: punto.valor,
        indicador: item.indicador.nombre,
      }))
    ) || [];

  // Agrupar por periodo para la gráfica
  const datosAgrupadosPorPeriodo = datosGraficaGlobal.reduce((acc, item) => {
    const existing = acc.find(x => x.periodo === item.periodo);
    if (existing) {
      Object.assign(existing, item);
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Indicadores PGIRASA
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                7 indicadores principales con cálculo automático
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filtros */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <Select value={filtroDominio} onValueChange={setFiltroDominio}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="AMBIENTAL">Ambiental</SelectItem>
                    <SelectItem value="SEGURIDAD">Seguridad</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="AUTOMATICO">Automáticos</SelectItem>
                    <SelectItem value="MANUAL">Manuales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de año */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <Select
                  value={String(anioSeleccionado)}
                  onValueChange={(val) => setAnioSeleccionado(parseInt(val))}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aniosDisponibles.map((anio) => (
                      <SelectItem key={anio} value={String(anio)}>
                        {anio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botones de acción */}
              <Button onClick={handleCalcularMesActual} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Calcular Mes Actual
              </Button>

              <Button onClick={handleRecalcularAnio} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recalcular Año
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard de resumen */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {dashboard.totalIndicadores}
                </div>
                <div className="text-xs text-gray-600 mt-1">Total Indicadores</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {dashboard.cumpleMetas}
                </div>
                <div className="text-xs text-gray-600 mt-1">Cumplen Meta</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {dashboard.noCumpleMetas}
                </div>
                <div className="text-xs text-gray-600 mt-1">No Cumplen</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {(Number(dashboard.porcentajeCumplimiento) || 0).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 mt-1">% Cumplimiento Global</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfica de tendencias globales */}
      {datosAgrupadosPorPeriodo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendencias Mensuales {anioSeleccionado}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datosAgrupadosPorPeriodo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {dashboard?.indicadores?.slice(0, 5).map((item, index) => {
                  const colores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                  return (
                    <Line
                      key={item.indicador.codigo}
                      type="monotone"
                      dataKey={item.indicador.codigo}
                      name={item.indicador.nombre}
                      stroke={colores[index]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista de indicadores */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Indicadores Detallados ({indicadoresFiltrados.length})
          </h3>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
              {dashboard?.cumpleMetas || 0} Cumplen
            </Badge>
            <Badge variant="outline" className="text-xs">
              <XCircle className="w-3 h-3 mr-1 text-red-600" />
              {dashboard?.noCumpleMetas || 0} No cumplen
            </Badge>
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Cargando indicadores...
              </CardContent>
            </Card>
          ) : indicadoresFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No hay indicadores que coincidan con los filtros
              </CardContent>
            </Card>
          ) : (
            indicadoresFiltrados.map((item) => (
              <IndicadorCard
                key={item.indicador.id}
                item={item}
                onAgregarMedicion={() => handleAgregarMedicion(item.indicador)}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal de medición */}
      {isMedicionModalOpen && indicadorSeleccionado && (
        <MedicionFormModal
          indicador={indicadorSeleccionado}
          isOpen={isMedicionModalOpen}
          onClose={handleCloseMedicionModal}
        />
      )}
    </div>
  );
}
