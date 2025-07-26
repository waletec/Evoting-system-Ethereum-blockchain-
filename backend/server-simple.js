const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the e-Voting Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    mongodb: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Test API endpoints
app.post('/api/register', (req, res) => {
  const { matricNumber, surname } = req.body;
  if (!matricNumber || !surname) {
    return res.status(400).json({ error: 'Matric number and surname are required' });
  }
  res.json({
    message: 'Voter registered successfully',
    code: 'TEST123'
  });
});

app.post('/api/vote', (req, res) => {
  const { matricNumber, code, candidate } = req.body;
  if (!matricNumber || !code || !candidate) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  res.json({ message: 'Vote cast successfully' });
});

app.get('/api/results', (req, res) => {
  res.json([
    { matricNumber: 'TEST001', candidate: 'Candidate A', timestamp: new Date().toISOString() }
  ]);
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
}); 