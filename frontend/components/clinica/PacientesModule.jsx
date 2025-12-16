'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, Calendar, MapPin, Activity, Power, Eye } from 'lucide-react';
import { formatDateLong } from '@/lib/dateUtils';
import PacienteStepperForm from './PacienteStepperForm';
import VerPaciente from './VerPaciente';

export default function PacientesModule({ user }) {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [viewingPaciente, setViewingPaciente] = useState(null);

  useEffect(() => {
    if (!showForm) {
      loadPacientes();
    }
  }, [search, showForm]);

  const loadPacientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/pacientes?search=${search}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPacientes(data.data || []);
    } catch (error) {
      console.error('Error loading pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este paciente?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/pacientes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadPacientes();
    } catch (error) {
      console.error('Error deleting paciente:', error);
    }
  };

  const handleToggleActivo = async (id, activo) => {
    const mensaje = activo 
      ? '¿Está seguro de inactivar este paciente?' 
      : '¿Está seguro de activar este paciente?';
    
    if (!confirm(mensaje)) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/pacientes/${id}/toggle-activo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        loadPacientes();
      }
    } catch (error) {
      console.error('Error toggling paciente estado:', error);
    }
  };

  const calcularIMC = (peso, altura) => {
    if (!peso || !altura) return '-';
    // Altura está en metros en la BD
    const imc = peso / (altura ** 2);
    return imc.toFixed(1);
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '-';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  };

  const getIMCColor = (imc) => {
    if (imc === '-') return 'bg-gray-100 text-gray-700';
    const valor = parseFloat(imc);
    if (valor < 18.5) return 'bg-blue-100 text-blue-700';
    if (valor < 25) return 'bg-green-100 text-green-700';
    if (valor < 30) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (viewingPaciente) {
    return (
      <VerPaciente
        pacienteId={viewingPaciente}
        onBack={() => setViewingPaciente(null)}
      />
    );
  }

  if (showForm) {
    return (
      <PacienteStepperForm
        user={user}
        editingPaciente={editingPaciente}
        onBack={() => {
          setShowForm(false);
          setEditingPaciente(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setEditingPaciente(null);
          loadPacientes();
        }}
      />
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
          </div>
          <p className="text-gray-600 ml-14">Administra los pacientes de la clínica</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, cédula, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">{pacientes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{pacientes.filter(p => p.estado === 'Activo').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nuevos este mes</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Cargando...</p>
          ) : pacientes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No hay pacientes registrados</p>
              <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Paciente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">Paciente</TableHead>
                    <TableHead className="font-bold">Cédula</TableHead>
                    <TableHead className="font-bold">Teléfono</TableHead>
                    <TableHead className="font-bold">Género</TableHead>
                    <TableHead className="font-bold">F. Nacimiento</TableHead>
                    <TableHead className="font-bold">Tipo Sangre</TableHead>
                    <TableHead className="font-bold">Dirección</TableHead>
                    <TableHead className="font-bold">Datos Médicos</TableHead>
                    <TableHead className="font-bold">Última Consulta</TableHead>
                    <TableHead className="font-bold">Estado</TableHead>
                    <TableHead className="font-bold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pacientes.map((paciente) => {
                    const imc = calcularIMC(paciente.peso, paciente.altura);
                    return (
                      <TableRow key={paciente.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-bold text-gray-900">{paciente.nombre} {paciente.apellido}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" />
                              {paciente.email || 'Sin email'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{paciente.cedula || '-'}</TableCell>
                        <TableCell className="text-gray-600">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {paciente.telefono || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{paciente.genero || '-'}</TableCell>
                        <TableCell className="text-gray-600">
                          {paciente.fechaNacimiento ? (
                            <div>
                              <p className="font-semibold">{formatDateLong(paciente.fechaNacimiento).fecha}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{calcularEdad(paciente.fechaNacimiento)}</p>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {paciente.tipoSangre ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200">{paciente.tipoSangre}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-600 max-w-[150px] truncate">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {paciente.direccion || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-gray-600">Peso: <strong>{paciente.peso ? `${paciente.peso} kg` : '-'}</strong></p>
                            <p className="text-gray-600">Altura: <strong>{paciente.altura ? `${paciente.altura} m` : '-'}</strong></p>
                            <Badge className={`mt-1 ${getIMCColor(imc)}`}>
                              IMC: {imc}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {paciente.ultimaConsulta ? formatDateLong(paciente.ultimaConsulta).fecha : 'Sin consultas'}
                        </TableCell>
                        <TableCell>
                          <Badge className={paciente.activo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                            {paciente.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setViewingPaciente(paciente.id)}
                              className="hover:bg-emerald-50 hover:text-emerald-600"
                              title="Ver detalles del paciente"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingPaciente(paciente);
                                setShowForm(true);
                              }}
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActivo(paciente.id, paciente.activo)}
                              className={paciente.activo ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-green-50 hover:text-green-600"}
                              title={paciente.activo ? "Inactivar paciente" : "Activar paciente"}
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
