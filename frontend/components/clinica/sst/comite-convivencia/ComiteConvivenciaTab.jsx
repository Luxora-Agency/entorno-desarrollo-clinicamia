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
import { Plus, HeartHandshake, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function ComiteConvivenciaTab({ user }) {
  const { comiteConvivencia, quejas, getCCLVigente, fetchQuejas, loading } = useSST();

  useEffect(() => {
    getCCLVigente();
    fetchQuejas();
  }, [getCCLVigente, fetchQuejas]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Comite de Convivencia Laboral</h2>
          <p className="text-sm text-gray-500">Resolucion 3461/2025 - Prevencion de acoso laboral</p>
        </div>
        {!comiteConvivencia?.vigente && (
          <Button onClick={() => {}}>
            <Plus className="w-4 h-4 mr-2" />
            Crear CCL
          </Button>
        )}
      </div>

      {/* CCL Vigente */}
      {comiteConvivencia?.vigente ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <HeartHandshake className="w-5 h-5" />
                CCL Vigente
              </CardTitle>
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Activo
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Integrantes:</span>
                <p className="font-medium">{comiteConvivencia.integrantes}</p>
              </div>
              <div>
                <span className="text-gray-500">Reuniones:</span>
                <p className="font-medium">{comiteConvivencia.reunionesRealizadas}</p>
              </div>
              <div>
                <span className="text-gray-500">Vencimiento:</span>
                <p className="font-medium">
                  {new Date(comiteConvivencia.vencimiento).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <XCircle className="w-12 h-12 mx-auto mb-2 text-red-300" />
            <p>No hay CCL vigente</p>
          </CardContent>
        </Card>
      )}

      {/* Quejas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Quejas de Acoso Laboral
            </CardTitle>
            <Button size="sm" onClick={() => {}}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Queja
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Confidencial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quejas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No hay quejas registradas
                  </TableCell>
                </TableRow>
              ) : (
                quejas.map((queja) => (
                  <TableRow key={queja.id}>
                    <TableCell>
                      {new Date(queja.fechaQueja).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{queja.tipoAcoso}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={queja.estado === 'RESUELTA' ? 'success' : 'secondary'}>
                        {queja.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {queja.confidencial ? 'Si' : 'No'}
                    </TableCell>
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
