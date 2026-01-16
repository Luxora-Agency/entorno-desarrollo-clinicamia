/**
 * Kits de Medicamentos para Aplicación Inmediata
 * Incluye códigos CUM (Código Único de Medicamento), vía de administración y precios de referencia
 *
 * Estructura de cada medicamento:
 * - nombre: Nombre del medicamento con presentación
 * - codigoCum: Código Único de Medicamento (CUM)
 * - concentracion: Dosis/concentración (ej: "1g/2mL", "500mg")
 * - via: Vía de administración (Oral, IM, IV, etc.)
 * - cantidad: Cantidad de unidades
 * - precio: Precio unitario
 * - frecuencia: (opcional) Frecuencia de aplicación. Default: "Única"
 * - duracion: (opcional) Duración del tratamiento. Default: "1 dosis"
 * - instrucciones: (opcional) Instrucciones adicionales. Default: "Aplicación inmediata"
 */

export const KITS_MEDICAMENTOS = [
  // Kits de Dolor
  {
    id: 'kit-dolor-001',
    codigo: 'KIT-DOL-001',
    nombre: 'Kit Dolor Agudo Leve-Moderado',
    categoria: 'Dolor',
    descripcion: 'Manejo inicial de dolor agudo leve a moderado',
    color: 'red',
    medicamentos: [
      {
        nombre: 'Dipirona 1g Ampolla',
        codigoCum: '19997876-1',
        concentracion: '1g/2mL',
        via: 'IM/IV',
        cantidad: 1,
        precio: 2500
      },
      {
        nombre: 'Diclofenaco 75mg Ampolla',
        codigoCum: '20033567-1',
        concentracion: '75mg/3mL',
        via: 'IM',
        cantidad: 1,
        precio: 1800
      }
    ]
  },
  {
    id: 'kit-dolor-002',
    codigo: 'KIT-DOL-002',
    nombre: 'Kit Dolor Severo',
    categoria: 'Dolor',
    descripcion: 'Manejo de dolor intenso (opioides + analgésicos)',
    color: 'red',
    medicamentos: [
      {
        nombre: 'Tramadol 100mg Ampolla',
        codigoCum: '19992034-2',
        concentracion: '100mg/2mL',
        via: 'IM/IV',
        cantidad: 1,
        precio: 4500
      },
      {
        nombre: 'Dipirona 1g Ampolla',
        codigoCum: '19997876-1',
        concentracion: '1g/2mL',
        via: 'IM/IV',
        cantidad: 1,
        precio: 2500
      },
      {
        nombre: 'Metoclopramida 10mg Ampolla',
        codigoCum: '19938756-1',
        concentracion: '10mg/2mL',
        via: 'IM/IV',
        cantidad: 1,
        precio: 1200
      }
    ]
  },
  {
    id: 'kit-dolor-003',
    codigo: 'KIT-DOL-003',
    nombre: 'Kit Cólico Nefrítico',
    categoria: 'Dolor',
    descripcion: 'Tratamiento de cólico renal agudo',
    color: 'red',
    medicamentos: [
      {
        nombre: 'Dipirona 2.5g Ampolla',
        codigoCum: '19997877-1',
        concentracion: '2.5g/5mL',
        via: 'IV',
        cantidad: 1,
        precio: 3800
      },
      {
        nombre: 'Hioscina 20mg Ampolla',
        codigoCum: '19954321-1',
        concentracion: '20mg/1mL',
        via: 'IM/IV',
        cantidad: 1,
        precio: 2200
      },
      {
        nombre: 'Tramadol 100mg Ampolla',
        codigoCum: '19992034-2',
        concentracion: '100mg/2mL',
        via: 'IV lento',
        cantidad: 1,
        precio: 4500
      }
    ]
  },

  // Kits Respiratorios
  {
    id: 'kit-resp-001',
    codigo: 'KIT-RESP-001',
    nombre: 'Kit Crisis Asmática Leve',
    categoria: 'Respiratorio',
    descripcion: 'Broncodilatación inicial en asma leve',
    color: 'blue',
    medicamentos: [
      {
        nombre: 'Salbutamol Nebulización',
        codigoCum: '19928456-1',
        concentracion: '5mg/mL',
        via: 'Nebulización',
        cantidad: 1,
        precio: 3500
      },
      {
        nombre: 'Solución Salina 5mL',
        codigoCum: '19901234-1',
        concentracion: '0.9%',
        via: 'Nebulización',
        cantidad: 1,
        precio: 800
      }
    ]
  },
  {
    id: 'kit-resp-002',
    codigo: 'KIT-RESP-002',
    nombre: 'Kit Crisis Asmática Moderada',
    categoria: 'Respiratorio',
    descripcion: 'Tratamiento de crisis asmática moderada con corticoide',
    color: 'blue',
    medicamentos: [
      {
        nombre: 'Salbutamol Nebulización',
        codigoCum: '19928456-1',
        concentracion: '5mg/mL',
        via: 'Nebulización',
        cantidad: 2,
        precio: 3500
      },
      {
        nombre: 'Bromuro de Ipratropio',
        codigoCum: '19935678-1',
        concentracion: '0.25mg/mL',
        via: 'Nebulización',
        cantidad: 1,
        precio: 4200
      },
      {
        nombre: 'Hidrocortisona 100mg Ampolla',
        codigoCum: '19912345-1',
        concentracion: '100mg',
        via: 'IV',
        cantidad: 1,
        precio: 8500
      }
    ]
  },
  {
    id: 'kit-resp-003',
    codigo: 'KIT-RESP-003',
    nombre: 'Kit Crisis Asmática Severa',
    categoria: 'Respiratorio',
    descripcion: 'Tratamiento intensivo de crisis asmática severa',
    color: 'blue',
    medicamentos: [
      {
        nombre: 'Salbutamol Nebulización',
        codigoCum: '19928456-1',
        concentracion: '5mg/mL',
        via: 'Nebulización continua',
        cantidad: 3,
        precio: 3500
      },
      {
        nombre: 'Bromuro de Ipratropio',
        codigoCum: '19935678-1',
        concentracion: '0.25mg/mL',
        via: 'Nebulización',
        cantidad: 2,
        precio: 4200
      },
      {
        nombre: 'Metilprednisolona 40mg Ampolla',
        codigoCum: '19923456-1',
        concentracion: '40mg',
        via: 'IV',
        cantidad: 2,
        precio: 12000
      },
      {
        nombre: 'Sulfato de Magnesio 2g Ampolla',
        codigoCum: '19987654-1',
        concentracion: '2g/10mL',
        via: 'IV en 20min',
        cantidad: 1,
        precio: 5500
      }
    ]
  },

  // Kits Gastrointestinales
  {
    id: 'kit-gi-001',
    codigo: 'KIT-GI-001',
    nombre: 'Kit Gastritis/Dispepsia',
    categoria: 'Gastrointestinal',
    descripcion: 'Manejo de gastritis y dispepsia',
    color: 'green',
    medicamentos: [
      {
        nombre: 'Omeprazol 40mg Ampolla',
        codigoCum: '19945678-1',
        concentracion: '40mg',
        via: 'IV',
        cantidad: 1,
        precio: 6500
      },
      {
        nombre: 'Metoclopramida 10mg Ampolla',
        codigoCum: '19938756-1',
        concentracion: '10mg/2mL',
        via: 'IM/IV',
        cantidad: 1,
        precio: 1200
      }
    ]
  },
  {
    id: 'kit-gi-002',
    codigo: 'KIT-GI-002',
    nombre: 'Kit Cólico Abdominal',
    categoria: 'Gastrointestinal',
    descripcion: 'Manejo de dolor abdominal tipo cólico',
    color: 'green',
    medicamentos: [
      {
        nombre: 'Hioscina 20mg Ampolla',
        codigoCum: '19954321-1',
        concentracion: '20mg/1mL',
        via: 'IM/IV',
        cantidad: 1,
        precio: 2200
      },
      {
        nombre: 'Dipirona 1g Ampolla',
        codigoCum: '19997876-1',
        concentracion: '1g/2mL',
        via: 'IM/IV',
        cantidad: 1,
        precio: 2500
      }
    ]
  },
  {
    id: 'kit-gi-003',
    codigo: 'KIT-GI-003',
    nombre: 'Kit Vómito/Náuseas',
    categoria: 'Gastrointestinal',
    descripcion: 'Control de náuseas y vómitos',
    color: 'green',
    medicamentos: [
      {
        nombre: 'Ondansetrón 8mg Ampolla',
        codigoCum: '19967890-1',
        concentracion: '8mg/4mL',
        via: 'IV lento',
        cantidad: 1,
        precio: 8500
      },
      {
        nombre: 'Omeprazol 40mg Ampolla',
        codigoCum: '19945678-1',
        concentracion: '40mg',
        via: 'IV',
        cantidad: 1,
        precio: 6500
      }
    ]
  },

  // Kits Alérgicos
  {
    id: 'kit-alerg-001',
    codigo: 'KIT-ALRG-001',
    nombre: 'Kit Reacción Alérgica Leve',
    categoria: 'Alergias',
    descripcion: 'Manejo de urticaria y reacciones leves',
    color: 'orange',
    medicamentos: [
      {
        nombre: 'Difenhidramina 10mg Ampolla',
        codigoCum: '19912378-1',
        concentracion: '10mg/mL',
        via: 'IM/IV',
        cantidad: 1,
        precio: 1800
      },
      {
        nombre: 'Dexametasona 8mg Ampolla',
        codigoCum: '19934567-1',
        concentracion: '8mg/2mL',
        via: 'IM/IV',
        cantidad: 1,
        precio: 3500
      }
    ]
  },
  {
    id: 'kit-alerg-002',
    codigo: 'KIT-ALRG-002',
    nombre: 'Kit Anafilaxia',
    categoria: 'Alergias',
    descripcion: 'Tratamiento de emergencia para anafilaxia',
    color: 'orange',
    medicamentos: [
      {
        nombre: 'Adrenalina 1mg Ampolla',
        codigoCum: '19901111-1',
        concentracion: '1mg/mL',
        via: 'IM (muslo)',
        cantidad: 2,
        precio: 5500
      },
      {
        nombre: 'Difenhidramina 50mg Ampolla',
        codigoCum: '19912379-1',
        concentracion: '50mg/mL',
        via: 'IV lento',
        cantidad: 1,
        precio: 2500
      },
      {
        nombre: 'Hidrocortisona 200mg Ampolla',
        codigoCum: '19912346-1',
        concentracion: '200mg',
        via: 'IV',
        cantidad: 1,
        precio: 12000
      },
      {
        nombre: 'Solución Salina 0.9% 500mL',
        codigoCum: '19901235-1',
        concentracion: '0.9%',
        via: 'IV rápida',
        cantidad: 1,
        precio: 4500
      }
    ]
  },

  // Kits Neurológicos
  {
    id: 'kit-neuro-001',
    codigo: 'KIT-NEUR-001',
    nombre: 'Kit Cefalea/Migraña',
    categoria: 'Neurológico',
    descripcion: 'Tratamiento de cefalea severa y migraña',
    color: 'purple',
    medicamentos: [
      {
        nombre: 'Dipirona 1g Ampolla',
        codigoCum: '19997876-1',
        concentracion: '1g/2mL',
        via: 'IV lento',
        cantidad: 1,
        precio: 2500
      },
      {
        nombre: 'Metoclopramida 10mg Ampolla',
        codigoCum: '19938756-1',
        concentracion: '10mg/2mL',
        via: 'IV lento',
        cantidad: 1,
        precio: 1200
      },
      {
        nombre: 'Dexametasona 4mg Ampolla',
        codigoCum: '19934566-1',
        concentracion: '4mg/1mL',
        via: 'IV',
        cantidad: 1,
        precio: 2800
      }
    ]
  },
  {
    id: 'kit-neuro-002',
    codigo: 'KIT-NEUR-002',
    nombre: 'Kit Crisis Convulsiva',
    categoria: 'Neurológico',
    descripcion: 'Manejo inicial de convulsiones',
    color: 'purple',
    medicamentos: [
      {
        nombre: 'Diazepam 10mg Ampolla',
        codigoCum: '19923456-1',
        concentracion: '10mg/2mL',
        via: 'IV lento',
        cantidad: 2,
        precio: 3500
      },
      {
        nombre: 'Fenitoína 250mg Ampolla',
        codigoCum: '19945678-1',
        concentracion: '250mg/5mL',
        via: 'IV en infusión',
        cantidad: 3,
        precio: 8500
      },
      {
        nombre: 'Dextrosa 50% 50mL',
        codigoCum: '19956789-1',
        concentracion: '50%',
        via: 'IV',
        cantidad: 1,
        precio: 3200
      }
    ]
  },

  // Kits Cardiovasculares
  {
    id: 'kit-cardio-001',
    codigo: 'KIT-CARD-001',
    nombre: 'Kit Dolor Torácico',
    categoria: 'Cardiovascular',
    descripcion: 'Evaluación inicial de dolor torácico',
    color: 'pink',
    medicamentos: [
      {
        nombre: 'ASA 100mg Tab Masticable',
        codigoCum: '19901234-2',
        concentracion: '100mg',
        via: 'VO',
        cantidad: 3,
        precio: 500
      },
      {
        nombre: 'Nitroglicerina SL 0.4mg',
        codigoCum: '19923478-1',
        concentracion: '0.4mg',
        via: 'SL',
        cantidad: 1,
        precio: 4500
      },
      {
        nombre: 'Morfina 10mg Ampolla',
        codigoCum: '19934589-1',
        concentracion: '10mg/mL',
        via: 'IV titulado',
        cantidad: 1,
        precio: 8500
      }
    ]
  },
  {
    id: 'kit-cardio-002',
    codigo: 'KIT-CARD-002',
    nombre: 'Kit Crisis Hipertensiva',
    categoria: 'Cardiovascular',
    descripcion: 'Manejo de emergencia hipertensiva',
    color: 'pink',
    medicamentos: [
      {
        nombre: 'Furosemida 20mg Ampolla',
        codigoCum: '19945690-1',
        concentracion: '20mg/2mL',
        via: 'IV',
        cantidad: 2,
        precio: 2800
      },
      {
        nombre: 'Enalaprilato 1.25mg Ampolla',
        codigoCum: '19956701-1',
        concentracion: '1.25mg/mL',
        via: 'IV lento',
        cantidad: 1,
        precio: 15000
      }
    ]
  },

  // Kits Infecciosos
  {
    id: 'kit-infec-001',
    codigo: 'KIT-INF-001',
    nombre: 'Kit Infección Urinaria',
    categoria: 'Infeccioso',
    descripcion: 'Primera dosis antibiótico para IVU',
    color: 'yellow',
    medicamentos: [
      {
        nombre: 'Ceftriaxona 1g Ampolla',
        codigoCum: '19967812-1',
        concentracion: '1g',
        via: 'IV',
        cantidad: 1,
        precio: 8500
      },
      {
        nombre: 'Dipirona 1g Ampolla',
        codigoCum: '19997876-1',
        concentracion: '1g/2mL',
        via: 'IV',
        cantidad: 1,
        precio: 2500
      }
    ]
  },
  {
    id: 'kit-infec-002',
    codigo: 'KIT-INF-002',
    nombre: 'Kit Neumonía Ambulatoria',
    categoria: 'Infeccioso',
    descripcion: 'Primera dosis para neumonía comunitaria',
    color: 'yellow',
    medicamentos: [
      {
        nombre: 'Ampicilina/Sulbactam 1.5g Amp',
        codigoCum: '19978923-1',
        concentracion: '1.5g',
        via: 'IV',
        cantidad: 1,
        precio: 12000
      },
      {
        nombre: 'Dexametasona 4mg Ampolla',
        codigoCum: '19934566-1',
        concentracion: '4mg/1mL',
        via: 'IV',
        cantidad: 1,
        precio: 2800
      }
    ]
  },

  // Kits de Hidratación
  {
    id: 'kit-hidr-001',
    codigo: 'KIT-HID-001',
    nombre: 'Kit Hidratación Básica',
    categoria: 'Hidratación',
    descripcion: 'Hidratación IV para deshidratación leve',
    color: 'cyan',
    medicamentos: [
      {
        nombre: 'Solución Hartmann 500mL',
        codigoCum: '19901236-1',
        concentracion: 'Lactato Ringer',
        via: 'IV',
        cantidad: 1,
        precio: 5500
      },
      {
        nombre: 'Equipo de Macrogoteo',
        codigoCum: '19800001-1',
        concentracion: 'N/A',
        via: 'IV',
        cantidad: 1,
        precio: 3500
      }
    ]
  },
  {
    id: 'kit-hidr-002',
    codigo: 'KIT-HID-002',
    nombre: 'Kit Rehidratación Rápida',
    categoria: 'Hidratación',
    descripcion: 'Hidratación para deshidratación moderada-severa',
    color: 'cyan',
    medicamentos: [
      {
        nombre: 'Solución Salina 0.9% 1000mL',
        codigoCum: '19901237-1',
        concentracion: '0.9%',
        via: 'IV rápida',
        cantidad: 2,
        precio: 6500
      },
      {
        nombre: 'KCl 10mEq Ampolla',
        codigoCum: '19912348-1',
        concentracion: '10mEq/10mL',
        via: 'IV diluido',
        cantidad: 2,
        precio: 2800
      }
    ]
  }
];

