'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Edit, X, User, Stethoscope, FileText } from 'lucide-react';
import { ESTADOS_CITA } from '@/constants/estados';

const getEstadoBadge = (estado) => {
  const variants = {
    [ESTADOS_CITA.PROGRAMADA]: 'bg-blue-100 text-blue-800 border-blue-200',
    [ESTADOS_CITA.CONFIRMADA]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [ESTADOS_CITA.EN_CONSULTA]: 'bg-amber-100 text-amber-800 border-amber-200',
    [ESTADOS_CITA.COMPLETADA]: 'bg-teal-100 text-teal-800 border-teal-200',
    [ESTADOS_CITA.CANCELADA]: 'bg-red-100 text-red-800 border-red-200',
    [ESTADOS_CITA.NO_ASISTIO]: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return variants[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function CitasList({ citas, loading, onEdit, onCancel }) {
  if (loading) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-0">
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-4">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (citas.length === 0) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            Citas del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay citas programadas para esta fecha</p>
            <p className="text-sm text-gray-400 mt-2">Agrega una usando el botón superior</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-emerald-600" />
          Citas del Día
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Hora</TableHead>
                <TableHead className="font-semibold">Paciente</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Doctor</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Motivo</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citas.map((cita) => (
                <TableRow key={cita.id} className="hover:bg-gray-50">
                  <TableCell className="font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Clock className="w-4 h-4 text-emerald-600" />
                      </div>
                      {cita.hora}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {cita.paciente_nombre} {cita.paciente_apellido}
                        </div>
                        <div className="text-xs text-gray-500">{cita.paciente_cedula}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Stethoscope className="w-4 h-4 text-gray-500" />
                      Dr. {cita.doctor_nombre} {cita.doctor_apellido}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <FileText className="w-4 h-4 text-gray-500" />
                      {cita.motivo}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getEstadoBadge(cita.estado)} border`}>
                      {cita.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(cita)}
                        disabled={cita.estado === ESTADOS_CITA.CANCELADA}
                        className="h-9 w-9 p-0 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 disabled:opacity-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-700 hover:border-red-300 disabled:opacity-50"
                        onClick={() => onCancel(cita.id)}
                        disabled={cita.estado === ESTADOS_CITA.CANCELADA}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
