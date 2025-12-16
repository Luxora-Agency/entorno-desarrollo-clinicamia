'use client';

import { useState, useEffect } from 'react';
import { FileText, Stethoscope, TestTube, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function FormularioCita({ 
  editingCita = null, 
  initialData = {}, 
  onSuccess, 
  onCancel 
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Data sources
  const [especialidades, setEspecialidades] = useState([]);
  const [examenesProcedimientos, setExamenesProcedimientos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [bloquesDisponibles, setBloquesDisponibles] = useState([]);
  const [loadingBloques, setLoadingBloques] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    tipoCita: '',
    servicioId: '',
    pacienteId: '',
    pacienteNombre: '',
    doctorId: '',
    fecha: '',
    hora: '',
    duracionMinutos: 30,
    costo: '',
    motivo: '',
    notas: '',
    // Campos de facturación
    metodoPago: 'Efectivo',
    estadoPago: 'Pendiente',
    cubiertoPorEPS: false,
    ...initialData // Pre-fill with initial data
  });
  
  const [searchPaciente, setSearchPaciente] = useState('');
  const [showPacientesList, setShowPacientesList] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  
  // Obtener fecha mínima (hoy)
  const getFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (editingCita) {
      setFormData({
        tipoCita: editingCita.tipoCita || '',
        servicioId: editingCita.especialidadId || editingCita.examenProcedimientoId || '',
        pacienteId: editingCita.pacienteId || '',
        pacienteNombre: editingCita.paciente ? `${editingCita.paciente.nombre} ${editingCita.paciente.apellido}` : '',
        doctorId: editingCita.doctorId || '',
        fecha: editingCita.fecha ? editingCita.fecha.split('T')[0] : '',
        hora: editingCita.hora ? editingCita.hora.split('T')[1].substring(0, 5) : '',
        duracionMinutos: editingCita.duracionMinutos || 30,
        costo: editingCita.costo || '',
        motivo: editingCita.motivo || '',
        notas: editingCita.notas || ''
      });
      setSearchPaciente(editingCita.paciente ? `${editingCita.paciente.nombre} ${editingCita.paciente.apellido}` : '');
    }
  }, [editingCita]);

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

  const getIconoTipo = (tipo) => {
    const iconos = {
      Especialidad: <Stethoscope className="w-4 h-4 text-blue-600" />,
      Examen: <TestTube className="w-4 h-4 text-purple-600" />,
      Procedimiento: <Activity className="w-4 h-4 text-green-600" />
    };
    return iconos[tipo] || null;
  };

  const getServiciosDisponibles = () => {
    if (formData.tipoCita === 'Especialidad') return especialidades;
    return examenesProcedimientos.filter(e => e.tipo === formData.tipoCita);
  };

  const getContadorDisponibles = () => {
    return getServiciosDisponibles().length;
  };
  
  // Filtrar doctores según especialidad seleccionada
  const getDoctoresFiltrados = () => {
    console.log('🔍 getDoctoresFiltrados called');
    console.log('  - tipoCita:', formData.tipoCita);
    console.log('  - servicioId:', formData.servicioId);
    console.log('  - Total doctores:', doctores.length);
    
    if (formData.tipoCita === 'Especialidad' && formData.servicioId) {
      const especialidadSeleccionada = especialidades.find(e => e.id === formData.servicioId);
      console.log('  - Especialidad seleccionada:', especialidadSeleccionada?.titulo);
      
      if (especialidadSeleccionada) {
        // Filtrar doctores que tengan esta especialidad
        const doctoresFiltrados = doctores.filter(doc => {
          console.log('    - Doctor:', doc.nombre, 'Especialidades:', doc.especialidades);
          // Verificar si especialidades es string o array
          if (typeof doc.especialidades === 'string') {
            return doc.especialidades.includes(especialidadSeleccionada.titulo);
          } else if (Array.isArray(doc.especialidades)) {
            return doc.especialidades.includes(especialidadSeleccionada.titulo);
          }
          return false;
        });
        console.log('  - Doctores filtrados:', doctoresFiltrados.length);
        return doctoresFiltrados;
      }
    }
    // Para exámenes y procedimientos, mostrar todos los doctores
    console.log('  - Retornando todos los doctores:', doctores.length);
    return doctores;
  };
  
  // Cargar bloques disponibles cuando cambia fecha o doctor
  const cargarBloquesDisponibles = async () => {
    if (!formData.fecha) {
      setBloquesDisponibles([]);
      return;
    }
    
    setLoadingBloques(true);
    try {
      const token = localStorage.getItem('token');
      
      if (formData.doctorId) {
        // Si hay doctor seleccionado, cargar sus bloques
        // Necesitamos encontrar el ID de doctor (tabla doctores) desde el usuarioId
        const doctorSeleccionado = doctores.find(d => d.usuarioId === formData.doctorId);
        
        if (doctorSeleccionado) {
          console.log('🔍 Consultando bloques para doctor:', doctorSeleccionado.nombre, 'ID:', doctorSeleccionado.id);
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/bloques/${doctorSeleccionado.id}?fecha=${formData.fecha}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          
          // La estructura es: { success: true, data: { bloques: { doctor, fecha, bloques: [...] } } }
          const bloquesArray = data.success && data.data && data.data.bloques && Array.isArray(data.data.bloques.bloques)
            ? data.data.bloques.bloques
            : [];
          
          const disponibles = bloquesArray.filter(b => b.estado === 'disponible').map(b => ({
            hora: b.hora,
            doctorId: formData.doctorId,
            doctorNombre: doctorSeleccionado.nombre || 'Doctor',
            duracion: b.duracion
          }));
          
          setBloquesDisponibles(disponibles);
        } else {
          console.log('❌ Doctor no encontrado en la lista');
        }
      } else {
        // Si no hay doctor, consultar bloques de todos los doctores filtrados
        const doctoresFiltrados = getDoctoresFiltrados();
        console.log('🔍 Consultando bloques para', doctoresFiltrados.length, 'doctores');
        
        const promesas = doctoresFiltrados.map(doc =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agenda/bloques/${doc.id}?fecha=${formData.fecha}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).then(data => {
            // La estructura es: { success: true, data: { bloques: { doctor, fecha, bloques: [...] } } }
            const bloquesArray = data.success && data.data && data.data.bloques && Array.isArray(data.data.bloques.bloques)
              ? data.data.bloques.bloques
              : [];
            
            const bloquesFiltrados = bloquesArray.filter(b => b.estado === 'disponible');
            
            return {
              doctorId: doc.usuarioId,
              doctorNombre: doc.nombre,
              bloques: bloquesFiltrados
            };
          })
        );
        
        const resultados = await Promise.all(promesas);
        const todosLosBloques = [];
        
        resultados.forEach(resultado => {
          resultado.bloques.forEach(bloque => {
            todosLosBloques.push({
              hora: bloque.hora,
              doctorId: resultado.doctorId,
              doctorNombre: resultado.doctorNombre,
              duracion: bloque.duracion
            });
          });
        });
        
        console.log('✅ Total bloques disponibles de todos los doctores:', todosLosBloques.length);
        setBloquesDisponibles(todosLosBloques);
      }
    } catch (error) {
      console.error('❌ Error al cargar bloques:', error);
      setBloquesDisponibles([]);
    } finally {
      setLoadingBloques(false);
    }
  };
  
  // Efecto para recargar bloques cuando cambia fecha o doctor
  useEffect(() => {
    if (formData.fecha) {
      cargarBloquesDisponibles();
    }
  }, [formData.fecha, formData.doctorId]);

  const handleTipoCitaChange = (tipo) => {
    setFormData({
      ...formData,
      tipoCita: tipo,
      servicioId: '',
      duracionMinutos: 30,
      costo: ''
    });
    setServicioSeleccionado(null);
  };

  const handleServicioChange = (e) => {
    const servicioId = e.target.value;
    setFormData({ ...formData, servicioId });

    if (formData.tipoCita === 'Especialidad') {
      const especialidad = especialidades.find(e => e.id === servicioId);
      if (especialidad) {
        setServicioSeleccionado({
          nombre: especialidad.titulo,
          duracion: especialidad.duracionMinutos,
          costo: parseFloat(especialidad.costoCOP)
        });
        setFormData({
          ...formData,
          servicioId,
          duracionMinutos: especialidad.duracionMinutos,
          costo: especialidad.costoCOP.toString()
        });
      }
    } else {
      const examen = examenesProcedimientos.find(e => e.id === servicioId);
      if (examen) {
        setServicioSeleccionado({
          nombre: examen.nombre,
          duracion: examen.duracionMinutos || 30,
          costo: parseFloat(examen.costoBase)
        });
        setFormData({
          ...formData,
          servicioId,
          duracionMinutos: examen.duracionMinutos || 30,
          costo: examen.costoBase.toString()
        });
      }
    }
  };

  const handlePacienteSelect = (paciente) => {
    setPacienteSeleccionado(paciente);
    setFormData({ 
      ...formData, 
      pacienteId: paciente.id,
      pacienteNombre: `${paciente.nombre} ${paciente.apellido}`,
      cubiertoPorEPS: !!paciente.eps
    });
    setSearchPaciente(`${paciente.nombre} ${paciente.apellido}`);
    setShowPacientesList(false);
  };

  const filteredPacientes = pacientes.filter(p =>
    `${p.nombre} ${p.apellido} ${p.cedula}`.toLowerCase().includes(searchPaciente.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de costo
    const costo = parseFloat(formData.costo);
    if (!costo || costo <= 0) {
      toast({
        title: "Error",
        description: "El costo debe ser mayor a cero",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const payload = {
        paciente_id: formData.pacienteId,
        doctor_id: formData.doctorId || null,
        tipo_cita: formData.tipoCita,
        fecha: formData.fecha,
        hora: formData.hora + ':00',
        duracion_minutos: parseInt(formData.duracionMinutos),
        costo: costo,
        motivo: formData.motivo || null,
        notas: formData.notas || null,
        estado: 'Programada', // Cambiar estado de PorAgendar a Programada al editar
        // Información de facturación
        metodo_pago: formData.metodoPago,
        estado_pago: formData.estadoPago,
        cubierto_por_eps: formData.cubiertoPorEPS
      };

      if (formData.tipoCita === 'Especialidad') {
        payload.especialidad_id = formData.servicioId;
      } else {
        payload.examen_procedimiento_id = formData.servicioId;
      }

      // Detectar si es edición (tanto por editingCita como por initialData.citaId o initialData.isEdit)
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

      const data = await res.json();

      if (data.success) {
        toast({
          title: '✅ Cita guardada',
          description: data.message || 'La cita se ha registrado exitosamente',
        });
        if (onSuccess) onSuccess(data.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.message || 'No se pudo guardar la cita',
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de Consulta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Consulta *
        </label>
        <select
          value={formData.tipoCita}
          onChange={(e) => handleTipoCitaChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
          disabled={loading}
        >
          <option value="">Seleccione el tipo</option>
          <option value="Especialidad">Especialidad</option>
          <option value="Examen">Examen</option>
          <option value="Procedimiento">Procedimiento</option>
        </select>
        {formData.tipoCita && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            {getIconoTipo(formData.tipoCita)}
            <span>{getContadorDisponibles()} {formData.tipoCita === 'Especialidad' ? 'especialidades' : formData.tipoCita.toLowerCase() + 's'} disponibles</span>
          </div>
        )}
      </div>

      {/* Servicio */}
      {formData.tipoCita && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Servicio *
          </label>
          <select
            value={formData.servicioId}
            onChange={handleServicioChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
            disabled={loading}
          >
            <option value="">Seleccione un servicio</option>
            {getServiciosDisponibles().map((servicio) => (
              <option key={servicio.id} value={servicio.id}>
                {servicio.titulo || servicio.nombre}
              </option>
            ))}
          </select>
          {servicioSeleccionado && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-blue-900">{servicioSeleccionado.nombre}</div>
                  <div className="text-blue-700 mt-1">
                    Duración: <span className="font-medium">{servicioSeleccionado.duracion} minutos</span> | 
                    Costo: <span className="font-medium">{formatCurrency(servicioSeleccionado.costo)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paciente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paciente *
        </label>
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar paciente..."
            value={searchPaciente}
            onChange={(e) => {
              setSearchPaciente(e.target.value);
              setShowPacientesList(true);
            }}
            onFocus={() => setShowPacientesList(true)}
            required={!formData.pacienteId}
            disabled={loading}
          />
          {showPacientesList && searchPaciente && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredPacientes.length > 0 ? (
                filteredPacientes.map((paciente) => (
                  <button
                    key={paciente.id}
                    type="button"
                    onClick={() => handlePacienteSelect(paciente)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium text-gray-900">
                      {paciente.nombre} {paciente.apellido}
                    </div>
                    <div className="text-sm text-gray-500">
                      {paciente.cedula} | {paciente.email}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">No se encontraron pacientes</div>
              )}
            </div>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {pacientes.length} pacientes disponibles
        </div>
      </div>

      {/* Doctor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Doctor Asignado (opcional)
        </label>
        <select
          value={formData.doctorId}
          onChange={(e) => setFormData({ ...formData, doctorId: e.target.value, hora: '' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={loading || !formData.servicioId}
        >
          <option value="">Ver disponibilidad de todos los doctores</option>
          {getDoctoresFiltrados().map((doctor) => (
            <option key={doctor.id} value={doctor.usuarioId}>
              {doctor.nombre} {doctor.apellido} - {doctor.especialidades || 'Sin especialidad'}
            </option>
          ))}
        </select>
        {formData.tipoCita === 'Especialidad' && formData.servicioId && (
          <div className="mt-1 text-xs text-gray-500">
            Mostrando solo doctores con la especialidad seleccionada
          </div>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha *
        </label>
        <Input
          type="date"
          value={formData.fecha}
          onChange={(e) => setFormData({ ...formData, fecha: e.target.value, hora: '' })}
          min={getFechaMinima()}
          required
          disabled={loading || !formData.servicioId}
        />
        <div className="mt-1 text-xs text-gray-500">
          Solo se pueden agendar citas desde hoy en adelante
        </div>
      </div>

      {/* Bloques Horarios Disponibles */}
      {formData.fecha && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hora Disponible *
          </label>
          
          {loadingBloques ? (
            <div className="text-center py-4 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-2 text-sm">Cargando disponibilidad...</p>
            </div>
          ) : getDoctoresFiltrados().length === 0 ? (
            <div className="text-center py-6 text-yellow-800 bg-yellow-50 rounded-md border border-yellow-200">
              <p className="text-sm font-semibold">⚠️ No hay doctores disponibles para esta especialidad</p>
              <p className="text-xs mt-1">Por favor selecciona otra especialidad o tipo de consulta</p>
            </div>
          ) : bloquesDisponibles.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
              {bloquesDisponibles.map((bloque, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFormData({ 
                      ...formData, 
                      hora: bloque.hora,
                      doctorId: bloque.doctorId 
                    });
                  }}
                  className={`w-full p-3 text-left rounded-md border-2 transition-all ${
                    formData.hora === bloque.hora && formData.doctorId === bloque.doctorId
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{bloque.hora}</div>
                      {!formData.doctorId && (
                        <div className="text-sm text-gray-600">Dr. {bloque.doctorNombre}</div>
                      )}
                    </div>
                    {formData.hora === bloque.hora && formData.doctorId === bloque.doctorId && (
                      <div className="text-emerald-600 font-semibold">✓ Seleccionado</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-sm">No hay horarios disponibles para esta fecha</p>
              <p className="text-xs mt-1">Intenta con otra fecha{formData.doctorId ? '' : ' o selecciona un doctor específico'}</p>
            </div>
          )}
          
          {formData.hora && (
            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-800">
              ✓ Hora seleccionada: <strong>{formData.hora}</strong>
            </div>
          )}
        </div>
      )}

      {/* Información EPS del Paciente */}
      {pacienteSeleccionado && pacienteSeleccionado.eps && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start gap-2">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-blue-900 mb-2">Información de Aseguramiento</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">EPS:</span>
                  <span className="ml-2 font-medium text-gray-900">{pacienteSeleccionado.eps}</span>
                </div>
                {pacienteSeleccionado.regimen && (
                  <div>
                    <span className="text-gray-600">Régimen:</span>
                    <span className="ml-2 font-medium text-gray-900">{pacienteSeleccionado.regimen}</span>
                  </div>
                )}
                {pacienteSeleccionado.tipoAfiliacion && (
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <span className="ml-2 font-medium text-gray-900">{pacienteSeleccionado.tipoAfiliacion}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duración y Costo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duración *
          </label>
          <Input
            type="number"
            value={formData.duracionMinutos}
            onChange={(e) => setFormData({ ...formData, duracionMinutos: e.target.value })}
            min="1"
            required
            disabled={loading}
          />
          <div className="mt-1 text-xs text-gray-500">
            {formData.duracionMinutos} minutos ({Math.floor(formData.duracionMinutos / 60)}h {formData.duracionMinutos % 60}m)
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Costo (COP) *
          </label>
          <Input
            type="number"
            value={formData.costo}
            onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
            min="1"
            required
            disabled={loading}
            className={!formData.costo || parseFloat(formData.costo) <= 0 ? 'border-red-300' : ''}
          />
          <div className="mt-1 text-xs text-gray-500">
            El costo debe ser mayor a cero
          </div>
        </div>
      </div>

      {/* Información de Pago */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Pago</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago *
            </label>
            <select
              value={formData.metodoPago}
              onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              disabled={loading}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
              <option value="EPS">EPS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de Pago *
            </label>
            <select
              value={formData.estadoPago}
              onChange={(e) => setFormData({ ...formData, estadoPago: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              disabled={loading}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
              <option value="Parcial">Pago Parcial</option>
            </select>
          </div>
        </div>
        {formData.metodoPago === 'EPS' && (
          <div className="mt-3 text-sm text-blue-700 bg-blue-50 p-3 rounded border border-blue-200">
            ℹ️ Este servicio será facturado a la EPS del paciente
          </div>
        )}
      </div>

      {/* Motivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Motivo de la Consulta
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          rows={3}
          value={formData.motivo}
          onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
          placeholder="Describa el motivo de la consulta..."
          disabled={loading}
        />
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observaciones
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          rows={3}
          value={formData.notas}
          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Guardando...' : (editingCita ? 'Actualizar Cita' : 'Guardar Cita')}
        </Button>
      </div>
    </form>
  );
}
