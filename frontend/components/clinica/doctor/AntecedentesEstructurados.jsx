'use client';

import { useState, useEffect } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import CatalogSearch from '@/components/ui/CatalogSearch';
import {
  Heart, Scissors, AlertTriangle, Users, Pill, Baby,
  Plus, X, Trash2, Edit2, Save, Loader2, Calendar, CheckCircle
} from 'lucide-react';

// Orden según PDF "Resumen de Atención": Farmacológicos → Gineco → Patológicos → Quirúrgicos → Familiares → Alérgicos
const TABS = [
  { id: 'farmacologicos', label: 'Medicamentos', icon: Pill, color: 'text-purple-600' },
  { id: 'gineco', label: 'Gineco-Obstétrico', icon: Baby, color: 'text-pink-600' },
  { id: 'patologicos', label: 'Patológicos', icon: Heart, color: 'text-red-600' },
  { id: 'quirurgicos', label: 'Quirúrgicos', icon: Scissors, color: 'text-blue-600' },
  { id: 'familiares', label: 'Familiares', icon: Users, color: 'text-green-600' },
  { id: 'alergicos', label: 'Alergias', icon: AlertTriangle, color: 'text-yellow-600' },
];

const TIPOS_ALERGIA = ['Medicamento', 'Alimento', 'Ambiental', 'Contacto', 'Otro'];
const SEVERIDADES = ['Leve', 'Moderada', 'Severa', 'Anafiláctica'];
const PARENTESCOS = ['Padre', 'Madre', 'Hermano/a', 'Abuelo paterno', 'Abuela paterna', 'Abuelo materno', 'Abuela materna', 'Tío/a', 'Primo/a', 'Hijo/a'];
const TIPOS_ANESTESIA = ['General', 'Regional', 'Local', 'Sedación'];

