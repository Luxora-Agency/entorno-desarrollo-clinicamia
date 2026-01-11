'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Users, Phone, Mail, Calendar, MapPin, Activity, Power, Eye, Download, X, ChevronLeft, ChevronRight, AlertTriangle, Heart, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { formatDateLong } from '@/lib/dateUtils';
import PacienteStepperForm from './PacienteStepperForm';
import VerPaciente from './VerPaciente';

export default function PacientesModule({ user }) {
  const router = useRouter();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [viewingPaciente, setViewingPaciente] = useState(null);

  // Filtros y paginación
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Debounce para búsqueda (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!showForm) {
      loadPacientes();
    }
  }, [debouncedSearch, showForm]);

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

  // Filtrar pacientes según el estado seleccionado
  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter(p => {
      if (filtroEstado === 'activos') return p.activo === true;
      if (filtroEstado === 'inactivos') return p.activo === false;
      return true;
    });
  }, [pacientes, filtroEstado]);

  // Paginación
  const totalPages = Math.ceil(pacientesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pacientesPaginados = pacientesFiltrados.slice(startIndex, endIndex);

  // Resetear página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroEstado, debouncedSearch]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = pacientes.length;
    const activos = pacientes.filter(p => p.activo === true).length;
    const inactivos = pacientes.filter(p => p.activo === false).length;

    // Calcular nuevos este mes
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nuevosEsteMes = pacientes.filter(p => {
      const createdAt = new Date(p.createdAt);
      return createdAt >= firstDayOfMonth;
    }).length;

    // Calcular tendencia (comparar con mes anterior)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const nuevosMesAnterior = pacientes.filter(p => {
      const createdAt = new Date(p.createdAt);
      return createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth;
    }).length;
    const tendencia = nuevosEsteMes - nuevosMesAnterior;

    return { total, activos, inactivos, nuevosEsteMes, tendencia };
  }, [pacientes]);

  // Exportar a Excel/CSV
  const handleExport = useCallback(() => {
    const headers = ['Nombre', 'Apellido', 'Cédula', 'Teléfono', 'Email', 'Género', 'Fecha Nacimiento', 'Tipo Sangre', 'Estado'];
    const rows = pacientesFiltrados.map(p => [
      p.nombre || '',
      p.apellido || '',
      p.cedula || '',
      p.telefono || '',
      p.email || '',
      p.genero || '',
      p.fechaNacimiento ? p.fechaNacimiento.split('T')[0] : '',
      p.tipoSangre || '',
      p.activo ? 'Activo' : 'Inactivo'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pacientes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [pacientesFiltrados]);

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
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
          router.push('?module=pacientes');
        }}
        onSuccess={() => {
          router.push('?module=pacientes');
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
          onClick={() => router.push('?module=agregar-paciente')}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Search mejorado */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <Input
              placeholder="Buscar por nombre, apellido, cédula, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 flex-1"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2.5 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2.5 rounded-xl">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2.5 rounded-xl">
                <Power className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Inactivos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2.5 rounded-xl">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Este mes</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stats.nuevosEsteMes}</p>
                  {stats.tendencia !== 0 && (
                    <span className={`flex items-center text-xs font-medium ${stats.tendencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.tendencia > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {Math.abs(stats.tendencia)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table con barra de herramientas */}
      <Card className="shadow-sm overflow-hidden">
        {/* Barra de herramientas sticky */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filtros */}
            <div className="flex items-center gap-4">
              <Tabs value={filtroEstado} onValueChange={setFiltroEstado} className="w-auto">
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="todos" className="data-[state=active]:bg-white">
                    Todos ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="activos" className="data-[state=active]:bg-white data-[state=active]:text-green-600">
                    Activos ({stats.activos})
                  </TabsTrigger>
                  <TabsTrigger value="inactivos" className="data-[state=active]:bg-white data-[state=active]:text-gray-600">
                    Inactivos ({stats.inactivos})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Contador de resultados filtrados */}
              <span className="text-sm text-gray-500 hidden md:inline">
                Mostrando {pacientesPaginados.length} de {pacientesFiltrados.length}
              </span>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Mostrar:</span>
                <Select value={String(itemsPerPage)} onValueChange={(val) => {setItemsPerPage(Number(val)); setCurrentPage(1);}}>
                  <SelectTrigger className="w-20 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-9"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-3 text-gray-500">Cargando pacientes...</span>
            </div>
          ) : pacientesFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2 text-lg">
                {search ? 'No se encontraron resultados' : 'No hay pacientes registrados'}
              </p>
              <p className="text-gray-400 mb-6">
                {search ? `No hay coincidencias para "${search}"` : 'Comienza agregando tu primer paciente'}
              </p>
              {!search && (
                <Button onClick={() => router.push('?module=agregar-paciente')} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Paciente
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 sticky top-0">
                      <TableHead className="font-semibold text-gray-700">Paciente</TableHead>
                      <TableHead className="font-semibold text-gray-700">Cédula</TableHead>
                      <TableHead className="font-semibold text-gray-700">Contacto</TableHead>
                      <TableHead className="font-semibold text-gray-700">Edad</TableHead>
                      <TableHead className="font-semibold text-gray-700">Sangre</TableHead>
                      <TableHead className="font-semibold text-gray-700">Alertas</TableHead>
                      <TableHead className="font-semibold text-gray-700">Última Consulta</TableHead>
                      <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center w-32">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientesPaginados.map((paciente) => {
                      const tieneAlergias = paciente.alergias && paciente.alergias !== '[]' && paciente.alergias.length > 0;
                      const tieneCronico = paciente.enfermedadesCronicas && paciente.enfermedadesCronicas !== '[]' && paciente.enfermedadesCronicas.length > 0;

                      return (
                        <TableRow
                          key={paciente.id}
                          className={`hover:bg-emerald-50/50 transition-colors cursor-pointer ${!paciente.activo ? 'opacity-60 bg-gray-50' : ''}`}
                          onClick={() => router.push(`?module=pacientes&pacienteId=${paciente.id}`)}
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                                {paciente.nombre?.charAt(0)}{paciente.apellido?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{paciente.nombre} {paciente.apellido}</p>
                                <p className="text-xs text-gray-500">{paciente.genero || 'Sin género'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-700 font-mono text-sm">{paciente.cedula || '-'}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-700 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {paciente.telefono || '-'}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                {paciente.email || 'Sin email'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {paciente.fechaNacimiento ? (
                              <div>
                                <p className="font-medium">{calcularEdad(paciente.fechaNacimiento)}</p>
                                <p className="text-xs text-gray-500">{formatDateLong(paciente.fechaNacimiento).fecha}</p>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {paciente.tipoSangre ? (
                              <Badge className="bg-red-50 text-red-700 border border-red-200 font-bold">
                                {paciente.tipoSangre}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {tieneAlergias && (
                                <Badge variant="destructive" className="text-xs flex items-center gap-1 animate-pulse">
                                  <AlertTriangle className="w-3 h-3" />
                                </Badge>
                              )}
                              {tieneCronico && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                </Badge>
                              )}
                              {!tieneAlergias && !tieneCronico && (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm">
                            {paciente.ultimaConsulta ? (
                              <span>{formatDateLong(paciente.ultimaConsulta).fecha}</span>
                            ) : (
                              <span className="text-gray-400">Sin consultas</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${paciente.activo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {paciente.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => router.push(`?module=pacientes&pacienteId=${paciente.id}`)}
                                className="h-8 w-8 p-0 hover:bg-emerald-100 hover:text-emerald-600"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => router.push(`?module=agregar-paciente&pacienteId=${paciente.id}`)}
                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                title="Editar paciente"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleActivo(paciente.id, paciente.activo)}
                                className={`h-8 w-8 p-0 ${paciente.activo ? "hover:bg-red-100 hover:text-red-600" : "hover:bg-green-100 hover:text-green-600"}`}
                                title={paciente.activo ? "Inactivar" : "Activar"}
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

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4 bg-gray-50/50">
                  <p className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages} ({pacientesFiltrados.length} pacientes)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>

                    {/* Números de página */}
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
