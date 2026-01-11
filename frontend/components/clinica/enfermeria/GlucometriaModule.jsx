'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Activity, Plus, AlertTriangle, Droplet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function GlucometriaModule({ pacienteId, admisionId }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [glucometrias, setGlucometrias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    valor: '',
    momento: 'Ayunas',
    insulinaAdministrada: '',
    observaciones: ''
  });

  useEffect(() => {
    if (pacienteId) {
      loadGlucometrias();
    }
  }, [pacienteId]);

  const loadGlucometrias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/glucometrias?pacienteId=${pacienteId}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGlucometrias(data.data.data.reverse()); // Reverse for chart
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/glucometrias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pacienteId,
          admisionId,
          valor: parseInt(form.valor),
          momento: form.momento,
          insulinaAdministrada: form.insulinaAdministrada ? parseFloat(form.insulinaAdministrada) : null,
          observaciones: form.observaciones
        })
      });

      if (response.ok) {
        toast({ description: 'Glucometría registrada' });
        setShowModal(false);
        setForm({ valor: '', momento: 'Ayunas', insulinaAdministrada: '', observaciones: '' });
        loadGlucometrias();
      } else {
        toast({ description: 'Error al registrar', variant: 'destructive' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (valor) => {
    if (valor < 70) return 'text-red-600 bg-red-100';
    if (valor > 180) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Droplet className="w-5 h-5 text-teal-600" />
          Control de Glucometrías
        </h3>
        <Button onClick={() => setShowModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Glucometría
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Histórico Gráfico</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={glucometrias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fechaRegistro" 
                  tickFormatter={(val) => new Date(val).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                />
                <YAxis domain={[40, 400]} />
                <Tooltip labelFormatter={(val) => new Date(val).toLocaleString()} />
                <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" />
                <ReferenceLine y={180} stroke="orange" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="valor" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Últimos Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Momento</TableHead>
                  <TableHead>Insulina</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...glucometrias].reverse().slice(0, 5).map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>{new Date(g.fechaRegistro).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(g.valor)}>
                        {g.valor} mg/dL
                      </Badge>
                    </TableCell>
                    <TableCell>{g.momento}</TableCell>
                    <TableCell>{g.insulinaAdministrada ? `${g.insulinaAdministrada} U` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Glucometría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor (mg/dL)</Label>
              <Input 
                type="number" 
                value={form.valor} 
                onChange={(e) => setForm({...form, valor: e.target.value})}
                placeholder="Ej: 110"
              />
            </div>
            <div>
              <Label>Momento</Label>
              <Select value={form.momento} onValueChange={(val) => setForm({...form, momento: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ayunas">Ayunas</SelectItem>
                  <SelectItem value="Pre-prandial">Pre-prandial (Antes de comer)</SelectItem>
                  <SelectItem value="Post-prandial">Post-prandial (Después de comer)</SelectItem>
                  <SelectItem value="Random">Al azar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Insulina Administrada (Unidades) - Opcional</Label>
              <Input 
                type="number" 
                value={form.insulinaAdministrada} 
                onChange={(e) => setForm({...form, insulinaAdministrada: e.target.value})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Input 
                value={form.observaciones} 
                onChange={(e) => setForm({...form, observaciones: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
