const mongoose = require('mongoose');
require('dotenv').config();

async function fixVoteIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voting_system');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const votesCollection = db.collection('votes');

    // Get current indexes
    const indexes = await votesCollection.indexes();
    console.log('📋 Current indexes:', indexes.map(i => i.name));

    // Drop the problematic single matricNumber index if it exists
    try {
      await votesCollection.dropIndex('matricNumber_1');
      console.log('✅ Dropped problematic matricNumber_1 index');
    } catch (error) {
      console.log('ℹ️  matricNumber_1 index not found or already dropped');
    }

    // Clear all votes to start fresh
    const deleteResult = await votesCollection.deleteMany({});
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing votes`);

    // Ensure the correct compound index exists
    await votesCollection.createIndex(
      { matricNumber: 1, position: 1 }, 
      { unique: true, name: 'matricNumber_position_unique' }
    );
    console.log('✅ Created correct compound index: matricNumber + position');

    // Verify indexes
    const newIndexes = await votesCollection.indexes();
    console.log('📋 Updated indexes:', newIndexes.map(i => i.name));

    await mongoose.disconnect();
    console.log('🎉 Database index fix completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  }
}

fixVoteIndex();