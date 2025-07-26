const http = require('http');

const BASE_URL = 'http://localhost:4000';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🧪 Testing All API Endpoints\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResult = await makeRequest('GET', '/health');
    console.log(`Status: ${healthResult.status}`);
    console.log('Response:', healthResult.data);
    console.log('✅ Health check completed\n');

    // Test 2: Main Endpoint
    console.log('2️⃣ Testing Main Endpoint...');
    const mainResult = await makeRequest('GET', '/');
    console.log(`Status: ${mainResult.status}`);
    console.log('Response:', mainResult.data);
    console.log('✅ Main endpoint completed\n');

    // Test 3: Voter Registration
    console.log('3️⃣ Testing Voter Registration...');
    const registerData = {
      matricNumber: 'TEST001',
      surname: 'Test User'
    };
    const registerResult = await makeRequest('POST', '/api/register', registerData);
    console.log(`Status: ${registerResult.status}`);
    console.log('Response:', registerResult.data);
    console.log('✅ Registration completed\n');

    // Test 4: Vote Casting
    console.log('4️⃣ Testing Vote Casting...');
    const voteData = {
      matricNumber: 'TEST001',
      code: registerResult.data.code || 'TEST123',
      candidate: 'Candidate A'
    };
    const voteResult = await makeRequest('POST', '/api/vote', voteData);
    console.log(`Status: ${voteResult.status}`);
    console.log('Response:', voteResult.data);
    console.log('✅ Vote casting completed\n');

    // Test 5: Get Results
    console.log('5️⃣ Testing Get Results...');
    const resultsResult = await makeRequest('GET', '/api/results');
    console.log(`Status: ${resultsResult.status}`);
    console.log('Response:', resultsResult.data);
    console.log('✅ Get results completed\n');

    // Test 6: View Individual Vote
    console.log('6️⃣ Testing View Individual Vote...');
    const viewVoteData = {
      matricNumber: 'TEST001'
    };
    const viewVoteResult = await makeRequest('POST', '/api/view-vote', viewVoteData);
    console.log(`Status: ${viewVoteResult.status}`);
    console.log('Response:', viewVoteResult.data);
    console.log('✅ View vote completed\n');

    console.log('🎉 All API endpoint tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testAllEndpoints(); 