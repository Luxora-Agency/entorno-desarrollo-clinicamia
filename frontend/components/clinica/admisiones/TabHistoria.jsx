'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TabHistoria({ pacienteId, user }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historia Clínica</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600">🚧 Módulo en desarrollo - FASE 9</p>
          <p className="text-sm text-gray-500 mt-2">
            Aquí se mostrará el historial completo de consultas, diagnósticos,
            procedimientos, medicamentos y notas de evolución.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
