'use client';

import React, { useState, useCallback } from 'react';
import DashboardDoctor from './DashboardDoctor';
import DashboardRecepcionista from './DashboardRecepcionista';
import DashboardEnfermera from './DashboardEnfermera';
import DashboardAdminNew from './dashboard/DashboardAdminNew';
import AttentionTypeSelector, { getSavedAttentionType } from './doctor/AttentionTypeSelector';
import DashboardDoctorHospitalizacion from './doctor/DashboardDoctorHospitalizacion';

export default function DashboardHome({ user }) {
  // Determinar el tipo de usuario
  const userRole = (user?.rol || user?.role || 'admin').toLowerCase();
  const isDoctor = userRole === 'doctor' || userRole === 'medico';

  // Estado para el tipo de atención del doctor
  const [attentionType, setAttentionType] = useState(() => {
    // Verificar si hay una preferencia guardada
    if (isDoctor && typeof window !== 'undefined') {
      return getSavedAttentionType();
    }
    return null;
  });

  // Callback para cuando el doctor selecciona un tipo de atención
  const handleSelectAttentionType = useCallback((type) => {
    setAttentionType(type);
  }, []);

  // Callback para cambiar el tipo de atención
  const handleChangeAttentionType = useCallback(() => {
    setAttentionType(null);
  }, []);

  // Renderizar dashboard según el rol
  if (isDoctor) {
    // Si no hay tipo de atención seleccionado, mostrar el selector
    if (!attentionType) {
      return (
        <AttentionTypeSelector
          user={user}
          onSelect={handleSelectAttentionType}
        />
      );
    }

    // Si seleccionó hospitalización, mostrar ese dashboard
    if (attentionType === 'hospitalizacion') {
      return (
        <DashboardDoctorHospitalizacion
          user={user}
          onChangeAttentionType={handleChangeAttentionType}
        />
      );
    }

    // Si seleccionó consulta externa o quirófano, mostrar el dashboard de doctor con botón para cambiar
    return (
      <DashboardDoctor
        user={user}
        initialMode={attentionType === 'quirofano' ? 'quirofano' : 'dashboard'}
        onChangeAttentionType={handleChangeAttentionType}
      />
    );
  } else if (userRole === 'recepcionista' || userRole === 'receptionist') {
    return <DashboardRecepcionista user={user} />;
  } else if (userRole === 'enfermera' || userRole === 'enfermero' || userRole === 'nurse') {
    return <DashboardEnfermera user={user} />;
  } else {
    // Admin o default usa el nuevo dashboard
    return <DashboardAdminNew user={user} />;
  }
}
