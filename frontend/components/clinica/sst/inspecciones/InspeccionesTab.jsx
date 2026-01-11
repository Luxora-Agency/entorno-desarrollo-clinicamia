'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, ClipboardCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function InspeccionesTab({ user }) {
  const { inspecciones, fetchInspecciones, getListasVerificacion, loading } = useSST();
  const [listas, setListas] = useState([]);

  useEffect(() => {
    fetchInspecciones();
    getListasVerificacion().then(data => setListas(data || []));
  }, [fetchInspecciones, getListasVerificacion]);

  const getEstadoBadge = (estado) => {
    const estados = {
      PROGRAMADA: { variant: 'outline', label: 'Programada' },
      EN_PROCESO: { variant: 'secondary', label: 'En Proceso' },
      COMPLETADA: { variant: 'success', label: 'Completada' },
    };
    const config = estados[estado] || { variant: 'outline', label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const hallazgosAbiertos = inspecciones.reduce(
    (acc, i) => acc + (i._count?.hallazgos || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Inspecciones de Seguridad</h2>
          <p className="text-sm text-gray-500">Inspecciones planeadas y no planeadas</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Inspeccion
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{inspecciones.length}</p>
                <p className="text-xs text-gray-500">Total inspecciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{hallazgosAbiertos}</p>
                <p className="text-xs text-gray-500">Hallazgos abiertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {inspecciones.filter(i => i.estado === 'COMPLETADA').length}
                </p>
                <p className="text-xs text-gray-500">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Hallazgos</TableHead>
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
              ) : inspecciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No hay inspecciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                inspecciones.map((insp) => (
                  <TableRow key={insp.id}>
                    <TableCell>
                      {new Date(insp.fechaInspeccion).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{insp.tipoInspeccion}</Badge>
                    </TableCell>
                    <TableCell>{insp.areaInspeccionada}</TableCell>
                    <TableCell>
                      {insp.inspector?.nombre} {insp.inspector?.apellido}
                    </TableCell>
                    <TableCell>
                      {insp._count?.hallazgos > 0 && (
                        <Badge variant="secondary">{insp._count?.hallazgos}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getEstadoBadge(insp.estado)}</TableCell>
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
