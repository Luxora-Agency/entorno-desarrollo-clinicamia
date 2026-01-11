'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCronogramaMantenimiento } from '@/hooks/useCronogramaMantenimiento';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const ESTADO_COLORS = {
  PROGRAMADO: 'bg-gray-100 text-gray-800',
  EN_PROGRESO: 'bg-yellow-100 text-yellow-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
  REPROGRAMADO: 'bg-blue-100 text-blue-800',
};

export default function CronogramaTab({ user }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [anio, setAnio] = useState(currentYear);
  const [mes, setMes] = useState(currentMonth);
  const [vistaActual, setVistaActual] = useState('mensual'); // 'mensual' o 'anual'

  const { cronogramaMensual, estadisticas, loading, loadCronogramaMensual, loadEstadisticas } =
    useCronogramaMantenimiento();

  useEffect(() => {
    if (vistaActual === 'mensual') {
      loadCronogramaMensual(mes, anio);
    }
  }, [mes, anio, vistaActual, loadCronogramaMensual]);

  useEffect(() => {
    loadEstadisticas(anio);
  }, [anio, loadEstadisticas]);

  const handlePrevMonth = () => {
    if (mes === 1) {
      setMes(12);
      setAnio(anio - 1);
    } else {
      setMes(mes - 1);
    }
  };

  const handleNextMonth = () => {
    if (mes === 12) {
      setMes(1);
      setAnio(anio + 1);
    } else {
      setMes(mes + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={vistaActual} onValueChange={setVistaActual}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensual">Vista Mensual</SelectItem>
              <SelectItem value="anual">Vista Anual</SelectItem>
            </SelectContent>
          </Select>

          {vistaActual === 'mensual' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {MESES[mes - 1]} {anio}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {vistaActual === 'anual' && (
            <Select value={anio.toString()} onValueChange={(val) => setAnio(parseInt(val))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...Array(5)].map((_, i) => (
                  <SelectItem key={i} value={(currentYear - 2 + i).toString()}>
                    {currentYear - 2 + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Programar Mantenimiento
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">
                {estadisticas.totalProgramados || 0}
              </div>
              <div className="text-sm text-gray-600">Programados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.completados || 0}
              </div>
              <div className="text-sm text-gray-600">Completados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {estadisticas.pendientes || 0}
              </div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">
                {estadisticas.porcentajeCompletado || 0}%
              </div>
              <div className="text-sm text-gray-600">Completado</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vista mensual */}
      {vistaActual === 'mensual' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Mantenimientos Programados - {MESES[mes - 1]} {anio}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : !cronogramaMensual || cronogramaMensual.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No hay mantenimientos programados para este mes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cronogramaMensual.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={ESTADO_COLORS[item.estado]}>
                          {item.estado}
                        </Badge>
                        <span className="text-sm font-medium">{item.descripcion}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{item.equipo?.nombre}</span>
                        {item.equipo?.ubicacion && ` - ${item.equipo.ubicacion}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Día {item.dia} de {MESES[mes - 1]}
                        {item.empresaAsignada && ` • ${item.empresaAsignada}`}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vista anual (placeholder) */}
      {vistaActual === 'anual' && (
        <Card>
          <CardHeader>
            <CardTitle>Cronograma Anual {anio}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Vista de cronograma anual (por implementar)</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
