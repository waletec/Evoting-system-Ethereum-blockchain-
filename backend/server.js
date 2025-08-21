const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./db');
const logger = require('./utils/logger');
const voteRoutes = require('./routes/voteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const voterRoutes = require('./routes/voterRoutes');
const electionRoutes = require('./routes/electionRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const contractUtils = require('./ethereum/contractUtils');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
// Dynamic CORS: support multiple comma-separated origins via CORS_ORIGINS
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: function(origin, callback) {
    // Allow non-browser requests (no origin) and allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
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
app.use('/api', blockchainRoutes);

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
      const isConnected = await contractUtils.checkConnection();
      blockchainStatus = isConnected ? 'connected' : 'disconnected';
    } catch (blockchainError) {
      logger.warn('⚠️ Blockchain health check failed:', blockchainError.message);
      blockchainStatus = 'disconnected';
    }

    res.json({ 
      status: 'healthy',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      blockchain: blockchainStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Blockchain status is now handled by blockchainRoutes

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
});


