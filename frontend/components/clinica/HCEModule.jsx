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
import { FileHeart, FileDown, Loader2 } from 'lucide-react';
import { getAuthToken } from '@/services/api';

export default function HCEModule({ user }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteId = searchParams.get('pacienteId');
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [descargandoPDF, setDescargandoPDF] = useState(false);

  const descargarPDF = async () => {
    if (!pacienteId) return;

    try {
      setDescargandoPDF(true);
      const token = getAuthToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/hce/${pacienteId}/pdf`, {
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
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

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
      window.URL.revokeObjectURL(url);
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
          {paciente && (
            <Button
              onClick={descargarPDF}
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
                  Descargar HCE (PDF)
                </>
              )}
            </Button>
          )}
        </div>

        {paciente && (
          <div className="space-y-6">
            {/* Panel Superior del Paciente */}
            <PanelPacienteHCE paciente={paciente} />

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
      </div>
    </div>
  );
}
