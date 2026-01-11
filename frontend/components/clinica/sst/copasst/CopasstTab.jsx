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
import { Plus, Users, Calendar, FileText, Download, CheckCircle2, XCircle } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function CopasstTab({ user }) {
  const {
    copasst,
    reunionesCopasst,
    getCopasstVigente,
    fetchReunionesCopasst,
    createReunionCopasst,
    descargarActaCopasst,
    loading
  } = useSST();

  useEffect(() => {
    getCopasstVigente().then(data => {
      if (data?.id) {
        fetchReunionesCopasst(data.id);
      }
    });
  }, [getCopasstVigente, fetchReunionesCopasst]);

  const handleDescargarActa = async (reunionId) => {
    const blob = await descargarActaCopasst(reunionId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acta_COPASST_${reunionId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">COPASST</h2>
          <p className="text-sm text-gray-500">Comite Paritario de Seguridad y Salud en el Trabajo - Res. 2013/1986</p>
        </div>
        {!copasst?.vigente && (
          <Button onClick={() => {}}>
            <Plus className="w-4 h-4 mr-2" />
            Crear COPASST
          </Button>
        )}
      </div>

      {/* COPASST Vigente */}
      {copasst?.vigente ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5" />
                COPASST Vigente
              </CardTitle>
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Activo
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500">Integrantes:</span>
                <p className="font-medium">{copasst.integrantes}</p>
              </div>
              <div>
                <span className="text-gray-500">Reuniones Realizadas:</span>
                <p className="font-medium">{copasst.reunionesRealizadas}</p>
              </div>
              <div>
                <span className="text-gray-500">Ultima Reunion:</span>
                <p className="font-medium">
                  {copasst.ultimaReunion
                    ? new Date(copasst.ultimaReunion).toLocaleDateString('es-CO')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Vencimiento:</span>
                <p className="font-medium">
                  {new Date(copasst.vencimiento).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>

            {copasst.compromisosPendientes > 0 && (
              <Badge variant="outline" className="mb-4">
                {copasst.compromisosPendientes} compromisos pendientes
              </Badge>
            )}

            <div className="flex gap-2">
              <Button onClick={() => {}}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Reunion
              </Button>
              <Button variant="outline" onClick={() => {}}>
                Ver Integrantes
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <XCircle className="w-12 h-12 mx-auto mb-2 text-red-300" />
            <p>No hay COPASST vigente</p>
            <p className="text-sm mt-1">Es obligatorio conformar el COPASST</p>
          </CardContent>
        </Card>
      )}

      {/* Reuniones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reuniones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Asistentes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Compromisos</TableHead>
                <TableHead className="text-right">Acta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : reunionesCopasst.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No hay reuniones registradas
                  </TableCell>
                </TableRow>
              ) : (
                reunionesCopasst.map((reunion) => (
                  <TableRow key={reunion.id}>
                    <TableCell>
                      {new Date(reunion.fechaReunion).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={reunion.tipo === 'ORDINARIA' ? 'outline' : 'secondary'}>
                        {reunion.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{reunion.horaInicio}</TableCell>
                    <TableCell>{reunion._count?.asistentes || 0}</TableCell>
                    <TableCell>
                      <Badge variant={reunion.estado === 'REALIZADA' ? 'success' : 'outline'}>
                        {reunion.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{reunion._count?.compromisos || 0}</TableCell>
                    <TableCell className="text-right">
                      {reunion.estado === 'REALIZADA' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDescargarActa(reunion.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
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
