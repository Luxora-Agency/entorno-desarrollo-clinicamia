const prisma = require('../../db/prisma');

const indicadores = [
  {
    codigo: 'DEST_INCINERACION',
    nombre: 'Destinación para Incineración',
    objetivo: 'Dejar evidencia del total de residuos incinerados',
    alcance: 'Monitoria interna del sistema',
    dominio: 'AMBIENTAL',
    numeradorDescripcion: 'Cantidad de residuos incinerados (Kg/mes)',
    denominadorDescripcion: 'Cantidad total de residuos producidos (Kg/mes)',
    formulaCalculo: '(Residuos incinerados / Total residuos) * 100',
    tipoCalculo: 'AUTOMATICO',
    fuenteDatos: ['Registros RH1', 'PGIRHS'],
    responsableKPI: 'Líder de Medio Ambiente',
    responsableMedicion: 'Comité de Medio Ambiente',
    frecuencia: 'MENSUAL',
    metaValor: null,
    metaTipo: null,
  },
  {
    codigo: 'DEST_OTRO_SISTEMA',
    nombre: 'Destinación para Otro Sistema (Esterilización)',
    objetivo: 'Evidenciar residuos sometidos a esterilización + relleno industrial',
    alcance: 'Monitoria interna del sistema',
    dominio: 'AMBIENTAL',
    numeradorDescripcion: 'Cantidad de residuos sometidos a esterilización (Kg/mes)',
    denominadorDescripcion: 'Cantidad total de residuos producidos (Kg/mes)',
    formulaCalculo: '(Residuos esterilizados / Total residuos) * 100',
    tipoCalculo: 'AUTOMATICO',
    fuenteDatos: ['Registros RH1', 'PGIRHS'],
    responsableKPI: 'Líder de Medio Ambiente',
    responsableMedicion: 'Comité de Medio Ambiente',
    frecuencia: 'MENSUAL',
    metaValor: null,
    metaTipo: null,
  },
  {
    codigo: 'DEST_RECICLAJE',
    nombre: 'Destinación para Reciclaje',
    objetivo: 'Evidenciar el total de residuos reciclados',
    alcance: 'Monitoria interna del sistema',
    dominio: 'AMBIENTAL',
    numeradorDescripcion: 'Cantidad de residuos reciclados (Kg/mes)',
    denominadorDescripcion: 'Cantidad total de residuos producidos (Kg/mes)',
    formulaCalculo: '(Residuos reciclados / Total residuos) * 100',
    tipoCalculo: 'AUTOMATICO',
    fuenteDatos: ['Registros RH1', 'PGIRHS'],
    responsableKPI: 'Líder de Medio Ambiente',
    responsableMedicion: 'Comité de Medio Ambiente',
    frecuencia: 'MENSUAL',
    metaValor: null,
    metaTipo: null,
  },
  {
    codigo: 'CUMPLIMIENTO_CAPACITACIONES',
    nombre: 'Cumplimiento de Capacitaciones Presupuestadas',
    objetivo: 'Evidenciar el cumplimiento del plan de capacitaciones',
    alcance: 'Monitoria interna del sistema',
    dominio: 'SEGURIDAD',
    numeradorDescripcion: 'Capacitaciones realizadas',
    denominadorDescripcion: 'Capacitaciones presupuestadas',
    formulaCalculo: '(Capacitaciones realizadas / Capacitaciones presupuestadas) * 100',
    tipoCalculo: 'MANUAL',
    fuenteDatos: ['Plan de capacitaciones', 'Actas de asistencia'],
    responsableKPI: 'Comité de Medio Ambiente',
    responsableMedicion: 'Comité de Medio Ambiente',
    frecuencia: 'CUATRIMESTRAL',
    metaValor: 80, // Meta: 80% de cumplimiento
    metaTipo: 'MAYOR_IGUAL',
  },
  {
    codigo: 'FRECUENCIA_ACCIDENTES',
    nombre: 'De Frecuencia (Accidentes de Trabajo)',
    objetivo: 'Evidenciar la frecuencia de accidentes por residuos hospitalarios',
    alcance: 'Monitoria interna del sistema',
    dominio: 'SEGURIDAD',
    numeradorDescripcion: 'Número de accidentes mensuales por residuos hospitalarios',
    denominadorDescripcion: 'Horas hombre trabajadas',
    formulaCalculo: '(Accidentes mensuales / Horas hombre trabajadas) * K (constante)',
    tipoCalculo: 'MANUAL',
    fuenteDatos: ['Registro de accidentes', 'Control de horas trabajadas'],
    responsableKPI: 'Líder de Seguridad y Salud en el Trabajo',
    responsableMedicion: 'Comité de SST',
    frecuencia: 'MENSUAL',
    metaValor: 5, // Meta: Índice menor a 5
    metaTipo: 'MENOR_IGUAL',
  },
  {
    codigo: 'GRAVEDAD_ACCIDENTES',
    nombre: 'De Gravedad (Incapacidad)',
    objetivo: 'Evidenciar la gravedad de los accidentes (días de incapacidad)',
    alcance: 'Monitoria interna del sistema',
    dominio: 'SEGURIDAD',
    numeradorDescripcion: 'Días de incapacidad por accidentes',
    denominadorDescripcion: 'Horas hombre trabajadas',
    formulaCalculo: '(Días incapacidad / Horas hombre trabajadas) * K (constante)',
    tipoCalculo: 'MANUAL',
    fuenteDatos: ['Registro de incapacidades', 'Control de horas trabajadas'],
    responsableKPI: 'Líder de Seguridad y Salud en el Trabajo',
    responsableMedicion: 'Comité de SST',
    frecuencia: 'MENSUAL',
    metaValor: 10, // Meta: Índice menor a 10
    metaTipo: 'MENOR_IGUAL',
  },
  {
    codigo: 'INCIDENCIA_ACCIDENTES',
    nombre: 'De Incidencia (Accidentes por Personal)',
    objetivo: 'Evidenciar la tasa de accidentes por número de personal expuesto',
    alcance: 'Monitoria interna del sistema',
    dominio: 'SEGURIDAD',
    numeradorDescripcion: 'Número de accidentes mensuales',
    denominadorDescripcion: 'Número de personas expuestas',
    formulaCalculo: '(Accidentes mensuales / Personas expuestas) * K (constante)',
    tipoCalculo: 'MANUAL',
    fuenteDatos: ['Registro de accidentes', 'Nómina de personal'],
    responsableKPI: 'Líder de Seguridad y Salud en el Trabajo',
    responsableMedicion: 'Comité de SST',
    frecuencia: 'MENSUAL',
    metaValor: 3, // Meta: Índice menor a 3
    metaTipo: 'MENOR_IGUAL',
  },
];

