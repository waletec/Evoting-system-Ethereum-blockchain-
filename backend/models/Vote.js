// models/Vote.js
const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  matricNumber: {
    type: String,
    required: true,
  },
  candidate: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

// Remove any existing single matricNumber unique index and create compound index
voteSchema.index({ matricNumber: 1, position: 1 }, { unique: true });

// Add performance indexes for faster queries
voteSchema.index({ matricNumber: 1 }); // For distinct queries
voteSchema.index({ position: 1 }); // For position-based queries
voteSchema.index({ timestamp: -1 }); // For time-based queries

// Ensure no single matricNumber unique index exists
voteSchema.on('index', function(error) {
  if (error) {
    console.error('Vote model index error:', error);
  }
});

module.exports = mongoose.model('Vote', voteSchema);
