// models/Vote.js
const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  matricNumber: {
    type: String,
    required: true,
    unique: true,
  },
  candidate: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Vote', voteSchema);
