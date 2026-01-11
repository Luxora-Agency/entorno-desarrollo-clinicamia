'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, FileText, AlertCircle, ExternalLink } from 'lucide-react';

/**
 * Tab para gestión de Prácticas Seguras
 * Muestra protocolos de seguridad del paciente
 */
export default function PracticasSeguras() {
  // Prácticas seguras según Resolución 2003/2014 y Programa de Seguridad del Paciente
  const practicasSeguras = [
    {
      codigo: 'PP-PT-003',
      nombre: 'Protocolo de Identificación Correcta del Paciente',
      categoria: 'IDENTIFICACION',
      vigente: true,
    },
    {
      codigo: 'PP-PT-004',
      nombre: 'Protocolo de Higiene de Manos',
      categoria: 'INFECCIONES',
      vigente: true,
    },
    {
      codigo: 'PP-PT-005',
      nombre: 'Protocolo de Prevención de Caídas',
      categoria: 'CAIDAS',
      vigente: true,
    },
    {
      codigo: 'PP-PT-006',
      nombre: 'Protocolo de Seguridad en Procedimientos Quirúrgicos',
      categoria: 'CIRUGIA_SEGURA',
      vigente: true,
    },
    {
      codigo: 'PP-PT-007',
      nombre: 'Protocolo de Administración Segura de Medicamentos',
      categoria: 'MEDICAMENTOS',
      vigente: true,
    },
    {
      codigo: 'PP-PT-008',
      nombre: 'Protocolo de Prevención de Úlceras por Presión',
      categoria: 'ULCERAS',
      vigente: true,
    },
    {
      codigo: 'PP-PT-009',
      nombre: 'Protocolo de Comunicación Efectiva',
      categoria: 'COMUNICACION',
      vigente: true,
    },
  ];

  const getCategoriaColor = (categoria) => {
    const colors = {
      IDENTIFICACION: 'blue',
      INFECCIONES: 'purple',
      CAIDAS: 'orange',
      CIRUGIA_SEGURA: 'green',
      MEDICAMENTOS: 'red',
      ULCERAS: 'yellow',
      COMUNICACION: 'cyan',
    };
    return colors[categoria] || 'default';
  };

  const getCategoriaLabel = (categoria) => {
    const labels = {
      IDENTIFICACION: 'Identificación de Pacientes',
      INFECCIONES: 'Prevención de Infecciones',
      CAIDAS: 'Prevención de Caídas',
      CIRUGIA_SEGURA: 'Cirugía Segura',
      MEDICAMENTOS: 'Medicamentos Seguros',
      ULCERAS: 'Prevención de Úlceras',
      COMUNICACION: 'Comunicación Efectiva',
    };
    return labels[categoria] || categoria;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Prácticas Seguras
          </h3>
          <p className="text-sm text-muted-foreground">
            Protocolos y guías para la seguridad del paciente
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-900 mb-1">
                Prácticas Internacionales de Seguridad del Paciente
              </p>
              <p className="text-green-700">
                Las prácticas seguras son intervenciones basadas en evidencia que reducen el riesgo
                de eventos adversos relacionados con la atención en salud. Estos protocolos se
                encuentran disponibles en el módulo de <strong>Protocolos</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Protocolos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{practicasSeguras.length}</div>
            <p className="text-xs text-muted-foreground">Prácticas seguras</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Vigentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {practicasSeguras.filter((p) => p.vigente).length}
            </div>
            <p className="text-xs text-muted-foreground">Actualizadas</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {[...new Set(practicasSeguras.map((p) => p.categoria))].length}
            </div>
            <p className="text-xs text-muted-foreground">Áreas cubiertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Prácticas Seguras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Protocolos de Prácticas Seguras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {practicasSeguras.map((practica) => (
              <div
                key={practica.codigo}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono">
                      {practica.codigo}
                    </Badge>
                    <Badge variant={getCategoriaColor(practica.categoria)}>
                      {getCategoriaLabel(practica.categoria)}
                    </Badge>
                    {practica.vigente && (
                      <Badge variant="success" className="text-xs">
                        Vigente
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium">{practica.nombre}</p>
                </div>

                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Protocolo
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paquetes Instruccionales */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-600" />
            Paquetes Instruccionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Materiales educativos para el personal sobre prácticas seguras
            </p>

            {[
              'Paquete: Identificación de Pacientes',
              'Paquete: Higiene de Manos',
              'Paquete: Prevención de Caídas',
              'Paquete: Cirugía Segura - Lista de Verificación',
              'Paquete: Administración Segura de Medicamentos',
              'Paquete: Prevención de Úlceras por Presión',
              'Paquete: Comunicación SBAR',
              'Paquete: Cultura de Seguridad',
            ].map((paquete, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-purple-50 rounded border border-purple-100"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <p className="text-sm font-medium">{paquete}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-600">
                  Ver PDF
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enlace al Módulo de Protocolos */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900 mb-1">Gestión de Protocolos</p>
              <p className="text-sm text-blue-700">
                Los protocolos de prácticas seguras se gestionan en el módulo de Protocolos,
                donde se pueden visualizar, aprobar, actualizar y marcar como obsoletos.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Ir a Protocolos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
