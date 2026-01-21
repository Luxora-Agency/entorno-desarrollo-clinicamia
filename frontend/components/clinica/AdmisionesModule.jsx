'use client';

import { useState, useEffect } from 'react';
import {
  Search, User, Calendar, Clock, Phone, Mail, AlertCircle,
  UserCheck, XCircle, CheckCircle, Stethoscope, UserPlus,
  FileText, Plus, Eye, ArrowRight, DollarSign, History, Loader2,
  CalendarClock, Upload, Image, CreditCard, Receipt, Power, LogOut,
  Banknote, TrendingUp, Hash, UserCog
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import FormularioCita from './FormularioCita';
import { formatDate, formatTime, formatDateLong , getTodayColombia, formatDateISO, formatDateOnly} from '@/services/formatters'

export default function AdmisionesModule({ user }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
  const [citasPaciente, setCitasPaciente] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [showAsignarDoctor, setShowAsignarDoctor] = useState(false);
  const [showNuevaCita, setShowNuevaCita] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [doctoresDisponibles, setDoctoresDisponibles] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [showEditarPago, setShowEditarPago] = useState(false);
  const [pagoEditando, setPagoEditando] = useState(null);
  const [showConfirmacionPago, setShowConfirmacionPago] = useState(false);
  const [pagoConfirmado, setPagoConfirmado] = useState(null);
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [initialDataCita, setInitialDataCita] = useState({});
  const [incluirCanceladas, setIncluirCanceladas] = useState(false);
  const [citasCanceladas, setCitasCanceladas] = useState([]);
  const [haBuscado, setHaBuscado] = useState(false);
  const [showConfirmNoAsistio, setShowConfirmNoAsistio] = useState(false);
  const [citaNoAsistio, setCitaNoAsistio] = useState(null);
  const [procesandoNoAsistio, setProcesandoNoAsistio] = useState(false);

  // Estados para Re-agendar
  const [showReagendar, setShowReagendar] = useState(false);
  const [citaReagendar, setCitaReagendar] = useState(null);
  const [reagendarData, setReagendarData] = useState({
    especialidadId: '',
    doctorId: '',
    fecha: '',
    hora: ''
  });
  const [doctoresReagendar, setDoctoresReagendar] = useState([]);
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [procesandoReagendar, setProcesandoReagendar] = useState(false);

  // Estados para Turno de Caja
  const [turnoActual, setTurnoActual] = useState(null);
  const [resumenTurno, setResumenTurno] = useState(null);
  const [showAbrirTurno, setShowAbrirTurno] = useState(false);
  const [showCerrarTurno, setShowCerrarTurno] = useState(false);
  const [montoInicial, setMontoInicial] = useState('');
  const [observacionesTurno, setObservacionesTurno] = useState('');
  const [procesandoTurno, setProcesandoTurno] = useState(false);
  const [montoEfectivoCierre, setMontoEfectivoCierre] = useState('');
  const [responsableCierre, setResponsableCierre] = useState('');
  const [nombreResponsableCierre, setNombreResponsableCierre] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [responsablesDisponibles, setResponsablesDisponibles] = useState([]);
  const [loadingTurno, setLoadingTurno] = useState(true);

  const buscarPaciente = async () => {
    if (!searchTerm.trim()) return;

    setBuscando(true);
    setHaBuscado(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // Buscar paciente
      const response = await fetch(`${apiUrl}/pacientes?search=${searchTerm}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const paciente = data.data[0];
        setPacienteEncontrado(paciente);

        // Cargar citas, facturas y canceladas EN PARALELO (optimización de rendimiento)
        const hoy = getTodayColombia();

        const [citasResponse, facturasResponse, canceladasResponse] = await Promise.all([
          // Citas de hoy y futuras
          fetch(`${apiUrl}/citas?pacienteId=${paciente.id}&fechaDesde=${hoy}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          // Facturas del paciente (UNA sola llamada)
          fetch(`${apiUrl}/facturas?pacienteId=${paciente.id}&limit=100`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          // Todas las citas para filtrar canceladas
          fetch(`${apiUrl}/citas?pacienteId=${paciente.id}&limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [citasData, facturasData, canceladasData] = await Promise.all([
          citasResponse.json(),
          facturasResponse.json(),
          canceladasResponse.json(),
        ]);

        // Procesar citas
        const citas = citasData.data || citasData.citas || [];
        const facturas = facturasData.data || [];

        // Mapear facturas a citas (en memoria, sin llamadas adicionales)
        const citasConFactura = citas.map(cita => {
          const factura = facturas.find(f =>
            f.items?.some(item => item.citaId === cita.id)
          );
          return { ...cita, factura };
        });

        setCitasPaciente(citasConFactura);

        // Filtrar citas canceladas/perdidas
        const todasCitas = canceladasData.data || canceladasData.citas || [];
        const canceladas = todasCitas.filter(c =>
          c.estado === 'NoAsistio' || c.estado === 'Cancelada'
        );
        setCitasCanceladas(canceladas);
      } else {
        setPacienteEncontrado(null);
        setCitasPaciente([]);
      }
    } catch (error) {
      console.error('Error buscando paciente:', error);
    }
    setBuscando(false);
  };

  const loadDoctoresYEspecialidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      console.log('[Admisiones] Cargando datos, token existe:', !!token, 'apiUrl:', apiUrl);

      if (!token) {
        console.error('[Admisiones] No hay token de autenticación');
        return;
      }

      // Cargar doctores
      const doctoresRes = await fetch(`${apiUrl}/doctores?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const doctoresData = await doctoresRes.json();
      console.log('[Admisiones] Doctores respuesta:', doctoresRes.status, doctoresData.data?.length || 0);
      setDoctoresDisponibles(doctoresData.data || []);

      // Cargar especialidades
      const especialidadesRes = await fetch(`${apiUrl}/especialidades?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const especialidadesData = await especialidadesRes.json();
      console.log('[Admisiones] Especialidades respuesta:', especialidadesRes.status, especialidadesData);

      if (especialidadesData.success) {
        setEspecialidades(especialidadesData.data || []);
      } else {
        console.error('[Admisiones] Error cargando especialidades:', especialidadesData.message);
      }
    } catch (error) {
      console.error('[Admisiones] Error cargando datos:', error);
    }
  };

  useEffect(() => {
    loadDoctoresYEspecialidades();
    cargarTurnoActual();
  }, []);

  // ==========================================
  // FUNCIONES DE TURNO DE CAJA
  // ==========================================

  // Cargar turno actual del usuario
  const cargarTurnoActual = async () => {
    setLoadingTurno(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/turno-caja/mi-turno`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTurnoActual(data.data?.turno || null);
        setResumenTurno(data.data?.resumen || null);
      }
    } catch (error) {
      console.error('[Turno] Error cargando turno:', error);
    } finally {
      setLoadingTurno(false);
    }
  };

  // Abrir turno de caja
  const abrirTurnoCaja = async () => {
    if (!montoInicial || parseFloat(montoInicial) < 0) {
      toast({
        title: "Error",
        description: "Ingrese un monto inicial válido",
        variant: "destructive",
      });
      return;
    }

    setProcesandoTurno(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/turno-caja/abrir`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          montoInicial: parseFloat(montoInicial),
          observaciones: observacionesTurno
        }),
      });

      const data = await response.json();

      if (response.ok && (data.success || data.status === 'success')) {
        setTurnoActual(data.data?.turno);
        setShowAbrirTurno(false);
        setMontoInicial('');
        setObservacionesTurno('');
        toast({
          title: "Turno Abierto",
          description: `Turno ${data.data?.turno?.numero} iniciado con base de $${parseFloat(montoInicial).toLocaleString()}`,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Error al abrir turno",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[Turno] Error abriendo turno:', error);
      toast({
        title: "Error",
        description: "Error al abrir turno",
        variant: "destructive",
      });
    } finally {
      setProcesandoTurno(false);
    }
  };

  // Preparar cierre de turno
  const prepararCierreTurno = async () => {
    if (!turnoActual) return;

    setProcesandoTurno(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Obtener resumen actualizado
      const resumenResponse = await fetch(`${apiUrl}/turno-caja/resumen/${turnoActual.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resumenResponse.ok) {
        const resumenData = await resumenResponse.json();
        setResumenTurno(resumenData.data);
      }

      // Obtener responsables disponibles
      const responsablesResponse = await fetch(`${apiUrl}/turno-caja/responsables`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (responsablesResponse.ok) {
        const responsablesData = await responsablesResponse.json();
        setResponsablesDisponibles(responsablesData.data?.responsables || []);
      }

      setShowCerrarTurno(true);
    } catch (error) {
      console.error('[Turno] Error preparando cierre:', error);
    } finally {
      setProcesandoTurno(false);
    }
  };

  // Cerrar turno de caja
  const cerrarTurnoCaja = async () => {
    if (!turnoActual) return;

    if (!montoEfectivoCierre || parseFloat(montoEfectivoCierre) < 0) {
      toast({
        title: "Error",
        description: "Ingrese el monto de efectivo contado",
        variant: "destructive",
      });
      return;
    }

    if (!responsableCierre && !nombreResponsableCierre) {
      toast({
        title: "Error",
        description: "Seleccione o ingrese el responsable que recibe el dinero",
        variant: "destructive",
      });
      return;
    }

    setProcesandoTurno(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/turno-caja/cerrar/${turnoActual.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          montoEfectivoCierre: parseFloat(montoEfectivoCierre),
          responsableCierreId: responsableCierre || null,
          nombreResponsable: nombreResponsableCierre || null,
          observaciones: observacionesCierre
        }),
      });

      const data = await response.json();

      if (response.ok && (data.success || data.status === 'success')) {
        toast({
          title: "Turno Cerrado",
          description: `Turno cerrado con total de ventas: $${data.data?.resumen?.totalVentas?.toLocaleString() || 0}`,
        });
        setShowCerrarTurno(false);
        setTurnoActual(null);
        setResumenTurno(null);
        setMontoEfectivoCierre('');
        setResponsableCierre('');
        setNombreResponsableCierre('');
        setObservacionesCierre('');
      } else {
        toast({
          title: "Error",
          description: data.message || "Error al cerrar turno",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[Turno] Error cerrando turno:', error);
      toast({
        title: "Error",
        description: "Error al cerrar turno",
        variant: "destructive",
      });
    } finally {
      setProcesandoTurno(false);
    }
  };

  // Registrar pago en el turno actual
  const registrarPagoEnTurno = async (pagoData) => {
    if (!turnoActual) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      await fetch(`${apiUrl}/turno-caja/registrar-pago/${turnoActual.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pagoData),
      });

      // Recargar resumen del turno
      cargarTurnoActual();
    } catch (error) {
      console.error('[Turno] Error registrando pago en turno:', error);
    }
  };

  const pasarAEspera = async (citaId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/citas/estado/${citaId}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'EnEspera' }),
      });
      
      if (response.ok) {
        // Recargar citas
        buscarPaciente();
        toast({
          title: "Éxito",
          description: "Paciente pasado a lista de espera",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al actualizar estado",
        variant: "destructive",
      });
    }
  };

  // Abrir modal de confirmación para No Asistió
  const abrirConfirmNoAsistio = (cita) => {
    setCitaNoAsistio(cita);
    setShowConfirmNoAsistio(true);
  };

  // Confirmar y ejecutar No Asistió
  const confirmarNoAsistio = async () => {
    if (!citaNoAsistio) return;

    setProcesandoNoAsistio(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/citas/estado/${citaNoAsistio.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'NoAsistio' }),
      });

      if (response.ok) {
        setShowConfirmNoAsistio(false);
        setCitaNoAsistio(null);
        buscarPaciente();
        toast({
          title: "Cita actualizada",
          description: "Cita marcada como No Asistió",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al actualizar estado",
        variant: "destructive",
      });
    } finally {
      setProcesandoNoAsistio(false);
    }
  };

  const cancelarNoAsistio = () => {
    setShowConfirmNoAsistio(false);
    setCitaNoAsistio(null);
  };

  // ============ FUNCIONES RE-AGENDAR ============

  // Abrir modal de re-agendar
  const abrirReagendar = (cita) => {
    console.log('[Re-agendar] Abriendo modal para cita:', cita);
    console.log('[Re-agendar] Especialidades disponibles:', especialidades.length, especialidades);
    setCitaReagendar(cita);
    setReagendarData({
      especialidadId: cita.especialidadId || cita.especialidad?.id || '',
      doctorId: '',
      fecha: '',
      hora: ''
    });
    setDoctoresReagendar([]);
    setSlotsDisponibles([]);
    setShowReagendar(true);

    // Si la cita tiene especialidad, cargar doctores automáticamente
    const espId = cita.especialidadId || cita.especialidad?.id;
    if (espId) {
      console.log('[Re-agendar] Cargando doctores para especialidad pre-seleccionada:', espId);
      cargarDoctoresPorEspecialidad(espId);
    }
  };

  // Cargar doctores por especialidad
  const cargarDoctoresPorEspecialidad = async (especialidadId) => {
    if (!especialidadId) {
      setDoctoresReagendar([]);
      return;
    }

    setLoadingDoctores(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      console.log('[Re-agendar] Cargando doctores para especialidad:', especialidadId);
      const response = await fetch(`${apiUrl}/doctores?especialidadId=${especialidadId}&activo=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log('[Re-agendar] Doctores recibidos:', data.data?.length || 0, data.data);
      setDoctoresReagendar(data.data || []);
    } catch (error) {
      console.error('Error cargando doctores:', error);
      toast({
        title: "Error",
        description: "Error al cargar doctores",
        variant: "destructive",
      });
    } finally {
      setLoadingDoctores(false);
    }
  };

  // Cargar slots disponibles
  const cargarSlotsDisponibles = async (doctorId, fecha) => {
    if (!doctorId || !fecha) {
      setSlotsDisponibles([]);
      return;
    }

    setLoadingSlots(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      console.log('[Re-agendar] Consultando disponibilidad:', { doctorId, fecha });
      const response = await fetch(`${apiUrl}/disponibilidad/${doctorId}?fecha=${fecha}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log('[Re-agendar] Respuesta disponibilidad:', data);

      if (!data.success) {
        console.warn('[Re-agendar] Error en respuesta:', data.message);
        setSlotsDisponibles([]);
        return;
      }

      const slots = data.data?.slots_disponibles || [];
      // Filtrar solo slots disponibles (estado === 'disponible' o disponible === true)
      const slotsLibres = slots.filter(s => s.estado === 'disponible' || s.disponible === true);
      console.log('[Re-agendar] Slots disponibles:', slotsLibres.length);
      setSlotsDisponibles(slotsLibres);
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
      toast({
        title: "Error",
        description: "Error al cargar horarios disponibles",
        variant: "destructive",
      });
      setSlotsDisponibles([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Manejar cambio de especialidad en reagendar
  const handleEspecialidadReagendar = (especialidadId) => {
    console.log('[Re-agendar] Especialidad seleccionada:', especialidadId);
    setReagendarData(prev => ({
      ...prev,
      especialidadId,
      doctorId: '',
      fecha: '',
      hora: ''
    }));
    setSlotsDisponibles([]);
    cargarDoctoresPorEspecialidad(especialidadId);
  };

  // Manejar cambio de doctor en reagendar
  const handleDoctorReagendar = (doctorId) => {
    console.log('[Re-agendar] Doctor seleccionado:', doctorId);
    setReagendarData(prev => ({
      ...prev,
      doctorId,
      fecha: '',
      hora: ''
    }));
    setSlotsDisponibles([]);
  };

  // Manejar cambio de fecha en reagendar
  const handleFechaReagendar = (fecha) => {
    console.log('[Re-agendar] Fecha seleccionada:', fecha, 'doctorId actual:', reagendarData.doctorId);
    setReagendarData(prev => {
      // Cargar slots usando el doctorId del estado actual (prev)
      if (prev.doctorId && fecha) {
        console.log('[Re-agendar] Cargando slots para doctor:', prev.doctorId, 'fecha:', fecha);
        cargarSlotsDisponibles(prev.doctorId, fecha);
      }
      return {
        ...prev,
        fecha,
        hora: ''
      };
    });
  };

  // Confirmar re-agendar
  const confirmarReagendar = async () => {
    if (!citaReagendar || !reagendarData.doctorId || !reagendarData.fecha || !reagendarData.hora) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }

    setProcesandoReagendar(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // 1. Marcar la cita actual como NoAsistio
      const responseNoAsistio = await fetch(`${apiUrl}/citas/estado/${citaReagendar.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'NoAsistio' }),
      });

      if (!responseNoAsistio.ok) {
        throw new Error('Error al marcar cita como No Asistió');
      }

      // 2. Crear nueva cita (backend espera snake_case)
      // Obtener el paciente_id correctamente (puede venir como pacienteId, paciente_id o paciente.id)
      const pacienteId = citaReagendar.pacienteId || citaReagendar.paciente_id || citaReagendar.paciente?.id;

      if (!pacienteId) {
        throw new Error('No se pudo obtener el ID del paciente');
      }

      // Parsear costo como número (IMPORTANTE: debe ser number, no string)
      const costoRaw = citaReagendar.costo;
      const costoNumerico = Number(costoRaw) || 0;
      console.log('[Re-agendar] Costo raw:', costoRaw, 'tipo:', typeof costoRaw, '-> numerico:', costoNumerico, 'tipo:', typeof costoNumerico);

      // Parsear duración como número
      const duracionRaw = citaReagendar.duracionMinutos || citaReagendar.duracion_minutos || 30;
      const duracionNumerica = Number(duracionRaw) || 30;

      const nuevaCitaData = {
        paciente_id: pacienteId,
        doctor_id: reagendarData.doctorId,
        especialidad_id: reagendarData.especialidadId || null,
        fecha: reagendarData.fecha,
        hora: reagendarData.hora,
        motivo: citaReagendar.motivo || 'Re-agendamiento',
        tipo_cita: citaReagendar.tipoCita || citaReagendar.tipo_cita || 'Especialidad',
        costo: costoNumerico,
        duracion_minutos: duracionNumerica,
        estado: 'Programada'
      };

      console.log('[Re-agendar] Cita original:', citaReagendar);
      console.log('[Re-agendar] Creando nueva cita:', nuevaCitaData);

      const responseNuevaCita = await fetch(`${apiUrl}/citas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevaCitaData),
      });

      const resultNuevaCita = await responseNuevaCita.json();
      console.log('[Re-agendar] Status HTTP:', responseNuevaCita.status);
      console.log('[Re-agendar] Respuesta crear cita:', resultNuevaCita);

      // Verificar éxito: puede ser success: true O status: "success"
      const isSuccess = resultNuevaCita.success === true || resultNuevaCita.status === 'success';

      if (!responseNuevaCita.ok || !isSuccess) {
        const errorMsg = resultNuevaCita.message || resultNuevaCita.error || 'Error al crear nueva cita';
        console.error('[Re-agendar] Error del servidor:', errorMsg);
        throw new Error(errorMsg);
      }

      // 3. Enviar notificación por email al paciente
      // El ID puede venir como data.cita.id o data.id según el formato de respuesta
      const nuevaCitaId = resultNuevaCita.data?.cita?.id || resultNuevaCita.data?.id;
      if (nuevaCitaId && citaReagendar.id) {
        console.log('[Re-agendar] Enviando notificación por email...');
        try {
          const responseEmail = await fetch(`${apiUrl}/citas/notificar-reagendamiento`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              citaAnteriorId: citaReagendar.id,
              citaNuevaId: nuevaCitaId
            }),
          });
          const resultEmail = await responseEmail.json();
          console.log('[Re-agendar] Resultado envío email:', resultEmail);

          if (resultEmail.data?.emailSent) {
            toast({
              title: "✅ Cita re-agendada",
              description: "La cita ha sido re-agendada y se envió notificación al paciente",
            });
          } else {
            toast({
              title: "Cita re-agendada",
              description: resultEmail.data?.reason || "La cita fue re-agendada (no se pudo enviar email)",
            });
          }
        } catch (emailError) {
          console.error('[Re-agendar] Error enviando email:', emailError);
          toast({
            title: "Cita re-agendada",
            description: "La cita fue re-agendada pero hubo un error al enviar notificación",
          });
        }
      } else {
        toast({
          title: "Cita re-agendada",
          description: "La cita ha sido re-agendada exitosamente",
        });
      }

      // Éxito
      setShowReagendar(false);
      setCitaReagendar(null);
      setReagendarData({ especialidadId: '', doctorId: '', fecha: '', hora: '' });
      buscarPaciente(); // Refrescar lista
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Error al re-agendar cita",
        variant: "destructive",
      });
    } finally {
      setProcesandoReagendar(false);
    }
  };

  // Cancelar re-agendar
  const cancelarReagendar = () => {
    setShowReagendar(false);
    setCitaReagendar(null);
    setReagendarData({ especialidadId: '', doctorId: '', fecha: '', hora: '' });
    setDoctoresReagendar([]);
    setSlotsDisponibles([]);
  };

  const actualizarFactura = async () => {
    if (!pagoEditando) return;

    setProcesandoPago(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      let comprobanteUrl = null;

      // Si es transferencia y hay un archivo, subirlo primero
      if (pagoEditando.nuevoMetodo === 'Transferencia' && comprobanteFile) {
        const formData = new FormData();
        formData.append('file', comprobanteFile);
        formData.append('tipo', 'comprobante_pago');
        formData.append('facturaId', pagoEditando.facturaId);

        const uploadResponse = await fetch(`${apiUrl}/uploads/facturas`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          comprobanteUrl = uploadData.data?.url || uploadData.url;
          console.log('[Pago] Comprobante subido:', comprobanteUrl);
        } else {
          console.warn('[Pago] Error al subir comprobante, continuando sin él');
        }
      }

      // Actualizar la factura
      const updateData = {
        estado: pagoEditando.nuevoEstado,
        metodoPago: pagoEditando.nuevoMetodo,
      };

      // Obtener banco destino (usar otroBanco si seleccionó "otro")
      const bancoFinal = pagoEditando.bancoDestino === 'otro'
        ? pagoEditando.otroBanco
        : pagoEditando.bancoDestino;

      // Agregar campos adicionales si es transferencia
      if (pagoEditando.nuevoMetodo === 'Transferencia') {
        updateData.numeroReferencia = pagoEditando.numeroReferencia || null;
        updateData.bancoDestino = bancoFinal || null;
        updateData.comprobanteUrl = comprobanteUrl;
      }

      const response = await fetch(`${apiUrl}/facturas/${pagoEditando.facturaId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Preparar datos para confirmación
        const pagoConfirmadoData = {
          facturaId: pagoEditando.facturaId,
          total: pagoEditando.total,
          estado: pagoEditando.nuevoEstado,
          metodoPago: pagoEditando.nuevoMetodo,
          numeroReferencia: pagoEditando.numeroReferencia,
          bancoDestino: bancoFinal,
          comprobanteUrl: comprobanteUrl || comprobantePreview,
          paciente: pagoEditando.paciente,
          especialidad: pagoEditando.especialidad,
          fecha: pagoEditando.fecha,
          hora: pagoEditando.hora,
          items: pagoEditando.items,
          fechaPago: new Date().toISOString(),
        };

        // Enviar notificación por email si el paciente tiene email
        if (pagoEditando.paciente?.email && pagoEditando.nuevoEstado === 'Pagada') {
          try {
            await fetch(`${apiUrl}/facturas/${pagoEditando.facturaId}/notificar-pago`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                metodoPago: pagoEditando.nuevoMetodo,
                numeroReferencia: pagoEditando.numeroReferencia,
                bancoDestino: bancoFinal,
              }),
            });
            console.log('[Pago] Notificación por email enviada');
          } catch (emailError) {
            console.error('[Pago] Error enviando email:', emailError);
          }
        }

        // Registrar pago en el turno actual SOLO si:
        // 1. Hay turno abierto
        // 2. El estado CAMBIÓ a Pagada (no estaba pagada antes)
        // Si ya estaba Pagada, es solo una edición de datos, no un nuevo pago
        const esNuevoPago = pagoEditando.estadoActual !== 'Pagada' && pagoEditando.nuevoEstado === 'Pagada';

        if (turnoActual && esNuevoPago) {
          try {
            await registrarPagoEnTurno({
              monto: parseFloat(pagoEditando.total),
              metodoPago: pagoEditando.nuevoMetodo,
              facturaId: pagoEditando.facturaId,
              referencia: pagoEditando.numeroReferencia,
              bancoDestino: bancoFinal,
              descripcion: `Pago cita ${pacienteEncontrado?.nombre || ''} ${pacienteEncontrado?.apellido || ''}`
            });
            // Actualizar resumen del turno
            cargarTurnoActual();
            console.log('[Pago] Nuevo pago registrado en turno');
          } catch (turnoError) {
            console.error('[Pago] Error registrando pago en turno:', turnoError);
          }
        } else if (pagoEditando.estadoActual === 'Pagada') {
          console.log('[Pago] Solo edición de datos, no se registra nuevo pago en turno');
        }

        // Mostrar confirmación
        setPagoConfirmado(pagoConfirmadoData);
        setShowEditarPago(false);
        setShowConfirmacionPago(true);

        // Recargar datos
        buscarPaciente();

        toast({
          title: esNuevoPago ? "Pago Registrado" : "Pago Editado",
          description: esNuevoPago
            ? "El pago ha sido registrado exitosamente"
            : "La información del pago ha sido actualizada",
        });
      } else {
        toast({
          title: "Error",
          description: "Error al actualizar factura",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al actualizar pago",
        variant: "destructive",
      });
    } finally {
      setProcesandoPago(false);
    }
  };

  // Manejar selección de archivo comprobante
  const handleComprobanteChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: "Archivo no válido",
          description: "Solo se permiten imágenes o PDF",
          variant: "destructive",
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no debe superar 5MB",
          variant: "destructive",
        });
        return;
      }

      setComprobanteFile(file);

      // Crear preview si es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setComprobantePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setComprobantePreview(null);
      }
    }
  };

  // Cerrar modal de confirmación
  const cerrarConfirmacionPago = () => {
    setShowConfirmacionPago(false);
    setPagoConfirmado(null);
    setPagoEditando(null);
    setComprobanteFile(null);
    setComprobantePreview(null);
  };

  const abrirEditarPago = (cita) => {
    // Validar que haya un turno abierto SOLO si la factura no está pagada
    // Si ya está pagada, es solo edición de datos y no requiere turno
    if (!turnoActual && cita.factura?.estado !== 'Pagada') {
      toast({
        title: "Turno No Abierto",
        description: "Debe abrir un turno de caja antes de registrar pagos",
        variant: "destructive",
      });
      return;
    }

    if (cita.factura) {
      setPagoEditando({
        citaId: cita.id,
        facturaId: cita.factura.id,
        estadoActual: cita.factura.estado,
        total: cita.factura.total,
        saldoPendiente: cita.factura.saldoPendiente,
        numeroReferencia: '',
        bancoDestino: '',
        otroBanco: '',
        nuevoMetodo: cita.factura.metodoPago || 'Efectivo',
        nuevoEstado: cita.factura.estado,
        paciente: pacienteEncontrado,
        especialidad: cita.especialidad?.titulo || cita.especialidad?.nombre || 'Consulta General',
        fecha: cita.fecha,
        hora: cita.hora,
        items: cita.factura.items || [],
      });
      setComprobanteFile(null);
      setComprobantePreview(null);
      setShowEditarPago(true);
    }
  };

  const abrirAsignarDoctor = (cita) => {
    setCitaSeleccionada(cita);
    setShowAsignarDoctor(true);
  };

  const confirmarAsignacionDoctor = async (doctorId) => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/citas/estado/${citaSeleccionada.id}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          doctorId: doctorId,
          estado: 'EnEspera' // Automáticamente pasa a espera
        }),
      });
      
      if (response.ok) {
        setShowAsignarDoctor(false);
        buscarPaciente();
        toast({
          title: "Éxito",
          description: "Doctor asignado y paciente en lista de espera",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al asignar doctor",
        variant: "destructive",
      });
    }
  };

  const limpiarBusqueda = () => {
    setSearchTerm('');
    setPacienteEncontrado(null);
    setCitasPaciente([]);
    setCitasCanceladas([]);
    setHaBuscado(false);
  };

  const abrirFormularioNuevaCita = () => {
    setInitialDataCita({
      pacienteId: pacienteEncontrado?.id || '',
      pacienteNombre: pacienteEncontrado ? `${pacienteEncontrado.nombre} ${pacienteEncontrado.apellido}` : ''
    });
    setShowNuevaCita(true);
  };

  const abrirFormularioEditarCita = (cita) => {
    setInitialDataCita({
      citaId: cita.id,
      pacienteId: cita.pacienteId,
      pacienteNombre: pacienteEncontrado ? `${pacienteEncontrado.nombre} ${pacienteEncontrado.apellido}` : '',
      pacienteCedula: pacienteEncontrado?.cedula || '',
      tipoCita: cita.tipoCita || 'Especialidad',
      examenProcedimientoId: cita.examenProcedimientoId,
      motivo: cita.motivo,
      costo: cita.costo,
      isEdit: true,
    });
    setShowNuevaCita(true);
  };

  const handleCitaSuccess = () => {
    setShowNuevaCita(false);
    setInitialDataCita({});
    buscarPaciente(); // Recargar citas del paciente
  };

  const handleCitaCancel = () => {
    setShowNuevaCita(false);
    setInitialDataCita({});
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      PorAgendar: 'bg-purple-100 text-purple-700 border-purple-300',
      Programada: 'bg-blue-100 text-blue-700 border-blue-300',
      EnEspera: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      Atendiendo: 'bg-green-100 text-green-700 border-green-300',
      Completada: 'bg-gray-100 text-gray-700 border-gray-300',
      NoAsistio: 'bg-red-100 text-red-700 border-red-300',
      Cancelada: 'bg-orange-100 text-orange-700 border-orange-300',
    };
    
    const labels = {
      PorAgendar: 'Por Agendar',
      Programada: 'Programada',
      EnEspera: 'En Espera',
      Atendiendo: 'Atendiendo',
      Completada: 'Completada',
      NoAsistio: 'No Asistió',
      Cancelada: 'Cancelada',
    };
    
    return (
      <Badge variant="outline" className={estilos[estado] || 'bg-gray-100'}>
        {labels[estado] || estado}
      </Badge>
    );
  };

  const esHoy = (fecha) => {
    const hoy = getTodayColombia();
    // Extraer solo la parte de fecha sin conversión de timezone (para campos @db.Date)
    const fechaCita = formatDateOnly(fecha, 'iso');
    return hoy === fechaCita;
  };

  const getTipoCitaBadge = (cita) => {
    if (cita.tipoCita === 'Especialidad' && cita.especialidad) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          Consulta: {cita.especialidad.titulo || cita.especialidad.nombre}
        </Badge>
      );
    }
    if (cita.tipoCita === 'Examen' && cita.examenProcedimiento) {
      return (
        <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-300">
          Examen: {cita.examenProcedimiento.nombre}
        </Badge>
      );
    }
    if (cita.tipoCita === 'Procedimiento' && cita.examenProcedimiento) {
      return (
        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300">
          Procedimiento: {cita.examenProcedimiento.nombre}
        </Badge>
      );
    }
    return <Badge variant="outline">{cita.tipoCita}</Badge>;
  };

  const getEstadoPagoBadge = (factura) => {
    if (!factura) return null;
    
    const estilos = {
      Pendiente: 'bg-red-100 text-red-700 border-red-300',
      Pagada: 'bg-green-100 text-green-700 border-green-300',
      Parcial: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    
    return (
      <Badge variant="outline" className={estilos[factura.estado] || 'bg-gray-100'}>
        {factura.estado}
      </Badge>
    );
  };

  // Separar citas de hoy y futuras
  const citasHoy = citasPaciente.filter(c => esHoy(c.fecha));
  const citasFuturas = citasPaciente.filter(c => !esHoy(c.fecha));

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="h-8 w-8 text-emerald-600" />
            Admisiones
          </h1>
          <p className="text-muted-foreground mt-1">
            Búsqueda de pacientes y gestión de llegadas
          </p>
        </div>
      </div>

      {/* Estado del Turno de Caja */}
      <Card className={`border-2 ${turnoActual ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
        <CardContent className="py-4">
          {loadingTurno ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Cargando estado del turno...</span>
            </div>
          ) : turnoActual ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Power className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-green-800">Turno Abierto</h3>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      {turnoActual.numero}
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700">
                    Iniciado: {new Date(turnoActual.fechaApertura).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                  </p>
                  <p className="text-sm text-green-600">
                    Base: ${parseFloat(turnoActual.montoInicial || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              {resumenTurno && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="bg-white/60 px-3 py-1 rounded-lg border border-green-200">
                    <span className="text-gray-600">Transacciones:</span>
                    <span className="ml-1 font-semibold text-green-700">{resumenTurno.cantidad || 0}</span>
                  </div>
                  <div className="bg-white/60 px-3 py-1 rounded-lg border border-green-200">
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-1 font-semibold text-green-700">${(resumenTurno.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
              <Button
                onClick={prepararCierreTurno}
                disabled={procesandoTurno}
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                {procesandoTurno ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Cerrar Turno
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <Power className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800">Sin Turno Activo</h3>
                  <p className="text-sm text-amber-700">
                    Debe abrir un turno de caja para registrar pagos
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowAbrirTurno(true)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Power className="h-4 w-4" />
                Abrir Turno
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buscador de Paciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ingrese cédula o nombre del paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarPaciente()}
                  className="text-lg"
                />
              </div>
              <Button
                onClick={buscarPaciente}
                disabled={!searchTerm || buscando}
                size="lg"
                className="gap-2 px-8"
              >
                {buscando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                {buscando ? 'Buscando...' : 'Buscar'}
              </Button>
              {pacienteEncontrado && (
                <Button 
                  onClick={limpiarBusqueda}
                  variant="outline"
                  size="lg"
                >
                  Limpiar
                </Button>
              )}
            </div>

            {/* Preloader mientras busca */}
            {buscando && (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-4" />
                <p className="text-lg font-medium text-slate-700">Buscando paciente...</p>
                <p className="text-sm text-slate-500 mt-1">Por favor espere mientras consultamos la información</p>
              </div>
            )}

            {/* Mensaje si no hay resultado y se buscó */}
            {!buscando && haBuscado && !pacienteEncontrado && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">Paciente no encontrado</p>
                  <p className="text-sm text-amber-700 mt-1">
                    No se encontró ningún paciente con esa cédula o nombre. 
                    ¿Desea registrar un nuevo paciente?
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-3 gap-2"
                    onClick={() => toast({
                      title: "Información",
                      description: "Redirigir a módulo de Pacientes para registrar nuevo paciente",
                    })}
                  >
                    <UserPlus className="h-4 w-4" />
                    Registrar Nuevo Paciente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información del Paciente Encontrado */}
      {pacienteEncontrado && (
        <>
          {/* Tarjeta de Info del Paciente */}
          <Card className="border-2 border-emerald-200 bg-emerald-50/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  <span>Paciente Encontrado</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.location.href = `/?module=pacientes&pacienteId=${pacienteEncontrado.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    Ver Perfil Completo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.location.href = `/?module=hce&pacienteId=${pacienteEncontrado.id}`}
                  >
                    <FileText className="h-4 w-4" />
                    Historia Clínica
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Nombre Completo</Label>
                  <p className="font-semibold text-lg text-gray-900">
                    {pacienteEncontrado.nombre} {pacienteEncontrado.apellido}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Cédula</Label>
                  <p className="font-medium text-gray-900">{pacienteEncontrado.cedula}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label className="text-xs text-gray-600">Teléfono</Label>
                    <p className="font-medium text-gray-900">{pacienteEncontrado.telefono || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label className="text-xs text-gray-600">Email</Label>
                    <p className="font-medium text-gray-900 text-sm">{pacienteEncontrado.email || 'No registrado'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Citas del Paciente */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Citas del Paciente
                </CardTitle>
                <Button
                  className="gap-2"
                  onClick={abrirFormularioNuevaCita}
                >
                  <Plus className="h-4 w-4" />
                  Agendar Nueva Cita
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {citasPaciente.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No tiene citas programadas</p>
                  <p className="text-gray-400 text-sm mb-4">Puede agendar una nueva cita para el paciente</p>
                  <Button
                    className="gap-2"
                    onClick={abrirFormularioNuevaCita}
                  >
                    <Plus className="h-4 w-4" />
                    Agendar Cita
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue="hoy" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="hoy" className="gap-2">
                      <Clock className="h-4 w-4" />
                      Para Hoy ({citasHoy.length})
                    </TabsTrigger>
                    <TabsTrigger value="futuras" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Futuras ({citasFuturas.length})
                    </TabsTrigger>
                    <TabsTrigger value="canceladas" className="gap-2">
                      <History className="h-4 w-4" />
                      Canceladas/Perdidas ({citasCanceladas.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Citas de Hoy */}
                  <TabsContent value="hoy" className="space-y-4 mt-4">
                    {citasHoy.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p>No tiene citas para hoy</p>
                      </div>
                    ) : (
                      citasHoy.map((cita) => (
                        <div 
                          key={cita.id}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            cita.estado === 'EnEspera' ? 'border-yellow-300 bg-yellow-50' :
                            cita.estado === 'Atendiendo' ? 'border-green-300 bg-green-50' :
                            'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              {/* Hora, Estado y Tipo de Cita */}
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-gray-500" />
                                  <span className="font-bold text-2xl">{formatTime(cita.hora)}</span>
                                </div>
                                {getEstadoBadge(cita.estado)}
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                  HOY
                                </Badge>
                                {getTipoCitaBadge(cita)}
                              </div>
                              
                              {/* Doctor */}
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                  {cita.doctor && cita.doctor.usuario ? 
                                    `Dr. ${cita.doctor.usuario.nombre} ${cita.doctor.usuario.apellido}` : 
                                    cita.doctorId ? 
                                    'Doctor asignado' :
                                    <span className="text-red-600">Sin doctor asignado</span>
                                  }
                                </span>
                              </div>

                              {/* Motivo */}
                              <div className="text-sm">
                                <span className="text-gray-500">Motivo:</span>{' '}
                                <span className="text-gray-900">{cita.motivo}</span>
                              </div>

                              {/* Información de Facturación */}
                              {cita.factura && (
                                <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">Facturación</span>
                                    {getEstadoPagoBadge(cita.factura)}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Total:</span>{' '}
                                      <span className="font-medium">${parseFloat(cita.factura.total).toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Saldo:</span>{' '}
                                      <span className="font-medium text-red-600">${parseFloat(cita.factura.saldoPendiente).toLocaleString()}</span>
                                    </div>
                                  </div>
                                  {/* No mostrar botón de pago si la cita es NoAsistio o Cancelada */}
                                  {cita.estado !== 'NoAsistio' && cita.estado !== 'Cancelada' && (
                                    <div className="mt-2">
                                      {/* Si ya está pagada, permitir editar sin necesidad de turno */}
                                      {cita.factura.estado === 'Pagada' ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => abrirEditarPago(cita)}
                                          className="w-full"
                                        >
                                          <FileText className="h-4 w-4 mr-2" />
                                          Editar Pago
                                        </Button>
                                      ) : (
                                        <>
                                          <Button
                                            size="sm"
                                            variant={turnoActual ? "outline" : "ghost"}
                                            onClick={() => abrirEditarPago(cita)}
                                            className={`w-full ${!turnoActual ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            disabled={loadingTurno}
                                          >
                                            <DollarSign className="h-4 w-4 mr-2" />
                                            Actualizar Pago
                                          </Button>
                                          {!turnoActual && !loadingTurno && (
                                            <p className="text-xs text-amber-600 mt-1 text-center">
                                              Abra turno para registrar pagos
                                            </p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {(cita.estado === 'NoAsistio' || cita.estado === 'Cancelada') && (
                                    <p className="text-xs text-red-500 mt-2 text-center">
                                      No se puede actualizar pago de cita {cita.estado === 'NoAsistio' ? 'no asistida' : 'cancelada'}
                                    </p>
                                  )}
                                </div>
                              )}

                              {cita.notas && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Notas:</span> {cita.notas}
                                </div>
                              )}
                            </div>

                            {/* Acciones */}
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              {/* Programar Cita PorAgendar */}
                              {cita.estado === 'PorAgendar' && (
                                <Button
                                  onClick={() => abrirFormularioEditarCita(cita)}
                                  className="gap-2 bg-purple-600 hover:bg-purple-700 w-full"
                                >
                                  <Calendar className="h-4 w-4" />
                                  Programar Cita
                                </Button>
                              )}

                              {/* Pasar a En Espera */}
                              {cita.estado === 'Programada' && cita.doctorId && (
                                <Button
                                  onClick={() => pasarAEspera(cita.id)}
                                  className="gap-2 bg-yellow-600 hover:bg-yellow-700 w-full"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Pasar a Espera
                                </Button>
                              )}

                              {/* Asignar Doctor */}
                              {!cita.doctorId && cita.estado === 'Programada' && (
                                <Button
                                  onClick={() => abrirAsignarDoctor(cita)}
                                  className="gap-2 bg-blue-600 hover:bg-blue-700 w-full"
                                >
                                  <Stethoscope className="h-4 w-4" />
                                  Asignar Doctor
                                </Button>
                              )}

                              {/* Estado En Espera */}
                              {cita.estado === 'EnEspera' && (
                                <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 bg-yellow-100 p-3 rounded border border-yellow-300">
                                  <CheckCircle className="h-4 w-4" />
                                  En lista de espera
                                </div>
                              )}

                              {/* Estado Atendiendo */}
                              {cita.estado === 'Atendiendo' && (
                                <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-100 p-3 rounded border border-green-300">
                                  <CheckCircle className="h-4 w-4" />
                                  En consulta ahora
                                </div>
                              )}

                              {/* Marcar No Asistió y Re-agendar */}
                              {(cita.estado === 'Programada' || cita.estado === 'EnEspera') && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => abrirConfirmNoAsistio(cita)}
                                    variant="outline"
                                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 flex-1"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    No Asistió
                                  </Button>
                                  <Button
                                    onClick={() => abrirReagendar(cita)}
                                    variant="outline"
                                    className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300 flex-1"
                                  >
                                    <CalendarClock className="h-4 w-4" />
                                    Re-agendar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Citas Futuras */}
                  <TabsContent value="futuras" className="space-y-4 mt-4">
                    {citasFuturas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p>No tiene citas futuras programadas</p>
                      </div>
                    ) : (
                      citasFuturas.map((cita) => (
                        <div 
                          key={cita.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="font-semibold">{formatDateOnly(cita.fecha)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="font-semibold">{formatTime(cita.hora)}</span>
                                </div>
                                {getEstadoBadge(cita.estado)}
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <Stethoscope className="h-4 w-4 text-gray-500" />
                                <span>
                                  {cita.doctor ? 
                                    `Dr. ${cita.doctor.nombre} ${cita.doctor.apellido}` : 
                                    <span className="text-red-600">Sin doctor asignado</span>
                                  }
                                </span>
                                {cita.especialidad && (
                                  <>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-600">{cita.especialidad.nombre}</span>
                                  </>
                                )}
                              </div>

                              <div className="text-sm text-gray-600">
                                {cita.motivo}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!cita.doctorId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirAsignarDoctor(cita)}
                                  className="gap-2"
                                >
                                  <Stethoscope className="h-4 w-4" />
                                  Asignar Doctor
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Citas Canceladas/Perdidas */}
                  <TabsContent value="canceladas" className="space-y-4 mt-4">
                    {citasCanceladas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <History className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p>No tiene citas canceladas o perdidas</p>
                      </div>
                    ) : (
                      citasCanceladas.map((cita) => (
                        <div
                          key={cita.id}
                          className={`border rounded-lg p-4 ${
                            cita.estado === 'NoAsistio' ? 'border-red-200 bg-red-50/50' :
                            'border-orange-200 bg-orange-50/50'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="font-semibold">{formatDateOnly(cita.fecha)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="font-semibold">{formatTime(cita.hora)}</span>
                                </div>
                                {getEstadoBadge(cita.estado)}
                              </div>

                              <div className="flex items-center gap-2 text-sm">
                                <Stethoscope className="h-4 w-4 text-gray-500" />
                                <span>
                                  {cita.doctor && cita.doctor.usuario ?
                                    `Dr. ${cita.doctor.usuario.nombre} ${cita.doctor.usuario.apellido}` :
                                    cita.doctor ?
                                    `Dr. ${cita.doctor.nombre || ''} ${cita.doctor.apellido || ''}` :
                                    <span className="text-gray-400">Sin doctor asignado</span>
                                  }
                                </span>
                                {cita.especialidad && (
                                  <>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-600">{cita.especialidad.nombre || cita.especialidad.titulo}</span>
                                  </>
                                )}
                              </div>

                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Motivo:</span> {cita.motivo || 'No especificado'}
                              </div>

                              {cita.notas && (
                                <div className="text-sm text-gray-500">
                                  <span className="font-medium">Notas:</span> {cita.notas}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setInitialDataCita({
                                    pacienteId: pacienteEncontrado?.id || '',
                                    pacienteNombre: pacienteEncontrado ? `${pacienteEncontrado.nombre} ${pacienteEncontrado.apellido}` : '',
                                    especialidadId: cita.especialidadId,
                                    motivo: cita.motivo,
                                  });
                                  setShowNuevaCita(true);
                                }}
                                className="gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Reagendar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog Asignar Doctor */}
      <Dialog open={showAsignarDoctor} onOpenChange={setShowAsignarDoctor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Doctor a la Cita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {citaSeleccionada && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Cita:</strong> {formatDateOnly(citaSeleccionada.fecha)} a las {formatTime(citaSeleccionada.hora)}
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Especialidad:</strong> {citaSeleccionada.especialidad?.nombre}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Seleccione un Doctor Disponible</Label>
              <Select onValueChange={(value) => confirmarAsignacionDoctor(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione doctor..." />
                </SelectTrigger>
                <SelectContent>
                  {doctoresDisponibles.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No hay doctores disponibles</div>
                  ) : (
                    doctoresDisponibles.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.usuario?.nombre} {doctor.usuario?.apellido}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-900">
                <strong>Nota:</strong> Al asignar el doctor, el paciente pasará automáticamente a la lista de espera.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nueva Cita */}
      <Dialog open={showNuevaCita} onOpenChange={setShowNuevaCita}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agendar Nueva Cita</DialogTitle>
          </DialogHeader>
          <FormularioCita
            initialData={initialDataCita}
            onSuccess={handleCitaSuccess}
            onCancel={handleCitaCancel}
            doctores={doctoresDisponibles}
            especialidades={especialidades}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Pago */}
      <Dialog open={showEditarPago} onOpenChange={setShowEditarPago}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Actualizar Información de Pago
            </DialogTitle>
          </DialogHeader>
          {pagoEditando && (
            <div className="space-y-4">
              {/* Info del paciente y cita */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {pagoEditando.paciente?.nombre} {pagoEditando.paciente?.apellido}
                  </span>
                </div>
                <p className="text-sm text-blue-800">
                  {pagoEditando.especialidad} - {formatDateOnly(pagoEditando.fecha)} {formatTime(pagoEditando.hora)}
                </p>
              </div>

              {/* Totales */}
              <div className="bg-gray-50 p-4 rounded border">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Total</Label>
                    <p className="font-semibold text-lg">${parseFloat(pagoEditando.total).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Saldo Pendiente</Label>
                    <p className="font-semibold text-lg text-red-600">${parseFloat(pagoEditando.saldoPendiente).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Estado de Pago */}
              <div>
                <Label>Estado de Pago *</Label>
                <Select
                  value={pagoEditando.nuevoEstado}
                  onValueChange={(value) => setPagoEditando({...pagoEditando, nuevoEstado: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Pagada">Pagado</SelectItem>
                    <SelectItem value="Parcial">Pago Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Método de Pago */}
              <div>
                <Label>Método de Pago</Label>
                <Select
                  value={pagoEditando.nuevoMetodo}
                  onValueChange={(value) => setPagoEditando({...pagoEditando, nuevoMetodo: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Efectivo
                      </div>
                    </SelectItem>
                    <SelectItem value="Tarjeta">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Tarjeta
                      </div>
                    </SelectItem>
                    <SelectItem value="Transferencia">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        Transferencia
                      </div>
                    </SelectItem>
                    <SelectItem value="EPS">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        EPS
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos adicionales para Transferencia */}
              {pagoEditando.nuevoMetodo === 'Transferencia' && (
                <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Datos de la Transferencia
                  </p>

                  {/* Banco / Cuenta destino */}
                  <div>
                    <Label htmlFor="bancoDestino">Banco / Cuenta Destino *</Label>
                    <Select
                      value={pagoEditando.bancoDestino || ''}
                      onValueChange={(value) => setPagoEditando({...pagoEditando, bancoDestino: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccione el banco o cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bancolombia - Ahorros 123456789">Bancolombia - Ahorros 123456789</SelectItem>
                        <SelectItem value="Davivienda - Corriente 987654321">Davivienda - Corriente 987654321</SelectItem>
                        <SelectItem value="Banco de Bogotá - Ahorros 555666777">Banco de Bogotá - Ahorros 555666777</SelectItem>
                        <SelectItem value="Nequi - 3001234567">Nequi - 3001234567</SelectItem>
                        <SelectItem value="Daviplata - 3009876543">Daviplata - 3009876543</SelectItem>
                        <SelectItem value="otro">Otro (especificar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campo para especificar otro banco */}
                  {pagoEditando.bancoDestino === 'otro' && (
                    <div>
                      <Label htmlFor="otroBanco">Especifique el banco/cuenta</Label>
                      <Input
                        id="otroBanco"
                        placeholder="Ej: BBVA - Ahorros 111222333"
                        value={pagoEditando.otroBanco || ''}
                        onChange={(e) => setPagoEditando({...pagoEditando, otroBanco: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {/* Número de Referencia */}
                  <div>
                    <Label htmlFor="numeroReferencia">Número de Referencia / Comprobante</Label>
                    <Input
                      id="numeroReferencia"
                      placeholder="Ej: 12345678"
                      value={pagoEditando.numeroReferencia || ''}
                      onChange={(e) => setPagoEditando({...pagoEditando, numeroReferencia: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  {/* Upload Comprobante */}
                  <div>
                    <Label>Comprobante de Pago (Imagen o PDF)</Label>
                    <div className="mt-2">
                      {comprobantePreview ? (
                        <div className="relative">
                          <img
                            src={comprobantePreview}
                            alt="Preview comprobante"
                            className="w-full h-40 object-contain rounded-lg border border-gray-200 bg-white"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setComprobanteFile(null);
                              setComprobantePreview(null);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : comprobanteFile ? (
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                          <FileText className="h-8 w-8 text-red-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{comprobanteFile.name}</p>
                            <p className="text-xs text-gray-500">{(comprobanteFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setComprobanteFile(null);
                              setComprobantePreview(null);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-blue-600">Click para subir</span> o arrastre aquí
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG o PDF (max. 5MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleComprobanteChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowEditarPago(false);
                    setPagoEditando(null);
                    setComprobanteFile(null);
                    setComprobantePreview(null);
                  }}
                  disabled={procesandoPago}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={actualizarFactura}
                  disabled={procesandoPago}
                >
                  {procesandoPago ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Guardar Pago
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación No Asistió */}
      <Dialog open={showConfirmNoAsistio} onOpenChange={setShowConfirmNoAsistio}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Confirmar Acción
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-900 font-medium mb-2">
                ¿Está seguro de marcar esta cita como "No Asistió"?
              </p>
              {citaNoAsistio && (
                <div className="text-sm text-red-800 space-y-1">
                  <p><strong>Fecha:</strong> {formatDateOnly(citaNoAsistio.fecha)}</p>
                  <p><strong>Hora:</strong> {formatTime(citaNoAsistio.hora)}</p>
                  {citaNoAsistio.doctor && (
                    <p><strong>Doctor:</strong> Dr. {citaNoAsistio.doctor.nombre} {citaNoAsistio.doctor.apellido}</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-900">
                <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer.
                La cita quedará registrada como inasistencia del paciente.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={cancelarNoAsistio}
                disabled={procesandoNoAsistio}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={confirmarNoAsistio}
                disabled={procesandoNoAsistio}
              >
                {procesandoNoAsistio ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {procesandoNoAsistio ? 'Procesando...' : 'Confirmar No Asistió'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Re-agendar Cita - UI/UX Mejorada */}
      <Dialog open={showReagendar} onOpenChange={setShowReagendar}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-white text-gray-900">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-white text-xl">
                <div className="bg-white/20 p-2 rounded-lg">
                  <CalendarClock className="h-6 w-6" />
                </div>
                Re-agendar Cita
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1">
                La cita actual será marcada como "No Asistió" y se creará una nueva
              </p>
            </DialogHeader>
          </div>

          {citaReagendar && (
            <div className="p-6 space-y-6">
              {/* Info del paciente y cita actual */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{pacienteEncontrado?.nombre} {pacienteEncontrado?.apellido}</p>
                      <p className="text-sm text-gray-500">Paciente</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Cita a cancelar</p>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{formatDateOnly(citaReagendar.fecha)}</span>
                    <Clock className="h-4 w-4 text-red-500 ml-2" />
                    <span className="font-medium">{formatTime(citaReagendar.hora)}</span>
                  </div>
                  {citaReagendar.especialidad && (
                    <p className="text-sm text-gray-600 mt-1">{citaReagendar.especialidad.nombre}</p>
                  )}
                </div>
              </div>

              {/* Pasos del formulario con indicadores visuales */}
              <div className="space-y-5">
                {/* Paso 1: Especialidad */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      reagendarData.especialidadId
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {reagendarData.especialidadId ? '✓' : '1'}
                    </div>
                    <Label className="text-base font-semibold text-gray-900">Seleccionar Especialidad</Label>
                  </div>
                  <div className="ml-11">
                    <Select
                      value={reagendarData.especialidadId || undefined}
                      onValueChange={(value) => {
                        console.log('[Re-agendar] Select onValueChange:', value);
                        handleEspecialidadReagendar(value);
                      }}
                    >
                      <SelectTrigger className="h-12 text-base border-2 bg-white text-gray-900 hover:border-blue-400 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="¿Qué especialidad necesita?" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 bg-white z-[100]">
                        {especialidades.length === 0 ? (
                          <div className="p-3 text-gray-500 text-center">Cargando especialidades...</div>
                        ) : (
                          especialidades.map((esp) => (
                            <SelectItem key={esp.id} value={esp.id} className="py-3 text-gray-900 cursor-pointer hover:bg-blue-50">
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-blue-500" />
                                {esp.titulo || esp.nombre}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Paso 2: Doctor */}
                <div className={`relative transition-opacity duration-300 ${!reagendarData.especialidadId ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      reagendarData.doctorId
                        ? 'bg-green-500 text-white'
                        : reagendarData.especialidadId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-500'
                    }`}>
                      {reagendarData.doctorId ? '✓' : '2'}
                    </div>
                    <Label className="text-base font-semibold text-gray-900">Seleccionar Doctor</Label>
                    {loadingDoctores && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                  </div>
                  <div className="ml-11">
                    {!reagendarData.especialidadId ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
                        Primero seleccione una especialidad
                      </div>
                    ) : loadingDoctores ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                        <p className="text-blue-700 font-medium">Cargando doctores disponibles...</p>
                      </div>
                    ) : (
                      <Select
                        value={reagendarData.doctorId || undefined}
                        onValueChange={(value) => {
                          console.log('[Re-agendar] Doctor seleccionado:', value);
                          handleDoctorReagendar(value);
                        }}
                      >
                        <SelectTrigger className="h-12 text-base border-2 bg-white text-gray-900 hover:border-blue-400 focus:border-blue-500 transition-colors">
                          <SelectValue placeholder="Seleccione un doctor" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 bg-white z-[100]">
                          {doctoresReagendar.length === 0 ? (
                            <div className="p-3 text-amber-600 text-center">
                              <AlertCircle className="h-5 w-5 mx-auto mb-1" />
                              No hay doctores disponibles
                            </div>
                          ) : (
                            doctoresReagendar.map((doc) => {
                              // Obtener todas las especialidades del doctor
                              const especialidadesTexto = doc.especialidades?.map(esp =>
                                typeof esp === 'string' ? esp : (esp.especialidad?.nombre || esp.titulo || esp.nombre)
                              ).filter(Boolean).join(', ');

                              return (
                                <SelectItem
                                  key={doc.usuarioId || doc.id}
                                  value={doc.usuarioId || doc.id}
                                  className="py-3 text-gray-900 cursor-pointer hover:bg-blue-50"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                      {(doc.nombre || doc.usuario?.nombre)?.[0]}{(doc.apellido || doc.usuario?.apellido)?.[0]}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        Dr. {doc.nombre || doc.usuario?.nombre} {doc.apellido || doc.usuario?.apellido}
                                      </span>
                                      {especialidadesTexto && (
                                        <span className="text-xs text-gray-500">
                                          {especialidadesTexto}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Paso 3: Fecha */}
                <div className={`relative transition-opacity duration-300 ${!reagendarData.doctorId ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      reagendarData.fecha
                        ? 'bg-green-500 text-white'
                        : reagendarData.doctorId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-500'
                    }`}>
                      {reagendarData.fecha ? '✓' : '3'}
                    </div>
                    <Label className="text-base font-semibold text-gray-900">Seleccionar Fecha</Label>
                  </div>
                  <div className="ml-11">
                    {/* Botones de fecha rápida */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[0, 1, 2, 3, 7].map((days) => {
                        const date = new Date();
                        date.setDate(date.getDate() + days);
                        const dateStr = formatDateISO(date);
                        const dayName = days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : days === 7 ? 'En 1 semana' : date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric',
      timeZone: 'America/Bogota'
    });
                        return (
                          <Button
                            key={days}
                            type="button"
                            variant={reagendarData.fecha === dateStr ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFechaReagendar(dateStr)}
                            disabled={!reagendarData.doctorId}
                            className={reagendarData.fecha === dateStr
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400'
                            }
                          >
                            {dayName}
                          </Button>
                        );
                      })}
                    </div>
                    <Input
                      type="date"
                      value={reagendarData.fecha}
                      onChange={(e) => handleFechaReagendar(e.target.value)}
                      min={getTodayColombia()}
                      disabled={!reagendarData.doctorId}
                      className="h-12 text-base border-2 bg-white text-gray-900 [&::-webkit-calendar-picker-indicator]:opacity-100"
                    />
                  </div>
                </div>

                {/* Paso 4: Horario */}
                <div className={`relative transition-opacity duration-300 ${!reagendarData.fecha ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      reagendarData.hora
                        ? 'bg-green-500 text-white'
                        : reagendarData.fecha
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-500'
                    }`}>
                      {reagendarData.hora ? '✓' : '4'}
                    </div>
                    <Label className="text-base font-semibold text-gray-900">Seleccionar Horario</Label>
                    {loadingSlots && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                  </div>
                  <div className="ml-11">
                    {!reagendarData.fecha ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
                        Primero seleccione una fecha
                      </div>
                    ) : loadingSlots ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                        <p className="text-blue-700 font-medium">Consultando disponibilidad...</p>
                      </div>
                    ) : slotsDisponibles.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                        <p className="text-amber-800 font-medium">Sin horarios disponibles</p>
                        <p className="text-sm text-amber-700 mt-1">Intente con otra fecha o doctor</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Mañana */}
                        {slotsDisponibles.filter(s => parseInt((s.hora_inicio || s.hora).split(':')[0]) < 12).length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                              <span className="text-yellow-500">☀️</span> Mañana
                            </p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {slotsDisponibles
                                .filter(s => parseInt((s.hora_inicio || s.hora).split(':')[0]) < 12)
                                .map((slot) => {
                                  const hora = slot.hora_inicio || slot.hora;
                                  return (
                                    <Button
                                      key={hora}
                                      type="button"
                                      variant={reagendarData.hora === hora ? "default" : "outline"}
                                      size="sm"
                                      className={`h-10 font-medium transition-all border-2 ${
                                        reagendarData.hora === hora
                                          ? 'bg-blue-600 text-white shadow-md scale-105 border-blue-600'
                                          : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 hover:scale-105'
                                      }`}
                                      onClick={() => setReagendarData(prev => ({ ...prev, hora }))}
                                    >
                                      {hora}
                                    </Button>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                        {/* Tarde */}
                        {slotsDisponibles.filter(s => parseInt((s.hora_inicio || s.hora).split(':')[0]) >= 12).length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                              <span className="text-orange-500">🌅</span> Tarde
                            </p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {slotsDisponibles
                                .filter(s => parseInt((s.hora_inicio || s.hora).split(':')[0]) >= 12)
                                .map((slot) => {
                                  const hora = slot.hora_inicio || slot.hora;
                                  return (
                                    <Button
                                      key={hora}
                                      type="button"
                                      variant={reagendarData.hora === hora ? "default" : "outline"}
                                      size="sm"
                                      className={`h-10 font-medium transition-all border-2 ${
                                        reagendarData.hora === hora
                                          ? 'bg-blue-600 text-white shadow-md scale-105 border-blue-600'
                                          : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 hover:scale-105'
                                      }`}
                                      onClick={() => setReagendarData(prev => ({ ...prev, hora }))}
                                    >
                                      {hora}
                                    </Button>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumen de nueva cita */}
              {reagendarData.hora && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-800">Nueva cita programada</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Fecha</p>
                      <p className="font-semibold text-gray-900">{formatDateOnly(reagendarData.fecha)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Hora</p>
                      <p className="font-semibold text-gray-900">{reagendarData.hora}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Doctor</p>
                      <p className="font-semibold text-gray-900">
                        {(() => {
                          const doc = doctoresReagendar.find(d => (d.usuarioId || d.id) === reagendarData.doctorId);
                          return doc ? `Dr. ${doc.nombre || doc.usuario?.nombre} ${doc.apellido || doc.usuario?.apellido}` : '';
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Especialidad</p>
                      <p className="font-semibold text-gray-900">
                        {especialidades.find(e => e.id === reagendarData.especialidadId)?.titulo || especialidades.find(e => e.id === reagendarData.especialidadId)?.nombre}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={cancelarReagendar}
                  disabled={procesandoReagendar}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 h-12 gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                  onClick={confirmarReagendar}
                  disabled={procesandoReagendar || !reagendarData.hora}
                >
                  {procesandoReagendar ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CalendarClock className="h-5 w-5" />
                  )}
                  {procesandoReagendar ? 'Procesando...' : 'Confirmar Re-agendar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación de Pago */}
      <Dialog open={showConfirmacionPago} onOpenChange={setShowConfirmacionPago}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Pago Registrado Exitosamente
            </DialogTitle>
          </DialogHeader>
          {pagoConfirmado && (
            <div className="space-y-4">
              {/* Resumen del pago */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Pagado</p>
                    <p className="text-3xl font-bold text-green-700">
                      ${parseFloat(pagoConfirmado.total).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-200">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Método de Pago</p>
                    <p className="font-semibold text-gray-800 flex items-center gap-1">
                      {pagoConfirmado.metodoPago === 'Efectivo' && <DollarSign className="h-4 w-4" />}
                      {pagoConfirmado.metodoPago === 'Tarjeta' && <CreditCard className="h-4 w-4" />}
                      {pagoConfirmado.metodoPago === 'Transferencia' && <Receipt className="h-4 w-4" />}
                      {pagoConfirmado.metodoPago === 'EPS' && <FileText className="h-4 w-4" />}
                      {pagoConfirmado.metodoPago}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Estado</p>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      {pagoConfirmado.estado}
                    </Badge>
                  </div>
                  {pagoConfirmado.bancoDestino && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase">Banco / Cuenta Destino</p>
                      <p className="font-semibold text-gray-800">{pagoConfirmado.bancoDestino}</p>
                    </div>
                  )}
                  {pagoConfirmado.numeroReferencia && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase">Número de Referencia</p>
                      <p className="font-mono font-semibold text-gray-800">{pagoConfirmado.numeroReferencia}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles del paciente y cita */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Detalles de la Consulta</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {pagoConfirmado.paciente?.nombre} {pagoConfirmado.paciente?.apellido}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-gray-500" />
                    <span>{pagoConfirmado.especialidad}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDateOnly(pagoConfirmado.fecha)} - {formatTime(pagoConfirmado.hora)}</span>
                  </div>
                </div>
              </div>

              {/* Comprobante si existe */}
              {pagoConfirmado.comprobanteUrl && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-800 flex items-center gap-2 mb-2">
                    <Image className="h-4 w-4" />
                    Comprobante Adjunto
                  </p>
                  {pagoConfirmado.comprobanteUrl.startsWith('data:image') ? (
                    <img
                      src={pagoConfirmado.comprobanteUrl}
                      alt="Comprobante de pago"
                      className="w-full h-32 object-contain rounded border border-amber-200 bg-white"
                    />
                  ) : (
                    <p className="text-sm text-amber-700">Archivo PDF adjunto</p>
                  )}
                </div>
              )}

              {/* Info de email enviado */}
              {pagoConfirmado.paciente?.email && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Notificación Enviada</p>
                    <p className="text-xs text-blue-600">
                      Se envió confirmación de pago a {pagoConfirmado.paciente.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Botón cerrar */}
              <div className="pt-2">
                <Button
                  className="w-full gap-2"
                  onClick={cerrarConfirmacionPago}
                >
                  <CheckCircle className="h-4 w-4" />
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Abrir Turno */}
      <Dialog open={showAbrirTurno} onOpenChange={setShowAbrirTurno}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Power className="h-6 w-6" />
              Abrir Turno de Caja
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Al abrir un turno, podrá registrar los pagos recibidos durante su jornada.
                Al cerrar el turno, se mostrará un resumen detallado de todos los pagos.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="montoInicial" className="text-sm font-medium">
                  Monto Inicial (Base de Caja) *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="montoInicial"
                    type="number"
                    min="0"
                    step="1000"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)}
                    placeholder="0"
                    className="pl-10 text-lg font-semibold"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Ingrese el efectivo con el que inicia el turno
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacionesTurno" className="text-sm font-medium">
                  Observaciones (Opcional)
                </Label>
                <Input
                  id="observacionesTurno"
                  value={observacionesTurno}
                  onChange={(e) => setObservacionesTurno(e.target.value)}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAbrirTurno(false);
                  setMontoInicial('');
                  setObservacionesTurno('');
                }}
                disabled={procesandoTurno}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                onClick={abrirTurnoCaja}
                disabled={procesandoTurno || !montoInicial}
              >
                {procesandoTurno ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
                {procesandoTurno ? 'Abriendo...' : 'Abrir Turno'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Cerrar Turno */}
      <Dialog open={showCerrarTurno} onOpenChange={setShowCerrarTurno}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="h-6 w-6" />
              Cerrar Turno de Caja
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Info del turno */}
            {turnoActual && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Número de Turno:</span>
                  <Badge variant="outline" className="font-mono">{turnoActual.numero}</Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Apertura:</span>
                  <span className="text-sm font-medium">{new Date(turnoActual.fechaApertura).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monto Inicial:</span>
                  <span className="text-sm font-semibold text-green-700">${parseFloat(turnoActual.montoInicial || 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Resumen de ventas por método de pago */}
            {resumenTurno && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Resumen de Ventas del Turno
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {/* Efectivo */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">Efectivo</span>
                    </div>
                    <p className="text-xl font-bold text-green-800">
                      ${(resumenTurno.totales?.efectivo || 0).toLocaleString()}
                    </p>
                  </div>

                  {/* Tarjeta */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700">Tarjeta</span>
                    </div>
                    <p className="text-xl font-bold text-blue-800">
                      ${(resumenTurno.totales?.tarjeta || 0).toLocaleString()}
                    </p>
                  </div>

                  {/* Transferencia */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-700">Transferencia</span>
                    </div>
                    <p className="text-xl font-bold text-purple-800">
                      ${(resumenTurno.totales?.transferencia || 0).toLocaleString()}
                    </p>
                  </div>

                  {/* EPS */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-700">EPS</span>
                    </div>
                    <p className="text-xl font-bold text-amber-800">
                      ${(resumenTurno.totales?.eps || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Total general */}
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-100">Total Ventas del Turno</p>
                      <p className="text-3xl font-bold">${(resumenTurno.totales?.total || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-emerald-100">Transacciones</p>
                      <p className="text-2xl font-bold">{resumenTurno.totales?.cantidad || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Efectivo esperado */}
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700">Efectivo Esperado en Caja</p>
                      <p className="text-xs text-yellow-600">(Base + Ventas en Efectivo)</p>
                    </div>
                    <p className="text-2xl font-bold text-yellow-800">
                      ${(resumenTurno.efectivoEsperado || (parseFloat(turnoActual?.montoInicial || 0) + (resumenTurno.totales?.efectivo || 0))).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de cierre */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-gray-800">Datos de Cierre</h4>

              <div className="space-y-2">
                <Label htmlFor="montoEfectivoCierre" className="text-sm font-medium">
                  Efectivo Contado (Real) *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="montoEfectivoCierre"
                    type="number"
                    min="0"
                    step="1000"
                    value={montoEfectivoCierre}
                    onChange={(e) => setMontoEfectivoCierre(e.target.value)}
                    placeholder="0"
                    className="pl-10 text-lg font-semibold"
                  />
                </div>
                {montoEfectivoCierre && resumenTurno && (
                  <div className={`text-sm font-medium ${
                    parseFloat(montoEfectivoCierre) === (resumenTurno.efectivoEsperado || 0)
                      ? 'text-green-600'
                      : parseFloat(montoEfectivoCierre) > (resumenTurno.efectivoEsperado || 0)
                        ? 'text-blue-600'
                        : 'text-red-600'
                  }`}>
                    {parseFloat(montoEfectivoCierre) === (resumenTurno.efectivoEsperado || (parseFloat(turnoActual?.montoInicial || 0) + (resumenTurno.totales?.efectivo || 0)))
                      ? '✓ Cuadra perfectamente'
                      : parseFloat(montoEfectivoCierre) > (resumenTurno.efectivoEsperado || (parseFloat(turnoActual?.montoInicial || 0) + (resumenTurno.totales?.efectivo || 0)))
                        ? `Sobrante: $${(parseFloat(montoEfectivoCierre) - (resumenTurno.efectivoEsperado || (parseFloat(turnoActual?.montoInicial || 0) + (resumenTurno.totales?.efectivo || 0)))).toLocaleString()}`
                        : `Faltante: $${((resumenTurno.efectivoEsperado || (parseFloat(turnoActual?.montoInicial || 0) + (resumenTurno.totales?.efectivo || 0))) - parseFloat(montoEfectivoCierre)).toLocaleString()}`
                    }
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Responsable que Recibe el Dinero *
                </Label>
                <Select value={responsableCierre} onValueChange={(val) => {
                  setResponsableCierre(val);
                  if (val !== 'otro') setNombreResponsableCierre('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar responsable..." />
                  </SelectTrigger>
                  <SelectContent>
                    {responsablesDisponibles.map((resp) => (
                      <SelectItem key={resp.id} value={resp.id}>
                        {resp.nombre} {resp.apellido} ({resp.rol})
                      </SelectItem>
                    ))}
                    <SelectItem value="otro">Otro (escribir nombre)</SelectItem>
                  </SelectContent>
                </Select>

                {responsableCierre === 'otro' && (
                  <Input
                    value={nombreResponsableCierre}
                    onChange={(e) => setNombreResponsableCierre(e.target.value)}
                    placeholder="Nombre del responsable..."
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacionesCierre" className="text-sm font-medium">
                  Observaciones de Cierre (Opcional)
                </Label>
                <Input
                  id="observacionesCierre"
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  placeholder="Notas adicionales del cierre..."
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCerrarTurno(false);
                  setMontoEfectivoCierre('');
                  setResponsableCierre('');
                  setNombreResponsableCierre('');
                  setObservacionesCierre('');
                }}
                disabled={procesandoTurno}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2 bg-red-600 hover:bg-red-700"
                onClick={cerrarTurnoCaja}
                disabled={procesandoTurno || !montoEfectivoCierre || (!responsableCierre && !nombreResponsableCierre)}
              >
                {procesandoTurno ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {procesandoTurno ? 'Cerrando...' : 'Confirmar Cierre'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
