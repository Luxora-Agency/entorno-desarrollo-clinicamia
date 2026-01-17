'use client';

import { useEffect } from 'react';
import {
  Package, AlertTriangle, Pill, FileText,
  Thermometer, Bell, TrendingUp, Activity, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCalidad2DashboardMedicamentos } from '@/hooks/useCalidad2DashboardMedicamentos';
import { exportDashboardToExcel } from '@/utils/medicamentosExport';
import ReactECharts from 'echarts-for-react';

export default function DashboardGeneralMedicamentos({ user }) {
  const {
    resumenGeneral,
    loading,
    loadResumenGeneral,
    reportesMensuales,
    loadReportesMensuales,
  } = useCalidad2DashboardMedicamentos();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadResumenGeneral(),
      loadReportesMensuales(new Date().getFullYear()),
    ]);
  };

  if (loading && !resumenGeneral) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!resumenGeneral) return null;

  const { inventario, farmacovigilancia, tecnovigilancia, alertas, temperatura, formatos, protocolos } = resumenGeneral;

  // Chart: Monthly Reports Trend
  const monthlyReportsChartOption = reportesMensuales ? {
    title: { text: 'Reportes Mensuales ' + reportesMensuales.anio, left: 'center', top: 10 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['Farmacovigilancia', 'Tecnovigilancia'], bottom: 10 },
    xAxis: {
      type: 'category',
      data: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Farmacovigilancia',
        type: 'line',
        data: reportesMensuales.farmacovigilancia.map(m => m.count),
        smooth: true,
        itemStyle: { color: '#f97316' },
      },
      {
        name: 'Tecnovigilancia',
        type: 'line',
        data: reportesMensuales.tecnovigilancia.map(m => m.count),
        smooth: true,
        itemStyle: { color: '#3b82f6' },
      },
    ],
  } : null;

  // Chart: Inventory Distribution
  const inventoryDistributionOption = inventario ? {
    title: { text: 'Distribución de Inventario', left: 'center', top: 10 },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', bottom: 10 },
    series: [
      {
        name: 'Tipo',
        type: 'pie',
        radius: '60%',
        data: [
          { value: inventario.totales.medicamentos, name: 'Medicamentos' },
          { value: inventario.totales.dispositivos, name: 'Dispositivos' },
          { value: inventario.totales.insumos, name: 'Insumos' },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  } : null;

  // Chart: Alerts Distribution
  const alertsDistributionOption = alertas?.distribucion?.porPrioridad ? {
    title: { text: 'Distribución de Alertas Activas', left: 'center', top: 10 },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, bottom: 10 },
    series: [
      {
        name: 'Prioridad',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        data: Object.entries(alertas.distribucion.porPrioridad).map(([key, value]) => ({
          value,
          name: key,
          itemStyle: {
            color:
              key === 'CRITICA' ? '#dc2626' :
              key === 'ALTA' ? '#f97316' :
              key === 'MEDIA' ? '#eab308' :
              '#3b82f6',
          },
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Dashboard General - Medicamentos</h1>
              <p className="text-blue-100 text-sm mt-1">
                Vista consolidada de todos los módulos de Medicamentos, Dispositivos e Insumos
              </p>
            </div>
          </div>
          <Button
            onClick={() => resumenGeneral && exportDashboardToExcel(resumenGeneral)}
            disabled={!resumenGeneral}
            variant="outline"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar a Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards Row 1 - Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {inventario?.totales?.total || 0}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {inventario?.totales?.medicamentos || 0} medicamentos,{' '}
              {inventario?.totales?.dispositivos || 0} dispositivos
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Próximos a Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {inventario?.alertas?.proximosVencer30 || 0}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              En los próximos 30 días
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">
              {inventario?.alertas?.stockBajo || 0}
            </div>
            <p className="text-xs text-red-600 mt-1">
              Bajo stock mínimo
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-300 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {inventario?.alertas?.vencidos || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Row 2 - Vigilance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Farmacovigilancia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {farmacovigilancia?.totales?.total || 0}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {farmacovigilancia?.totales?.mes || 0} este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-indigo-700 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Tecnovigilancia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">
              {tecnovigilancia?.totales?.total || 0}
            </div>
            <p className="text-xs text-indigo-600 mt-1">
              {tecnovigilancia?.totales?.mes || 0} este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {alertas?.totales?.activas || 0}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              {alertas?.totales?.criticas || 0} críticas
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-200 bg-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-cyan-700 flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Temperatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-900">
              {temperatura?.totales?.fueraDeRango || 0}
            </div>
            <p className="text-xs text-cyan-600 mt-1">
              Fuera de rango
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Row 3 - Documents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Protocolos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {protocolos?.totales?.total || 0}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {protocolos?.totales?.vigentes || 0} vigentes
            </p>
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-teal-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-teal-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Formatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-900">
              {formatos?.totales?.formatos || 0}
            </div>
            <p className="text-xs text-teal-600 mt-1">
              {formatos?.totales?.instancias || 0} instancias
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-yellow-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Pendientes INVIMA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">
              {(farmacovigilancia?.totales?.pendientesINVIMA || 0) + (tecnovigilancia?.totales?.pendientesINVIMA || 0)}
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Reportes pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Reports Trend */}
        {monthlyReportsChartOption && (
          <Card>
            <CardContent className="pt-6">
              <ReactECharts option={monthlyReportsChartOption} style={{ height: '350px' }} />
            </CardContent>
          </Card>
        )}

        {/* Inventory Distribution */}
        {inventoryDistributionOption && (
          <Card>
            <CardContent className="pt-6">
              <ReactECharts option={inventoryDistributionOption} style={{ height: '350px' }} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alerts Distribution */}
      {alertsDistributionOption && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardContent className="pt-6">
              <ReactECharts option={alertsDistributionOption} style={{ height: '350px' }} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Items Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expiring Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Top 10 Próximos a Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inventario?.top?.proximosVencer && inventario.top.proximosVencer.length > 0 ? (
              <div className="space-y-2">
                {inventario.top.proximosVencer.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {index + 1}. {item.nombre}
                      </p>
                      <p className="text-xs text-gray-600">
                        Lote: {item.lote} • {item.cantidadActual} {item.unidadMedida}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-xs font-semibold text-orange-600">
                        {new Date(item.fechaVencimiento).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay items próximos a vencer
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-red-600" />
              Top 10 Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inventario?.top?.itemsStockBajo && inventario.top.itemsStockBajo.length > 0 ? (
              <div className="space-y-2">
                {inventario.top.itemsStockBajo.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {index + 1}. {item.nombre}
                      </p>
                      <p className="text-xs text-gray-600">
                        Mínimo: {item.stockMinimo} {item.unidadMedida}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-xs font-semibold text-red-600">
                        {item.cantidadActual} {item.unidadMedida}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay items con stock bajo
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">Dashboard General</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Vista consolidada de todos los módulos de Medicamentos</li>
                <li>• Las estadísticas se actualizan en tiempo real</li>
                <li>• Use los filtros en cada módulo específico para más detalles</li>
                <li>• Las alertas críticas requieren atención inmediata</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
