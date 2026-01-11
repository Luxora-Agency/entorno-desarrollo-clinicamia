import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User, Activity, Heart, AlertTriangle,
  Thermometer, Droplet, Scale, Ruler,
  Building2, CheckCircle, Clock, DollarSign,
  AlertCircle, Siren, ArrowRight, Phone, FileText,
  ClipboardList, ExternalLink
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PatientContextBar({
  paciente,
  vitalesActuales = null,
  cita = null,
  compact = false,
  onOpenHCE = null,
  showQuickActions = true
}) {
  if (!paciente) return null;

  // Usar vitales actuales de la consulta si están disponibles, sino usar datos del paciente
  const peso = vitalesActuales?.peso || paciente.peso;
  const talla = vitalesActuales?.talla || paciente.altura; // talla en cm o altura en m

  // Calcular IMC: si hay vitales actuales con IMC calculado, usarlo; sino calcularlo
  const getIMC = () => {
    if (vitalesActuales?.imc?.value) {
      return vitalesActuales.imc.value;
    }
    if (peso && talla) {
      // Si talla viene en cm (de vitales), convertir a metros
      const tallaMetros = talla > 3 ? talla / 100 : talla;
      return (peso / (tallaMetros * tallaMetros)).toFixed(1);
    }
    return null;
  };

  const imc = getIMC();

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getAlertColor = (level) => {
    switch (level) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  // Configuración de origen del paciente
  const getOrigenConfig = (origen) => {
    switch (origen) {
      case 'consulta_prioritaria':
      case 'prioritaria':
        return {
          label: 'Prioritaria',
          icon: AlertCircle,
          className: 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
        };
      case 'urgencia':
        return {
          label: 'Urgencia',
          icon: Siren,
          className: 'bg-red-500 text-white hover:bg-red-600'
        };
      case 'remitido':
        return {
          label: 'Remitido',
          icon: ArrowRight,
          className: 'bg-orange-500 text-white hover:bg-orange-600'
        };
      case 'control':
        return {
          label: 'Control',
          icon: CheckCircle,
          className: 'bg-blue-500 text-white hover:bg-blue-600'
        };
      case 'espontaneo':
        return {
          label: 'Espontáneo',
          icon: User,
          className: 'bg-slate-500 text-white hover:bg-slate-600'
        };
      default:
        return null;
    }
  };

  // Configuración de estado de pago
  const getPagoConfig = (estado) => {
    switch (estado) {
      case 'pagada':
      case 'pagado':
        return {
          label: 'Pagado',
          icon: CheckCircle,
          className: 'bg-green-600 text-white hover:bg-green-700'
        };
      case 'pendiente':
        return {
          label: 'Pendiente',
          icon: Clock,
          className: 'bg-amber-500 text-white hover:bg-amber-600'
        };
      case 'exenta':
      case 'exento':
        return {
          label: 'Exento',
          icon: DollarSign,
          className: 'bg-purple-500 text-white hover:bg-purple-600'
        };
      case 'cortesia':
        return {
          label: 'Cortesía',
          icon: Heart,
          className: 'bg-pink-500 text-white hover:bg-pink-600'
        };
      default:
        return null;
    }
  };

  const origenConfig = cita?.origenPaciente ? getOrigenConfig(cita.origenPaciente) : null;
  const pagoConfig = cita?.estadoPago ? getPagoConfig(cita.estadoPago) : null;

  // Formatear teléfono para llamada
  const formatPhone = (phone) => {
    if (!phone) return null;
    return phone.replace(/\D/g, '');
  };

  const phoneNumber = formatPhone(paciente.telefono || paciente.celular);

  return (
    <Card className="bg-slate-900 text-white border-none rounded-none shadow-md">
      <CardContent className={`flex ${compact ? 'flex-col p-2 space-y-2' : 'flex-row items-center justify-between p-4'}`}>
        {/* Patient Identity */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white/20">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              {paciente.nombre} {paciente.apellido}
              <Badge variant="outline" className="text-xs bg-slate-800 text-slate-300 border-slate-600">
                {calculateAge(paciente.fechaNacimiento)} años
              </Badge>
            </h2>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>ID: {paciente.cedula}</span>
              <span>|</span>
              <span>{paciente.genero}</span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Droplet className="h-3 w-3 text-red-400" />
                {paciente.tipoSangre || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Critical Vitals (Current or Last Recorded) */}
        {!compact && (
          <div className="flex items-center gap-6 px-6 border-l border-slate-700 border-r mx-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                <Scale className="h-3 w-3" /> Peso
                {vitalesActuales?.peso && (
                  <span className="text-green-400 text-[10px]">•</span>
                )}
              </p>
              <p className={`font-semibold ${vitalesActuales?.peso ? 'text-green-400' : ''}`}>
                {peso ? `${peso} kg` : '--'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                <Ruler className="h-3 w-3" /> Talla
                {vitalesActuales?.talla && (
                  <span className="text-green-400 text-[10px]">•</span>
                )}
              </p>
              <p className={`font-semibold ${vitalesActuales?.talla ? 'text-green-400' : ''}`}>
                {talla ? (talla > 3 ? `${talla} cm` : `${talla} m`) : '--'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                <Activity className="h-3 w-3 text-green-400" /> IMC
                {vitalesActuales?.imc && (
                  <span className="text-green-400 text-[10px]">•</span>
                )}
              </p>
              <p className={`font-semibold ${vitalesActuales?.imc ? 'text-green-400' : ''}`}>
                {imc || '--'}
              </p>
            </div>
          </div>
        )}

        {/* Origen, Estado de Pago, Alerts & Allergies */}
        <div className="flex items-center gap-2">
            {/* Origen del paciente */}
            {origenConfig && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className={`flex items-center gap-1 ${origenConfig.className}`}>
                      <origenConfig.icon className="h-3 w-3" />
                      {origenConfig.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Origen de la consulta: {origenConfig.label}</p>
                    {cita?.institucionRemite && (
                      <p className="text-xs">Remitido de: {cita.institucionRemite}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Estado de pago */}
            {pagoConfig && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className={`flex items-center gap-1 ${pagoConfig.className}`}>
                      <pagoConfig.icon className="h-3 w-3" />
                      {pagoConfig.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Estado de pago: {pagoConfig.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Separador si hay badges de origen/pago */}
            {(origenConfig || pagoConfig) && (paciente.alergias || paciente.enfermedadesCronicas) && (
              <div className="w-px h-6 bg-slate-600 mx-1" />
            )}

            {paciente.alergias && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      ALERGIAS
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="bg-red-900 text-white border-red-700">
                    <p className="font-bold">Alergias Registradas:</p>
                    <p>{paciente.alergias}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {paciente.enfermedadesCronicas && (
               <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger>
                   <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1">
                     <Heart className="h-3 w-3" />
                     CRÓNICO
                   </Badge>
                 </TooltipTrigger>
                 <TooltipContent className="bg-amber-900 text-white border-amber-700">
                   <p className="font-bold">Enfermedades Crónicas:</p>
                   <p>{paciente.enfermedadesCronicas}</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
            )}

            {/* Separador antes de acciones */}
            {showQuickActions && !compact && (
              <>
                <div className="w-px h-6 bg-slate-600 mx-2" />

                {/* Teléfono de contacto */}
                {phoneNumber && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`tel:${phoneNumber}`}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-xs"
                        >
                          <Phone className="h-3 w-3 text-green-400" />
                          <span className="text-slate-300">Llamar</span>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Llamar a: {paciente.telefono || paciente.celular}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Ver historial clínico */}
                {onOpenHCE && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onOpenHCE}
                          className="flex items-center gap-1 h-7 px-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300"
                        >
                          <ClipboardList className="h-3 w-3 text-blue-400" />
                          <span>HCE</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver historia clínica electrónica</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}
        </div>

        {/* Motivo de consulta (si está disponible) */}
        {!compact && cita?.motivo && (
          <div className="ml-4 pl-4 border-l border-slate-700 max-w-xs">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Motivo</p>
            <p className="text-xs text-slate-300 truncate" title={cita.motivo}>
              {cita.motivo}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
