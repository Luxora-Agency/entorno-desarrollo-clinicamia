'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BuscadorPacientes from './admisiones/BuscadorPacientes';
import PanelPaciente from './admisiones/PanelPaciente';
import TabInformacion from './admisiones/TabInformacion';
import TabCitas from './admisiones/TabCitas';
import TabAdmisiones from './admisiones/TabAdmisiones';
import TabMovimientos from './admisiones/TabMovimientos';
import TabHistoria from './admisiones/TabHistoria';
import TabFacturacion from './admisiones/TabFacturacion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdmisionesView({ user }) {
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
    router.push(`/?module=admisiones&pacienteId=${id}`);
  };

  // Mostrar buscador si no hay paciente seleccionado
  if (!pacienteId) {
    return (
      <div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
        <BuscadorPacientes onSelectPaciente={handleSelectPaciente} />
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
    <div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Información del Paciente
        </h1>

        {paciente && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {paciente.nombre} {paciente.apellido}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Documento:</span>
                <span className="ml-2 text-gray-600">{paciente.cedula}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Email:</span>
                <span className="ml-2 text-gray-600">{paciente.email}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Teléfono:</span>
                <span className="ml-2 text-gray-600">{paciente.telefono}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">EPS:</span>
                <span className="ml-2 text-gray-600">{paciente.eps || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold">
                🚧 Vista en desarrollo - FASE 3 en proceso
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Próximamente: Panel de paciente, tabs de información, citas, admisiones, movimientos, historia clínica y facturación.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
