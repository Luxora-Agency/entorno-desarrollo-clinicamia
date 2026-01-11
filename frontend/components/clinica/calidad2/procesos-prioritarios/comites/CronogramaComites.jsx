'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useCalidad2Comites } from '@/hooks/useCalidad2Comites';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Cronograma anual de reuniones de comités
 * Muestra calendario con estados: Programada, Realizada, Cancelada, Reprogramada
 */
export default function CronogramaComites() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const { comites, loading } = useCalidad2Comites();
  const [cronograma, setCronograma] = useState([]);

  const meses = [
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

  const aniosDisponibles = [];
  const anioActual = new Date().getFullYear();
  for (let i = anioActual - 1; i <= anioActual + 1; i++) {
    aniosDisponibles.push(i);
  }

  useEffect(() => {
    if (comites.length > 0) {
      generarCronograma();
    }
  }, [comites, selectedYear]);

  const generarCronograma = () => {
    const year = parseInt(selectedYear);
    const cronogramaCompleto = [];

    comites.forEach((comite) => {
      // Obtener cronograma del comité para el año seleccionado
      const itemsCronograma = comite.cronograma?.filter((c) => c.anio === year) || [];

      // Si no hay cronograma, generarlo basado en periodicidad
      if (itemsCronograma.length === 0 && comite.periodicidad) {
        const mesesReunion = getMesesSegunPeriodicidad(comite.periodicidad);
        mesesReunion.forEach((mes) => {
          const dia = comite.diaReunion || 15;
          const fechaProgramada = new Date(year, mes - 1, dia);

          cronogramaCompleto.push({
            id: `${comite.id}-${mes}`,
            comiteId: comite.id,
            comiteNombre: comite.nombre,
            comiteTipo: comite.tipo,
            mes,
            fechaProgramada: fechaProgramada.toISOString(),
            estado: 'PROGRAMADA',
            actaId: null,
          });
        });
      } else {
        cronogramaCompleto.push(...itemsCronograma.map((c) => ({ ...c, comiteNombre: comite.nombre, comiteTipo: comite.tipo })));
      }
    });

    setCronograma(cronogramaCompleto);
  };

  const getMesesSegunPeriodicidad = (periodicidad) => {
    switch (periodicidad) {
      case 'MENSUAL':
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      case 'BIMESTRAL':
        return [1, 3, 5, 7, 9, 11];
      case 'TRIMESTRAL':
        return [1, 4, 7, 10];
      default:
        return [];
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      PROGRAMADA: 'blue',
      REALIZADA: 'green',
      CANCELADA: 'red',
      REPROGRAMADA: 'orange',
    };
    return colors[estado] || 'default';
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      PROGRAMADA: Clock,
      REALIZADA: CheckCircle2,
      CANCELADA: XCircle,
      REPROGRAMADA: AlertCircle,
    };
    return icons[estado] || Clock;
  };

  // Agrupar por mes
  const cronogramaPorMes = meses.map((mes, index) => {
    const mesNum = index + 1;
    const reunionesMes = cronograma.filter((c) => c.mes === mesNum);
    return {
      mes,
      mesNum,
      reuniones: reunionesMes,
    };
  });

  // Estadísticas
  const stats = {
    programadas: cronograma.filter((c) => c.estado === 'PROGRAMADA').length,
    realizadas: cronograma.filter((c) => c.estado === 'REALIZADA').length,
    canceladas: cronograma.filter((c) => c.estado === 'CANCELADA').length,
    reprogramadas: cronograma.filter((c) => c.estado === 'REPROGRAMADA').length,
    total: cronograma.length,
  };

  const cumplimiento =
    stats.total > 0 ? ((stats.realizadas / stats.total) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Cronograma de Reuniones
          </h3>
          <p className="text-sm text-muted-foreground">
            Calendario anual de reuniones programadas de comités
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {aniosDisponibles.map((anio) => (
                <SelectItem key={anio} value={anio.toString()}>
                  {anio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={generarCronograma} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.realizadas}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.programadas}</div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Reprogramadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.reprogramadas}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cumplimiento}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Cronograma por Mes */}
      <div className="space-y-4">
        {cronogramaPorMes.map((item) => {
          if (item.reuniones.length === 0) return null;

          return (
            <Card key={item.mesNum}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{item.mes} {selectedYear}</span>
                  <Badge variant="outline">{item.reuniones.length} reuniones</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {item.reuniones.map((reunion) => {
                    const EstadoIcon = getEstadoIcon(reunion.estado);
                    return (
                      <div
                        key={reunion.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <EstadoIcon
                            className={`h-5 w-5 ${
                              reunion.estado === 'REALIZADA'
                                ? 'text-green-600'
                                : reunion.estado === 'CANCELADA'
                                ? 'text-red-600'
                                : reunion.estado === 'REPROGRAMADA'
                                ? 'text-orange-600'
                                : 'text-blue-600'
                            }`}
                          />
                          <div>
                            <p className="font-medium">{reunion.comiteNombre}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(reunion.fechaProgramada), 'PPP', { locale: es })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={getEstadoColor(reunion.estado)}>
                            {reunion.estado}
                          </Badge>
                          {reunion.actaId && (
                            <Badge variant="outline" className="text-xs">
                              Acta #{reunion.actaId}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cronograma.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay reuniones programadas para {selectedYear}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