async function seedIndicadoresPGIRASA() {
  console.log('🌱 Seeding Indicadores PGIRASA...');

  for (const indicador of indicadores) {
    try {
      const existing = await prisma.indicadorPGIRASA.findUnique({
        where: { codigo: indicador.codigo },
      });

      if (existing) {
        // Actualizar si ya existe
        await prisma.indicadorPGIRASA.update({
          where: { codigo: indicador.codigo },
          data: indicador,
        });
        console.log(`  ✓ Actualizado: ${indicador.codigo} - ${indicador.nombre}`);
      } else {
        // Crear nuevo
        await prisma.indicadorPGIRASA.create({
          data: indicador,
        });
        console.log(`  ✓ Creado: ${indicador.codigo} - ${indicador.nombre}`);
      }
    } catch (error) {
      console.error(`  ✗ Error con indicador ${indicador.codigo}:`, error.message);
    }
  }

  console.log('✅ Indicadores PGIRASA seeded exitosamente');
  console.log(`   Total: ${indicadores.length} indicadores`);
  console.log(`   Automáticos: ${indicadores.filter(i => i.tipoCalculo === 'AUTOMATICO').length}`);
  console.log(`   Manuales: ${indicadores.filter(i => i.tipoCalculo === 'MANUAL').length}`);
}

module.exports = { seedIndicadoresPGIRASA };

// Ejecutar si se llama directamente
if (require.main === module) {
  seedIndicadoresPGIRASA()
    .then(() => {
      console.log('\n🎉 Seeding completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en seeding:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