// Agrupar kits por categoría
export const KITS_POR_CATEGORIA = KITS_MEDICAMENTOS.reduce((acc, kit) => {
  if (!acc[kit.categoria]) {
    acc[kit.categoria] = [];
  }
  acc[kit.categoria].push(kit);
  return acc;
}, {});

// Obtener todas las categorías
export const CATEGORIAS_KITS = Object.keys(KITS_POR_CATEGORIA);

// Calcular precio total de un kit
export const calcularPrecioKit = (kit) => {
  return kit.medicamentos.reduce((total, med) => total + (med.precio * med.cantidad), 0);
};

// Colores por categoría para UI
export const COLORES_CATEGORIA_KIT = {
  'Dolor': 'bg-red-100 text-red-700 border-red-200',
  'Respiratorio': 'bg-blue-100 text-blue-700 border-blue-200',
  'Gastrointestinal': 'bg-green-100 text-green-700 border-green-200',
  'Alergias': 'bg-orange-100 text-orange-700 border-orange-200',
  'Neurológico': 'bg-purple-100 text-purple-700 border-purple-200',
  'Cardiovascular': 'bg-pink-100 text-pink-700 border-pink-200',
  'Infeccioso': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Hidratación': 'bg-cyan-100 text-cyan-700 border-cyan-200'
};
