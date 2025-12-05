'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TabFacturacion({ pacienteId, user }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Facturación</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600">🚧 Módulo en desarrollo - FASE 10</p>
          <p className="text-sm text-gray-500 mt-2">
            Aquí se mostrarán las facturas generadas, estado de cuenta
            y servicios pendientes por facturar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
