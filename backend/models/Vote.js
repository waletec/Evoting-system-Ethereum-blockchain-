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

// Compound index to ensure one vote per position per voter
voteSchema.index({ matricNumber: 1, position: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
