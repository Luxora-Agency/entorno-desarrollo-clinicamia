'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardHome({ user }) {
  const [stats, setStats] = useState({
    totalPacientes: 0,
    citasHoy: 0,
    citasPendientes: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      // Obtener total de pacientes
      const pacientesRes = await fetch(`${apiUrl}/pacientes?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pacientesData = await pacientesRes.json();
      
      // Obtener citas de hoy
      const today = new Date().toISOString().split('T')[0];
      const citasRes = await fetch(`${apiUrl}/citas?fecha=${today}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const citasData = await citasRes.json();
      
      setStats({
        totalPacientes: pacientesData.pagination?.total || 0,
        citasHoy: citasData.citas?.length || 0,
        citasPendientes: citasData.citas?.filter(c => c.estado === 'Programada' || c.estado === 'Confirmada').length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenido, {user.nombre}
        </h1>
        <p className="text-gray-600">
          Panel de control - Clínica Mía
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pacientes
            </CardTitle>
            <Users className="w-5 h-5 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalPacientes}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pacientes registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Citas de Hoy
            </CardTitle>
            <Calendar className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.citasHoy}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Citas programadas para hoy
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Citas Pendientes
            </CardTitle>
            <Activity className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.citasPendientes}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Citas por confirmar o atender
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sistema de Gestión Hospitalaria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Bienvenido al sistema de gestión integral de Clínica Mía. Desde aquí puedes administrar:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span><strong>Pacientes:</strong> Registro completo de pacientes con historias clínicas</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span><strong>Citas:</strong> Agenda médica y programación de consultas</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span><strong>Más módulos:</strong> Próximamente farmacia, laboratorio y más</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
