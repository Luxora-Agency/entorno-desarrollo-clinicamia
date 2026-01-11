export const ScheduleRules = {
  // Horarios laborales estándar
  workingHours: {
    start: 6, // 6 AM
    end: 22   // 10 PM
  },
  
  // Duración por tipo de cita (en minutos)
  durations: {
    'Consulta General': 20,
    'Especialidad': 30,
    'Procedimiento': 60,
    'Control': 15
  },

  // Reglas de validación
  validation: {
    isLunchTime: (date) => {
      const hour = date.getHours();
      // Bloqueo flexible de almuerzo: alerta pero permite si es urgente
      return hour >= 12 && hour < 14; 
    },

    isWeekend: (date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // Domingo (0) o Sábado (6)
    },

    isValidDuration: (start, end) => {
      const diffMs = end - start;
      const diffMins = Math.round(diffMs / 60000);
      return diffMins >= 10 && diffMins <= 240; // Min 10 min, Max 4 horas
    }
  },

  // Generador de alertas
  checkConflicts: (start, end, type = 'Especialidad') => {
    const warnings = [];
    
    if (ScheduleRules.validation.isLunchTime(start)) {
      warnings.push('La cita está programada en horario de almuerzo habitual.');
    }
    
    if (ScheduleRules.validation.isWeekend(start)) {
      warnings.push('Programación en fin de semana. Verifique disponibilidad del especialista.');
    }

    // Validación de duración estándar
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);
    const standardDuration = ScheduleRules.durations[type] || 30;
    
    if (diffMins < standardDuration) {
      warnings.push(`La duración es menor a la recomendada para ${type} (${standardDuration} min).`);
    }

    return warnings;
  }
};
