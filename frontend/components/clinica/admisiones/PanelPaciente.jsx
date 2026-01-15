'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, User, Phone, Heart, Calendar, Activity, FileHeart, Shield, AlertCircle } from 'lucide-react';

export default function PanelPaciente({ paciente, onEdit, onGoToHCE }) {
  if (!paciente) return null;

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    let dias = hoy.getDate() - nacimiento.getDate();

    if (dias < 0) {
      meses--;
      const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      dias += ultimoDiaMesAnterior;
    }

    if (meses < 0) {
      anios--;
      meses += 12;
    }

    if (anios < 1) {
      if (meses === 0) return `${dias} día${dias !== 1 ? 's' : ''}`;
      return `${meses} mes${meses !== 1 ? 'es' : ''}, ${dias}d`;
    }
    if (anios < 5) {
      return `${anios} año${anios !== 1 ? 's' : ''}, ${meses}m`;
    }
    return `${anios} año${anios !== 1 ? 's' : ''}, ${meses}m, ${dias}d`;
  };

  // Helper para obtener URL de foto
  const getPatientPhotoUrl = (fotoUrl) => {
    if (!fotoUrl) return null;
    if (fotoUrl.startsWith('data:image')) return fotoUrl;
    if (fotoUrl.startsWith('http')) return fotoUrl;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${apiUrl}${fotoUrl.startsWith('/') ? '' : '/'}${fotoUrl}`;
  };

  const patientPhotoUrl = getPatientPhotoUrl(paciente.fotoUrl || paciente.foto);
  const tieneDiscapacidad = paciente.discapacidad === 'Aplica';

  return (
    <Card className="border-2 shadow-lg overflow-hidden">
      {/* Barra de alerta si tiene discapacidad */}
      {tieneDiscapacidad && (
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">
            Paciente con Discapacidad: {paciente.tipoDiscapacidad || 'No especificado'}
          </span>
        </div>
      )}

      <CardContent className="p-4 md:p-6">
        {/* Layout principal - Stack en móvil, Row en desktop */}
        <div className="flex flex-col gap-4">
          {/* Fila 1: Avatar, Nombre y Badges */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="relative flex-shrink-0">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 bg-gradient-to-br from-emerald-500 to-teal-600 border-4 border-white shadow-md">
                {patientPhotoUrl && (
                  <AvatarImage
                    src={patientPhotoUrl}
                    alt={`${paciente.nombre} ${paciente.apellido}`}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="text-white font-bold text-xl md:text-2xl">
                  {paciente.nombre?.[0]}{paciente.apellido?.[0]}
                </AvatarFallback>
              </Avatar>
              {paciente.tipoSangre && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  {paciente.tipoSangre}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 break-words">
                {paciente.nombre} {paciente.apellido}
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                {paciente.tipoDocumento || 'CC'}: {paciente.cedula}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={`${
                    paciente.estado === 'Activo' || paciente.activo
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  } border text-xs`}
                >
                  {paciente.estado || (paciente.activo ? 'Activo' : 'Inactivo')}
                </Badge>
                {paciente.regimen && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 border text-xs">
                    {paciente.regimen}
                  </Badge>
                )}
              </div>
            </div>

            {/* Botones - Se mueven abajo en móvil */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {onGoToHCE && (
                <Button
                  onClick={onGoToHCE}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                >
                  <FileHeart className="w-4 h-4 mr-1" />
                  <span className="hidden xl:inline">Ir a HCE</span>
                  <span className="xl:hidden">HCE</span>
                </Button>
              )}
              <Button
                onClick={onEdit}
                size="sm"
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                <span className="hidden xl:inline">Editar</span>
              </Button>
            </div>
          </div>

          {/* Fila 2: Información rápida - Grid responsivo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t border-gray-200">
            {/* Edad */}
            <div className="text-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium uppercase">Edad</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">
                {calcularEdad(paciente.fechaNacimiento)}
              </p>
            </div>

            {/* Género */}
            <div className="text-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium uppercase">Sexo</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">
                {paciente.genero || 'N/A'}
              </p>
            </div>

            {/* Teléfono */}
            <div className="text-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium uppercase">Teléfono</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm truncate">
                {paciente.telefono || 'N/A'}
              </p>
            </div>

            {/* EPS */}
            <div className="text-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium uppercase">EPS</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm truncate" title={paciente.eps}>
                {paciente.eps || 'N/A'}
              </p>
            </div>

            {/* IMC */}
            {(paciente.peso && paciente.altura) && (
              <div className="text-sm">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium uppercase">IMC</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {(() => {
                    const altura = paciente.altura > 3 ? paciente.altura / 100 : paciente.altura;
                    return (paciente.peso / (altura * altura)).toFixed(1);
                  })()}
                </p>
              </div>
            )}

            {/* Sangre - si no está en avatar */}
            {paciente.tipoSangre && (
              <div className="text-sm">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <Heart className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                  <span className="text-xs font-medium uppercase">Sangre</span>
                </div>
                <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                  {paciente.tipoSangre}
                </Badge>
              </div>
            )}
          </div>

          {/* Fila 3: Botones en móvil */}
          <div className="flex lg:hidden items-center justify-end gap-2 pt-3 border-t border-gray-100">
            {onGoToHCE && (
              <Button
                onClick={onGoToHCE}
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white flex-1 sm:flex-none"
              >
                <FileHeart className="w-4 h-4 mr-2" />
                Ir a HCE
              </Button>
            )}
            <Button
              onClick={onEdit}
              size="sm"
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 flex-1 sm:flex-none"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
