'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, FileText } from 'lucide-react';
import PanelResumenClinico from './hce/PanelResumenClinico';
import TabEvolucionesSOAP from './hce/TabEvolucionesSOAP';
import TabSignosVitales from './hce/TabSignosVitales';
import TabDiagnosticos from './hce/TabDiagnosticos';
import TabAlertas from './hce/TabAlertas';
import TabTrazabilidad from './hce/TabTrazabilidad';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HCEModule({ user }) {
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPacientes();
  }, []);

  const loadPacientes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/pacientes?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPacientes(data.data || []);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPaciente = (paciente) => {
    setPacienteSeleccionado(paciente);
  };

  const pacientesFiltrados = pacientes.filter((p) =>
    `${p.nombre} ${p.apellido} ${p.cedula}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Si no hay paciente seleccionado, mostrar buscador
  if (!pacienteSeleccionado) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Historia Clínica Electrónica (HCE)</h1>
          <p className="text-gray-600">Gestión completa de registros clínicos y evoluciones médicas</p>
        </div>

        <Card className="border-emerald-200 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Paciente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, apellido o cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Cargando pacientes...</p>
              </div>
            ) : searchTerm.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pacientesFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>No se encontraron pacientes</p>
                  </div>
                ) : (
                  pacientesFiltrados.map((paciente) => (
                    <div
                      key={paciente.id}
                      onClick={() => handleSelectPaciente(paciente)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {paciente.nombre} {paciente.apellido}
                          </p>
                          <p className="text-sm text-gray-600">CC: {paciente.cedula}</p>
                          <p className="text-xs text-gray-500">
                            {paciente.fechaNacimiento && `Edad: ${calcularEdad(paciente.fechaNacimiento)} años`}
                          </p>
                        </div>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          Ver HCE
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-40" />
                <p className="text-lg">Busque un paciente para ver su historia clínica</p>
                <p className="text-sm mt-2">Ingrese nombre, apellido o número de cédula</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de HCE del paciente seleccionado
  return (
    <div className="p-6">
      {/* Botón volver */}
      <Button
        variant="outline"
        onClick={() => setPacienteSeleccionado(null)}
        className="mb-4"
      >
        ← Volver al buscador
      </Button>

      {/* Panel de resumen clínico */}
      <PanelResumenClinico pacienteId={pacienteSeleccionado.id} paciente={pacienteSeleccionado} />

      {/* Tabs de HCE */}
      <Card className="border-emerald-200 shadow-sm mt-6">
        <CardContent className="p-6">
          <Tabs defaultValue="evoluciones" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto">
              <TabsTrigger value="evoluciones" className="text-xs lg:text-sm">
                Evoluciones SOAP
              </TabsTrigger>
              <TabsTrigger value="signos-vitales" className="text-xs lg:text-sm">
                Signos Vitales
              </TabsTrigger>
              <TabsTrigger value="diagnosticos" className="text-xs lg:text-sm">
                Diagnósticos
              </TabsTrigger>
              <TabsTrigger value="alertas" className="text-xs lg:text-sm">
                Alertas
              </TabsTrigger>
              <TabsTrigger value="trazabilidad" className="text-xs lg:text-sm">
                Trazabilidad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="evoluciones" className="mt-6">
              <TabEvolucionesSOAP pacienteId={pacienteSeleccionado.id} paciente={pacienteSeleccionado} user={user} />
            </TabsContent>

            <TabsContent value="signos-vitales" className="mt-6">
              <TabSignosVitales pacienteId={pacienteSeleccionado.id} paciente={pacienteSeleccionado} user={user} />
            </TabsContent>

            <TabsContent value="diagnosticos" className="mt-6">
              <TabDiagnosticos pacienteId={pacienteSeleccionado.id} paciente={pacienteSeleccionado} user={user} />
            </TabsContent>

            <TabsContent value="alertas" className="mt-6">
              <TabAlertas pacienteId={pacienteSeleccionado.id} paciente={pacienteSeleccionado} user={user} />
            </TabsContent>

            <TabsContent value="trazabilidad" className="mt-6">
              <TabTrazabilidad pacienteId={pacienteSeleccionado.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}
