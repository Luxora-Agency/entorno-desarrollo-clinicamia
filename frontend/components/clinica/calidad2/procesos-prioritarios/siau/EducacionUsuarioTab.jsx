'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Calendar, FileText, Users, Plus } from 'lucide-react';

/**
 * Tab para gestión de Educación al Usuario
 * Incluye cronogramas de capacitación, materiales educativos y protocolos
 */
export default function EducacionUsuarioTab() {
  // Esta es una implementación inicial - se puede expandir según necesidades

  const materialEducativos = [
    'Derechos y deberes del paciente',
    'Uso responsable de servicios de salud',
    'Autocuidado y prevención',
    'Consentimiento informado',
    'PQRSF y canales de atención',
    'Seguridad del paciente',
  ];

  const temasCapacitacion = [
    { tema: 'Derechos y Deberes', frecuencia: 'Trimestral', responsable: 'SIAU' },
    { tema: 'Consentimiento Informado', frecuencia: 'Semestral', responsable: 'Calidad' },
    { tema: 'Seguridad del Paciente', frecuencia: 'Trimestral', responsable: 'Calidad' },
    { tema: 'Sistema PQRSF', frecuencia: 'Anual', responsable: 'SIAU' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            Educación al Usuario
          </h3>
          <p className="text-sm text-muted-foreground">
            Gestión de programas educativos para pacientes y usuarios
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Actividad
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Materiales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materialEducativos.length}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Capacitaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{temasCapacitacion.length}</div>
            <p className="text-xs text-muted-foreground">Programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Este año</p>
          </CardContent>
        </Card>
      </div>

      {/* Materiales Educativos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Materiales Educativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {materialEducativos.map((material, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-sm">{material}</p>
                </div>
                <Button variant="ghost" size="sm">Ver</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cronograma de Capacitaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Cronograma de Capacitaciones {new Date().getFullYear()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {temasCapacitacion.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.tema}</p>
                  <p className="text-sm text-muted-foreground">
                    Responsable: {item.responsable}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{item.frecuencia}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Próximas Actividades */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            Próximas Actividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay actividades programadas próximamente.
          </p>
          <Button variant="outline" size="sm" className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Programar Actividad
          </Button>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Importancia de la Educación al Usuario
              </p>
              <p className="text-blue-700">
                La educación al usuario es fundamental para promover el autocuidado, el uso
                responsable de los servicios de salud y la participación activa en su atención.
                Incluye información sobre derechos, deberes, consentimiento informado y canales de
                comunicación con la institución.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
