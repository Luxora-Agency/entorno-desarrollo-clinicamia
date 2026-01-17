'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, HeartPulse, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function ExamenesMedicosTab({ user }) {
  const {
    examenesMedicos,
    fetchExamenesMedicos,
    getExamenesVencidos,
    getExamenesProximosVencer,
    loading
  } = useSST();

  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [alertas, setAlertas] = useState({ vencidos: 0, proximos: 0 });

  useEffect(() => {
    fetchExamenesMedicos({ search, tipo: tipoFilter });
    Promise.all([
      getExamenesVencidos(),
      getExamenesProximosVencer(30)
    ]).then(([vencidos, proximos]) => {
      setAlertas({
        vencidos: vencidos?.length || 0,
        proximos: proximos?.length || 0
      });
    });
  }, [search, tipoFilter, fetchExamenesMedicos, getExamenesVencidos, getExamenesProximosVencer]);

  const getTipoBadge = (tipo) => {
    const tipos = {
      INGRESO: { color: 'bg-blue-100 text-blue-700', label: 'Ingreso' },
      PERIODICO: { color: 'bg-green-100 text-green-700', label: 'Periodico' },
      RETIRO: { color: 'bg-gray-100 text-gray-700', label: 'Retiro' },
      POST_INCAPACIDAD: { color: 'bg-orange-100 text-orange-700', label: 'Post-incapacidad' },
      ESPECIAL: { color: 'bg-purple-100 text-purple-700', label: 'Especial' },
    };
    const config = tipos[tipo] || { color: 'bg-gray-100', label: tipo };
    return <span className={`px-2 py-0.5 rounded text-xs ${config.color}`}>{config.label}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Examenes Medicos Ocupacionales</h2>
          <p className="text-sm text-gray-500">Resolucion 1843/2025 - Evaluaciones medicas</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          Programar Examen
        </Button>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={alertas.vencidos > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-8 h-8 ${alertas.vencidos > 0 ? 'text-red-500' : 'text-gray-300'}`} />
              <div>
                <p className="text-2xl font-bold">{alertas.vencidos}</p>
                <p className="text-sm text-gray-500">Examenes vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={alertas.proximos > 0 ? 'border-orange-200 bg-orange-50' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className={`w-8 h-8 ${alertas.proximos > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
              <div>
                <p className="text-2xl font-bold">{alertas.proximos}</p>
                <p className="text-sm text-gray-500">Proximos a vencer (30 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por empleado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="INGRESO">Ingreso</option>
              <option value="PERIODICO">Periodico</option>
              <option value="RETIRO">Retiro</option>
              <option value="POST_INCAPACIDAD">Post-incapacidad</option>
              <option value="ESPECIAL">Especial</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha Programada</TableHead>
                <TableHead>Fecha Realizacion</TableHead>
                <TableHead>IPS</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Vencimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : examenesMedicos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <HeartPulse className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No hay examenes registrados
                  </TableCell>
                </TableRow>
              ) : (
                examenesMedicos.map((examen) => (
                  <TableRow key={examen.id}>
                    <TableCell>
                      <p className="font-medium">
                        {examen.empleado?.nombre} {examen.empleado?.apellido}
                      </p>
                    </TableCell>
                    <TableCell>{getTipoBadge(examen.tipoExamen)}</TableCell>
                    <TableCell>
                      {new Date(examen.fechaProgramada).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                    </TableCell>
                    <TableCell>
                      {examen.fechaRealizacion
                        ? new Date(examen.fechaRealizacion).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
                        : '-'}
                    </TableCell>
                    <TableCell>{examen.ipsRealizadora || '-'}</TableCell>
                    <TableCell>
                      {examen.conceptoAptitud && (
                        <Badge variant={examen.conceptoAptitud === 'APTO' ? 'success' : 'secondary'}>
                          {examen.conceptoAptitud}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {examen.fechaVencimiento && (
                        <span className={
                          new Date(examen.fechaVencimiento) < new Date()
                            ? 'text-red-500 font-medium'
                            : ''
                        }>
                          {new Date(examen.fechaVencimiento).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                        </span>
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
