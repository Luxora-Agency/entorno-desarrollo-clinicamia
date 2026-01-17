'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  User,
  Calendar,
  Clock,
  Stethoscope,
  Activity,
  Pill,
  TestTube,
  ClipboardList,
  FileDown,
  Loader2,
  AlertCircle,
  Heart,
  Brain,
  Eye,
  Ear,
  Hand,
  Bone,
  Wind,
  Droplets,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import FirmaProfesional from '../consulta/FirmaProfesional';

// Mapeo de sistemas de examen físico
const SISTEMAS_ICONS = {
  piel: Hand,
  cabeza: User,
  ojos: Eye,
  nariz: User,
  oidos: Ear,
  bocaFaringe: User,
  cuello: User,
  torax: Wind,
  corazon: Heart,
  abdomen: User,
  genitourinario: Droplets,
  extremidades: Bone,
  sistemaNervioso: Brain,
  // Legacy support
  general: User,
  cabezaCuello: User,
  cardiovascular: Heart,
  respiratorio: Wind,
  gastrointestinal: User,
  musculoesqueletico: Bone,
  neurologico: Brain,
  psiquiatrico: Brain,
  endocrino: User,
  hematologico: Droplets,
  narizGarganta: User,
};

const SISTEMAS_LABELS = {
  piel: 'Piel y Faneras',
  cabeza: 'Cabeza',
  ojos: 'Ojos',
  nariz: 'Nariz',
  oidos: 'Oídos',
  bocaFaringe: 'Boca y Faringe',
  cuello: 'Cuello',
  torax: 'Tórax',
  corazon: 'Corazón',
  abdomen: 'Abdomen',
  genitourinario: 'Genitourinario',
  extremidades: 'Extremidades',
  sistemaNervioso: 'Sistema Nervioso',
  // Legacy
  general: 'Aspecto General',
  cabezaCuello: 'Cabeza y Cuello',
  cardiovascular: 'Cardiovascular',
  respiratorio: 'Respiratorio',
  gastrointestinal: 'Gastrointestinal',
  musculoesqueletico: 'Musculoesquelético',
  neurologico: 'Neurológico',
  psiquiatrico: 'Estado Mental',
  endocrino: 'Endocrino',
  hematologico: 'Hematológico/Linfático',
  narizGarganta: 'Nariz y Garganta',
};

