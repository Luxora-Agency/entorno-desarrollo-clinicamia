'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, Banknote, History, ArrowUpCircle, 
  ArrowDownCircle, Calculator, CheckCircle2,
  AlertTriangle, Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDrogueria } from '@/hooks/useDrogueria';
import { formatDateLong } from '@/lib/dateUtils';

export default function CajaManager({ user }) {
  const { 
    cajaActiva, fetchCajaActiva, abrirCaja, cerrarCaja, loading 
  } = useDrogueria();

  const [montoInicial, setMontoInicial] = useState('0');
  const [montoFinal, setMontoFinal] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchCajaActiva();
  }, [fetchCajaActiva]);

  const handleAbrir = async () => {
    await abrirCaja(parseFloat(montoInicial));
    setMontoInicial('0');
  };

  const handleCerrar = async () => {
    if (!montoFinal) return;
    await cerrarCaja(parseFloat(montoFinal));
    setMontoFinal('');
    setShowConfirmation(false);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val);

  if (loading) return <div className="p-12 text-center text-gray-400">Cargando información de caja...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!cajaActiva ? (
        <Card className="shadow-lg border-t-4 border-blue-600">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Apertura de Caja</CardTitle>
            <p className="text-gray-500">Inicie una nueva sesión de venta indicando el monto base en efectivo.</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="max-w-xs mx-auto space-y-4">
              <div className="space-y-2">
                <Label className="font-bold text-gray-700">Monto Inicial en Efectivo (Base)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <Input 
                    type="number" 
                    className="pl-8 h-12 text-lg font-bold" 
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)}
                  />
                </div>
              </div>
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold" onClick={handleAbrir}>
                ABRIR CAJA AHORA
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Session Info */}
          <Card className="shadow-md border-none">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-t-xl py-4">
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Sesión Activa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white rounded-b-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Apertura</p>
                  <p className="font-semibold text-gray-900">{formatDateLong(cajaActiva.fechaApertura).fecha}</p>
                  <p className="text-xs text-gray-500">{new Date(cajaActiva.fechaApertura).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Responsable</p>
                  <p className="font-semibold text-gray-900">{user.nombre} {user.apellido}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Base Inicial</span>
                  <span className="font-bold text-gray-900">{formatCurrency(cajaActiva.montoInicial)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="text-sm font-medium">Ventas Efectivo</span>
                  <span className="font-bold">+{formatCurrency(0)}</span> {/* TODO: Link sales stats */}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Efectivo Esperado</span>
                  <span className="text-xl font-black text-gray-900">{formatCurrency(cajaActiva.montoInicial)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Close Box Form */}
          <Card className="shadow-md border-none">
            <CardHeader className="py-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <Calculator className="w-5 h-5 text-blue-600" /> Arqueo y Cierre
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Cuente el efectivo físico en caja y regístrelo para finalizar la sesión.
              </p>
              <div className="space-y-2">
                <Label className="font-bold">Efectivo Físico en Caja</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <Input 
                    type="number" 
                    className="pl-8 h-12 text-lg font-bold" 
                    placeholder="Ingrese el monto total contado"
                    value={montoFinal}
                    onChange={(e) => setMontoFinal(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-12 bg-red-600 hover:bg-red-700 font-bold" 
                variant="destructive"
                disabled={!montoFinal}
                onClick={() => setShowConfirmation(true)}
              >
                CERRAR CAJA Y GENERAR ARQUEO
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-amber-500" /> ¿Confirmar Cierre?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Al cerrar la caja se registrará el arqueo final. Esta acción no se puede deshacer.
              </p>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Monto a registrar:</p>
                <p className="text-xl font-bold">{formatCurrency(parseFloat(montoFinal))}</p>
              </div>
            </CardContent>
            <CardFooter className="gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirmation(false)}>Cancelar</Button>
              <Button className="bg-red-600 flex-1" onClick={handleCerrar}>Sí, Cerrar Caja</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
