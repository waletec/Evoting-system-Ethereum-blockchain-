const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testIntegration() {
  console.log('🧪 Testing Complete E-Voting System Integration...\n');

  try {
    // 1. Test backend health
    console.log('1. Testing backend health...');
    const health = await axios.get('http://localhost:4000/health');
    console.log('✅ Backend is healthy:', health.data.status);

    // 2. Create an election
    console.log('\n2. Creating election...');
    const electionData = {
      title: "Student Union Election 2024",
      description: "Annual student union leadership election for academic year 2024-2025"
    };
    
    const electionResponse = await axios.post(`${API_BASE}/election/create-or-update`, electionData);
    console.log('✅ Election created:', electionResponse.data.election.title);

    // 3. Add candidates
    console.log('\n3. Adding candidates...');
    const candidates = [
      {
        fullName: "John Doe",
        email: "john.doe@university.edu",
        phone: "08012345678",
        matricNumber: "CS/2021/001",
        position: "President",
        department: "Computer Science",
        agreedToRules: true
      },
      {
        fullName: "Jane Smith",
        email: "jane.smith@university.edu",
        phone: "08087654321",
        matricNumber: "ENG/2021/002",
        position: "Vice President",
        department: "Engineering",
        agreedToRules: true
      },
      {
        fullName: "Mike Johnson",
        email: "mike.johnson@university.edu",
        phone: "08011223344",
        matricNumber: "CS/2021/003",
        position: "President",
        department: "Computer Science",
        agreedToRules: true
      }
    ];

    for (const candidate of candidates) {
      const candidateResponse = await axios.post(`${API_BASE}/candidates/create`, candidate);
      console.log(`✅ Candidate added: ${candidateResponse.data.candidate.fullName} (${candidateResponse.data.candidate.position})`);
    }

    // 4. Add voters
    console.log('\n4. Adding voters...');
    const voters = [
      {
        firstName: "Alice",
        surname: "Brown",
        matricNumber: "CS/2022/001",
        department: "Computer Science",
        faculty: "Engineering"
      },
      {
        firstName: "Bob",
        surname: "Wilson",
        matricNumber: "ENG/2022/002",
        department: "Mechanical Engineering",
        faculty: "Engineering"
      },
      {
        firstName: "Carol",
        surname: "Davis",
        matricNumber: "BUS/2022/003",
        department: "Business Administration",
        faculty: "Management Sciences"
      }
    ];

    const votersResponse = await axios.post(`${API_BASE}/voters/bulk-create`, { voters });
    console.log(`✅ ${votersResponse.data.createdVoters.length} voters added`);

    // 5. Start the election
    console.log('\n5. Starting election...');
    const startResponse = await axios.post(`${API_BASE}/election/start`);
    console.log('✅ Election started:', startResponse.data.election.title);

    // 6. Test election info endpoint
    console.log('\n6. Testing election info endpoint...');
    const electionInfo = await axios.get(`${API_BASE}/election-info`);
    console.log('✅ Election info retrieved:');
    console.log(`   - Title: ${electionInfo.data.election.title}`);
    console.log(`   - Total Voters: ${electionInfo.data.election.totalVoters}`);
    console.log(`   - Total Candidates: ${electionInfo.data.election.totalCandidates}`);
    console.log(`   - Candidates: ${electionInfo.data.candidates.length}`);

    // 7. Test voter registration
    console.log('\n7. Testing voter registration...');
    const registrationData = {
      matricNumber: "CS/2022/001",
      surname: "Brown"
    };
    
    const registrationResponse = await axios.post(`${API_BASE}/register`, registrationData);
    console.log('✅ Voter registered successfully');
    console.log(`   - Code: ${registrationResponse.data.code}`);
    console.log(`   - Voter: ${registrationResponse.data.voterInfo.firstName} ${registrationResponse.data.voterInfo.surname}`);

    console.log('\n🎉 All integration tests passed! The system is fully functional.');
    console.log('\n📋 Next steps:');
    console.log('   1. Open http://localhost:5174 in your browser');
    console.log('   2. Use the voter registration code to vote');
    console.log('   3. Check the admin dashboard at /admin');
    console.log('   4. View real-time results at /results');

  } catch (error) {
    console.error('❌ Integration test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
  }
}

testIntegration(); 