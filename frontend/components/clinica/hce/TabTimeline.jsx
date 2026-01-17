'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Clock,
  FileText,
  Activity,
  ClipboardList,
  AlertCircle,
  Stethoscope,
  Pill,
  Calendar,
  Filter,
  Lock,
  ShieldCheck,
  TestTubes,
  Scan,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function TabTimeline({ pacienteId }) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros avanzados
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    fechaDesde: '',
    fechaHasta: '',
    doctor: 'todos',
    busqueda: ''
  });
  const [filtrosExpandido, setFiltrosExpandido] = useState(false);

  // Lista de doctores únicos para el filtro
  const [doctoresUnicos, setDoctoresUnicos] = useState([]);

  useEffect(() => {
    if (pacienteId) {
      loadEventos();
    }
  }, [pacienteId]);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Cargar datos de todos los módulos en paralelo
      const [evoluciones, signos, diagnosticos, alertas, procedimientos, prescripciones, ordenesMedicas] = await Promise.all([
        fetch(`${apiUrl}/evoluciones?paciente_id=${pacienteId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : { data: [] }),

        fetch(`${apiUrl}/signos-vitales?paciente_id=${pacienteId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : { data: [] }),

        fetch(`${apiUrl}/diagnosticos?paciente_id=${pacienteId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : { data: [] }),

        fetch(`${apiUrl}/alertas?paciente_id=${pacienteId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : { data: [] }),

        fetch(`${apiUrl}/procedimientos?pacienteId=${pacienteId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : { data: [] }),

        fetch(`${apiUrl}/prescripciones?pacienteId=${pacienteId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : { data: [] }),

        fetch(`${apiUrl}/ordenes-medicas?paciente_id=${pacienteId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : { data: [] }),
      ]);

      // Mapear todo a eventos unificados
      const eventosUnificados = [
        ...(evoluciones.data || []).map(e => ({
          ...e,
          tipo: 'evolucion',
          fecha: e.fechaEvolucion || e.createdAt,
          titulo: e.tipoEvolucion === 'Seguimiento' ? 'Consulta Médica - SOAP' : `Evolución: ${e.tipoEvolucion || 'SOAP'}`,
          descripcion: e.motivoConsulta || e.subjetivo?.substring(0, 100) || 'Evolución clínica registrada',
          firmada: e.firmada,
          hashRegistro: e.hashRegistro,
          esPrimeraConsulta: e.esPrimeraConsulta,
        })),
        ...(signos.data || []).map(s => ({
          ...s,
          tipo: 'signos',
          fecha: s.fechaRegistro || s.createdAt,
          titulo: 'Signos Vitales',
          descripcion: `PA: ${s.presionSistolica || '--'}/${s.presionDiastolica || '--'} mmHg | FC: ${s.frecuenciaCardiaca || '--'} lpm | Temp: ${s.temperatura || 'N/A'}°C | SpO2: ${s.saturacionOxigeno || '--'}%`,
        })),
        ...(diagnosticos.data || []).map(d => ({
          ...d,
          tipo: 'diagnostico',
          fecha: d.fechaDiagnostico || d.createdAt,
          titulo: d.tipoDiagnostico === 'Principal' ? 'Diagnóstico Principal' : 'Diagnóstico',
          descripcion: `${d.codigoCIE10 || d.codigoCIE11 || ''} - ${d.descripcionCIE10 || d.descripcionCIE11 || d.descripcion || 'Sin descripción'}`,
        })),
        ...(alertas.data || []).map(a => ({
          ...a,
          tipo: 'alerta',
          fecha: a.fechaAlerta || a.createdAt,
          titulo: `Alerta: ${a.titulo || a.tipo}`,
          descripcion: a.descripcion || a.observaciones,
        })),
        ...(procedimientos.data || []).map(p => ({
          ...p,
          tipo: 'procedimiento',
          fecha: p.fechaRealizada || p.fechaProgramada || p.createdAt,
          titulo: `Procedimiento: ${p.nombre || 'Sin nombre'}`,
          descripcion: `${p.codigoCups ? `CUPS: ${p.codigoCups} - ` : ''}Estado: ${p.estado || 'Pendiente'}`,
        })),
        ...(prescripciones.data || []).map(p => ({
          ...p,
          tipo: 'prescripcion',
          fecha: p.fechaPrescripcion || p.createdAt,
          titulo: 'Prescripción Médica',
          descripcion: p.medicamentos?.length > 0
            ? p.medicamentos.map(m => m.producto?.nombre || m.nombre || 'Medicamento').join(', ').substring(0, 80)
            : `${p.medicamentos?.length || 0} medicamento(s)`,
        })),
        // Órdenes Médicas (Laboratorio, Exámenes, Procedimientos, Kits)
        ...(ordenesMedicas.data || []).map(o => {
          // Detectar si es un kit aplicado
          const esKit = o.observaciones?.startsWith('APLICACIÓN DE KIT:');
          const nombreKit = esKit
            ? o.observaciones.split('\n')[0].replace('APLICACIÓN DE KIT:', '').trim()
            : null;

          return {
            ...o,
            tipo: esKit ? 'prescripcion' : 'laboratorio',
            fecha: o.fechaEjecucion || o.fechaOrden || o.createdAt,
            titulo: esKit
              ? `Kit Aplicado: ${nombreKit}`
              : (o.estado === 'Completada'
                  ? `Resultado: ${o.examenProcedimiento?.nombre || o.descripcion || 'Examen'}`
                  : `Orden: ${o.examenProcedimiento?.nombre || o.descripcion || 'Examen'}`),
            descripcion: esKit
              ? `Precio: $${o.precioAplicado || '0'} | Estado: ${o.estado || 'Pendiente'}`
              : (o.estado === 'Completada' && o.resultados
                  ? 'Ver resultados disponibles'
                  : `Estado: ${o.estado || 'Pendiente'}`),
          };
        }),
      ];

      // Ordenar por fecha descendente
      const ordenados = eventosUnificados.sort((a, b) =>
        new Date(b.fecha) - new Date(a.fecha)
      );

      // Extraer doctores únicos para el filtro
      const doctores = new Map();
      ordenados.forEach(e => {
        const doc = e.doctor || e.profesional || e.medicoResponsable || e.medico || e.registrador;
        if (doc?.id && doc?.nombre) {
          doctores.set(doc.id, {
            id: doc.id,
            nombre: `${doc.nombre} ${doc.apellido || ''}`.trim()
          });
        }
      });
      setDoctoresUnicos(Array.from(doctores.values()));

      setEventos(ordenados);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  const getEventoConfig = (tipo) => {
    switch (tipo) {
      case 'evolucion':
        return { icon: FileText, color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-300' };
      case 'signos':
        return { icon: Activity, color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-300' };
      case 'diagnostico':
        return { icon: ClipboardList, color: 'bg-pink-100 text-pink-700', borderColor: 'border-pink-300' };
      case 'alerta':
        return { icon: AlertCircle, color: 'bg-orange-100 text-orange-700', borderColor: 'border-orange-300' };
      case 'procedimiento':
        return { icon: Stethoscope, color: 'bg-indigo-100 text-indigo-700', borderColor: 'border-indigo-300' };
      case 'prescripcion':
        return { icon: Pill, color: 'bg-green-100 text-green-700', borderColor: 'border-green-300' };
      case 'laboratorio':
        return { icon: TestTubes, color: 'bg-teal-100 text-teal-700', borderColor: 'border-teal-300' };
      case 'imagenologia':
        return { icon: Scan, color: 'bg-cyan-100 text-cyan-700', borderColor: 'border-cyan-300' };
      default:
        return { icon: Calendar, color: 'bg-gray-100 text-gray-700', borderColor: 'border-gray-300' };
    }
  };

  // Aplicar todos los filtros
  const eventosFiltrados = useMemo(() => {
    let resultado = [...eventos];

    // Filtrar por tipo
    if (filtros.tipo !== 'todos') {
      resultado = resultado.filter(e => e.tipo === filtros.tipo);
    }

    // Filtrar por fecha desde
    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde);
      fechaDesde.setHours(0, 0, 0, 0);
      resultado = resultado.filter(e => new Date(e.fecha) >= fechaDesde);
    }

    // Filtrar por fecha hasta
    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      resultado = resultado.filter(e => new Date(e.fecha) <= fechaHasta);
    }

    // Filtrar por doctor
    if (filtros.doctor !== 'todos') {
      resultado = resultado.filter(e => {
        const doc = e.doctor || e.profesional || e.medicoResponsable || e.medico || e.registrador;
        return doc?.id === filtros.doctor;
      });
    }

    // Filtrar por búsqueda de texto
    if (filtros.busqueda.trim()) {
      const termino = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(e =>
        e.titulo?.toLowerCase().includes(termino) ||
        e.descripcion?.toLowerCase().includes(termino) ||
        e.subjetivo?.toLowerCase().includes(termino) ||
        e.objetivo?.toLowerCase().includes(termino) ||
        e.analisis?.toLowerCase().includes(termino) ||
        e.plan?.toLowerCase().includes(termino)
      );
    }

    return resultado;
  }, [eventos, filtros]);

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltros({
      tipo: 'todos',
      fechaDesde: '',
      fechaHasta: '',
      doctor: 'todos',
      busqueda: ''
    });
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = filtros.tipo !== 'todos' ||
    filtros.fechaDesde || filtros.fechaHasta ||
    filtros.doctor !== 'todos' || filtros.busqueda.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-cyan-200 bg-gradient-to-r from-cyan-50 to-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-600 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Timeline Clínico Integrado</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Vista cronológica unificada de todos los eventos médicos del paciente
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadEventos}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button
                variant={filtrosExpandido ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltrosExpandido(!filtrosExpandido)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {hayFiltrosActivos && (
                  <Badge className="bg-red-500 text-white text-[10px] px-1.5">!</Badge>
                )}
                {filtrosExpandido ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Barra de Filtros Avanzados */}
        <Collapsible open={filtrosExpandido}>
          <CollapsibleContent className="px-6 pb-4">
            <div className="bg-white border border-cyan-200 rounded-lg p-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Búsqueda de texto */}
                <div className="lg:col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Buscar en contenido</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar en títulos, descripciones, SOAP..."
                      value={filtros.busqueda}
                      onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Tipo de evento */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo de evento</label>
                  <Select value={filtros.tipo} onValueChange={(v) => setFiltros({ ...filtros, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los eventos</SelectItem>
                      <SelectItem value="evolucion">Evoluciones SOAP</SelectItem>
                      <SelectItem value="signos">Signos Vitales</SelectItem>
                      <SelectItem value="diagnostico">Diagnósticos</SelectItem>
                      <SelectItem value="alerta">Alertas</SelectItem>
                      <SelectItem value="procedimiento">Procedimientos</SelectItem>
                      <SelectItem value="prescripcion">Prescripciones</SelectItem>
                      <SelectItem value="laboratorio">Órdenes/Laboratorio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fecha desde */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Desde</label>
                  <Input
                    type="date"
                    value={filtros.fechaDesde}
                    onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                  />
                </div>

                {/* Fecha hasta */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Hasta</label>
                  <Input
                    type="date"
                    value={filtros.fechaHasta}
                    onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                {/* Filtro por doctor */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <Select value={filtros.doctor} onValueChange={(v) => setFiltros({ ...filtros, doctor: v })}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los profesionales</SelectItem>
                      {doctoresUnicos.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          Dr. {doc.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Limpiar filtros y contador */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Mostrando <strong>{eventosFiltrados.length}</strong> de <strong>{eventos.length}</strong> eventos
                  </span>
                  {hayFiltrosActivos && (
                    <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="gap-1 text-red-600 hover:text-red-700">
                      <X className="h-3 w-3" />
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Timeline */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 py-8">Cargando timeline...</p>
          </CardContent>
        </Card>
      ) : eventosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay eventos registrados</p>
              <p className="text-sm text-gray-500">
                Los eventos aparecerán aquí a medida que se registren durante las consultas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 text-center">
                <FileText className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-700">
                  {eventos.filter(e => e.tipo === 'evolucion').length}
                </p>
                <p className="text-xs text-blue-600">SOAP</p>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-3 text-center">
                <Activity className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-700">
                  {eventos.filter(e => e.tipo === 'signos').length}
                </p>
                <p className="text-xs text-purple-600">Vitales</p>
              </CardContent>
            </Card>
            <Card className="border-pink-200 bg-pink-50">
              <CardContent className="p-3 text-center">
                <ClipboardList className="h-6 w-6 text-pink-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-pink-700">
                  {eventos.filter(e => e.tipo === 'diagnostico').length}
                </p>
                <p className="text-xs text-pink-600">Dx</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3 text-center">
                <AlertCircle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-700">
                  {eventos.filter(e => e.tipo === 'alerta').length}
                </p>
                <p className="text-xs text-orange-600">Alertas</p>
              </CardContent>
            </Card>
            <Card className="border-indigo-200 bg-indigo-50">
              <CardContent className="p-3 text-center">
                <Stethoscope className="h-6 w-6 text-indigo-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-indigo-700">
                  {eventos.filter(e => e.tipo === 'procedimiento').length}
                </p>
                <p className="text-xs text-indigo-600">Proc</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3 text-center">
                <Pill className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700">
                  {eventos.filter(e => e.tipo === 'prescripcion').length}
                </p>
                <p className="text-xs text-green-600">Rx</p>
              </CardContent>
            </Card>
            <Card className="border-teal-200 bg-teal-50">
              <CardContent className="p-3 text-center">
                <TestTubes className="h-6 w-6 text-teal-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-teal-700">
                  {eventos.filter(e => e.tipo === 'laboratorio').length}
                </p>
                <p className="text-xs text-teal-600">Órdenes</p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline de eventos */}
          <div className="relative">
            {/* Línea vertical del timeline */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>

            <div className="space-y-4">
              {eventosFiltrados.map((evento, index) => {
                const config = getEventoConfig(evento.tipo);
                const IconComponent = config.icon;
                
                return (
                  <div key={`${evento.tipo}-${evento.id}-${index}`} className="relative flex gap-4">
                    {/* Círculo en la línea */}
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${config.color} flex items-center justify-center border-4 border-white shadow`}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    {/* Card del evento */}
                    <Card className={`flex-1 border-2 ${config.borderColor} hover:shadow-md transition-shadow`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{evento.titulo}</h4>
                            <Badge className={`${config.color} mt-1 text-xs`}>
                              {evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {formatDate(evento.fecha)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{evento.descripcion}</p>
                        
                        {/* Indicador de Firma Digital */}
                        {evento.firmada && (
                          <div className="mt-3 flex items-center gap-2 bg-green-50 p-2 rounded-md border border-green-200">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-green-800">Firmado Digitalmente</p>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <p className="text-[10px] font-mono text-green-600 truncate max-w-[200px] cursor-help">
                                      Hash: {evento.hashRegistro}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-mono text-xs">{evento.hashRegistro}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Lock className="h-3 w-3 text-green-500" />
                          </div>
                        )}

                        {evento.profesional?.nombre && (
                          <p className="text-xs text-gray-500 mt-2">
                            Por: {evento.profesional.nombre} {evento.profesional.apellido}
                          </p>
                        )}
                        {evento.doctor?.nombre && (
                          <p className="text-xs text-gray-500 mt-2">
                            Por: Dr. {evento.doctor.nombre} {evento.doctor.apellido}
                          </p>
                        )}
                        {evento.medicoResponsable?.nombre && (
                          <p className="text-xs text-gray-500 mt-2">
                            Por: Dr. {evento.medicoResponsable.nombre} {evento.medicoResponsable.apellido}
                          </p>
                        )}
                        {evento.medico?.nombre && (
                          <p className="text-xs text-gray-500 mt-2">
                            Por: Dr. {evento.medico.nombre} {evento.medico.apellido}
                          </p>
                        )}
                        {evento.registrador?.nombre && (
                          <p className="text-xs text-gray-500 mt-2">
                            Por: {evento.registrador.nombre} {evento.registrador.apellido}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
