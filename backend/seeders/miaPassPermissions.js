/**
 * Seeder: MiaPass RBAC Permissions
 *
 * Este script crea los permisos RBAC para el módulo MiaPass
 * y los asigna a los roles correspondientes.
 */
const prisma = require('../db/prisma');

const miaPassPermissions = [
  // Planes
  { name: 'miapass.planes.read', description: 'Ver planes MiaPass', module: 'miapass' },
  { name: 'miapass.planes.create', description: 'Crear planes MiaPass', module: 'miapass' },
  { name: 'miapass.planes.update', description: 'Actualizar planes MiaPass', module: 'miapass' },
  { name: 'miapass.planes.toggle', description: 'Activar/desactivar planes MiaPass', module: 'miapass' },

  // Suscripciones
  { name: 'miapass.suscripciones.read', description: 'Ver suscripciones MiaPass', module: 'miapass' },
  { name: 'miapass.suscripciones.create', description: 'Crear suscripciones MiaPass', module: 'miapass' },
  { name: 'miapass.suscripciones.cancel', description: 'Cancelar suscripciones MiaPass', module: 'miapass' },
  { name: 'miapass.suscripciones.anular', description: 'Anular suscripciones MiaPass', module: 'miapass' },
  { name: 'miapass.suscripciones.devolver', description: 'Registrar devoluciones MiaPass', module: 'miapass' },

  // Cupones
  { name: 'miapass.cupones.read', description: 'Ver cupones MiaPass', module: 'miapass' },
  { name: 'miapass.cupones.create', description: 'Crear cupones MiaPass', module: 'miapass' },
  { name: 'miapass.cupones.update', description: 'Actualizar cupones MiaPass', module: 'miapass' },
  { name: 'miapass.cupones.toggle', description: 'Activar/desactivar cupones MiaPass', module: 'miapass' },
  { name: 'miapass.cupones.delete', description: 'Eliminar cupones MiaPass', module: 'miapass' },

  // Comisiones
  { name: 'miapass.comisiones.read_own', description: 'Ver comisiones propias', module: 'miapass' },
  { name: 'miapass.comisiones.read_all', description: 'Ver todas las comisiones', module: 'miapass' },

  // Cortes
  { name: 'miapass.cortes.generate', description: 'Generar cortes de comisiones', module: 'miapass' },
  { name: 'miapass.cortes.pay', description: 'Registrar pagos de comisiones', module: 'miapass' },

  // Reportes
  { name: 'miapass.reportes.ventas', description: 'Ver reporte de ventas MiaPass', module: 'miapass' },
  { name: 'miapass.reportes.comisiones', description: 'Ver reporte de comisiones MiaPass', module: 'miapass' },
  { name: 'miapass.reportes.conversion', description: 'Ver reporte de conversión MiaPass', module: 'miapass' },

  // Formularios
  { name: 'miapass.formularios.read', description: 'Ver formularios de contacto MiaPass', module: 'miapass' },
  { name: 'miapass.formularios.update', description: 'Actualizar formularios MiaPass', module: 'miapass' },
  { name: 'miapass.formularios.delete', description: 'Eliminar formularios MiaPass', module: 'miapass' },
  { name: 'miapass.formularios.convertir', description: 'Convertir formularios a suscripción', module: 'miapass' },

  // Dashboard
  { name: 'miapass.dashboard.view', description: 'Ver dashboard MiaPass', module: 'miapass' },
  { name: 'miapass.dashboard.admin', description: 'Ver dashboard admin MiaPass', module: 'miapass' },

  // Vendedores
  { name: 'miapass.vendedores.read_own', description: 'Ver estado propio de vendedor', module: 'miapass' },
  { name: 'miapass.vendedores.read_all', description: 'Ver todos los vendedores', module: 'miapass' },
  { name: 'miapass.vendedores.manage', description: 'Gestionar vendedores MiaPass', module: 'miapass' }
];

// Mapeo de roles a permisos
const rolePermissionMap = {
  SUPER_ADMIN: miaPassPermissions.map(p => p.name),
  ADMIN: miaPassPermissions.map(p => p.name),
  DIRECTOR_COMERCIAL: [
    'miapass.planes.read',
    'miapass.suscripciones.read',
    'miapass.suscripciones.create',
    'miapass.suscripciones.cancel',
    'miapass.cupones.read',
    'miapass.cupones.create',
    'miapass.cupones.update',
    'miapass.cupones.toggle',
    'miapass.cupones.delete',
    'miapass.comisiones.read_all',
    'miapass.cortes.generate',
    'miapass.reportes.ventas',
    'miapass.reportes.comisiones',
    'miapass.reportes.conversion',
    'miapass.formularios.read',
    'miapass.formularios.update',
    'miapass.formularios.convertir',
    'miapass.dashboard.view',
    'miapass.dashboard.admin',
    'miapass.vendedores.read_all',
    'miapass.vendedores.manage'
  ],
  VENDEDOR: [
    'miapass.planes.read',
    'miapass.suscripciones.read',
    'miapass.suscripciones.create',
    'miapass.cupones.read',
    'miapass.comisiones.read_own',
    'miapass.formularios.read',
    'miapass.formularios.update',
    'miapass.formularios.convertir',
    'miapass.dashboard.view',
    'miapass.vendedores.read_own'
  ],
  RECEPCIONISTA: [
    'miapass.planes.read',
    'miapass.suscripciones.read',
    'miapass.suscripciones.create',
    'miapass.cupones.read',
    'miapass.formularios.read',
    'miapass.formularios.update'
  ]
};

async function seedMiaPassPermissions() {
  console.log('[MiaPass Permissions] Iniciando seeder...');

  try {
    // 1. Crear permisos
    console.log('[MiaPass Permissions] Creando permisos...');
    for (const perm of miaPassPermissions) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        create: {
          name: perm.name,
          description: perm.description,
          module: perm.module
        },
        update: {
          description: perm.description,
          module: perm.module
        }
      });
      console.log(`  + Permiso: ${perm.name}`);
    }

    // 2. Asignar permisos a roles
    console.log('[MiaPass Permissions] Asignando permisos a roles...');
    for (const [roleName, permNames] of Object.entries(rolePermissionMap)) {
      // Buscar el rol
      let role = await prisma.role.findFirst({ where: { name: roleName } });

      if (!role) {
        console.log(`  ! Rol ${roleName} no existe, creándolo...`);
        role = await prisma.role.create({
          data: {
            name: roleName,
            description: `Rol ${roleName}`,
            isSystem: roleName === 'SUPER_ADMIN' || roleName === 'ADMIN'
          }
        });
      }

      // Asignar permisos al rol
      for (const permName of permNames) {
        const permission = await prisma.permission.findUnique({
          where: { name: permName }
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id
              }
            },
            create: {
              roleId: role.id,
              permissionId: permission.id
            },
            update: {}
          });
        } else {
          console.log(`  ! Permiso ${permName} no encontrado`);
        }
      }
      console.log(`  + Rol ${roleName}: ${permNames.length} permisos asignados`);
    }

    console.log('[MiaPass Permissions] Seeder completado exitosamente.');
  } catch (error) {
    console.error('[MiaPass Permissions] Error:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedMiaPassPermissions()
    .then(() => {
      console.log('Seeder ejecutado correctamente');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error ejecutando seeder:', err);
      process.exit(1);
    });
}

module.exports = { seedMiaPassPermissions, miaPassPermissions };
