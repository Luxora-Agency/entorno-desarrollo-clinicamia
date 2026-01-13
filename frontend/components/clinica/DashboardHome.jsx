'use client';

import React from 'react';
import DashboardDoctor from './DashboardDoctor';
import DashboardRecepcionista from './DashboardRecepcionista';
import DashboardEnfermera from './DashboardEnfermera';
import DashboardAdminNew from './dashboard/DashboardAdminNew';

export default function DashboardHome({ user }) {
  // Determinar el tipo de usuario
  const userRole = (user?.rol || user?.role || 'admin').toLowerCase();
  const isDoctor = userRole === 'doctor' || userRole === 'medico';

  // Renderizar dashboard según el rol
  if (isDoctor) {
    // Para doctores, mostrar directamente el panel principal
    return <DashboardDoctor user={user} />;
  } else if (userRole === 'recepcionista' || userRole === 'receptionist') {
    return <DashboardRecepcionista user={user} />;
  } else if (userRole === 'enfermera' || userRole === 'enfermero' || userRole === 'nurse') {
    return <DashboardEnfermera user={user} />;
  } else {
    // Admin o default usa el nuevo dashboard
    return <DashboardAdminNew user={user} />;
  }
}