export default function TabResumenAtencion({ pacienteId, paciente }) {
  const [ultimaConsulta, setUltimaConsulta] = useState(null);
  const [antecedentes, setAntecedentes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [descargandoPDF, setDescargandoPDF] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    antecedentes: true,
    motivoConsulta: true,
    signosVitales: true,
    examenFisico: true,
    paraclinicos: false,
    analisis: true,
    diagnosticos: true,
    formulacion: true,
    ordenes: true,
  });

  useEffect(() => {
    if (pacienteId) {
      cargarDatos();
    }
  }, [pacienteId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Cargar última evolución/consulta
      const [evolucionesRes, antecedentesRes] = await Promise.all([
        fetch(`${apiUrl}/evoluciones?paciente_id=${pacienteId}&limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/pacientes/${pacienteId}/antecedentes`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null)
      ]);

      if (evolucionesRes.ok) {
        const evData = await evolucionesRes.json();
        const evoluciones = evData.data || [];
        if (evoluciones.length > 0) {
          setUltimaConsulta(evoluciones[0]);
        }
      }

      if (antecedentesRes && antecedentesRes.ok) {
        const antData = await antecedentesRes.json();
        setAntecedentes(antData.data || antData);
      }
    } catch (err) {
      console.error('Error cargando resumen de atención:', err);
      setError('Error al cargar el resumen de atención');
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async () => {
    if (!ultimaConsulta?.id) return;

    try {
      setDescargandoPDF(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/consultas/${ultimaConsulta.id}/resumen-atencion/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ResumenAtencion_${paciente?.documento || pacienteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error descargando PDF:', err);
      alert('Error al descargar el PDF');
    } finally {
      setDescargandoPDF(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    ,
      timeZone: 'America/Bogota'
    });
  };

  const SectionHeader = ({ title, icon: Icon, section, badge }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-indigo-600" />
        <span className="font-semibold text-gray-800">{title}</span>
        {badge && <Badge variant="secondary" className="ml-2">{badge}</Badge>}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500" />
      )}
    </button>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-600">Cargando resumen de atención...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={cargarDatos} className="mt-4" variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!ultimaConsulta) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin consultas registradas</h3>
          <p className="text-gray-500">
            No hay consultas registradas para este paciente.
            El resumen de atención se generará automáticamente después de la primera consulta.
          </p>
        </CardContent>
      </Card>
    );
  }

  const soap = ultimaConsulta.soap || {};
  const signosVitales = ultimaConsulta.signosVitales || ultimaConsulta.vitales || {};
  const examenFisico = signosVitales.examenFisico || ultimaConsulta.examenFisico || {};
  const diagnosticos = ultimaConsulta.diagnosticos || [];
  const prescripciones = ultimaConsulta.prescripciones || [];
  const ordenes = ultimaConsulta.ordenes || [];
  const doctor = ultimaConsulta.doctor || ultimaConsulta.profesional || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Resumen de Atención</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Última consulta: {formatDate(ultimaConsulta.fechaEvolucion || ultimaConsulta.createdAt)}
                </p>
              </div>
            </div>
            <Button
              onClick={descargarPDF}
              disabled={descargandoPDF}
              className="bg-red-600 hover:bg-red-700"
            >
              {descargandoPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Descargar PDF
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Identificación del Paciente */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">Identificación del Paciente</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Paciente</p>
              <p className="font-semibold">{paciente?.nombre} {paciente?.apellido}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Documento</p>
              <p className="font-semibold">{paciente?.tipoDocumento}: {paciente?.documento}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Fecha Atención</p>
              <p className="font-semibold">{formatDate(ultimaConsulta.fechaEvolucion || ultimaConsulta.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Aseguradora</p>
              <p className="font-semibold">{paciente?.eps || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Antecedentes */}
      <Card>
        <SectionHeader title="Antecedentes" icon={History} section="antecedentes" />
        {expandedSections.antecedentes && (
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Farmacológicos</h4>
                <p className="text-sm text-gray-700">
                  {antecedentes?.farmacologicos?.length > 0
                    ? antecedentes.farmacologicos.map(a => a.medicamento).join(', ')
                    : 'Sin antecedentes farmacológicos registrados'}
                </p>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <h4 className="font-semibold text-pink-800 mb-2">Gineco-Obstétricos</h4>
                <p className="text-sm text-gray-700">
                  {antecedentes?.ginecoObstetrico
                    ? `G${antecedentes.ginecoObstetrico.gestaciones || 0} P${antecedentes.ginecoObstetrico.partos || 0} A${antecedentes.ginecoObstetrico.abortos || 0} C${antecedentes.ginecoObstetrico.cesareas || 0}`
                    : 'Sin antecedentes registrados'}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">Patológicos</h4>
                <p className="text-sm text-gray-700">
                  {antecedentes?.patologicos?.length > 0
                    ? antecedentes.patologicos.map(a => a.diagnostico).join(', ')
                    : 'Sin antecedentes patológicos registrados'}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Quirúrgicos</h4>
                <p className="text-sm text-gray-700">
                  {antecedentes?.quirurgicos?.length > 0
                    ? antecedentes.quirurgicos.map(a => a.procedimiento).join(', ')
                    : 'Sin antecedentes quirúrgicos registrados'}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Motivo de Consulta y Enfermedad Actual */}
      <Card>
        <SectionHeader title="Motivo de Consulta" icon={ClipboardList} section="motivoConsulta" />
        {expandedSections.motivoConsulta && (
          <CardContent className="pt-4 space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Motivo de Consulta</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                {soap.subjetivo?.motivoConsulta || soap.S?.motivoConsulta || ultimaConsulta.motivoConsulta || 'No especificado'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Enfermedad Actual</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                {soap.subjetivo?.enfermedadActual || soap.S?.enfermedadActual || ultimaConsulta.enfermedadActual || 'No especificado'}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Signos Vitales */}
      <Card>
        <SectionHeader title="Signos Vitales" icon={Activity} section="signosVitales" />
        {expandedSections.signosVitales && (
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-500">FC</p>
                <p className="text-xl font-bold text-red-600">{signosVitales.frecuenciaCardiaca || '--'}</p>
                <p className="text-xs text-gray-500">lpm</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500">FR</p>
                <p className="text-xl font-bold text-blue-600">{signosVitales.frecuenciaRespiratoria || '--'}</p>
                <p className="text-xs text-gray-500">rpm</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-500">Temp</p>
                <p className="text-xl font-bold text-orange-600">{signosVitales.temperatura || '--'}</p>
                <p className="text-xs text-gray-500">°C</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-500">PA</p>
                <p className="text-xl font-bold text-purple-600">
                  {signosVitales.presionSistolica || '--'}/{signosVitales.presionDiastolica || '--'}
                </p>
                <p className="text-xs text-gray-500">mmHg</p>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <p className="text-xs text-gray-500">SatO₂</p>
                <p className="text-xl font-bold text-cyan-600">{signosVitales.saturacionOxigeno || '--'}</p>
                <p className="text-xs text-gray-500">%</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500">Peso</p>
                <p className="text-xl font-bold text-green-600">{signosVitales.peso || '--'}</p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="text-center p-3 bg-teal-50 rounded-lg">
                <p className="text-xs text-gray-500">Talla</p>
                <p className="text-xl font-bold text-teal-600">{signosVitales.talla || '--'}</p>
                <p className="text-xs text-gray-500">cm</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Examen Físico */}
      {Object.keys(examenFisico).length > 0 && (
        <Card>
          <SectionHeader
            title="Examen Físico"
            icon={Stethoscope}
            section="examenFisico"
            badge={Object.values(examenFisico).filter(v => v && v !== 'Sin alteraciones').length + ' hallazgos'}
          />
          {expandedSections.examenFisico && (
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(examenFisico).map(([sistema, hallazgo]) => {
                  const Icon = SISTEMAS_ICONS[sistema] || Stethoscope;
                  const label = SISTEMAS_LABELS[sistema] || sistema;
                  const tieneAlteracion = hallazgo && hallazgo !== 'Sin alteraciones';

                  return (
                    <div
                      key={sistema}
                      className={`p-3 rounded-lg border ${
                        tieneAlteracion ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-4 w-4 ${tieneAlteracion ? 'text-amber-600' : 'text-gray-500'}`} />
                        <span className="font-medium text-sm">{label}</span>
                      </div>
                      <p className={`text-sm ${tieneAlteracion ? 'text-amber-800' : 'text-gray-600'}`}>
                        {hallazgo || 'Sin alteraciones'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Análisis Médico */}
      {(soap.analisis || soap.A) && (
        <Card>
          <SectionHeader title="Análisis Médico" icon={Brain} section="analisis" />
          {expandedSections.analisis && (
            <CardContent className="pt-4">
              <p className="text-gray-700 bg-indigo-50 p-4 rounded-lg whitespace-pre-wrap">
                {soap.analisis?.resumen || soap.A?.resumen || soap.analisis || soap.A}
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Diagnósticos */}
      <Card>
        <SectionHeader
          title="Diagnósticos"
          icon={ClipboardList}
          section="diagnosticos"
          badge={diagnosticos.length}
        />
        {expandedSections.diagnosticos && (
          <CardContent className="pt-4">
            {diagnosticos.length > 0 ? (
              <div className="space-y-2">
                {diagnosticos.map((dx, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Badge variant={dx.tipo === 'PRINCIPAL' ? 'default' : 'secondary'}>
                      {dx.tipo === 'PRINCIPAL' ? 'Principal' : 'Secundario'}
                    </Badge>
                    <div>
                      <p className="font-semibold">{dx.descripcion || dx.nombre}</p>
                      <p className="text-sm text-gray-500">CIE-10: {dx.codigoCie10 || dx.codigo || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Sin diagnósticos registrados</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Formulación */}
      <Card>
        <SectionHeader
          title="Formulación"
          icon={Pill}
          section="formulacion"
          badge={prescripciones.length}
        />
        {expandedSections.formulacion && (
          <CardContent className="pt-4">
            {prescripciones.length > 0 ? (
              <div className="space-y-2">
                {prescripciones.map((med, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg">
                    <p className="font-semibold text-green-800">{med.medicamento || med.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {med.dosis} - {med.via} - {med.frecuencia} - {med.duracion}
                    </p>
                    {med.instrucciones && (
                      <p className="text-sm text-gray-500 mt-1">{med.instrucciones}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Sin medicamentos formulados</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Órdenes Médicas */}
      <Card>
        <SectionHeader
          title="Órdenes Médicas"
          icon={TestTube}
          section="ordenes"
          badge={ordenes.length}
        />
        {expandedSections.ordenes && (
          <CardContent className="pt-4">
            {ordenes.length > 0 ? (
              <div className="space-y-2">
                {ordenes.map((orden, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-800">{orden.nombre || orden.descripcion}</p>
                      <p className="text-sm text-gray-600">{orden.tipo || 'Orden médica'}</p>
                    </div>
                    <Badge variant={orden.estado === 'COMPLETADA' ? 'success' : 'secondary'}>
                      {orden.estado || 'Pendiente'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Sin órdenes médicas</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Firma Profesional */}
      {doctor && (doctor.nombre || doctor.id) && (
        <FirmaProfesional
          doctor={doctor}
          fechaFirma={ultimaConsulta.fechaEvolucion || ultimaConsulta.createdAt}
        />
      )}
    </div>
  );
}
