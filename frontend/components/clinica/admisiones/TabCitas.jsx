'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TabCitas({ pacienteId, user }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Citas del Paciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600">🚧 Módulo en desarrollo - FASE 5</p>
          <p className="text-sm text-gray-500 mt-2">
            Aquí se mostrará la lista de citas del paciente y se podrá crear nuevas citas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
