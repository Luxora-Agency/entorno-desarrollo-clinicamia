'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileHeart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PanelPaciente from './admisiones/PanelPaciente';
import TabInformacion from './admisiones/TabInformacion';
import TabCitasPaciente from './paciente/TabCitasPaciente';
import TabExamenesProcedimientosPaciente from './paciente/TabExamenesProcedimientosPaciente';
import TabHospitalizacionesPaciente from './paciente/TabHospitalizacionesPaciente';
import TabTimelinePaciente from './paciente/TabTimelinePaciente';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VerPaciente({ pacienteId, onBack, user }) {
  const router = useRouter();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    const fetchPaciente = async () => {
      if (!pacienteId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        
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

  const handleEdit = () => {
    router.push(`?module=agregar-paciente&pacienteId=${pacienteId}`);
  };

  const handleGoToHCE = () => {
    router.push(`?module=hce&pacienteId=${pacienteId}`);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Cargando información del paciente...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Paciente no encontrado</p>
          {onBack && (
            <Button onClick={onBack} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="w-full">
        {/* Botón volver */}
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Pacientes
          </Button>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Información del Paciente
        </h1>

        <div className="space-y-6">
          {/* Panel Superior del Paciente */}
          <PanelPaciente 
            paciente={paciente} 
            onEdit={handleEdit}
            onGoToHCE={handleGoToHCE}
          />

          {/* Contenido Principal con Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
              <TabsTrigger value="timeline" className="text-xs lg:text-sm">
                Timeline HCE
              </TabsTrigger>
              <TabsTrigger value="informacion" className="text-xs lg:text-sm">
                Información
              </TabsTrigger>
              <TabsTrigger value="citas" className="text-xs lg:text-sm">
                Citas Médicas
              </TabsTrigger>
              <TabsTrigger value="examenes" className="text-xs lg:text-sm">
                Exámenes y Procedimientos
              </TabsTrigger>
              <TabsTrigger value="hospitalizaciones" className="text-xs lg:text-sm">
                Hospitalizaciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-6">
              <TabTimelinePaciente pacienteId={pacienteId} />
            </TabsContent>

            <TabsContent value="informacion" className="mt-6">
              <TabInformacion paciente={paciente} />
            </TabsContent>

            <TabsContent value="citas" className="mt-6">
              <TabCitasPaciente pacienteId={pacienteId} user={user} />
            </TabsContent>

            <TabsContent value="examenes" className="mt-6">
              <TabExamenesProcedimientosPaciente pacienteId={pacienteId} user={user} />
            </TabsContent>

            <TabsContent value="hospitalizaciones" className="mt-6">
              <TabHospitalizacionesPaciente 
                pacienteId={pacienteId} 
                paciente={paciente}
                user={user}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
