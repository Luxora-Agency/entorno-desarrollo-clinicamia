'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useCitas } from '@/hooks/useCitas';
import { usePacientes } from '@/hooks/usePacientes';
import { apiGet } from '@/services/api';
import { formatDateISO } from '@/services/formatters';
import CitaFilters from './citas/CitaFilters';
import CitasList from './citas/CitasList';
import CitaForm from './citas/CitaForm';

export default function CitasModuleRefactored({ user }) {
  // Hooks
  const { citas, loading, fetchCitas, createCita, updateCita, deleteCita, fetchDisponibilidad, validarDisponibilidad } = useCitas();
  const { pacientes, fetchPacientes } = usePacientes();

  // Estados
  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCita, setEditingCita] = useState(null);
  const [selectedFecha, setSelectedFecha] = useState(formatDateISO(new Date()));
  const [formData, setFormData] = useState({
    paciente_id: '',
    especialidad_id: '',
    doctor_id: '',
    fecha: formatDateISO(new Date()),
    hora: '',
    duracion_minutos: '',
    costo: '',
    motivo: '',
    notas: '',
  });
  const [doctoresFiltrados, setDoctoresFiltrados] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [mensajeDisponibilidad, setMensajeDisponibilidad] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [selectedFecha]);

  // Cargar horarios disponibles cuando cambia doctor o fecha
  useEffect(() => {
    if (formData.doctor_id && formData.fecha && !editingCita) {
      cargarHorariosDisponibles(formData.doctor_id, formData.fecha);
    }
  }, [formData.doctor_id, formData.fecha, editingCita]);

  const loadData = async () => {
    try {
      // Cargar citas con hook
      await fetchCitas({ fecha: selectedFecha });

      // Cargar pacientes con hook
      await fetchPacientes();

      // Cargar doctores
      const doctoresData = await apiGet('/usuarios/no-pacientes');
      setDoctores(doctoresData.data?.usuarios || [{ id: user.id, nombre: user.nombre, apellido: user.apellido }]);

      // Cargar especialidades
      const especialidadesData = await apiGet('/especialidades', { limit: 100 });
      setEspecialidades(especialidadesData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const cargarHorariosDisponibles = async (doctorId, fecha) => {
    if (!doctorId || !fecha) {
      setHorariosDisponibles([]);
      setMensajeDisponibilidad('');
      return;
    }

    setLoadingHorarios(true);
    setMensajeDisponibilidad('');

    const result = await fetchDisponibilidad(doctorId, fecha);

    if (result.success) {
      const data = result.data;
      if (!data.horarios_configurados) {
        setMensajeDisponibilidad('⚠️ El doctor no tiene horarios configurados');
        setHorariosDisponibles([]);
      } else if (!data.bloques_del_dia) {
        setMensajeDisponibilidad('⚠️ El doctor no tiene disponibilidad para esta fecha');
        setHorariosDisponibles([]);
      } else if (data.slots_disponibles.length === 0) {
        setMensajeDisponibilidad('⚠️ No hay horarios disponibles para esta fecha');
        setHorariosDisponibles([]);
      } else {
        // Filter only available slots (exclude blocked, occupied, reserved, past)
        const slotsDisponibles = data.slots_disponibles.filter(s => s.disponible);
        setHorariosDisponibles(slotsDisponibles);

        if (slotsDisponibles.length === 0) {
          setMensajeDisponibilidad('⚠️ No hay horarios disponibles (todos ocupados o bloqueados)');
        } else {
          setMensajeDisponibilidad(`✅ ${slotsDisponibles.length} horarios disponibles`);
        }
      }
    } else {
      setMensajeDisponibilidad('❌ Error al cargar disponibilidad');
      setHorariosDisponibles([]);
    }

    setLoadingHorarios(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar disponibilidad antes de guardar (solo para citas nuevas)
    if (!editingCita && formData.doctor_id && formData.fecha && formData.hora) {
      const validacionResult = await validarDisponibilidad({
        doctor_id: formData.doctor_id,
        fecha: formData.fecha,
        hora: formData.hora,
        duracion_minutos: parseInt(formData.duracion_minutos) || 30,
      });

      if (!validacionResult.success || !validacionResult.data.disponible) {
        alert(validacionResult.data?.message || 'El horario seleccionado ya no está disponible');
        return;
      }
    }

    const payload = {
      paciente_id: formData.paciente_id,
      doctor_id: formData.doctor_id,
      especialidad_id: formData.especialidad_id,
      fecha: formData.fecha,
      hora: formData.hora,
      duracion_minutos: parseInt(formData.duracion_minutos) || 30,
      costo: parseFloat(formData.costo) || 0,
      motivo: formData.motivo,
      notas: formData.notas,
    };

    let result;
    if (editingCita) {
      result = await updateCita(editingCita.id, payload);
    } else {
      result = await createCita(payload);
    }

    if (result.success) {
      setIsDialogOpen(false);
      resetForm();
      await fetchCitas({ fecha: selectedFecha });
    } else {
      alert(result.error || 'Error al guardar la cita');
    }
  };

  const handleEdit = (cita) => {
    setEditingCita(cita);
    setFormData({
      paciente_id: cita.pacienteId || '',
      especialidad_id: cita.especialidadId || '',
      doctor_id: cita.doctorId || '',
      fecha: cita.fecha || '',
      hora: cita.hora || '',
      duracion_minutos: cita.duracionMinutos || '',
      costo: cita.costo || '',
      motivo: cita.motivo || '',
      notas: cita.notas || '',
    });

    // Si hay especialidad, cargar doctores filtrados
    if (cita.especialidadId) {
      const doctoresConEspecialidad = doctores.filter((doctor) =>
        doctor.doctor?.especialidades?.some((esp) => esp.especialidadId === cita.especialidadId)
      );
      setDoctoresFiltrados(doctoresConEspecialidad);
    }

    setIsDialogOpen(true);
  };

  const handleCancel = async (id) => {
    if (!confirm('¿Está seguro de cancelar esta cita?')) return;

    const result = await deleteCita(id);
    if (result.success) {
      await fetchCitas({ fecha: selectedFecha });
    }
  };

  const handleEspecialidadChange = (especialidadId) => {
    const especialidad = especialidades.find((e) => e.id === especialidadId);

    if (especialidad) {
      // Filtrar doctores que tengan esta especialidad
      const doctoresConEspecialidad = doctores.filter((doctor) =>
        doctor.doctor?.especialidades?.some((esp) => esp.especialidadId === especialidadId)
      );
      setDoctoresFiltrados(doctoresConEspecialidad);

      // Precargar duración y costo
      setFormData({
        ...formData,
        especialidad_id: especialidadId,
        doctor_id: '',
        duracion_minutos: especialidad.duracionMinutos || '',
        costo: especialidad.costoCOP || '',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      paciente_id: '',
      especialidad_id: '',
      doctor_id: '',
      fecha: formatDateISO(new Date()),
      hora: '',
      duracion_minutos: '',
      costo: '',
      motivo: '',
      notas: '',
    });
    setDoctoresFiltrados([]);
    setHorariosDisponibles([]);
    setMensajeDisponibilidad('');
    setEditingCita(null);
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Agenda de Citas</h1>
          </div>
          <p className="text-gray-600 ml-14">Gestiona las citas médicas</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                {editingCita ? 'Editar Cita' : 'Nueva Cita'}
              </DialogTitle>
            </DialogHeader>
            <CitaForm
              formData={formData}
              onFormDataChange={setFormData}
              editingCita={editingCita}
              pacientes={pacientes}
              especialidades={especialidades}
              doctoresFiltrados={doctoresFiltrados}
              horariosDisponibles={horariosDisponibles}
              loadingHorarios={loadingHorarios}
              mensajeDisponibilidad={mensajeDisponibilidad}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
              onEspecialidadChange={handleEspecialidadChange}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <CitaFilters
        selectedFecha={selectedFecha}
        onFechaChange={setSelectedFecha}
        totalCitas={citas.length}
      />

      {/* Lista de Citas */}
      <CitasList
        citas={citas}
        loading={loading}
        onEdit={handleEdit}
        onCancel={handleCancel}
      />
    </div>
  );
}
