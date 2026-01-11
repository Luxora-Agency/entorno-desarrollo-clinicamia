'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Eye, Download, Stethoscope } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function EnfermedadesTab({ user }) {
  const {
    enfermedades,
    fetchEnfermedades,
    createEnfermedad,
    getEnfermedad,
    descargarFUREL,
    loading
  } = useSST();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEnfermedad, setSelectedEnfermedad] = useState(null);

  useEffect(() => {
    fetchEnfermedades({ search });
  }, [search, fetchEnfermedades]);

  const handleDescargarFUREL = async (id) => {
    const blob = await descargarFUREL(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FUREL_${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Enfermedades Laborales</h2>
          <p className="text-sm text-gray-500">Registro de EL con codigo CIE-10</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Enfermedad
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por empleado, CIE-10..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha Dx</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>CIE-10</TableHead>
                <TableHead>Enfermedad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>FUREL</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : enfermedades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No hay enfermedades laborales registradas
                  </TableCell>
                </TableRow>
              ) : (
                enfermedades.map((enfermedad) => (
                  <TableRow key={enfermedad.id}>
                    <TableCell>
                      {new Date(enfermedad.fechaDiagnostico).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {enfermedad.empleado?.nombre} {enfermedad.empleado?.apellido}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{enfermedad.codigoCIE10}</Badge>
                    </TableCell>
                    <TableCell>{enfermedad.nombreEnfermedad}</TableCell>
                    <TableCell>
                      <Badge variant={enfermedad.estado === 'CALIFICADA' ? 'success' : 'secondary'}>
                        {enfermedad.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {enfermedad.furelGenerado ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDescargarFUREL(enfermedad.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEnfermedad(enfermedad)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Enfermedad Laboral</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Formulario de registro de enfermedad laboral</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
