'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInfraestructuraAlertasDocumentos } from '@/hooks/useInfraestructuraAlertasDocumentos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AlertasWidget({ onRefresh }) {
  const { dashboard, loading, loadDashboard, resolverAlerta } = useInfraestructuraAlertasDocumentos();
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleResolverAlerta = async (alertaId) => {
    const success = await resolverAlerta(alertaId);
    if (success) {
      loadDashboard();
      onRefresh?.();
    }
  };

  const handleRefresh = () => {
    loadDashboard();
    onRefresh?.();
  };

  if (loading && !dashboard) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const contadores = dashboard?.contadores || {};
  const alertasRecientes = dashboard?.alertasRecientes || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alertas de Vencimiento
            {contadores.total > 0 && (
              <Badge variant="destructive" className="ml-2">
                {contadores.total}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contadores */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{contadores.vencidos || 0}</div>
            <div className="text-xs text-red-700">Vencidos</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{contadores.porVencer7 || 0}</div>
            <div className="text-xs text-orange-700">Próximos 7 días</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{contadores.porVencer15 || 0}</div>
            <div className="text-xs text-yellow-700">Próximos 15 días</div>
          </div>
        </div>

        {/* Lista de alertas recientes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Alertas Recientes</h4>
            {alertasRecientes.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandido(!expandido)}
              >
                {expandido ? 'Ver menos' : `Ver todas (${alertasRecientes.length})`}
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alertasRecientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No hay alertas pendientes</p>
                <p className="text-xs text-gray-400 mt-1">Todos los documentos están al día</p>
              </div>
            ) : (
              alertasRecientes
                .slice(0, expandido ? alertasRecientes.length : 3)
                .map((alerta) => (
                  <AlertaItem
                    key={alerta.id}
                    alerta={alerta}
                    onResolver={handleResolverAlerta}
                  />
                ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertaItem({ alerta, onResolver }) {
  const esVencido = alerta.tipo === 'VENCIDO';
  const esPorVencer7 = alerta.tipo === 'POR_VENCER_7';

  const bgColor = esVencido
    ? 'bg-red-50 border-red-200'
    : esPorVencer7
    ? 'bg-orange-50 border-orange-200'
    : 'bg-yellow-50 border-yellow-200';

  const iconColor = esVencido
    ? 'text-red-600'
    : esPorVencer7
    ? 'text-orange-600'
    : 'text-yellow-600';

  return (
    <div className={`p-3 rounded-lg border ${bgColor}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {esVencido ? (
            <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
          ) : (
            <AlertCircle className={`w-5 h-5 ${iconColor}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {alerta.documento.nombre}
          </p>
          <p className="text-xs text-gray-600 mt-1">{alerta.mensaje}</p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {alerta.documento.tipoDocumento}
            </Badge>

            {alerta.documento.fechaVencimiento && (
              <span className="text-xs text-gray-500">
                Vence: {format(new Date(alerta.documento.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
              </span>
            )}

            {alerta.estado === 'NOTIFICADO' && (
              <Badge variant="secondary" className="text-xs">
                Notificado
              </Badge>
            )}
          </div>

          {alerta.estado !== 'RESUELTO' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResolver(alerta.id)}
              className="mt-2 h-7 text-xs"
            >
              Marcar como resuelto
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
