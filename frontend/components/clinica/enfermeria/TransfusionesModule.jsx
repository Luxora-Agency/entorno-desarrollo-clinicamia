'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Droplet, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TransfusionesModule({ pacienteId, admisionId }) {
  const { toast } = useToast();
  const [transfusiones, setTransfusiones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    hemocomponente: '',
    grupoSanguineo: '',
    rh: '',
    volumen: '',
    loteBolsa: '',
    velocidad: '',
    observaciones: ''
  });

  useEffect(() => {
    if (admisionId) {
      loadTransfusiones();
    }
  }, [admisionId]);

  const loadTransfusiones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transfusiones?admisionId=${admisionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTransfusiones(data.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transfusiones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pacienteId,
          admisionId,
          hemocomponente: form.hemocomponente,
          grupoSanguineo: form.grupoSanguineo,
          rh: form.rh,
          volumen: parseFloat(form.volumen),
          loteBolsa: form.loteBolsa,
          velocidad: form.velocidad,
          observaciones: form.observaciones
        })
      });

      if (response.ok) {
        toast({ description: 'Transfusión registrada' });
        setShowModal(false);
        loadTransfusiones();
      } else {
        toast({ description: 'Error al registrar', variant: 'destructive' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleVerify = async (id) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transfusiones/${id}/verify`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
  
        if (response.ok) {
          toast({ description: 'Verificación registrada' });
          loadTransfusiones();
        }
      } catch (error) {
        console.error(error);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Droplet className="w-5 h-5 text-red-600" />
          Control de Transfusiones
        </h3>
        <Button onClick={() => setShowModal(true)} className="bg-red-600 hover:bg-red-700">
          Nueva Transfusión
        </Button>
      </div>

      <div className="space-y-4">
        {transfusiones.map(t => (
            <Card key={t.id} className="border-l-4 border-red-500">
                <CardHeader className="pb-2">
                    <div className="flex justify-between">
                        <CardTitle className="text-base font-bold text-gray-800">
                            {t.hemocomponente} - {t.volumen} ml
                        </CardTitle>
                        <Badge variant={t.fechaFin ? "outline" : "default"} className={!t.fechaFin ? "bg-red-600" : ""}>
                            {t.fechaFin ? 'Finalizada' : 'En Curso'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                            <p className="text-gray-500">Grupo/Rh</p>
                            <p className="font-medium">{t.grupoSanguineo} {t.rh}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Lote Bolsa</p>
                            <p className="font-medium">{t.loteBolsa}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Velocidad</p>
                            <p className="font-medium">{t.velocidad || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Inicio</p>
                            <p className="font-medium">{new Date(t.fechaInicio).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Registrado por:</span>
                                <span className="text-sm font-medium">{t.registrador?.nombre} {t.registrador?.apellido}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Verificado por:</span>
                                {t.verificador ? (
                                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        {t.verificador.nombre} {t.verificador.apellido}
                                    </span>
                                ) : (
                                    <span className="text-sm text-orange-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Pendiente
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {!t.verificador && (
                            <Button size="sm" variant="outline" onClick={() => handleVerify(t.id)}>
                                Verificar (Doble Chequeo)
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Transfusión</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Hemocomponente</Label>
              <Input 
                value={form.hemocomponente} 
                onChange={(e) => setForm({...form, hemocomponente: e.target.value})}
                placeholder="Ej: Glóbulos Rojos Empaquetados"
              />
            </div>
            <div>
              <Label>Grupo Sanguíneo</Label>
              <Input 
                value={form.grupoSanguineo} 
                onChange={(e) => setForm({...form, grupoSanguineo: e.target.value})}
                placeholder="Ej: O, A, B, AB"
              />
            </div>
            <div>
              <Label>Rh</Label>
              <Input 
                value={form.rh} 
                onChange={(e) => setForm({...form, rh: e.target.value})}
                placeholder="Ej: +, -"
              />
            </div>
            <div>
              <Label>Volumen (ml)</Label>
              <Input 
                type="number"
                value={form.volumen} 
                onChange={(e) => setForm({...form, volumen: e.target.value})}
              />
            </div>
            <div>
              <Label>Lote Bolsa</Label>
              <Input 
                value={form.loteBolsa} 
                onChange={(e) => setForm({...form, loteBolsa: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <Label>Velocidad / Goteo</Label>
              <Input 
                value={form.velocidad} 
                onChange={(e) => setForm({...form, velocidad: e.target.value})}
                placeholder="Ej: 20 gotas/min"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">Registrar Inicio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
