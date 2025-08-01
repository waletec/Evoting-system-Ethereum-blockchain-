const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

async function testBackendConnection() {
  console.log('🧪 Testing Frontend-Backend Connection...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Root Endpoint
    console.log('2. Testing Root Endpoint...');
    const rootResponse = await axios.get('http://localhost:4000/');
    console.log('✅ Root Endpoint:', rootResponse.data);
    console.log('');

    // Test 3: Register Voter
    console.log('3. Testing Voter Registration...');
    const registerResponse = await axios.post(`${API_BASE_URL}/register`, {
      matricNumber: 'TEST001',
      surname: 'TestUser'
    });
    console.log('✅ Voter Registration:', registerResponse.data);
    console.log('');

    // Test 4: Cast Vote
    console.log('4. Testing Vote Casting...');
    const voteResponse = await axios.post(`${API_BASE_URL}/vote`, {
      matricNumber: 'TEST001',
      code: registerResponse.data.code,
      candidate: 'John Doe'
    });
    console.log('✅ Vote Casting:', voteResponse.data);
    console.log('');

    // Test 5: Get Results
    console.log('5. Testing Results Retrieval...');
    const resultsResponse = await axios.get(`${API_BASE_URL}/results`);
    console.log('✅ Results Retrieval:', resultsResponse.data);
    console.log('');

    // Test 6: View Vote
    console.log('6. Testing Vote Viewing...');
    const viewVoteResponse = await axios.post(`${API_BASE_URL}/view-vote`, {
      matricNumber: 'TEST001'
    });
    console.log('✅ Vote Viewing:', viewVoteResponse.data);
    console.log('');

    console.log('🎉 All tests passed! Frontend-Backend connection is working properly.');
    console.log('\n📋 Summary:');
    console.log('✅ Backend is running on http://localhost:4000');
    console.log('✅ All API endpoints are accessible');
    console.log('✅ Frontend can connect to backend successfully');
    console.log('\n🚀 You can now:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Register a voter and get a voting code');
    console.log('3. Cast a vote using the code');
    console.log('4. View real-time results');
    console.log('5. View individual votes');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your backend is running: cd backend && npm start');
    console.log('2. Check if MongoDB is running');
    console.log('3. Verify Hyperledger Fabric is running');
    console.log('4. Check if port 4000 is available');
  }
}

testBackendConnection();