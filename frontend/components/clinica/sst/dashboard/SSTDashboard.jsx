'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  ClipboardCheck,
  Bell,
  HardHat,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function SSTDashboard({ user }) {
  const { dashboard, fetchDashboard, loading } = useSST();
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboard(anio);
  }, [anio, fetchDashboard]);

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const {
    accidentalidad = {},
    enfermedadLaboral = {},
    indicadores = {},
    copasst = {},
    capacitacion = {},
    inspecciones = {},
    planAnual = {},
    estandares = {},
    alertas = []
  } = dashboard || {};

  return (
    <div className="space-y-6">
      {/* Selector de ano y Alertas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Ano:</span>
          <select
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
        {alertas.length > 0 && (
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-600 font-medium">{alertas.length} alertas activas</span>
          </div>
        )}
      </div>

      {/* Indicadores Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Accidentes de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{accidentalidad.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {accidentalidad.diasPerdidos || 0} dias perdidos
            </p>
            {accidentalidad.pendientesInvestigacion > 0 && (
              <Badge variant="destructive" className="mt-2 text-xs">
                {accidentalidad.pendientesInvestigacion} sin investigar
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-purple-500" />
              Enfermedades Laborales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{enfermedadLaboral.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {enfermedadLaboral.conReubicacion || 0} con reubicacion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Indice de Frecuencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{indicadores.indiceFrecuencia || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              K = 240,000 HHT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              Tasa de Accidentalidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{indicadores.tasaAccidentalidad || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {indicadores.trabajadores || 0} trabajadores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* COPASST */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              COPASST
            </CardTitle>
          </CardHeader>
          <CardContent>
            {copasst.vigente ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Vigente</span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>{copasst.integrantes} integrantes</p>
                  <p>{copasst.reunionesRealizadas} reuniones realizadas</p>
                  {copasst.compromisosPendientes > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {copasst.compromisosPendientes} compromisos pendientes
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">Sin COPASST vigente</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Anual */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Plan Anual de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {planAnual.existe ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cumplimiento</span>
                  <span className="font-medium">{planAnual.actividades?.cumplimiento || 0}%</span>
                </div>
                <Progress value={parseFloat(planAnual.actividades?.cumplimiento) || 0} />
                <div className="text-xs text-gray-500">
                  <p>{planAnual.actividades?.cumplidas}/{planAnual.actividades?.total} actividades</p>
                  {planAnual.actividades?.vencidas > 0 && (
                    <Badge variant="destructive" className="mt-1 text-xs">
                      {planAnual.actividades?.vencidas} vencidas
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Sin plan definido</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Capacitacion */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-purple-500" />
              Capacitaciones SST
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cumplimiento</span>
                <span className="font-medium">{capacitacion.cumplimiento || 0}%</span>
              </div>
              <Progress value={parseFloat(capacitacion.cumplimiento) || 0} />
              <div className="text-xs text-gray-500">
                <p>{capacitacion.realizadas}/{capacitacion.programadas} realizadas</p>
                <p>Cobertura: {capacitacion.cobertura || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluacion Estandares y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estandares Minimos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Evaluacion Estandares Minimos (Res. 0312)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estandares.evaluado ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold">{estandares.puntaje}%</p>
                    <p className="text-sm text-gray-500">{estandares.valoracion}</p>
                  </div>
                  <div className={`p-4 rounded-full ${
                    estandares.puntaje >= 85 ? 'bg-green-100 text-green-600' :
                    estandares.puntaje >= 60 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {estandares.puntaje >= 85 ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : estandares.puntaje >= 60 ? (
                      <AlertCircle className="w-8 h-8" />
                    ) : (
                      <XCircle className="w-8 h-8" />
                    )}
                  </div>
                </div>
                {estandares.pendientesPlanMejora > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {estandares.pendientesPlanMejora} items pendientes de plan de mejora
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sin evaluacion completada este ano</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas Activas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertas.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alertas.map((alerta, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded text-sm ${
                      alerta.tipo === 'CRITICA' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    {alerta.tipo === 'CRITICA' ? (
                      <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{alerta.mensaje}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
                <p>Sin alertas activas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grafico de Accidentes por Mes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Accidentes por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {(accidentalidad.porMes || []).map((mes, index) => {
              const maxCantidad = Math.max(...(accidentalidad.porMes || []).map(m => m.cantidad), 1);
              const height = (mes.cantidad / maxCantidad) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${height}%`, minHeight: mes.cantidad > 0 ? '4px' : '0' }}
                    title={`${mes.cantidad} accidente(s)`}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    {['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Inspecciones y EPP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-teal-500" />
              Inspecciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inspecciones.total || 0}</div>
            <p className="text-xs text-gray-500">realizadas este ano</p>
            {inspecciones.hallazgosAbiertos > 0 && (
              <Badge variant="outline" className="mt-2 text-xs">
                {inspecciones.hallazgosAbiertos} hallazgos abiertos
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-500" />
              EPP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 space-y-1">
              {(inspecciones.hallazgosPorNivel || []).map((h, i) => (
                <div key={i} className="flex justify-between">
                  <span>Nivel {h.nivel}:</span>
                  <span className="font-medium">{h.cantidad}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
