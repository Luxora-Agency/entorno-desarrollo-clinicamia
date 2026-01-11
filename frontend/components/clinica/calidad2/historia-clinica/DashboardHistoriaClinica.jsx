'use client';

import { useState, useEffect } from 'react';
import { useCalidad2DashboardHC } from '@/hooks/useCalidad2DashboardHC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReactECharts from 'echarts-for-react';
import {
  FileText,
  Award,
  FileSignature,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  Activity,
} from 'lucide-react';

/**
 * Dashboard de Historia Clínica - Calidad 2.0
 *
 * Dashboard completo con visualizaciones de todos los submódulos
 */
export default function DashboardHistoriaClinica() {
  const {
    resumen,
    loadingResumen,
    tendenciasIndicadores,
    timelineAuditorias,
    distribucionConsentimientos,
    topHallazgos,
    loadDashboardCompleto,
  } = useCalidad2DashboardHC();

  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());

  // Cargar datos al montar
  useEffect(() => {
    loadDashboardCompleto({ anio: anioFiltro });
  }, [anioFiltro]);

  if (loadingResumen && !resumen) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dashboard General</h3>
          <p className="text-sm text-muted-foreground">
            Resumen ejecutivo de calidad de historias clínicas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={anioFiltro}
            onChange={(e) => setAnioFiltro(parseInt(e.target.value))}
            className="border rounded px-3 py-2 text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadDashboardCompleto({ anio: anioFiltro })}
            disabled={loadingResumen}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingResumen ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Cards de Resumen Ejecutivo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Documentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.documentos?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {resumen?.documentos?.recientes || 0} nuevos este mes
            </p>
            {resumen?.documentos?.proximosRevision > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                <Clock className="h-3 w-3" />
                {resumen.documentos.proximosRevision} próximos a revisar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificaciones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificaciones</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.certificaciones?.vigentes || 0}</div>
            <p className="text-xs text-muted-foreground">
              {resumen?.certificaciones?.porcentajeVigentes || 0}% vigentes
            </p>
            {resumen?.certificaciones?.proximasVencer > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                {resumen.certificaciones.proximasVencer} próximas a vencer
              </div>
            )}
            {resumen?.certificaciones?.vencidas > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                <XCircle className="h-3 w-3" />
                {resumen.certificaciones.vencidas} vencidas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consentimientos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consentimientos</CardTitle>
            <FileSignature className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumen?.consentimientos?.totalAplicados || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumen?.consentimientos?.totalTipos || 0} tipos disponibles
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              {resumen?.consentimientos?.porcentajeFirmasCompletas || 0}% con firmas completas
            </div>
          </CardContent>
        </Card>

        {/* Auditorías */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auditorías</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.auditorias?.abiertas || 0}</div>
            <p className="text-xs text-muted-foreground">
              {resumen?.auditorias?.total || 0} auditorías totales
            </p>
            {resumen?.auditorias?.hallazgosCriticosAbiertos > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {resumen.auditorias.hallazgosCriticosAbiertos} hallazgos críticos abiertos
              </div>
            )}
          </CardContent>
        </Card>

        {/* Indicadores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indicadores</CardTitle>
            <Activity className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.indicadores?.cumpleMeta || 0}</div>
            <p className="text-xs text-muted-foreground">
              {resumen?.indicadores?.total || 0} indicadores activos
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              {resumen?.indicadores?.porcentajeCumplimiento || 0}% cumpliendo meta
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila de Gráficas Principales */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfica: Timeline de Auditorías */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Timeline de Auditorías {anioFiltro}
            </CardTitle>
            <CardDescription>
              Auditorías y hallazgos por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timelineAuditorias && timelineAuditorias.porMes ? (
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                      type: 'shadow',
                    },
                  },
                  legend: {
                    data: ['Auditorías', 'Hallazgos Positivos', 'Hallazgos Negativos', 'Hallazgos Críticos'],
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true,
                  },
                  xAxis: {
                    type: 'category',
                    data: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                  },
                  yAxis: {
                    type: 'value',
                  },
                  series: [
                    {
                      name: 'Auditorías',
                      type: 'bar',
                      data: timelineAuditorias.porMes.map((m) => m.auditorias),
                      itemStyle: { color: '#3b82f6' },
                    },
                    {
                      name: 'Hallazgos Positivos',
                      type: 'line',
                      data: timelineAuditorias.porMes.map((m) => m.hallazgosPositivos),
                      itemStyle: { color: '#10b981' },
                    },
                    {
                      name: 'Hallazgos Negativos',
                      type: 'line',
                      data: timelineAuditorias.porMes.map((m) => m.hallazgosNegativos),
                      itemStyle: { color: '#f59e0b' },
                    },
                    {
                      name: 'Hallazgos Críticos',
                      type: 'line',
                      data: timelineAuditorias.porMes.map((m) => m.hallazgosCriticos),
                      itemStyle: { color: '#ef4444' },
                    },
                  ],
                }}
                style={{ height: '300px' }}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay datos de auditorías para {anioFiltro}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfica: Distribución de Consentimientos por Servicio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Consentimientos por Servicio
            </CardTitle>
            <CardDescription>
              Distribución de consentimientos aplicados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {distribucionConsentimientos && distribucionConsentimientos.porServicio?.length > 0 ? (
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} ({d}%)',
                  },
                  legend: {
                    orient: 'vertical',
                    right: 10,
                    top: 'center',
                  },
                  series: [
                    {
                      name: 'Consentimientos',
                      type: 'pie',
                      radius: ['40%', '70%'],
                      avoidLabelOverlap: false,
                      itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2,
                      },
                      label: {
                        show: false,
                        position: 'center',
                      },
                      emphasis: {
                        label: {
                          show: true,
                          fontSize: 20,
                          fontWeight: 'bold',
                        },
                      },
                      labelLine: {
                        show: false,
                      },
                      data: distribucionConsentimientos.porServicio.map((item) => ({
                        value: item.cantidad,
                        name: item.servicio,
                      })),
                    },
                  ],
                }}
                style={{ height: '300px' }}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay consentimientos registrados para {anioFiltro}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila Inferior: Top Hallazgos y Alertas */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Hallazgos Recurrentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top Hallazgos Recurrentes
            </CardTitle>
            <CardDescription>
              Hallazgos más frecuentes en auditorías
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topHallazgos && topHallazgos.length > 0 ? (
              <div className="space-y-3">
                {topHallazgos.slice(0, 5).map((hallazgo, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{hallazgo.criterio}</p>
                      <p className="text-xs text-muted-foreground">
                        {Object.entries(hallazgo.porSeveridad)
                          .map(([sev, count]) => `${sev}: ${count}`)
                          .join(', ')}
                      </p>
                    </div>
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold ml-2">
                      {hallazgo.cantidad}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay hallazgos registrados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas Activas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Alertas de Cumplimiento
            </CardTitle>
            <CardDescription>
              Vencimientos y pendientes de atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resumen?.alertas ? (
              <div className="space-y-3">
                {resumen.alertas.certificacionesProximasVencer > 0 && (
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Certificaciones por vencer</span>
                    </div>
                    <span className="text-sm font-semibold text-orange-600">
                      {resumen.alertas.certificacionesProximasVencer}
                    </span>
                  </div>
                )}

                {resumen.alertas.certificacionesVencidas > 0 && (
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Certificaciones vencidas</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      {resumen.alertas.certificacionesVencidas}
                    </span>
                  </div>
                )}

                {resumen.alertas.documentosProximosRevision > 0 && (
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Documentos por revisar</span>
                    </div>
                    <span className="text-sm font-semibold text-yellow-600">
                      {resumen.alertas.documentosProximosRevision}
                    </span>
                  </div>
                )}

                {resumen.alertas.hallazgosCriticosAbiertos > 0 && (
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Hallazgos críticos abiertos</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      {resumen.alertas.hallazgosCriticosAbiertos}
                    </span>
                  </div>
                )}

                {resumen.alertas.auditoriasAbiertas > 0 && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Auditorías abiertas</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {resumen.alertas.auditoriasAbiertas}
                    </span>
                  </div>
                )}

                {resumen.alertas.total === 0 && (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                    <p className="font-semibold">No hay alertas activas</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Todos los procesos están al día
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Cargando alertas...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
