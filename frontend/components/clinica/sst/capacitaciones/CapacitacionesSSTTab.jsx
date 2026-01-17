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
import { Plus, GraduationCap, Users, Clock, CheckCircle2 } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function CapacitacionesSSTTab({ user }) {
  const { capacitaciones, fetchCapacitaciones, getIndicadoresCapacitacion, loading } = useSST();
  const [indicadores, setIndicadores] = useState(null);

  useEffect(() => {
    fetchCapacitaciones();
    getIndicadoresCapacitacion().then(setIndicadores);
  }, [fetchCapacitaciones, getIndicadoresCapacitacion]);

  const getEstadoBadge = (estado) => {
    const estados = {
      PROGRAMADA: { variant: 'outline', label: 'Programada' },
      EN_CURSO: { variant: 'secondary', label: 'En Curso' },
      REALIZADA: { variant: 'success', label: 'Realizada' },
      CANCELADA: { variant: 'destructive', label: 'Cancelada' },
    };
    const config = estados[estado] || { variant: 'outline', label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Capacitaciones SST</h2>
          <p className="text-sm text-gray-500">Programa de formacion en SST - Decreto 1072/2015</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Capacitacion
        </Button>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{indicadores?.programadas || 0}</p>
                <p className="text-xs text-gray-500">Programadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{indicadores?.realizadas || 0}</p>
                <p className="text-xs text-gray-500">Realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{indicadores?.cobertura || 0}%</p>
                <p className="text-xs text-gray-500">Cobertura</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{indicadores?.horasCapacitacion || 0}</p>
                <p className="text-xs text-gray-500">Horas totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cumplimiento */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cumplimiento del Programa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Avance</span>
              <span className="font-medium">{indicadores?.cumplimiento || 0}%</span>
            </div>
            <Progress value={parseFloat(indicadores?.cumplimiento) || 0} />
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tema</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Duracion</TableHead>
                <TableHead>Asistentes</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : capacitaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No hay capacitaciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                capacitaciones.map((cap) => (
                  <TableRow key={cap.id}>
                    <TableCell className="max-w-48 truncate">{cap.tema}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cap.tipoCapacitacion}</Badge>
                    </TableCell>
                    <TableCell>
                      {cap.fechaProgramada
                        ? new Date(cap.fechaProgramada).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
                        : '-'}
                    </TableCell>
                    <TableCell>{cap.duracionHoras}h</TableCell>
                    <TableCell>{cap._count?.asistentes || 0}</TableCell>
                    <TableCell>{getEstadoBadge(cap.estado)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
