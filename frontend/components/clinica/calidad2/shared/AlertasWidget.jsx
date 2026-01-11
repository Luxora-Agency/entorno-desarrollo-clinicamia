'use client';

import { useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCalidad2Alertas } from '@/hooks/useCalidad2Alertas';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function AlertasWidget({ showGenerar = false, maxItems = 5 }) {
  const { dashboard, loading, loadDashboard, generarAlertas, atenderAlerta, descartarAlerta } = useCalidad2Alertas();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !dashboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { resumen, recientes } = dashboard || {};

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5" />
            Alertas
          </CardTitle>
          {showGenerar && (
            <Button size="sm" variant="outline" onClick={generarAlertas}>
              Generar alertas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-xl font-bold text-red-700">{resumen?.vencidas || 0}</p>
              <p className="text-xs text-red-600">Vencidos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-xl font-bold text-yellow-700">{resumen?.porVencer || 0}</p>
              <p className="text-xs text-yellow-600">Por vencer</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xl font-bold text-green-700">{resumen?.atendidas || 0}</p>
              <p className="text-xs text-green-600">Atendidas</p>
            </div>
          </div>
        </div>

        {/* Lista de alertas recientes */}
        <div className="space-y-2">
          {recientes?.slice(0, maxItems).map((alerta) => (
            <div
              key={alerta.id}
              className="flex items-start gap-3 p-2 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      alerta.tipo === 'DOCUMENTO_VENCIDO'
                        ? 'bg-red-100 text-red-700 border-red-300'
                        : alerta.tipo === 'DOCUMENTO_POR_VENCER'
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                        : 'bg-blue-100 text-blue-700 border-blue-300'
                    }
                  >
                    {alerta.tipo === 'DOCUMENTO_VENCIDO'
                      ? 'Vencido'
                      : alerta.tipo === 'DOCUMENTO_POR_VENCER'
                      ? 'Por vencer'
                      : 'Checklist'}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate mt-1">{alerta.titulo}</p>
                <p className="text-xs text-gray-500 truncate">{alerta.descripcion}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(alerta.createdAt), { addSuffix: true, locale: es })}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={() => atenderAlerta(alerta.id)}
                >
                  Atender
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 text-gray-500"
                  onClick={() => descartarAlerta(alerta.id)}
                >
                  Descartar
                </Button>
              </div>
            </div>
          ))}

          {(!recientes || recientes.length === 0) && (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No hay alertas pendientes</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
