const axios = require('axios');
const { format } = require('date-fns');

// Configuration
const API_URL = 'http://localhost:3000/api';
const TOKEN = 'TEST_TOKEN'; // Simular token
const CONCURRENT_USERS = 50;
const DOCTOR_ID = 'test-doctor-id';

async function runStressTest() {
  console.log(`Starting stress test with ${CONCURRENT_USERS} concurrent requests...`);
  
  const promises = [];
  const errors = [];
  const successes = [];

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(
      axios.get(`${API_URL}/citas`, {
        params: { doctorId: DOCTOR_ID, limit: 100 },
        headers: { Authorization: `Bearer ${TOKEN}` }
      })
      .then(res => {
        successes.push(res.status);
      })
      .catch(err => {
        errors.push(err.message);
      })
    );
  }

  const startTime = Date.now();
  await Promise.all(promises);
  const endTime = Date.now();

  console.log('--- Stress Test Results ---');
  console.log(`Total Requests: ${CONCURRENT_USERS}`);
  console.log(`Successful: ${successes.length}`);
  console.log(`Failed: ${errors.length}`);
  console.log(`Time Elapsed: ${endTime - startTime}ms`);
  console.log(`Avg Response Time: ${(endTime - startTime) / CONCURRENT_USERS}ms`);
  
  if (errors.length > 0) {
    console.log('Sample Errors:', errors.slice(0, 3));
  }
}

// Only run if called directly
if (require.main === module) {
  runStressTest();
}
