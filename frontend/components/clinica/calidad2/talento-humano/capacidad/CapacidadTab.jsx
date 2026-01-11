'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Edit, Trash2, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCalidad2Capacidad } from '@/hooks/useCalidad2Capacidad';

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export default function CapacidadTab({ user }) {
  const {
    capacidades,
    ofertas,
    resumen,
    totalesCapacidad,
    totalesOferta,
    loading,
    loadCapacidades,
    createCapacidad,
    updateCapacidad,
    deleteCapacidad,
    loadOfertas,
    createOferta,
    updateOferta,
    deleteOferta,
    loadResumen,
    saveResumen,
    loadAll,
  } = useCalidad2Capacidad();

  const [activeSection, setActiveSection] = useState('capacidad');
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());

  // Modals
  const [showCapacidadModal, setShowCapacidadModal] = useState(false);
  const [showOfertaModal, setShowOfertaModal] = useState(false);
  const [editingCapacidad, setEditingCapacidad] = useState(null);
  const [editingOferta, setEditingOferta] = useState(null);

  // Form states
  const [capacidadForm, setCapacidadForm] = useState({
    servicio: '',
    profesional: '',
    ambientes: '',
    numeroEquiposAmbiente: 1,
    duracionPromedioMinutos: 15,
  });

  const [ofertaForm, setOfertaForm] = useState({
    servicio: '',
    profesionalCargo: '',
    numeroProfesionales: 1,
    horasTrabajoSemana: 40,
    tiempoPorActividadMin: 15,
    pacientesAtendidosSemana: 0,
  });

  const [resumenForm, setResumenForm] = useState({
    totalPacientesTalentoHumano: '',
    totalPacientesAtendidosMesAnterior: '',
    observaciones: '',
  });

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadResumen(selectedMes, selectedAnio).then((data) => {
      if (data) {
        setResumenForm({
          totalPacientesTalentoHumano: data.totalPacientesTalentoHumano || '',
          totalPacientesAtendidosMesAnterior: data.totalPacientesAtendidosMesAnterior || '',
          observaciones: data.observaciones || '',
        });
      }
    });
  }, [selectedMes, selectedAnio, loadResumen]);

  // Capacidad handlers
  const handleOpenCapacidadCreate = () => {
    setEditingCapacidad(null);
    setCapacidadForm({
      servicio: '',
      profesional: '',
      ambientes: '',
      numeroEquiposAmbiente: 1,
      duracionPromedioMinutos: 15,
    });
    setShowCapacidadModal(true);
  };

  const handleOpenCapacidadEdit = (c) => {
    setEditingCapacidad(c);
    setCapacidadForm({
      servicio: c.servicio,
      profesional: c.profesional,
      ambientes: c.ambientes || '',
      numeroEquiposAmbiente: c.numeroEquiposAmbiente,
      duracionPromedioMinutos: c.duracionPromedioMinutos,
    });
    setShowCapacidadModal(true);
  };

  const handleSaveCapacidad = async () => {
    const data = {
      ...capacidadForm,
      numeroEquiposAmbiente: parseInt(capacidadForm.numeroEquiposAmbiente),
      duracionPromedioMinutos: parseInt(capacidadForm.duracionPromedioMinutos),
    };

    if (editingCapacidad) {
      await updateCapacidad(editingCapacidad.id, data);
    } else {
      await createCapacidad(data);
    }
    setShowCapacidadModal(false);
  };

  const handleDeleteCapacidad = async (id) => {
    if (window.confirm('Eliminar este registro?')) {
      await deleteCapacidad(id);
    }
  };

  // Oferta handlers
  const handleOpenOfertaCreate = () => {
    setEditingOferta(null);
    setOfertaForm({
      servicio: '',
      profesionalCargo: '',
      numeroProfesionales: 1,
      horasTrabajoSemana: 40,
      tiempoPorActividadMin: 15,
      pacientesAtendidosSemana: 0,
    });
    setShowOfertaModal(true);
  };

  const handleOpenOfertaEdit = (o) => {
    setEditingOferta(o);
    setOfertaForm({
      servicio: o.servicio,
      profesionalCargo: o.profesionalCargo,
      numeroProfesionales: o.numeroProfesionales,
      horasTrabajoSemana: o.horasTrabajoSemana,
      tiempoPorActividadMin: o.tiempoPorActividadMin,
      pacientesAtendidosSemana: o.pacientesAtendidosSemana || 0,
    });
    setShowOfertaModal(true);
  };

  const handleSaveOferta = async () => {
    const data = {
      ...ofertaForm,
      numeroProfesionales: parseInt(ofertaForm.numeroProfesionales),
      horasTrabajoSemana: parseInt(ofertaForm.horasTrabajoSemana),
      tiempoPorActividadMin: parseInt(ofertaForm.tiempoPorActividadMin),
      pacientesAtendidosSemana: parseInt(ofertaForm.pacientesAtendidosSemana) || null,
    };

    if (editingOferta) {
      await updateOferta(editingOferta.id, data);
    } else {
      await createOferta(data);
    }
    setShowOfertaModal(false);
  };

  const handleDeleteOferta = async (id) => {
    if (window.confirm('Eliminar este registro?')) {
      await deleteOferta(id);
    }
  };

  // Resumen handler
  const handleSaveResumen = async () => {
    await saveResumen({
      mes: selectedMes,
      anio: selectedAnio,
      totalPacientesTalentoHumano: parseInt(resumenForm.totalPacientesTalentoHumano) || null,
      totalPacientesAtendidosMesAnterior: parseInt(resumenForm.totalPacientesAtendidosMesAnterior) || null,
      observaciones: resumenForm.observaciones || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={String(selectedMes)} onValueChange={(v) => setSelectedMes(parseInt(v))}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedAnio)} onValueChange={(v) => setSelectedAnio(parseInt(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={loadAll}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Tabs for sections */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList>
          <TabsTrigger value="capacidad">A. Capacidad Instalada</TabsTrigger>
          <TabsTrigger value="oferta">B. Oferta</TabsTrigger>
          <TabsTrigger value="resumen">C. Resumen Mensual</TabsTrigger>
        </TabsList>

        {/* A. Capacidad Instalada */}
        <TabsContent value="capacidad" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">Capacidad Instalada</CardTitle>
              <Button onClick={handleOpenCapacidadCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Ambientes</TableHead>
                    <TableHead className="text-right">Equipos</TableHead>
                    <TableHead className="text-right">Duracion (min)</TableHead>
                    <TableHead className="text-right">Pac/Hora</TableHead>
                    <TableHead className="text-right">Pac/Dia</TableHead>
                    <TableHead className="text-right">Pac/Semana</TableHead>
                    <TableHead className="text-right">Pac/Mes</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : capacidades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        No hay registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    capacidades.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.servicio}</TableCell>
                        <TableCell>{c.profesional}</TableCell>
                        <TableCell>{c.ambientes || '-'}</TableCell>
                        <TableCell className="text-right">{c.numeroEquiposAmbiente}</TableCell>
                        <TableCell className="text-right">{c.duracionPromedioMinutos}</TableCell>
                        <TableCell className="text-right">{c.totalPacientesHora?.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{c.totalPacientesDia?.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{c.totalPacientesSemana?.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-medium">{c.totalPacientesMes?.toFixed(1)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenCapacidadEdit(c)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteCapacidad(c.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {totalesCapacidad && (
                  <TableFooter>
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={5} className="font-bold">TOTAL</TableCell>
                      <TableCell className="text-right font-bold">{totalesCapacidad.totalPacientesHora?.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-bold">{totalesCapacidad.totalPacientesDia?.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-bold">{totalesCapacidad.totalPacientesSemana?.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-bold">{totalesCapacidad.totalPacientesMes?.toFixed(1)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* B. Oferta */}
        <TabsContent value="oferta" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">Oferta de Servicios</CardTitle>
              <Button onClick={handleOpenOfertaCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-right"># Profesionales</TableHead>
                    <TableHead className="text-right">Horas/Sem</TableHead>
                    <TableHead className="text-right">Min/Actividad</TableHead>
                    <TableHead className="text-right">Pac/Hora</TableHead>
                    <TableHead className="text-right">Pac/Semana</TableHead>
                    <TableHead className="text-right">Pac/Mes</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : ofertas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No hay registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    ofertas.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.servicio}</TableCell>
                        <TableCell>{o.profesionalCargo}</TableCell>
                        <TableCell className="text-right">{o.numeroProfesionales}</TableCell>
                        <TableCell className="text-right">{o.horasTrabajoSemana}</TableCell>
                        <TableCell className="text-right">{o.tiempoPorActividadMin}</TableCell>
                        <TableCell className="text-right">{o.pacientesHora?.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{o.pacientesAtendidosSemana || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{o.totalPacientesMes?.toFixed(1)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenOfertaEdit(o)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteOferta(o.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {totalesOferta && (
                  <TableFooter>
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={2} className="font-bold">TOTAL</TableCell>
                      <TableCell className="text-right font-bold">{totalesOferta.totalProfesionales}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                      <TableCell className="text-right font-bold">{totalesOferta.totalPacientesHora?.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-bold">{totalesOferta.totalPacientesSemana}</TableCell>
                      <TableCell className="text-right font-bold">{totalesOferta.totalPacientesMes?.toFixed(1)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* C. Resumen Mensual */}
        <TabsContent value="resumen" className="mt-4">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Mes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Total pacientes segun talento humano</Label>
                  <Input
                    type="number"
                    value={resumenForm.totalPacientesTalentoHumano}
                    onChange={(e) => setResumenForm({ ...resumenForm, totalPacientesTalentoHumano: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Total pacientes atendidos mes anterior</Label>
                  <Input
                    type="number"
                    value={resumenForm.totalPacientesAtendidosMesAnterior}
                    onChange={(e) => setResumenForm({ ...resumenForm, totalPacientesAtendidosMesAnterior: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Observaciones</Label>
                  <Textarea
                    value={resumenForm.observaciones}
                    onChange={(e) => setResumenForm({ ...resumenForm, observaciones: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveResumen} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Resumen
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparativo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Capacidad Instalada (Mensual)</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {totalesCapacidad?.totalPacientesMes?.toFixed(0) || 0} pacientes
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Oferta (Mensual)</p>
                    <p className="text-2xl font-bold text-green-700">
                      {totalesOferta?.totalPacientesMes?.toFixed(0) || 0} pacientes
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Diferencia</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {((totalesCapacidad?.totalPacientesMes || 0) - (totalesOferta?.totalPacientesMes || 0)).toFixed(0)} pacientes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Capacidad Modal */}
      <Dialog open={showCapacidadModal} onOpenChange={setShowCapacidadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCapacidad ? 'Editar Capacidad' : 'Nueva Capacidad'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Servicio</Label>
              <Input
                value={capacidadForm.servicio}
                onChange={(e) => setCapacidadForm({ ...capacidadForm, servicio: e.target.value })}
                placeholder="Ej: Consulta General"
              />
            </div>
            <div>
              <Label>Profesional</Label>
              <Input
                value={capacidadForm.profesional}
                onChange={(e) => setCapacidadForm({ ...capacidadForm, profesional: e.target.value })}
                placeholder="Ej: Medico General"
              />
            </div>
            <div>
              <Label>Ambientes</Label>
              <Input
                value={capacidadForm.ambientes}
                onChange={(e) => setCapacidadForm({ ...capacidadForm, ambientes: e.target.value })}
                placeholder="Ej: Consultorio 1, 2, 3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Numero de equipos/ambiente</Label>
                <Input
                  type="number"
                  min="1"
                  value={capacidadForm.numeroEquiposAmbiente}
                  onChange={(e) => setCapacidadForm({ ...capacidadForm, numeroEquiposAmbiente: e.target.value })}
                />
              </div>
              <div>
                <Label>Duracion promedio (min)</Label>
                <Input
                  type="number"
                  min="1"
                  value={capacidadForm.duracionPromedioMinutos}
                  onChange={(e) => setCapacidadForm({ ...capacidadForm, duracionPromedioMinutos: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCapacidadModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveCapacidad}>{editingCapacidad ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Oferta Modal */}
      <Dialog open={showOfertaModal} onOpenChange={setShowOfertaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOferta ? 'Editar Oferta' : 'Nueva Oferta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Servicio</Label>
              <Input
                value={ofertaForm.servicio}
                onChange={(e) => setOfertaForm({ ...ofertaForm, servicio: e.target.value })}
                placeholder="Ej: Consulta General"
              />
            </div>
            <div>
              <Label>Cargo del profesional</Label>
              <Input
                value={ofertaForm.profesionalCargo}
                onChange={(e) => setOfertaForm({ ...ofertaForm, profesionalCargo: e.target.value })}
                placeholder="Ej: Medico General"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Numero de profesionales</Label>
                <Input
                  type="number"
                  min="1"
                  value={ofertaForm.numeroProfesionales}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, numeroProfesionales: e.target.value })}
                />
              </div>
              <div>
                <Label>Horas trabajo/semana</Label>
                <Input
                  type="number"
                  min="1"
                  value={ofertaForm.horasTrabajoSemana}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, horasTrabajoSemana: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tiempo por actividad (min)</Label>
                <Input
                  type="number"
                  min="1"
                  value={ofertaForm.tiempoPorActividadMin}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, tiempoPorActividadMin: e.target.value })}
                />
              </div>
              <div>
                <Label>Pacientes atendidos/semana</Label>
                <Input
                  type="number"
                  min="0"
                  value={ofertaForm.pacientesAtendidosSemana}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, pacientesAtendidosSemana: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfertaModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveOferta}>{editingOferta ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
