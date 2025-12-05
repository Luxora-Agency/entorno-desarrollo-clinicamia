'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, User, Phone, Mail, Heart, Calendar, MapPin } from 'lucide-react';

export default function PanelPaciente({ paciente, onEdit }) {
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Header con Avatar y Nombre */}
          <div className="flex items-start gap-4 flex-shrink-0">
            <Avatar className="h-20 w-20 bg-gradient-to-br from-emerald-500 to-teal-600 border-4 border-white shadow-md">
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
              <Badge 
                className={`${
                  paciente.estado === 'Activo' || paciente.activo
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                } border`}
              >
                {paciente.estado || (paciente.activo ? 'Activo' : 'Inactivo')}
              </Badge>
            </div>
          </div>

          {/* Información Básica - Grid Horizontal */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 border-l-0 lg:border-l pl-0 lg:pl-6">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-600">Edad:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {calcularEdad(paciente.fechaNacimiento)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-600">Género:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {paciente.genero || 'N/A'}
              </span>
            </div>
          </div>

          {paciente.telefono && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-600">Teléfono:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {paciente.telefono}
                </span>
              </div>
            </div>
          )}

          {paciente.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <div className="truncate">
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-semibold text-gray-900 truncate">
                  {paciente.email}
                </span>
              </div>
            </div>
          )}

          {paciente.eps && (
            <div className="flex items-center gap-3 text-sm">
              <Heart className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-600">EPS:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {paciente.eps}
                </span>
              </div>
            </div>
          )}

          {paciente.tipoSangre && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
              </div>
              <div>
                <span className="text-gray-600">Tipo de Sangre:</span>
                <Badge className="ml-2 bg-red-100 text-red-700 border-red-200">
                  {paciente.tipoSangre}
                </Badge>
              </div>
            </div>
          )}

          {paciente.direccion && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-gray-600">Dirección:</span>
                <p className="font-semibold text-gray-900 break-words">
                  {paciente.direccion}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Información Médica Resumida */}
        {(paciente.peso || paciente.altura) && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h4 className="text-xs font-semibold text-emerald-900 mb-2">
              Datos Vitales
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {paciente.peso && (
                <div>
                  <span className="text-gray-600">Peso:</span>
                  <span className="ml-1 font-semibold text-gray-900">
                    {paciente.peso} kg
                  </span>
                </div>
              )}
              {paciente.altura && (
                <div>
                  <span className="text-gray-600">Altura:</span>
                  <span className="ml-1 font-semibold text-gray-900">
                    {paciente.altura} m
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
