'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText, Stethoscope, TestTube, Activity, AlertTriangle,
  User, Calendar, Clock, CreditCard, MessageSquare, Search,
  CheckCircle, ChevronRight, DollarSign, Building2, BadgeCheck,
  Receipt, XCircle, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import useDisponibilidadRealtime from '@/hooks/useDisponibilidadRealtime';

// Roles que pueden crear citas de emergencia
const ROLES_EMERGENCIA = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

const citaSchema = z.object({
  tipoCita: z.enum(['Especialidad', 'Examen', 'Procedimiento']),
  servicioId: z.string().min(1, 'Debe seleccionar un servicio'),
  pacienteId: z.string().min(1, 'Debe seleccionar un paciente'),
  doctorId: z.string().optional(),
  fecha: z.string().min(1, 'La fecha es requerida'),
  hora: z.string().min(1, 'La hora es requerida'),
  duracionMinutos: z.coerce.number().min(1, 'La duración debe ser mayor a 0'),
  costo: z.coerce.number().min(0, 'El costo no puede ser negativo'),
  motivo: z.string().optional(),
  notas: z.string().optional(),
  metodoPago: z.enum(['Efectivo', 'Tarjeta', 'Transferencia', 'EPS']),
  estadoPago: z.enum(['Pendiente', 'Pagado', 'Parcial']),
  cubiertoPorEPS: z.boolean().optional(),
  esEmergencia: z.boolean().optional(),
  motivoEmergencia: z.string().optional(),
  // Campos para transferencia bancaria
  bancoDestino: z.string().optional(),
  otroBanco: z.string().optional(),
  numeroReferencia: z.string().optional(),
}).refine(data => {
  if (data.esEmergencia && !data.motivoEmergencia) {
    return false;
  }
  return true;
}, {
  message: 'El motivo de la emergencia es requerido',
  path: ['motivoEmergencia'],
});

// Componente de sección con título e icono
const FormSection = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
      <div className="p-2 rounded-lg bg-emerald-50">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="pl-1">{children}</div>
  </div>
);

