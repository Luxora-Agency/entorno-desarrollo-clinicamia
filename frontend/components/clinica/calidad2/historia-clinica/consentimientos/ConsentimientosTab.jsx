'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FileSignature, Users, Library, CheckCircle2 } from 'lucide-react';
import { useCalidad2ConsentimientosHC } from '@/hooks/useCalidad2ConsentimientosHC';
import BibliotecaConsentimientos from './BibliotecaConsentimientos';
import ConsentimientosAplicadosTab from './ConsentimientosAplicadosTab';

/**
 * Tab principal de Consentimientos Informados
 * Contiene dos secciones: Biblioteca (plantillas) y Aplicados
 */
export default function ConsentimientosTab() {
  const [activeSubTab, setActiveSubTab] = useState('biblioteca');
  const { loadStatsTipos, loadStatsAplicados, statsTipos, statsAplicados } = useCalidad2ConsentimientosHC();

  // Cargar estadísticas al montar
  useEffect(() => {
    loadStatsTipos();
    loadStatsAplicados();
  }, []);

  // Stats cards combinados
  const statsCards = [
    {
      title: 'Plantillas Activas',
      value: statsTipos?.vigentes || 0,
      total: statsTipos?.total || 0,
      icon: Library,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtitle: 'tipos disponibles',
    },
    {
      title: 'Aplicados Este Mes',
      value: statsAplicados?.esteMes || 0,
      icon: FileSignature,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtitle: 'consentimientos',
    },
    {
      title: 'Total Aplicados',
      value: statsAplicados?.total || 0,
      icon: CheckCircle2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtitle: 'registrados',
    },
    {
      title: 'Este Año',
      value: statsAplicados?.esteAnio || 0,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      subtitle: 'aplicaciones',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{stat.title}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.total && (
                      <p className="text-sm text-gray-400">/ {stat.total}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribución por servicio */}
      {statsTipos?.porServicio && Object.keys(statsTipos.porServicio).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Plantillas por Servicio</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statsTipos.porServicio).map(([servicio, count]) => (
                <div key={servicio} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium">{servicio}</p>
                    <p className="text-xs text-gray-500">{count} plantillas</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principales: Biblioteca vs Aplicados */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="biblioteca" className="gap-2">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Biblioteca de Plantillas</span>
            <span className="sm:hidden">Plantillas</span>
          </TabsTrigger>
          <TabsTrigger value="aplicados" className="gap-2">
            <FileSignature className="h-4 w-4" />
            <span className="hidden sm:inline">Consentimientos Aplicados</span>
            <span className="sm:hidden">Aplicados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="biblioteca" className="mt-6">
          <BibliotecaConsentimientos />
        </TabsContent>

        <TabsContent value="aplicados" className="mt-6">
          <ConsentimientosAplicadosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
