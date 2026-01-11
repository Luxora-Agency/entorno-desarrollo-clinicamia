
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000';
let adminToken = '';
let cajaId = '';
let productId = '';
let ventaId = '';

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
    throw new Error(`${method} ${path} failed: ${JSON.stringify(data)}`);
  }
  return data;
}

async function run() {
  console.log('🔹 Testing Droguería Full Flow...');

  // 1. Login
  const loginRes = await req('POST', '/auth/login', null, { email: 'admin@clinicamia.com', password: 'admin123' });
  adminToken = loginRes.data.accessToken;
  console.log('   ✅ Logged in');

  // 2. Open Box (if not already open)
  try {
    const openRes = await req('POST', '/drogueria/caja/abrir', adminToken, { montoInicial: 200000 });
    cajaId = openRes.data.id;
    console.log('   ✅ Box Opened');
  } catch (e) {
    console.log('   ℹ️ Box might be already open, fetching active...');
    const activeRes = await req('GET', '/drogueria/caja/activa', adminToken);
    if (activeRes.data) {
        cajaId = activeRes.data.id;
        console.log('   ✅ Active box found');
    } else {
        throw new Error('Could not open or find box');
    }
  }

  // 3. Create Product
  const prodData = {
    nombre: 'Ibuprofeno Test',
    sku: `IBU-${Date.now()}`,
    precioVenta: 5000,
    stockActual: 100,
    stockMinimo: 10,
    porcentajeIva: 19,
    activo: true
  };
  const prodRes = await req('POST', '/drogueria/productos', adminToken, prodData);
  productId = prodRes.data.id;
  console.log('   ✅ Product created');

  // 4. Register Sale
  const ventaData = {
    clienteNombre: 'Test Client',
    metodoPago: 'Efectivo',
    descuentoManual: 1000, // Discount test
    items: [
      { drogueriaProductoId: productId, cantidad: 2 }
    ]
  };
  // Base: 5000 / 1.19 = 4201.68
  // Total item: 5000 * 2 = 10000
  // Total venta: 10000 - 1000 = 9000
  
  const ventaRes = await req('POST', '/drogueria/ventas', adminToken, ventaData);
  ventaId = ventaRes.data.id;
  console.log(`   ✅ Sale registered. Total: ${ventaRes.data.total}`);

  if (ventaRes.data.total !== 9000) throw new Error(`Total mismatch. Expected 9000, got ${ventaRes.data.total}`);

  // 5. Verify Stock
  const prodsRes = await req('GET', '/drogueria/productos?search=Ibuprofeno', adminToken);
  const updatedProd = prodsRes.data.find(p => p.id === productId);
  if (updatedProd.stockActual !== 98) throw new Error('Stock not updated');
  console.log('   ✅ Stock updated correctly');

  // 6. Void Sale (Anular)
  await req('POST', `/drogueria/ventas/${ventaId}/anular`, adminToken, { motivo: 'Test anulación' });
  console.log('   ✅ Sale voided');

  // 7. Verify Stock Return
  const prodsRes2 = await req('GET', '/drogueria/productos?search=Ibuprofeno', adminToken);
  const restoredProd = prodsRes2.data.find(p => p.id === productId);
  if (restoredProd.stockActual !== 100) throw new Error('Stock not restored after void');
  console.log('   ✅ Stock restored correctly');

  console.log('\n🎉 ALL TESTS PASSED');
}

run().catch(e => console.error(e));
