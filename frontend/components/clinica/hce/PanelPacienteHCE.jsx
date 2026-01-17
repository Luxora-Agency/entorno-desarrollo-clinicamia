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
  Info,
  GraduationCap,
  Briefcase,
  Globe,
  Scissors,
  Pill,
  Users
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
    if (valor < 35) return { texto: 'Obesidad I', color: 'text-red-500 bg-red-50' };
    if (valor < 40) return { texto: 'Obesidad II', color: 'text-red-600 bg-red-50' };
    return { texto: 'Obesidad III', color: 'text-red-700 bg-red-50' };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    ,
      timeZone: 'America/Bogota'
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

  // Helper para parsear arrays de strings separados por coma
  const parseListaTexto = (texto) => {
    if (!texto) return [];
    if (Array.isArray(texto)) return texto;
    return texto.split(',').map(item => item.trim()).filter(Boolean);
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
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Primera fila: 4 columnas de información */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Columna 1: Datos personales */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Datos Personales
                </h4>

                <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Documento:</span>
                    <span className="text-gray-900 font-medium">{paciente.tipoDocumento || 'CC'} {paciente.cedula}</span>
                  </div>
                  {paciente.lugarExpedicion && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expedido en:</span>
                      <span className="text-gray-900">{paciente.lugarExpedicion}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sexo Biológico:</span>
                    <span className="text-gray-900">{paciente.genero || 'N/A'}</span>
                  </div>
                  {paciente.identidadGenero && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Identidad Género:</span>
                      <span className="text-gray-900">{paciente.identidadGenero}</span>
                    </div>
                  )}
                  {paciente.preferenciaLlamado && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Llamar como:</span>
                      <span className="text-gray-900">{paciente.preferenciaLlamado}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estado Civil:</span>
                    <span className="text-gray-900 capitalize">{paciente.estadoCivil?.replace(/_/g, ' ') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">País:</span>
                    <span className="text-gray-900">{paciente.paisNacimiento || paciente.pais || 'N/A'}</span>
                  </div>
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

                <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Departamento:</span>
                    <span className="text-gray-900">{paciente.departamento || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Municipio:</span>
                    <span className="text-gray-900">{paciente.municipio || 'N/A'}</span>
                  </div>
                  {paciente.barrio && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Barrio:</span>
                      <span className="text-gray-900">{paciente.barrio}</span>
                    </div>
                  )}
                  {paciente.zona && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Zona:</span>
                      <span className="text-gray-900 capitalize">{paciente.zona}</span>
                    </div>
                  )}
                  {paciente.direccion && (
                    <div className="pt-1">
                      <span className="text-gray-500 block text-xs">Dirección:</span>
                      <span className="text-gray-900">{paciente.direccion}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Teléfono:</span>
                      <span className="text-gray-900">{paciente.telefono || 'N/A'}</span>
                    </div>
                    {paciente.email && (
                      <div className="pt-1">
                        <span className="text-gray-500 block text-xs">Email:</span>
                        <span className="text-gray-900 text-xs break-all">{paciente.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna 3: Aseguramiento */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Aseguramiento en Salud
                </h4>

                <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">EPS:</span>
                    <span className="text-gray-900 font-medium">{paciente.eps || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Régimen:</span>
                    <span className="text-gray-900 capitalize">{paciente.regimen || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo Afiliación:</span>
                    <span className="text-gray-900 capitalize">{paciente.tipoAfiliacion || 'N/A'}</span>
                  </div>
                  {paciente.nivelSisben && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">SISBEN:</span>
                      <span className="text-gray-900">{paciente.nivelSisben}</span>
                    </div>
                  )}
                  {paciente.numeroAutorizacion && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">No. Autorización:</span>
                      <span className="text-gray-900">{paciente.numeroAutorizacion}</span>
                    </div>
                  )}
                  {paciente.fechaAfiliacion && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fecha Afiliación:</span>
                      <span className="text-gray-900">{formatearFecha(paciente.fechaAfiliacion)}</span>
                    </div>
                  )}
                  {paciente.carnetPoliza && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Carnet/Póliza:</span>
                      <span className="text-gray-900">{paciente.carnetPoliza}</span>
                    </div>
                  )}
                  {paciente.tipoUsuario && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tipo Usuario:</span>
                      <span className="text-gray-900 capitalize">{paciente.tipoUsuario}</span>
                    </div>
                  )}
                  {paciente.arl && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">ARL:</span>
                      <span className="text-gray-900">{paciente.arl}</span>
                    </div>
                  )}
                  {paciente.convenio && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Convenio:</span>
                      <span className="text-gray-900">{paciente.convenio}</span>
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

                <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Tipo Sangre:</span>
                    {paciente.tipoSangre ? (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        <Droplets className="w-3 h-3 mr-1" />
                        {paciente.tipoSangre}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Peso:</span>
                    <span className="text-gray-900">{paciente.peso ? `${paciente.peso} kg` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Talla:</span>
                    <span className="text-gray-900">
                      {paciente.altura ? `${paciente.altura > 3 ? paciente.altura : (paciente.altura * 100).toFixed(0)} cm` : 'N/A'}
                    </span>
                  </div>
                  {imc && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">IMC:</span>
                      <span className={`font-semibold ${clasificacionIMC?.color?.split(' ')[0] || ''}`}>
                        {imc} - {clasificacionIMC?.texto}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Segunda fila: Información laboral y de referencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              {/* Información Laboral y Educativa */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Información Laboral y Educativa
                </h4>
                <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nivel Educación:</span>
                    <span className="text-gray-900 capitalize">{paciente.nivelEducacion?.replace(/_/g, ' ') || paciente.escolaridad || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ocupación:</span>
                    <span className="text-gray-900">{paciente.ocupacion || 'N/A'}</span>
                  </div>
                  {paciente.empleadorActual && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Empleador:</span>
                      <span className="text-gray-900">{paciente.empleadorActual}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Referencia */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  Referencia y Categoría
                </h4>
                <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Referido Por:</span>
                    <span className="text-gray-900">{paciente.referidoPor || 'N/A'}</span>
                  </div>
                  {paciente.nombreRefiere && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quien Refiere:</span>
                      <span className="text-gray-900">{paciente.nombreRefiere}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo Paciente:</span>
                    <span className="text-gray-900">{paciente.tipoPaciente || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Categoría:</span>
                    <span className="text-gray-900">{paciente.categoria || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tercera fila: Alertas especiales */}
            {/* Discapacidad */}
            {paciente.discapacidad && paciente.discapacidad !== 'No aplica' && paciente.discapacidad !== 'Ninguna' && (
              <div className="pt-3 border-t border-gray-100">
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

            {/* Responsable */}
            {paciente.responsable && paciente.responsable.nombre && (
              <div className="pt-3 border-t border-gray-100">
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

            {/* Acompañante */}
            {paciente.acompanante && paciente.acompanante.nombre && (
              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                  <Users className="w-3.5 h-3.5" />
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

            {/* Contactos de Emergencia */}
            {paciente.contactosEmergencia && (
              (() => {
                const contactos = Array.isArray(paciente.contactosEmergencia)
                  ? paciente.contactosEmergencia
                  : JSON.parse(paciente.contactosEmergencia || '[]');
                const contactosValidos = contactos.filter(c => c.nombre);

                if (contactosValidos.length === 0) return null;

                return (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                      <Phone className="w-3.5 h-3.5" />
                      Contactos de Emergencia
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {contactosValidos.map((contacto, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{contacto.nombre}</p>
                            <p className="text-gray-500 text-xs">
                              {contacto.parentesco && `${contacto.parentesco} • `}{contacto.telefono}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}

            {/* Antecedentes Médicos */}
            <div className="pt-3 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-3">
                <Info className="w-3.5 h-3.5" />
                Antecedentes y Condiciones Médicas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Alergias */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Alergias
                  </p>
                  {tieneAlergias ? (
                    <div className="flex flex-wrap gap-1">
                      {parseListaTexto(paciente.alergias).map((alergia, i) => (
                        <Badge key={i} className="bg-red-100 text-red-700 border-red-300 text-xs">{alergia}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin alergias registradas</p>
                  )}
                </div>

                {/* Enfermedades Crónicas */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-yellow-700 mb-2 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Enfermedades Crónicas
                  </p>
                  {paciente.enfermedadesCronicas ? (
                    <div className="flex flex-wrap gap-1">
                      {parseListaTexto(paciente.enfermedadesCronicas).map((enf, i) => (
                        <Badge key={i} className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">{enf}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin enfermedades crónicas</p>
                  )}
                </div>

                {/* Medicamentos Actuales */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                    <Pill className="w-3 h-3" />
                    Medicamentos Actuales
                  </p>
                  {paciente.medicamentosActuales ? (
                    <div className="flex flex-wrap gap-1">
                      {parseListaTexto(paciente.medicamentosActuales).map((med, i) => (
                        <Badge key={i} className="bg-blue-100 text-blue-700 border-blue-300 text-xs">{med}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin medicamentos registrados</p>
                  )}
                </div>

                {/* Antecedentes Quirúrgicos */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-purple-700 mb-2 flex items-center gap-1">
                    <Scissors className="w-3 h-3" />
                    Antecedentes Quirúrgicos
                  </p>
                  {paciente.antecedentesQuirurgicos ? (
                    <div className="flex flex-wrap gap-1">
                      {parseListaTexto(paciente.antecedentesQuirurgicos).map((ant, i) => (
                        <Badge key={i} className="bg-purple-100 text-purple-700 border-purple-300 text-xs">{ant}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin antecedentes quirúrgicos</p>
                  )}
                </div>
              </div>
            </div>
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
