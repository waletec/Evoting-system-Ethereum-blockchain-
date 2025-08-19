// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  matricNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  surname: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  codeIssuedAt: {
    type: Date,
    default: Date.now
  },
  hasVoted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
