'use client';

import { AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

const PRIORIDAD_COLORS = {
  CRITICA: 'bg-red-100 text-red-800 border-red-300',
  ALTA: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  BAJA: 'bg-blue-100 text-blue-800 border-blue-300',
};

const PRIORIDAD_LABELS = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
};

const TIPO_LABELS = {
  VENCIMIENTO_MEDICAMENTO: 'Vencimiento',
  STOCK_BAJO: 'Stock Bajo',
  TEMPERATURA_FUERA_RANGO: 'Temperatura',
  HUMEDAD_FUERA_RANGO: 'Humedad',
  REPORTE_PENDIENTE_INVIMA: 'INVIMA Pendiente',
};

const TIPO_ICONS = {
  VENCIMIENTO_MEDICAMENTO: '📅',
  STOCK_BAJO: '📉',
  TEMPERATURA_FUERA_RANGO: '🌡️',
  HUMEDAD_FUERA_RANGO: '💧',
  REPORTE_PENDIENTE_INVIMA: '📋',
};

export default function AlertaCard({ alerta, onMarcarAtendida }) {
  const [showObservaciones, setShowObservaciones] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  const prioridadColor = PRIORIDAD_COLORS[alerta.prioridad] || PRIORIDAD_COLORS.BAJA;
  const prioridadLabel = PRIORIDAD_LABELS[alerta.prioridad] || alerta.prioridad;
  const tipoLabel = TIPO_LABELS[alerta.tipo] || alerta.tipo;
  const tipoIcon = TIPO_ICONS[alerta.tipo] || '⚠️';

  const handleMarcarAtendida = async () => {
    setLoading(true);
    await onMarcarAtendida(alerta.id, observaciones || null);
    setLoading(false);
    setShowObservaciones(false);
    setObservaciones('');
  };

  const cardBorderClass = alerta.atendida
    ? 'border-green-200 bg-green-50/30'
    : alerta.prioridad === 'CRITICA'
    ? 'border-red-300 bg-red-50/50'
    : alerta.prioridad === 'ALTA'
    ? 'border-orange-200 bg-orange-50/30'
    : '';

  return (
    <Card className={`hover:shadow-lg transition-shadow ${cardBorderClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{tipoIcon}</span>
              <Badge variant="outline" className="text-xs">
                {tipoLabel}
              </Badge>
              <Badge className={prioridadColor}>
                {prioridadLabel}
              </Badge>
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">
              {alerta.titulo}
            </h4>
          </div>
          {alerta.atendida && (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Atendida
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Descripción */}
        <div className="text-sm text-gray-700 bg-white border border-gray-200 rounded p-3">
          {alerta.descripcion}
        </div>

        {/* Fecha de alerta */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Generada el {new Date(alerta.fechaAlerta).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
          </span>
        </div>

        {/* Creador */}
        {alerta.creador && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <User className="w-3.5 h-3.5" />
            <span>Por: {alerta.creador.nombre}</span>
          </div>
        )}

        {/* Si está atendida, mostrar info */}
        {alerta.atendida && (
          <div className="border-t pt-3 mt-3">
            <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
              <p className="text-xs font-medium text-green-900">
                <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                Atendida por: {alerta.atendedor?.nombre || 'Usuario desconocido'}
              </p>
              <p className="text-xs text-green-700">
                Fecha: {new Date(alerta.fechaAtencion).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
              </p>
              {alerta.observacionesAtencion && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-green-900 mb-1">Observaciones:</p>
                  <p className="text-xs text-green-700 bg-white rounded p-2">
                    {alerta.observacionesAtencion}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Si NO está atendida, mostrar botón para atender */}
        {!alerta.atendida && (
          <div className="border-t pt-3 mt-3">
            {!showObservaciones ? (
              <Button
                size="sm"
                className="w-full"
                onClick={() => setShowObservaciones(true)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar como Atendida
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Observaciones (opcional)
                  </label>
                  <Textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Describa las acciones tomadas..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowObservaciones(false);
                      setObservaciones('');
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleMarcarAtendida}
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Confirmar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
