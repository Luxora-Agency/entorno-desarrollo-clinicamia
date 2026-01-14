'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BuscadorPacientesHCE from './hce/BuscadorPacientesHCE';
import PanelPacienteHCE from './hce/PanelPacienteHCE';
import TabEvolucionesSOAP from './hce/TabEvolucionesSOAP';
import TabNotasEnfermeria from './hce/TabNotasEnfermeria';
import TabSignosVitales from './hce/TabSignosVitales';
import TabDiagnosticos from './hce/TabDiagnosticos';
import TabAlertas from './hce/TabAlertas';
import TabInterconsultas from './hce/TabInterconsultas';
import TabProcedimientos from './hce/TabProcedimientos';
import TabPrescripciones from './hce/TabPrescripciones';
import TabImagenologia from './hce/TabImagenologia';
import TabLaboratorio from './hce/TabLaboratorio';
import TabTimeline from './hce/TabTimeline';
import TabUrgencias from './hce/TabUrgencias';
import TabHospitalizaciones from './hce/TabHospitalizaciones';
import TabCirugias from './hce/TabCirugias';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileHeart, FileDown, Loader2, ArrowLeft, Eye, Shield, FileText, Calendar, X } from 'lucide-react';
import { getAuthToken } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function HCEModule({ user }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteId = searchParams.get('pacienteId');
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [descargandoPDF, setDescargandoPDF] = useState(false);

  // Estados para modal de descarga
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [tipoDescarga, setTipoDescarga] = useState('completa'); // 'completa' o 'rango'
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const abrirModalDescarga = () => {
    // Establecer fechas por defecto (último año)
    const hoy = new Date();
    const hace1Anio = new Date();
    hace1Anio.setFullYear(hace1Anio.getFullYear() - 1);

    setFechaHasta(hoy.toISOString().split('T')[0]);
    setFechaDesde(hace1Anio.toISOString().split('T')[0]);
    setTipoDescarga('completa');
    setShowDownloadModal(true);
  };

  const descargarPDF = async () => {
    if (!pacienteId) return;

    try {
      setDescargandoPDF(true);
      setShowDownloadModal(false);

      const token = getAuthToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Construir URL con parámetros de fecha si es rango
      let url = `${apiUrl}/hce/${pacienteId}/pdf`;
      if (tipoDescarga === 'rango' && fechaDesde && fechaHasta) {
        url += `?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      // Obtener el blob del PDF
      const blob = await response.blob();

      // Crear URL y descargar
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;

      // Obtener nombre del archivo desde Content-Disposition o usar default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `HCE_${paciente?.documento || pacienteId}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF de la Historia Clínica');
    } finally {
      setDescargandoPDF(false);
    }
  };

  useEffect(() => {
    const fetchPaciente = async () => {
      if (!pacienteId) {
        setLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        
        const response = await fetch(`${apiUrl}/pacientes/${pacienteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setPaciente(result.data?.paciente || result.data || result);
        }
      } catch (error) {
        console.error('Error al cargar paciente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaciente();
  }, [pacienteId]);

  const handleSelectPaciente = (id) => {
    router.push(`/?module=hce&pacienteId=${id}`);
  };

  // Mostrar buscador si no hay paciente seleccionado
  if (!pacienteId) {
    return (
      <div className="p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow-lg">
            <FileHeart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historia Clínica Electrónica (HCE)</h1>
            <p className="text-sm text-gray-600">Módulo de Gestión Clínica y Documentación Médica</p>
          </div>
        </div>
        <BuscadorPacientesHCE onSelectPaciente={handleSelectPaciente} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Cargando información del paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow-lg">
              <FileHeart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historia Clínica Electrónica (HCE)</h1>
              <p className="text-sm text-gray-600">Documentación Clínica del Paciente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pacienteId && (
              <Button
                variant="outline"
                onClick={() => router.push('/?module=hce')}
                className="border-gray-300 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Buscar Paciente
              </Button>
            )}
            {paciente && (
              <Button
                onClick={abrirModalDescarga}
                disabled={descargandoPDF}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
              >
                {descargandoPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Descargar HCE
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {paciente && (
          <div className="space-y-6">
            {/* Panel Superior del Paciente */}
            <PanelPacienteHCE paciente={paciente} />

            {/* Barra de Cumplimiento Normativo */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border rounded-lg shadow-sm">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  <span>Res. 1995/1999</span>
                </span>
                <span className="hidden md:flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ley 2015/2020</span>
                </span>
                <span className="hidden lg:flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Res. 866/2021</span>
                </span>
              </div>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                HCE Conforme a Normatividad Colombiana
              </Badge>
            </div>

            {/* Contenido Principal con Tabs */}
            <Tabs defaultValue="timeline" className="w-full">
              <div className="overflow-x-auto pb-2 -mb-2">
                <TabsList className="inline-flex w-max min-w-full h-auto bg-white border shadow-sm p-1 gap-1">
                  <TabsTrigger value="timeline" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="evoluciones" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Evoluciones
                  </TabsTrigger>
                  <TabsTrigger value="notas-enfermeria" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
                    Notas Enfermería
                  </TabsTrigger>
                  <TabsTrigger value="signos-vitales" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Signos Vitales
                  </TabsTrigger>
                  <TabsTrigger value="diagnosticos" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Diagnósticos
                  </TabsTrigger>
                  <TabsTrigger value="alertas" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Alertas
                  </TabsTrigger>
                  <TabsTrigger value="interconsultas" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Interconsultas
                  </TabsTrigger>
                  <TabsTrigger value="procedimientos" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Procedimientos
                  </TabsTrigger>
                  <TabsTrigger value="laboratorio" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">
                    Laboratorio
                  </TabsTrigger>
                  <TabsTrigger value="imagenologia" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-700">
                    Imagenología
                  </TabsTrigger>
                  <TabsTrigger value="prescripciones" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                    Prescripciones
                  </TabsTrigger>
                  <TabsTrigger value="urgencias" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                    Urgencias
                  </TabsTrigger>
                  <TabsTrigger value="hospitalizaciones" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
                    Hospitalizaciones
                  </TabsTrigger>
                  <TabsTrigger value="cirugias" className="text-xs lg:text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                    Cirugías
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="timeline" className="mt-6">
                <TabTimeline pacienteId={pacienteId} admisionId={paciente?.admisionActual?.id} />
              </TabsContent>

              <TabsContent value="evoluciones" className="mt-6">
                <TabEvolucionesSOAP pacienteId={pacienteId} paciente={paciente} user={user} />
              </TabsContent>

              <TabsContent value="notas-enfermeria" className="mt-6">
                <TabNotasEnfermeria pacienteId={pacienteId} />
              </TabsContent>

              <TabsContent value="signos-vitales" className="mt-6">
                <TabSignosVitales pacienteId={pacienteId} paciente={paciente} user={user} />
              </TabsContent>

              <TabsContent value="diagnosticos" className="mt-6">
                <TabDiagnosticos pacienteId={pacienteId} paciente={paciente} user={user} />
              </TabsContent>

              <TabsContent value="alertas" className="mt-6">
                <TabAlertas pacienteId={pacienteId} paciente={paciente} user={user} />
              </TabsContent>

              <TabsContent value="interconsultas" className="mt-6">
                <TabInterconsultas pacienteId={pacienteId} admisionId={paciente?.admisionActual?.id} user={user} />
              </TabsContent>

              <TabsContent value="procedimientos" className="mt-6">
                <TabProcedimientos pacienteId={pacienteId} admisionId={paciente?.admisionActual?.id} user={user} />
              </TabsContent>

              <TabsContent value="prescripciones" className="mt-6">
                <TabPrescripciones pacienteId={pacienteId} admisionId={paciente?.admisionActual?.id} user={user} />
              </TabsContent>

              <TabsContent value="laboratorio" className="mt-6">
                <TabLaboratorio pacienteId={pacienteId} admisionId={paciente?.admisionActual?.id} user={user} />
              </TabsContent>

              <TabsContent value="imagenologia" className="mt-6">
                <TabImagenologia pacienteId={pacienteId} />
              </TabsContent>

              <TabsContent value="urgencias" className="mt-6">
                <TabUrgencias pacienteId={pacienteId} />
              </TabsContent>

              <TabsContent value="hospitalizaciones" className="mt-6">
                <TabHospitalizaciones pacienteId={pacienteId} />
              </TabsContent>

              <TabsContent value="cirugias" className="mt-6">
                <TabCirugias pacienteId={pacienteId} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Modal de selección de rango de fechas */}
        <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-red-600" />
                Descargar Historia Clínica
              </DialogTitle>
              <DialogDescription>
                Seleccione el rango de información que desea incluir en el PDF
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <RadioGroup value={tipoDescarga} onValueChange={setTipoDescarga} className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="completa" id="completa" />
                  <Label htmlFor="completa" className="flex-1 cursor-pointer">
                    <div className="font-medium">Historia Clínica Completa</div>
                    <div className="text-sm text-gray-500">Incluye toda la información del paciente desde su registro</div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="rango" id="rango" />
                  <Label htmlFor="rango" className="flex-1 cursor-pointer">
                    <div className="font-medium">Rango de Fechas</div>
                    <div className="text-sm text-gray-500">Solo información dentro del período seleccionado</div>
                  </Label>
                </div>
              </RadioGroup>

              {tipoDescarga === 'rango' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fechaDesde" className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Desde
                      </Label>
                      <Input
                        type="date"
                        id="fechaDesde"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        max={fechaHasta || undefined}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fechaHasta" className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Hasta
                      </Label>
                      <Input
                        type="date"
                        id="fechaHasta"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        min={fechaDesde || undefined}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full"
                      />
                    </div>
                  </div>
                  {fechaDesde && fechaHasta && (
                    <p className="text-xs text-gray-500 text-center">
                      Período: {new Date(fechaDesde + 'T00:00:00').toLocaleDateString('es-CO')} - {new Date(fechaHasta + 'T00:00:00').toLocaleDateString('es-CO')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDownloadModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={descargarPDF}
                disabled={tipoDescarga === 'rango' && (!fechaDesde || !fechaHasta)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Generar PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
