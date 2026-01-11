'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar,
  Users,
  Activity,
  Scissors,
  FileText,
  Timer,
  ClipboardList,
  Settings,
  Play,
  XCircle,
  Pause,
  Edit,
  Trash2,
  Download,
} from 'lucide-react';
import { quirofanoService } from '@/services/quirofano.service';
import { procedimientoService } from '@/services/procedimiento.service';
import { format, differenceInYears, parseISO } from 'date-fns';

export default function QuirofanoModule({ user }) {
  const [activeTab, setActiveTab] = useState('programadas');
  const [showNewCirugia, setShowNewCirugia] = useState(false);
  const [showBitacora, setShowBitacora] = useState(false);
  const [selectedCirugia, setSelectedCirugia] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [cirugias, setCirugias] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    programadasHoy: 0,
    enCurso: 0,
    completadas: 0,
    totalMes: 0
  });
  const [showGestionSalas, setShowGestionSalas] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fechas para filtros
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();

      // Fetch quirofanos
      const quirofanosData = await quirofanoService.getAll();

      // Fetch procedimientos (cirugías)
      const procedimientosData = await procedimientoService.getAll({
        limit: 200,
      });

      // Fetch estadísticas
      const estadisticasData = await procedimientoService.getEstadisticas({
        fechaInicio: inicioMes
      });

      // Mapear cirugías al formato del componente
      const mappedCirugias = (procedimientosData.data || []).map(proc => ({
        id: proc.id,
        paciente: {
          nombre: `${proc.paciente.nombre} ${proc.paciente.apellido}`,
          cedula: proc.paciente.cedula,
          edad: proc.paciente.fechaNacimiento ? differenceInYears(new Date(), new Date(proc.paciente.fechaNacimiento)) : 'N/A',
          genero: proc.paciente.genero || 'N/A'
        },
        procedimiento: proc.nombre,
        categoria: proc.tipoCirugia || proc.tipo || 'General',
        cirujano: proc.medicoResponsable ? `${proc.medicoResponsable.nombre} ${proc.medicoResponsable.apellido}` : 'Sin asignar',
        ayudante: Array.isArray(proc.ayudantes) ? proc.ayudantes.join(', ') : 'N/A',
        anestesiologo: proc.anestesiologo ? `${proc.anestesiologo.nombre} ${proc.anestesiologo.apellido}` : 'Sin asignar',
        enfermeroInstrumentista: 'N/A', // No en modelo actual
        sala: proc.quirofano ? proc.quirofano.nombre : 'Sin sala',
        fechaProgramada: proc.fechaProgramada ? format(new Date(proc.fechaProgramada), 'yyyy-MM-dd') : 'Pendiente',
        horaInicio: proc.fechaProgramada ? format(new Date(proc.fechaProgramada), 'HH:mm') : '--:--',
        duracionEstimada: proc.duracionEstimada ? `${proc.duracionEstimada} min` : 'N/A',
        estado: mapEstado(proc.estado),
        horaInicioReal: proc.horaInicioReal ? format(new Date(proc.horaInicioReal), 'HH:mm') : null,
        horaFinReal: proc.horaFinReal ? format(new Date(proc.horaFinReal), 'HH:mm') : null,
        duracionReal: proc.duracionReal ? `${proc.duracionReal} min` : null,
        prioridad: proc.prioridad || 'Electivo',
        diagnostico: proc.indicacion || 'N/A',
        codigoCIE10: proc.codigoCIE10,
        codigoCUPS: proc.codigoCUPS,
        riesgos: proc.riesgosPotenciales || 'No registrado',
        observaciones: proc.observaciones,
        // Campos adicionales para bitácora
        nivelComplejidad: proc.nivelComplejidad || 'N/A',
        clasificacionASA: proc.clasificacionASA || 'N/A',
        tiempoAyuno: proc.tiempoAyuno ? `${proc.tiempoAyuno} horas` : 'N/A',
        tipoAnestesia: proc.tipoAnestesia || 'N/A',
        hallazgos: proc.hallazgos,
        complicaciones: proc.complicaciones,
        tecnicaUtilizada: proc.tecnicaUtilizada,
        resultados: proc.resultados,
        // Raw data for updates
        rawData: proc
      }));

      setCirugias(mappedCirugias);

      // Calcular estado de salas
      const mappedSalas = (quirofanosData.data?.quirofanos || []).map(sala => {
        // Buscar cirugía activa en esta sala
        const cirugiaActiva = mappedCirugias.find(c => c.rawData.quirofanoId === sala.id && c.estado === 'EnCurso');
        return {
          id: sala.id,
          nombre: sala.nombre,
          estado: cirugiaActiva ? 'Ocupado' : sala.estado === 'Activo' ? 'Disponible' : sala.estado,
          cirugia: cirugiaActiva ? cirugiaActiva.id : null,
          tiempoRestante: null,
          proximaCirugia: null // Calcular próxima
        };
      });

      setSalas(mappedSalas);

      // Calcular estadísticas dinámicas
      const hoyStr = format(new Date(), 'yyyy-MM-dd');
      const programadasHoy = mappedCirugias.filter(c =>
        c.fechaProgramada === hoyStr && c.estado === 'Programada'
      ).length;
      const enCurso = mappedCirugias.filter(c => c.estado === 'EnCurso').length;
      const completadasHoy = mappedCirugias.filter(c =>
        c.fechaProgramada === hoyStr && c.estado === 'Completada'
      ).length;

      // Usar estadísticas del backend para total del mes
      const totalMes = estadisticasData?.data?.total || 0;

      setEstadisticas({
        programadasHoy,
        enCurso,
        completadas: completadasHoy,
        totalMes
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const mapEstado = (backendEstado) => {
    const map = {
      'Programado': 'Programada',
      'EnProceso': 'EnCurso',
      'Completado': 'Completada',
      'Cancelado': 'Cancelada',
      'Diferido': 'Diferida'
    };
    return map[backendEstado] || backendEstado;
  };

  const handleCreateCirugia = async (formData) => {
    try {
      await procedimientoService.create(formData);
      fetchData();
      setShowNewCirugia(false);
    } catch (error) {
      console.error('Error creating cirugia:', error);
      alert('Error al crear la cirugía: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleIniciarCirugia = async (cirugiaId) => {
    try {
      await procedimientoService.iniciar(cirugiaId);
      fetchData();
      setShowBitacora(false);
    } catch (error) {
      console.error('Error iniciando cirugia:', error);
      alert('Error al iniciar la cirugía: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleCompletarCirugia = async (cirugiaId, data) => {
    try {
      await procedimientoService.completar(cirugiaId, data);
      fetchData();
      setShowBitacora(false);
    } catch (error) {
      console.error('Error completando cirugia:', error);
      alert('Error al completar la cirugía: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleCancelarCirugia = async (cirugiaId, motivo) => {
    try {
      await procedimientoService.cancelar(cirugiaId, motivo);
      fetchData();
      setShowBitacora(false);
    } catch (error) {
      console.error('Error cancelando cirugia:', error);
      alert('Error al cancelar la cirugía: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDiferirCirugia = async (cirugiaId, nuevaFecha, motivo) => {
    try {
      await procedimientoService.diferir(cirugiaId, nuevaFecha, motivo);
      fetchData();
      setShowBitacora(false);
    } catch (error) {
      console.error('Error difiriendo cirugia:', error);
      alert('Error al diferir la cirugía: ' + (error.message || 'Error desconocido'));
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Programada': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EnCurso': return 'bg-green-100 text-green-800 border-green-300';
      case 'Completada': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Cancelada': return 'bg-red-100 text-red-800 border-red-300';
      case 'Diferida': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Urgente': return 'bg-red-100 text-red-800 border-red-300';
      case 'Electiva': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSalaEstadoColor = (estado) => {
    switch (estado) {
      case 'Disponible': return 'bg-green-500';
      case 'Ocupado': return 'bg-red-500';
      case 'Limpieza': return 'bg-yellow-500';
      case 'Mantenimiento': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const cirugiasFiltradas = cirugias.filter(c => {
    const matchSearch = searchTerm === '' ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.procedimiento.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTab = 
      (activeTab === 'programadas' && c.estado === 'Programada') ||
      (activeTab === 'encurso' && c.estado === 'EnCurso') ||
      (activeTab === 'completadas' && c.estado === 'Completada') ||
      (activeTab === 'todas');
    
    return matchSearch && matchTab;
  });

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-lg">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quirófano y Cirugías</h1>
              <p className="text-sm text-gray-600">Gestión de Salas Quirúrgicas y Procedimientos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowGestionSalas(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Gestionar Salas
            </Button>
            <Dialog open={showNewCirugia} onOpenChange={setShowNewCirugia}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Programar Cirugía
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Programar Nueva Cirugía</DialogTitle>
              </DialogHeader>
              <FormularioNuevaCirugia onClose={() => setShowNewCirugia(false)} onSubmit={handleCreateCirugia} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estado de Salas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {salas.map((sala) => (
            <Card key={sala.id} className={`border-l-4 border-l-${getSalaEstadoColor(sala.estado)}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{sala.nombre}</h3>
                  <div className={`w-3 h-3 rounded-full ${getSalaEstadoColor(sala.estado)}`} />
                </div>
                <Badge className={`${
                  sala.estado === 'Disponible' ? 'bg-green-100 text-green-800' :
                  sala.estado === 'Ocupado' ? 'bg-red-100 text-red-800' :
                  sala.estado === 'Limpieza' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {sala.estado}
                </Badge>
                {sala.cirugia && (
                  <p className="text-xs text-gray-600 mt-2">Cirugía: {sala.cirugia}</p>
                )}
                {sala.tiempoRestante && (
                  <p className="text-xs text-gray-600 mt-1">Tiempo: {sala.tiempoRestante}</p>
                )}
                {sala.proximaCirugia && (
                  <p className="text-xs text-gray-600 mt-1">Próxima: {sala.proximaCirugia}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Programadas Hoy</p>
                  <p className="text-2xl font-bold text-blue-600">{estadisticas.programadasHoy}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Curso</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.enCurso}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completadas Hoy</p>
                  <p className="text-2xl font-bold text-purple-600">{estadisticas.completadas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Mes</p>
                  <p className="text-2xl font-bold text-indigo-600">{estadisticas.totalMes}</p>
                </div>
                <Scissors className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por ID, paciente o procedimiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Cirugías */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border shadow-sm">
            <TabsTrigger value="programadas" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              Programadas
            </TabsTrigger>
            <TabsTrigger value="encurso" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              En Curso
            </TabsTrigger>
            <TabsTrigger value="completadas" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              Completadas
            </TabsTrigger>
            <TabsTrigger value="todas" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
              Todas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Cirugía</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Procedimiento</TableHead>
                      <TableHead>Cirujano</TableHead>
                      <TableHead>Sala</TableHead>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cirugiasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                          No se encontraron cirugías
                        </TableCell>
                      </TableRow>
                    ) : (
                      cirugiasFiltradas.map((cirugia) => (
                        <TableRow key={cirugia.id}>
                          <TableCell className="font-medium">{cirugia.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{cirugia.paciente.nombre}</p>
                              <p className="text-xs text-gray-500">{cirugia.paciente.edad} años - {cirugia.paciente.genero}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{cirugia.procedimiento}</p>
                              <p className="text-xs text-gray-500">{cirugia.categoria}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{cirugia.cirujano}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cirugia.sala}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{cirugia.fechaProgramada}</p>
                              <p className="text-gray-500">{cirugia.horaInicio}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{cirugia.duracionEstimada}</p>
                              {cirugia.tiempoTranscurrido && (
                                <p className="text-green-600 font-medium">{cirugia.tiempoTranscurrido}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={getEstadoColor(cirugia.estado)}>
                                {cirugia.estado}
                              </Badge>
                              <Badge className={getPrioridadColor(cirugia.prioridad)}>
                                {cirugia.prioridad}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCirugia(cirugia);
                                  setShowBitacora(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Bitácora */}
        <Dialog open={showBitacora} onOpenChange={setShowBitacora}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bitácora Quirúrgica</DialogTitle>
            </DialogHeader>
            {selectedCirugia && (
              <BitacoraQuirurgica
                cirugia={selectedCirugia}
                onIniciar={handleIniciarCirugia}
                onCompletar={handleCompletarCirugia}
                onCancelar={handleCancelarCirugia}
                onDiferir={handleDiferirCirugia}
                onClose={() => setShowBitacora(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Gestión de Salas */}
        <Dialog open={showGestionSalas} onOpenChange={setShowGestionSalas}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestión de Salas Quirúrgicas</DialogTitle>
            </DialogHeader>
            <GestionSalasQuirurgicas
              salas={salas}
              onRefresh={fetchData}
              onClose={() => setShowGestionSalas(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

import { apiGet } from '@/services/api';

// Formulario de Nueva Cirugía
function FormularioNuevaCirugia({ onClose, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [enfermeros, setEnfermeros] = useState([]);
  const [salas, setSalas] = useState([]);

  // Estados controlados - Tab 1: Diagnóstico
  const [pacienteId, setPacienteId] = useState('');
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [codigoCIE10, setCodigoCIE10] = useState('');
  const [indicacion, setIndicacion] = useState('');
  const [codigoCUPS, setCodigoCUPS] = useState('');
  const [nombre, setNombre] = useState('');
  const [nivelComplejidad, setNivelComplejidad] = useState('Media');
  const [tipoCirugia, setTipoCirugia] = useState('');
  const [prioridad, setPrioridad] = useState('');

  // Estados controlados - Tab 2: Consentimiento
  const [riesgosPotenciales, setRiesgosPotenciales] = useState('');
  const [firmaPaciente, setFirmaPaciente] = useState('');
  const [fechaConsentimiento, setFechaConsentimiento] = useState('');

  // Estados controlados - Tab 3: Preoperatorio
  const [clasificacionASA, setClasificacionASA] = useState('');
  const [tiempoAyuno, setTiempoAyuno] = useState('');

  // Estados controlados - Tab 4: Programación
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [duracionEstimada, setDuracionEstimada] = useState('');
  const [quirofanoId, setQuirofanoId] = useState('');
  const [tipoAnestesia, setTipoAnestesia] = useState('');
  const [cirujanoId, setCirujanoId] = useState('');
  const [anestesiologoId, setAnestesiologoId] = useState('');
  const [ayudantes, setAyudantes] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [pacientesRes, personalRes, salasRes] = await Promise.all([
          apiGet('/pacientes?limit=200'),
          apiGet('/quirofanos/personal'),
          apiGet('/quirofanos')
        ]);

        console.log('Pacientes cargados:', pacientesRes);
        setPacientes(pacientesRes.data || []);

        // Personal quirúrgico del nuevo endpoint
        const personal = personalRes.data || {};
        console.log('Personal cargado:', personal);

        // Mapear médicos - usar usuarioId porque medicoResponsableId referencia Usuario
        const medicosData = (personal.medicos || []).map(m => ({
          id: m.usuarioId || m.id, // Usar usuarioId para medicoResponsableId
          doctorId: m.id,
          nombre: m.nombre,
          apellido: m.apellido,
          especialidades: m.especialidades || []
        }));
        setMedicos(medicosData);

        // Mapear enfermeros igual
        const enfermerosData = (personal.enfermeros || []).map(e => ({
          id: e.id,
          nombre: e.nombre,
          apellido: e.apellido
        }));
        setEnfermeros(enfermerosData);

        setSalas(salasRes.data?.quirofanos || []);
      } catch (error) {
        console.error('Error loading form data', error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Filtrar pacientes por búsqueda
  const filteredPacientes = pacientes.filter(p => {
    if (!pacienteSearch) return true;
    const searchLower = pacienteSearch.toLowerCase();
    return (
      (p.nombre && p.nombre.toLowerCase().includes(searchLower)) ||
      (p.apellido && p.apellido.toLowerCase().includes(searchLower)) ||
      (p.cedula && p.cedula.toLowerCase().includes(searchLower))
    );
  }).slice(0, 50); // Limitar a 50 para rendimiento

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validar campos requeridos - Tab 1: Diagnóstico
    if (!pacienteId) {
      alert('Por favor seleccione un paciente (Pestaña: Diagnóstico)');
      setLoading(false);
      return;
    }
    if (!nombre.trim()) {
      alert('Por favor ingrese el nombre del procedimiento (Pestaña: Diagnóstico)');
      setLoading(false);
      return;
    }
    if (!indicacion.trim()) {
      alert('Por favor ingrese el diagnóstico/indicación (Pestaña: Diagnóstico)');
      setLoading(false);
      return;
    }
    if (!codigoCIE10.trim()) {
      alert('Por favor ingrese el código CIE-10 (Pestaña: Diagnóstico)');
      setLoading(false);
      return;
    }
    if (!codigoCUPS.trim()) {
      alert('Por favor ingrese el código CUPS (Pestaña: Diagnóstico)');
      setLoading(false);
      return;
    }
    if (!tipoCirugia) {
      alert('Por favor seleccione la categoría de cirugía (Pestaña: Diagnóstico)');
      setLoading(false);
      return;
    }
    if (!prioridad) {
      alert('Por favor seleccione la prioridad (Pestaña: Diagnóstico)');
      setLoading(false);
      return;
    }

    // Validar campos requeridos - Tab 2: Consentimiento
    if (!riesgosPotenciales.trim()) {
      alert('Por favor ingrese los riesgos potenciales (Pestaña: Consentimiento)');
      setLoading(false);
      return;
    }
    if (!firmaPaciente.trim()) {
      alert('Por favor ingrese el nombre de quien firma el consentimiento (Pestaña: Consentimiento)');
      setLoading(false);
      return;
    }
    if (!fechaConsentimiento) {
      alert('Por favor ingrese la fecha de consentimiento (Pestaña: Consentimiento)');
      setLoading(false);
      return;
    }

    // Validar campos requeridos - Tab 3: Preoperatorio
    if (!clasificacionASA) {
      alert('Por favor seleccione la clasificación ASA (Pestaña: Preoperatorio)');
      setLoading(false);
      return;
    }
    if (!tiempoAyuno) {
      alert('Por favor ingrese el tiempo de ayuno (Pestaña: Preoperatorio)');
      setLoading(false);
      return;
    }

    // Validar campos requeridos - Tab 4: Programación
    if (!fecha) {
      alert('Por favor seleccione la fecha de la cirugía (Pestaña: Programación)');
      setLoading(false);
      return;
    }
    if (!hora) {
      alert('Por favor seleccione la hora de inicio (Pestaña: Programación)');
      setLoading(false);
      return;
    }
    if (!duracionEstimada) {
      alert('Por favor ingrese la duración estimada (Pestaña: Programación)');
      setLoading(false);
      return;
    }
    if (!quirofanoId) {
      alert('Por favor seleccione una sala quirúrgica (Pestaña: Programación)');
      setLoading(false);
      return;
    }
    if (!tipoAnestesia) {
      alert('Por favor seleccione el tipo de anestesia (Pestaña: Programación)');
      setLoading(false);
      return;
    }
    if (!cirujanoId) {
      alert('Por favor seleccione el cirujano principal (Pestaña: Programación)');
      setLoading(false);
      return;
    }
    if (!anestesiologoId) {
      alert('Por favor seleccione el anestesiólogo (Pestaña: Programación)');
      setLoading(false);
      return;
    }

    const data = {
      // 1. Diagnóstico y Planificación
      pacienteId,
      nombre: nombre.trim(),
      tipoCirugia,
      indicacion: indicacion.trim(),
      codigoCIE10: codigoCIE10.trim(),
      codigoCUPS: codigoCUPS.trim(),
      prioridad,
      nivelComplejidad,

      // 2. Consentimiento Informado
      riesgosPotenciales: riesgosPotenciales.trim(),
      fechaConsentimiento: fechaConsentimiento ? new Date(fechaConsentimiento).toISOString() : null,
      firmaPaciente: firmaPaciente.trim(),

      // 3. Preoperatorio
      clasificacionASA,
      tiempoAyuno: parseInt(tiempoAyuno || '0'),

      // 4. Programación
      fechaProgramada: new Date(`${fecha}T${hora}`).toISOString(),
      duracionEstimada: parseInt(duracionEstimada),
      quirofanoId,
      tipoAnestesia,

      // Equipo
      medicoResponsableId: cirujanoId,
      anestesiologoId,
      ayudantes: ayudantes ? ayudantes.split(',').map(s => s.trim()) : [],

      descripcion: nombre.trim(),
      tipo: 'Quirurgico',
      observaciones: observaciones.trim()
    };

    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="diagnostico" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diagnostico">1. Diagnóstico</TabsTrigger>
          <TabsTrigger value="consentimiento">2. Consentimiento</TabsTrigger>
          <TabsTrigger value="preoperatorio">3. Preoperatorio</TabsTrigger>
          <TabsTrigger value="programacion">4. Programación</TabsTrigger>
        </TabsList>

        {/* 1. SECCIÓN DE DIAGNÓSTICO Y PLANIFICACIÓN */}
        <TabsContent value="diagnostico" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Paciente *</Label>
              {loadingData ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500">
                  Cargando pacientes...
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Buscar por nombre o cédula..."
                    value={pacienteSearch}
                    onChange={(e) => setPacienteSearch(e.target.value)}
                    className="mb-1"
                  />
                  <Select value={pacienteId} onValueChange={setPacienteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione paciente..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-[9999]">
                      {filteredPacientes.length === 0 ? (
                        <div className="p-2 text-center text-gray-500 text-sm">
                          {pacientes.length === 0 ? 'No hay pacientes registrados' : 'No se encontraron resultados'}
                        </div>
                      ) : (
                        filteredPacientes.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre} {p.apellido} - {p.cedula || 'Sin cédula'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {pacientes.length > 50 && !pacienteSearch && (
                    <p className="text-xs text-gray-500">Mostrando 50 de {pacientes.length}. Use el buscador para filtrar.</p>
                  )}
                </div>
              )}
            </div>
            <div>
               <Label>Nivel de Complejidad *</Label>
               <Select value={nivelComplejidad} onValueChange={setNivelComplejidad}>
                 <SelectTrigger>
                   <SelectValue placeholder="Seleccione..." />
                 </SelectTrigger>
                 <SelectContent className="z-[9999]">
                   <SelectItem value="Baja">Baja</SelectItem>
                   <SelectItem value="Media">Media</SelectItem>
                   <SelectItem value="Alta">Alta</SelectItem>
                   <SelectItem value="MuyAlta">Muy Alta</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Código CIE-10 *</Label>
              <Input
                value={codigoCIE10}
                onChange={(e) => setCodigoCIE10(e.target.value)}
                placeholder="Ej: K35.8"
                className="mb-2"
              />
              <Label>Diagnóstico / Indicación *</Label>
              <Input
                value={indicacion}
                onChange={(e) => setIndicacion(e.target.value)}
                placeholder="Descripción del diagnóstico"
              />
            </div>
            <div>
              <Label>Código CUPS *</Label>
              <Input
                value={codigoCUPS}
                onChange={(e) => setCodigoCUPS(e.target.value)}
                placeholder="Ej: 47.0"
                className="mb-2"
              />
              <Label>Nombre del Procedimiento *</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Apendicectomía laparoscópica"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <Label>Categoría *</Label>
              <Select value={tipoCirugia} onValueChange={setTipoCirugia}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="General">Cirugía General</SelectItem>
                  <SelectItem value="Ortopedia">Ortopedia y Traumatología</SelectItem>
                  <SelectItem value="Ginecologia">Ginecología y Obstetricia</SelectItem>
                  <SelectItem value="Neurocirugia">Neurocirugía</SelectItem>
                  <SelectItem value="Cardiovascular">Cirugía Cardiovascular</SelectItem>
                  <SelectItem value="Urologia">Urología</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridad *</Label>
              <Select value={prioridad} onValueChange={setPrioridad}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="Electivo">Electivo (programado)</SelectItem>
                  <SelectItem value="Urgente">Urgente (≤24 horas)</SelectItem>
                  <SelectItem value="Emergencia">Emergencia (inmediato)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* 2. CONSENTIMIENTO INFORMADO */}
        <TabsContent value="consentimiento" className="space-y-4 mt-4">
          <div>
            <Label>Riesgos Potenciales Identificados *</Label>
            <Textarea
              value={riesgosPotenciales}
              onChange={(e) => setRiesgosPotenciales(e.target.value)}
              placeholder="Describa los riesgos explicados al paciente..."
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Firma Paciente/Acudiente (Nombre) *</Label>
              <Input
                value={firmaPaciente}
                onChange={(e) => setFirmaPaciente(e.target.value)}
                placeholder="Nombre completo quien firma"
              />
            </div>
            <div>
              <Label>Fecha Consentimiento *</Label>
              <Input
                type="date"
                value={fechaConsentimiento}
                onChange={(e) => setFechaConsentimiento(e.target.value)}
              />
            </div>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              La firma digital del médico responsable se registrará automáticamente al crear la solicitud.
            </p>
          </div>
        </TabsContent>

        {/* 3. PREOPERATORIO */}
        <TabsContent value="preoperatorio" className="space-y-4 mt-4">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <Label>Clasificación ASA *</Label>
               <Select value={clasificacionASA} onValueChange={setClasificacionASA}>
                 <SelectTrigger>
                   <SelectValue placeholder="Seleccione..." />
                 </SelectTrigger>
                 <SelectContent className="z-[9999]">
                   <SelectItem value="I">ASA I - Normal</SelectItem>
                   <SelectItem value="II">ASA II - Leve</SelectItem>
                   <SelectItem value="III">ASA III - Grave</SelectItem>
                   <SelectItem value="IV">ASA IV - Amenaza vital</SelectItem>
                   <SelectItem value="V">ASA V - Moribundo</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div>
               <Label>Tiempo de Ayuno (Horas) *</Label>
               <Input
                 type="number"
                 min="0"
                 value={tiempoAyuno}
                 onChange={(e) => setTiempoAyuno(e.target.value)}
               />
             </div>
           </div>
           
           <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
             <h4 className="font-medium text-blue-900 mb-2">Exámenes Requeridos (Checklist)</h4>
             <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
               <label className="flex items-center gap-2">
                 <input type="checkbox" className="rounded border-blue-300" /> Hemograma
               </label>
               <label className="flex items-center gap-2">
                 <input type="checkbox" className="rounded border-blue-300" /> Coagulación
               </label>
               <label className="flex items-center gap-2">
                 <input type="checkbox" className="rounded border-blue-300" /> Química Sanguínea
               </label>
               <label className="flex items-center gap-2">
                 <input type="checkbox" className="rounded border-blue-300" /> Valoración Anestésica
               </label>
             </div>
           </div>
        </TabsContent>

        {/* 4. PROGRAMACIÓN Y EQUIPO */}
        <TabsContent value="programacion" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div>
              <Label>Hora Inicio *</Label>
              <Input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
            <div>
              <Label>Duración (min) *</Label>
              <Input
                type="number"
                placeholder="90"
                value={duracionEstimada}
                onChange={(e) => setDuracionEstimada(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sala Quirúrgica *</Label>
              {loadingData ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded-md" />
              ) : (
                <Select value={quirofanoId} onValueChange={setQuirofanoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    {salas.length === 0 ? (
                      <div className="p-2 text-center text-gray-500 text-sm">No hay salas disponibles</div>
                    ) : (
                      salas.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre} - {s.tipo || 'General'}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
               <Label>Tipo de Anestesia *</Label>
               <Select value={tipoAnestesia} onValueChange={setTipoAnestesia}>
                 <SelectTrigger>
                   <SelectValue placeholder="Seleccione..." />
                 </SelectTrigger>
                 <SelectContent className="z-[9999]">
                   <SelectItem value="General">General</SelectItem>
                   <SelectItem value="Regional">Regional</SelectItem>
                   <SelectItem value="Local">Local</SelectItem>
                   <SelectItem value="Sedacion">Sedación</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipo Quirúrgico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cirujano Principal *</Label>
                  {loadingData ? (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md" />
                  ) : (
                    <Select value={cirujanoId} onValueChange={setCirujanoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione médico..." />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        {medicos.length === 0 ? (
                          <div className="p-2 text-center text-gray-500 text-sm">No hay médicos disponibles</div>
                        ) : (
                          medicos.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.nombre} {m.apellido}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>Ayudantes</Label>
                  <Input
                    value={ayudantes}
                    onChange={(e) => setAyudantes(e.target.value)}
                    placeholder="Nombres separados por coma"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Anestesiólogo *</Label>
                  {loadingData ? (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md" />
                  ) : (
                    <Select value={anestesiologoId} onValueChange={setAnestesiologoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione médico..." />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        {medicos.length === 0 ? (
                          <div className="p-2 text-center text-gray-500 text-sm">No hay médicos disponibles</div>
                        ) : (
                          medicos.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.nombre} {m.apellido}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>Enfermero Instrumentista</Label>
                   <Input placeholder="Opcional" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div>
            <Label>Observaciones Generales</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Consideraciones especiales..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-700" disabled={loading}>
              {loading ? 'Programando...' : 'Confirmar Programación'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}

// Componente de Bitácora Quirúrgica
function BitacoraQuirurgica({ cirugia, onIniciar, onCompletar, onCancelar, onDiferir, onClose }) {
  const [showCompletarForm, setShowCompletarForm] = useState(false);
  const [showCancelarForm, setShowCancelarForm] = useState(false);
  const [showDiferirForm, setShowDiferirForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleIniciar = async () => {
    if (!confirm('¿Está seguro de iniciar esta cirugía?')) return;
    setLoading(true);
    await onIniciar(cirugia.id);
    setLoading(false);
  };

  const handleCompletar = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      hallazgos: formData.get('hallazgos'),
      complicaciones: formData.get('complicaciones'),
      tecnicaUtilizada: formData.get('tecnicaUtilizada'),
      resultados: formData.get('resultados'),
      observaciones: formData.get('observaciones'),
    };
    setLoading(true);
    await onCompletar(cirugia.id, data);
    setLoading(false);
  };

  const handleCancelar = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const motivo = formData.get('motivo');
    if (!motivo) {
      alert('Debe indicar el motivo de cancelación');
      return;
    }
    setLoading(true);
    await onCancelar(cirugia.id, motivo);
    setLoading(false);
  };

  const handleDiferir = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nuevaFecha = formData.get('nuevaFecha');
    const motivo = formData.get('motivo');
    if (!nuevaFecha || !motivo) {
      alert('Debe indicar la nueva fecha y el motivo');
      return;
    }
    setLoading(true);
    await onDiferir(cirugia.id, nuevaFecha, motivo);
    setLoading(false);
  };

  const handleDescargarBitacora = () => {
    const url = procedimientoService.getBitacoraPdfUrl(cirugia.id);
    window.open(url, '_blank');
  };

  const handleGenerarProtocolo = () => {
    const url = procedimientoService.getProtocoloPdfUrl(cirugia.id);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Botones de Acción según estado */}
      {cirugia.estado === 'Programada' && (
        <div className="flex gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Button
            onClick={handleIniciar}
            className="bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            <Play className="w-4 h-4 mr-2" />
            Iniciar Cirugía
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDiferirForm(true)}
            disabled={loading}
          >
            <Pause className="w-4 h-4 mr-2" />
            Diferir
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => setShowCancelarForm(true)}
            disabled={loading}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      )}

      {cirugia.estado === 'EnCurso' && (
        <div className="flex gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
          <Button
            onClick={() => setShowCompletarForm(true)}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={loading}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Completar Cirugía
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => setShowCancelarForm(true)}
            disabled={loading}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      )}

      {/* Formulario de Completar */}
      {showCompletarForm && (
        <Card className="border-2 border-purple-300">
          <CardHeader>
            <CardTitle className="text-lg text-purple-700">Completar Cirugía - Informe Operatorio</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompletar} className="space-y-4">
              <div>
                <Label>Técnica Utilizada *</Label>
                <Textarea name="tecnicaUtilizada" rows={2} required />
              </div>
              <div>
                <Label>Hallazgos Intraoperatorios *</Label>
                <Textarea name="hallazgos" rows={3} required />
              </div>
              <div>
                <Label>Complicaciones (si hubo)</Label>
                <Textarea name="complicaciones" rows={2} />
              </div>
              <div>
                <Label>Resultados</Label>
                <Textarea name="resultados" rows={2} />
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea name="observaciones" rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCompletarForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-purple-600" disabled={loading}>
                  {loading ? 'Guardando...' : 'Confirmar Finalización'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulario de Cancelar */}
      {showCancelarForm && (
        <Card className="border-2 border-red-300">
          <CardHeader>
            <CardTitle className="text-lg text-red-700">Cancelar Cirugía</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCancelar} className="space-y-4">
              <div>
                <Label>Motivo de Cancelación *</Label>
                <Textarea name="motivo" rows={3} required placeholder="Indique el motivo de la cancelación..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCancelarForm(false)}>
                  Volver
                </Button>
                <Button type="submit" className="bg-red-600" disabled={loading}>
                  {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulario de Diferir */}
      {showDiferirForm && (
        <Card className="border-2 border-orange-300">
          <CardHeader>
            <CardTitle className="text-lg text-orange-700">Diferir Cirugía</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDiferir} className="space-y-4">
              <div>
                <Label>Nueva Fecha Programada *</Label>
                <Input name="nuevaFecha" type="datetime-local" required />
              </div>
              <div>
                <Label>Motivo del Aplazamiento *</Label>
                <Textarea name="motivo" rows={3} required placeholder="Indique el motivo del aplazamiento..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDiferirForm(false)}>
                  Volver
                </Button>
                <Button type="submit" className="bg-orange-600" disabled={loading}>
                  {loading ? 'Guardando...' : 'Confirmar Aplazamiento'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Información de la Cirugía</span>
            <Badge className={`text-lg px-4 py-2 ${
              cirugia.estado === 'EnCurso' ? 'bg-green-500 text-white' :
              cirugia.estado === 'Completada' ? 'bg-purple-500 text-white' :
              cirugia.estado === 'Cancelada' ? 'bg-red-500 text-white' :
              cirugia.estado === 'Diferida' ? 'bg-orange-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {cirugia.estado}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">ID Cirugía</p>
              <p className="font-medium">{cirugia.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sala</p>
              <Badge variant="outline">{cirugia.sala}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paciente</p>
              <p className="font-medium">{cirugia.paciente.nombre}</p>
              <p className="text-xs text-gray-500">CC: {cirugia.paciente.cedula} - {cirugia.paciente.edad} años</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prioridad</p>
              <Badge className={cirugia.prioridad === 'Urgente' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                {cirugia.prioridad}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Procedimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalles del Procedimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-sm text-gray-600">Procedimiento (CUPS)</p>
               <p className="font-medium">{cirugia.codigoCUPS} - {cirugia.procedimiento}</p>
             </div>
             <div>
               <p className="text-sm text-gray-600">Categoría</p>
               <p className="font-medium">{cirugia.categoria}</p>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-sm text-gray-600">Diagnóstico (CIE-10)</p>
               <p className="font-medium">{cirugia.codigoCIE10} - {cirugia.diagnostico}</p>
             </div>
             <div>
               <p className="text-sm text-gray-600">Nivel Complejidad</p>
               <Badge variant="outline">{cirugia.nivelComplejidad}</Badge>
             </div>
          </div>
          
          <div className="pt-2 border-t grid grid-cols-3 gap-4">
             <div>
                <p className="text-sm text-gray-600">Clasificación ASA</p>
                <Badge>{cirugia.clasificacionASA}</Badge>
             </div>
             <div>
                <p className="text-sm text-gray-600">Tiempo Ayuno</p>
                <p className="font-medium">{cirugia.tiempoAyuno}</p>
             </div>
             <div>
                <p className="text-sm text-gray-600">Tipo Anestesia</p>
                <p className="font-medium">{cirugia.tipoAnestesia}</p>
             </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 mb-1">Riesgos Potenciales</p>
            <p className="text-sm bg-red-50 p-2 rounded text-red-800">{cirugia.riesgos}</p>
          </div>
        </CardContent>
      </Card>

      {/* Equipo Quirúrgico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipo Quirúrgico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Cirujano Principal</p>
                <p className="font-medium">{cirugia.cirujano}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Ayudante</p>
                <p className="font-medium">{cirugia.ayudante}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Anestesiólogo</p>
                <p className="font-medium">{cirugia.anestesiologo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Enfermero Instrumentista</p>
                <p className="font-medium">{cirugia.enfermeroInstrumentista}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiempos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Control de Tiempos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Hora Programada</p>
              <p className="text-lg font-bold text-blue-700">{cirugia.horaInicio}</p>
            </div>
            {cirugia.horaInicioReal && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Timer className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Hora Inicio Real</p>
                <p className="text-lg font-bold text-green-700">{cirugia.horaInicioReal}</p>
              </div>
            )}
            {cirugia.horaFinReal && (
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Hora Fin</p>
                <p className="text-lg font-bold text-purple-700">{cirugia.horaFinReal}</p>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Duración Estimada</p>
              <p className="text-xl font-bold text-gray-900">{cirugia.duracionEstimada}</p>
            </div>
            {cirugia.duracionReal && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Duración Real</p>
                <p className="text-xl font-bold text-gray-900">{cirugia.duracionReal}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informe Operatorio (solo para completadas) */}
      {cirugia.estado === 'Completada' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informe Operatorio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cirugia.tecnicaUtilizada && (
              <div>
                <p className="text-sm font-medium text-gray-600">Técnica Utilizada</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{cirugia.tecnicaUtilizada}</p>
              </div>
            )}
            {cirugia.hallazgos && (
              <div>
                <p className="text-sm font-medium text-gray-600">Hallazgos Intraoperatorios</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{cirugia.hallazgos}</p>
              </div>
            )}
            {cirugia.complicaciones && (
              <div>
                <p className="text-sm font-medium text-gray-600">Complicaciones</p>
                <p className="text-sm text-gray-700 bg-red-50 p-2 rounded text-red-800">{cirugia.complicaciones}</p>
              </div>
            )}
            {cirugia.resultados && (
              <div>
                <p className="text-sm font-medium text-gray-600">Resultados</p>
                <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">{cirugia.resultados}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Observaciones */}
      {cirugia.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{cirugia.observaciones}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleDescargarBitacora}>
          <Download className="w-4 h-4 mr-2" />
          Descargar Bitácora
        </Button>
        {cirugia.estado === 'Completada' && (
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-700" onClick={handleGenerarProtocolo}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Generar Protocolo Quirúrgico
          </Button>
        )}
      </div>
    </div>
  );
}

// Componente de Gestión de Salas Quirúrgicas
function GestionSalasQuirurgicas({ salas, onRefresh, onClose }) {
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingSala, setEditingSala] = useState(null);

  // Estados para nuevo formulario
  const [newNombre, setNewNombre] = useState('');
  const [newTipo, setNewTipo] = useState('');
  const [newUbicacion, setNewUbicacion] = useState('');
  const [newCapacidad, setNewCapacidad] = useState('1');

  // Estados para editar
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editUbicacion, setEditUbicacion] = useState('');
  const [editCapacidad, setEditCapacidad] = useState('1');
  const [editEstado, setEditEstado] = useState('Activo');

  const tiposSala = [
    'General',
    'Cardiovascular',
    'Neurocirugía',
    'Ortopedia',
    'Oftalmología',
    'Urgencias',
    'Ambulatorio'
  ];

  const resetNewForm = () => {
    setNewNombre('');
    setNewTipo('');
    setNewUbicacion('');
    setNewCapacidad('1');
  };

  const handleOpenEdit = (sala) => {
    setEditingSala(sala);
    setEditNombre(sala.nombre || '');
    setEditTipo(sala.tipo || '');
    setEditUbicacion(sala.ubicacion || '');
    setEditCapacidad(String(sala.capacidad || 1));
    setEditEstado(sala.estado || 'Activo');
  };

  const handleCrearSala = async (e) => {
    e.preventDefault();

    if (!newNombre.trim() || !newTipo) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    setLoading(true);
    const data = {
      nombre: newNombre.trim(),
      tipo: newTipo,
      ubicacion: newUbicacion.trim(),
      capacidad: parseInt(newCapacidad) || 1,
    };

    try {
      await quirofanoService.create(data);
      onRefresh();
      setShowNewForm(false);
      resetNewForm();
    } catch (error) {
      alert('Error al crear sala: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditarSala = async (e) => {
    e.preventDefault();

    if (!editNombre.trim() || !editTipo) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    setLoading(true);
    const data = {
      nombre: editNombre.trim(),
      tipo: editTipo,
      ubicacion: editUbicacion.trim(),
      capacidad: parseInt(editCapacidad) || 1,
      estado: editEstado,
    };

    try {
      await quirofanoService.update(editingSala.id, data);
      onRefresh();
      setEditingSala(null);
    } catch (error) {
      alert('Error al actualizar sala: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarSala = async (salaId) => {
    if (!confirm('¿Está seguro de desactivar esta sala?')) return;
    setLoading(true);
    try {
      await quirofanoService.delete(salaId);
      onRefresh();
    } catch (error) {
      alert('Error al desactivar sala: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón Nueva Sala */}
      <div className="flex justify-end">
        <Button onClick={() => { setShowNewForm(true); resetNewForm(); }} disabled={showNewForm || editingSala}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Sala
        </Button>
      </div>

      {/* Formulario Nueva Sala */}
      {showNewForm && (
        <Card className="border-2 border-green-300">
          <CardHeader>
            <CardTitle className="text-lg text-green-700">Nueva Sala Quirúrgica</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCrearSala} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    placeholder="Ej: Quirófano 1"
                    required
                  />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={newTipo} onValueChange={setNewTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {tiposSala.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ubicación</Label>
                  <Input
                    value={newUbicacion}
                    onChange={(e) => setNewUbicacion(e.target.value)}
                    placeholder="Ej: Piso 2, Ala Norte"
                  />
                </div>
                <div>
                  <Label>Capacidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newCapacidad}
                    onChange={(e) => setNewCapacidad(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowNewForm(false); resetNewForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600" disabled={loading}>
                  {loading ? 'Guardando...' : 'Crear Sala'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulario Editar Sala */}
      {editingSala && (
        <Card className="border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">Editar Sala: {editingSala.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditarSala} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={editTipo} onValueChange={setEditTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {tiposSala.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Ubicación</Label>
                  <Input
                    value={editUbicacion}
                    onChange={(e) => setEditUbicacion(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Capacidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editCapacidad}
                    onChange={(e) => setEditCapacidad(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={editEstado} onValueChange={setEditEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingSala(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Salas */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No hay salas quirúrgicas registradas
                  </TableCell>
                </TableRow>
              ) : (
                salas.map((sala) => (
                  <TableRow key={sala.id}>
                    <TableCell className="font-medium">{sala.nombre}</TableCell>
                    <TableCell>{sala.tipo || 'N/A'}</TableCell>
                    <TableCell>{sala.ubicacion || 'N/A'}</TableCell>
                    <TableCell>{sala.capacidad || 1}</TableCell>
                    <TableCell>
                      <Badge className={
                        sala.estado === 'Disponible' || sala.estado === 'Activo' ? 'bg-green-100 text-green-800' :
                        sala.estado === 'Ocupado' ? 'bg-red-100 text-red-800' :
                        sala.estado === 'Mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {sala.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(sala)}
                          disabled={loading || showNewForm}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleEliminarSala(sala.id)}
                          disabled={loading || showNewForm || editingSala}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
