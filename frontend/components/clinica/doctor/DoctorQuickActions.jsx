'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Calendar, Pill, Stethoscope,
  Brain, FlaskConical, Scan, Printer,
  Search, Clock, CheckCircle, Loader2, X,
  User, Users, BedDouble, Activity, Phone,
  Mail, MapPin, CreditCard, Heart, ArrowLeft,
  ClipboardList, History, AlertCircle, ExternalLink,
  Plus, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Definición de acciones rápidas disponibles
const quickActions = [
  {
    id: 'buscar-paciente',
    label: 'Buscar Paciente',
    description: 'Buscar por nombre o cédula',
    icon: Search,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200',
    action: 'search-patient'
  },
  {
    id: 'generar-formula',
    label: 'Nueva Fórmula',
    description: 'Crear prescripción médica',
    icon: Pill,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200',
    action: 'new-prescription'
  },
  {
    id: 'orden-laboratorio',
    label: 'Orden Lab',
    description: 'Solicitar exámenes',
    icon: FlaskConical,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    borderColor: 'border-purple-200',
    action: 'lab-order'
  },
  {
    id: 'orden-imagenes',
    label: 'Orden Imágenes',
    description: 'Solicitar estudios',
    icon: Scan,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    borderColor: 'border-indigo-200',
    action: 'imaging-order'
  },
  {
    id: 'certificado',
    label: 'Certificado',
    description: 'Generar certificado médico',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    borderColor: 'border-amber-200',
    action: 'certificate'
  },
  {
    id: 'asistente-ia',
    label: 'Asistente IA',
    description: 'Consultar asistente médico',
    icon: Brain,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100',
    borderColor: 'border-cyan-200',
    action: 'ai-assistant'
  },
  {
    id: 'mi-agenda',
    label: 'Mi Agenda',
    description: 'Ver agenda completa',
    icon: Calendar,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
    borderColor: 'border-teal-200',
    action: 'view-schedule'
  }
];

