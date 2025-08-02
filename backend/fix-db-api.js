const mongoose = require('mongoose');
const Vote = require('./models/Vote');

async function fixDatabase() {
  try {
    console.log('🔄 Starting database fix via API...');
    
    // Drop the votes collection entirely
    const db = mongoose.connection.db;
    
    try {
      await db.collection('votes').drop();
      console.log('✅ Dropped votes collection');
    } catch (error) {
      console.log('ℹ️  Votes collection may not exist yet');
    }
    
    // Create a new vote to trigger proper index creation
    const testVote = new Vote({
      matricNumber: 'TEST123',
      candidate: 'Test Candidate',
      position: 'PRESIDENT'
    });
    
    await testVote.save();
    console.log('✅ Created test vote with proper schema');
    
    // Remove the test vote
    await Vote.deleteOne({ matricNumber: 'TEST123' });
    console.log('✅ Removed test vote');
    
    // Check indexes
    const indexes = await db.collection('votes').indexes();
    console.log('📋 Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    const hasCompoundIndex = indexes.some(idx => 
      idx.key.matricNumber === 1 && idx.key.position === 1
    );
    
    if (hasCompoundIndex) {
      console.log('✅ Compound index {matricNumber: 1, position: 1} exists');
      return { success: true, message: 'Database indexes fixed successfully' };
    } else {
      console.log('⚠️  Compound index not found');
      return { success: false, message: 'Compound index not created' };
    }
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    return { success: false, message: error.message };
  }
}

module.exports = { fixDatabase };