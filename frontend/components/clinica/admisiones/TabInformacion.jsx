'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, User, Phone, MapPin, Building2, Heart, AlertCircle, UserCheck, Users, Briefcase, Globe, Calendar, Scale, Ruler, Droplet, Scissors, GraduationCap, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TabInformacion({ paciente }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentos();
  }, [paciente]);

  const fetchDocumentos = async () => {
    if (!paciente?.id) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/documentos-paciente/paciente/${paciente.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setDocumentos(result.data?.documentos || []);
      }
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentoId, nombreOriginal) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/documentos-paciente/download/${documentoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreOriginal;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error al descargar documento:', error);
      alert('Error al descargar el documento');
    }
  };

  const tieneDiscapacidad = paciente.discapacidad === 'Aplica';

  // Calcular edad
  const calcularEdad = () => {
    if (!paciente.fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(paciente.fechaNacimiento);
    let años = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    let dias = hoy.getDate() - nacimiento.getDate();

    if (dias < 0) {
      meses--;
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      dias += mesAnterior.getDate();
    }
    if (meses < 0) {
      años--;
      meses += 12;
    }

    const partes = [];
    if (años > 0) partes.push(`${años} ${años === 1 ? 'año' : 'años'}`);
    if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
    if (años === 0 && meses === 0 && dias > 0) partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);

    return partes.length > 0 ? partes.join(', ') : 'Recién nacido';
  };

  // Calcular IMC
  const calcularIMC = () => {
    if (!paciente.peso || !paciente.altura) return null;
    const peso = parseFloat(paciente.peso);
    let altura = parseFloat(paciente.altura);
    if (altura > 3) altura = altura / 100;
    const imc = peso / (altura * altura);

    let categoria = '';
    let colorClase = '';
    if (imc < 18.5) {
      categoria = 'Bajo Peso';
      colorClase = 'text-yellow-600';
    } else if (imc >= 18.5 && imc < 25) {
      categoria = 'Normal';
      colorClase = 'text-emerald-600';
    } else if (imc >= 25 && imc < 30) {
      categoria = 'Sobrepeso';
      colorClase = 'text-orange-600';
    } else if (imc >= 30 && imc < 35) {
      categoria = 'Obesidad Grado I';
      colorClase = 'text-red-500';
    } else if (imc >= 35 && imc < 40) {
      categoria = 'Obesidad Grado II';
      colorClase = 'text-red-600';
    } else {
      categoria = 'Obesidad Grado III';
      colorClase = 'text-red-700';
    }

    return { valor: imc.toFixed(1), categoria, colorClase };
  };

  const edad = calcularEdad();
  const imc = calcularIMC();

  return (
    <div className="space-y-6">
      {/* Condición de Discapacidad */}
      {tieneDiscapacidad && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <AlertCircle className="w-5 h-5" />
              Condición de Discapacidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-purple-900">Paciente con Discapacidad</p>
                <p className="text-sm text-purple-700">
                  Tipo: {paciente.tipoDiscapacidad || 'No especificado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsable del Paciente */}
      {paciente.responsable && paciente.responsable.nombre && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <UserCheck className="w-5 h-5" />
              Responsable del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-orange-900">{paciente.responsable.nombre}</p>
                <p className="text-sm text-orange-700">
                  {paciente.responsable.parentesco && `${paciente.responsable.parentesco}`}
                  {paciente.responsable.telefono && ` | Tel: ${paciente.responsable.telefono}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acompañante */}
      {paciente.acompanante && paciente.acompanante.nombre && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Users className="w-5 h-5" />
              Acompañante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-900">{paciente.acompanante.nombre}</p>
                <p className="text-sm text-blue-700">
                  {paciente.acompanante.parentesco && `${paciente.acompanante.parentesco}`}
                  {paciente.acompanante.telefono && ` | Tel: ${paciente.acompanante.telefono}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Tipo de Documento</span>
            <p className="font-semibold text-gray-900">{paciente.tipoDocumento || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Número de Documento</span>
            <p className="font-semibold text-gray-900">{paciente.cedula || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Lugar de Expedición</span>
            <p className="font-semibold text-gray-900">{paciente.lugarExpedicion || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Fecha de Nacimiento</span>
            <p className="font-semibold text-gray-900">
              {paciente.fechaNacimiento ? new Date(paciente.fechaNacimiento).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Edad</span>
            <p className="font-semibold text-gray-900">{edad || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Sexo Biológico</span>
            <p className="font-semibold text-gray-900">{paciente.genero || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Identidad de Género</span>
            <p className="font-semibold text-gray-900">{paciente.identidadGenero || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Preferencia de Llamado</span>
            <p className="font-semibold text-gray-900">{paciente.preferenciaLlamado || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Estado Civil</span>
            <p className="font-semibold text-gray-900 capitalize">{paciente.estadoCivil?.replace(/_/g, ' ') || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Ocupación</span>
            <p className="font-semibold text-gray-900">{paciente.ocupacion || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">País de Nacimiento</span>
            <p className="font-semibold text-gray-900">{paciente.paisNacimiento || paciente.pais || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Etnia</span>
            <p className="font-semibold text-gray-900">{paciente.etnia || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Ubicación y Residencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-600" />
            Ubicación y Residencia
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Departamento</span>
            <p className="font-semibold text-gray-900">{paciente.departamento || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Municipio</span>
            <p className="font-semibold text-gray-900">{paciente.municipio || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Barrio</span>
            <p className="font-semibold text-gray-900">{paciente.barrio || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Zona</span>
            <p className="font-semibold text-gray-900 capitalize">{paciente.zona || 'N/A'}</p>
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-4">
            <span className="text-xs text-gray-500 uppercase font-medium">Dirección</span>
            <p className="font-semibold text-gray-900 break-words">{paciente.direccion || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Información de Contacto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-gray-600" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Teléfono</span>
            <p className="font-semibold text-gray-900">{paciente.telefono || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Email</span>
            <p className="font-semibold text-gray-900 break-all">{paciente.email || 'N/A'}</p>
          </div>
          {paciente.contactosEmergencia && (
            <div className="sm:col-span-2 pt-2 border-t">
              <span className="text-xs text-gray-500 uppercase font-medium block mb-3">Contactos de Emergencia</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Array.isArray(paciente.contactosEmergencia)
                  ? paciente.contactosEmergencia
                  : JSON.parse(paciente.contactosEmergencia || '[]')
                ).filter(c => c.nombre).map((contacto, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{contacto.nombre}</p>
                      <p className="text-xs text-gray-600">
                        {contacto.parentesco && `${contacto.parentesco} | `}{contacto.telefono}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información Laboral y Educativa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-gray-600" />
            Información Laboral y Educativa
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Nivel de Educación</span>
            <p className="font-semibold text-gray-900 capitalize">{paciente.nivelEducacion?.replace(/_/g, ' ') || paciente.escolaridad || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Ocupación</span>
            <p className="font-semibold text-gray-900">{paciente.ocupacion || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Empleador Actual</span>
            <p className="font-semibold text-gray-900">{paciente.empleadorActual || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Aseguramiento en Salud */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-600" />
            Aseguramiento en Salud
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">EPS / Aseguradora</span>
            <p className="font-semibold text-gray-900">{paciente.eps || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Régimen</span>
            <p className="font-semibold text-gray-900 capitalize">{paciente.regimen || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Tipo de Afiliación</span>
            <p className="font-semibold text-gray-900 capitalize">{paciente.tipoAfiliacion || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Nivel SISBEN</span>
            <p className="font-semibold text-gray-900">{paciente.nivelSisben || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Número de Autorización</span>
            <p className="font-semibold text-gray-900">{paciente.numeroAutorizacion || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Fecha de Afiliación</span>
            <p className="font-semibold text-gray-900">
              {paciente.fechaAfiliacion ? new Date(paciente.fechaAfiliacion).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Carnet / Póliza</span>
            <p className="font-semibold text-gray-900">{paciente.carnetPoliza || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Tipo de Usuario</span>
            <p className="font-semibold text-gray-900 capitalize">{paciente.tipoUsuario || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">ARL</span>
            <p className="font-semibold text-gray-900">{paciente.arl || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Convenio</span>
            <p className="font-semibold text-gray-900">{paciente.convenio || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Información de Referencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-600" />
            Información de Referencia y Categoría
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Referido Por</span>
            <p className="font-semibold text-gray-900">{paciente.referidoPor || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Nombre de Quien Refiere</span>
            <p className="font-semibold text-gray-900">{paciente.nombreRefiere || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Tipo de Paciente</span>
            <p className="font-semibold text-gray-900">{paciente.tipoPaciente || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Categoría</span>
            <p className="font-semibold text-gray-900">{paciente.categoria || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Información Médica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-gray-600" />
            Información Médica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Tipo de Sangre</span>
              <div>
                {paciente.tipoSangre ? (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-sm">
                    <Droplet className="w-3 h-3 mr-1" />
                    {paciente.tipoSangre}
                  </Badge>
                ) : <span className="text-gray-900 font-semibold">N/A</span>}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Peso</span>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <Scale className="w-4 h-4 text-gray-400" />
                {paciente.peso ? `${paciente.peso} kg` : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Altura</span>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <Ruler className="w-4 h-4 text-gray-400" />
                {paciente.altura ? `${paciente.altura > 3 ? paciente.altura : (paciente.altura * 100).toFixed(0)} cm` : 'N/A'}
              </p>
            </div>
            {imc && (
              <div className="space-y-1 col-span-2">
                <span className="text-xs text-gray-500 uppercase font-medium">IMC</span>
                <p className={`font-semibold ${imc.colorClase}`}>
                  {imc.valor} - {imc.categoria}
                </p>
              </div>
            )}
          </div>

          {/* Alergias */}
          <div className="pt-3 border-t">
            <span className="text-xs text-gray-500 uppercase font-medium block mb-2">
              <AlertCircle className="w-3 h-3 inline mr-1 text-red-500" />
              Alergias
            </span>
            {paciente.alergias ? (
              <div className="flex flex-wrap gap-2">
                {(typeof paciente.alergias === 'string'
                  ? paciente.alergias.split(',').map(a => a.trim()).filter(Boolean)
                  : paciente.alergias
                ).map((alergia, i) => (
                  <Badge key={i} className="bg-red-100 text-red-700 border-red-200">{alergia}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin alergias registradas</p>
            )}
          </div>

          {/* Enfermedades Crónicas */}
          <div className="pt-3 border-t">
            <span className="text-xs text-gray-500 uppercase font-medium block mb-2">
              <Heart className="w-3 h-3 inline mr-1 text-yellow-500" />
              Enfermedades Crónicas
            </span>
            {paciente.enfermedadesCronicas ? (
              <div className="flex flex-wrap gap-2">
                {(typeof paciente.enfermedadesCronicas === 'string'
                  ? paciente.enfermedadesCronicas.split(',').map(e => e.trim()).filter(Boolean)
                  : paciente.enfermedadesCronicas
                ).map((enfermedad, i) => (
                  <Badge key={i} className="bg-yellow-100 text-yellow-700 border-yellow-200">{enfermedad}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin enfermedades crónicas registradas</p>
            )}
          </div>

          {/* Medicamentos Actuales */}
          <div className="pt-3 border-t">
            <span className="text-xs text-gray-500 uppercase font-medium block mb-2">
              <FileText className="w-3 h-3 inline mr-1 text-blue-500" />
              Medicamentos Actuales
            </span>
            {paciente.medicamentosActuales ? (
              <div className="flex flex-wrap gap-2">
                {(typeof paciente.medicamentosActuales === 'string'
                  ? paciente.medicamentosActuales.split(',').map(m => m.trim()).filter(Boolean)
                  : paciente.medicamentosActuales
                ).map((medicamento, i) => (
                  <Badge key={i} className="bg-blue-100 text-blue-700 border-blue-200">{medicamento}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin medicamentos registrados</p>
            )}
          </div>

          {/* Antecedentes Quirúrgicos */}
          <div className="pt-3 border-t">
            <span className="text-xs text-gray-500 uppercase font-medium block mb-2">
              <Scissors className="w-3 h-3 inline mr-1 text-purple-500" />
              Antecedentes Quirúrgicos
            </span>
            {paciente.antecedentesQuirurgicos ? (
              <div className="flex flex-wrap gap-2">
                {(typeof paciente.antecedentesQuirurgicos === 'string'
                  ? paciente.antecedentesQuirurgicos.split(',').map(a => a.trim()).filter(Boolean)
                  : paciente.antecedentesQuirurgicos
                ).map((antecedente, i) => (
                  <Badge key={i} className="bg-purple-100 text-purple-700 border-purple-200">{antecedente}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin antecedentes quirúrgicos registrados</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Documentos Adjuntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600 text-sm">Cargando documentos...</p>
          ) : documentos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{doc.nombreOriginal}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.tamano / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                    onClick={() => handleDownload(doc.id, doc.nombreOriginal)}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Descargar</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No hay documentos adjuntos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
