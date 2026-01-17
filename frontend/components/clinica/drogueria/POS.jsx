'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingCart, User, CreditCard, Banknote, Trash2, Plus, Minus,
  CheckCircle2, PackageX, Wallet, Clock, Loader2, Upload, Building2,
  UserPlus, X, Phone, Mail, Hash, ChevronDown, ChevronUp, LogOut,
  RotateCcw, RefreshCw, Receipt, AlertTriangle, ArrowRightLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDrogueria } from '@/hooks/useDrogueria';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from '@/components/ui/collapsible';

// Bancos colombianos comunes
const BANCOS_COLOMBIA = [
  'Bancolombia', 'Davivienda', 'BBVA', 'Banco de Bogotá', 'Banco de Occidente',
  'Banco Popular', 'Banco Caja Social', 'Banco Falabella', 'Nequi', 'Daviplata',
  'Banco Agrario', 'Scotiabank', 'Citibank', 'Itaú', 'Otro'
];

const METODOS_PAGO = [
  { id: 'Efectivo', label: 'Efectivo', icon: Banknote, color: 'emerald' },
  { id: 'Tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'blue' },
  { id: 'Transferencia', label: 'Transfer.', icon: Building2, color: 'purple' }
];

export default function POS({ user }) {
  const {
    productos, fetchProductos, registrarVenta,
    cajaActiva, fetchCajaActiva, abrirCaja, cerrarCaja,
    anularVenta, fetchVentas, ventas, loading,
    buscarClientePorCedula, crearCliente
  } = useDrogueria();

  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [descuentoManual, setDescuentoManual] = useState('0');
  const [processing, setProcessing] = useState(false);

  // Caja
  const [montoInicial, setMontoInicial] = useState('100000');
  const [nombreCaja, setNombreCaja] = useState('Caja Principal');

  // Cliente
  const [cedulaCliente, setCedulaCliente] = useState('');
  const [cliente, setCliente] = useState(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [showCrearCliente, setShowCrearCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ cedula: '', nombres: '', apellidos: '', telefono: '', email: '' });

  // Pagos combinados
  const [metodosSeleccionados, setMetodosSeleccionados] = useState({
    Efectivo: { activo: true, monto: 0 },
    Tarjeta: { activo: false, monto: 0 },
    Transferencia: { activo: false, monto: 0 }
  });

  // Transferencia
  const [referenciaTransferencia, setReferenciaTransferencia] = useState('');
  const [bancoTransferencia, setBancoTransferencia] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const fileInputRef = useRef(null);

  // UI state for mobile
  const [showCart, setShowCart] = useState(false);
  const [clienteExpanded, setClienteExpanded] = useState(false);

  // Modales de acciones
  const [showCerrarCaja, setShowCerrarCaja] = useState(false);
  const [showDevoluciones, setShowDevoluciones] = useState(false);
  const [showCambios, setShowCambios] = useState(false);
  const [montoFinalCaja, setMontoFinalCaja] = useState('');
  const [observacionesCaja, setObservacionesCaja] = useState('');
  const [processingCaja, setProcessingCaja] = useState(false);

  // Devoluciones
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [busquedaFactura, setBusquedaFactura] = useState('');

  // Cambios
  const [productosCambio, setProductosCambio] = useState([]);
  const [productosNuevos, setProductosNuevos] = useState([]);

  useEffect(() => {
    fetchCajaActiva();
    fetchProductos({ activo: true, limit: 500 });
  }, [fetchCajaActiva, fetchProductos]);

  const filteredProducts = productos.filter(p =>
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.producto?.principioActivo?.toLowerCase().includes(searchTerm.toLowerCase())
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
    // En mobile, mostrar el carrito cuando se agrega algo
    if (window.innerWidth < 1024) setShowCart(true);
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cantidad + delta;
        if (newQty < 1 || newQty > item.stockActual) return item;
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + (item.precioVenta * item.cantidad), 0);
  const impuestos = cart.reduce((sum, item) => {
    const itemTotal = item.precioVenta * item.cantidad;
    return sum + (itemTotal * (item.porcentajeIva / 100));
  }, 0);
  const descuento = parseFloat(descuentoManual || 0);
  const total = subtotal + impuestos - descuento;

  // Calcular total de pagos combinados
  const totalPagos = Object.values(metodosSeleccionados).reduce((sum, m) => sum + (m.activo ? parseFloat(m.monto) || 0 : 0), 0);
  const faltante = total - totalPagos;

  // Actualizar monto de un método de pago
  const toggleMetodoPago = (metodo) => {
    setMetodosSeleccionados(prev => ({
      ...prev,
      [metodo]: { ...prev[metodo], activo: !prev[metodo].activo, monto: !prev[metodo].activo ? 0 : prev[metodo].monto }
    }));
  };

  const setMontoMetodo = (metodo, monto) => {
    setMetodosSeleccionados(prev => ({
      ...prev,
      [metodo]: { ...prev[metodo], monto: parseFloat(monto) || 0 }
    }));
  };

  // Auto-llenar monto cuando solo hay un método activo
  useEffect(() => {
    const activos = Object.entries(metodosSeleccionados).filter(([_, v]) => v.activo);
    if (activos.length === 1 && total > 0) {
      const [metodo] = activos[0];
      setMetodosSeleccionados(prev => ({
        ...prev,
        [metodo]: { ...prev[metodo], monto: total }
      }));
    }
  }, [total, metodosSeleccionados.Efectivo.activo, metodosSeleccionados.Tarjeta.activo, metodosSeleccionados.Transferencia.activo]);

  const handleAbrirCaja = async () => {
    try {
      await abrirCaja(parseFloat(montoInicial), nombreCaja);
    } catch (err) {}
  };

  // Cerrar caja
  const handleCerrarCaja = async () => {
    setProcessingCaja(true);
    try {
      await cerrarCaja(parseFloat(montoFinalCaja) || 0, observacionesCaja);
      setShowCerrarCaja(false);
      setMontoFinalCaja('');
      setObservacionesCaja('');
    } catch (err) {
    } finally {
      setProcessingCaja(false);
    }
  };

  // Cargar ventas del día para devoluciones/cambios
  const cargarVentasCaja = async () => {
    if (cajaActiva) {
      await fetchVentas({ cajaId: cajaActiva.id, limit: 50 });
    }
  };

  const abrirDevoluciones = () => {
    cargarVentasCaja();
    setShowDevoluciones(true);
  };

  const abrirCambios = () => {
    cargarVentasCaja();
    setShowCambios(true);
  };

  // Procesar devolución
  const handleDevolucion = async () => {
    if (!ventaSeleccionada || !motivoDevolucion) return;
    setProcessingCaja(true);
    try {
      await anularVenta(ventaSeleccionada.id, motivoDevolucion);
      setShowDevoluciones(false);
      setVentaSeleccionada(null);
      setMotivoDevolucion('');
      setBusquedaFactura('');
      fetchProductos({ activo: true, limit: 500 });
      fetchCajaActiva();
    } catch (err) {
    } finally {
      setProcessingCaja(false);
    }
  };

  // Filtrar ventas por número de factura
  const ventasFiltradas = ventas.filter(v =>
    v.numeroFactura?.toLowerCase().includes(busquedaFactura.toLowerCase()) ||
    v.clienteNombre?.toLowerCase().includes(busquedaFactura.toLowerCase())
  );

  // Buscar cliente
  const handleBuscarCliente = async () => {
    if (!cedulaCliente || cedulaCliente.length < 5) return;
    setBuscandoCliente(true);
    try {
      const result = await buscarClientePorCedula(cedulaCliente);
      if (result) {
        setCliente(result);
        setShowCrearCliente(false);
      } else {
        setCliente(null);
        setNuevoCliente({ ...nuevoCliente, cedula: cedulaCliente });
        setShowCrearCliente(true);
      }
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleCrearCliente = async () => {
    try {
      const result = await crearCliente(nuevoCliente);
      setCliente(result);
      setShowCrearCliente(false);
      setNuevoCliente({ cedula: '', nombres: '', apellidos: '', telefono: '', email: '' });
    } catch (err) {}
  };

  const limpiarCliente = () => {
    setCliente(null);
    setCedulaCliente('');
    setShowCrearCliente(false);
  };

  const handleFinishSale = async () => {
    if (cart.length === 0) return;

    // Validar que el pago cubra el total
    if (Math.abs(faltante) > 1) {
      return;
    }

    // Validar transferencia
    if (metodosSeleccionados.Transferencia.activo && metodosSeleccionados.Transferencia.monto > 0 && !referenciaTransferencia) {
      return;
    }

    setProcessing(true);
    try {
      // Determinar método de pago principal (el de mayor monto)
      const metodoPrincipal = Object.entries(metodosSeleccionados)
        .filter(([_, v]) => v.activo && v.monto > 0)
        .sort((a, b) => b[1].monto - a[1].monto)[0]?.[0] || 'Efectivo';

      const ventaData = {
        clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Consumidor Final',
        clienteDocumento: cliente?.cedula || cedulaCliente || null,
        clienteEmail: cliente?.email || null,
        pacienteId: cliente?.id || null,
        metodoPago: metodoPrincipal,
        descuentoManual: descuento,
        items: cart.map(item => ({
          drogueriaProductoId: item.id,
          cantidad: item.cantidad
        })),
        // Desglose de pagos combinados
        montoEfectivo: metodosSeleccionados.Efectivo.activo ? metodosSeleccionados.Efectivo.monto : 0,
        montoTarjeta: metodosSeleccionados.Tarjeta.activo ? metodosSeleccionados.Tarjeta.monto : 0,
        montoTransferencia: metodosSeleccionados.Transferencia.activo ? metodosSeleccionados.Transferencia.monto : 0
      };

      // Campos de transferencia
      if (metodosSeleccionados.Transferencia.activo && metodosSeleccionados.Transferencia.monto > 0) {
        ventaData.referenciaTransferencia = referenciaTransferencia;
        ventaData.bancoTransferencia = bancoTransferencia;
      }

      const result = await registrarVenta(ventaData);

      if (result) {
        setCart([]);
        limpiarCliente();
        setDescuentoManual('0');
        setReferenciaTransferencia('');
        setBancoTransferencia('');
        setComprobanteFile(null);
        setMetodosSeleccionados({
          Efectivo: { activo: true, monto: 0 },
          Tarjeta: { activo: false, monto: 0 },
          Transferencia: { activo: false, monto: 0 }
        });
        fetchProductos({ activo: true, limit: 500 });
        fetchCajaActiva();
        setShowCart(false);
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val || 0);

  const ventasCaja = cajaActiva?.ventas || [];
  const totalVentasCaja = ventasCaja.reduce((s, v) => s + v.total, 0);

  // Vista de apertura de caja
  if (!cajaActiva) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <Card className="w-full max-w-sm shadow-xl border-none">
          <CardContent className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold">Iniciar Turno</h2>
              <p className="text-gray-500 text-sm">Abre una caja para vender</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-500">Nombre de Caja</Label>
                <Select value={nombreCaja} onValueChange={setNombreCaja}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Caja Principal">Caja Principal</SelectItem>
                    <SelectItem value="Caja 1">Caja 1</SelectItem>
                    <SelectItem value="Caja 2">Caja 2</SelectItem>
                    <SelectItem value="Caja Urgencias">Caja Urgencias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Monto Inicial</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <Input
                    type="number"
                    className="pl-8 h-10 text-lg font-bold"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <Button
              className="w-full h-11 font-bold bg-blue-600 hover:bg-blue-700"
              onClick={handleAbrirCaja}
            >
              <Wallet className="w-5 h-5 mr-2" /> ABRIR CAJA
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col overflow-hidden bg-gray-100">
      {/* Header compacto */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-3 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          <span className="font-semibold text-sm truncate max-w-[100px] sm:max-w-none">{cajaActiva.nombre}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <span className="hidden sm:inline opacity-80">{ventasCaja.length} ventas</span>
          <span className="font-bold">{formatCurrency(totalVentasCaja)}</span>
          <Badge className="bg-white/20 text-white text-xs hidden sm:flex">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(cajaActiva.fechaApertura).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </Badge>

          {/* Botones de acciones */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-white/80 hover:text-white hover:bg-white/10"
              onClick={abrirDevoluciones}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Devolución
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-white/80 hover:text-white hover:bg-white/10"
              onClick={abrirCambios}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
              Cambio
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-200 hover:text-white hover:bg-red-500/30"
              onClick={() => setShowCerrarCaja(true)}
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Cerrar
            </Button>
          </div>

          {/* Menú dropdown para móvil */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-white/10">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={abrirDevoluciones}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Devolución
              </DropdownMenuItem>
              <DropdownMenuItem onClick={abrirCambios}>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Cambio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowCerrarCaja(true)} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Caja
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content - Responsive */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Productos */}
        <div className={`${showCart ? 'hidden lg:flex' : 'flex'} flex-col flex-1 lg:flex-none lg:w-[45%] xl:w-[50%] bg-white overflow-hidden`}>
          <div className="p-2 sm:p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar producto..."
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
              {filteredProducts.slice(0, 40).map(product => (
                <div
                  key={product.id}
                  className={`p-2 border rounded-lg cursor-pointer transition-all text-xs ${
                    product.stockActual <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50/50 active:scale-95'
                  } ${cart.find(c => c.id === product.id) ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => addToCart(product)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] text-gray-400 font-mono">{product.sku?.slice(-6)}</span>
                    {cart.find(c => c.id === product.id) && (
                      <Badge className="bg-blue-600 text-[9px] h-4 px-1">
                        x{cart.find(c => c.id === product.id).cantidad}
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 line-clamp-2 min-h-[32px] leading-tight text-[11px]">
                    {product.nombre}
                  </p>
                  <div className="flex justify-between items-end mt-1">
                    <span className={`text-[10px] ${product.stockActual <= 5 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {product.stockActual} disp.
                    </span>
                    <span className="font-bold text-gray-900 text-[11px]">{formatCurrency(product.precioVenta)}</span>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400">
                  <PackageX className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
          {/* Botón flotante mobile para ver carrito */}
          {cart.length > 0 && (
            <div className="lg:hidden p-2 border-t bg-white">
              <Button
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold"
                onClick={() => setShowCart(true)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ver Carrito ({cart.reduce((s, i) => s + i.cantidad, 0)}) - {formatCurrency(total)}
              </Button>
            </div>
          )}
        </div>

        {/* Panel derecho: Carrito + Pago */}
        <div className={`${showCart ? 'flex' : 'hidden lg:flex'} flex-col flex-1 lg:w-[55%] xl:w-[50%] bg-gray-50 overflow-hidden`}>
          {/* Botón volver a productos (mobile) */}
          <div className="lg:hidden p-2 bg-white border-b">
            <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>
              <ChevronDown className="w-4 h-4 mr-1 rotate-90" /> Volver a productos
            </Button>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
            {/* Carrito */}
            <div className="flex-1 sm:w-1/2 flex flex-col overflow-hidden border-r bg-white">
              <div className="p-2 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm">Carrito</span>
                  {cart.length > 0 && <Badge className="bg-blue-600 text-xs">{cart.reduce((s, i) => s + i.cantidad, 0)}</Badge>}
                </div>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-red-500 h-7 text-xs px-2" onClick={() => setCart([])}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {cart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Carrito vacío</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="bg-gray-50 p-2 rounded-lg text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-gray-900 line-clamp-1 flex-1 pr-2 text-[11px]">{item.nombre}</p>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-0.5 border rounded bg-white">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-bold w-5 text-center text-[11px]">{item.cantidad}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="font-bold text-gray-900 text-[11px]">{formatCurrency(item.precioVenta * item.cantidad)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Totales */}
              <div className="p-2 bg-gray-50 border-t space-y-1 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {impuestos > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>IVA</span>
                    <span>{formatCurrency(impuestos)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-red-500">
                  <span>Desc.</span>
                  <Input
                    type="number"
                    className="h-5 w-16 text-right text-xs border-red-200 bg-red-50 p-0.5"
                    value={descuentoManual}
                    onChange={(e) => setDescuentoManual(e.target.value)}
                  />
                </div>
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="font-bold text-sm">TOTAL</span>
                  <span className="text-lg font-black text-blue-700">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Panel de pago */}
            <div className="flex-1 sm:w-1/2 flex flex-col overflow-hidden bg-white">
              <div className="flex-1 overflow-y-auto p-2 space-y-3">
                {/* Cliente - Colapsable */}
                <Collapsible open={clienteExpanded} onOpenChange={setClienteExpanded}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium">
                          {cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente (opcional)'}
                        </span>
                      </div>
                      {cliente ? (
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); limpiarCliente(); }}>
                          <X className="w-3 h-3" />
                        </Button>
                      ) : (
                        clienteExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    {cliente ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs">
                        <p className="font-bold text-green-800">{cliente.nombre} {cliente.apellido}</p>
                        <p className="text-green-600">CC {cliente.cedula}</p>
                        {cliente.telefono && <p className="text-green-600">{cliente.telefono}</p>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          <Input
                            placeholder="Cédula"
                            className="h-8 text-xs flex-1"
                            value={cedulaCliente}
                            onChange={(e) => setCedulaCliente(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleBuscarCliente()}
                          />
                          <Button
                            size="sm"
                            className="h-8 px-2"
                            onClick={handleBuscarCliente}
                            disabled={buscandoCliente || cedulaCliente.length < 5}
                          >
                            {buscandoCliente ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                          </Button>
                        </div>
                        {showCrearCliente && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs border-dashed"
                            onClick={() => setShowCrearCliente(true)}
                          >
                            <UserPlus className="w-3 h-3 mr-1" /> Crear Cliente
                          </Button>
                        )}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Métodos de pago combinados */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Forma de Pago</Label>

                  {METODOS_PAGO.map(metodo => {
                    const isActive = metodosSeleccionados[metodo.id].activo;
                    const monto = metodosSeleccionados[metodo.id].monto;

                    return (
                      <div key={metodo.id} className={`rounded-lg border transition-all ${isActive ? `border-${metodo.color}-300 bg-${metodo.color}-50` : 'border-gray-200'}`}>
                        <div
                          className="flex items-center gap-2 p-2 cursor-pointer"
                          onClick={() => toggleMetodoPago(metodo.id)}
                        >
                          <Checkbox
                            checked={isActive}
                            onCheckedChange={() => toggleMetodoPago(metodo.id)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                          <metodo.icon className={`w-4 h-4 ${isActive ? `text-${metodo.color}-600` : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium flex-1 ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                            {metodo.label}
                          </span>
                          {isActive && (
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                              <Input
                                type="number"
                                className="h-7 w-24 text-right text-xs pl-5 pr-2 font-bold"
                                value={monto || ''}
                                onChange={(e) => setMontoMetodo(metodo.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>

                        {/* Campos adicionales para transferencia - siempre visibles cuando está activo */}
                        {metodo.id === 'Transferencia' && isActive && (
                          <div className="px-2 pb-2 space-y-2 border-t border-purple-200 pt-2 mt-1">
                            <div>
                              <Label className="text-[10px] text-purple-600 font-medium">Referencia *</Label>
                              <Input
                                placeholder="Número de referencia"
                                className="h-8 text-xs mt-1"
                                value={referenciaTransferencia}
                                onChange={(e) => setReferenciaTransferencia(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-purple-600 font-medium">Banco</Label>
                              <Select value={bancoTransferencia} onValueChange={setBancoTransferencia}>
                                <SelectTrigger className="h-8 text-xs mt-1">
                                  <SelectValue placeholder="Seleccionar banco" />
                                </SelectTrigger>
                                <SelectContent>
                                  {BANCOS_COLOMBIA.map(banco => (
                                    <SelectItem key={banco} value={banco} className="text-xs">{banco}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-[10px] text-purple-600 font-medium">Comprobante (opcional)</Label>
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => setComprobanteFile(e.target.files[0])}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-xs mt-1 border-dashed border-purple-300 hover:bg-purple-50"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                {comprobanteFile ? comprobanteFile.name.slice(0, 18) + '...' : 'Subir comprobante'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Indicador de faltante/sobrante */}
                  {cart.length > 0 && (
                    <div className={`text-xs font-bold text-center p-2 rounded-lg ${
                      Math.abs(faltante) < 1 ? 'bg-green-100 text-green-700' :
                      faltante > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {Math.abs(faltante) < 1 ? (
                        <span className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Pago completo
                        </span>
                      ) : faltante > 0 ? (
                        `Falta: ${formatCurrency(faltante)}`
                      ) : (
                        `Cambio: ${formatCurrency(Math.abs(faltante))}`
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de cobro */}
              <div className="p-2 border-t bg-gray-50">
                <Button
                  className="w-full h-11 sm:h-12 text-sm font-bold bg-green-600 hover:bg-green-700 shadow-lg disabled:opacity-50"
                  disabled={
                    cart.length === 0 ||
                    processing ||
                    faltante > 1 ||
                    (metodosSeleccionados.Transferencia.activo && metodosSeleccionados.Transferencia.monto > 0 && !referenciaTransferencia)
                  }
                  onClick={handleFinishSale}
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      COBRAR {formatCurrency(total)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal crear cliente */}
      <Dialog open={showCrearCliente && !cliente} onOpenChange={setShowCrearCliente}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Nuevo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-gray-500">Cédula</Label>
                <div className="relative mt-1">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-8 h-9"
                    value={nuevoCliente.cedula}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, cedula: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Nombres</Label>
                <Input
                  className="mt-1 h-9"
                  value={nuevoCliente.nombres}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombres: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Apellidos</Label>
                <Input
                  className="mt-1 h-9"
                  value={nuevoCliente.apellidos}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, apellidos: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Teléfono</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-8 h-9"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-8 h-9"
                    type="email"
                    value={nuevoCliente.email}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCrearCliente(false)} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              onClick={handleCrearCliente}
              disabled={!nuevoCliente.cedula || !nuevoCliente.nombres || !nuevoCliente.apellidos}
            >
              <UserPlus className="w-4 h-4 mr-2" /> Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cerrar Caja */}
      <Dialog open={showCerrarCaja} onOpenChange={setShowCerrarCaja}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-red-600">
              <LogOut className="w-5 h-5" />
              Cerrar Caja
            </DialogTitle>
            <DialogDescription>
              Confirma el cierre de {cajaActiva?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Resumen de caja */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Monto inicial:</span>
                <span className="font-medium">{formatCurrency(cajaActiva?.montoInicial || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ventas del turno:</span>
                <span className="font-medium">{ventasCaja.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total vendido:</span>
                <span className="font-bold text-green-600">{formatCurrency(totalVentasCaja)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Esperado en caja:</span>
                <span className="font-black text-blue-600">{formatCurrency((cajaActiva?.montoInicial || 0) + totalVentasCaja)}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-gray-500">Monto Final en Caja</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                <Input
                  type="number"
                  className="pl-8 h-10 text-lg font-bold"
                  placeholder={String((cajaActiva?.montoInicial || 0) + totalVentasCaja)}
                  value={montoFinalCaja}
                  onChange={(e) => setMontoFinalCaja(e.target.value)}
                />
              </div>
              {montoFinalCaja && Math.abs(parseFloat(montoFinalCaja) - ((cajaActiva?.montoInicial || 0) + totalVentasCaja)) > 0 && (
                <p className={`text-xs mt-1 ${parseFloat(montoFinalCaja) > ((cajaActiva?.montoInicial || 0) + totalVentasCaja) ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(montoFinalCaja) > ((cajaActiva?.montoInicial || 0) + totalVentasCaja)
                    ? `Sobrante: ${formatCurrency(parseFloat(montoFinalCaja) - ((cajaActiva?.montoInicial || 0) + totalVentasCaja))}`
                    : `Faltante: ${formatCurrency(((cajaActiva?.montoInicial || 0) + totalVentasCaja) - parseFloat(montoFinalCaja))}`
                  }
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs font-medium text-gray-500">Observaciones (opcional)</Label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                placeholder="Novedades del turno..."
                value={observacionesCaja}
                onChange={(e) => setObservacionesCaja(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCerrarCaja(false)} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none"
              onClick={handleCerrarCaja}
              disabled={processingCaja}
            >
              {processingCaja ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
              Cerrar Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Devoluciones */}
      <Dialog open={showDevoluciones} onOpenChange={setShowDevoluciones}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-amber-600">
              <RotateCcw className="w-5 h-5" />
              Devolución de Venta
            </DialogTitle>
            <DialogDescription>
              Selecciona la venta a anular y el motivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Buscar factura */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por # factura o cliente..."
                className="pl-9"
                value={busquedaFactura}
                onChange={(e) => setBusquedaFactura(e.target.value)}
              />
            </div>

            {/* Lista de ventas */}
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-2 space-y-2">
                {ventasFiltradas.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No hay ventas para mostrar
                  </div>
                ) : (
                  ventasFiltradas.map(venta => (
                    <div
                      key={venta.id}
                      className={`p-2 border rounded-lg cursor-pointer transition-all text-xs ${
                        venta.estado === 'ANULADA' ? 'opacity-50 cursor-not-allowed bg-gray-100' :
                        ventaSeleccionada?.id === venta.id ? 'border-amber-500 bg-amber-50' : 'hover:border-amber-300'
                      }`}
                      onClick={() => venta.estado !== 'ANULADA' && setVentaSeleccionada(venta)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{venta.numeroFactura}</p>
                          <p className="text-gray-500">{venta.clienteNombre}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(venta.total)}</p>
                          <p className="text-gray-400">{new Date(venta.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      {venta.estado === 'ANULADA' && (
                        <Badge className="mt-1 bg-red-100 text-red-600 text-[9px]">ANULADA</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Venta seleccionada */}
            {ventaSeleccionada && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-800">
                      Vas a anular la factura {ventaSeleccionada.numeroFactura}
                    </p>
                    <p className="text-xs text-amber-600">
                      {ventaSeleccionada.items?.length || 0} productos - {formatCurrency(ventaSeleccionada.total)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Motivo */}
            <div>
              <Label className="text-xs font-medium text-gray-500">Motivo de devolución *</Label>
              <Select value={motivoDevolucion} onValueChange={setMotivoDevolucion}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Error de digitación">Error de digitación</SelectItem>
                  <SelectItem value="Cliente se arrepintió">Cliente se arrepintió</SelectItem>
                  <SelectItem value="Producto defectuoso">Producto defectuoso</SelectItem>
                  <SelectItem value="Producto equivocado">Producto equivocado</SelectItem>
                  <SelectItem value="Devolución médica">Devolución médica</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDevoluciones(false);
                setVentaSeleccionada(null);
                setMotivoDevolucion('');
                setBusquedaFactura('');
              }}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 flex-1 sm:flex-none"
              onClick={handleDevolucion}
              disabled={!ventaSeleccionada || !motivoDevolucion || processingCaja}
            >
              {processingCaja ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Procesar Devolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cambios */}
      <Dialog open={showCambios} onOpenChange={setShowCambios}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-purple-600">
              <ArrowRightLeft className="w-5 h-5" />
              Cambio de Productos
            </DialogTitle>
            <DialogDescription>
              Selecciona la venta original y los productos a cambiar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Buscar factura */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por # factura o cliente..."
                className="pl-9"
                value={busquedaFactura}
                onChange={(e) => setBusquedaFactura(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Lista de ventas */}
              <div>
                <Label className="text-xs font-medium text-gray-500 mb-2 block">Venta Original</Label>
                <ScrollArea className="h-40 border rounded-lg">
                  <div className="p-2 space-y-2">
                    {ventasFiltradas.filter(v => v.estado !== 'ANULADA').length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        <Receipt className="w-6 h-6 mx-auto mb-1 opacity-40" />
                        Sin ventas
                      </div>
                    ) : (
                      ventasFiltradas.filter(v => v.estado !== 'ANULADA').map(venta => (
                        <div
                          key={venta.id}
                          className={`p-2 border rounded-lg cursor-pointer transition-all text-xs ${
                            ventaSeleccionada?.id === venta.id ? 'border-purple-500 bg-purple-50' : 'hover:border-purple-300'
                          }`}
                          onClick={() => {
                            setVentaSeleccionada(venta);
                            setProductosCambio(venta.items?.map(i => ({ ...i, cambiar: false })) || []);
                          }}
                        >
                          <div className="flex justify-between">
                            <span className="font-bold">{venta.numeroFactura}</span>
                            <span className="font-bold">{formatCurrency(venta.total)}</span>
                          </div>
                          <p className="text-gray-500">{venta.clienteNombre}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Productos de la venta */}
              <div>
                <Label className="text-xs font-medium text-gray-500 mb-2 block">Productos a Cambiar</Label>
                <ScrollArea className="h-40 border rounded-lg">
                  <div className="p-2 space-y-2">
                    {!ventaSeleccionada ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        Selecciona una venta
                      </div>
                    ) : (
                      productosCambio.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-2 border rounded-lg cursor-pointer transition-all text-xs flex items-center gap-2 ${
                            item.cambiar ? 'border-purple-500 bg-purple-50' : 'hover:border-purple-300'
                          }`}
                          onClick={() => {
                            setProductosCambio(prev => prev.map((p, i) =>
                              i === idx ? { ...p, cambiar: !p.cambiar } : p
                            ));
                          }}
                        >
                          <Checkbox checked={item.cambiar} />
                          <div className="flex-1">
                            <p className="font-medium line-clamp-1">{item.producto?.nombre || item.drogueriaProducto?.nombre}</p>
                            <p className="text-gray-500">x{item.cantidad} - {formatCurrency(item.precioUnitario * item.cantidad)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Resumen del cambio */}
            {productosCambio.some(p => p.cambiar) && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-800 font-medium">
                    {productosCambio.filter(p => p.cambiar).length} productos a cambiar
                  </span>
                  <span className="font-bold text-purple-700">
                    Valor: {formatCurrency(productosCambio.filter(p => p.cambiar).reduce((s, p) => s + (p.precioUnitario * p.cantidad), 0))}
                  </span>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Se anulará la venta y podrás crear una nueva con los productos correctos
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCambios(false);
                setVentaSeleccionada(null);
                setProductosCambio([]);
                setBusquedaFactura('');
              }}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none"
              onClick={async () => {
                if (ventaSeleccionada) {
                  await anularVenta(ventaSeleccionada.id, 'Cambio de productos');
                  // Agregar productos NO cambiados al carrito
                  const productosNoAnteriores = productosCambio.filter(p => !p.cambiar);
                  productosNoAnteriores.forEach(item => {
                    const prod = productos.find(p => p.id === item.drogueriaProductoId);
                    if (prod) addToCart(prod);
                  });
                  setShowCambios(false);
                  setVentaSeleccionada(null);
                  setProductosCambio([]);
                  setBusquedaFactura('');
                  fetchProductos({ activo: true, limit: 500 });
                  fetchCajaActiva();
                }
              }}
              disabled={!ventaSeleccionada || !productosCambio.some(p => p.cambiar) || processingCaja}
            >
              {processingCaja ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
              Procesar Cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