export default function AntecedentesEstructurados({ pacienteId, pacienteGenero, onSave }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('patologicos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para cada tipo de antecedente
  const [patologicos, setPatologicos] = useState([]);
  const [quirurgicos, setQuirurgicos] = useState([]);
  const [alergicos, setAlergicos] = useState([]);
  const [familiares, setFamiliares] = useState([]);
  const [farmacologicos, setFarmacologicos] = useState([]);
  const [ginecoObstetrico, setGinecoObstetrico] = useState(null);

  // Estados para formularios de agregar
  const [showFormPatologico, setShowFormPatologico] = useState(false);
  const [showFormQuirurgico, setShowFormQuirurgico] = useState(false);
  const [showFormAlergico, setShowFormAlergico] = useState(false);
  const [showFormFamiliar, setShowFormFamiliar] = useState(false);
  const [showFormFarmacologico, setShowFormFarmacologico] = useState(false);

  // Formularios
  const [formPatologico, setFormPatologico] = useState({ enfermedad: '', codigoCIE10: '', descripcionCIE10: '', enTratamiento: false, tratamientoActual: '', observaciones: '' });
  const [formQuirurgico, setFormQuirurgico] = useState({ procedimiento: '', fecha: '', hospital: '', anestesia: '', complicaciones: '', observaciones: '' });
  const [formAlergico, setFormAlergico] = useState({ tipoAlergia: '', sustancia: '', reaccion: '', severidad: 'Leve', confirmada: false, observaciones: '' });
  const [formFamiliar, setFormFamiliar] = useState({ parentesco: '', enfermedad: '', codigoCIE10: '', vive: true, observaciones: '' });
  const [formFarmacologico, setFormFarmacologico] = useState({ medicamento: '', dosis: '', frecuencia: '', indicacion: '', activo: true, observaciones: '' });

  useEffect(() => {
    if (pacienteId) {
      fetchAntecedentes();
    }
  }, [pacienteId]);

  const fetchAntecedentes = async () => {
    setLoading(true);
    try {
      const response = await apiGet(`/antecedentes/paciente/${pacienteId}`);
      if (response.success) {
        setPatologicos(response.data.patologicos || []);
        setQuirurgicos(response.data.quirurgicos || []);
        setAlergicos(response.data.alergicos || []);
        setFamiliares(response.data.familiares || []);
        setFarmacologicos(response.data.farmacologicos || []);
        setGinecoObstetrico(response.data.ginecoObstetrico || getDefaultGineco());
      }
    } catch (error) {
      console.error('Error fetching antecedentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultGineco = () => ({
    menarca: null, fum: null, cicloMenstrual: '', duracionCiclo: null, dismenorrea: false,
    gestas: 0, partos: 0, cesareas: 0, abortos: 0, nacidosVivos: 0, hijosVivos: 0,
    metodoPlanificacion: '', menopausia: false, observaciones: ''
  });

  // Handlers para PATOLÓGICOS
  const handleAddPatologico = async () => {
    if (!formPatologico.enfermedad) {
      toast({ variant: 'destructive', description: 'Ingrese la enfermedad' });
      return;
    }
    setSaving(true);
    try {
      await apiPost('/antecedentes/patologicos', { ...formPatologico, pacienteId });
      toast({ description: 'Antecedente patológico agregado' });
      setFormPatologico({ enfermedad: '', codigoCIE10: '', descripcionCIE10: '', enTratamiento: false, tratamientoActual: '', observaciones: '' });
      setShowFormPatologico(false);
      fetchAntecedentes();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al agregar antecedente' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatologico = async (id) => {
    if (!confirm('¿Eliminar este antecedente?')) return;
    try {
      await apiDelete(`/antecedentes/patologicos/${id}`);
      toast({ description: 'Antecedente eliminado' });
      fetchAntecedentes();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al eliminar' });
    }
  };

  // Handlers para QUIRÚRGICOS
  const handleAddQuirurgico = async () => {
    if (!formQuirurgico.procedimiento) {
      toast({ variant: 'destructive', description: 'Ingrese el procedimiento' });
      return;
    }
    setSaving(true);
    try {
      await apiPost('/antecedentes/quirurgicos', {
        ...formQuirurgico,
        pacienteId,
        fecha: formQuirurgico.fecha ? new Date(formQuirurgico.fecha).toISOString() : null,
      });
      toast({ description: 'Antecedente quirúrgico agregado' });
      setFormQuirurgico({ procedimiento: '', fecha: '', hospital: '', anestesia: '', complicaciones: '', observaciones: '' });
      setShowFormQuirurgico(false);
      fetchAntecedentes();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al agregar antecedente' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuirurgico = async (id) => {
    if (!confirm('¿Eliminar este antecedente?')) return;
    try {
      await apiDelete(`/antecedentes/quirurgicos/${id}`);
      toast({ description: 'Antecedente eliminado' });
      fetchAntecedentes();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al eliminar' });
    }
  };

  // Handlers para ALÉRGICOS
  const handleAddAlergico = async () => {
    if (!formAlergico.sustancia || !formAlergico.tipoAlergia) {
      toast({ variant: 'destructive', description: 'Complete tipo y sustancia' });
      return;
    }
    setSaving(true);
    try {
      await apiPost('/antecedentes/alergicos', { ...formAlergico, pacienteId });
      toast({ description: 'Alergia agregada' });
      setFormAlergico({ tipoAlergia: '', sustancia: '', reaccion: '', severidad: 'Leve', confirmada: false, observaciones: '' });
      setShowFormAlergico(false);
      fetchAntecedentes();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al agregar alergia' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlergico = async (id) => {
    if (!confirm('¿Eliminar esta alergia?')) return;
    try {
      await apiDelete(`/antecedentes/alergicos/${id}`);
      toast({ description: 'Alergia eliminada' });
      fetchAntecedentes();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al eliminar' });
    }
  };

  // Handlers para FAMILIARES
  const handleAddFamiliar = async () => {
    if (!formFamiliar.parentesco || !formFamiliar.enfermedad) {
      toast({ variant: 'destructive', description: 'Complete parentesco y enfermedad' });
      return;
    }
    setSaving(true);
    try {
      await apiPost('/antecedentes/familiares', { ...formFamiliar, pacienteId });
      toast({ description: 'Antecedente familiar agregado' });
      setFormFamiliar({ parentesco: '', enfermedad: '', codigoCIE10: '', vive: true, observaciones: '' });
      setShowFormFamiliar(false);
      fetchAntecedentes();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al agregar antecedente' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFamiliar = async (id) => {
    if (!confirm('¿Eliminar este antecedente?')) return;
    try {
      await apiDelete(`/antecedentes/familiares/${id}`);
      toast({ description: 'Antecedente eliminado' });
      fetchAntecedentes();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al eliminar' });
    }
  };

  // Handlers para FARMACOLÓGICOS
  const handleAddFarmacologico = async () => {
    if (!formFarmacologico.medicamento) {
      toast({ variant: 'destructive', description: 'Ingrese el medicamento' });
      return;
    }
    setSaving(true);
    try {
      await apiPost('/antecedentes/farmacologicos', { ...formFarmacologico, pacienteId });
      toast({ description: 'Medicamento agregado' });
      setFormFarmacologico({ medicamento: '', dosis: '', frecuencia: '', indicacion: '', activo: true, observaciones: '' });
      setShowFormFarmacologico(false);
      fetchAntecedentes();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al agregar medicamento' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFarmacologico = async (id) => {
    if (!confirm('¿Eliminar este medicamento?')) return;
    try {
      await apiDelete(`/antecedentes/farmacologicos/${id}`);
      toast({ description: 'Medicamento eliminado' });
      fetchAntecedentes();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al eliminar' });
    }
  };

  // Handler para GINECO-OBSTÉTRICO
  const handleSaveGineco = async () => {
    setSaving(true);
    try {
      await apiPut(`/antecedentes/gineco-obstetrico/${pacienteId}`, ginecoObstetrico);
      toast({ description: 'Antecedentes gineco-obstétricos actualizados' });
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al actualizar' });
    } finally {
      setSaving(false);
    }
  };

  const getSeveridadColor = (severidad) => {
    switch (severidad) {
      case 'Leve': return 'bg-green-100 text-green-800';
      case 'Moderada': return 'bg-yellow-100 text-yellow-800';
      case 'Severa': return 'bg-orange-100 text-orange-800';
      case 'Anafiláctica': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const showGineco = pacienteGenero === 'Femenino' || pacienteGenero === 'F';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Antecedentes Médicos Estructurados
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-1 h-auto">
              {TABS.filter(tab => tab.id !== 'gineco' || showGineco).map((tab) => {
                const Icon = tab.icon;
                const count = {
                  patologicos: patologicos.length,
                  quirurgicos: quirurgicos.length,
                  alergicos: alergicos.length,
                  familiares: familiares.length,
                  farmacologicos: farmacologicos.filter(f => f.activo).length,
                  gineco: ginecoObstetrico ? 1 : 0,
                }[tab.id];

                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${tab.color}`} />
                    {tab.label}
                    {count > 0 && <Badge variant="secondary" className="text-xs">{count}</Badge>}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* PATOLÓGICOS */}
            <TabsContent value="patologicos" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">Enfermedades y condiciones crónicas</h4>
                <Button size="sm" onClick={() => setShowFormPatologico(true)} disabled={showFormPatologico}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>

              {showFormPatologico && (
                <Card className="border-dashed border-2 border-blue-300">
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Enfermedad o Condición</Label>
                        <CatalogSearch
                          type="CIE10"
                          placeholder="Buscar diagnóstico CIE-10..."
                          onSelect={(d) => setFormPatologico({ ...formPatologico, enfermedad: d.descripcion, codigoCIE10: d.codigo, descripcionCIE10: d.descripcion })}
                        />
                        {!formPatologico.codigoCIE10 && (
                          <Input
                            className="mt-2"
                            value={formPatologico.enfermedad}
                            onChange={(e) => setFormPatologico({ ...formPatologico, enfermedad: e.target.value })}
                            placeholder="O escriba manualmente..."
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formPatologico.enTratamiento}
                          onCheckedChange={(c) => setFormPatologico({ ...formPatologico, enTratamiento: c })}
                        />
                        <Label>En tratamiento actualmente</Label>
                      </div>
                      {formPatologico.enTratamiento && (
                        <div>
                          <Label>Tratamiento actual</Label>
                          <Input
                            value={formPatologico.tratamientoActual}
                            onChange={(e) => setFormPatologico({ ...formPatologico, tratamientoActual: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <Label>Observaciones</Label>
                        <Textarea
                          value={formPatologico.observaciones}
                          onChange={(e) => setFormPatologico({ ...formPatologico, observaciones: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowFormPatologico(false)}>Cancelar</Button>
                      <Button onClick={handleAddPatologico} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Guardar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {patologicos.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <div className="flex items-center gap-2">
                        {item.codigoCIE10 && <Badge variant="outline" className="font-mono text-xs">{item.codigoCIE10}</Badge>}
                        <span className="font-medium">{item.enfermedad}</span>
                        {item.enTratamiento && <Badge className="bg-green-600">En tratamiento</Badge>}
                      </div>
                      {item.tratamientoActual && <p className="text-sm text-gray-600 mt-1">Tratamiento: {item.tratamientoActual}</p>}
                      {item.observaciones && <p className="text-sm text-gray-500 mt-1">{item.observaciones}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePatologico(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {patologicos.length === 0 && !showFormPatologico && (
                  <p className="text-gray-500 text-center py-4">No hay antecedentes patológicos registrados</p>
                )}
              </div>
            </TabsContent>

            {/* QUIRÚRGICOS */}
            <TabsContent value="quirurgicos" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">Cirugías y procedimientos previos</h4>
                <Button size="sm" onClick={() => setShowFormQuirurgico(true)} disabled={showFormQuirurgico}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>

              {showFormQuirurgico && (
                <Card className="border-dashed border-2 border-blue-300">
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Procedimiento</Label>
                        <Input
                          value={formQuirurgico.procedimiento}
                          onChange={(e) => setFormQuirurgico({ ...formQuirurgico, procedimiento: e.target.value })}
                          placeholder="Ej: Apendicectomía, Cesárea..."
                        />
                      </div>
                      <div>
                        <Label>Fecha aproximada</Label>
                        <Input
                          type="date"
                          value={formQuirurgico.fecha}
                          onChange={(e) => setFormQuirurgico({ ...formQuirurgico, fecha: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Hospital/Clínica</Label>
                        <Input
                          value={formQuirurgico.hospital}
                          onChange={(e) => setFormQuirurgico({ ...formQuirurgico, hospital: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Tipo de anestesia</Label>
                        <Select value={formQuirurgico.anestesia} onValueChange={(v) => setFormQuirurgico({ ...formQuirurgico, anestesia: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {TIPOS_ANESTESIA.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Complicaciones</Label>
                        <Input
                          value={formQuirurgico.complicaciones}
                          onChange={(e) => setFormQuirurgico({ ...formQuirurgico, complicaciones: e.target.value })}
                          placeholder="Ninguna / Describir..."
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowFormQuirurgico(false)}>Cancelar</Button>
                      <Button onClick={handleAddQuirurgico} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Guardar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {quirurgicos.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{item.procedimiento}</span>
                        {item.fecha && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(item.fecha).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                          </Badge>
                        )}
                      </div>
                      {item.hospital && <p className="text-sm text-gray-600 mt-1">Hospital: {item.hospital}</p>}
                      {item.anestesia && <p className="text-sm text-gray-600">Anestesia: {item.anestesia}</p>}
                      {item.complicaciones && <p className="text-sm text-orange-600">Complicaciones: {item.complicaciones}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteQuirurgico(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {quirurgicos.length === 0 && !showFormQuirurgico && (
                  <p className="text-gray-500 text-center py-4">No hay antecedentes quirúrgicos registrados</p>
                )}
              </div>
            </TabsContent>

            {/* ALÉRGICOS */}
            <TabsContent value="alergicos" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">Alergias conocidas</h4>
                <Button size="sm" onClick={() => setShowFormAlergico(true)} disabled={showFormAlergico}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>

              {showFormAlergico && (
                <Card className="border-dashed border-2 border-yellow-300">
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de alergia</Label>
                        <Select value={formAlergico.tipoAlergia} onValueChange={(v) => setFormAlergico({ ...formAlergico, tipoAlergia: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {TIPOS_ALERGIA.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Sustancia / Alérgeno</Label>
                        <Input
                          value={formAlergico.sustancia}
                          onChange={(e) => setFormAlergico({ ...formAlergico, sustancia: e.target.value })}
                          placeholder="Ej: Penicilina, Maní, Polen..."
                        />
                      </div>
                      <div>
                        <Label>Reacción</Label>
                        <Input
                          value={formAlergico.reaccion}
                          onChange={(e) => setFormAlergico({ ...formAlergico, reaccion: e.target.value })}
                          placeholder="Ej: Urticaria, edema, dificultad respiratoria..."
                        />
                      </div>
                      <div>
                        <Label>Severidad</Label>
                        <Select value={formAlergico.severidad} onValueChange={(v) => setFormAlergico({ ...formAlergico, severidad: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SEVERIDADES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formAlergico.confirmada}
                          onCheckedChange={(c) => setFormAlergico({ ...formAlergico, confirmada: c })}
                        />
                        <Label>Confirmada por pruebas</Label>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowFormAlergico(false)}>Cancelar</Button>
                      <Button onClick={handleAddAlergico} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Guardar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {alergicos.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">{item.sustancia}</span>
                        <Badge variant="outline">{item.tipoAlergia}</Badge>
                        <Badge className={getSeveridadColor(item.severidad)}>{item.severidad}</Badge>
                        {item.confirmada && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      {item.reaccion && <p className="text-sm text-gray-600 mt-1">Reacción: {item.reaccion}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAlergico(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {alergicos.length === 0 && !showFormAlergico && (
                  <p className="text-gray-500 text-center py-4">No hay alergias registradas</p>
                )}
              </div>
            </TabsContent>

            {/* FAMILIARES */}
            <TabsContent value="familiares" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">Historial familiar de enfermedades</h4>
                <Button size="sm" onClick={() => setShowFormFamiliar(true)} disabled={showFormFamiliar}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>

              {showFormFamiliar && (
                <Card className="border-dashed border-2 border-green-300">
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Parentesco</Label>
                        <Select value={formFamiliar.parentesco} onValueChange={(v) => setFormFamiliar({ ...formFamiliar, parentesco: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {PARENTESCOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Enfermedad</Label>
                        <Input
                          value={formFamiliar.enfermedad}
                          onChange={(e) => setFormFamiliar({ ...formFamiliar, enfermedad: e.target.value })}
                          placeholder="Ej: Diabetes, Hipertensión, Cáncer..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formFamiliar.vive}
                          onCheckedChange={(c) => setFormFamiliar({ ...formFamiliar, vive: c })}
                        />
                        <Label>Familiar vive actualmente</Label>
                      </div>
                      <div>
                        <Label>Observaciones</Label>
                        <Input
                          value={formFamiliar.observaciones}
                          onChange={(e) => setFormFamiliar({ ...formFamiliar, observaciones: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowFormFamiliar(false)}>Cancelar</Button>
                      <Button onClick={handleAddFamiliar} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Guardar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {familiares.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <Badge variant="outline">{item.parentesco}</Badge>
                        <span className="font-medium">{item.enfermedad}</span>
                        {item.vive ? (
                          <Badge className="bg-green-600">Vive</Badge>
                        ) : (
                          <Badge variant="secondary">Fallecido</Badge>
                        )}
                      </div>
                      {item.observaciones && <p className="text-sm text-gray-500 mt-1">{item.observaciones}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFamiliar(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {familiares.length === 0 && !showFormFamiliar && (
                  <p className="text-gray-500 text-center py-4">No hay antecedentes familiares registrados</p>
                )}
              </div>
            </TabsContent>

            {/* FARMACOLÓGICOS */}
            <TabsContent value="farmacologicos" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">Medicamentos actuales y previos</h4>
                <Button size="sm" onClick={() => setShowFormFarmacologico(true)} disabled={showFormFarmacologico}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>

              {showFormFarmacologico && (
                <Card className="border-dashed border-2 border-purple-300">
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Medicamento</Label>
                        <Input
                          value={formFarmacologico.medicamento}
                          onChange={(e) => setFormFarmacologico({ ...formFarmacologico, medicamento: e.target.value })}
                          placeholder="Ej: Metformina, Losartán..."
                        />
                      </div>
                      <div>
                        <Label>Dosis</Label>
                        <Input
                          value={formFarmacologico.dosis}
                          onChange={(e) => setFormFarmacologico({ ...formFarmacologico, dosis: e.target.value })}
                          placeholder="Ej: 500mg, 50mg..."
                        />
                      </div>
                      <div>
                        <Label>Frecuencia</Label>
                        <Input
                          value={formFarmacologico.frecuencia}
                          onChange={(e) => setFormFarmacologico({ ...formFarmacologico, frecuencia: e.target.value })}
                          placeholder="Ej: Cada 12h, Una vez al día..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Indicación (¿Para qué lo toma?)</Label>
                        <Input
                          value={formFarmacologico.indicacion}
                          onChange={(e) => setFormFarmacologico({ ...formFarmacologico, indicacion: e.target.value })}
                          placeholder="Ej: Control de diabetes, Hipertensión..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formFarmacologico.activo}
                          onCheckedChange={(c) => setFormFarmacologico({ ...formFarmacologico, activo: c })}
                        />
                        <Label>Actualmente lo toma</Label>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowFormFarmacologico(false)}>Cancelar</Button>
                      <Button onClick={handleAddFarmacologico} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Guardar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {farmacologicos.map((item) => (
                  <div key={item.id} className={`flex items-start justify-between p-3 rounded-lg border ${item.activo ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <Pill className={`h-4 w-4 ${item.activo ? 'text-purple-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${!item.activo && 'text-gray-500'}`}>{item.medicamento}</span>
                        {item.dosis && <Badge variant="outline">{item.dosis}</Badge>}
                        {item.frecuencia && <Badge variant="outline">{item.frecuencia}</Badge>}
                        {item.activo ? (
                          <Badge className="bg-green-600">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Suspendido</Badge>
                        )}
                      </div>
                      {item.indicacion && <p className="text-sm text-gray-600 mt-1">Para: {item.indicacion}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFarmacologico(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {farmacologicos.length === 0 && !showFormFarmacologico && (
                  <p className="text-gray-500 text-center py-4">No hay medicamentos registrados</p>
                )}
              </div>
            </TabsContent>

            {/* GINECO-OBSTÉTRICO */}
            {showGineco && (
              <TabsContent value="gineco" className="mt-4 space-y-4">
                <Card className="border-pink-200">
                  <CardHeader className="bg-pink-50">
                    <CardTitle className="flex items-center gap-2 text-pink-900">
                      <Baby className="h-5 w-5" />
                      Antecedentes Gineco-Obstétricos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {/* Menstruación */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Menstruación</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Menarca (edad)</Label>
                          <Input
                            type="number"
                            value={ginecoObstetrico?.menarca || ''}
                            onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, menarca: parseInt(e.target.value) || null })}
                            placeholder="Años"
                          />
                        </div>
                        <div>
                          <Label>FUM</Label>
                          <Input
                            type="date"
                            value={ginecoObstetrico?.fum ? formatDateISO(new Date(ginecoObstetrico.fum)) : ''}
                            onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, fum: e.target.value ? new Date(e.target.value) : null })}
                          />
                        </div>
                        <div>
                          <Label>Ciclo</Label>
                          <Select value={ginecoObstetrico?.cicloMenstrual || ''} onValueChange={(v) => setGinecoObstetrico({ ...ginecoObstetrico, cicloMenstrual: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Regular">Regular</SelectItem>
                              <SelectItem value="Irregular">Irregular</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Duración ciclo (días)</Label>
                          <Input
                            type="number"
                            value={ginecoObstetrico?.duracionCiclo || ''}
                            onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, duracionCiclo: parseInt(e.target.value) || null })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fórmula Obstétrica */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Fórmula Obstétrica (G-P-A-C)</h5>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                        <div>
                          <Label>G (Gestas)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={ginecoObstetrico?.gestas || 0}
                            onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, gestas: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>P (Partos)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={ginecoObstetrico?.partos || 0}
                            onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, partos: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>C (Cesáreas)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={ginecoObstetrico?.cesareas || 0}
                            onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, cesareas: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>A (Abortos)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={ginecoObstetrico?.abortos || 0}
                            onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, abortos: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Nacidos vivos</Label>
                          <Input
                            type="number"
                            min="0"
                            value={ginecoObstetrico?.nacidosVivos || 0}
                            onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, nacidosVivos: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Hijos vivos</Label>
                          <Input
                            type="number"
                            min="0"
                            value={ginecoObstetrico?.hijosVivos || 0}
                            onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, hijosVivos: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Planificación */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Planificación Familiar</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Método de planificación</Label>
                          <Select value={ginecoObstetrico?.metodoPlanificacion || ''} onValueChange={(v) => setGinecoObstetrico({ ...ginecoObstetrico, metodoPlanificacion: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ninguno">Ninguno</SelectItem>
                              <SelectItem value="Anticonceptivos orales">Anticonceptivos orales</SelectItem>
                              <SelectItem value="DIU">DIU</SelectItem>
                              <SelectItem value="Implante subdérmico">Implante subdérmico</SelectItem>
                              <SelectItem value="Inyectable">Inyectable</SelectItem>
                              <SelectItem value="Preservativo">Preservativo</SelectItem>
                              <SelectItem value="Ligadura de trompas">Ligadura de trompas</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={ginecoObstetrico?.menopausia || false}
                              onCheckedChange={(c) => setGinecoObstetrico({ ...ginecoObstetrico, menopausia: c })}
                            />
                            <Label>Menopausia</Label>
                          </div>
                          {ginecoObstetrico?.menopausia && (
                            <div>
                              <Label>Edad menopausia</Label>
                              <Input
                                type="number"
                                className="w-20"
                                value={ginecoObstetrico?.edadMenopausia || ''}
                                onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, edadMenopausia: parseInt(e.target.value) || null })}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Observaciones */}
                    <div>
                      <Label>Observaciones</Label>
                      <Textarea
                        value={ginecoObstetrico?.observaciones || ''}
                        onChange={(e) => setGinecoObstetrico({ ...ginecoObstetrico, observaciones: e.target.value })}
                        placeholder="Observaciones adicionales..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveGineco} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        <Save className="h-4 w-4 mr-1" /> Guardar cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
