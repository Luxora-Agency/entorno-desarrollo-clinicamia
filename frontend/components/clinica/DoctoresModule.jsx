'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, UserCog, Phone, Mail, Clock } from 'lucide-react';

export default function DoctoresModule({ user, onEdit, onAdd }) {
  const [doctores, setDoctores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingHorarios, setEditingHorarios] = useState(null);
  const [horarios, setHorarios] = useState({});

  useEffect(() => {
    loadDoctores();
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDoctores = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/doctores?search=${search}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDoctores(data.data || []);
    } catch (error) {
      console.error('Error loading doctores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctores = doctores.filter(doctor =>
    `${doctor.nombre} ${doctor.apellido} ${doctor.cedula} ${doctor.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Obtener resumen de próximos 3 días de horarios
  const getResumenHorarios = (horarios) => {
    if (!horarios || Object.keys(horarios).length === 0) return 'Sin horarios';
    
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    const proximos3Dias = [];
    
    for (let i = 0; i < 3; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      if (horarios[fechaStr] && Array.isArray(horarios[fechaStr]) && horarios[fechaStr].length > 0) {
        const horariosDelDia = horarios[fechaStr];
        const diaNombre = diasSemana[fecha.getDay()].substring(0, 3);
        const horarioTexto = horariosDelDia.map(h => `${h.inicio}-${h.fin}`).join(', ');
        proximos3Dias.push(`${diaNombre}: ${horarioTexto}`);
      }
    }
    
    return proximos3Dias.length > 0 ? proximos3Dias.join(' | ') : 'Sin horarios próximos';
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este doctor?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/doctores/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadDoctores();
    } catch (error) {
      console.error('Error deleting doctor:', error);
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <UserCog className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Doctores</h1>
          </div>
          <p className="text-gray-600 ml-14">Gestiona el equipo médico de la clínica</p>
        </div>
        <Button onClick={onAdd} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Doctor
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, cédula o especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Lista de Doctores ({filteredDoctores.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500 text-sm sm:text-base">Cargando...</p>
          ) : filteredDoctores.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm sm:text-base mb-4">No hay doctores registrados</p>
              <Button onClick={onAdd} className="bg-teal-500 hover:bg-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Doctor
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Doctor</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Cédula</TableHead>
                      <TableHead className="text-xs sm:text-sm">Especialidades</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden xl:table-cell">Horarios</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Contacto</TableHead>
                      <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctores.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                              <UserCog className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="font-semibold">Dr. {doctor.nombre} {doctor.apellido}</div>
                              <div className="text-xs text-gray-500">{doctor.licenciaMedica || 'Sin licencia'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">{doctor.cedula}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex flex-wrap gap-1">
                            {doctor.especialidades?.slice(0, 2).map((esp, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                {esp}
                              </Badge>
                            ))}
                            {doctor.especialidades?.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{doctor.especialidades.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden xl:table-cell">
                          <div 
                            onClick={() => onEdit(doctor)}
                            className="cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
                          >
                            <div className="flex items-center gap-1 text-blue-600 mb-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">Horarios</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {getResumenHorarios(doctor.horarios)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                          <div className="space-y-1">
                            {doctor.telefono && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="w-3 h-3" />
                                {doctor.telefono}
                              </div>
                            )}
                            {doctor.email && (
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="w-3 h-3" />
                                {doctor.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${doctor.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} text-xs`}>
                            {doctor.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(doctor)}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-9 sm:w-9"
                              onClick={() => handleDelete(doctor.id)}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Editar Horarios */}
      <Dialog open={!!editingHorarios} onOpenChange={() => setEditingHorarios(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Horarios de Atención - Dr. {editingHorarios?.nombre} {editingHorarios?.apellido}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => (
              <div key={dia} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-medium text-gray-900">{dia}</label>
                  <input
                    type="checkbox"
                    checked={!!horarios[dia]}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setHorarios({...horarios, [dia]: {inicio: '08:00', fin: '17:00'}});
                      } else {
                        const newHorarios = {...horarios};
                        delete newHorarios[dia];
                        setHorarios(newHorarios);
                      }
                    }}
                    className="w-4 h-4"
                  />
                </div>
                {horarios[dia] && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Hora Inicio</label>
                      <input
                        type="time"
                        value={horarios[dia]?.inicio || '08:00'}
                        onChange={(e) => setHorarios({
                          ...horarios,
                          [dia]: {...horarios[dia], inicio: e.target.value}
                        })}
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Hora Fin</label>
                      <input
                        type="time"
                        value={horarios[dia]?.fin || '17:00'}
                        onChange={(e) => setHorarios({
                          ...horarios,
                          [dia]: {...horarios[dia], fin: e.target.value}
                        })}
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => setEditingHorarios(null)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
                    const response = await fetch(`${apiUrl}/doctores/${editingHorarios.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ horarios })
                    });
                    
                    if (response.ok) {
                      alert('Horarios actualizados correctamente');
                      setEditingHorarios(null);
                      loadDoctores();
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    alert('Error al actualizar horarios');
                  }
                }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                Guardar Horarios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
