'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, CheckSquare, Download, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function EstandaresTab({ user }) {
  const {
    evaluacionEstandares,
    getEvaluacionActual,
    createEvaluacion,
    finalizarEvaluacion,
    descargarEvaluacionPDF,
    loading
  } = useSST();

  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    getEvaluacionActual(anio);
  }, [anio, getEvaluacionActual]);

  const handleDescargarPDF = async () => {
    if (evaluacionEstandares?.id) {
      const blob = await descargarEvaluacionPDF(evaluacionEstandares.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Evaluacion_Estandares_${anio}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const getValoracionBadge = (valoracion) => {
    const valoraciones = {
      CRITICO: { color: 'bg-red-500 text-white', label: 'Critico' },
      BAJO: { color: 'bg-orange-500 text-white', label: 'Bajo' },
      MODERADAMENTE_ACEPTABLE: { color: 'bg-yellow-500 text-black', label: 'Mod. Aceptable' },
      ACEPTABLE: { color: 'bg-green-500 text-white', label: 'Aceptable' },
    };
    const config = valoraciones[valoracion] || { color: 'bg-gray-200', label: valoracion };
    return <span className={`px-2 py-1 rounded text-sm font-medium ${config.color}`}>{config.label}</span>;
  };

  const ciclos = [
    { nombre: 'PLANEAR', peso: 25, color: 'bg-blue-500' },
    { nombre: 'HACER', peso: 60, color: 'bg-green-500' },
    { nombre: 'VERIFICAR', peso: 5, color: 'bg-yellow-500' },
    { nombre: 'ACTUAR', peso: 10, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Evaluacion de Estandares Minimos</h2>
          <p className="text-sm text-gray-500">Resolucion 0312/2019 - Autoevaluacion anual</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))}
            className="border rounded px-3 py-2 text-sm"
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - i + 1;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          {!evaluacionEstandares && (
            <Button onClick={() => createEvaluacion({ anio })}>
              <Plus className="w-4 h-4 mr-2" />
              Iniciar Evaluacion {anio}
            </Button>
          )}
        </div>
      </div>

      {evaluacionEstandares ? (
        <>
          {/* Resultado General */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Resultado Evaluacion {anio}
                </CardTitle>
                <div className="flex gap-2">
                  {evaluacionEstandares.estado === 'EN_PROCESO' && (
                    <Button variant="outline" onClick={() => finalizarEvaluacion(evaluacionEstandares.id)}>
                      Finalizar
                    </Button>
                  )}
                  {evaluacionEstandares.estado === 'COMPLETADA' && (
                    <Button variant="outline" onClick={handleDescargarPDF}>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Puntaje */}
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${
                      evaluacionEstandares.puntajeTotal >= 85 ? 'text-green-500' :
                      evaluacionEstandares.puntajeTotal >= 60 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {evaluacionEstandares.puntajeTotal || 0}%
                    </div>
                    <p className="text-gray-500 mt-2">Puntaje Total</p>
                    <div className="mt-2">
                      {getValoracionBadge(evaluacionEstandares.valoracion)}
                    </div>
                  </div>
                </div>

                {/* Puntaje por Ciclo PHVA */}
                <div className="col-span-2">
                  <p className="text-sm font-medium mb-4">Puntaje por Ciclo PHVA</p>
                  <div className="space-y-3">
                    {ciclos.map((ciclo) => {
                      const puntajeCiclo = evaluacionEstandares.ciclos?.find(c => c.ciclo === ciclo.nombre)?.puntaje || 0;
                      const porcentaje = (puntajeCiclo / ciclo.peso) * 100;
                      return (
                        <div key={ciclo.nombre}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{ciclo.nombre} ({ciclo.peso}%)</span>
                            <span className="font-medium">{puntajeCiclo.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${ciclo.color} transition-all`}
                              style={{ width: `${Math.min(porcentaje, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Alertas */}
              {evaluacionEstandares.puntajeTotal < 60 && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700">Plan de Mejoramiento Obligatorio</p>
                      <p className="text-sm text-red-600">
                        Con puntaje menor a 60%, se requiere elaborar un plan de mejoramiento inmediato
                        y enviarlo a la ARL en maximo 3 meses.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items por Ciclo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle por Estandar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Estandar</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Peso</TableHead>
                    <TableHead className="text-center">Cumple</TableHead>
                    <TableHead className="text-center">Puntaje</TableHead>
                    <TableHead>Plan Mejora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(evaluacionEstandares.items || []).slice(0, 20).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.ciclo}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.estandar}</TableCell>
                      <TableCell className="max-w-64 truncate text-sm">{item.descripcion}</TableCell>
                      <TableCell className="text-center">{item.peso}</TableCell>
                      <TableCell className="text-center">
                        {item.cumple === null ? (
                          <span className="text-gray-400">-</span>
                        ) : item.cumple ? (
                          <Badge variant="success">Si</Badge>
                        ) : (
                          <Badge variant="destructive">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {item.puntajeObtenido?.toFixed(1) || 0}
                      </TableCell>
                      <TableCell>
                        {item.planMejora && (
                          <Badge variant="secondary">En Proceso</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Interpretacion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Interpretacion de Resultados (Res. 0312/2019)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-red-50 rounded">
                  <p className="font-medium text-red-700">Critico (0-60%)</p>
                  <p className="text-red-600">Plan de mejoramiento inmediato</p>
                </div>
                <div className="p-3 bg-orange-50 rounded">
                  <p className="font-medium text-orange-700">Bajo (61-85%)</p>
                  <p className="text-orange-600">Plan de mejoramiento</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded">
                  <p className="font-medium text-yellow-700">Mod. Aceptable (86-100%)</p>
                  <p className="text-yellow-600">Mantener y mejorar</p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <p className="font-medium text-green-700">Aceptable (100%)</p>
                  <p className="text-green-600">Mantener estandares</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay evaluacion de estandares para {anio}</p>
            <p className="text-sm mt-1">La evaluacion es obligatoria anualmente</p>
            <Button className="mt-4" onClick={() => createEvaluacion({ anio })}>
              <Plus className="w-4 h-4 mr-2" />
              Iniciar Evaluacion {anio}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
