'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, User, CreditCard, 
  Banknote, Trash2, Plus, Minus, CheckCircle2,
  AlertCircle, PackageX, Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDrogueria } from '@/hooks/useDrogueria';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';

export default function POS({ user }) {
  const { 
    productos, fetchProductos, registrarVenta, 
    cajaActiva, loading 
  } = useDrogueria();

  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ nombre: '', documento: '' });
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [descuentoManual, setDescuentoManual] = useState('0');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProductos({ activo: true });
  }, [fetchProductos]);

  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    if (product.stockActual <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cantidad >= product.stockActual) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...product, cantidad: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cantidad + delta;
        if (newQty < 1) return item;
        if (newQty > item.stockActual) return item;
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.precioVenta * item.cantidad), 0);
  const total = subtotal - parseFloat(descuentoManual || 0);

  const handleFinishSale = async () => {
    if (cart.length === 0) return;
    if (!cajaActiva) {
      alert('Debes abrir la caja antes de realizar una venta');
      return;
    }

    setProcessing(true);
    try {
      const result = await registrarVenta({
        clienteNombre: customer.nombre || 'Consumidor Final',
        clienteDocumento: customer.documento,
        metodoPago,
        descuentoManual: parseFloat(descuentoManual),
        items: cart.map(item => ({
          drogueriaProductoId: item.id,
          cantidad: item.cantidad
        }))
      });

      if (result) {
        setCart([]);
        setCustomer({ nombre: '', documento: '' });
        setDescuentoManual('0');
        fetchProductos({ activo: true }); // Refresh stock
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val);

  if (!cajaActiva) {
    return (
      <div className="h-full flex items-center justify-center p-12 bg-white">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Caja no detectada</h2>
          <p className="text-gray-500 mb-8">
            Para iniciar el punto de venta, primero debes realizar la apertura de caja en la pestaña "Arqueo de Caja".
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
      {/* Search and Products (Left) */}
      <div className="lg:col-span-2 border-r bg-white p-6 flex flex-col h-full overflow-hidden">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="Buscar por nombre, principio activo o SKU..." 
            className="pl-10 h-12 text-lg shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-6">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className={`cursor-pointer group hover:shadow-md transition-all border-2 ${
                  product.stockActual <= 0 ? 'opacity-60 grayscale' : 'hover:border-blue-400'
                }`}
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-gray-500">
                      {product.sku}
                    </Badge>
                    {product.stockActual <= product.stockMinimo && (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-2 min-h-[40px] mb-1">
                    {product.nombre}
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">{product.presentacion || '-'}</p>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Disponible</p>
                      <p className={`text-sm font-bold ${product.stockActual <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {product.stockActual} unds
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-900">
                        {formatCurrency(product.precioVenta)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <PackageX className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400">No se encontraron productos</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Cart and Payment (Right) */}
      <div className="bg-gray-50 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b bg-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" /> Carrito de Venta
          </h3>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {cart.map(item => (
              <Card key={item.id} className="shadow-sm border-none bg-white">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-gray-900 line-clamp-1 flex-1 pr-2">{item.nombre}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 border rounded-lg bg-gray-50 p-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-bold w-6 text-center">{item.cantidad}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{formatCurrency(item.precioVenta)} c/u</p>
                      <p className="font-bold text-gray-900">{formatCurrency(item.precioVenta * item.cantidad)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {cart.length === 0 && (
              <div className="py-20 text-center text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>El carrito está vacío</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Payment Summary */}
        <div className="mt-auto p-6 bg-white border-t space-y-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Nombre Cliente (Opcional)" 
                variant="ghost" 
                className="h-8 text-xs border-none focus-visible:ring-0 p-0"
                value={customer.nombre}
                onChange={(e) => setCustomer({...customer, nombre: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Cédula/NIT" 
                className="h-8 text-xs border-none focus-visible:ring-0 p-0"
                value={customer.documento}
                onChange={(e) => setCustomer({...customer, documento: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 font-medium">Método de Pago</span>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectivo"><span className="flex items-center gap-2"><Banknote className="w-4 h-4" /> Efectivo</span></SelectItem>
                <SelectItem value="Tarjeta"><span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Tarjeta</span></SelectItem>
                <SelectItem value="Transferencia"><span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Transferencia</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-gray-500">
              <span className="text-sm">Subtotal</span>
              <span className="text-sm">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-red-500">
              <span className="text-sm">Descuento</span>
              <div className="flex items-center gap-1">
                <span className="text-sm">-$</span>
                <Input 
                  type="number" 
                  className="h-7 w-20 text-right text-sm border-none bg-red-50 focus-visible:ring-0 p-1"
                  value={descuentoManual}
                  onChange={(e) => setDescuentoManual(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between items-end pt-2">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-3xl font-black text-blue-700">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
            disabled={cart.length === 0 || processing}
            onClick={handleFinishSale}
          >
            {processing ? (
              <Plus className="w-6 h-6 animate-spin" />
            ) : (
              <><CheckCircle2 className="w-6 h-6 mr-2" /> FINALIZAR VENTA</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
