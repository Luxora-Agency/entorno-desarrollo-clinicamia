'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Phone, Heart, Calendar, Activity, AlertCircle } from 'lucide-react';

export default function PanelPacienteHCE({ paciente }) {
  if (!paciente) return null;

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  };

  return (
    <Card className="border-2 shadow-lg border-blue-200 bg-gradient-to-r from-white to-blue-50">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Header con Avatar y Nombre */}
          <div className="flex items-start gap-4 flex-shrink-0">
            <Avatar className="h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 border-4 border-white shadow-md">
              <AvatarFallback className="text-white font-bold text-2xl">
                {paciente.nombre?.[0]}{paciente.apellido?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 truncate">
                {paciente.nombre} {paciente.apellido}
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                CC: {paciente.cedula}
              </p>
              <div className="flex gap-2">
                <Badge 
                  className={`${
                    paciente.estado === 'Activo' || paciente.activo
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  } border`}
                >
                  {paciente.estado || (paciente.activo ? 'Activo' : 'Inactivo')}
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  HCE Activa
                </Badge>
              </div>
            </div>
          </div>

          {/* Información Básica - Grid Horizontal */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 border-l-0 lg:border-l pl-0 lg:pl-6">
            <div className="text-sm">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="w-3 h-3" />
                <span className="text-xs">Edad</span>
              </div>
              <p className="font-semibold text-gray-900">
                {calcularEdad(paciente.fechaNacimiento)}
              </p>
            </div>

            <div className="text-sm">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <User className="w-3 h-3" />
                <span className="text-xs">Género</span>
              </div>
              <p className="font-semibold text-gray-900">
                {paciente.genero || 'N/A'}
              </p>
            </div>

            {paciente.telefono && (
              <div className="text-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Phone className="w-3 h-3" />
                  <span className="text-xs">Teléfono</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {paciente.telefono}
                </p>
              </div>
            )}

            {paciente.eps && (
              <div className="text-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Heart className="w-3 h-3" />
                  <span className="text-xs">EPS</span>
                </div>
                <p className="font-semibold text-gray-900 truncate">
                  {paciente.eps}
                </p>
              </div>
            )}

            {paciente.tipoSangre && (
              <div className="text-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <div className="w-3 h-3 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  <span className="text-xs">Sangre</span>
                </div>
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  {paciente.tipoSangre}
                </Badge>
              </div>
            )}

            {(paciente.peso || paciente.altura) && (
              <div className="text-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Activity className="w-3 h-3" />
                  <span className="text-xs">Vitales</span>
                </div>
                <p className="font-semibold text-gray-900 text-xs">
                  {paciente.peso && `${paciente.peso} kg`}
                  {paciente.peso && paciente.altura && ' / '}
                  {paciente.altura && `${paciente.altura} m`}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
