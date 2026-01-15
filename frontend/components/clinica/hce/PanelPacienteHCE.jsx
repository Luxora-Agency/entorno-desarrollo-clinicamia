'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  User,
  Phone,
  Heart,
  Calendar,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  Shield,
  Droplets,
  AlertTriangle,
  FileText,
  Building2,
  UserCheck,
  Stethoscope,
  Info
} from 'lucide-react';

export default function PanelPacienteHCE({ paciente }) {
  const [expandido, setExpandido] = useState(false);

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

    // Para menores de 1 año, mostrar meses y días
    if (anios < 1) {
      if (meses === 0) {
        return `${dias} día${dias !== 1 ? 's' : ''}`;
      }
      return `${meses} mes${meses !== 1 ? 'es' : ''}, ${dias} día${dias !== 1 ? 's' : ''}`;
    }

    // Para menores de 5 años, mostrar años y meses
    if (anios < 5) {
      return `${anios} año${anios !== 1 ? 's' : ''}, ${meses} mes${meses !== 1 ? 'es' : ''}`;
    }

    // Para mayores, mostrar años, meses y días
    return `${anios} año${anios !== 1 ? 's' : ''}, ${meses} mes${meses !== 1 ? 'es' : ''}, ${dias} día${dias !== 1 ? 's' : ''}`;
  };

  const calcularIMC = (peso, altura) => {
    if (!peso || !altura) return null;
    const alturaM = altura > 3 ? altura / 100 : altura; // Convertir cm a m si es necesario
    const imc = peso / (alturaM * alturaM);
    return imc.toFixed(1);
  };

  const clasificarIMC = (imc) => {
    if (!imc) return null;
    const valor = parseFloat(imc);
    if (valor < 18.5) return { texto: 'Bajo peso', color: 'text-yellow-600 bg-yellow-50' };
    if (valor < 25) return { texto: 'Normal', color: 'text-green-600 bg-green-50' };
    if (valor < 30) return { texto: 'Sobrepeso', color: 'text-orange-600 bg-orange-50' };
    return { texto: 'Obesidad', color: 'text-red-600 bg-red-50' };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const tieneAlergias = paciente.alergias && paciente.alergias.trim() !== '' &&
    paciente.alergias.toLowerCase() !== 'ninguna' &&
    paciente.alergias.toLowerCase() !== 'no';

  // Helper para obtener URL de foto del paciente
  const getPatientPhotoUrl = (fotoUrl) => {
    if (!fotoUrl) return null;
    if (fotoUrl.startsWith('data:image')) return fotoUrl;
    if (fotoUrl.startsWith('http')) return fotoUrl;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${apiUrl}${fotoUrl.startsWith('/') ? '' : '/'}${fotoUrl}`;
  };

  const patientPhotoUrl = getPatientPhotoUrl(paciente.fotoUrl || paciente.foto);

  const imc = calcularIMC(paciente.peso, paciente.altura);
  const clasificacionIMC = clasificarIMC(imc);

  return (
    <Card className="border-2 shadow-lg border-blue-200 bg-gradient-to-r from-white to-blue-50 overflow-hidden">
      {/* Barra superior con alertas si existen */}
      {tieneAlergias && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
          <span className="text-white text-sm font-medium">
            ALERGIAS: {paciente.alergias}
          </span>
        </div>
      )}

      <CardContent className="p-4 md:p-6">
        {/* Fila principal */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Header con Avatar y Nombre */}
          <div className="flex items-start gap-4 flex-shrink-0">
            <div className="relative">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 bg-gradient-to-br from-blue-500 to-indigo-600 border-4 border-white shadow-md">
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

            <div className="min-w-0 flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {paciente.nombre} {paciente.apellido}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {paciente.tipoDocumento || 'CC'}: {paciente.cedula}
                </span>
                {paciente.fechaNacimiento && (
                  <span className="text-gray-400">|</span>
                )}
                {paciente.fechaNacimiento && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatearFecha(paciente.fechaNacimiento)}
                  </span>
                )}
              </div>
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
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-xs">
                  <Stethoscope className="w-3 h-3 mr-1" />
                  HCE
                </Badge>
                {paciente.regimen && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 border text-xs">
                    {paciente.regimen}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Información Básica - Grid Horizontal */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6 border-gray-200">
            {/* Edad */}
            <div className="text-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">Edad</span>
              </div>
              <p className="font-semibold text-gray-900">
                {calcularEdad(paciente.fechaNacimiento)}
              </p>
            </div>

            {/* Género */}
            <div className="text-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <User className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">Sexo</span>
              </div>
              <p className="font-semibold text-gray-900">
                {paciente.genero || 'N/A'}
              </p>
            </div>

            {/* EPS */}
            <div className="text-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">EPS</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-semibold text-gray-900 truncate max-w-[120px] cursor-help">
                      {paciente.eps || 'No registrada'}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{paciente.eps || 'No registrada'}</p>
                    {paciente.regimen && <p className="text-xs text-gray-400">Régimen: {paciente.regimen}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Teléfono */}
            <div className="text-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Phone className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">Teléfono</span>
              </div>
              <p className="font-semibold text-gray-900">
                {paciente.telefono || 'N/A'}
              </p>
            </div>

            {/* IMC o Peso/Talla */}
            <div className="text-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">IMC</span>
              </div>
              {imc ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900">{imc}</span>
                  {clasificacionIMC && (
                    <Badge className={`text-xs ${clasificacionIMC.color} border-0`}>
                      {clasificacionIMC.texto}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Sin datos</p>
              )}
            </div>
          </div>

          {/* Botón expandir */}
          <div className="flex lg:flex-col items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandido(!expandido)}
              className="text-gray-500 hover:text-blue-600"
            >
              {expandido ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline text-xs">Menos</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline text-xs">Más</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Información expandida */}
        {expandido && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Columna 1: Datos personales */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Datos Personales
              </h4>

              <div className="space-y-2 text-sm">
                {paciente.pais && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">País:</span>
                    <span className="text-gray-900">{paciente.pais}</span>
                  </div>
                )}
                {paciente.estadoCivil && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estado Civil:</span>
                    <span className="text-gray-900">{paciente.estadoCivil}</span>
                  </div>
                )}
                {paciente.ocupacion && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ocupación:</span>
                    <span className="text-gray-900">{paciente.ocupacion}</span>
                  </div>
                )}
                {paciente.escolaridad && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Escolaridad:</span>
                    <span className="text-gray-900">{paciente.escolaridad}</span>
                  </div>
                )}
                {paciente.etnia && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Etnia:</span>
                    <span className="text-gray-900">{paciente.etnia}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Columna 2: Ubicación y Contacto */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                Ubicación y Contacto
              </h4>

              <div className="space-y-2 text-sm">
                {paciente.direccion && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900">{paciente.direccion}</p>
                      <p className="text-gray-500 text-xs">
                        {[paciente.barrio, paciente.municipio, paciente.departamento]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {paciente.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900 truncate">{paciente.email}</p>
                  </div>
                )}

                {paciente.celular && paciente.celular !== paciente.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900">{paciente.celular} (Celular)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Columna 3: Aseguramiento */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                Aseguramiento
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Régimen:</span>
                  <span className="text-gray-900">{paciente.regimen || 'N/A'}</span>
                </div>
                {paciente.tipoAfiliacion && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo Afiliación:</span>
                    <span className="text-gray-900">{paciente.tipoAfiliacion}</span>
                  </div>
                )}
                {paciente.nivelSisben && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">SISBEN:</span>
                    <span className="text-gray-900">{paciente.nivelSisben}</span>
                  </div>
                )}
                {paciente.arl && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ARL:</span>
                    <span className="text-gray-900">{paciente.arl}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Columna 4: Datos Clínicos */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Heart className="w-3.5 h-3.5" />
                Datos Clínicos
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Tipo Sangre:</span>
                  {paciente.tipoSangre ? (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      <Droplets className="w-3 h-3 mr-1" />
                      {paciente.tipoSangre}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">No registrado</span>
                  )}
                </div>

                {paciente.peso && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Peso:</span>
                    <span className="text-gray-900">{paciente.peso} kg</span>
                  </div>
                )}
                {paciente.altura && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Talla:</span>
                    <span className="text-gray-900">
                      {paciente.altura > 3 ? paciente.altura : (paciente.altura * 100).toFixed(0)} cm
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Fila completa: Discapacidad */}
            {paciente.discapacidad && paciente.discapacidad !== 'No aplica' && (
              <div className="md:col-span-2 lg:col-span-4 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Condición de Discapacidad
                </h4>
                <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-900">Paciente con Discapacidad</p>
                    <p className="text-sm text-purple-700">
                      Tipo: {paciente.tipoDiscapacidad || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fila completa: Responsable */}
            {paciente.responsable && (paciente.responsable.nombre || paciente.responsable?.nombre) && (
              <div className="md:col-span-2 lg:col-span-4 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                  <UserCheck className="w-3.5 h-3.5" />
                  Responsable del Paciente
                </h4>
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-orange-900">{paciente.responsable.nombre}</p>
                    <p className="text-sm text-orange-700">
                      {paciente.responsable.parentesco && `${paciente.responsable.parentesco} • `}
                      {paciente.responsable.telefono && `Tel: ${paciente.responsable.telefono}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fila completa: Acompañante */}
            {paciente.acompanante && (paciente.acompanante.nombre || paciente.acompanante?.nombre) && (
              <div className="md:col-span-2 lg:col-span-4 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5" />
                  Acompañante
                </h4>
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">{paciente.acompanante.nombre}</p>
                    <p className="text-sm text-blue-700">
                      {paciente.acompanante.parentesco && `${paciente.acompanante.parentesco} • `}
                      {paciente.acompanante.telefono && `Tel: ${paciente.acompanante.telefono}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fila completa: Contacto de emergencia */}
            {paciente.contactosEmergencia && Array.isArray(paciente.contactosEmergencia) && paciente.contactosEmergencia.length > 0 && (
              <div className="md:col-span-2 lg:col-span-4 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                  <Phone className="w-3.5 h-3.5" />
                  Contactos de Emergencia
                </h4>
                <div className="flex flex-wrap gap-4">
                  {paciente.contactosEmergencia.slice(0, 3).map((contacto, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{contacto.nombre}</p>
                        <p className="text-gray-500 text-xs">
                          {contacto.parentesco} • {contacto.telefono}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Antecedentes importantes */}
            {(paciente.enfermedadesCronicas || paciente.antecedentesQuirurgicos) && (
              <div className="md:col-span-2 lg:col-span-4 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                  <Info className="w-3.5 h-3.5" />
                  Antecedentes Relevantes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paciente.enfermedadesCronicas && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-yellow-700 mb-1">Enfermedades Crónicas</p>
                      <p className="text-sm text-gray-700">{paciente.enfermedadesCronicas}</p>
                    </div>
                  )}
                  {paciente.antecedentesQuirurgicos && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Antecedentes Quirúrgicos</p>
                      <p className="text-sm text-gray-700">{paciente.antecedentesQuirurgicos}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nota de cumplimiento normativo */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Res. 1995/1999 • Ley 2015/2020
          </span>
          <span>
            ID: {paciente.id?.slice(0, 8)}...
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
