'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TabAdmisiones({ pacienteId, user }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admisiones / Hospitalizaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600">🚧 Módulo en desarrollo - FASE 7</p>
          <p className="text-sm text-gray-500 mt-2">
            Aquí se mostrará el estado actual del paciente, historial de ingresos,
            y la opción de iniciar admisión o registrar egreso.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
