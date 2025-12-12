'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Search, User, Building2, Bed, Calendar, CheckCircle, 
  X, FileText, Activity, AlertCircle 
} from 'lucide-react';

// Importar tabs separados
import TabInformacion from './hospitalizacion/tabs/TabInformacion';
import TabMovimientos from './hospitalizacion/tabs/TabMovimientos';
import TabProcedimientos from './hospitalizacion/tabs/TabProcedimientos';
import TabMedicamentos from './hospitalizacion/tabs/TabMedicamentos';
import TabInterconsultas from './hospitalizacion/tabs/TabInterconsultas';
import TabEgreso from './hospitalizacion/tabs/TabEgreso';

export default function AdmisionesHospitalizacionModule({ user }) {
  const { toast } = useToast();
  const [admisiones, setAdmisiones] = useState([]);
  const [admisionesFiltradas, setAdmisionesFiltradas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  
  // Modal nueva admisión
  const [showNuevaAdmision, setShowNuevaAdmision] = useState(false);
  const [pasoActual, setPasoActual] = useState(1);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [camasFiltradas, setCamasFiltradas] = useState([]);
  const [nuevaAdmisionData, setNuevaAdmisionData] = useState({
    unidadId: '',
    camaId: '',
    motivoIngreso: '',
    diagnosticoIngreso: '',
    fechaIngreso: new Date().toISOString().slice(0, 16),
  });

  // Modal detalle admisión
  const [admisionSeleccionada, setAdmisionSeleccionada] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [procedimientos, setProcedimientos] = useState([]);

  useEffect(() => {
    cargarAdmisiones();
  }, []);

  useEffect(() => {
    filtrarAdmisiones();
  }, [admisiones, filtroEstado, busqueda]);

  const cargarAdmisiones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admisiones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.admisiones)) {
        setAdmisiones(data.data.admisiones);
        setAdmisionesFiltradas(data.data.admisiones);
      } else {
        setAdmisiones([]);
        setAdmisionesFiltradas([]);
      }
    } catch (error) {
      console.error('Error cargando admisiones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las admisiones',
        variant: 'destructive',
      });
    }
  };

  const filtrarAdmisiones = () => {
    let filtradas = [...admisiones];
    
    // Filtro por estado
    if (filtroEstado !== 'todas') {
      filtradas = filtradas.filter(a => a.estado === filtroEstado);
    }
    
    // Filtro por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      filtradas = filtradas.filter(a => 
        a.paciente?.nombre?.toLowerCase().includes(termino) ||
        a.paciente?.apellido?.toLowerCase().includes(termino) ||
        a.paciente?.cedula?.includes(termino)
      );
    }
    
    setAdmisionesFiltradas(filtradas);
  };

  const handleBusquedaPaciente = async (termino) => {
    setBusquedaPaciente(termino);
    if (termino.length < 2) {
      setPacientesFiltrados([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pacientes?search=${termino}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPacientesFiltrados(data.data || []);
      }
    } catch (error) {
      console.error('Error buscando pacientes:', error);
    }
  };

  const seleccionarPaciente = (paciente) => {
    setPacienteSeleccionado(paciente);
    setPacientesFiltrados([]);
  };

  const cargarUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/unidades?activo=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUnidades(data.data.unidades || data.data || []);
      }
    } catch (error) {
      console.error('Error cargando unidades:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las unidades',
        variant: 'destructive',
      });
    }
  };

  const handleUnidadChange = (unidadId) => {
    setNuevaAdmisionData({ ...nuevaAdmisionData, unidadId, camaId: '' });
    cargarCamasPorUnidad(unidadId);
  };

  const cargarCamasPorUnidad = async (unidadId) => {
    try {
      const token = localStorage.getItem('token');
      const url = unidadId 
        ? `/api/camas/disponibles?unidadId=${unidadId}`
        : '/api/camas/disponibles';
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCamasFiltradas(data.data.camas || data.data || []);
      }
    } catch (error) {
      console.error('Error cargando camas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las camas disponibles',
        variant: 'destructive',
      });
    }
  };

  const siguientePaso = () => {
    if (pasoActual === 1 && !pacienteSeleccionado) {
      toast({
        title: 'Atención',
        description: 'Debe seleccionar un paciente',
        variant: 'destructive',
      });
      return;
    }
    if (pasoActual === 2 && !nuevaAdmisionData.unidadId) {
      toast({
        title: 'Atención',
        description: 'Debe seleccionar una unidad',
        variant: 'destructive',
      });
      return;
    }
    if (pasoActual === 3 && !nuevaAdmisionData.camaId) {
      toast({
        title: 'Atención',
        description: 'Debe seleccionar una cama',
        variant: 'destructive',
      });
      return;
    }
    
    if (pasoActual === 2) {
      cargarUnidades();
    }
    
    setPasoActual(pasoActual + 1);
  };

  const anteriorPaso = () => {
    setPasoActual(pasoActual - 1);
  };

  const resetearFormulario = () => {
    setPasoActual(1);
    setPacienteSeleccionado(null);
    setBusquedaPaciente('');
    setPacientesFiltrados([]);
    setNuevaAdmisionData({
      unidadId: '',
      camaId: '',
      motivoIngreso: '',
      diagnosticoIngreso: '',
      fechaIngreso: new Date().toISOString().slice(0, 16),
    });
  };

  const crearAdmision = async () => {
    if (!nuevaAdmisionData.motivoIngreso || !nuevaAdmisionData.diagnosticoIngreso) {
      toast({
        title: 'Campos requeridos',
        description: 'Complete todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    if (!pacienteSeleccionado) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar un paciente',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        pacienteId: pacienteSeleccionado.id,
        unidadId: nuevaAdmisionData.unidadId,
        camaId: nuevaAdmisionData.camaId,
        motivoIngreso: nuevaAdmisionData.motivoIngreso,
        diagnosticoIngreso: nuevaAdmisionData.diagnosticoIngreso,
        responsableIngreso: user?.id || null,
      };

      const response = await fetch('/api/admisiones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Admisión creada correctamente',
        });
        setShowNuevaAdmision(false);
        resetearFormulario();
        cargarAdmisiones();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Ocurrió un error al crear la admisión',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error al crear admisión:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al crear la admisión',
        variant: 'destructive',
      });
    }
  };

  const abrirDetalle = async (admision) => {
    setAdmisionSeleccionada(admision);
    setShowDetalle(true);
    await cargarDatosAdmision(admision);
  };

  const cargarDatosAdmision = async (admision) => {
    const token = localStorage.getItem('token');
    
    try {
      // Cargar movimientos
      const movRes = await fetch(`/api/movimientos?admisionId=${admision.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const movData = await movRes.json();
      if (movData.success) {
        setMovimientos(Array.isArray(movData.data.movimientos) ? movData.data.movimientos : []);
      }

      // Cargar ordenes médicas (procedimientos)
      const procRes = await fetch(`/api/ordenes-medicas?admision_id=${admision.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const procData = await procRes.json();
      if (procData.success) {
        setProcedimientos(Array.isArray(procData.data) ? procData.data : []);
      }
    } catch (error) {
      console.error('Error cargando datos de admisión:', error);
    }
  };

  const contadores = {
    total: admisiones.length,
    activas: admisiones.filter(a => a.estado === 'Activa').length,
    egresadas: admisiones.filter(a => a.estado === 'Egresada').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header con contadores */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admisiones a Hospitalización</h1>
          <p className="text-gray-600 mt-1">Gestión de pacientes hospitalizados</p>
        </div>
        <Button onClick={() => { setShowNuevaAdmision(true); cargarUnidades(); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Admisión
        </Button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Admisiones</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{contadores.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Admisiones Activas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{contadores.activas}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Admisiones Egresadas</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{contadores.egresadas}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o cédula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="Activa">Activas</SelectItem>
                <SelectItem value="Egresada">Egresadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de admisiones */}
      <div className="space-y-3">
        {admisionesFiltradas.map((admision) => (
          <Card key={admision.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {admision.paciente?.nombre} {admision.paciente?.apellido}
                    </h3>
                    <Badge variant={admision.estado === 'Activa' ? 'default' : 'secondary'}>
                      {admision.estado}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Unidad:</strong> {admision.unidad?.nombre}
                    </div>
                    <div>
                      <strong>Cama:</strong> {admision.cama?.numero}
                    </div>
                    <div>
                      <strong>Ingreso:</strong> {new Date(admision.fechaIngreso).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Motivo:</strong> {admision.motivoIngreso}
                  </p>
                </div>
                <Button onClick={() => abrirDetalle(admision)} variant="outline">
                  Ver Detalle
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Nueva Admisión (Multi-paso) */}
      <Dialog open={showNuevaAdmision} onOpenChange={setShowNuevaAdmision}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Nueva Admisión Hospitalaria</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">Complete la información en 4 pasos</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNuevaAdmision(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Indicador de pasos mejorado */}
          <div className="flex items-center justify-between mb-8 px-4">
            {[
              { num: 1, label: 'Paciente' },
              { num: 2, label: 'Unidad' },
              { num: 3, label: 'Cama' },
              { num: 4, label: 'Diagnóstico' }
            ].map((paso, idx) => (
              <div key={paso.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    paso.num < pasoActual 
                      ? 'bg-emerald-600 text-white' 
                      : paso.num === pasoActual
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {paso.num < pasoActual ? <CheckCircle className="w-5 h-5" /> : paso.num}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    paso.num <= pasoActual ? 'text-emerald-700' : 'text-gray-500'
                  }`}>
                    {paso.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                    paso.num < pasoActual ? 'bg-emerald-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Paso 1: Buscar Paciente */}
          {pasoActual === 1 && (
            <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Seleccionar Paciente *
                </Label>
                <p className="text-sm text-gray-600 mb-3">Busque y seleccione el paciente que será admitido</p>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Escriba el nombre o número de cédula del paciente..."
                    value={busquedaPaciente}
                    onChange={(e) => handleBusquedaPaciente(e.target.value)}
                    className="pl-10 h-12 text-base border-2 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Lista de pacientes filtrados */}
              {pacientesFiltrados.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-lg max-h-64 overflow-y-auto shadow-sm">
                  {pacientesFiltrados.map((paciente) => (
                    <div
                      key={paciente.id}
                      onClick={() => seleccionarPaciente(paciente)}
                      className="p-4 hover:bg-emerald-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{paciente.nombre} {paciente.apellido}</div>
                          <div className="text-sm text-gray-600">CC: {paciente.cedula}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Paciente seleccionado */}
              {pacienteSeleccionado && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-emerald-700 uppercase mb-1">Paciente Seleccionado</p>
                        <h3 className="font-bold text-lg text-emerald-900">
                          {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}
                        </h3>
                        <div className="flex gap-4 mt-2">
                          <p className="text-sm text-emerald-700">
                            <span className="font-medium">CC:</span> {pacienteSeleccionado.cedula}
                          </p>
                          {pacienteSeleccionado.edad && (
                            <p className="text-sm text-emerald-700">
                              <span className="font-medium">Edad:</span> {pacienteSeleccionado.edad} años
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPacienteSeleccionado(null);
                        setBusquedaPaciente('');
                      }}
                      className="hover:bg-emerald-100"
                    >
                      <X className="h-5 w-5 text-emerald-700" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Seleccionar Unidad */}
          {pasoActual === 2 && (
            <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  Unidad Hospitalaria *
                </Label>
                <p className="text-sm text-gray-600 mb-3">Seleccione la unidad donde se realizará la admisión</p>
                <Select
                  value={nuevaAdmisionData.unidadId}
                  onValueChange={handleUnidadChange}
                >
                  <SelectTrigger className="h-12 text-base border-2 focus:border-emerald-500">
                    <SelectValue placeholder="Seleccione una unidad hospitalaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(unidades) && unidades.length > 0 ? (
                      unidades.map((unidad) => (
                        <SelectItem key={unidad.id} value={unidad.id} className="text-base py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold">{unidad.nombre}</span>
                            {unidad.descripcion && (
                              <span className="text-sm text-gray-600">{unidad.descripcion}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>No hay unidades disponibles</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {Array.isArray(unidades) && unidades.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    No hay unidades disponibles en el sistema
                  </p>
                )}
              </div>
              
              {nuevaAdmisionData.unidadId && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700 uppercase mb-1">Unidad Seleccionada</p>
                      <p className="font-semibold text-blue-900">
                        {unidades.find(u => u.id === nuevaAdmisionData.unidadId)?.nombre}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Seleccionar Cama */}
          {pasoActual === 3 && (
            <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-emerald-600" />
                  Cama Disponible *
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Seleccione la cama donde se asignará al paciente
                  {Array.isArray(camasFiltradas) && camasFiltradas.length > 0 && (
                    <span className="ml-2 text-emerald-600 font-medium">
                      ({camasFiltradas.length} cama{camasFiltradas.length !== 1 ? 's' : ''} disponible{camasFiltradas.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>
                <Select
                  value={nuevaAdmisionData.camaId}
                  onValueChange={(value) => setNuevaAdmisionData({ ...nuevaAdmisionData, camaId: value })}
                >
                  <SelectTrigger className="h-12 text-base border-2 focus:border-emerald-500">
                    <SelectValue placeholder="Seleccione una cama disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(camasFiltradas) && camasFiltradas.length > 0 ? (
                      camasFiltradas.map((cama) => (
                        <SelectItem key={cama.id} value={cama.id} className="text-base py-3">
                          <div className="flex items-center gap-3">
                            <Bed className="w-4 h-4 text-gray-500" />
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                Cama {cama.numero} - Habitación {cama.habitacion?.numero}
                              </span>
                              <span className="text-sm text-gray-600">
                                {cama.tipo} • {cama.habitacion?.tipo}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>No hay camas disponibles</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {Array.isArray(camasFiltradas) && camasFiltradas.length === 0 && (
                  <div className="mt-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      No hay camas disponibles en esta unidad. Por favor, seleccione otra unidad o libere una cama.
                    </p>
                  </div>
                )}
              </div>

              {nuevaAdmisionData.camaId && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-purple-700 uppercase mb-1">Cama Seleccionada</p>
                      <p className="font-semibold text-purple-900">
                        {(() => {
                          const cama = camasFiltradas.find(c => c.id === nuevaAdmisionData.camaId);
                          return cama ? `Cama ${cama.numero} - Habitación ${cama.habitacion?.numero}` : '';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 4: Información de Ingreso */}
          {pasoActual === 4 && (
            <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Motivo de Ingreso *
                </Label>
                <p className="text-sm text-gray-600 mb-3">Describa brevemente la razón por la cual el paciente requiere hospitalización</p>
                <Textarea
                  value={nuevaAdmisionData.motivoIngreso}
                  onChange={(e) => setNuevaAdmisionData({ ...nuevaAdmisionData, motivoIngreso: e.target.value })}
                  placeholder="Ejemplo: Dolor abdominal agudo con signos de apendicitis..."
                  rows={4}
                  className="text-base border-2 focus:border-emerald-500"
                />
              </div>

              <div>
                <Label className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Diagnóstico de Ingreso *
                </Label>
                <p className="text-sm text-gray-600 mb-3">Indique el diagnóstico médico inicial o presuntivo</p>
                <Textarea
                  value={nuevaAdmisionData.diagnosticoIngreso}
                  onChange={(e) => setNuevaAdmisionData({ ...nuevaAdmisionData, diagnosticoIngreso: e.target.value })}
                  placeholder="Ejemplo: Sospecha de apendicitis aguda - CIE-10: K35..."
                  rows={4}
                  className="text-base border-2 focus:border-emerald-500"
                />
              </div>

              <div>
                <Label className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Fecha y Hora de Ingreso
                </Label>
                <p className="text-sm text-gray-600 mb-3">Por defecto se usa la fecha y hora actual</p>
                <Input
                  type="datetime-local"
                  value={nuevaAdmisionData.fechaIngreso}
                  onChange={(e) => setNuevaAdmisionData({ ...nuevaAdmisionData, fechaIngreso: e.target.value })}
                  className="h-12 text-base border-2 focus:border-emerald-500"
                />
              </div>

              {/* Resumen de la admisión */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-5">
                <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Resumen de Admisión
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Paciente:</span>
                    <span className="font-semibold text-gray-900">
                      {pacienteSeleccionado?.nombre} {pacienteSeleccionado?.apellido}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Unidad:</span>
                    <span className="font-semibold text-gray-900">
                      {unidades.find(u => u.id === nuevaAdmisionData.unidadId)?.nombre || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Cama:</span>
                    <span className="font-semibold text-gray-900">
                      {(() => {
                        const cama = camasFiltradas.find(c => c.id === nuevaAdmisionData.camaId);
                        return cama ? `Cama ${cama.numero} - Hab. ${cama.habitacion?.numero}` : '-';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex justify-between items-center pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={anteriorPaso}
              disabled={pasoActual === 1}
              className="h-11 px-6 border-2"
            >
              <span className="flex items-center gap-2">
                ← Anterior
              </span>
            </Button>
            
            {pasoActual < 4 ? (
              <Button 
                onClick={siguientePaso}
                className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6 font-semibold"
              >
                <span className="flex items-center gap-2">
                  Siguiente →
                </span>
              </Button>
            ) : (
              <Button 
                onClick={crearAdmision} 
                className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8 font-semibold shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Crear Admisión
                </span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle Admisión con Tabs Separados */}
      <Dialog open={showDetalle} onOpenChange={setShowDetalle}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalle de Admisión - {admisionSeleccionada?.paciente?.nombre} {admisionSeleccionada?.paciente?.apellido}
            </DialogTitle>
          </DialogHeader>

          {admisionSeleccionada && (
            <Tabs defaultValue="informacion" className="w-full">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="informacion">Información</TabsTrigger>
                <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
                <TabsTrigger value="procedimientos">Procedimientos</TabsTrigger>
                <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
                <TabsTrigger value="interconsultas">Interconsultas</TabsTrigger>
                <TabsTrigger value="egreso">Egreso</TabsTrigger>
                <TabsTrigger value="egreso">Egreso</TabsTrigger>
              </TabsList>

              <TabsContent value="informacion">
                <TabInformacion admision={admisionSeleccionada} />
              </TabsContent>

              <TabsContent value="movimientos">
                <TabMovimientos 
                  admision={admisionSeleccionada} 
                  movimientos={movimientos}
                  onReload={() => cargarDatosAdmision(admisionSeleccionada)}
                />
              </TabsContent>

              <TabsContent value="procedimientos">
                <TabProcedimientos 
                  admision={admisionSeleccionada}
                  procedimientos={procedimientos}
                  onReload={() => cargarDatosAdmision(admisionSeleccionada)}
                />
              </TabsContent>

              <TabsContent value="medicamentos">
                <TabMedicamentos 
                  admision={admisionSeleccionada}
                  onReload={() => cargarDatosAdmision(admisionSeleccionada)}
                />
              </TabsContent>

              <TabsContent value="interconsultas">
                <TabInterconsultas 
                  admision={admisionSeleccionada}
                  onReload={() => cargarDatosAdmision(admisionSeleccionada)}
                />
              </TabsContent>

              <TabsContent value="egreso">
                <TabEgreso 
                  admision={admisionSeleccionada}
                  onReload={() => { cargarDatosAdmision(admisionSeleccionada); cargarAdmisiones(); }}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
