'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Stethoscope,
  Calculator
} from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function IndicadoresTab({ user }) {
  const {
    getIndicadores,
    getIndicadoresAccidentalidad,
    getIndicadoresEnfermedad,
    getIndicadoresProceso,
    loading
  } = useSST();

  const [anio, setAnio] = useState(new Date().getFullYear());
  const [indicadores, setIndicadores] = useState(null);
  const [accidentalidad, setAccidentalidad] = useState(null);
  const [enfermedad, setEnfermedad] = useState(null);
  const [proceso, setProceso] = useState(null);

  useEffect(() => {
    Promise.all([
      getIndicadores(anio),
      getIndicadoresAccidentalidad(anio),
      getIndicadoresEnfermedad(anio),
      getIndicadoresProceso(anio)
    ]).then(([ind, acc, enf, pro]) => {
      setIndicadores(ind);
      setAccidentalidad(acc);
      setEnfermedad(enf);
      setProceso(pro);
    });
  }, [anio, getIndicadores, getIndicadoresAccidentalidad, getIndicadoresEnfermedad, getIndicadoresProceso]);

  const K = 240000;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Indicadores SST</h2>
          <p className="text-sm text-gray-500">Resolucion 0312/2019 - Indicadores minimos</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))}
            className="border rounded px-3 py-2 text-sm"
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          <Button variant="outline" onClick={() => {}}>
            <Calculator className="w-4 h-4 mr-2" />
            Recalcular
          </Button>
        </div>
      </div>

      {/* Indicadores de Resultado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Indicadores de Resultado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* IF */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">IF</span>
              </div>
              <p className="text-2xl font-bold">{accidentalidad?.indiceFrecuencia || 0}</p>
              <p className="text-xs text-gray-500">Indice de Frecuencia</p>
              <p className="text-xs text-gray-400 mt-1">(AT × K) / HHT</p>
            </div>

            {/* IS */}
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">IS</span>
              </div>
              <p className="text-2xl font-bold">{accidentalidad?.indiceSeveridad || 0}</p>
              <p className="text-xs text-gray-500">Indice de Severidad</p>
              <p className="text-xs text-gray-400 mt-1">(Dias × K) / HHT</p>
            </div>

            {/* ILI */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">ILI</span>
              </div>
              <p className="text-2xl font-bold">{accidentalidad?.indiceILI || 0}</p>
              <p className="text-xs text-gray-500">Indice de Lesiones</p>
              <p className="text-xs text-gray-400 mt-1">(IF × IS) / 1000</p>
            </div>

            {/* Tasa AT */}
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Tasa AT</span>
              </div>
              <p className="text-2xl font-bold">{accidentalidad?.tasaAccidentalidad || 0}%</p>
              <p className="text-xs text-gray-500">Tasa de Accidentalidad</p>
              <p className="text-xs text-gray-400 mt-1">(AT / Trab) × 100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores de Enfermedad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Indicadores de Enfermedad Laboral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{enfermedad?.prevalencia || 0}</p>
              <p className="text-xs text-gray-500">Prevalencia EL</p>
              <p className="text-xs text-gray-400">(Casos / Trabajadores) × 100,000</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{enfermedad?.incidencia || 0}</p>
              <p className="text-xs text-gray-500">Incidencia EL</p>
              <p className="text-xs text-gray-400">(Nuevos / Expuestos) × 100,000</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{enfermedad?.ausentismo || 0}%</p>
              <p className="text-xs text-gray-500">Ausentismo</p>
              <p className="text-xs text-gray-400">(Dias ausencia / Dias prog) × 100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores de Proceso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Indicadores de Proceso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold">{proceso?.coberturaInduccion || 0}%</p>
              <p className="text-xs text-gray-500">Cobertura Induccion</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold">{proceso?.coberturaCapacitacion || 0}%</p>
              <p className="text-xs text-gray-500">Cobertura Capacitacion</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold">{proceso?.cumplimientoPlan || 0}%</p>
              <p className="text-xs text-gray-500">Cumplimiento Plan Anual</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold">{proceso?.coberturaExamenes || 0}%</p>
              <p className="text-xs text-gray-500">Cobertura Examenes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variables base */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Variables Base</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Trabajadores:</span>
              <p className="font-medium">{accidentalidad?.trabajadores || 0}</p>
            </div>
            <div>
              <span className="text-gray-500">HHT:</span>
              <p className="font-medium">{accidentalidad?.HHT || 0}</p>
            </div>
            <div>
              <span className="text-gray-500">Accidentes:</span>
              <p className="font-medium">{accidentalidad?.totalAccidentes || 0}</p>
            </div>
            <div>
              <span className="text-gray-500">Dias perdidos:</span>
              <p className="font-medium">{accidentalidad?.diasPerdidos || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
