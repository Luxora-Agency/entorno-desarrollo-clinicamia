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
import { Plus, Search, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function AuditoriasTab({ user }) {
  const {
    auditorias,
    accionesCorrectivas,
    fetchAuditorias,
    fetchAccionesCorrectivas,
    getAccionesVencidas,
    loading
  } = useSST();

  const [vista, setVista] = useState('auditorias');
  const [accionesVencidas, setAccionesVencidas] = useState([]);

  useEffect(() => {
    fetchAuditorias();
    fetchAccionesCorrectivas();
    getAccionesVencidas().then(data => setAccionesVencidas(data || []));
  }, [fetchAuditorias, fetchAccionesCorrectivas, getAccionesVencidas]);

  const getEstadoAuditoria = (estado) => {
    const estados = {
      PROGRAMADA: { variant: 'outline', label: 'Programada' },
      EN_EJECUCION: { variant: 'secondary', label: 'En Ejecucion' },
      COMPLETADA: { variant: 'success', label: 'Completada' },
    };
    return <Badge variant={estados[estado]?.variant || 'outline'}>{estados[estado]?.label || estado}</Badge>;
  };

  const getEstadoAccion = (estado) => {
    const estados = {
      ABIERTA: { variant: 'outline', label: 'Abierta' },
      IMPLEMENTADA: { variant: 'secondary', label: 'Implementada' },
      VERIFICADA: { variant: 'default', label: 'Verificada' },
      CERRADA: { variant: 'success', label: 'Cerrada' },
      NO_EFICAZ: { variant: 'destructive', label: 'No Eficaz' },
    };
    return <Badge variant={estados[estado]?.variant || 'outline'}>{estados[estado]?.label || estado}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Auditorias y Acciones Correctivas</h2>
          <p className="text-sm text-gray-500">Ciclo PHVA - Verificar y Actuar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setVista(vista === 'auditorias' ? 'acciones' : 'auditorias')}>
            {vista === 'auditorias' ? 'Ver Acciones' : 'Ver Auditorias'}
          </Button>
          <Button onClick={() => {}}>
            <Plus className="w-4 h-4 mr-2" />
            {vista === 'auditorias' ? 'Nueva Auditoria' : 'Nueva Accion'}
          </Button>
        </div>
      </div>

      {/* Alerta acciones vencidas */}
      {accionesVencidas.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="font-medium text-red-700">{accionesVencidas.length} acciones vencidas</p>
                <p className="text-sm text-red-600">Requieren atencion inmediata</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {vista === 'auditorias' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-5 h-5" />
              Auditorias del SG-SST
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Alcance</TableHead>
                  <TableHead>Auditor Lider</TableHead>
                  <TableHead>Hallazgos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No hay auditorias registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  auditorias.map((auditoria) => (
                    <TableRow key={auditoria.id}>
                      <TableCell>
                        {new Date(auditoria.fechaProgramada).toLocaleDateString('es-CO')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{auditoria.tipoAuditoria}</Badge>
                      </TableCell>
                      <TableCell className="max-w-40 truncate">{auditoria.alcance}</TableCell>
                      <TableCell>{auditoria.auditorLider}</TableCell>
                      <TableCell>
                        {auditoria._count?.hallazgos > 0 && (
                          <Badge variant="secondary">{auditoria._count?.hallazgos}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getEstadoAuditoria(auditoria.estado)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Acciones Correctivas y Preventivas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Fecha Impl.</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accionesCorrectivas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No hay acciones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  accionesCorrectivas.map((accion) => (
                    <TableRow key={accion.id}>
                      <TableCell className="font-mono text-sm">{accion.numeroAccion}</TableCell>
                      <TableCell>
                        <Badge variant={accion.tipoAccion === 'CORRECTIVA' ? 'destructive' : 'default'}>
                          {accion.tipoAccion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{accion.origen}</Badge>
                      </TableCell>
                      <TableCell className="max-w-40 truncate">
                        {accion.descripcionNoConformidad}
                      </TableCell>
                      <TableCell>
                        {accion.responsable?.nombre} {accion.responsable?.apellido}
                      </TableCell>
                      <TableCell>
                        {accion.fechaImplementacion && (
                          <span className={
                            new Date(accion.fechaImplementacion) < new Date() && accion.estado !== 'CERRADA'
                              ? 'text-red-500 font-medium'
                              : ''
                          }>
                            {new Date(accion.fechaImplementacion).toLocaleDateString('es-CO')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getEstadoAccion(accion.estado)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
