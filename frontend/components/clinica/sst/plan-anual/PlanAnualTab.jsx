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
import { Plus, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function PlanAnualTab({ user }) {
  const { planAnual, getPlanAnual, getCumplimientoPlan, loading } = useSST();
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    getPlanAnual(anio);
  }, [anio, getPlanAnual]);

  const getEstadoBadge = (estado) => {
    const estados = {
      PENDIENTE: { variant: 'outline', label: 'Pendiente' },
      EN_PROCESO: { variant: 'secondary', label: 'En Proceso' },
      COMPLETADA: { variant: 'success', label: 'Completada' },
      VENCIDA: { variant: 'destructive', label: 'Vencida' },
    };
    const config = estados[estado] || { variant: 'outline', label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Plan Anual de Trabajo SST</h2>
          <p className="text-sm text-gray-500">Decreto 1072/2015 - Art. 2.2.4.6.17</p>
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
          {!planAnual && (
            <Button onClick={() => {}}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Plan
            </Button>
          )}
        </div>
      </div>

      {planAnual ? (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-gray-500">Actividades</p>
                <p className="text-2xl font-bold">{planAnual.actividades?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-gray-500">Completadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {planAnual.actividades?.filter(a => a.estado === 'COMPLETADA').length || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-gray-500">En Proceso</p>
                <p className="text-2xl font-bold text-blue-600">
                  {planAnual.actividades?.filter(a => a.estado === 'EN_PROCESO').length || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-gray-500">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">
                  {planAnual.actividades?.filter(a => a.estado === 'VENCIDA').length || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cumplimiento */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cumplimiento General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Avance</span>
                  <span className="font-medium">
                    {Math.round((planAnual.actividades?.filter(a => a.estado === 'COMPLETADA').length / (planAnual.actividades?.length || 1)) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(planAnual.actividades?.filter(a => a.estado === 'COMPLETADA').length / (planAnual.actividades?.length || 1)) * 100}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actividades */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Actividades</CardTitle>
                <Button size="sm" onClick={() => {}}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Actividad
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Ciclo PHVA</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Fecha Programada</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Evidencias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(planAnual.actividades || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No hay actividades registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    (planAnual.actividades || []).map((actividad) => (
                      <TableRow key={actividad.id}>
                        <TableCell className="max-w-48 truncate">{actividad.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{actividad.ciclo}</Badge>
                        </TableCell>
                        <TableCell>{actividad.responsable || 'N/A'}</TableCell>
                        <TableCell>
                          {actividad.fechaProgramada
                            ? new Date(actividad.fechaProgramada).toLocaleDateString('es-CO')
                            : '-'}
                        </TableCell>
                        <TableCell>{getEstadoBadge(actividad.estado)}</TableCell>
                        <TableCell>{actividad._count?.evidencias || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay plan anual para {anio}</p>
            <Button className="mt-4" onClick={() => {}}>
              Crear Plan {anio}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
