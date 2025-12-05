'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TabMovimientos({ pacienteId, user }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600">🚧 Módulo en desarrollo - FASE 8</p>
          <p className="text-sm text-gray-500 mt-2">
            Aquí se mostrará la línea de tiempo con ingresos, traslados,
            cambios de cama y unidades.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