export default function DoctorQuickActions({
  onAction,
  onSearchPatient,
  onOpenAIAssistant,
  onViewSchedule,
  onViewHCE,
  doctorId,
  className = '',
  compact = false
}) {
  const { toast } = useToast();
  const router = useRouter();

  // Estados para dialogs
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [labOrderDialogOpen, setLabOrderDialogOpen] = useState(false);
  const [imagingOrderDialogOpen, setImagingOrderDialogOpen] = useState(false);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);

  // Estados para pacientes del doctor
  const [doctorPatients, setDoctorPatients] = useState({
    citas: [],
    hospitalizados: [],
    cirugias: []
  });
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientFilter, setPatientFilter] = useState('');

  // Estados para búsqueda general de pacientes
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchPatient, setSelectedSearchPatient] = useState(null);
  const [loadingPatientProfile, setLoadingPatientProfile] = useState(false);
  const [patientFullProfile, setPatientFullProfile] = useState(null);

  // Estados para productos (medicamentos) de farmacia
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [productoSearch, setProductoSearch] = useState('');

  // Estados para exámenes y procedimientos
  const [examenes, setExamenes] = useState([]);
  const [loadingExamenes, setLoadingExamenes] = useState(false);

  // Estados para prescripción
  const [prescriptionPatient, setPrescriptionPatient] = useState(null);
  const [medicamentosSeleccionados, setMedicamentosSeleccionados] = useState([]);
  const [creatingPrescription, setCreatingPrescription] = useState(false);

  // Estados para orden de laboratorio
  const [labPatient, setLabPatient] = useState(null);
  const [selectedExams, setSelectedExams] = useState([]);
  const [labObservaciones, setLabObservaciones] = useState('');
  const [creatingLabOrder, setCreatingLabOrder] = useState(false);

  // Estados para orden de imágenes
  const [imagingPatient, setImagingPatient] = useState(null);
  const [selectedStudies, setSelectedStudies] = useState([]);
  const [imagingObservaciones, setImagingObservaciones] = useState('');
  const [creatingImagingOrder, setCreatingImagingOrder] = useState(false);

  // Estados para certificado
  const [certPatient, setCertPatient] = useState(null);
  const [certTipo, setCertTipo] = useState('Incapacidad');
  const [certTitulo, setCertTitulo] = useState('');
  const [certContenido, setCertContenido] = useState('');
  const [certDestinatario, setCertDestinatario] = useState('');
  const [creatingCert, setCreatingCert] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Cargar productos (medicamentos) de farmacia
  const loadProductos = useCallback(async () => {
    setLoadingProductos(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/productos?activo=true&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProductos(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading productos:', error);
    } finally {
      setLoadingProductos(false);
    }
  }, [apiUrl]);

  // Cargar exámenes y procedimientos
  const loadExamenes = useCallback(async () => {
    setLoadingExamenes(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/examenes-procedimientos?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExamenes(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading examenes:', error);
    } finally {
      setLoadingExamenes(false);
    }
  }, [apiUrl]);

  // Cargar pacientes del doctor (citas, hospitalizados, cirugías)
  const loadDoctorPatients = useCallback(async () => {
    if (!doctorId) return;

    setLoadingPatients(true);
    try {
      const token = localStorage.getItem('token');

      const [citasRes, hospitalizadosRes, cirugiasRes] = await Promise.all([
        fetch(`${apiUrl}/citas?doctorId=${doctorId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/admisiones/doctor/${doctorId}?estado=Activa&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/procedimientos?medicoResponsableId=${doctorId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [citasData, hospitalizadosData, cirugiasData] = await Promise.all([
        citasRes.json(),
        hospitalizadosRes.json(),
        cirugiasRes.json()
      ]);

      const pacientesCitas = [];
      const pacientesHospitalizados = [];
      const pacientesCirugias = [];
      const seenIds = new Set();

      // De citas
      if (citasData.success || citasData.data) {
        const citas = citasData.data || citasData.citas || [];
        citas.forEach(cita => {
          if (cita.paciente && !seenIds.has(cita.paciente.id)) {
            seenIds.add(cita.paciente.id);
            pacientesCitas.push({
              ...cita.paciente,
              origen: 'cita',
              ultimaCita: cita.fecha,
              estadoCita: cita.estado
            });
          }
        });
      }

      // De hospitalizados
      if (hospitalizadosData.success && hospitalizadosData.data) {
        const admisiones = Array.isArray(hospitalizadosData.data)
          ? hospitalizadosData.data
          : hospitalizadosData.data.data || [];
        admisiones.forEach(admision => {
          if (admision.paciente) {
            const paciente = {
              ...admision.paciente,
              origen: 'hospitalizacion',
              admisionId: admision.id,
              unidad: admision.unidad?.nombre,
              cama: admision.cama?.numero
            };
            if (!seenIds.has(paciente.id)) {
              seenIds.add(paciente.id);
            }
            pacientesHospitalizados.push(paciente);
          }
        });
      }

      // De cirugías
      if (cirugiasData.success) {
        const procedimientos = cirugiasData.data || [];
        procedimientos.forEach(proc => {
          if (proc.paciente) {
            const paciente = {
              ...proc.paciente,
              origen: 'cirugia',
              procedimientoId: proc.id,
              tipoProcedimiento: proc.tipoProcedimiento,
              fechaCirugia: proc.fechaProgramada
            };
            if (!seenIds.has(paciente.id)) {
              seenIds.add(paciente.id);
            }
            pacientesCirugias.push(paciente);
          }
        });
      }

      setDoctorPatients({
        citas: pacientesCitas,
        hospitalizados: pacientesHospitalizados,
        cirugias: pacientesCirugias
      });
    } catch (error) {
      console.error('Error loading doctor patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  }, [doctorId, apiUrl]);

  // Cargar datos cuando se abren los diálogos
  useEffect(() => {
    if (prescriptionDialogOpen) {
      loadDoctorPatients();
      loadProductos();
    }
  }, [prescriptionDialogOpen, loadDoctorPatients, loadProductos]);

  useEffect(() => {
    if (labOrderDialogOpen || imagingOrderDialogOpen) {
      loadDoctorPatients();
      loadExamenes();
    }
  }, [labOrderDialogOpen, imagingOrderDialogOpen, loadDoctorPatients, loadExamenes]);

  useEffect(() => {
    if (certificateDialogOpen) {
      loadDoctorPatients();
    }
  }, [certificateDialogOpen, loadDoctorPatients]);

  // Filtrar pacientes por búsqueda
  const filterPatients = (patients) => {
    if (!patientFilter.trim()) return patients;
    const filter = patientFilter.toLowerCase();
    return patients.filter(p =>
      p.nombre?.toLowerCase().includes(filter) ||
      p.apellido?.toLowerCase().includes(filter) ||
      p.cedula?.includes(filter)
    );
  };

  // Obtener todos los pacientes únicos
  const getAllPatients = () => {
    const all = [
      ...doctorPatients.citas,
      ...doctorPatients.hospitalizados,
      ...doctorPatients.cirugias
    ];
    const seen = new Set();
    return all.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  };

  // Filtrar productos por búsqueda
  const filteredProductos = productos.filter(p =>
    !productoSearch.trim() ||
    p.nombre?.toLowerCase().includes(productoSearch.toLowerCase()) ||
    p.principioActivo?.toLowerCase().includes(productoSearch.toLowerCase())
  );

  // Filtrar exámenes de laboratorio
  const examenesLab = examenes.filter(e =>
    e.tipo === 'Laboratorio' || e.categoria?.nombre?.toLowerCase().includes('laboratorio')
  );

  // Filtrar exámenes de imágenes
  const examenesImg = examenes.filter(e =>
    e.tipo === 'Imagenologia' ||
    e.categoria?.nombre?.toLowerCase().includes('imagen') ||
    e.categoria?.nombre?.toLowerCase().includes('radiolog')
  );

  // Calcular edad del paciente
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleAction = (action) => {
    switch (action.action) {
      case 'search-patient':
        setSearchDialogOpen(true);
        break;
      case 'new-prescription':
        setPrescriptionDialogOpen(true);
        break;
      case 'lab-order':
        setLabOrderDialogOpen(true);
        break;
      case 'imaging-order':
        setImagingOrderDialogOpen(true);
        break;
      case 'certificate':
        setCertificateDialogOpen(true);
        break;
      case 'ai-assistant':
        if (onOpenAIAssistant) {
          onOpenAIAssistant();
        } else {
          toast({
            title: 'Asistente IA',
            description: 'El asistente de IA se abrirá en la consulta activa.',
          });
        }
        break;
      case 'view-schedule':
        if (onViewSchedule) {
          onViewSchedule();
        }
        break;
      default:
        if (onAction) {
          onAction(action);
        }
    }
  };

  // Búsqueda general de pacientes
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${apiUrl}/pacientes?search=${encodeURIComponent(searchQuery)}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data || []);
        if (data.data?.length === 0) {
          toast({
            title: 'Sin resultados',
            description: 'No se encontraron pacientes con ese criterio.',
          });
        }
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      toast({
        title: 'Error',
        description: 'No se pudo realizar la búsqueda.',
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  };

  // Cargar perfil completo del paciente
  const loadPatientProfile = async (patient) => {
    setSelectedSearchPatient(patient);
    setLoadingPatientProfile(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/pacientes/${patient.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPatientFullProfile(data.data || data.paciente);
        } else {
          setPatientFullProfile(patient);
        }
      } else {
        setPatientFullProfile(patient);
      }
    } catch (error) {
      console.error('Error loading patient profile:', error);
      setPatientFullProfile(patient);
    } finally {
      setLoadingPatientProfile(false);
    }
  };

  const handleSelectPatient = (patient) => {
    loadPatientProfile(patient);
  };

  const handleBackToSearch = () => {
    setSelectedSearchPatient(null);
    setPatientFullProfile(null);
  };

  const handleCloseSearch = () => {
    setSearchDialogOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSearchPatient(null);
    setPatientFullProfile(null);
  };

  // Navegar a la historia clínica completa
  const handleViewFullHCE = (patient) => {
    handleCloseSearch();
    if (onViewHCE) {
      onViewHCE(patient);
    } else if (onSearchPatient) {
      onSearchPatient(patient);
    } else {
      // Navegar directamente a la HCE
      router.push(`/clinica/hce/${patient.id}`);
    }
  };

  // Agregar medicamento a la prescripción
  const handleAddMedicamento = (producto) => {
    if (medicamentosSeleccionados.find(m => m.productoId === producto.id)) {
      toast({
        title: 'Medicamento ya agregado',
        description: 'Este medicamento ya está en la lista.',
      });
      return;
    }

    setMedicamentosSeleccionados([
      ...medicamentosSeleccionados,
      {
        productoId: producto.id,
        nombre: producto.nombre,
        dosis: '',
        frecuencia: '',
        viaAdministracion: 'Oral',
        duracionDias: 7,
        instrucciones: ''
      }
    ]);
    setProductoSearch('');
  };

  // Actualizar medicamento
  const handleUpdateMedicamento = (index, field, value) => {
    const updated = [...medicamentosSeleccionados];
    updated[index][field] = value;
    setMedicamentosSeleccionados(updated);
  };

  // Eliminar medicamento
  const handleRemoveMedicamento = (index) => {
    setMedicamentosSeleccionados(medicamentosSeleccionados.filter((_, i) => i !== index));
  };

  // Crear prescripción
  const handleCreatePrescription = async () => {
    if (!prescriptionPatient || medicamentosSeleccionados.length === 0) {
      toast({
        title: 'Datos incompletos',
        description: 'Seleccione un paciente y agregue al menos un medicamento.',
        variant: 'destructive'
      });
      return;
    }

    // Validar que todos los medicamentos tengan dosis y frecuencia
    const incompletos = medicamentosSeleccionados.filter(m => !m.dosis || !m.frecuencia);
    if (incompletos.length > 0) {
      toast({
        title: 'Datos incompletos',
        description: 'Complete la dosis y frecuencia de todos los medicamentos.',
        variant: 'destructive'
      });
      return;
    }

    setCreatingPrescription(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/prescripciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pacienteId: prescriptionPatient.id,
          medicamentos: medicamentosSeleccionados.map(m => ({
            productoId: m.productoId,
            dosis: m.dosis,
            frecuencia: m.frecuencia,
            viaAdministracion: m.viaAdministracion,
            duracionDias: parseInt(m.duracionDias) || 7,
            instrucciones: m.instrucciones
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Prescripción creada',
          description: `Fórmula médica con ${medicamentosSeleccionados.length} medicamento(s) generada para ${prescriptionPatient.nombre} ${prescriptionPatient.apellido}.`,
        });

        if (data.alertas && data.alertas.length > 0) {
          toast({
            title: 'Alertas de medicación',
            description: data.alertas.join(', '),
            variant: 'warning'
          });
        }

        setPrescriptionDialogOpen(false);
        setPrescriptionPatient(null);
        setMedicamentosSeleccionados([]);
        setPatientFilter('');
      } else {
        throw new Error(data.message || 'Error al crear prescripción');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la prescripción.',
        variant: 'destructive'
      });
    } finally {
      setCreatingPrescription(false);
    }
  };

  // Crear orden de laboratorio
  const handleCreateLabOrder = async () => {
    if (!labPatient || selectedExams.length === 0) {
      toast({
        title: 'Datos incompletos',
        description: 'Seleccione un paciente y al menos un examen.',
        variant: 'destructive'
      });
      return;
    }

    setCreatingLabOrder(true);
    try {
      const token = localStorage.getItem('token');

      // Crear una orden por cada examen seleccionado
      const promises = selectedExams.map(examen =>
        fetch(`${apiUrl}/ordenes-medicas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            paciente_id: labPatient.id,
            examen_procedimiento_id: examen.id,
            doctor_id: doctorId,
            precio_aplicado: examen.costoBase || 0,
            prioridad: 'Normal',
            observaciones: labObservaciones
          })
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      const exitosos = results.filter(r => r.success).length;

      if (exitosos > 0) {
        toast({
          title: 'Órdenes de laboratorio creadas',
          description: `Se crearon ${exitosos} orden(es) para ${labPatient.nombre} ${labPatient.apellido}.`,
        });
        setLabOrderDialogOpen(false);
        setLabPatient(null);
        setSelectedExams([]);
        setLabObservaciones('');
        setPatientFilter('');
      } else {
        throw new Error('No se pudieron crear las órdenes');
      }
    } catch (error) {
      console.error('Error creating lab order:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron crear las órdenes de laboratorio.',
        variant: 'destructive'
      });
    } finally {
      setCreatingLabOrder(false);
    }
  };

  // Crear orden de imágenes
  const handleCreateImagingOrder = async () => {
    if (!imagingPatient || selectedStudies.length === 0) {
      toast({
        title: 'Datos incompletos',
        description: 'Seleccione un paciente y al menos un estudio.',
        variant: 'destructive'
      });
      return;
    }

    setCreatingImagingOrder(true);
    try {
      const token = localStorage.getItem('token');

      const promises = selectedStudies.map(estudio =>
        fetch(`${apiUrl}/ordenes-medicas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            paciente_id: imagingPatient.id,
            examen_procedimiento_id: estudio.id,
            doctor_id: doctorId,
            precio_aplicado: estudio.costoBase || 0,
            prioridad: 'Normal',
            observaciones: imagingObservaciones
          })
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      const exitosos = results.filter(r => r.success).length;

      if (exitosos > 0) {
        toast({
          title: 'Órdenes de imágenes creadas',
          description: `Se crearon ${exitosos} orden(es) para ${imagingPatient.nombre} ${imagingPatient.apellido}.`,
        });
        setImagingOrderDialogOpen(false);
        setImagingPatient(null);
        setSelectedStudies([]);
        setImagingObservaciones('');
        setPatientFilter('');
      } else {
        throw new Error('No se pudieron crear las órdenes');
      }
    } catch (error) {
      console.error('Error creating imaging order:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron crear las órdenes de imágenes.',
        variant: 'destructive'
      });
    } finally {
      setCreatingImagingOrder(false);
    }
  };

  // Crear certificado médico
  const handleCreateCertificate = async () => {
    if (!certPatient) {
      toast({
        title: 'Datos incompletos',
        description: 'Seleccione un paciente.',
        variant: 'destructive'
      });
      return;
    }

    if (!certContenido.trim()) {
      toast({
        title: 'Datos incompletos',
        description: 'Ingrese el contenido del certificado.',
        variant: 'destructive'
      });
      return;
    }

    setCreatingCert(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/certificados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pacienteId: certPatient.id,
          doctorId: doctorId,
          tipoCertificado: certTipo,
          titulo: certTitulo || `Certificado de ${certTipo}`,
          contenido: certContenido,
          destinatario: certDestinatario
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Certificado generado',
          description: `Certificado de ${certTipo} creado para ${certPatient.nombre} ${certPatient.apellido}.`,
        });
        setCertificateDialogOpen(false);
        setCertPatient(null);
        setCertTipo('Incapacidad');
        setCertTitulo('');
        setCertContenido('');
        setCertDestinatario('');
        setPatientFilter('');
      } else {
        throw new Error(data.message || 'Error al crear certificado');
      }
    } catch (error) {
      console.error('Error creating certificate:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el certificado.',
        variant: 'destructive'
      });
    } finally {
      setCreatingCert(false);
    }
  };

  // Componente para selector de pacientes del doctor
  const DoctorPatientSelector = ({ selectedPatient, onSelect, title = "Seleccionar Paciente" }) => {
    const [activeTab, setActiveTab] = useState('todos');

    const getOrigenBadge = (origen) => {
      switch (origen) {
        case 'cita':
          return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Cita</Badge>;
        case 'hospitalizacion':
          return <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Hospitalizado</Badge>;
        case 'cirugia':
          return <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">Cirugía</Badge>;
        default:
          return null;
      }
    };

    const renderPatientList = (patients) => {
      const filtered = filterPatients(patients);

      if (loadingPatients) {
        return (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Cargando pacientes...</span>
          </div>
        );
      }

      if (filtered.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No hay pacientes en esta categoría</p>
          </div>
        );
      }

      return (
        <div className="space-y-1">
          {filtered.map((patient) => (
            <button
              key={`${patient.id}-${patient.origen}`}
              onClick={() => onSelect(patient)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                selectedPatient?.id === patient.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                {patient.nombre?.charAt(0)}{patient.apellido?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {patient.nombre} {patient.apellido}
                  </p>
                  {getOrigenBadge(patient.origen)}
                </div>
                <p className="text-xs text-gray-500">
                  {patient.tipoDocumento}: {patient.cedula}
                </p>
              </div>
              {selectedPatient?.id === patient.id && (
                <CheckCircle className="h-5 w-5 text-blue-500" />
              )}
            </button>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{title}</Label>
          {selectedPatient && (
            <Button variant="ghost" size="sm" onClick={() => onSelect(null)} className="h-7 text-xs">
              <X className="h-3 w-3 mr-1" /> Cambiar
            </Button>
          )}
        </div>

        {selectedPatient ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
              {selectedPatient.nombre?.charAt(0)}{selectedPatient.apellido?.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{selectedPatient.nombre} {selectedPatient.apellido}</p>
              <p className="text-xs text-gray-500">{selectedPatient.tipoDocumento}: {selectedPatient.cedula}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filtrar pacientes..."
                  value={patientFilter}
                  onChange={(e) => setPatientFilter(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4 h-9 m-2 mr-4" style={{ width: 'calc(100% - 16px)' }}>
                <TabsTrigger value="todos" className="text-xs">
                  Todos ({getAllPatients().length})
                </TabsTrigger>
                <TabsTrigger value="citas" className="text-xs">
                  Citas ({doctorPatients.citas.length})
                </TabsTrigger>
                <TabsTrigger value="hospitalizados" className="text-xs">
                  Hospital ({doctorPatients.hospitalizados.length})
                </TabsTrigger>
                <TabsTrigger value="cirugias" className="text-xs">
                  Cirugía ({doctorPatients.cirugias.length})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-48 px-2">
                <TabsContent value="todos" className="mt-0">
                  {renderPatientList(getAllPatients())}
                </TabsContent>
                <TabsContent value="citas" className="mt-0">
                  {renderPatientList(doctorPatients.citas)}
                </TabsContent>
                <TabsContent value="hospitalizados" className="mt-0">
                  {renderPatientList(doctorPatients.hospitalizados)}
                </TabsContent>
                <TabsContent value="cirugias" className="mt-0">
                  {renderPatientList(doctorPatients.cirugias)}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {quickActions.slice(0, 6).map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              className={`${action.bgColor} ${action.color} p-2 h-9 w-9`}
              onClick={() => handleAction(action)}
              title={action.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-500" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-lg border
                    ${action.bgColor} ${action.borderColor}
                    transition-all duration-200 hover:scale-[1.02] hover:shadow-sm
                  `}
                >
                  <div className={`p-2 rounded-full bg-white shadow-sm ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-medium ${action.color}`}>{action.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de búsqueda de pacientes */}
      <Dialog open={searchDialogOpen} onOpenChange={handleCloseSearch}>
        <DialogContent className="max-w-lg">
          {!selectedSearchPatient ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-500" />
                  Buscar Paciente
                </DialogTitle>
                <DialogDescription>
                  Busca por nombre, apellido o número de documento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre, apellido o cédula..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                          {patient.nombre?.charAt(0)}{patient.apellido?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{patient.nombre} {patient.apellido}</p>
                          <p className="text-xs text-gray-500">{patient.tipoDocumento}: {patient.cedula}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBackToSearch}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Perfil del Paciente
                  </DialogTitle>
                </div>
              </DialogHeader>

              {loadingPatientProfile ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : patientFullProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {patientFullProfile.nombre?.charAt(0)}{patientFullProfile.apellido?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {patientFullProfile.nombre} {patientFullProfile.apellido}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CreditCard className="h-4 w-4" />
                        <span>{patientFullProfile.tipoDocumento}: {patientFullProfile.cedula}</span>
                      </div>
                      {patientFullProfile.fechaNacimiento && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>{calcularEdad(patientFullProfile.fechaNacimiento)} años</span>
                          <span className="text-gray-300">•</span>
                          <span>{patientFullProfile.genero || 'No especificado'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {patientFullProfile.telefono && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500">Teléfono</p>
                          <p className="text-sm font-medium">{patientFullProfile.telefono}</p>
                        </div>
                      </div>
                    )}
                    {patientFullProfile.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium">{patientFullProfile.email}</p>
                        </div>
                      </div>
                    )}
                    {patientFullProfile.direccion && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-500">Dirección</p>
                          <p className="text-sm font-medium">{patientFullProfile.direccion}</p>
                        </div>
                      </div>
                    )}
                    {(patientFullProfile.eps || patientFullProfile.aseguradora) && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Heart className="h-5 w-5 text-pink-500" />
                        <div>
                          <p className="text-xs text-gray-500">EPS / Aseguradora</p>
                          <p className="text-sm font-medium">{patientFullProfile.eps || patientFullProfile.aseguradora}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(patientFullProfile.grupoSanguineo || patientFullProfile.alergias) && (
                    <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Información Importante</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {patientFullProfile.grupoSanguineo && (
                          <div>
                            <span className="text-gray-500">Grupo sanguíneo:</span>
                            <span className="ml-1 font-medium">{patientFullProfile.grupoSanguineo}</span>
                          </div>
                        )}
                        {patientFullProfile.alergias && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Alergias:</span>
                            <span className="ml-1 font-medium text-red-600">{patientFullProfile.alergias}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        handleCloseSearch();
                        setPrescriptionPatient(patientFullProfile);
                        setPrescriptionDialogOpen(true);
                      }}
                    >
                      <Pill className="h-4 w-4 text-green-500" />
                      Nueva Fórmula
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        handleCloseSearch();
                        setLabPatient(patientFullProfile);
                        setLabOrderDialogOpen(true);
                      }}
                    >
                      <FlaskConical className="h-4 w-4 text-purple-500" />
                      Orden Lab
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        handleCloseSearch();
                        setImagingPatient(patientFullProfile);
                        setImagingOrderDialogOpen(true);
                      }}
                    >
                      <Scan className="h-4 w-4 text-indigo-500" />
                      Orden Imágenes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        handleCloseSearch();
                        setCertPatient(patientFullProfile);
                        setCertificateDialogOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4 text-amber-500" />
                      Certificado
                    </Button>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleViewFullHCE(patientFullProfile)}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Ver Historia Clínica Completa
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No se pudo cargar el perfil del paciente</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Nueva Fórmula/Prescripción */}
      <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-green-500" />
              Nueva Fórmula Médica
            </DialogTitle>
            <DialogDescription>
              Seleccione un paciente y agregue los medicamentos de farmacia
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <DoctorPatientSelector
              selectedPatient={prescriptionPatient}
              onSelect={setPrescriptionPatient}
            />

            {prescriptionPatient && (
              <>
                {/* Buscador de medicamentos */}
                <div className="space-y-2 pt-2 border-t">
                  <Label>Agregar Medicamentos de Farmacia</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar medicamento..."
                      value={productoSearch}
                      onChange={(e) => setProductoSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {productoSearch && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {loadingProductos ? (
                        <div className="p-4 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                        </div>
                      ) : filteredProductos.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No se encontraron medicamentos
                        </div>
                      ) : (
                        filteredProductos.slice(0, 10).map((producto) => (
                          <button
                            key={producto.id}
                            onClick={() => handleAddMedicamento(producto)}
                            className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-sm">{producto.nombre}</p>
                              <p className="text-xs text-gray-500">
                                {producto.principioActivo} - {producto.presentacion}
                              </p>
                            </div>
                            <Plus className="h-4 w-4 text-green-500" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Lista de medicamentos seleccionados */}
                {medicamentosSeleccionados.length > 0 && (
                  <div className="space-y-3">
                    <Label>Medicamentos Seleccionados ({medicamentosSeleccionados.length})</Label>
                    {medicamentosSeleccionados.map((med, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-green-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-green-800">{med.nombre}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMedicamento(index)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Dosis (ej: 500mg)"
                            value={med.dosis}
                            onChange={(e) => handleUpdateMedicamento(index, 'dosis', e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Frecuencia (ej: cada 8h)"
                            value={med.frecuencia}
                            onChange={(e) => handleUpdateMedicamento(index, 'frecuencia', e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Select
                            value={med.viaAdministracion}
                            onValueChange={(v) => handleUpdateMedicamento(index, 'viaAdministracion', v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Oral">Oral</SelectItem>
                              <SelectItem value="IV">Intravenosa</SelectItem>
                              <SelectItem value="IM">Intramuscular</SelectItem>
                              <SelectItem value="SC">Subcutánea</SelectItem>
                              <SelectItem value="Topica">Tópica</SelectItem>
                              <SelectItem value="Inhalatoria">Inhalatoria</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Días"
                            value={med.duracionDias}
                            onChange={(e) => handleUpdateMedicamento(index, 'duracionDias', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <Input
                          placeholder="Instrucciones especiales..."
                          value={med.instrucciones}
                          onChange={(e) => handleUpdateMedicamento(index, 'instrucciones', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setPrescriptionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePrescription}
              disabled={creatingPrescription || !prescriptionPatient || medicamentosSeleccionados.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {creatingPrescription ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Crear Fórmula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Orden de Laboratorio */}
      <Dialog open={labOrderDialogOpen} onOpenChange={setLabOrderDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-500" />
              Orden de Laboratorio
            </DialogTitle>
            <DialogDescription>
              Seleccione los exámenes de laboratorio
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <DoctorPatientSelector
              selectedPatient={labPatient}
              onSelect={setLabPatient}
            />

            {labPatient && (
              <>
                <div className="space-y-2 pt-2 border-t">
                  <Label>Exámenes Disponibles</Label>
                  {loadingExamenes ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : examenesLab.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No hay exámenes de laboratorio configurados
                    </div>
                  ) : (
                    <ScrollArea className="h-48 border rounded-lg p-2">
                      <div className="space-y-1">
                        {examenesLab.map((examen) => (
                          <label
                            key={examen.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedExams.some(e => e.id === examen.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExams([...selectedExams, examen]);
                                } else {
                                  setSelectedExams(selectedExams.filter(ex => ex.id !== examen.id));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{examen.nombre}</p>
                              {examen.categoria?.nombre && (
                                <p className="text-xs text-gray-500">{examen.categoria.nombre}</p>
                              )}
                            </div>
                            {examen.costoBase && (
                              <span className="text-xs text-gray-400">
                                ${examen.costoBase.toLocaleString()}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {selectedExams.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedExams.map((exam) => (
                      <Badge key={exam.id} variant="secondary" className="text-xs">
                        {exam.nombre}
                        <button
                          onClick={() => setSelectedExams(selectedExams.filter(e => e.id !== exam.id))}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea
                    placeholder="Indicaciones clínicas..."
                    value={labObservaciones}
                    onChange={(e) => setLabObservaciones(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setLabOrderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateLabOrder}
              disabled={creatingLabOrder || !labPatient || selectedExams.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {creatingLabOrder ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Crear Orden ({selectedExams.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Orden de Imágenes */}
      <Dialog open={imagingOrderDialogOpen} onOpenChange={setImagingOrderDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-indigo-500" />
              Orden de Imágenes Diagnósticas
            </DialogTitle>
            <DialogDescription>
              Seleccione los estudios de imágenes
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <DoctorPatientSelector
              selectedPatient={imagingPatient}
              onSelect={setImagingPatient}
            />

            {imagingPatient && (
              <>
                <div className="space-y-2 pt-2 border-t">
                  <Label>Estudios Disponibles</Label>
                  {loadingExamenes ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : examenesImg.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No hay estudios de imágenes configurados
                    </div>
                  ) : (
                    <ScrollArea className="h-48 border rounded-lg p-2">
                      <div className="space-y-1">
                        {examenesImg.map((estudio) => (
                          <label
                            key={estudio.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudies.some(e => e.id === estudio.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudies([...selectedStudies, estudio]);
                                } else {
                                  setSelectedStudies(selectedStudies.filter(s => s.id !== estudio.id));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{estudio.nombre}</p>
                              {estudio.categoria?.nombre && (
                                <p className="text-xs text-gray-500">{estudio.categoria.nombre}</p>
                              )}
                            </div>
                            {estudio.costoBase && (
                              <span className="text-xs text-gray-400">
                                ${estudio.costoBase.toLocaleString()}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {selectedStudies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedStudies.map((study) => (
                      <Badge key={study.id} variant="secondary" className="text-xs">
                        {study.nombre}
                        <button
                          onClick={() => setSelectedStudies(selectedStudies.filter(s => s.id !== study.id))}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Indicaciones Clínicas</Label>
                  <Textarea
                    placeholder="Motivo del estudio, antecedentes relevantes..."
                    value={imagingObservaciones}
                    onChange={(e) => setImagingObservaciones(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setImagingOrderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateImagingOrder}
              disabled={creatingImagingOrder || !imagingPatient || selectedStudies.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {creatingImagingOrder ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Crear Orden ({selectedStudies.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Certificado Médico */}
      <Dialog open={certificateDialogOpen} onOpenChange={setCertificateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              Certificado Médico
            </DialogTitle>
            <DialogDescription>
              Genere un certificado médico para el paciente
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <DoctorPatientSelector
              selectedPatient={certPatient}
              onSelect={setCertPatient}
            />

            {certPatient && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Tipo de Certificado</Label>
                  <Select value={certTipo} onValueChange={setCertTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Incapacidad">Incapacidad Laboral</SelectItem>
                      <SelectItem value="Aptitud">Aptitud Física</SelectItem>
                      <SelectItem value="Asistencia">Constancia de Asistencia</SelectItem>
                      <SelectItem value="Reposo">Reposo Médico</SelectItem>
                      <SelectItem value="General">Certificado General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Título del Certificado</Label>
                  <Input
                    placeholder="Ej: Certificado de Incapacidad Temporal"
                    value={certTitulo}
                    onChange={(e) => setCertTitulo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Destinatario (opcional)</Label>
                  <Input
                    placeholder="A quien corresponda / Nombre de empresa"
                    value={certDestinatario}
                    onChange={(e) => setCertDestinatario(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contenido del Certificado *</Label>
                  <Textarea
                    placeholder="Escriba el contenido del certificado médico..."
                    value={certContenido}
                    onChange={(e) => setCertContenido(e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setCertificateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCertificate}
              disabled={creatingCert || !certPatient || !certContenido.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {creatingCert ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
              Generar Certificado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
