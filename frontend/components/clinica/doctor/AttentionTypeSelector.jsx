'use client';

import { useState, useEffect } from 'react';
import {
  Stethoscope, BedDouble, Users, Clock, Activity,
  Sparkles, ArrowRight, Calendar, Heart, Timer,
  TrendingUp, AlertCircle, Scissors, Sun, Moon, Sunrise
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const ATTENTION_TYPE_KEY = 'doctor_attention_type';
const REMEMBER_CHOICE_KEY = 'doctor_remember_attention_choice';

// Obtener saludo e icono según la hora
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Buenos días', icon: Sunrise, emoji: '☀️' };
  if (hour >= 12 && hour < 18) return { text: 'Buenas tardes', icon: Sun, emoji: '🌤️' };
  return { text: 'Buenas noches', icon: Moon, emoji: '🌙' };
};

export default function AttentionTypeSelector({ user, onSelect }) {
  const [stats, setStats] = useState({
    consultaExterna: 0,
    hospitalizacion: 0,
    enEspera: 0,
    cirugias: 0,
    proximaCita: null,
    ultimaActividad: null,
  });
  const [loading, setLoading] = useState(true);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Cargar estadísticas del doctor
  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

        const response = await fetch(`${apiUrl}/admisiones/doctor/${user.id}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.stats) {
            setStats(prev => ({ ...prev, ...data.data.stats }));
          }
        }

        // También cargar citas del día para obtener próxima cita
        const today = new Date().toISOString().split('T')[0];
        const citasRes = await fetch(`${apiUrl}/citas?doctorId=${user.id}&fecha=${today}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (citasRes.ok) {
          const citasData = await citasRes.json();
          const citas = citasData.data || citasData.citas || [];
          const enEspera = citas.filter(c => c.estado === 'EnEspera');
          const proximaCita = enEspera.sort((a, b) => {
            const horaA = a.hora?.includes('T') ? a.hora.split('T')[1] : a.hora;
            const horaB = b.hora?.includes('T') ? b.hora.split('T')[1] : b.hora;
            return horaA?.localeCompare(horaB);
          })[0];

          setStats(prev => ({
            ...prev,
            consultaExterna: citas.length,
            enEspera: enEspera.length,
            proximaCita,
          }));
        }
      } catch (error) {
        console.error('Error loading doctor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Verificar si hay una preferencia guardada
  useEffect(() => {
    const savedChoice = localStorage.getItem(ATTENTION_TYPE_KEY);
    const shouldRemember = localStorage.getItem(REMEMBER_CHOICE_KEY) === 'true';

    if (shouldRemember && savedChoice) {
      onSelect(savedChoice);
    }
  }, [onSelect]);

  const handleSelect = (type) => {
    if (rememberChoice) {
      localStorage.setItem(ATTENTION_TYPE_KEY, type);
      localStorage.setItem(REMEMBER_CHOICE_KEY, 'true');
    } else {
      localStorage.removeItem(ATTENTION_TYPE_KEY);
      localStorage.removeItem(REMEMBER_CHOICE_KEY);
    }
    onSelect(type);
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Formatear hora
  const formatHora = (hora) => {
    if (!hora) return '--:--';
    if (hora.includes('T')) return hora.split('T')[1].substring(0, 5);
    return hora.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mx-auto"></div>
            <Stethoscope className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" />
          </div>
          <p className="mt-6 text-lg font-medium text-blue-200">Preparando tu espacio de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header mejorado */}
      <div className="text-center mb-12 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            <GreetingIcon className="h-8 w-8 text-amber-400" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          {greeting.text}, Dr(a). {user?.nombre || 'Doctor'}
        </h1>
        <p className="text-xl text-blue-200 mb-2">
          ¿Qué tipo de atención realizará hoy?
        </p>
        <p className="text-sm text-blue-300/60">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Selection Cards - Mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mb-10 relative z-10">
        {/* Consulta Externa Card */}
        <Card
          className={`cursor-pointer transition-all duration-500 bg-gradient-to-br from-blue-600/20 to-cyan-600/10 backdrop-blur-xl border-2
            ${hoveredCard === 'consulta' ? 'scale-105 border-blue-400 shadow-2xl shadow-blue-500/30' : 'border-white/10 hover:border-blue-400/50'}
            group relative overflow-hidden`}
          onClick={() => handleSelect('consulta')}
          onMouseEnter={() => setHoveredCard('consulta')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          {/* Badge de pacientes en espera */}
          {stats.enEspera > 0 && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-amber-500 text-white border-0 animate-pulse px-3 py-1 text-sm flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {stats.enEspera} en espera
              </Badge>
            </div>
          )}

          <CardContent className="p-8 text-center relative">
            <div className="mb-6 relative">
              <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500
                ${hoveredCard === 'consulta' ? 'bg-blue-500 shadow-lg shadow-blue-500/50 rotate-3' : 'bg-blue-500/20'}`}>
                <Stethoscope className={`h-12 w-12 transition-all duration-500 ${hoveredCard === 'consulta' ? 'text-white scale-110' : 'text-blue-400'}`} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Consulta Externa
            </h2>
            <p className="text-blue-200 mb-6 text-base">
              Atención ambulatoria programada
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-xl p-3">
                <Users className="h-5 w-5 text-blue-300" />
                <span className="text-white font-semibold">
                  {stats.consultaExterna} pacientes hoy
                </span>
              </div>

              {stats.proximaCita && (
                <div className="flex items-center justify-center gap-2 text-amber-300 text-sm">
                  <Timer className="h-4 w-4" />
                  <span>Próxima cita: {formatHora(stats.proximaCita.hora)}</span>
                </div>
              )}
            </div>

            {/* Botón de acción */}
            <div className={`mt-6 flex items-center justify-center gap-2 text-blue-300 transition-all duration-300
              ${hoveredCard === 'consulta' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <span className="font-medium">Iniciar atención</span>
              <ArrowRight className="h-4 w-4 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Hospitalización Card */}
        <Card
          className={`cursor-pointer transition-all duration-500 bg-gradient-to-br from-emerald-600/20 to-teal-600/10 backdrop-blur-xl border-2
            ${hoveredCard === 'hospitalizacion' ? 'scale-105 border-emerald-400 shadow-2xl shadow-emerald-500/30' : 'border-white/10 hover:border-emerald-400/50'}
            group relative overflow-hidden`}
          onClick={() => handleSelect('hospitalizacion')}
          onMouseEnter={() => setHoveredCard('hospitalizacion')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          {/* Badge de pacientes internados */}
          {stats.hospitalizacion > 0 && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-emerald-500 text-white border-0 px-3 py-1 text-sm flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                {stats.hospitalizacion} activos
              </Badge>
            </div>
          )}

          <CardContent className="p-8 text-center relative">
            <div className="mb-6 relative">
              <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500
                ${hoveredCard === 'hospitalizacion' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 rotate-3' : 'bg-emerald-500/20'}`}>
                <BedDouble className={`h-12 w-12 transition-all duration-500 ${hoveredCard === 'hospitalizacion' ? 'text-white scale-110' : 'text-emerald-400'}`} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Hospitalización
            </h2>
            <p className="text-emerald-200 mb-6 text-base">
              Pacientes internados a su cargo
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-xl p-3">
                <BedDouble className="h-5 w-5 text-emerald-300" />
                <span className="text-white font-semibold">
                  {stats.hospitalizacion || 0} internados
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Evoluciones pendientes</span>
              </div>
            </div>

            {/* Botón de acción */}
            <div className={`mt-6 flex items-center justify-center gap-2 text-emerald-300 transition-all duration-300
              ${hoveredCard === 'hospitalizacion' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <span className="font-medium">Ver pacientes</span>
              <ArrowRight className="h-4 w-4 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Quirófano Card */}
        <Card
          className={`cursor-pointer transition-all duration-500 bg-gradient-to-br from-purple-600/20 to-pink-600/10 backdrop-blur-xl border-2
            ${hoveredCard === 'quirofano' ? 'scale-105 border-purple-400 shadow-2xl shadow-purple-500/30' : 'border-white/10 hover:border-purple-400/50'}
            group relative overflow-hidden`}
          onClick={() => handleSelect('quirofano')}
          onMouseEnter={() => setHoveredCard('quirofano')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          {/* Badge de cirugías programadas */}
          {stats.cirugias > 0 && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-purple-500 text-white border-0 px-3 py-1 text-sm flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5" />
                {stats.cirugias} programadas
              </Badge>
            </div>
          )}

          <CardContent className="p-8 text-center relative">
            <div className="mb-6 relative">
              <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500
                ${hoveredCard === 'quirofano' ? 'bg-purple-500 shadow-lg shadow-purple-500/50 rotate-3' : 'bg-purple-500/20'}`}>
                <Scissors className={`h-12 w-12 transition-all duration-500 ${hoveredCard === 'quirofano' ? 'text-white scale-110' : 'text-purple-400'}`} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Quirófano
            </h2>
            <p className="text-purple-200 mb-6 text-base">
              Gestión de cirugías y protocolos
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-xl p-3">
                <Calendar className="h-5 w-5 text-purple-300" />
                <span className="text-white font-semibold">
                  {stats.cirugias || 0} cirugías hoy
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-purple-300 text-sm">
                <Clock className="h-4 w-4" />
                <span>Ver programación</span>
              </div>
            </div>

            {/* Botón de acción */}
            <div className={`mt-6 flex items-center justify-center gap-2 text-purple-300 transition-all duration-300
              ${hoveredCard === 'quirofano' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <span className="font-medium">Ir a quirófano</span>
              <ArrowRight className="h-4 w-4 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remember Choice Checkbox - Mejorado */}
      <div className="flex items-center space-x-3 text-white/80 bg-white/5 backdrop-blur-sm rounded-xl px-6 py-4 relative z-10">
        <Checkbox
          id="remember"
          checked={rememberChoice}
          onCheckedChange={setRememberChoice}
          className="border-white/40 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 h-5 w-5"
        />
        <Label htmlFor="remember" className="cursor-pointer text-base">
          Recordar mi preferencia e ir directo la próxima vez
        </Label>
      </div>

      {/* Footer con info */}
      <div className="mt-8 text-center text-blue-300/50 text-sm relative z-10">
        <p>Puedes cambiar de modo en cualquier momento desde el menú lateral</p>
      </div>
    </div>
  );
}

// Función helper para limpiar la preferencia guardada
export function clearAttentionTypePreference() {
  localStorage.removeItem(ATTENTION_TYPE_KEY);
  localStorage.removeItem(REMEMBER_CHOICE_KEY);
}

// Función helper para obtener la preferencia guardada
export function getSavedAttentionType() {
  const shouldRemember = localStorage.getItem(REMEMBER_CHOICE_KEY) === 'true';
  if (shouldRemember) {
    return localStorage.getItem(ATTENTION_TYPE_KEY);
  }
  return null;
}
