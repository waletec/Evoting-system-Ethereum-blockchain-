const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./db');
const voteRoutes = require('./routes/voteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const voterRoutes = require('./routes/voterRoutes');
const electionRoutes = require('./routes/electionRoutes');
const { connectToNetwork } = require('./blockchain/fabricUtils');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', voteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/election', electionRoutes);

// Sample test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the e-Voting Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check blockchain connectivity
    let blockchainStatus = 'disconnected';
    try {
      const network = await connectToNetwork();
      const contract = network.getContract('votecc');
      // Try a simple query to verify the connection is working
      await contract.submitTransaction('allVotes');
      blockchainStatus = 'connected';
    } catch (blockchainError) {
      console.log('⚠️ Blockchain health check failed:', blockchainError.message);
      blockchainStatus = 'disconnected';
    }

    res.json({ 
      status: 'healthy',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      blockchain: blockchainStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Blockchain status endpoint
app.get('/api/blockchain-status', async (req, res) => {
  try {
    let blockchainStatus = 'disconnected';
    let error = null;
    
    try {
      const network = await connectToNetwork();
      const contract = network.getContract('votecc');
      // Try a simple query to verify the connection is working
      await contract.submitTransaction('allVotes');
      blockchainStatus = 'connected';
    } catch (blockchainError) {
      console.log('⚠️ Blockchain status check failed:', blockchainError.message);
      blockchainStatus = 'disconnected';
      error = blockchainError.message;
    }

    res.json({ 
      status: blockchainStatus,
      error: error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Blockchain status check error:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});


