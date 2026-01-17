'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  History,
  Pill,
  Baby,
  HeartPulse,
  Scissors,
  Users,
  AlertTriangle,
  Loader2,
  FileText
} from 'lucide-react';

// Orden de antecedentes según documento PDF "Resumen de Atención"
const TABS_CONFIG = [
  { id: 'farmacologicos', label: 'Farmacológicos', icon: Pill, color: 'blue' },
  { id: 'ginecoObstetrico', label: 'Gineco-Obstétricos', icon: Baby, color: 'pink' },
  { id: 'patologicos', label: 'Patológicos', icon: HeartPulse, color: 'amber' },
  { id: 'quirurgicos', label: 'Quirúrgicos', icon: Scissors, color: 'purple' },
  { id: 'familiares', label: 'Familiares', icon: Users, color: 'teal' },
  { id: 'alergicos', label: 'Alérgicos', icon: AlertTriangle, color: 'red' },
];

export default function TabAntecedentesConsolidado({ pacienteId, paciente }) {
  const [antecedentes, setAntecedentes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('farmacologicos');

  useEffect(() => {
    if (pacienteId) {
      cargarAntecedentes();
    }
  }, [pacienteId]);

  const cargarAntecedentes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/pacientes/${pacienteId}/antecedentes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAntecedentes(data.data || data);
      }
    } catch (error) {
      console.error('Error cargando antecedentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    ,
      timeZone: 'America/Bogota'
    });
  };

  const getTabCount = (tabId) => {
    if (!antecedentes) return 0;

    switch (tabId) {
      case 'farmacologicos':
        return antecedentes.farmacologicos?.length || 0;
      case 'ginecoObstetrico':
        return antecedentes.ginecoObstetrico ? 1 : 0;
      case 'patologicos':
        return antecedentes.patologicos?.length || 0;
      case 'quirurgicos':
        return antecedentes.quirurgicos?.length || 0;
      case 'familiares':
        return antecedentes.familiares?.length || 0;
      case 'alergicos':
        return antecedentes.alergicos?.length || 0;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-600">Cargando antecedentes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-lg">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Antecedentes del Paciente</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Historia médica completa según normatividad colombiana
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de Antecedentes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 -mb-2">
          <TabsList className="inline-flex w-max min-w-full h-auto bg-white border shadow-sm p-1 gap-1">
            {TABS_CONFIG.map((tab) => {
              const count = getTabCount(tab.id);
              const Icon = tab.icon;

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap data-[state=active]:bg-${tab.color}-100 data-[state=active]:text-${tab.color}-700`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Farmacológicos */}
        <TabsContent value="farmacologicos" className="mt-6">
          <Card>
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Pill className="h-5 w-5" />
                Antecedentes Farmacológicos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {antecedentes?.farmacologicos?.length > 0 ? (
                <div className="space-y-3">
                  {antecedentes.farmacologicos.map((med, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-900">{med.medicamento}</h4>
                          <p className="text-sm text-gray-600">{med.dosis} - {med.frecuencia}</p>
                          {med.indicacion && (
                            <p className="text-sm text-gray-500 mt-1">Indicación: {med.indicacion}</p>
                          )}
                        </div>
                        <Badge variant={med.activo ? 'default' : 'secondary'}>
                          {med.activo ? 'Activo' : 'Suspendido'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No hay antecedentes farmacológicos registrados" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gineco-Obstétricos */}
        <TabsContent value="ginecoObstetrico" className="mt-6">
          <Card>
            <CardHeader className="bg-pink-50">
              <CardTitle className="flex items-center gap-2 text-pink-800">
                <Baby className="h-5 w-5" />
                Antecedentes Gineco-Obstétricos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {antecedentes?.ginecoObstetrico ? (
                <div className="space-y-4">
                  {/* Fórmula Obstétrica */}
                  <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <h4 className="font-semibold text-pink-900 mb-3">Fórmula Obstétrica</h4>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-2xl font-bold text-pink-600">
                          {antecedentes.ginecoObstetrico.gestaciones || 0}
                        </p>
                        <p className="text-xs text-gray-500">Gestaciones</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-2xl font-bold text-pink-600">
                          {antecedentes.ginecoObstetrico.partos || 0}
                        </p>
                        <p className="text-xs text-gray-500">Partos</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-2xl font-bold text-pink-600">
                          {antecedentes.ginecoObstetrico.abortos || 0}
                        </p>
                        <p className="text-xs text-gray-500">Abortos</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-2xl font-bold text-pink-600">
                          {antecedentes.ginecoObstetrico.cesareas || 0}
                        </p>
                        <p className="text-xs text-gray-500">Cesáreas</p>
                      </div>
                    </div>
                  </div>

                  {/* Otros datos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Menarquia</p>
                      <p className="font-semibold">{antecedentes.ginecoObstetrico.menarquia || 'N/A'} años</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">FUM</p>
                      <p className="font-semibold">
                        {antecedentes.ginecoObstetrico.fum
                          ? formatDate(antecedentes.ginecoObstetrico.fum)
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Ciclos</p>
                      <p className="font-semibold">{antecedentes.ginecoObstetrico.ciclos || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Planificación</p>
                      <p className="font-semibold">{antecedentes.ginecoObstetrico.planificacion || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState message="No hay antecedentes gineco-obstétricos registrados" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patológicos */}
        <TabsContent value="patologicos" className="mt-6">
          <Card>
            <CardHeader className="bg-amber-50">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <HeartPulse className="h-5 w-5" />
                Antecedentes Patológicos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {antecedentes?.patologicos?.length > 0 ? (
                <div className="space-y-3">
                  {antecedentes.patologicos.map((patologia, index) => (
                    <div key={index} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-amber-900">{patologia.diagnostico}</h4>
                          {patologia.fechaDiagnostico && (
                            <p className="text-sm text-gray-600">
                              Diagnosticado: {formatDate(patologia.fechaDiagnostico)}
                            </p>
                          )}
                          {patologia.tratamiento && (
                            <p className="text-sm text-gray-500 mt-1">
                              Tratamiento: {patologia.tratamiento}
                            </p>
                          )}
                        </div>
                        <Badge variant={patologia.activo ? 'destructive' : 'secondary'}>
                          {patologia.activo ? 'Activo' : 'Resuelto'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No hay antecedentes patológicos registrados" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quirúrgicos */}
        <TabsContent value="quirurgicos" className="mt-6">
          <Card>
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Scissors className="h-5 w-5" />
                Antecedentes Quirúrgicos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {antecedentes?.quirurgicos?.length > 0 ? (
                <div className="space-y-3">
                  {antecedentes.quirurgicos.map((cirugia, index) => (
                    <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900">{cirugia.procedimiento}</h4>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Fecha</p>
                          <p className="text-sm">{formatDate(cirugia.fecha)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Institución</p>
                          <p className="text-sm">{cirugia.institucion || 'N/A'}</p>
                        </div>
                      </div>
                      {cirugia.complicaciones && (
                        <p className="text-sm text-amber-700 mt-2">
                          Complicaciones: {cirugia.complicaciones}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No hay antecedentes quirúrgicos registrados" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Familiares */}
        <TabsContent value="familiares" className="mt-6">
          <Card>
            <CardHeader className="bg-teal-50">
              <CardTitle className="flex items-center gap-2 text-teal-800">
                <Users className="h-5 w-5" />
                Antecedentes Familiares
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {antecedentes?.familiares?.length > 0 ? (
                <div className="space-y-3">
                  {antecedentes.familiares.map((familiar, index) => (
                    <div key={index} className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="bg-teal-100">
                          {familiar.parentesco}
                        </Badge>
                        <div>
                          <h4 className="font-semibold text-teal-900">{familiar.enfermedad}</h4>
                          {familiar.observaciones && (
                            <p className="text-sm text-gray-600 mt-1">{familiar.observaciones}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No hay antecedentes familiares registrados" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alérgicos */}
        <TabsContent value="alergicos" className="mt-6">
          <Card>
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Alergias
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {antecedentes?.alergicos?.length > 0 ? (
                <div className="space-y-3">
                  {antecedentes.alergicos.map((alergia, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        alergia.severidad === 'SEVERA'
                          ? 'bg-red-100 border-red-300'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-red-900">{alergia.alergeno}</h4>
                          <p className="text-sm text-gray-600">Tipo: {alergia.tipo}</p>
                          {alergia.reaccion && (
                            <p className="text-sm text-red-700 mt-1">Reacción: {alergia.reaccion}</p>
                          )}
                        </div>
                        <Badge
                          variant={alergia.severidad === 'SEVERA' ? 'destructive' : 'secondary'}
                        >
                          {alergia.severidad}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No hay alergias registradas" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-8">
      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
