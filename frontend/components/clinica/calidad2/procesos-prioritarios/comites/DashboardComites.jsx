'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useCalidad2Comites } from '@/hooks/useCalidad2Comites';
import { useCalidad2Actas } from '@/hooks/useCalidad2Actas';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Dashboard para módulo de Comités
 * Muestra estadísticas, actas recientes, próximas reuniones
 */
export default function DashboardComites() {
  const { comites, loading: loadingComites } = useCalidad2Comites();
  const { actas, loading: loadingActas } = useCalidad2Actas();

  if (loadingComites && !comites.length) {
    return (
      <div className="space-y-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
      </div>
    );
  }

  // Actas recientes (últimas 5)
  const actasRecientes = [...actas]
    .sort((a, b) => new Date(b.fechaReunion) - new Date(a.fechaReunion))
    .slice(0, 5);

  // Actas pendientes de aprobación
  const actasPendientesAprobacion = actas.filter((a) => !a.aprobada);

  // Próximas reuniones (basadas en cronograma)
  const proximasReuniones = [];
  const hoy = new Date();
  comites.forEach((comite) => {
    if (comite.cronograma) {
      comite.cronograma.forEach((item) => {
        const fechaReunion = new Date(item.fechaProgramada);
        if (fechaReunion > hoy && item.estado === 'PROGRAMADA') {
          proximasReuniones.push({
            ...item,
            comiteNombre: comite.nombre,
            comiteTipo: comite.tipo,
          });
        }
      });
    }
  });
  proximasReuniones.sort((a, b) => new Date(a.fechaProgramada) - new Date(b.fechaProgramada));

  // Comités activos por tipo
  const comitesPorTipo = comites.reduce((acc, comite) => {
    acc[comite.tipo] = (acc[comite.tipo] || 0) + 1;
    return acc;
  }, {});

  // Estadísticas de cumplimiento
  const totalActasAnio = actas.filter((a) => {
    const anioActa = new Date(a.fechaReunion).getFullYear();
    return anioActa === new Date().getFullYear();
  }).length;

  const actasAprobadasAnio = actas.filter((a) => {
    const anioActa = new Date(a.fechaReunion).getFullYear();
    return anioActa === new Date().getFullYear() && a.aprobada;
  }).length;

  const getTipoLabel = (tipo) => {
    const labels = {
      SEGURIDAD_PACIENTE: 'Seguridad del Paciente',
      HISTORIA_CLINICA: 'Historia Clínica',
      INFECCIONES: 'Infecciones',
      ETICA_ATENCION_USUARIO: 'Ética y Atención al Usuario',
      CALIDAD: 'Calidad',
      VICTIMAS_VIOLENCIA_SEXUAL: 'Víctimas Violencia Sexual',
      AMBIENTAL: 'Ambiental',
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Comités Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comites.length}</div>
            <p className="text-xs text-muted-foreground">Según Res. 2003/2014</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              Actas {new Date().getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalActasAnio}</div>
            <p className="text-xs text-muted-foreground">{actasAprobadasAnio} aprobadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Pendientes Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {actasPendientesAprobacion.length}
            </div>
            <p className="text-xs text-muted-foreground">Actas por aprobar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Próximas Reuniones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {proximasReuniones.slice(0, 5).length}
            </div>
            <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Próximas Reuniones */}
      {proximasReuniones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Próximas Reuniones Programadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {proximasReuniones.slice(0, 5).map((reunion) => {
                const diasHastaReunion = Math.ceil(
                  (new Date(reunion.fechaProgramada) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={reunion.id}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100"
                  >
                    <div>
                      <p className="font-medium text-sm">{reunion.comiteNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(reunion.fechaProgramada), 'PPP', { locale: es })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-purple-700 border-purple-300">
                      En {diasHastaReunion} días
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actas Recientes y Pendientes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Actas Recientes */}
        {actasRecientes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Actas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {actasRecientes.map((acta) => (
                  <div
                    key={acta.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">Acta {acta.numeroActa}</p>
                        {acta.aprobada && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(acta.fechaReunion), 'PPP', { locale: es })}
                      </p>
                    </div>
                    {acta.quorum && (
                      <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
                        Quórum
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actas Pendientes de Aprobación */}
        {actasPendientesAprobacion.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Actas Pendientes de Aprobación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {actasPendientesAprobacion.slice(0, 5).map((acta) => (
                  <div
                    key={acta.id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">Acta {acta.numeroActa}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(acta.fechaReunion), 'PPP', { locale: es })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      Pendiente
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comités por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Comités por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(comitesPorTipo).map(([tipo, count]) => (
              <div key={tipo} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-sm">{getTipoLabel(tipo)}</p>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
