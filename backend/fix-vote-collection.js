const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function fixVoteCollection() {
  try {
    console.log('🔄 Starting database fix...');
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // Check if votes collection exists
    const collections = await db.listCollections({ name: 'votes' }).toArray();
    
    if (collections.length > 0) {
      console.log('📋 Found votes collection, checking indexes...');
      
      // Get current indexes
      const indexes = await db.collection('votes').indexes();
      console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
      
      // Drop the entire votes collection to remove all old indexes
      await db.collection('votes').drop();
      console.log('🗑️  Dropped votes collection (removes all old indexes)');
    } else {
      console.log('📋 No votes collection found');
    }
    
    // Import the Vote model to recreate the collection with correct schema
    const Vote = require('./models/Vote');
    
    // Create a dummy vote and immediately delete it to trigger index creation
    const dummyVote = new Vote({
      matricNumber: 'DUMMY',
      candidate: 'DUMMY',
      position: 'DUMMY'
    });
    
    await dummyVote.save();
    await Vote.deleteOne({ matricNumber: 'DUMMY' });
    
    console.log('✅ Recreated votes collection with correct compound index');
    
    // Verify the new indexes
    const newIndexes = await db.collection('votes').indexes();
    console.log('New indexes:', newIndexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Check for the compound index
    const hasCompoundIndex = newIndexes.some(idx => 
      idx.key.matricNumber === 1 && idx.key.position === 1
    );
    
    if (hasCompoundIndex) {
      console.log('✅ Compound index {matricNumber: 1, position: 1} created successfully');
    } else {
      console.log('⚠️  Compound index not found');
    }
    
    console.log('🎉 Database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixVoteCollection();