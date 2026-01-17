'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Eye
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TabTimelinePaciente({ pacienteId }) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

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

      const [evoluciones, signos, diagnosticos, alertas, procedimientos, prescripciones] = await Promise.all([
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
      ]);

      const eventosUnificados = [
        ...(evoluciones.data || []).map(e => ({
          ...e,
          tipo: 'evolucion',
          fecha: e.createdAt,
          titulo: 'Evolución SOAP',
          descripcion: e.subjetivo?.substring(0, 100) + '...',
        })),
        ...(signos.data || []).map(s => ({
          ...s,
          tipo: 'signos',
          fecha: s.createdAt,
          titulo: 'Signos Vitales',
          descripcion: `Temp: ${s.temperatura || 'N/A'}C, PA: ${s.presionSistolica || '--'}/${s.presionDiastolica || '--'}`,
        })),
        ...(diagnosticos.data || []).map(d => ({
          ...d,
          tipo: 'diagnostico',
          fecha: d.createdAt,
          titulo: 'Diagnostico',
          descripcion: `${d.codigoCIE11} - ${d.descripcionCIE11}`,
        })),
        ...(alertas.data || []).map(a => ({
          ...a,
          tipo: 'alerta',
          fecha: a.createdAt,
          titulo: `Alerta: ${a.titulo}`,
          descripcion: a.descripcion,
        })),
        ...(procedimientos.data || []).map(p => ({
          ...p,
          tipo: 'procedimiento',
          fecha: p.fechaRealizada || p.createdAt,
          titulo: 'Procedimiento',
          descripcion: p.nombre,
        })),
        ...(prescripciones.data || []).map(p => ({
          ...p,
          tipo: 'prescripcion',
          fecha: p.createdAt,
          titulo: 'Prescripción Médica',
          descripcion: 'Medicamentos prescritos',
        })),
      ];

      const ordenados = eventosUnificados.sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
      );

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
        return { icon: Pill, color: 'bg-teal-100 text-teal-700', borderColor: 'border-teal-300' };
      default:
        return { icon: Calendar, color: 'bg-gray-100 text-gray-700', borderColor: 'border-gray-300' };
    }
  };

  const verDetalle = (evento) => {
    setEventoSeleccionado(evento);
    setMostrarModal(true);
  };

  const eventosFiltrados = filtroTipo === 'todos' 
    ? eventos 
    : eventos.filter(e => e.tipo === filtroTipo);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-cyan-200 bg-gradient-to-r from-cyan-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-600 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Timeline de Historia Clínica</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Vista cronológica de todos los eventos médicos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="evolucion">Evoluciones</SelectItem>
                  <SelectItem value="signos">Signos Vitales</SelectItem>
                  <SelectItem value="diagnostico">Diagnósticos</SelectItem>
                  <SelectItem value="alerta">Alertas</SelectItem>
                  <SelectItem value="procedimiento">Procedimientos</SelectItem>
                  <SelectItem value="prescripcion">Prescripciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

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
                Los eventos aparecerán aquí a medida que se registren
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
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
            <Card className="border-teal-200 bg-teal-50">
              <CardContent className="p-3 text-center">
                <Pill className="h-6 w-6 text-teal-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-teal-700">
                  {eventos.filter(e => e.tipo === 'prescripcion').length}
                </p>
                <p className="text-xs text-teal-600">Rx</p>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            <div className="space-y-4">
              {eventosFiltrados.map((evento, index) => {
                const config = getEventoConfig(evento.tipo);
                const IconComponent = config.icon;
                
                return (
                  <div key={`${evento.tipo}-${evento.id}-${index}`} className="relative flex gap-4">
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${config.color} flex items-center justify-center border-4 border-white shadow`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <Card className={`flex-1 border-2 ${config.borderColor} hover:shadow-md transition-shadow`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{evento.titulo}</h4>
                            <Badge className={`${config.color} mt-1 text-xs`}>
                              {evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(evento.fecha)}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => verDetalle(evento)}
                              className="hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{evento.descripcion}</p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Evento</DialogTitle>
          </DialogHeader>
          {eventoSeleccionado && (
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Fecha:</span>
                <p className="font-semibold">{formatDate(eventoSeleccionado.fecha)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tipo:</span>
                <Badge>{eventoSeleccionado.tipo}</Badge>
              </div>
              <div>
                <span className="text-sm text-gray-600">Descripción:</span>
                <p className="text-sm bg-gray-50 p-3 rounded">{eventoSeleccionado.descripcion}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
