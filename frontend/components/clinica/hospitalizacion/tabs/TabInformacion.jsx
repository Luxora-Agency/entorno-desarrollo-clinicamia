'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TabInformacion({ admision }) {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Información del Paciente */}
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold text-lg mb-3">Información del Paciente</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <span className="ml-2 font-medium">
                  {admision.paciente?.nombre} {admision.paciente?.apellido}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Cédula:</span>
                <span className="ml-2 font-medium">{admision.paciente?.cedula}</span>
              </div>
              <div>
                <span className="text-gray-600">Edad:</span>
                <span className="ml-2 font-medium">{admision.paciente?.edad} años</span>
              </div>
              <div>
                <span className="text-gray-600">Teléfono:</span>
                <span className="ml-2 font-medium">{admision.paciente?.telefono}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de la Admisión */}
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold text-lg mb-3">Datos de Ingreso</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Fecha de Ingreso:</span>
                <span className="ml-2 font-medium">
                  {new Date(admision.fechaIngreso).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <Badge className="ml-2" variant={admision.estado === 'Activa' ? 'default' : 'secondary'}>
                  {admision.estado}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Unidad:</span>
                <span className="ml-2 font-medium">{admision.unidad?.nombre}</span>
              </div>
              <div>
                <span className="text-gray-600">Cama:</span>
                <span className="ml-2 font-medium">
                  Cama {admision.cama?.numero} - Habitación {admision.cama?.habitacion?.numero}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivo y Diagnóstico */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg mb-3">Motivo y Diagnóstico de Ingreso</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 text-sm">Motivo de Ingreso:</span>
              <p className="mt-1">{admision.motivoIngreso}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Diagnóstico de Ingreso:</span>
              <p className="mt-1">{admision.diagnosticoIngreso}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
