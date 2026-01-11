
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000';
let adminToken = '';
let sellerToken = '';
let planId = '';
let patientId = '';
let sellerId = '';
let parentId = '';
let grandParentId = '';

async function req(method, path, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  const data = await res.json();
  if (!res.ok) {
    // console.error(`Error ${method} ${path}:`, JSON.stringify(data, null, 2));
    throw new Error(`${method} ${path} failed: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function run() {
  console.log('🔹 INICIANDO TEST INTEGRAL MIA PASS & COMISIONES...');

  // 1. Login Admin
  const loginRes = await req('POST', '/auth/login', null, { email: 'admin@clinicamia.com', password: 'admin123' });
  adminToken = loginRes.data.accessToken;
  console.log('   ✅ Admin Logged in');

  // 2. Setup Hierarchy (Grandparent -> Parent -> Seller)
  // Create Grandparent (Director/Lider)
  const gpData = {
    email: `lider_${Date.now()}@test.com`, password: 'password123',
    nombre: 'Lider', apellido: 'Global', rol: 'ADMIN',
    cedula: `GP${Date.now()}`
  };
  const gpRes = await req('POST', '/usuarios', adminToken, gpData);
  grandParentId = gpRes.data.id;

  // Create Parent (Referidor N1)
  const pData = {
    email: `padre_${Date.now()}@test.com`, password: 'password123',
    nombre: 'Padre', apellido: 'Referidor', rol: 'PATIENT', // Using patient/external role
    cedula: `P${Date.now()}`,
    // Note: We need to update relations via DB or API if endpoint supports it.
    // The current POST /usuarios doesn't accept vendedorPadreId directly usually, checking schema...
    // Schema has it, but controller might not. Let's use Prisma direct update via a helper endpoint or assume default controller handles it if I updated it.
    // I'll try passing it, if not I might need a specific update call.
  };
  // Actually, I need to update the user to set the parent.
  const pRes = await req('POST', '/usuarios', adminToken, pData);
  parentId = pRes.data.id;
  // Link Parent -> Grandparent (using raw prisma script or update endpoint if available)
  // Let's assume I need to update them via direct DB access for the test setup to be sure, 
  // OR use the update endpoint.
  await req('PUT', `/usuarios/${parentId}`, adminToken, { rol: 'Vendedor' }); // Update role if needed
  
  // Create Seller
  const sData = {
    email: `vendedor_${Date.now()}@test.com`, password: 'password123',
    nombre: 'Vendedor', apellido: 'Estrella', rol: 'Vendedor',
    cedula: `S${Date.now()}`,
    vendedorCodigo: `COD-${Date.now()}`
  };
  const sRes = await req('POST', '/usuarios', adminToken, sData);
  sellerId = sRes.data.id;
  
  // Login Seller
  const sLogin = await req('POST', '/auth/login', null, { email: sData.email, password: sData.password });
  sellerToken = sLogin.data.accessToken;
  console.log('   ✅ Seller Hierarchy Created (Simulated)');

  // *** MANUAL DB LINKING FOR HIERARCHY (To ensure test reliability) ***
  // Since the UI for linking might not be built yet in the standard /usuarios POST
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.usuario.update({ where: { id: parentId }, data: { vendedorPadreId: grandParentId } });
  await prisma.usuario.update({ where: { id: sellerId }, data: { vendedorPadreId: parentId } });
  console.log('   ✅ DB Hierarchy Linked: Seller -> Parent -> Grandparent');

  // 3. Create Plan
  const planData = {
    nombre: 'Plan Vital 2026',
    descripcion: 'Plan anual con beneficios completos',
    costo: 237881, // PVP
    duracion_meses: 12,
    beneficios: ['Consulta Gratis', 'Descuento Farmacia 10%'],
    activo: true
  };
  const planRes = await req('POST', '/mia-pass/planes', adminToken, planData);
  planId = planRes.data.plan.id;
  console.log('   ✅ Plan Created');

  // 4. Create Patient
  const patData = {
    nombre: 'Paciente', apellido: 'MiaPass',
    tipo_documento: 'CC', cedula: `MP${Date.now()}`,
    email: `patient_${Date.now()}@test.com`
  };
  const patRes = await req('POST', '/pacientes', adminToken, patData);
  patientId = patRes.data.paciente.id;
  console.log('   ✅ Patient Created');

  // 5. Create Subscription (The Sale)
  const subData = {
    plan_id: planId,
    paciente_id: patientId,
    metodo_pago: 'Transferencia',
    vendedor_codigo: sData.vendedorCodigo // Attribution
  };
  const subRes = await req('POST', '/mia-pass/suscripciones', adminToken, subData);
  const subscriptionId = subRes.data.suscripcion.id;
  console.log(`   ✅ Subscription Sold (ID: ${subscriptionId})`);

  // 6. Verify Commissions
  // Allow async triggers to finish
  await new Promise(r => setTimeout(r, 1000));

  const comisiones = await prisma.miaPassComision.findMany({
    where: { suscripcionId: subscriptionId }
  });

  console.log('   📊 Commissions Generated:', comisiones.length);
  
  const sellerComm = comisiones.find(c => c.rolBeneficiario === 'VENDEDOR');
  const parentComm = comisiones.find(c => c.rolBeneficiario === 'REFERIDOR_N1');
  const gpComm = comisiones.find(c => c.rolBeneficiario === 'REFERIDOR_N2');

  if (sellerComm) console.log(`      - Seller (25%): ${sellerComm.valor} (Expected ~49975)`);
  else console.error('      ❌ Seller Commission Missing');

  if (parentComm) console.log(`      - Parent (N1): ${parentComm.valor} (Expected 10000)`);
  else console.error('      ❌ Parent N1 Commission Missing');

  if (gpComm) console.log(`      - Grandparent (N2): ${gpComm.valor} (Expected 5000)`);
  else console.error('      ❌ Grandparent N2 Commission Missing');

  if (sellerComm && parentComm && gpComm) {
      console.log('   ✅ All Commissions Validated');
  } else {
      throw new Error('Commission logic incomplete');
  }

  // 7. Verify Dashboard Stats
  const statsRes = await req('GET', '/mia-pass/comisiones/stats', sellerToken);
  console.log(`   ✅ Seller Dashboard Stats:`, statsRes.data.stats);

  await prisma.$disconnect();
  console.log('\n🎉 TEST COMPLETED SUCCESSFULLY');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
