'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  Plus,
  BarChart3,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

export default function IndicadorCard({ item, onAgregarMedicion }) {
  const { indicador, ultimaMedicion, meta, tendencia, serieHistorica } = item;

  // Determinar color según cumplimiento de meta
  const getMetaColor = () => {
    if (meta.cumple === null) return 'gray';
    return meta.cumple ? 'green' : 'red';
  };

  // Icono de tendencia
  const TendenciaIcon = () => {
    if (tendencia === 'CRECIENTE') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (tendencia === 'DECRECIENTE') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  // Formatear dominio
  const getDominioLabel = (dominio) => {
    const labels = {
      AMBIENTAL: 'Ambiental',
      SEGURIDAD: 'Seguridad y Salud',
    };
    return labels[dominio] || dominio;
  };

  // Formatear tipo de cálculo
  const getTipoCalculoLabel = (tipo) => {
    const labels = {
      AUTOMATICO: 'Automático',
      MANUAL: 'Manual',
      MIXTO: 'Mixto',
    };
    return labels[tipo] || tipo;
  };

  // Formatear frecuencia
  const getFrecuenciaLabel = (frecuencia) => {
    const labels = {
      MENSUAL: 'Mensual',
      TRIMESTRAL: 'Trimestral',
      CUATRIMESTRAL: 'Cuatrimestral',
      SEMESTRAL: 'Semestral',
      ANUAL: 'Anual',
    };
    return labels[frecuencia] || frecuencia;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base font-semibold text-gray-900">
                {indicador.nombre}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {indicador.codigo}
              </Badge>
              <Badge
                variant={indicador.tipoCalculo === 'AUTOMATICO' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {getTipoCalculoLabel(indicador.tipoCalculo)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getDominioLabel(indicador.dominio)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getFrecuenciaLabel(indicador.frecuencia)}
              </Badge>
            </div>
          </div>

          {/* Icono de tendencia */}
          <div className="flex flex-col items-center gap-1 ml-4">
            <TendenciaIcon />
            <span className="text-xs text-gray-500">Tendencia</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Última medición y resultado */}
        {ultimaMedicion ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Resultado actual */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Última Medición</div>
              <div className="text-2xl font-bold text-blue-600">
                {(Number(ultimaMedicion.resultado) || 0).toFixed(2)}
                {indicador.tipoCalculo === 'AUTOMATICO' && '%'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Periodo: {ultimaMedicion.periodo}
              </div>
              <div className="text-xs text-gray-500">
                {(Number(ultimaMedicion.numerador) || 0).toFixed(2)} / {(Number(ultimaMedicion.denominador) || 0).toFixed(2)}
              </div>
            </div>

            {/* Cumplimiento de meta */}
            {meta.valor && (
              <div className={`bg-${getMetaColor()}-50 p-4 rounded-lg`}>
                <div className="text-xs text-gray-600 mb-1">Cumplimiento de Meta</div>
                <div className="flex items-center gap-2 mb-2">
                  {meta.cumple ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div className={`text-xl font-bold text-${getMetaColor()}-700`}>
                    {meta.cumple ? 'CUMPLE' : 'NO CUMPLE'}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  Meta: {meta.valor} {meta.tipo === 'MAYOR_IGUAL' ? '(mínimo)' : '(máximo)'}
                </div>
                {meta.porcentajeCumplimiento && (
                  <Progress
                    value={Math.min(meta.porcentajeCumplimiento, 100)}
                    className="mt-2"
                  />
                )}
              </div>
            )}

            {!meta.valor && (
              <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-xs">Sin meta definida</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-sm text-yellow-800 font-medium">
              No hay mediciones registradas
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              {indicador.tipoCalculo === 'AUTOMATICO'
                ? 'Las mediciones se generarán automáticamente desde RH1'
                : 'Agregue una medición manual'}
            </div>
          </div>
        )}

        {/* Mini gráfica de serie histórica */}
        {serieHistorica && serieHistorica.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">
                Serie Histórica ({serieHistorica.length} mediciones)
              </span>
              <span className="text-xs text-gray-500">
                Últimos {serieHistorica.length} periodos
              </span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={serieHistorica}>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    padding: '8px',
                    borderRadius: '6px',
                  }}
                  formatter={(value) => [value.toFixed(2), 'Valor']}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Estado y acciones */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {ultimaMedicion && (
              <Badge
                variant={ultimaMedicion.estado === 'VERIFICADO' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {ultimaMedicion.estado}
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              {item.totalMedicionesAnio || 0} mediciones este año
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón para agregar medición manual */}
            {indicador.tipoCalculo !== 'AUTOMATICO' && (
              <Button
                onClick={onAgregarMedicion}
                size="sm"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Medición
              </Button>
            )}

            {/* Botón ver ficha técnica (opcional, para futuro) */}
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
              title="Ver ficha técnica"
            >
              <FileText className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
