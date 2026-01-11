'use client';

import { useState, useEffect } from 'react';
import { Calendar, Save, BarChart3, FileText, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInfraestructuraRH1 } from '@/hooks/useInfraestructuraRH1';
import RH1FormularioMensual from './RH1FormularioMensual';
import ManifiestosRecoleccionList from './ManifiestosRecoleccionList';
import ActasDesactivacionList from './ActasDesactivacionList';

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export default function RH1Tab({ user }) {
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(fechaActual.getFullYear());
  const [registrosMes, setRegistrosMes] = useState([]);
  const [totalesMes, setTotalesMes] = useState(null);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { loadMes, getTotalesMes, saveBatch, loading, getAniosDisponibles } = useInfraestructuraRH1();

  useEffect(() => {
    loadAnios();
  }, []);

  useEffect(() => {
    if (mesSeleccionado && anioSeleccionado) {
      loadData();
    }
  }, [mesSeleccionado, anioSeleccionado]);

  const loadAnios = async () => {
    const anios = await getAniosDisponibles();
    const anioActual = new Date().getFullYear();
    const todosAnios = Array.from(new Set([...anios, anioActual, anioActual - 1, anioActual + 1])).sort(
      (a, b) => b - a
    );
    setAniosDisponibles(todosAnios);
  };

  const loadData = async () => {
    const registros = await loadMes(mesSeleccionado, anioSeleccionado);
    setRegistrosMes(registros || []);

    const totales = await getTotalesMes(mesSeleccionado, anioSeleccionado);
    setTotalesMes(totales);

    setHasChanges(false);
  };

  const handleSave = async (registrosActualizados) => {
    // Filtrar solo los registros que tienen valores (no todos en 0)
    const registrosParaGuardar = registrosActualizados.filter(r => {
      return r.residuosAprovechables > 0 ||
             r.residuosNoAprovechables > 0 ||
             r.residuosInfecciosos > 0 ||
             r.residuosBiosanitarios > 0;
    });

    if (registrosParaGuardar.length === 0) {
      return;
    }

    const success = await saveBatch(registrosParaGuardar);
    if (success) {
      loadData();
    }
  };

  const mesNombre = MESES.find(m => m.value === mesSeleccionado)?.label || '';

  return (
    <div className="space-y-6">
      {/* Header y selectores */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Formulario RH1 - Residuos Hospitalarios
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Registro diario de generación de residuos (kg/día)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Selector de mes */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <Select
                  value={String(mesSeleccionado)}
                  onValueChange={(val) => setMesSeleccionado(parseInt(val))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((mes) => (
                      <SelectItem key={mes.value} value={String(mes.value)}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de año */}
              <Select
                value={String(anioSeleccionado)}
                onValueChange={(val) => setAnioSeleccionado(parseInt(val))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aniosDisponibles.map((anio) => (
                    <SelectItem key={anio} value={String(anio)}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totales del mes */}
      {totalesMes && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(Number(totalesMes.totales.residuosAprovechables) || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Aprovechables (kg)</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {(Number(totalesMes.totales.residuosNoAprovechables) || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">No Aprovechables (kg)</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(Number(totalesMes.totales.residuosInfecciosos) || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Infecciosos (kg)</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(Number(totalesMes.totales.residuosBiosanitarios) || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Biosanitarios (kg)</div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {(Number(totalesMes.totales.totalGenerado) || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Generado (kg)</div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {totalesMes.diasRegistrados} / 31
                </div>
                <div className="text-sm text-gray-600 mt-1">Días Registrados</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulario mensual */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Registro Diario - {mesNombre} {anioSeleccionado}
            </h3>
            {hasChanges && (
              <div className="text-sm text-orange-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                Cambios sin guardar
              </div>
            )}
          </div>

          <RH1FormularioMensual
            registrosIniciales={registrosMes}
            mes={mesSeleccionado}
            anio={anioSeleccionado}
            onSave={handleSave}
            onChange={() => setHasChanges(true)}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Información */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">📝 Instrucciones:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Ingrese los valores diarios de residuos generados en kilogramos</li>
              <li>Los totales se calculan automáticamente</li>
              <li>Haga clic en "Guardar Cambios" para persistir los datos</li>
              <li>Solo se guardarán los días con valores mayores a 0</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Secciones adicionales: Manifiestos y Actas */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="manifiestos">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manifiestos" className="gap-2">
                <FileText className="w-4 h-4" />
                Manifiestos de Recolección
              </TabsTrigger>
              <TabsTrigger value="actas" className="gap-2">
                <FileCheck className="w-4 h-4" />
                Actas de Desactivación
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manifiestos">
              <ManifiestosRecoleccionList
                anioSeleccionado={anioSeleccionado}
                mesSeleccionado={mesSeleccionado}
              />
            </TabsContent>

            <TabsContent value="actas">
              <ActasDesactivacionList
                anioSeleccionado={anioSeleccionado}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
