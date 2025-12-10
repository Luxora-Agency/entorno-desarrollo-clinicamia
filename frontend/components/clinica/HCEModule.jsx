'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BuscadorPacientesHCE from './hce/BuscadorPacientesHCE';
import PanelPacienteHCE from './hce/PanelPacienteHCE';
import TabEvolucionesSOAP from './hce/TabEvolucionesSOAP';
import TabSignosVitales from './hce/TabSignosVitales';
import TabDiagnosticos from './hce/TabDiagnosticos';
import TabAlertas from './hce/TabAlertas';
import TabInterconsultas from './hce/TabInterconsultas';
import TabProcedimientos from './hce/TabProcedimientos';
import TabPrescripciones from './hce/TabPrescripciones';
import TabTimeline from './hce/TabTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileHeart } from 'lucide-react';

export default function HCEModule({ user }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteId = searchParams.get('pacienteId');
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaciente = async () => {
      if (!pacienteId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
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
        </div>

        {paciente && (
          <div className="space-y-6">
            {/* Panel Superior del Paciente */}
            <PanelPacienteHCE paciente={paciente} />

            {/* Contenido Principal con Tabs */}
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto bg-white border shadow-sm">
                <TabsTrigger value="timeline" className="text-xs lg:text-sm data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="evoluciones" className="text-xs lg:text-sm data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Evoluciones
                </TabsTrigger>
                <TabsTrigger value="signos-vitales" className="text-xs lg:text-sm data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Signos Vitales
                </TabsTrigger>
                <TabsTrigger value="diagnosticos" className="text-xs lg:text-sm data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Diagnósticos
                </TabsTrigger>
                <TabsTrigger value="alertas" className="text-xs lg:text-sm data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Alertas
                </TabsTrigger>
                <TabsTrigger value="interconsultas" className="text-xs lg:text-sm data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Interconsultas
                </TabsTrigger>
                <TabsTrigger value="procedimientos" className="text-xs lg:text-sm data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Procedimientos
                </TabsTrigger>
                <TabsTrigger value="prescripciones" className="text-xs lg:text-sm data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                  Prescripciones
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-6">
                <TabTimeline pacienteId={pacienteId} admisionId={paciente?.admisionActual?.id} />
              </TabsContent>

              <TabsContent value="evoluciones" className="mt-6">
                <TabEvolucionesSOAP pacienteId={pacienteId} paciente={paciente} user={user} />
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
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
