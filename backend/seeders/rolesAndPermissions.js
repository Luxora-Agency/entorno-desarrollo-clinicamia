const prisma = require('../db/prisma');

const PERMISSIONS = [
  // Users
  { name: 'users.view', description: 'View users list and details', module: 'users' },
  { name: 'users.create', description: 'Create new users', module: 'users' },
  { name: 'users.update', description: 'Update user details', module: 'users' },
  { name: 'users.delete', description: 'Delete users', module: 'users' },
  
  // Roles
  { name: 'roles.view', description: 'View roles', module: 'roles' },
  { name: 'roles.create', description: 'Create new roles', module: 'roles' },
  { name: 'roles.update', description: 'Update roles', module: 'roles' },
  { name: 'roles.delete', description: 'Delete roles', module: 'roles' },
  { name: 'roles.assign', description: 'Assign roles to users', module: 'roles' },
  
  // Audit
  { name: 'audit.view', description: 'View audit logs', module: 'audit' },
  
  // Patients
  { name: 'patients.view', description: 'View patients', module: 'patients' },
  { name: 'patients.create', description: 'Create patients', module: 'patients' },
  { name: 'patients.update', description: 'Update patients', module: 'patients' },
  { name: 'patients.delete', description: 'Delete patients', module: 'patients' },
  
  // Appointments
  { name: 'appointments.view', description: 'View appointments', module: 'appointments' },
  { name: 'appointments.create', description: 'Create appointments', module: 'appointments' },
  { name: 'appointments.update', description: 'Update appointments', module: 'appointments' },
  { name: 'appointments.delete', description: 'Delete appointments', module: 'appointments' },
  
  // Medical Records (HCE)
  { name: 'medical_records.view', description: 'View medical records', module: 'medical_records' },
  { name: 'medical_records.create', description: 'Create medical records', module: 'medical_records' },
  { name: 'medical_records.update', description: 'Update medical records', module: 'medical_records' },
  
  // Billing
  { name: 'billing.view', description: 'View invoices', module: 'billing' },
  { name: 'billing.create', description: 'Create invoices', module: 'billing' },
  { name: 'billing.update', description: 'Update invoices', module: 'billing' },

  // Calidad 2.0
  { name: 'calidad2.view', description: 'Ver módulo Calidad 2.0', module: 'calidad2' },
  { name: 'calidad2.create', description: 'Crear registros en Calidad 2.0', module: 'calidad2' },
  { name: 'calidad2.update', description: 'Actualizar registros en Calidad 2.0', module: 'calidad2' },
  { name: 'calidad2.delete', description: 'Eliminar registros en Calidad 2.0', module: 'calidad2' },
  { name: 'calidad2.admin', description: 'Administrar configuración de Calidad 2.0', module: 'calidad2' },

  // Talento Humano (RRHH)
  { name: 'talento-humano.view', description: 'Ver módulo Talento Humano', module: 'talento-humano' },
  { name: 'talento-humano.create', description: 'Crear registros en Talento Humano', module: 'talento-humano' },
  { name: 'talento-humano.update', description: 'Actualizar registros en Talento Humano', module: 'talento-humano' },
  { name: 'talento-humano.delete', description: 'Eliminar registros en Talento Humano', module: 'talento-humano' },
  { name: 'talento-humano.admin', description: 'Administrar configuración de Talento Humano', module: 'talento-humano' },
  { name: 'talento-humano.nomina', description: 'Gestionar nómina y compensaciones', module: 'talento-humano' },
  { name: 'talento-humano.evaluaciones', description: 'Gestionar evaluaciones de desempeño', module: 'talento-humano' },

  // SST - Seguridad y Salud en el Trabajo (Decreto 1072/2015, Res. 0312/2019)
  { name: 'sst.view', description: 'Ver módulo SST', module: 'sst' },
  { name: 'sst.create', description: 'Crear registros en SST', module: 'sst' },
  { name: 'sst.update', description: 'Actualizar registros en SST', module: 'sst' },
  { name: 'sst.delete', description: 'Eliminar registros en SST', module: 'sst' },
  { name: 'sst.admin', description: 'Administrar SG-SST', module: 'sst' },
  { name: 'sst.accidentes', description: 'Gestionar accidentes e investigaciones', module: 'sst' },
  { name: 'sst.copasst', description: 'Gestionar COPASST y reuniones', module: 'sst' },
  { name: 'sst.examenes', description: 'Gestionar exámenes médicos ocupacionales', module: 'sst' },

  // Siigo - Facturación Electrónica y Contabilidad
  { name: 'siigo.read', description: 'Ver configuración y estado de Siigo', module: 'siigo' },
  { name: 'siigo.write', description: 'Modificar configuración y sincronizar con Siigo', module: 'siigo' },
  { name: 'siigo.invoices', description: 'Emitir facturas electrónicas', module: 'siigo' },
  { name: 'siigo.reports', description: 'Ver reportes contables de Siigo', module: 'siigo' },
  { name: 'siigo.admin', description: 'Administrar configuración de Siigo', module: 'siigo' },
];

