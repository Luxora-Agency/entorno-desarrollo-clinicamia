'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, ArrowRight, Activity, Users, Calendar, FileText } from 'lucide-react';
import Image from 'next/image';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Login Form */}
      <div className="w-1/2 bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-500 rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-900">clínica mia</h2>
                <p className="text-xs text-teal-600">medicina integral avanza</p>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Bienvenido de nuevo!
            </h1>
            <p className="text-lg text-teal-600 border-b-2 border-teal-500 inline-block pb-1">
              Inicia sesión para continuar.
            </p>
          </div>

          <p className="text-gray-600 mb-8">
            Portal de gestión interna de Clínica Mía. Accede a todas las herramientas necesarias para administrar pacientes, citas, órdenes médicas y recursos de la clínica.
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ingresa tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Contraseña
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                className="border-teal-500 data-[state=checked]:bg-teal-500"
              />
              <label
                htmlFor="remember"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Recuérdame
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-6 rounded-lg transition-all"
            >
              {loading ? (
                'Iniciando sesión...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Iniciar Sesión
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Right Column - Dashboard Preview */}
      <div className="w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema de gestión
            </h2>
            <h3 className="text-2xl font-semibold text-blue-900 mb-4">
              integral para Clínica Mía
            </h3>
            <p className="text-gray-600">
              Administra de manera eficiente todas las operaciones de la clínica desde un solo lugar. Control total sobre pacientes, personal, inventario y servicios médicos.
            </p>
          </div>

          {/* Dashboard Stats Preview */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-teal-500" />
                <span className="text-3xl font-bold text-gray-900">$12,402</span>
              </div>
              <p className="text-sm text-gray-600">Ingresos del Mes</p>
              <p className="text-xs text-teal-600 mt-1">+12.5% vs mes anterior</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-blue-500" />
                <span className="text-3xl font-bold text-gray-900">83,305</span>
              </div>
              <p className="text-sm text-gray-600">Citas Totales</p>
              <p className="text-xs text-blue-600 mt-1">+8.3% vs mes anterior</p>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Funcionalidades principales:</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Gestión completa de pacientes y expedientes médicos</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Agenda de citas y calendario médico</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Control de inventario y farmacia</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Administración de personal médico</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Reportes y análisis en tiempo real</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
