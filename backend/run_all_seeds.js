/**
 * Master Seeder Script
 * Executes all project seeders sequentially without clearing the database.
 * Ensures idempotency and data preservation.
 */
require('dotenv').config();
const prisma = require('./db/prisma');

// Import seeders
const catalogsSeeder = require('./seeders/catalogs');
const rolesSeeder = require('./seeders/rolesAndPermissions');
const mainSeeder = require('./seeders');
const calidadTransactionalSeeder = require('./seeders/calidadTransactionalSeeders');
const calidad2ChecklistsSeeder = require('./seeders/calidad2Checklists');
const manualesFuncionesSeeder = require('./seeders/manualesFunciones');
const formatosTemplatesSeeder = require('./seeders/formatosTemplates');
const sstSeeder = require('./seeders/sst.seeder');

async function runAllSeeds() {
  console.log('🚀 Starting Master Seeder Execution...\n');
  const startTime = Date.now();
  const results = [];

  try {
    // 1. Catalogs (Independent)
    console.log('📦 [1/7] Running Catalogs Seeder...');
    try {
      await catalogsSeeder.main();
      results.push({ name: 'Catalogs', status: '✅ Success' });
    } catch (e) {
      console.error('❌ Catalogs Seeder Failed:', e);
      results.push({ name: 'Catalogs', status: '❌ Failed', error: e.message });
      // We might want to continue or stop. Let's continue for now but mark failure.
    }

    // 2. Roles and Permissions (Independent infrastructure)
    console.log('\n🔐 [2/7] Running Roles & Permissions Seeder...');
    try {
      await rolesSeeder.main();
      results.push({ name: 'Roles & Permissions', status: '✅ Success' });
    } catch (e) {
      console.error('❌ Roles Seeder Failed:', e);
      results.push({ name: 'Roles & Permissions', status: '❌ Failed', error: e.message });
    }

    // 3. Main Seeder (Users, Patients, Clinical Data, Quality Master Data)
    // This also calls calidadSeeders internally
    console.log('\n🏥 [3/7] Running Main Application Seeder...');
    try {
      // Pass { clean: false } to prevent database wiping
      await mainSeeder.main({ clean: false });
      results.push({ name: 'Main Seeder (Core + Quality Master)', status: '✅ Success' });
    } catch (e) {
      console.error('❌ Main Seeder Failed:', e);
      results.push({ name: 'Main Seeder', status: '❌ Failed', error: e.message });
    }

    // 4. Quality Transactional Seeder (Audits, Events, Measurements)
    console.log('\n📈 [4/7] Running Quality Transactional Seeder...');
    try {
      await calidadTransactionalSeeder.main();
      results.push({ name: 'Quality Transactional Seeder', status: '✅ Success' });
    } catch (e) {
      console.error('❌ Quality Transactional Seeder Failed:', e);
      results.push({ name: 'Quality Transactional Seeder', status: '❌ Failed', error: e.message });
    }

    // 5. Calidad 2.0 Checklists (Templates and Items for Personal, Inscripcion, Procesos)
    console.log('\n📋 [5/7] Running Calidad 2.0 Checklists Seeder...');
    try {
      await calidad2ChecklistsSeeder.main();
      results.push({ name: 'Calidad 2.0 Checklists', status: '✅ Success' });
    } catch (e) {
      console.error('❌ Calidad 2.0 Checklists Seeder Failed:', e);
      results.push({ name: 'Calidad 2.0 Checklists', status: '❌ Failed', error: e.message });
    }

    // 6. Manuales de Funciones
    console.log('\n📚 [6/7] Running Manuales de Funciones Seeder...');
    try {
      await manualesFuncionesSeeder();
      results.push({ name: 'Manuales de Funciones', status: '✅ Success' });
    } catch (e) {
      console.error('❌ Manuales de Funciones Seeder Failed:', e);
      results.push({ name: 'Manuales de Funciones', status: '❌ Failed', error: e.message });
    }

    // 7. Formatos Templates
    console.log('\n📄 [7/8] Running Formatos Templates Seeder...');
    try {
      await formatosTemplatesSeeder();
      results.push({ name: 'Formatos Templates', status: '✅ Success' });
    } catch (e) {
      console.error('❌ Formatos Templates Seeder Failed:', e);
      results.push({ name: 'Formatos Templates', status: '❌ Failed', error: e.message });
    }

    // 8. SST (Seguridad y Salud en el Trabajo)
    console.log('\n🦺 [8/8] Running SST Seeder...');
    try {
      await sstSeeder.main();
      results.push({ name: 'SST (Seguridad y Salud en el Trabajo)', status: '✅ Success' });
    } catch (e) {
      console.error('❌ SST Seeder Failed:', e);
      results.push({ name: 'SST', status: '❌ Failed', error: e.message });
    }

  } catch (error) {
    console.error('\n💥 Critical Error in Master Seeder:', error);
  } finally {
    await prisma.$disconnect();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(50));
    console.log(`🏁 Execution Finished in ${duration}s`);
    console.log('='.repeat(50));
    console.log('Execution Report:');
    results.forEach(r => {
      console.log(`${r.name}: ${r.status} ${r.error ? `(${r.error})` : ''}`);
    });
    console.log('='.repeat(50));
    
    // Exit with code 1 if any failure
    if (results.some(r => r.status.includes('Failed'))) {
      process.exit(1);
    }
  }
}

// Execute
if (require.main === module) {
  runAllSeeds();
}
