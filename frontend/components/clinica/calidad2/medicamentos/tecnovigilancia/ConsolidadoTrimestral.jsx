'use client';

import { useState } from 'react';
import { Calendar, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCalidad2Tecnovigilancia } from '@/hooks/useCalidad2Tecnovigilancia';

const TRIMESTRES = [
  { value: '1', label: 'Primer Trimestre (Enero - Marzo)' },
  { value: '2', label: 'Segundo Trimestre (Abril - Junio)' },
  { value: '3', label: 'Tercer Trimestre (Julio - Septiembre)' },
  { value: '4', label: 'Cuarto Trimestre (Octubre - Diciembre)' },
];

const currentYear = new Date().getFullYear();
const ANIOS = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

export default function ConsolidadoTrimestral() {
  const { consolidado, loading, getConsolidado } = useCalidad2Tecnovigilancia();
  const [trimestre, setTrimestre] = useState('1');
  const [anio, setAnio] = useState(currentYear.toString());

  const handleGenerar = async () => {
    await getConsolidado(trimestre, anio);
  };

  const handleExportar = () => {
    // TODO: Implement export to Excel or PDF
    alert('Funcionalidad de exportación próximamente');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            Consolidado Trimestral de Tecnovigilancia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Trimestre</label>
              <Select value={trimestre} onValueChange={setTrimestre}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIMESTRES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Año</label>
              <Select value={anio} onValueChange={setAnio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANIOS.map(a => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerar} disabled={loading}>
              <Calendar className="w-4 h-4 mr-2" />
              {loading ? 'Generando...' : 'Generar Consolidado'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {consolidado && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-900 mb-2">
                  {consolidado.total}
                </p>
                <p className="text-sm text-orange-700">
                  Reportes de Tecnovigilancia
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {TRIMESTRES.find(t => t.value === trimestre.toString())?.label} {anio}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(consolidado.fechaInicio).toLocaleDateString()} - {new Date(consolidado.fechaFin).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Distribution by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribución por Tipo de Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {consolidado.resumen?.porTipo && Object.entries(consolidado.resumen.porTipo).map(([tipo, cantidad]) => (
                  <div key={tipo} className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-900">{cantidad}</p>
                    <p className="text-xs text-blue-700 mt-1">{tipo.replace(/_/g, ' ')}</p>
                  </div>
                ))}
                {(!consolidado.resumen?.porTipo || Object.keys(consolidado.resumen.porTipo).length === 0) && (
                  <p className="col-span-4 text-center text-gray-500 py-4">
                    No hay datos para mostrar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribution by Severity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribución por Gravedad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {consolidado.resumen?.porGravedad && Object.entries(consolidado.resumen.porGravedad).map(([gravedad, cantidad]) => {
                  const colorClass = {
                    'LEVE': 'bg-yellow-50 border-yellow-200 text-yellow-900',
                    'MODERADA': 'bg-orange-50 border-orange-200 text-orange-900',
                    'GRAVE': 'bg-red-50 border-red-200 text-red-900',
                    'MORTAL': 'bg-purple-50 border-purple-200 text-purple-900',
                  }[gravedad] || 'bg-gray-50 border-gray-200 text-gray-900';

                  return (
                    <div key={gravedad} className={`border rounded-lg p-4 text-center ${colorClass}`}>
                      <p className="text-2xl font-bold">{cantidad}</p>
                      <p className="text-xs mt-1">{gravedad}</p>
                    </div>
                  );
                })}
                {(!consolidado.resumen?.porGravedad || Object.keys(consolidado.resumen.porGravedad).length === 0) && (
                  <p className="col-span-4 text-center text-gray-500 py-4">
                    No hay datos para mostrar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribution by Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribución por Clasificación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {consolidado.resumen?.porClasificacion && Object.entries(consolidado.resumen.porClasificacion).map(([clasificacion, cantidad]) => (
                  <div key={clasificacion} className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{cantidad}</p>
                    <p className="text-xs text-gray-700 mt-1">{clasificacion.replace(/_/g, ' ')}</p>
                  </div>
                ))}
                {(!consolidado.resumen?.porClasificacion || Object.keys(consolidado.resumen.porClasificacion).length === 0) && (
                  <p className="col-span-4 text-center text-gray-500 py-4">
                    No hay datos para mostrar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reports List (summary) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Reportes del Período</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportar}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {consolidado.reportes && consolidado.reportes.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {consolidado.reportes.map((reporte, index) => (
                    <div key={reporte.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                      <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {reporte.dispositivoMedico}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(reporte.fechaEvento).toLocaleDateString()} - {reporte.tipoEvento?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        reporte.gravedadEvento === 'GRAVE' || reporte.gravedadEvento === 'MORTAL'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reporte.gravedadEvento}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay reportes en este período
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