const ROLES = [
  {
    name: 'SUPER_ADMIN',
    description: 'System Administrator with full access',
    isSystem: true,
    permissions: ['*'] // Special handling for * in logic, but here we assign all
  },
  {
    name: 'ADMIN',
    description: 'Administrator',
    permissions: ['users.*', 'roles.*', 'audit.*', 'billing.*', 'patients.*', 'appointments.*', 'calidad2.*', 'talento-humano.*', 'sst.*', 'siigo.*']
  },
  {
    name: 'DOCTOR',
    description: 'Medical Doctor',
    permissions: ['patients.view', 'patients.update', 'appointments.*', 'medical_records.*']
  },
  {
    name: 'NURSE',
    description: 'Nurse',
    permissions: ['patients.view', 'appointments.view', 'medical_records.view', 'medical_records.create']
  },
  {
    name: 'RECEPTIONIST',
    description: 'Receptionist',
    permissions: ['patients.*', 'appointments.*', 'billing.create', 'billing.view']
  },
  {
    name: 'PATIENT',
    description: 'Patient - Portal de pacientes',
    permissions: ['patients.view', 'appointments.view', 'appointments.create', 'medical_records.view']
  },
  {
    name: 'PHARMACIST',
    description: 'Pharmacist - Farmacia',
    permissions: ['patients.view', 'medical_records.view', 'billing.view', 'billing.create']
  },
  {
    name: 'LAB_TECHNICIAN',
    description: 'Laboratory Technician - Laboratorio',
    permissions: ['patients.view', 'medical_records.view', 'medical_records.create']
  }
];

async function seedPermissions() {
  console.log('Seeding permissions...');
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: p,
      create: p
    });
  }
  console.log('Permissions seeded.');
}

async function seedRoles() {
  console.log('Seeding roles...');
  const allPermissions = await prisma.permission.findMany();
  
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, isSystem: r.isSystem },
      create: { name: r.name, description: r.description, isSystem: r.isSystem }
    });
    
    // Assign permissions
    let rolePermissions = [];
    if (r.permissions.includes('*')) {
      rolePermissions = allPermissions;
    } else {
      rolePermissions = allPermissions.filter(p => {
        return r.permissions.some(rp => {
          if (rp.endsWith('.*')) {
            const module = rp.split('.')[0];
            return p.module === module;
          }
          return rp === p.name;
        });
      });
    }
    
    // Clear existing permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    
    // Add new permissions
    if (rolePermissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: rolePermissions.map(p => ({
          roleId: role.id,
          permissionId: p.id
        }))
      });
    }
    console.log(`Role ${r.name} seeded with ${rolePermissions.length} permissions.`);
  }
}

async function main() {
  try {
    await seedPermissions();
    await seedRoles();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
