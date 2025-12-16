'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Bed, Activity, Calendar, User, Building2, FileText, Pill, Stethoscope, ClipboardList, DollarSign, Eye, X, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatDateLong, formatTime } from '@/services/formatters';

export default function AdmisionesHospitalizacionModule({ user }) {
  const { toast } = useToast();
  const [admisiones, setAdmisiones] = useState([]);
  const [admisionesFiltradas, setAdmisionesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNuevaAdmision, setShowNuevaAdmision] = useState(false);
  const [showDetalleAdmision, setShowDetalleAdmision] = useState(false);
  const [admisionSeleccionada, setAdmisionSeleccionada] = useState(null);
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  
  // Estados para el modal de nueva admisión (pasos)
  const [pasoActual, setPasoActual] = useState(1);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [unidades, setUnidades] = useState([]);
  const [camas, setCamas] = useState([]);
  const [camasFiltradas, setCamasFiltradas] = useState([]);
  
  const [nuevaAdmisionData, setNuevaAdmisionData] = useState({
    unidadId: '',
    camaId: '',
    motivoIngreso: '',
    diagnosticoIngreso: '',
    fechaIngreso: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    cargarAdmisiones();
    cargarUnidades();
  }, []);

  // Efecto para filtrar admisiones
  useEffect(() => {
    let resultado = [...admisiones];

    // Filtrar por estado
    if (filtroEstado !== 'todas') {
      resultado = resultado.filter(adm => adm.estado === filtroEstado);
    }

    // Filtrar por búsqueda de paciente
    if (filtroBusqueda.trim()) {
      const busqueda = filtroBusqueda.toLowerCase();
      resultado = resultado.filter(adm => 
        adm.paciente?.nombre?.toLowerCase().includes(busqueda) ||
        adm.paciente?.apellido?.toLowerCase().includes(busqueda) ||
        adm.paciente?.cedula?.includes(busqueda)
      );
    }

    setAdmisionesFiltradas(resultado);
  }, [admisiones, filtroEstado, filtroBusqueda]);

  // Calcular contadores
  const contadores = {
    todas: admisiones.length,
    activas: admisiones.filter(a => a.estado === 'Activa').length,
    egresadas: admisiones.filter(a => a.estado === 'Egresada').length,
  };

  const cargarAdmisiones = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admisiones`, {
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
      setAdmisiones([]);
      setAdmisionesFiltradas([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las admisiones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/unidades?activo=true`, {
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

  const buscarPacientes = async (termino) => {
    if (termino.length < 2) {
      setPacientesFiltrados([]);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes?search=${termino}`, {
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

  const cargarCamasPorUnidad = async (unidadId) => {
    try {
      const token = localStorage.getItem('token');
      const url = unidadId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/camas/disponibles?unidadId=${unidadId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/camas/disponibles`;
      
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

  const handleBusquedaPaciente = (valor) => {
    setBusquedaPaciente(valor);
    buscarPacientes(valor);
  };

  const seleccionarPaciente = (paciente) => {
    setPacienteSeleccionado(paciente);
    setBusquedaPaciente(`${paciente.nombre} ${paciente.apellido} - ${paciente.cedula}`);
    setPacientesFiltrados([]);
  };

  const handleUnidadChange = (unidadId) => {
    setNuevaAdmisionData({ ...nuevaAdmisionData, unidadId, camaId: '' });
    cargarCamasPorUnidad(unidadId);
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
    
    setPasoActual(pasoActual + 1);
  };

  const anteriorPaso = () => {
    setPasoActual(pasoActual - 1);
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

      console.log('📤 Enviando datos de admisión:', payload);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admisiones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Respuesta del servidor:', data);

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

  const resetearFormulario = () => {
    setPasoActual(1);
    setBusquedaPaciente('');
    setPacienteSeleccionado(null);
    setPacientesFiltrados([]);
    setNuevaAdmisionData({
      unidadId: '',
      camaId: '',
      motivoIngreso: '',
      diagnosticoIngreso: '',
      fechaIngreso: new Date().toISOString().slice(0, 16),
    });
  };

  const abrirDetalleAdmision = async (admision) => {
    setAdmisionSeleccionada(admision);
    setShowDetalleAdmision(true);
  };

  const getEstadoBadge = (estado) => {
    const configs = {
      Activa: { bg: 'bg-green-100', text: 'text-green-800' },
      Egresada: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    const config = configs[estado] || configs.Activa;
    return (
      <Badge className={`${config.bg} ${config.text}`}>
        {estado}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando admisiones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admisiones a Hospitalización</h1>
          <p className="text-gray-600 mt-1">Gestión de ingresos hospitalarios</p>
        </div>
        <Button
          onClick={() => setShowNuevaAdmision(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Admisión
        </Button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${filtroEstado === 'todas' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:shadow-md'}`}
          onClick={() => setFiltroEstado('todas')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Admisiones</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{contadores.todas}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filtroEstado === 'Activa' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:shadow-md'}`}
          onClick={() => setFiltroEstado('Activa')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admisiones Activas</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{contadores.activas}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Bed className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filtroEstado === 'Egresada' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:shadow-md'}`}
          onClick={() => setFiltroEstado('Egresada')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admisiones Egresadas</p>
                <p className="text-3xl font-bold text-gray-600 mt-2">{contadores.egresadas}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o cédula del paciente..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            {filtroBusqueda && (
              <Button
                variant="outline"
                onClick={() => setFiltroBusqueda('')}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Admisiones */}
      <div>
        <div className="mb-4 text-sm text-gray-600">
          Mostrando {admisionesFiltradas.length} de {admisiones.length} admisiones
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {admisionesFiltradas.map((admision) => (
          <Card key={admision.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {admision.paciente?.nombre} {admision.paciente?.apellido}
                </CardTitle>
                {getEstadoBadge(admision.estado)}
              </div>
              <p className="text-sm text-gray-500">{admision.paciente?.cedula}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{admision.unidad?.nombre}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bed className="h-4 w-4 text-gray-500" />
                <span>Cama: {admision.cama?.numero || 'Sin asignar'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formatDateLong(admision.fechaIngreso)}</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500">Motivo:</p>
                <p className="text-sm">{admision.motivoIngreso}</p>
              </div>
              <Button
                onClick={() => abrirDetalleAdmision(admision)}
                variant="outline"
                className="w-full mt-3"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalle
              </Button>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>

      {admisionesFiltradas.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No hay admisiones activas</h3>
            <p>Cree una nueva admisión para comenzar</p>
          </div>
        </Card>
      )}

      {/* Modal Nueva Admisión (Multi-paso) */}
      <Dialog open={showNuevaAdmision} onOpenChange={setShowNuevaAdmision}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Nueva Admisión Hospitalaria</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">Complete la información en {4} pasos</p>
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

      {/* Modal Detalle de Admisión (implementaremos los tabs en el siguiente paso) */}
      {showDetalleAdmision && admisionSeleccionada && (
        <DetalleAdmisionModal
          admision={admisionSeleccionada}
          onClose={() => {
            setShowDetalleAdmision(false);
            setAdmisionSeleccionada(null);
            cargarAdmisiones();
          }}
        />
      )}
    </div>
  );
}

// Componente para el modal de detalle (lo implementaremos a continuación)
function DetalleAdmisionModal({ admision, onClose }) {
  const { toast } = useToast();
  const [tabActivo, setTabActivo] = useState('admision');
  const [admisionData, setAdmisionData] = useState(admision);
  
  // Estados para cada tab
  const [procedimientos, setProcedimientos] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [interconsultas, setInterconsultas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  const cargarDatosAdmision = async () => {
    // Cargar todos los datos relacionados con la admisión
    const token = localStorage.getItem('token');
    
    try {
      // Cargar procedimientos
      const procRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/procedimientos?admisionId=${admision.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const procData = await procRes.json();
      if (procData.success) {
        setProcedimientos(Array.isArray(procData.data) ? procData.data : []);
      }

      // Cargar medicamentos (órdenes de medicamentos)
      const medRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes-medicamentos?admision_id=${admision.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const medData = await medRes.json();
      if (medData.success) {
        // paginated devuelve data directamente
        setMedicamentos(Array.isArray(medData.data) ? medData.data : []);
      }

      // Cargar interconsultas
      const interRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interconsultas?admisionId=${admision.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const interData = await interRes.json();
      if (interData.success) {
        setInterconsultas(Array.isArray(interData.data) ? interData.data : []);
      }

      // Cargar movimientos
      const movRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movimientos?admisionId=${admision.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const movData = await movRes.json();
      if (movData.success) {
        setMovimientos(Array.isArray(movData.data.movimientos) ? movData.data.movimientos : []);
      }
    } catch (error) {
      console.error('Error cargando datos de admisión:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar algunos datos de la admisión',
        variant: 'destructive',
      });
    }
  };
  useEffect(() => {
    cargarDatosAdmision();
  }, []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detalle de Admisión - {admisionData.paciente?.nombre} {admisionData.paciente?.apellido}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tabActivo} onValueChange={setTabActivo}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="admision">Admisión</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="procedimientos">Procedimientos</TabsTrigger>
            <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
            <TabsTrigger value="interconsultas">Interconsultas</TabsTrigger>
            <TabsTrigger value="egreso">Egreso</TabsTrigger>
            <TabsTrigger value="facturacion">Facturación</TabsTrigger>
          </TabsList>

          {/* Tab Admisión */}
          <TabsContent value="admision">
            <TabAdmisionInfo admision={admisionData} />
          </TabsContent>

          {/* Tab Movimientos */}
          <TabsContent value="movimientos">
            <TabMovimientos 
              admision={admisionData} 
              movimientos={movimientos}
              onReload={cargarDatosAdmision}
            />
          </TabsContent>

          {/* Tab Procedimientos */}
          <TabsContent value="procedimientos">
            <TabProcedimientos 
              admision={admisionData}
              procedimientos={procedimientos}
              onReload={cargarDatosAdmision}
            />
          </TabsContent>

          {/* Tab Medicamentos */}
          <TabsContent value="medicamentos">
            <TabMedicamentos 
              admision={admisionData}
              medicamentos={medicamentos}
              onReload={cargarDatosAdmision}
            />
          </TabsContent>

          {/* Tab Interconsultas */}
          <TabsContent value="interconsultas">
            <TabInterconsultas 
              admision={admisionData}
              interconsultas={interconsultas}
              onReload={cargarDatosAdmision}
            />
          </TabsContent>

          {/* Tab Egreso */}
          <TabsContent value="egreso">
            <TabEgreso admision={admisionData} onClose={onClose} />
          </TabsContent>

          {/* Tab Facturación */}
          <TabsContent value="facturacion">
            <TabFacturacion 
              admision={admisionData}
              procedimientos={procedimientos}
              medicamentos={medicamentos}
              interconsultas={interconsultas}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Tab Admisión - Información General
function TabAdmisionInfo({ admision }) {
  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Información del Paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-600">Nombre Completo</Label>
            <p className="font-semibold">{admision.paciente?.nombre} {admision.paciente?.apellido}</p>
          </div>
          <div>
            <Label className="text-gray-600">Cédula</Label>
            <p className="font-semibold">{admision.paciente?.cedula}</p>
          </div>
          <div>
            <Label className="text-gray-600">Edad</Label>
            <p className="font-semibold">{admision.paciente?.edad} años</p>
          </div>
          <div>
            <Label className="text-gray-600">Teléfono</Label>
            <p className="font-semibold">{admision.paciente?.telefono || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de Admisión</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-600">Unidad</Label>
            <p className="font-semibold">{admision.unidad?.nombre}</p>
          </div>
          <div>
            <Label className="text-gray-600">Cama</Label>
            <p className="font-semibold">
              {admision.cama ? `Cama ${admision.cama.numero} - Habitación ${admision.cama.habitacion?.numero}` : 'Sin asignar'}
            </p>
          </div>
          <div>
            <Label className="text-gray-600">Fecha de Ingreso</Label>
            <p className="font-semibold">{formatDateLong(admision.fechaIngreso)}</p>
          </div>
          <div>
            <Label className="text-gray-600">Estado</Label>
            <Badge className={admision.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {admision.estado}
            </Badge>
          </div>
          <div className="col-span-2">
            <Label className="text-gray-600">Motivo de Ingreso</Label>
            <p className="font-semibold">{admision.motivoIngreso}</p>
          </div>
          <div className="col-span-2">
            <Label className="text-gray-600">Diagnóstico de Ingreso</Label>
            <p className="font-semibold">{admision.diagnosticoIngreso}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== TAB MOVIMIENTOS ====================
function TabMovimientos({ admision, movimientos, onReload }) {
  const { toast } = useToast();
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
  const [unidades, setUnidades] = useState([]);
  const [camas, setCamas] = useState([]);
  const [movimientoData, setMovimientoData] = useState({
    tipo: 'CambioUnidad',
    unidadDestinoId: '',
    camaDestinoId: '',
    motivo: '',
    observaciones: '',
  });

  const cargarUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/unidades?activo=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setUnidades(data.data.unidades || data.data || []);
    } catch (error) {
      console.error('Error cargando unidades:', error);
    }
  };

  const cargarCamas = async (unidadId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/camas/disponibles?unidadId=${unidadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setCamas(data.data.camas || data.data || []);
    } catch (error) {
      console.error('Error cargando camas:', error);
    }
  };
  useEffect(() => {
    cargarUnidades();
  }, []);

  const crearMovimiento = async () => {
    if (!movimientoData.motivo || !movimientoData.unidadDestinoId || !movimientoData.camaDestinoId) {
      toast({
        title: 'Campos requeridos',
        description: 'Complete todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movimientos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          admisionId: admision.id,
          tipo: movimientoData.tipo,
          unidadOrigenId: admision.unidadId,
          unidadDestinoId: movimientoData.unidadDestinoId,
          camaOrigenId: admision.camaId,
          camaDestinoId: movimientoData.camaDestinoId,
          motivo: movimientoData.motivo,
          observaciones: movimientoData.observaciones,
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Movimiento registrado correctamente',
        });
        setShowNuevoMovimiento(false);
        setMovimientoData({
          tipo: 'CambioUnidad',
          unidadDestinoId: '',
          camaDestinoId: '',
          motivo: '',
          observaciones: '',
        });
        onReload();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo registrar el movimiento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creando movimiento:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al registrar el movimiento',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Historial de Movimientos</h3>
        <Button onClick={() => setShowNuevoMovimiento(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* Ubicación Actual */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Bed className="h-5 w-5 text-emerald-700" />
            <h4 className="font-semibold text-emerald-900">Ubicación Actual</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-emerald-700">Unidad:</span>
              <span className="ml-2 font-medium">{admision.unidad?.nombre}</span>
            </div>
            <div>
              <span className="text-emerald-700">Cama:</span>
              <span className="ml-2 font-medium">
                {admision.cama ? `${admision.cama.numero} - Hab ${admision.cama.habitacion?.numero}` : 'Sin asignar'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Movimientos */}
      <div className="space-y-3">
        {movimientos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay movimientos registrados</p>
        ) : (
          movimientos.map((mov) => (
            <Card key={mov.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{mov.tipo}</Badge>
                      <span className="text-sm text-gray-500">{formatDateLong(mov.fechaMovimiento)}</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-gray-600">Motivo:</span>
                        <span className="ml-2">{mov.motivo}</span>
                      </div>
                      {mov.unidadOrigen && mov.unidadDestino && (
                        <div>
                          <span className="text-gray-600">Traslado:</span>
                          <span className="ml-2">{mov.unidadOrigen.nombre} → {mov.unidadDestino.nombre}</span>
                        </div>
                      )}
                      {mov.camaOrigen && mov.camaDestino && (
                        <div>
                          <span className="text-gray-600">Camas:</span>
                          <span className="ml-2">Cama {mov.camaOrigen.numero} → Cama {mov.camaDestino.numero}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Nuevo Movimiento */}
      {showNuevoMovimiento && (
        <Dialog open={showNuevoMovimiento} onOpenChange={setShowNuevoMovimiento}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Movimiento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Movimiento</Label>
                <Select
                  value={movimientoData.tipo}
                  onValueChange={(value) => setMovimientoData({ ...movimientoData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CambioUnidad">Cambio de Unidad</SelectItem>
                    <SelectItem value="CambioCama">Cambio de Cama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Unidad Destino *</Label>
                <Select
                  value={movimientoData.unidadDestinoId}
                  onValueChange={(value) => {
                    setMovimientoData({ ...movimientoData, unidadDestinoId: value, camaDestinoId: '' });
                    cargarCamas(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(unidades) && unidades.map((unidad) => (
                      <SelectItem key={unidad.id} value={unidad.id}>
                        {unidad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cama Destino *</Label>
                <Select
                  value={movimientoData.camaDestinoId}
                  onValueChange={(value) => setMovimientoData({ ...movimientoData, camaDestinoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione cama" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(camas) && camas.map((cama) => (
                      <SelectItem key={cama.id} value={cama.id}>
                        Cama {cama.numero} - Hab {cama.habitacion?.numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Motivo *</Label>
                <Textarea
                  value={movimientoData.motivo}
                  onChange={(e) => setMovimientoData({ ...movimientoData, motivo: e.target.value })}
                  placeholder="Describa el motivo del traslado..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Observaciones</Label>
                <Textarea
                  value={movimientoData.observaciones}
                  onChange={(e) => setMovimientoData({ ...movimientoData, observaciones: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowNuevoMovimiento(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={crearMovimiento} className="flex-1">
                  Registrar Movimiento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ==================== TAB PROCEDIMIENTOS ====================
function TabProcedimientos({ admision, procedimientos, onReload }) {
  const { toast } = useToast();
  const [showAgregar, setShowAgregar] = useState(false);
  const [tipoProcedimiento, setTipoProcedimiento] = useState('Examen');
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const cargarServicios = async (tipo) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/examenes-procedimientos?tipo=${tipo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setServicios(data.data || []);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };
  useEffect(() => {
    if (showAgregar) {
      cargarServicios(tipoProcedimiento);
    }
  }, [tipoProcedimiento, showAgregar]);

  const agregarProcedimiento = async () => {
    if (!servicioSeleccionado) {
      toast({
        title: 'Atención',
        description: 'Seleccione un servicio',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const servicio = servicios.find(s => s.id === servicioSeleccionado);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/procedimientos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pacienteId: admision.pacienteId,
          admisionId: admision.id,
          nombre: servicio.titulo || servicio.nombre,
          descripcion: servicio.descripcion || '',
          indicacion: observaciones || 'Procedimiento solicitado durante hospitalización',
          tipo: tipoProcedimiento === 'Examen' ? 'Diagnostico' : 'Terapeutico', // Convertir a valores válidos
          estado: 'Programado',
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Procedimiento agregado correctamente',
        });
        setShowAgregar(false);
        setServicioSeleccionado('');
        setObservaciones('');
        onReload();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo agregar el procedimiento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error agregando procedimiento:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Procedimientos y Exámenes</h3>
        <Button onClick={() => setShowAgregar(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de Procedimientos */}
      <div className="space-y-3">
        {procedimientos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay procedimientos registrados</p>
        ) : (
          procedimientos.map((proc) => (
            <Card key={proc.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={proc.examenProcedimiento?.tipo === 'Examen' ? 'bg-cyan-100 text-cyan-800' : 'bg-teal-100 text-teal-800'}>
                        {proc.examenProcedimiento?.tipo}
                      </Badge>
                      <Badge variant="outline">{proc.estado}</Badge>
                    </div>
                    <h4 className="font-semibold">{proc.examenProcedimiento?.nombre}</h4>
                    <p className="text-sm text-gray-600 mt-1">{proc.observaciones}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Precio: ${parseFloat(proc.precioAplicado).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Agregar Procedimiento */}
      {showAgregar && (
        <Dialog open={showAgregar} onOpenChange={setShowAgregar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Procedimiento/Examen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={tipoProcedimiento} onValueChange={setTipoProcedimiento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Examen">Examen</SelectItem>
                    <SelectItem value="Procedimiento">Procedimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Servicio *</Label>
                <Select value={servicioSeleccionado} onValueChange={setServicioSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(servicios) && servicios.map((servicio) => (
                      <SelectItem key={servicio.id} value={servicio.id}>
                        {servicio.titulo || servicio.nombre} {servicio.precio ? `- $${servicio.precio.toLocaleString()}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observaciones</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Indicaciones o notas adicionales..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAgregar(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={agregarProcedimiento} className="flex-1">
                  Agregar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ==================== TAB MEDICAMENTOS ====================
function TabMedicamentos({ admision, medicamentos, onReload }) {
  const { toast } = useToast();
  const [showAplicar, setShowAplicar] = useState(false);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [medicamentoData, setMedicamentoData] = useState({
    productoId: '',
    dosis: '',
    via: 'Oral',
    frecuencia: '',
    duracion: '',
    observaciones: '',
  });

  const buscarProductos = async (termino) => {
    if (termino.length < 2) {
      setProductos([]);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos?search=${termino}&tipo=Medicamento&activo=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProductos(data.data.productos || data.data || []);
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (busqueda) {
        buscarProductos(busqueda);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [busqueda]);

  const aplicarMedicamento = async () => {
    if (!medicamentoData.productoId || !medicamentoData.dosis) {
      toast({
        title: 'Campos requeridos',
        description: 'Seleccione un medicamento y especifique la dosis',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const producto = productos.find(p => p.id === medicamentoData.productoId);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes-medicamentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: admision.pacienteId,
          admision_id: admision.id,
          doctor_id: user.id || null,
          items: [
            {
              producto_id: medicamentoData.productoId,
              cantidad: 1,
              precio_unitario: producto.precio || 0,
              descuento: 0,
              indicaciones: `${medicamentoData.dosis} - ${medicamentoData.via} - ${medicamentoData.frecuencia} - ${medicamentoData.duracion}`,
            }
          ],
          observaciones: medicamentoData.observaciones,
          estado: 'Pendiente',
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Medicamento aplicado correctamente',
        });
        setShowAplicar(false);
        setBusqueda('');
        setProductos([]);
        setMedicamentoData({
          productoId: '',
          dosis: '',
          via: 'Oral',
          frecuencia: '',
          duracion: '',
          observaciones: '',
        });
        onReload();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo aplicar el medicamento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error aplicando medicamento:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Medicamentos Administrados</h3>
        <Button onClick={() => setShowAplicar(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Aplicar Medicamento
        </Button>
      </div>

      {/* Lista de Medicamentos */}
      <div className="space-y-3">
        {medicamentos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay medicamentos registrados</p>
        ) : (
          medicamentos.map((orden) => (
            <Card key={orden.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={orden.estado === 'Despachada' ? 'default' : orden.estado === 'Pendiente' ? 'secondary' : 'outline'}>
                        {orden.estado}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(orden.fechaOrden).toLocaleDateString()}
                      </span>
                    </div>
                    {orden.observaciones && (
                      <p className="text-sm text-gray-600 mb-2">{orden.observaciones}</p>
                    )}
                  </div>
                </div>
                
                {/* Items de la orden */}
                <div className="space-y-2 border-t pt-3">
                  {orden.items && orden.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start bg-gray-50 p-2 rounded">
                      <div>
                        <h4 className="font-semibold text-emerald-900">
                          {item.producto?.nombre || 'Medicamento'}
                        </h4>
                        <p className="text-sm text-gray-600">{item.indicaciones}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          Cantidad: {item.cantidad}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${item.subtotal?.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Aplicar Medicamento */}
      <Dialog open={showAplicar} onOpenChange={setShowAplicar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aplicar Medicamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Buscar Medicamento *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Escriba el nombre del medicamento..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {productos.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                  {productos.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setMedicamentoData({ ...medicamentoData, productoId: prod.id });
                        setBusqueda(prod.nombre);
                        setProductos([]);
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{prod.nombre}</div>
                      <div className="text-sm text-gray-500">{prod.descripcion}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dosis *</Label>
                <Input
                  value={medicamentoData.dosis}
                  onChange={(e) => setMedicamentoData({ ...medicamentoData, dosis: e.target.value })}
                  placeholder="Ej: 500 mg"
                />
              </div>
              
              <div>
                <Label>Vía de Administración *</Label>
                <Select
                  value={medicamentoData.via}
                  onValueChange={(value) => setMedicamentoData({ ...medicamentoData, via: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oral">Oral</SelectItem>
                    <SelectItem value="Intravenosa">Intravenosa</SelectItem>
                    <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                    <SelectItem value="Subcutánea">Subcutánea</SelectItem>
                    <SelectItem value="Tópica">Tópica</SelectItem>
                    <SelectItem value="Oftálmica">Oftálmica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Frecuencia</Label>
                <Input
                  value={medicamentoData.frecuencia}
                  onChange={(e) => setMedicamentoData({ ...medicamentoData, frecuencia: e.target.value })}
                  placeholder="Ej: Cada 8 horas"
                />
              </div>
              
              <div>
                <Label>Duración</Label>
                <Input
                  value={medicamentoData.duracion}
                  onChange={(e) => setMedicamentoData({ ...medicamentoData, duracion: e.target.value })}
                  placeholder="Ej: 7 días"
                />
              </div>
            </div>

            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={medicamentoData.observaciones}
                onChange={(e) => setMedicamentoData({ ...medicamentoData, observaciones: e.target.value })}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAplicar(false)}>
                Cancelar
              </Button>
              <Button onClick={aplicarMedicamento}>
                Aplicar Medicamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== TAB INTERCONSULTAS ====================
function TabInterconsultas({ admision, interconsultas, onReload }) {
  const { toast } = useToast();
  const [showNuevaInterconsulta, setShowNuevaInterconsulta] = useState(false);
  const [especialidades, setEspecialidades] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [interconsultaData, setInterconsultaData] = useState({
    especialidad: '',
    doctorId: '',
    motivo: '',
    urgente: false,
  });

  const cargarEspecialidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/especialidades`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // paginated() devuelve data directamente como array
        setEspecialidades(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error cargando especialidades:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las especialidades',
        variant: 'destructive',
      });
    }
  };

  const cargarDoctoresPorEspecialidad = async (especialidad) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctores?especialidad=${especialidad}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDoctores(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error cargando doctores:', error);
    }
  };

  useEffect(() => {
    if (showNuevaInterconsulta) {
      cargarEspecialidades();
    }
  }, [showNuevaInterconsulta]);

  useEffect(() => {
    if (interconsultaData.especialidad) {
      cargarDoctoresPorEspecialidad(interconsultaData.especialidad);
    }
  }, [interconsultaData.especialidad]);

  const crearInterconsulta = async () => {
    if (!interconsultaData.especialidad || !interconsultaData.motivo) {
      toast({
        title: 'Campos requeridos',
        description: 'Complete la especialidad y motivo',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interconsultas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pacienteId: admision.pacienteId,
          admisionId: admision.id,
          especialidadSolicitada: interconsultaData.especialidad, // String: nombre de la especialidad
          motivoConsulta: interconsultaData.motivo,
          prioridad: interconsultaData.urgente ? 'Alta' : 'Media',
          medicoEspecialistaId: interconsultaData.doctorId || undefined,
          antecedentesRelevantes: null,
          examenesSolicitados: null,
          diagnosticoPresuntivo: null,
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Interconsulta creada correctamente',
        });
        setShowNuevaInterconsulta(false);
        setInterconsultaData({
          especialidad: '',
          doctorId: '',
          motivo: '',
          urgente: false,
        });
        onReload();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo crear la interconsulta',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creando interconsulta:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Interconsultas</h3>
        <Button onClick={() => setShowNuevaInterconsulta(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Interconsulta
        </Button>
      </div>

      {/* Lista de Interconsultas */}
      <div className="space-y-3">
        {interconsultas.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay interconsultas registradas</p>
        ) : (
          interconsultas.map((inter) => (
            <Card key={inter.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={inter.prioridad === 'Urgente' ? 'destructive' : 'default'}>
                        {inter.especialidad}
                      </Badge>
                      <Badge variant="outline">{inter.estado}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{inter.motivo}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Solicitada: {new Date(inter.fechaSolicitud).toLocaleDateString()}</span>
                      {inter.medicoEspecialista && (
                        <span>Dr. {inter.medicoEspecialista.nombre}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Nueva Interconsulta */}
      <Dialog open={showNuevaInterconsulta} onOpenChange={setShowNuevaInterconsulta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Interconsulta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Especialidad *</Label>
              <Select
                value={interconsultaData.especialidad}
                onValueChange={(value) => setInterconsultaData({ ...interconsultaData, especialidad: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {especialidades.map((esp) => (
                    <SelectItem key={esp.titulo || esp.nombre} value={esp.titulo || esp.nombre}>
                      {esp.titulo || esp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {doctores.length > 0 && (
              <div>
                <Label>Especialista (Opcional)</Label>
                <Select
                  value={interconsultaData.doctorId}
                  onValueChange={(value) => setInterconsultaData({ ...interconsultaData, doctorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione especialista" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctores.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        Dr. {doc.nombre} {doc.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Motivo de Interconsulta *</Label>
              <Textarea
                value={interconsultaData.motivo}
                onChange={(e) => setInterconsultaData({ ...interconsultaData, motivo: e.target.value })}
                placeholder="Describa el motivo de la interconsulta..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="urgente"
                checked={interconsultaData.urgente}
                onChange={(e) => setInterconsultaData({ ...interconsultaData, urgente: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="urgente" className="font-normal cursor-pointer">
                Marcar como urgente
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNuevaInterconsulta(false)}>
                Cancelar
              </Button>
              <Button onClick={crearInterconsulta}>
                Crear Interconsulta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== TAB EGRESO ====================
function TabEgreso({ admision, onClose }) {
  const { toast } = useToast();
  const [egresoData, setEgresoData] = useState({
    diagnosticoSalida: '',
    descripcionDiagnostico: '',
    resumenClinico: '',
    tratamientoDomiciliario: '',
    recomendaciones: '',
    tipoEgreso: 'Alta',
    estadoPaciente: 'Mejorado',
    requiereControl: false,
    fechaControl: '',
  });

  const crearEgreso = async () => {
    if (!egresoData.diagnosticoSalida || !egresoData.resumenClinico) {
      toast({
        title: 'Campos requeridos',
        description: 'Complete diagnóstico y resumen clínico',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/egresos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          admisionId: admision.id,
          diagnosticoSalida: egresoData.diagnosticoSalida,
          descripcionDiagnostico: egresoData.descripcionDiagnostico,
          resumenClinico: egresoData.resumenClinico,
          tratamientoDomiciliario: egresoData.tratamientoDomiciliario,
          recomendaciones: egresoData.recomendaciones,
          tipoEgreso: egresoData.tipoEgreso,
          estadoPaciente: egresoData.estadoPaciente,
          requiereControl: egresoData.requiereControl,
          fechaControl: egresoData.requiereControl ? egresoData.fechaControl : null,
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Egreso registrado correctamente',
        });
        onClose();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo registrar el egreso',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creando egreso:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al registrar el egreso',
        variant: 'destructive',
      });
    }
  };

  if (admision.estado === 'Egresada') {
    return (
      <div className="p-4">
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <p className="text-center text-gray-600">Esta admisión ya tiene un egreso registrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const diagnosticosComunesCIE11 = [
    { codigo: 'A09', descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso' },
    { codigo: 'J18.9', descripcion: 'Neumonía, no especificada' },
    { codigo: 'K35.8', descripcion: 'Apendicitis aguda' },
    { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
    { codigo: 'E11.9', descripcion: 'Diabetes mellitus no insulinodependiente sin complicaciones' },
    { codigo: 'K80.2', descripcion: 'Colelitiasis sin colecistitis' },
    { codigo: 'N39.0', descripcion: 'Infección de vías urinarias' },
    { codigo: 'O80', descripcion: 'Parto único espontáneo' },
    { codigo: 'S72.0', descripcion: 'Fractura del cuello del fémur' },
    { codigo: 'J45.9', descripcion: 'Asma, no especificada' },
    { codigo: 'K29.7', descripcion: 'Gastritis, no especificada' },
    { codigo: 'M54.5', descripcion: 'Lumbago' },
    { codigo: 'I50.9', descripcion: 'Insuficiencia cardíaca, no especificada' },
    { codigo: 'J44.9', descripcion: 'Enfermedad pulmonar obstructiva crónica' },
    { codigo: 'N20.0', descripcion: 'Cálculo del riñón' },
  ];

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Formulario de Egreso</h3>

      <div className="space-y-4">
        <div>
          <Label>Código Diagnóstico (CIE-11) *</Label>
          <Input
            value={egresoData.diagnosticoSalida}
            onChange={(e) => setEgresoData({ ...egresoData, diagnosticoSalida: e.target.value })}
            placeholder="Ej: J18.9, K35.8, I10"
          />
        </div>
        
        <div>
          <Label>Descripción del Diagnóstico *</Label>
          <Input
            value={egresoData.descripcionDiagnostico}
            onChange={(e) => setEgresoData({ ...egresoData, descripcionDiagnostico: e.target.value })}
            placeholder="Descripción completa del diagnóstico"
          />
        </div>
        
        <div>
          <Label className="text-sm text-gray-600">Diagnósticos Comunes CIE-11</Label>
          <Select
            value=""
            onValueChange={(value) => {
              const diag = diagnosticosComunesCIE11.find(d => d.codigo === value);
              if (diag) {
                setEgresoData({ 
                  ...egresoData, 
                  diagnosticoSalida: diag.codigo,
                  descripcionDiagnostico: diag.descripcion
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un diagnóstico predefinido para autocompletar" />
            </SelectTrigger>
            <SelectContent>
              {diagnosticosComunesCIE11.map((diag) => (
                <SelectItem key={diag.codigo} value={diag.codigo}>
                  {diag.codigo} - {diag.descripcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Resumen Clínico *</Label>
        <Textarea
          value={egresoData.resumenClinico}
          onChange={(e) => setEgresoData({ ...egresoData, resumenClinico: e.target.value })}
          placeholder="Resumen de la estancia hospitalaria..."
          rows={4}
        />
      </div>

      <div>
        <Label>Tratamiento Domiciliario</Label>
        <Textarea
          value={egresoData.tratamientoDomiciliario}
          onChange={(e) => setEgresoData({ ...egresoData, tratamientoDomiciliario: e.target.value })}
          placeholder="Medicamentos y cuidados en casa..."
          rows={3}
        />
      </div>

      <div>
        <Label>Recomendaciones</Label>
        <Textarea
          value={egresoData.recomendaciones}
          onChange={(e) => setEgresoData({ ...egresoData, recomendaciones: e.target.value })}
          placeholder="Recomendaciones para el paciente..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Egreso</Label>
          <Select
            value={egresoData.tipoEgreso}
            onValueChange={(value) => setEgresoData({ ...egresoData, tipoEgreso: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Alta">Alta Médica</SelectItem>
              <SelectItem value="Remision">Remisión</SelectItem>
              <SelectItem value="Fuga">Fuga</SelectItem>
              <SelectItem value="Retiro">Retiro Voluntario</SelectItem>
              <SelectItem value="Fallecimiento">Fallecimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Estado del Paciente</Label>
          <Select
            value={egresoData.estadoPaciente}
            onValueChange={(value) => setEgresoData({ ...egresoData, estadoPaciente: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mejorado">Mejorado</SelectItem>
              <SelectItem value="Curado">Curado</SelectItem>
              <SelectItem value="SinCambios">Sin Cambios</SelectItem>
              <SelectItem value="Agravado">Agravado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={egresoData.requiereControl}
            onChange={(e) => setEgresoData({ ...egresoData, requiereControl: e.target.checked })}
            className="w-4 h-4"
          />
          <span>Requiere control médico</span>
        </label>
        {egresoData.requiereControl && (
          <div className="flex-1">
            <Input
              type="date"
              value={egresoData.fechaControl}
              onChange={(e) => setEgresoData({ ...egresoData, fechaControl: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={crearEgreso} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          Registrar Egreso
        </Button>
      </div>
    </div>
  );
}

// ==================== TAB FACTURACIÓN ====================
function TabFacturacion({ admision, procedimientos, medicamentos, interconsultas }) {
  const { toast } = useToast();
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [estadoPago, setEstadoPago] = useState('Pendiente');

  // Calcular totales
  const totalProcedimientos = procedimientos.reduce((sum, proc) => sum + parseFloat(proc.precioAplicado || 0), 0);
  const totalMedicamentos = medicamentos.reduce((sum, orden) => {
    const ordenTotal = orden.items?.reduce((s, item) => s + parseFloat(item.subtotal || 0), 0) || 0;
    return sum + ordenTotal;
  }, 0);
  const totalInterconsultas = interconsultas.length * 50000; // Precio base interconsulta
  const totalGeneral = totalProcedimientos + totalMedicamentos + totalInterconsultas;

  const guardarFacturacion = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Crear o actualizar factura consolidada
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/facturas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: admision.pacienteId,
          subtotal: totalGeneral,
          total: totalGeneral,
          saldo_pendiente: estadoPago === 'Pagada' ? 0 : totalGeneral,
          estado: estadoPago,
          cubierto_por_eps: false,
          items: [
            ...procedimientos.map(proc => ({
              tipo: 'Procedimiento',
              descripcion: proc.examenProcedimiento?.nombre || 'Procedimiento',
              cantidad: 1,
              precio_unitario: parseFloat(proc.precioAplicado),
              subtotal: parseFloat(proc.precioAplicado),
            })),
            ...medicamentos.flatMap(orden => 
              orden.items?.map(item => ({
                tipo: 'Medicamento',
                descripcion: item.producto?.nombre || 'Medicamento',
                cantidad: item.cantidad,
                precio_unitario: parseFloat(item.precioUnitario),
                subtotal: parseFloat(item.subtotal),
              })) || []
            ),
            ...interconsultas.map(inter => ({
              tipo: 'Interconsulta',
              descripcion: `Interconsulta - ${inter.especialidad?.nombre}`,
              cantidad: 1,
              precio_unitario: 50000,
              subtotal: 50000,
              cita_id: inter.id,
            }))
          ]
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Facturación guardada correctamente',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo guardar la facturación',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error guardando facturación:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Facturación Consolidada</h3>

      {/* Resumen de Costos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle de Costos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Procedimientos ({procedimientos.length})</span>
            <span className="font-semibold">${totalProcedimientos.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Medicamentos ({medicamentos.reduce((sum, o) => sum + (o.items?.length || 0), 0)})</span>
            <span className="font-semibold">${totalMedicamentos.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Interconsultas ({interconsultas.length})</span>
            <span className="font-semibold">${totalInterconsultas.toLocaleString()}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-lg">
            <span className="font-bold">Total General</span>
            <span className="font-bold text-emerald-600">${totalGeneral.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Información de Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de Pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Método de Pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
                <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                <SelectItem value="Transferencia">Transferencia</SelectItem>
                <SelectItem value="EPS">EPS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estado de Pago</Label>
            <Select value={estadoPago} onValueChange={setEstadoPago}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Pagada">Pagada</SelectItem>
                <SelectItem value="Parcial">Pago Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={guardarFacturacion} className="w-full mt-4">
            <DollarSign className="w-4 h-4 mr-2" />
            Guardar Facturación
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
