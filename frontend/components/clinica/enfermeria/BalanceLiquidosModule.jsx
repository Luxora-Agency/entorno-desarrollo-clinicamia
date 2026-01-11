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
import { Plus, Droplets, ArrowDown, ArrowUp } from 'lucide-react';

export default function BalanceLiquidosModule({ pacienteId, admisionId }) {
  const { toast } = useToast();
  const [balance, setBalance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [periodo, setPeriodo] = useState('24'); // horas
  const [form, setForm] = useState({
    tipo: 'Ingreso',
    via: 'Oral',
    cantidad: '',
    fluido: '',
    observaciones: ''
  });

  useEffect(() => {
    if (admisionId) {
      loadBalance();
    }
  }, [admisionId, periodo]);

  const loadBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/balance-liquidos/balance/${admisionId}?hours=${periodo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBalance(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/balance-liquidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pacienteId,
          admisionId,
          tipo: form.tipo,
          via: form.via,
          cantidad: parseFloat(form.cantidad),
          fluido: form.fluido,
          observaciones: form.observaciones
        })
      });

      if (response.ok) {
        toast({ description: 'Registro guardado' });
        setShowModal(false);
        setForm({ tipo: 'Ingreso', via: 'Oral', cantidad: '', fluido: '', observaciones: '' });
        loadBalance();
      } else {
        toast({ description: 'Error al registrar', variant: 'destructive' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const viasIngreso = ['Oral', 'Intravenosa', 'Sonda Nasogástrica', 'Enteral', 'Parenteral'];
  const viasEgreso = ['Orina', 'Heces', 'Vómito', 'Drenaje', 'Sonda Vesical', 'Pérdidas Insensibles'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-600" />
          Balance de Líquidos
        </h3>
        <div className="flex gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="6">Últimas 6h</SelectItem>
                    <SelectItem value="12">Últimas 12h</SelectItem>
                    <SelectItem value="24">Últimas 24h</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Registrar
            </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 flex flex-col items-center">
            <span className="text-sm font-medium text-blue-600 mb-1">Total Ingresos</span>
            <span className="text-3xl font-bold text-blue-700 flex items-center gap-2">
                <ArrowUp className="w-6 h-6" />
                {balance?.ingresos || 0} ml
            </span>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6 flex flex-col items-center">
            <span className="text-sm font-medium text-orange-600 mb-1">Total Egresos</span>
            <span className="text-3xl font-bold text-orange-700 flex items-center gap-2">
                <ArrowDown className="w-6 h-6" />
                {balance?.egresos || 0} ml
            </span>
          </CardContent>
        </Card>
        <Card className={`${(balance?.balanceTotal || 0) > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <CardContent className="p-6 flex flex-col items-center">
            <span className="text-sm font-medium text-gray-600 mb-1">Balance Total</span>
            <span className={`text-3xl font-bold ${(balance?.balanceTotal || 0) > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {balance?.balanceTotal > 0 ? '+' : ''}{balance?.balanceTotal || 0} ml
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="text-sm">Detalle de Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Hora</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Vía</TableHead>
                          <TableHead>Fluido</TableHead>
                          <TableHead className="text-right">Cantidad (ml)</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {balance?.movimientos?.map(m => (
                          <TableRow key={m.id}>
                              <TableCell>{new Date(m.fechaRegistro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                              <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${m.tipo === 'Ingreso' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                      {m.tipo}
                                  </span>
                              </TableCell>
                              <TableCell>{m.via}</TableCell>
                              <TableCell>{m.fluido || '-'}</TableCell>
                              <TableCell className="text-right font-mono">{m.cantidad}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Líquidos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
                <Button 
                    variant={form.tipo === 'Ingreso' ? 'default' : 'outline'}
                    className={`flex-1 ${form.tipo === 'Ingreso' ? 'bg-blue-600' : ''}`}
                    onClick={() => setForm({...form, tipo: 'Ingreso', via: 'Oral'})}
                >
                    Ingreso
                </Button>
                <Button 
                    variant={form.tipo === 'Egreso' ? 'default' : 'outline'}
                    className={`flex-1 ${form.tipo === 'Egreso' ? 'bg-orange-600' : ''}`}
                    onClick={() => setForm({...form, tipo: 'Egreso', via: 'Orina'})}
                >
                    Egreso
                </Button>
            </div>

            <div>
              <Label>Vía</Label>
              <Select value={form.via} onValueChange={(val) => setForm({...form, via: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(form.tipo === 'Ingreso' ? viasIngreso : viasEgreso).map(via => (
                      <SelectItem key={via} value={via}>{via}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cantidad (ml)</Label>
              <Input 
                type="number" 
                value={form.cantidad} 
                onChange={(e) => setForm({...form, cantidad: e.target.value})}
                placeholder="Ej: 250"
              />
            </div>
            <div>
              <Label>Fluido / Detalle</Label>
              <Input 
                value={form.fluido} 
                onChange={(e) => setForm({...form, fluido: e.target.value})}
                placeholder={form.tipo === 'Ingreso' ? 'Ej: Jugo de Naranja' : 'Ej: Orina clara'}
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
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
