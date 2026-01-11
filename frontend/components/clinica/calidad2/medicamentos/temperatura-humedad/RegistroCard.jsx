'use client';

import { Calendar, Thermometer, Droplets, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RegistroCard({ registro, onEdit, onDelete }) {
  const tempFueraDeRango = !registro.temperaturaEnRango;
  const humFueraDeRango = !registro.humedadEnRango;
  const requiereAlerta = registro.requiereAlerta;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${requiereAlerta ? 'border-yellow-300 bg-yellow-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm">
              {registro.area.replace(/_/g, ' ')}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(registro.fecha).toLocaleString()}</span>
            </div>
          </div>
          {requiereAlerta && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Alerta
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Temperatura */}
        <div className={`p-3 rounded-lg ${tempFueraDeRango ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className={`w-4 h-4 ${tempFueraDeRango ? 'text-red-600' : 'text-blue-600'}`} />
              <span className="text-xs font-medium text-gray-700">Temperatura</span>
            </div>
            <Badge className={tempFueraDeRango ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
              {tempFueraDeRango ? 'Fuera de Rango' : 'Normal'}
            </Badge>
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-bold ${tempFueraDeRango ? 'text-red-700' : 'text-blue-700'}`}>
              {registro.temperatura}°C
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Rango: {registro.temperaturaMin}°C - {registro.temperaturaMax}°C
            </p>
          </div>
        </div>

        {/* Humedad */}
        <div className={`p-3 rounded-lg ${humFueraDeRango ? 'bg-red-50 border border-red-200' : 'bg-cyan-50 border border-cyan-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className={`w-4 h-4 ${humFueraDeRango ? 'text-red-600' : 'text-cyan-600'}`} />
              <span className="text-xs font-medium text-gray-700">Humedad</span>
            </div>
            <Badge className={humFueraDeRango ? 'bg-red-100 text-red-800' : 'bg-cyan-100 text-cyan-800'}>
              {humFueraDeRango ? 'Fuera de Rango' : 'Normal'}
            </Badge>
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-bold ${humFueraDeRango ? 'text-red-700' : 'text-cyan-700'}`}>
              {registro.humedad}%
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Rango: {registro.humedadMin}% - {registro.humedadMax}%
            </p>
          </div>
        </div>

        {/* Acción Correctiva */}
        {registro.accionCorrectiva && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-1">Acción Correctiva:</p>
            <p className="text-xs text-gray-600">{registro.accionCorrectiva}</p>
            {registro.responsableAccion && (
              <p className="text-xs text-gray-500 mt-1">
                Responsable: {registro.responsableAccion}
              </p>
            )}
          </div>
        )}

        {/* Registrado por */}
        {registro.registrador && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Registrado por: {registro.registrador.nombre}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(registro)}
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Editar
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(registro.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
