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
import TabOrdenesMedicas from './admisiones/TabOrdenesMedicas';
import TabOrdenesMedicamentos from './admisiones/TabOrdenesMedicamentos';
import TabEgreso from './admisiones/TabEgreso';
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

  const handleEdit = () => {
    // Necesitamos cambiar al módulo de pacientes en modo edición
    window.location.href = `/?module=agregar-paciente&pacienteId=${pacienteId}`;
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

  return (
    <div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Admisiones - Información del Paciente
        </h1>

        {paciente && (
          <div className="space-y-6">
            {/* Panel Superior del Paciente */}
            <PanelPaciente paciente={paciente} onEdit={handleEdit} />

            {/* Contenido Principal con Tabs */}
            <Tabs defaultValue="informacion" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
                <TabsTrigger value="informacion" className="text-xs lg:text-sm">
                  Información
                </TabsTrigger>
                <TabsTrigger value="citas" className="text-xs lg:text-sm">
                  Citas
                </TabsTrigger>
                <TabsTrigger value="admisiones" className="text-xs lg:text-sm">
                  Admisiones
                </TabsTrigger>
                <TabsTrigger value="movimientos" className="text-xs lg:text-sm">
                  Movimientos
                </TabsTrigger>
                <TabsTrigger value="ordenes-medicas" className="text-xs lg:text-sm">
                  Órdenes Médicas
                </TabsTrigger>
                <TabsTrigger value="ordenes-medicamentos" className="text-xs lg:text-sm">
                  Medicamentos
                </TabsTrigger>
                <TabsTrigger value="egreso" className="text-xs lg:text-sm">
                  Egreso
                </TabsTrigger>
                <TabsTrigger value="historia" className="text-xs lg:text-sm">
                  Historia
                </TabsTrigger>
                <TabsTrigger value="facturacion" className="text-xs lg:text-sm">
                  Facturación
                </TabsTrigger>
              </TabsList>

              <TabsContent value="informacion" className="mt-6">
                <TabInformacion paciente={paciente} />
              </TabsContent>

              <TabsContent value="citas" className="mt-6">
                <TabCitas pacienteId={pacienteId} user={user} />
              </TabsContent>

              <TabsContent value="admisiones" className="mt-6">
                <TabAdmisiones pacienteId={pacienteId} user={user} />
              </TabsContent>

              <TabsContent value="movimientos" className="mt-6">
                <TabMovimientos pacienteId={pacienteId} user={user} />
              </TabsContent>

              <TabsContent value="ordenes-medicas" className="mt-6">
                <TabOrdenesMedicas pacienteId={pacienteId} paciente={paciente} />
              </TabsContent>

              <TabsContent value="ordenes-medicamentos" className="mt-6">
                <TabOrdenesMedicamentos pacienteId={pacienteId} paciente={paciente} />
              </TabsContent>

              <TabsContent value="historia" className="mt-6">
                <TabHistoria pacienteId={pacienteId} paciente={paciente} />
              </TabsContent>

              <TabsContent value="facturacion" className="mt-6">
                <TabFacturacion pacienteId={pacienteId} paciente={paciente} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
