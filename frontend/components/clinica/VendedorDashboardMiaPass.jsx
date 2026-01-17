'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, Users, DollarSign, Award, Target,
  Calendar, CheckCircle2, Clock, Network, BarChart3,
  RefreshCw, Copy, Share2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table';
import { miaPassService } from '@/services/miaPass.service';
import { useToast } from '@/hooks/use-toast';

// Constantes de la política v1.1
const META_MENSUAL = 30;
const COMISION_ESTANDAR = 0.25; // 25%
const COMISION_MOVILIZADOR = 0.30; // 30%
const BASE_COMISIONAL = 199900;

export default function VendedorDashboardMiaPass({ user }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [estadoVendedor, setEstadoVendedor] = useState(null);
  const [misComisiones, setMisComisiones] = useState(null);
  const [estructuraRed, setEstructuraRed] = useState(null);
  const [historialPagos, setHistorialPagos] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [estado, comisiones, red, historial] = await Promise.all([
        miaPassService.getMiEstadoVendedor(),
        miaPassService.getMisComisiones(),
        miaPassService.getMiRed().catch(() => ({ data: null })),
        miaPassService.getHistorialPagos().catch(() => ({ data: { cortes: [] } }))
      ]);

      setEstadoVendedor(estado.data);
      setMisComisiones(comisiones.data);
      setEstructuraRed(red.data);
      setHistorialPagos(historial.data?.cortes || []);
    } catch (error) {
      console.error('Error loading vendor dashboard:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del dashboard.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val || 0);

  const copiarCodigoReferido = () => {
    const codigo = estadoVendedor?.vendedor?.vendedorCodigo;
    if (codigo) {
      navigator.clipboard.writeText(codigo);
      toast({
        title: 'Copiado',
        description: `Código "${codigo}" copiado al portapapeles`
      });
    }
  };

  const getProgresoMeta = () => {
    const ventas = estadoVendedor?.ventasMes || 0;
    return Math.min((ventas / META_MENSUAL) * 100, 100);
  };

  const getPorcentajeActual = () => {
    const ventas = estadoVendedor?.ventasMes || 0;
    return ventas >= META_MENSUAL ? COMISION_MOVILIZADOR : COMISION_ESTANDAR;
  };

  const getComisionPorVenta = () => {
    return BASE_COMISIONAL * getPorcentajeActual();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">Cargando dashboard...</span>
      </div>
    );
  }

  const ventasMes = estadoVendedor?.ventasMes || 0;
  const progresoMeta = getProgresoMeta();
  const faltanParaMeta = Math.max(0, META_MENSUAL - ventasMes);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-8 h-8 text-amber-500" />
            Mi Dashboard MiaPass
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenido, {estadoVendedor?.vendedor?.nombre || user?.nombre || 'Vendedor'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Código de Referido */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Tu Código de Referido</p>
              <p className="text-3xl font-black font-mono tracking-wider mt-1">
                {estadoVendedor?.vendedor?.vendedorCodigo || 'Sin código'}
              </p>
              <p className="text-emerald-200 text-xs mt-2">
                Comparte este código para ganar comisiones por referidos
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white"
                onClick={copiarCodigoReferido}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white"
                onClick={() => {
                  const texto = `¡Únete a MiaPass con mi código ${estadoVendedor?.vendedor?.vendedorCodigo}!`;
                  if (navigator.share) {
                    navigator.share({ text: texto });
                  } else {
                    navigator.clipboard.writeText(texto);
                    toast({ title: 'Texto copiado para compartir' });
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meta del Mes */}
        <Card className="shadow-md border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Meta del Mes</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">
                  {ventasMes} / {META_MENSUAL}
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${progresoMeta >= 100 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                <Target className="w-6 h-6" />
              </div>
            </div>
            <Progress value={progresoMeta} className="h-2 mb-2" />
            <p className="text-xs text-gray-500">
              {progresoMeta >= 100 ? (
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  ¡Meta alcanzada! Comisión al 30%
                </span>
              ) : (
                `Faltan ${faltanParaMeta} ventas para llegar al 30%`
              )}
            </p>
          </CardContent>
        </Card>

        {/* Comisiones Pendientes */}
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Por Cobrar</p>
                <h3 className="text-3xl font-black mt-1">
                  {formatCurrency(misComisiones?.stats?.saldoPendiente)}
                </h3>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-blue-200 mt-4 font-medium">
              Pendiente de cierre de corte
            </p>
          </CardContent>
        </Card>

        {/* Total Histórico */}
        <Card className="shadow-md border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Pagado</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">
                  {formatCurrency(misComisiones?.stats?.totalPagado)}
                </h3>
              </div>
              <div className="bg-green-50 p-2 rounded-lg text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-gray-400">
              <BarChart3 className="w-3 h-3" />
              <span>Histórico acumulado</span>
            </div>
          </CardContent>
        </Card>

        {/* Comisión por Venta */}
        <Card className="shadow-md border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Tu Comisión/Venta</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">
                  {formatCurrency(getComisionPorVenta())}
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${getPorcentajeActual() >= 0.30 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <Badge className={`mt-4 ${getPorcentajeActual() >= 0.30 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {(getPorcentajeActual() * 100).toFixed(0)}% sobre base
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="red" className="w-full">
        <TabsList className="bg-white border p-1 shadow-sm rounded-xl">
          <TabsTrigger value="red" className="px-6">Mi Red de Referidos</TabsTrigger>
          <TabsTrigger value="ventas" className="px-6">Mis Ventas Recientes</TabsTrigger>
          <TabsTrigger value="politicas" className="px-6">Políticas 2026</TabsTrigger>
        </TabsList>

        {/* Tab: Mi Red */}
        <TabsContent value="red" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estructura de Red */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-600" />
                  Estructura de Referidos
                </CardTitle>
                <CardDescription>Ganancias por la gestión comercial de tu red</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-indigo-900">Nivel 1 (Hijos Directos)</p>
                    <p className="text-xs text-indigo-600">Reconocimiento: $10,000 por venta</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-indigo-600 text-white text-lg px-3">
                      {estructuraRed?.nivel1?.cantidad || estadoVendedor?.vendedor?._count?.referidos || 0}
                    </Badge>
                    {estructuraRed?.nivel1?.ventas > 0 && (
                      <p className="text-[10px] text-indigo-500 mt-1">{estructuraRed.nivel1.ventas} ventas</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-purple-900">Nivel 2 (Nietos)</p>
                    <p className="text-xs text-purple-600">Reconocimiento: $5,000 por venta</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-purple-600 text-white text-lg px-3">
                      {estructuraRed?.nivel2?.cantidad || 0}
                    </Badge>
                    {estructuraRed?.nivel2?.ventas > 0 && (
                      <p className="text-[10px] text-purple-500 mt-1">{estructuraRed.nivel2.ventas} ventas</p>
                    )}
                  </div>
                </div>

                {/* Total comisiones por red */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Comisiones de Red Pendientes</span>
                    <span className="text-lg font-bold text-indigo-600">
                      {formatCurrency(
                        misComisiones?.comisiones
                          ?.filter(c => c.rolBeneficiario?.startsWith('REFERIDOR') && c.estado === 'PENDIENTE')
                          .reduce((sum, c) => sum + (c.valor || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referidos Directos */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Mis Referidos Directos</CardTitle>
                <CardDescription>Vendedores que se unieron con tu código</CardDescription>
              </CardHeader>
              <CardContent>
                {estructuraRed?.hijos?.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {estructuraRed.hijos.map((hijo, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {hijo.nombre?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{hijo.nombre} {hijo.apellido}</p>
                            <p className="text-xs text-gray-500">Código: {hijo.vendedorCodigo}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">Activo</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aún no tienes referidos</p>
                    <p className="text-xs">Comparte tu código para crecer tu red</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Ventas Recientes */}
        <TabsContent value="ventas" className="mt-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold">Fecha</TableHead>
                  <TableHead className="font-bold">Paciente</TableHead>
                  <TableHead className="font-bold">Canal</TableHead>
                  <TableHead className="font-bold">Valor Venta</TableHead>
                  <TableHead className="font-bold">Mi Comisión</TableHead>
                  <TableHead className="font-bold text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {misComisiones?.comisiones
                  ?.filter(c => c.rolBeneficiario === 'VENDEDOR')
                  .slice(0, 10)
                  .map(com => (
                    <TableRow key={com.id}>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(com.createdAt).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {com.suscripcion?.paciente?.nombre} {com.suscripcion?.paciente?.apellido}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{com.suscripcion?.canal || 'Presencial'}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatCurrency(com.suscripcion?.precioPagado)}
                      </TableCell>
                      <TableCell className="font-bold text-blue-700">
                        {formatCurrency(com.valor)}
                        <span className="text-[10px] text-gray-400 ml-1 font-normal">
                          ({(com.porcentaje * 100).toFixed(0)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={com.estado === 'PENDIENTE' ? 'bg-yellow-50 text-yellow-700' : com.estado === 'PAGADO' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                          {com.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                {(!misComisiones?.comisiones || misComisiones?.comisiones.filter(c => c.rolBeneficiario === 'VENDEDOR').length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                      Aún no tienes ventas registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab: Políticas */}
        <TabsContent value="politicas" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Políticas de Comisiones MIA PASS v1.1 (2026)</CardTitle>
              <CardDescription>Esquema de remuneración vigente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Valores Base */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Membresía MiaPass (IVA inc.)</p>
                  <p className="text-2xl font-bold text-gray-900">$237,981</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Base Comisional (sin IVA)</p>
                  <p className="text-2xl font-bold text-gray-900">$199,900</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Meta Mensual</p>
                  <p className="text-2xl font-bold text-gray-900">30 membresías</p>
                </div>
              </div>

              {/* Tabla de Comisiones */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Esquema de Comisiones por Venta</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tramo</TableHead>
                      <TableHead>Condición</TableHead>
                      <TableHead>Porcentaje</TableHead>
                      <TableHead>Valor por Venta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Comisión Estándar</TableCell>
                      <TableCell>Venta #1 a #30</TableCell>
                      <TableCell><Badge className="bg-blue-100 text-blue-700">25%</Badge></TableCell>
                      <TableCell className="font-bold">$49,976</TableCell>
                    </TableRow>
                    <TableRow className="bg-green-50">
                      <TableCell className="font-medium">Incentivo Movilizador</TableCell>
                      <TableCell>Venta #31 en adelante</TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-700">30%</Badge></TableCell>
                      <TableCell className="font-bold text-green-700">$59,970</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Comisiones de Red */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Comisiones por Red de Referidos</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Comisión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Referidor N1</TableCell>
                      <TableCell>Por venta de tu referido directo (hijo)</TableCell>
                      <TableCell><Badge className="bg-indigo-100 text-indigo-700">$10,000 fijo</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Referidor N2</TableCell>
                      <TableCell>Por venta de referido de tu referido (nieto)</TableCell>
                      <TableCell><Badge className="bg-purple-100 text-purple-700">$5,000 fijo</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Condiciones */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">Condiciones para Comisión Válida</h4>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>Pago confirmado y conciliado</li>
                  <li>Registro completo en CRM (fecha, código, canal, producto, valor)</li>
                  <li>Estado de membresía: ACTIVA</li>
                  <li>Sin devoluciones, reversos o cancelación en el período</li>
                  <li>Sin fraude, duplicidad o suplantación</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
