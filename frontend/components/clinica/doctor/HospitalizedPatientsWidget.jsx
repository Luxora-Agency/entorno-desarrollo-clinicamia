'use client';

import { useState, useEffect } from 'react';
import {
  BedDouble, Clock, User, Activity, AlertCircle,
  ChevronRight, RefreshCw, Stethoscope, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper para calcular días de estancia
const calcularDiasEstancia = (fechaIngreso) => {
  if (!fechaIngreso) return 0;
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const diferencia = hoy - ingreso;
  return Math.floor(diferencia / (1000 * 60 * 60 * 24));
};

// Verificar si necesita ronda hoy
const necesitaRondaHoy = (admision) => {
  const ultimaEvolucion = admision.evolucionesClinicas?.[0];
  if (!ultimaEvolucion) return true;
  const fechaEvolucion = new Date(ultimaEvolucion.fechaEvolucion);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fechaEvolucion < hoy;
};

export default function HospitalizedPatientsWidget({
  doctorId,
  onViewAll,
  onSelectPatient,
  className = '',
  maxItems = 4
}) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pendientesRonda: 0 });

  // Cargar pacientes hospitalizados
  useEffect(() => {
    const loadPatients = async () => {
      if (!doctorId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        const response = await fetch(
          `${apiUrl}/admisiones/doctor/${doctorId}?estado=Activa&limit=${maxItems + 1}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // La respuesta de /admisiones/doctor/:doctorId tiene estructura { data, pagination }
            const admisiones = Array.isArray(data.data)
              ? data.data
              : data.data?.data || [];
            setPatients(admisiones.slice(0, maxItems));

            // Calcular estadísticas
            const pendientes = admisiones.filter(necesitaRondaHoy).length;
            setStats({
              total: data.data?.pagination?.total || data.pagination?.total || admisiones.length,
              pendientesRonda: pendientes
            });
          }
        }
      } catch (error) {
        console.error('Error loading hospitalized patients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [doctorId, maxItems]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-0 shadow-sm`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <BedDouble className="h-4 w-4 text-purple-600" />
            </div>
            Pacientes Hospitalizados
            {stats.total > 0 && (
              <Badge variant="secondary" className="text-xs">
                {stats.total}
              </Badge>
            )}
          </CardTitle>
          {stats.pendientesRonda > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {stats.pendientesRonda} pendientes
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pacientes sin evolución hoy</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <BedDouble className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Sin pacientes hospitalizados</p>
            <p className="text-xs text-gray-500 mt-1">Los pacientes aparecerán aquí</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[200px] pr-2">
              <div className="space-y-2">
                {patients.map((admision) => {
                  const paciente = admision.paciente;
                  const diasEstancia = calcularDiasEstancia(admision.fechaIngreso);
                  const necesitaRonda = necesitaRondaHoy(admision);

                  return (
                    <button
                      key={admision.id}
                      onClick={() => onSelectPatient?.(admision)}
                      className={`
                        w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all
                        hover:shadow-sm hover:border-purple-200
                        ${necesitaRonda
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-white border-gray-100 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={`text-xs ${
                          necesitaRonda
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {paciente?.nombre?.charAt(0)}{paciente?.apellido?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {paciente?.nombre} {paciente?.apellido}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3 w-3" />
                            {admision.cama?.codigo || 'Sin asignar'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {diasEstancia}d
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {necesitaRonda && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Stethoscope className="h-4 w-4 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Pendiente ronda médica</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {stats.total > maxItems && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="w-full mt-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                Ver todos ({stats.total})
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
