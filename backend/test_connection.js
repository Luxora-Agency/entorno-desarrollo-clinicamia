const fetch = require('node-fetch');
async function test() {
  try {
    const res = await fetch('http://localhost:4000/health');
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(data));
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
