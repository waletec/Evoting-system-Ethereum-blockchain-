const axios = require('axios');

async function testReset() {
  try {
    console.log('🔄 Testing system reset...');
    
    const response = await axios.post('http://localhost:4000/api/election/reset', {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Reset response:', response.data);
    
    if (response.data.success) {
      console.log('🎉 System reset successful!');
      console.log('📝 Message:', response.data.message);
    } else {
      console.log('❌ Reset failed:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing reset:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testReset(); 