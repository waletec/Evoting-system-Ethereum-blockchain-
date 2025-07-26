const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test main endpoint
    console.log('\n2. Testing main endpoint...');
    const mainResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Main endpoint:', mainResponse.data);

    // Test voter registration
    console.log('\n3. Testing voter registration...');
    const registerResponse = await axios.post(`${BASE_URL}/api/register`, {
      matricNumber: 'TEST001',
      surname: 'Test User'
    });
    console.log('✅ Registration:', registerResponse.data);

    // Test vote casting
    console.log('\n4. Testing vote casting...');
    const voteResponse = await axios.post(`${BASE_URL}/api/vote`, {
      matricNumber: 'TEST001',
      code: registerResponse.data.code,
      candidate: 'Candidate A'
    });
    console.log('✅ Vote casting:', voteResponse.data);

    // Test getting results
    console.log('\n5. Testing get results...');
    const resultsResponse = await axios.get(`${BASE_URL}/api/results`);
    console.log('✅ Results:', resultsResponse.data);

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPI(); 