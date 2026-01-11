'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  FileText,
  FolderOpen,
  ClipboardList,
  FileSpreadsheet,
  Archive,
  ExternalLink,
} from 'lucide-react';
import RegistroEntradaSalida from './RegistroEntradaSalida';

/**
 * Tab de Formatos Operativos de Historia Clínica
 *
 * Gestión de:
 * - Registro de entrada/salida de HC físicas
 * - Formatos descargables
 * - Plan de contingencia
 * - Plantillas y documentos de referencia
 */
export default function FormatosOperativosTab() {
  const [activeSubTab, setActiveSubTab] = useState('registro');

  // Formatos disponibles para descarga
  const formatosDescargables = [
    {
      id: 'hc-fr-001',
      nombre: 'HC-FR-001 - Registro Entrada/Salida HC',
      descripcion: 'Control de préstamos de historias clínicas físicas',
      tipo: 'Excel',
      icon: FileSpreadsheet,
      color: 'text-green-600',
      archivo: '/formatos/HC-FR-001-Registro-Entrada-Salida.xlsx',
    },
    {
      id: 'plan-contingencia',
      nombre: 'Plan de Contingencia HC',
      descripcion: 'Formato de historia clínica en caso de falla del sistema',
      tipo: 'Word',
      icon: FileText,
      color: 'text-blue-600',
      archivo: '/formatos/Plan-Contingencia-HC.docx',
    },
    {
      id: 'hc-fr-002',
      nombre: 'HC-FR-002 - Solicitud de HC',
      descripcion: 'Formato para solicitar historia clínica física',
      tipo: 'PDF',
      icon: FileText,
      color: 'text-red-600',
      archivo: '/formatos/HC-FR-002-Solicitud-HC.pdf',
    },
    {
      id: 'hc-fr-003',
      nombre: 'HC-FR-003 - Inventario HC',
      descripcion: 'Formato para inventario de historias clínicas físicas',
      tipo: 'Excel',
      icon: FileSpreadsheet,
      color: 'text-green-600',
      archivo: '/formatos/HC-FR-003-Inventario-HC.xlsx',
    },
  ];

  const manuales = [
    {
      id: 'manual-diligenciamiento',
      nombre: 'Manual de Manejo y Diligenciamiento de HC',
      descripcion: 'Guía completa para el correcto diligenciamiento de historias clínicas',
      tipo: 'PDF',
      paginas: '45 páginas',
      version: '3.0',
    },
    {
      id: 'procedimiento-consentimiento',
      nombre: 'Procedimiento Consentimiento Informado',
      descripcion: 'Procedimiento para aplicación de consentimientos informados',
      tipo: 'PDF',
      paginas: '12 páginas',
      version: '2.1',
    },
    {
      id: 'resolucion-1995',
      nombre: 'Resolución 1995/1999 - Ministerio de Salud',
      descripcion: 'Normativa colombiana sobre historias clínicas',
      tipo: 'PDF',
      paginas: '28 páginas',
      version: 'Oficial',
    },
  ];

  const handleDescargarFormato = (formato) => {
    // En producción, esto descargaría el archivo real
    console.log('Descargando formato:', formato.nombre);
    // window.open(formato.archivo, '_blank');
  };

  const handleDescargarManual = (manual) => {
    console.log('Descargando manual:', manual.nombre);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Formatos Operativos</h3>
        <p className="text-sm text-muted-foreground">
          Gestión de movimientos de HC físicas, formatos y documentos de referencia
        </p>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registro" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden md:inline">Registro HC</span>
          </TabsTrigger>
          <TabsTrigger value="formatos" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden md:inline">Formatos</span>
          </TabsTrigger>
          <TabsTrigger value="manuales" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden md:inline">Manuales</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Registro de Entrada/Salida */}
        <TabsContent value="registro">
          <RegistroEntradaSalida />
        </TabsContent>

        {/* Tab: Formatos Descargables */}
        <TabsContent value="formatos">
          <div className="space-y-4">
            {/* Descripción */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Formatos Oficiales de Historia Clínica
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Descargue los formatos en blanco para imprimir o completar. Estos formatos
                      son para uso en contingencias o respaldo físico.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Formatos */}
            <div className="grid gap-4 md:grid-cols-2">
              {formatosDescargables.map((formato) => {
                const Icon = formato.icon;
                return (
                  <Card key={formato.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className={`h-5 w-5 ${formato.color}`} />
                        {formato.nombre}
                      </CardTitle>
                      <CardDescription>{formato.descripcion}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {formato.tipo}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDescargarFormato(formato)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Descargar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Formato Especial: Plan de Contingencia */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-orange-600" />
                  Plan de Contingencia - Historia Clínica
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Formato de respaldo para registro manual de historias clínicas en caso de falla
                  del sistema electrónico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border border-orange-200">
                    <p className="text-sm font-medium mb-2">¿Cuándo usar este formato?</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Falla del sistema de historia clínica electrónica</li>
                      <li>Pérdida de conectividad a internet prolongada</li>
                      <li>Mantenimiento programado del sistema</li>
                      <li>Emergencias o desastres naturales</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded border border-orange-200">
                    <p className="text-sm font-medium mb-2">Instrucciones importantes:</p>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Imprimir el formato antes de la contingencia</li>
                      <li>Completar todos los campos obligatorios a mano</li>
                      <li>Digitalizar en el sistema cuando se restablezca</li>
                      <li>Archivar el formato físico según normativa</li>
                    </ol>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleDescargarFormato({
                          nombre: 'Plan de Contingencia HC',
                          archivo: '/formatos/Plan-Contingencia-HC.docx',
                        })
                      }
                      className="gap-2 bg-orange-600 hover:bg-orange-700"
                    >
                      <Download className="h-4 w-4" />
                      Descargar Formato Word
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleDescargarFormato({
                          nombre: 'Plan de Contingencia HC (PDF)',
                          archivo: '/formatos/Plan-Contingencia-HC.pdf',
                        })
                      }
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Descargar PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Manuales y Documentos de Referencia */}
        <TabsContent value="manuales">
          <div className="space-y-4">
            {/* Descripción */}
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FolderOpen className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      Documentos Normativos y de Referencia
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      Acceda a los manuales oficiales, procedimientos y normativa vigente para el
                      correcto manejo de historias clínicas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Manuales */}
            <div className="space-y-3">
              {manuales.map((manual) => (
                <Card key={manual.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="bg-purple-100 p-2 rounded">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{manual.nombre}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {manual.descripcion}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="bg-gray-100 px-2 py-1 rounded">{manual.tipo}</span>
                            <span>{manual.paginas}</span>
                            <span>Versión {manual.version}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDescargarManual(manual)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Descargar
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Ver Online
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Enlaces Externos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enlaces de Referencia</CardTitle>
                <CardDescription>Recursos externos de normativa vigente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <a
                    href="https://www.minsalud.gov.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        Ministerio de Salud - Resoluciones HC
                      </span>
                    </div>
                  </a>

                  <a
                    href="https://www.supersalud.gov.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        Supersalud - Normativa Calidad HC
                      </span>
                    </div>
                  </a>

                  <a
                    href="#"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        Habilitación - Requisitos HC
                      </span>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