// Componente de tarjeta de tipo de cita
const TipoCitaCard = ({ tipo, selected, onClick, icon: Icon, count, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`
      flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
      ${selected
        ? 'border-emerald-500 bg-emerald-50 shadow-md'
        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <Icon className={`w-8 h-8 mb-2 ${selected ? 'text-emerald-600' : 'text-gray-500'}`} />
    <span className={`font-medium ${selected ? 'text-emerald-700' : 'text-gray-700'}`}>
      {tipo}
    </span>
    <span className="text-xs text-gray-500 mt-1">{count} disponibles</span>
    {selected && (
      <CheckCircle className="w-5 h-5 text-emerald-600 mt-2" />
    )}
  </button>
);

// Componente de bloque de horario
const HorarioBloque = ({ bloque, selected, onClick, showDoctor, disabled }) => {
  const isOcupado = disabled || bloque.estado === 'ocupado';
  const isPasado = bloque.estado === 'pasado';
  const isBloqueado = bloque.estado === 'bloqueado';
  const isNoDisponible = isOcupado || isPasado || isBloqueado;

  return (
    <button
      type="button"
      onClick={isNoDisponible ? undefined : onClick}
      disabled={isNoDisponible}
      className={`
        relative flex items-center justify-between p-3 rounded-lg border-2 transition-all w-full
        ${isBloqueado
          ? 'border-orange-200 bg-orange-50 cursor-not-allowed opacity-70'
          : isNoDisponible
            ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
            : selected
              ? 'border-emerald-500 bg-emerald-50 shadow-sm'
              : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isBloqueado ? 'bg-orange-100' : isNoDisponible ? 'bg-gray-200' : selected ? 'bg-emerald-100' : 'bg-gray-100'}`}>
          <Clock className={`w-4 h-4 ${isBloqueado ? 'text-orange-500' : isNoDisponible ? 'text-gray-400' : selected ? 'text-emerald-600' : 'text-gray-500'}`} />
        </div>
        <div className="text-left">
          <div className={`font-semibold ${isBloqueado ? 'text-orange-600 line-through' : isNoDisponible ? 'text-gray-400 line-through' : selected ? 'text-emerald-700' : 'text-gray-900'}`}>
            {bloque.hora}
          </div>
          {showDoctor && (
            <div className="text-xs text-gray-500">Dr. {bloque.doctorNombre}</div>
          )}
          {isBloqueado && (
            <div className="text-xs text-orange-600 font-medium">
              Bloqueado{bloque.bloqueo?.motivo ? `: ${bloque.bloqueo.motivo}` : ''}
            </div>
          )}
          {isOcupado && !isPasado && !isBloqueado && (
            <div className="text-xs text-red-500 font-medium">Ocupado</div>
          )}
          {isPasado && (
            <div className="text-xs text-gray-400 font-medium">Hora pasada</div>
          )}
        </div>
      </div>
      {selected && !isNoDisponible && (
        <Badge className="bg-emerald-100 text-emerald-700 border-0">
          <CheckCircle className="w-3 h-3 mr-1" /> Seleccionado
        </Badge>
      )}
    </button>
  );
};

export default function FormularioCita({
  editingCita = null,
  initialData = {},
  onSuccess,
  onCancel
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Verificar si el usuario puede crear citas de emergencia
  const puedeCrearEmergencia = user?.rol && ROLES_EMERGENCIA.includes(user.rol);

  // Data sources
  const [especialidades, setEspecialidades] = useState([]);
  const [examenesProcedimientos, setExamenesProcedimientos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [bloquesDisponibles, setBloquesDisponibles] = useState([]);
  const [loadingBloques, setLoadingBloques] = useState(false);
  const [diaBloqueado, setDiaBloqueado] = useState(null); // Info si el día está completamente bloqueado

  const [searchPaciente, setSearchPaciente] = useState('');
  const [showPacientesList, setShowPacientesList] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  // Estado para comprobante de transferencia
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);

  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      tipoCita: '',
      servicioId: '',
      pacienteId: '',
      doctorId: '',
      fecha: '',
      hora: '',
      duracionMinutos: 30,
      costo: '',
      motivo: '',
      notas: '',
      metodoPago: 'Efectivo',
      estadoPago: 'Pendiente',
      cubiertoPorEPS: false,
      esEmergencia: false,
      motivoEmergencia: '',
      // Campos para transferencia
      bancoDestino: '',
      otroBanco: '',
      numeroReferencia: '',
      ...initialData
    }
  });

  // Watch fields
  const tipoCita = watch('tipoCita');
  const servicioId = watch('servicioId');
  const fecha = watch('fecha');
  const doctorId = watch('doctorId');
  const hora = watch('hora');
  const metodoPago = watch('metodoPago');
  const esEmergencia = watch('esEmergencia');
  const duracionMinutos = watch('duracionMinutos');
  const costo = watch('costo');
  const bancoDestino = watch('bancoDestino');

  // Referencia para la función de recarga
  const cargarBloquesRef = useRef(null);

  // Polling en tiempo real
  const { hasChanges, acknowledgeChanges } = useDisponibilidadRealtime({
    doctorId: doctorId || null,
    fecha,
    enabled: !esEmergencia && !!fecha && !!servicioId,
    onUpdate: () => {
      if (cargarBloquesRef.current) {
        toast({
          title: 'Disponibilidad actualizada',
          description: 'Los horarios disponibles han cambiado.',
        });
        cargarBloquesRef.current();
      }
    },
  });

  // Obtener fecha mínima (hoy)
  const getFechaMinima = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (editingCita) {
      setValue('tipoCita', editingCita.tipoCita || '');
      setValue('servicioId', editingCita.especialidadId || editingCita.examenProcedimientoId || '');
      setValue('pacienteId', editingCita.pacienteId || '');
      setValue('doctorId', editingCita.doctorId || '');
      setValue('fecha', editingCita.fecha ? editingCita.fecha.split('T')[0] : '');
      setValue('hora', editingCita.hora ? editingCita.hora.split('T')[1].substring(0, 5) : '');
      setValue('duracionMinutos', editingCita.duracionMinutos || 30);
      setValue('costo', editingCita.costo || '');
      setValue('motivo', editingCita.motivo || '');
      setValue('notas', editingCita.notas || '');

      setSearchPaciente(editingCita.paciente ? `${editingCita.paciente.nombre} ${editingCita.paciente.apellido}` : '');
      setPacienteSeleccionado(editingCita.paciente);

      if (editingCita.factura) {
        setValue('metodoPago', editingCita.factura.metodoPago || 'Efectivo');
        setValue('estadoPago', editingCita.factura.estado || 'Pendiente');
        setValue('cubiertoPorEPS', editingCita.factura.cubiertoPorEPS || false);
      }
    }
  }, [editingCita, setValue]);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [espRes, exaRes, pacRes, docRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/especialidades?limit=100`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/examenes-procedimientos?limit=100`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes?limit=100`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctores?limit=100`, { headers })
      ]);

      const espData = await espRes.json();
      const exaData = await exaRes.json();
      const pacData = await pacRes.json();
      const docData = await docRes.json();

      if (espData.success) setEspecialidades(espData.data);
      if (exaData.success) setExamenesProcedimientos(exaData.data);
      if (pacData.success) setPacientes(pacData.data);
      if (docData.success) setDoctores(docData.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const getServiciosDisponibles = () => {
    if (tipoCita === 'Especialidad') return especialidades;
    return examenesProcedimientos.filter(e => e.tipo === tipoCita);
  };

  const getContadorPorTipo = (tipo) => {
    if (tipo === 'Especialidad') return especialidades.length;
    return examenesProcedimientos.filter(e => e.tipo === tipo).length;
  };

  // Filtrar doctores según especialidad
  const getDoctoresFiltrados = () => {
    if (tipoCita === 'Especialidad' && servicioId) {
      const especialidadSeleccionada = especialidades.find(e => e.id === servicioId);
      if (especialidadSeleccionada) {
        return doctores.filter(doc => {
          return Array.isArray(doc.especialidades)
            ? doc.especialidades.includes(especialidadSeleccionada.titulo)
            : typeof doc.especialidades === 'string'
              ? doc.especialidades.includes(especialidadSeleccionada.titulo)
              : false;
        });
      }
    }
    return doctores;
  };

  // Cargar bloques disponibles
  const cargarBloquesDisponibles = useCallback(async () => {
    if (!fecha) {
      setBloquesDisponibles([]);
      setDiaBloqueado(null);
      return;
    }

    setLoadingBloques(true);
    setDiaBloqueado(null);
    try {
      const token = localStorage.getItem('token');

      if (doctorId) {
        const doctorSeleccionado = doctores.find(d => d.usuarioId === doctorId);

        if (doctorSeleccionado) {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/agenda/bloques/${doctorSeleccionado.id}?fecha=${fecha}`;

          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();

          // Verificar si el día está completamente bloqueado
          // La estructura es: data.data.bloques.bloqueado (el endpoint envuelve en { bloques: resultado })
          const bloquesData = data.data?.bloques;
          if (data.success && bloquesData && bloquesData.bloqueado) {
            setDiaBloqueado({
              tipo: bloquesData.bloqueoTipo,
              motivo: bloquesData.bloqueoMotivo || bloquesData.mensaje
            });
            setBloquesDisponibles([]);
            setLoadingBloques(false);
            return;
          }

          let bloquesArray = [];
          if (data.success && data.data) {
            if (data.data.bloques && Array.isArray(data.data.bloques.bloques)) {
              bloquesArray = data.data.bloques.bloques;
            } else if (Array.isArray(data.data.bloques)) {
              bloquesArray = data.data.bloques;
            }
          }

          // Incluir TODOS los bloques con su estado para mostrar ocupados como deshabilitados
          const todosLosBloques = bloquesArray.map(b => ({
            hora: b.hora,
            doctorId: doctorId,
            doctorNombre: doctorSeleccionado.nombre || 'Doctor',
            duracion: b.duracion,
            estado: b.estado, // disponible, ocupado, pasado, bloqueado
            bloqueo: b.bloqueo // info del bloqueo si existe
          }));

          setBloquesDisponibles(todosLosBloques);
        }
      } else {
        const doctoresFiltrados = getDoctoresFiltrados();

        if (doctoresFiltrados.length === 0) {
          setBloquesDisponibles([]);
          return;
        }

        const promesas = doctoresFiltrados.map(doc => {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/agenda/bloques/${doc.id}?fecha=${fecha}`;

          return fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).then(data => {
            let bloquesArray = [];
            if (data.success && data.data) {
              if (data.data.bloques && Array.isArray(data.data.bloques.bloques)) {
                bloquesArray = data.data.bloques.bloques;
              } else if (Array.isArray(data.data.bloques)) {
                bloquesArray = data.data.bloques;
              }
            }

            // Incluir TODOS los bloques con su estado
            return {
              doctorId: doc.usuarioId,
              doctorNombre: doc.nombre,
              bloques: bloquesArray
            };
          }).catch(() => {
            return { doctorId: doc.usuarioId, doctorNombre: doc.nombre, bloques: [] };
          });
        });

        const resultados = await Promise.all(promesas);
        const todosLosBloques = [];

        resultados.forEach(resultado => {
          resultado.bloques.forEach(bloque => {
            todosLosBloques.push({
              hora: bloque.hora,
              doctorId: resultado.doctorId,
              doctorNombre: resultado.doctorNombre,
              duracion: bloque.duracion,
              estado: bloque.estado, // disponible, ocupado, pasado, bloqueado
              bloqueo: bloque.bloqueo // info del bloqueo si existe
            });
          });
        });

        todosLosBloques.sort((a, b) => a.hora.localeCompare(b.hora));

        setBloquesDisponibles(todosLosBloques);
      }
    } catch (error) {
      console.error('Error al cargar bloques:', error);
      setBloquesDisponibles([]);
    } finally {
      setLoadingBloques(false);
    }
  }, [fecha, doctorId, doctores, servicioId, tipoCita, especialidades, examenesProcedimientos]);

  cargarBloquesRef.current = cargarBloquesDisponibles;

  useEffect(() => {
    if (fecha && servicioId && !esEmergencia) {
      cargarBloquesDisponibles();
    } else {
      setBloquesDisponibles([]);
    }
  }, [fecha, doctorId, servicioId, esEmergencia, cargarBloquesDisponibles]);

  useEffect(() => {
    if (tipoCita && !editingCita) {
      setValue('servicioId', '');
      setValue('duracionMinutos', 30);
      setValue('costo', '');
      setServicioSeleccionado(null);
    }
  }, [tipoCita, setValue]);

  useEffect(() => {
    if (!servicioId) return;

    if (tipoCita === 'Especialidad') {
      const especialidad = especialidades.find(e => e.id === servicioId);
      if (especialidad) {
        setServicioSeleccionado({
          nombre: especialidad.titulo,
          duracion: especialidad.duracionMinutos,
          costo: parseFloat(especialidad.costoCOP)
        });
        setValue('duracionMinutos', especialidad.duracionMinutos);
        setValue('costo', especialidad.costoCOP.toString());
      }
    } else {
      const examen = examenesProcedimientos.find(e => e.id === servicioId);
      if (examen) {
        setServicioSeleccionado({
          nombre: examen.nombre,
          duracion: examen.duracionMinutos || 30,
          costo: parseFloat(examen.costoBase)
        });
        setValue('duracionMinutos', examen.duracionMinutos || 30);
        setValue('costo', examen.costoBase.toString());
      }
    }
  }, [servicioId, tipoCita, especialidades, examenesProcedimientos, setValue]);

  const handlePacienteSelect = (paciente) => {
    setPacienteSeleccionado(paciente);
    setValue('pacienteId', paciente.id);
    setValue('cubiertoPorEPS', !!paciente.eps);
    setSearchPaciente(`${paciente.nombre} ${paciente.apellido}`);
    setShowPacientesList(false);
  };

  const filteredPacientes = pacientes.filter(p =>
    `${p.nombre} ${p.apellido} ${p.cedula}`.toLowerCase().includes(searchPaciente.toLowerCase())
  );

  const onSubmitForm = async (data) => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        paciente_id: data.pacienteId,
        doctor_id: data.doctorId || null,
        tipo_cita: data.tipoCita,
        fecha: data.fecha,
        hora: data.hora + ':00',
        duracion_minutos: parseInt(data.duracionMinutos),
        costo: parseFloat(data.costo),
        motivo: data.motivo || null,
        notas: data.notas || null,
        estado: 'Programada',
        metodo_pago: data.metodoPago,
        estado_pago: data.estadoPago,
        cubierto_por_eps: data.cubiertoPorEPS,
        es_emergencia: data.esEmergencia || false,
        motivo_emergencia: data.motivoEmergencia || null,
      };

      // Agregar datos de transferencia si el método de pago es Transferencia
      if (data.metodoPago === 'Transferencia') {
        payload.banco_destino = data.bancoDestino === 'otro' ? data.otroBanco : data.bancoDestino;
        payload.numero_referencia = data.numeroReferencia || null;
        // El comprobante se maneja por separado si es necesario
      }

      if (data.tipoCita === 'Especialidad') {
        payload.especialidad_id = data.servicioId;
      } else {
        payload.examen_procedimiento_id = data.servicioId;
      }

      const citaId = editingCita?.id || initialData?.citaId;
      const isEditing = !!editingCita || initialData?.isEdit;

      const url = isEditing && citaId ? `${process.env.NEXT_PUBLIC_API_URL}/citas/${citaId}` : `${process.env.NEXT_PUBLIC_API_URL}/citas`;
      const method = isEditing && citaId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      const isSuccess = result.success === true || result.status === 'success';

      if (isSuccess) {
        toast({
          title: 'Cita guardada',
          description: result.message || 'La cita se ha registrado exitosamente',
        });
        if (onSuccess) onSuccess(result.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message || 'No se pudo guardar la cita',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al guardar la cita',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* ===== SECCIÓN 1: TIPO DE CITA ===== */}
      <FormSection icon={Stethoscope} title="Tipo de Consulta">
        <div className="grid grid-cols-3 gap-3">
          <TipoCitaCard
            tipo="Especialidad"
            icon={Stethoscope}
            selected={tipoCita === 'Especialidad'}
            onClick={() => setValue('tipoCita', 'Especialidad')}
            count={getContadorPorTipo('Especialidad')}
            disabled={loading}
          />
          <TipoCitaCard
            tipo="Examen"
            icon={TestTube}
            selected={tipoCita === 'Examen'}
            onClick={() => setValue('tipoCita', 'Examen')}
            count={getContadorPorTipo('Examen')}
            disabled={loading}
          />
          <TipoCitaCard
            tipo="Procedimiento"
            icon={Activity}
            selected={tipoCita === 'Procedimiento'}
            onClick={() => setValue('tipoCita', 'Procedimiento')}
            count={getContadorPorTipo('Procedimiento')}
            disabled={loading}
          />
        </div>
        {errors.tipoCita && (
          <p className="text-red-500 text-sm mt-2">{errors.tipoCita.message}</p>
        )}

        {/* Selector de Servicio */}
        {tipoCita && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar {tipoCita}
            </label>
            <select
              {...register('servicioId')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              disabled={loading}
            >
              <option value="">-- Seleccione --</option>
              {getServiciosDisponibles().map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.titulo || servicio.nombre} - {formatCurrency(servicio.costoCOP || servicio.costoBase)}
                </option>
              ))}
            </select>
            {errors.servicioId && (
              <p className="text-red-500 text-sm mt-1">{errors.servicioId.message}</p>
            )}

            {/* Resumen del servicio seleccionado */}
            {servicioSeleccionado && (
              <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <BadgeCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-900">{servicioSeleccionado.nombre}</div>
                      <div className="text-sm text-emerald-700">
                        {servicioSeleccionado.duracion} minutos
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-700">
                      {formatCurrency(servicioSeleccionado.costo)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </FormSection>

      <Separator />

      {/* ===== SECCIÓN 2: PACIENTE ===== */}
      <FormSection icon={User} title="Paciente">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={searchPaciente}
              onChange={(e) => {
                setSearchPaciente(e.target.value);
                setShowPacientesList(true);
              }}
              onFocus={() => setShowPacientesList(true)}
              disabled={loading}
              className={`pl-10 py-3 rounded-xl ${errors.pacienteId ? "border-red-500" : ""}`}
            />
          </div>
          <input type="hidden" {...register('pacienteId')} />

          {showPacientesList && searchPaciente && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredPacientes.length > 0 ? (
                filteredPacientes.slice(0, 8).map((paciente) => (
                  <button
                    key={paciente.id}
                    type="button"
                    onClick={() => handlePacienteSelect(paciente)}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {paciente.nombre} {paciente.apellido}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>{paciente.cedula}</span>
                          {paciente.eps && (
                            <Badge variant="outline" className="text-xs">
                              {paciente.eps}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  No se encontraron pacientes
                </div>
              )}
            </div>
          )}
        </div>
        {errors.pacienteId && (
          <p className="text-red-500 text-sm mt-1">{errors.pacienteId.message}</p>
        )}

        {/* Tarjeta del paciente seleccionado */}
        {pacienteSeleccionado && (
          <Card className="mt-4 border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <div>CC: {pacienteSeleccionado.cedula}</div>
                    {pacienteSeleccionado.telefono && (
                      <div>Tel: {pacienteSeleccionado.telefono}</div>
                    )}
                  </div>
                  {pacienteSeleccionado.eps && (
                    <Badge className="mt-2 bg-blue-100 text-blue-700 border-0">
                      <Building2 className="w-3 h-3 mr-1" />
                      {pacienteSeleccionado.eps}
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPacienteSeleccionado(null);
                    setValue('pacienteId', '');
                    setSearchPaciente('');
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  Cambiar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </FormSection>

      <Separator />

      {/* ===== SECCIÓN 3: EMERGENCIA (solo para roles autorizados) ===== */}
      {puedeCrearEmergencia && (
        <>
          <div className="p-4 border-2 border-orange-200 bg-orange-50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <label htmlFor="esEmergencia" className="font-semibold text-orange-900">
                    Cita de Emergencia
                  </label>
                  <p className="text-xs text-orange-700">Ignora la disponibilidad del doctor</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="esEmergencia"
                  {...register('esEmergencia')}
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {esEmergencia && (
              <div>
                <label className="block text-sm font-medium text-orange-900 mb-1">
                  Motivo de la Emergencia *
                </label>
                <textarea
                  {...register('motivoEmergencia')}
                  rows={2}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  placeholder="Describa brevemente el motivo de la emergencia..."
                  disabled={loading}
                />
                {errors.motivoEmergencia && (
                  <p className="text-red-500 text-xs mt-1">{errors.motivoEmergencia.message}</p>
                )}
              </div>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* ===== SECCIÓN 4: DOCTOR Y HORARIO ===== */}
      <FormSection icon={Calendar} title="Fecha y Hora">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Doctor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor {esEmergencia ? '*' : '(opcional)'}
            </label>
            <select
              {...register('doctorId')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              disabled={loading || !servicioId}
              onChange={(e) => {
                setValue('doctorId', e.target.value);
                setValue('hora', '');
              }}
            >
              <option value="">Ver todos los doctores</option>
              {getDoctoresFiltrados().map((doctor) => (
                <option key={doctor.id} value={doctor.usuarioId}>
                  Dr. {doctor.nombre} {doctor.apellido}
                </option>
              ))}
            </select>
            {tipoCita === 'Especialidad' && servicioId && getDoctoresFiltrados().length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {getDoctoresFiltrados().length} doctores con esta especialidad
              </p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <Input
              type="date"
              {...register('fecha')}
              min={getFechaMinima()}
              disabled={loading || !servicioId}
              className="py-3 rounded-xl"
              onChange={(e) => {
                setValue('fecha', e.target.value);
                setValue('hora', '');
              }}
            />
            {errors.fecha && (
              <p className="text-red-500 text-sm mt-1">{errors.fecha.message}</p>
            )}
          </div>
        </div>

        {/* Bloques Horarios */}
        {fecha && servicioId && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {esEmergencia ? 'Hora de la Cita *' : 'Horarios Disponibles *'}
            </label>

            {esEmergencia ? (
              <div>
                <Input
                  type="time"
                  {...register('hora')}
                  className="w-full py-3 rounded-xl"
                  disabled={loading}
                />
                <p className="text-xs text-orange-600 mt-2">
                  Las citas de emergencia no requieren verificar disponibilidad.
                </p>
              </div>
            ) : (
              <>
                <input type="hidden" {...register('hora')} />

                {loadingBloques ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
                    <p className="text-sm">Buscando horarios disponibles...</p>
                  </div>
                ) : getDoctoresFiltrados().length === 0 ? (
                  <div className="text-center py-6 text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                    <p className="font-medium">No hay doctores disponibles</p>
                    <p className="text-sm mt-1">Selecciona otra especialidad</p>
                  </div>
                ) : bloquesDisponibles.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                    {bloquesDisponibles.map((bloque, idx) => (
                      <HorarioBloque
                        key={idx}
                        bloque={bloque}
                        selected={hora === bloque.hora && doctorId === bloque.doctorId}
                        onClick={() => {
                          setValue('hora', bloque.hora);
                          setValue('doctorId', bloque.doctorId);
                        }}
                        showDoctor={!doctorId}
                      />
                    ))}
                  </div>
                ) : diaBloqueado ? (
                  <div className="text-center py-6 text-orange-600 bg-orange-50 rounded-xl border border-orange-200">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <p className="font-medium">Día bloqueado</p>
                    <p className="text-sm mt-1">{diaBloqueado.motivo || 'El doctor no tiene disponibilidad este día'}</p>
                    <p className="text-xs mt-2 text-orange-500">Selecciona otra fecha</p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">No hay horarios disponibles</p>
                    <p className="text-sm mt-1">Selecciona otra fecha</p>
                  </div>
                )}

                {errors.hora && (
                  <p className="text-red-500 text-sm mt-2">{errors.hora.message}</p>
                )}

                {hora && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-800">
                      Cita programada para las <strong>{hora}</strong>
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </FormSection>

      <Separator />

      {/* ===== SECCIÓN 5: INFORMACIÓN DE PAGO ===== */}
      <FormSection icon={CreditCard} title="Información de Pago">
        <div className="grid grid-cols-2 gap-4">
          {/* Duración - Solo lectura, se establece automáticamente según el servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración (minutos)
            </label>
            <Input
              type="number"
              {...register('duracionMinutos')}
              min="1"
              readOnly
              disabled={loading}
              className="py-3 rounded-xl bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Establecido por el servicio seleccionado</p>
          </div>

          {/* Costo - Solo lectura, se establece automáticamente según el servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Costo (COP)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="number"
                {...register('costo')}
                min="0"
                readOnly
                disabled={loading}
                className="pl-10 py-3 rounded-xl bg-gray-50 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Establecido por el servicio seleccionado</p>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <select
              {...register('metodoPago')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              disabled={loading}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
              <option value="EPS">EPS</option>
            </select>
          </div>

          {/* Estado de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de Pago
            </label>
            <select
              {...register('estadoPago')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              disabled={loading}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
              <option value="Parcial">Pago Parcial</option>
            </select>
          </div>
        </div>

        {metodoPago === 'EPS' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Este servicio será facturado a la EPS del paciente
            </span>
          </div>
        )}

        {/* Campos adicionales para Transferencia */}
        {metodoPago === 'Transferencia' && (
          <div className="mt-4 space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Datos de la Transferencia
            </p>

            {/* Banco / Cuenta destino */}
            <div>
              <Label htmlFor="bancoDestino">Banco / Cuenta Destino *</Label>
              <Controller
                name="bancoDestino"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
            </div>

            {/* Campo para especificar otro banco */}
            {bancoDestino === 'otro' && (
              <div>
                <Label htmlFor="otroBanco">Especifique el banco/cuenta</Label>
                <Input
                  id="otroBanco"
                  {...register('otroBanco')}
                  placeholder="Ej: BBVA - Ahorros 111222333"
                  className="mt-1"
                />
              </div>
            )}

            {/* Número de Referencia */}
            <div>
              <Label htmlFor="numeroReferencia">Número de Referencia / Comprobante</Label>
              <Input
                id="numeroReferencia"
                {...register('numeroReferencia')}
                placeholder="Ej: 12345678"
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
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer bg-white hover:bg-amber-50 transition-colors">
                    <Upload className="h-8 w-8 text-amber-500 mb-2" />
                    <span className="text-sm text-amber-700">Click para subir comprobante</span>
                    <span className="text-xs text-gray-500 mt-1">JPG, PNG o PDF</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setComprobanteFile(file);
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setComprobantePreview(ev.target?.result);
                            reader.readAsDataURL(file);
                          } else {
                            setComprobantePreview(null);
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resumen del Costo */}
        {servicioSeleccionado && costo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total a pagar:</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(parseFloat(costo) || 0)}
              </span>
            </div>
          </div>
        )}
      </FormSection>

      <Separator />

      {/* ===== SECCIÓN 6: NOTAS ===== */}
      <FormSection icon={MessageSquare} title="Notas y Observaciones">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de la Consulta
            </label>
            <textarea
              {...register('motivo')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
              placeholder="Describa el motivo de la consulta..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Adicionales
            </label>
            <textarea
              {...register('notas')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
              placeholder="Observaciones internas..."
              disabled={loading}
            />
          </div>
        </div>
      </FormSection>

      {/* ===== BOTONES DE ACCIÓN ===== */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {editingCita ? 'Actualizar Cita' : 'Crear Cita'}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
