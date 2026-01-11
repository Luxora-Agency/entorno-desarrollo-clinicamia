import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, Activity, Heart, AlertTriangle, 
  Thermometer, Droplet, Scale, Ruler 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PatientContextBar({ paciente, vitalesActuales = null, compact = false }) {
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

        {/* Alerts & Allergies */}
        <div className="flex items-center gap-3">
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
        </div>
      </CardContent>
    </Card>
  );
}
