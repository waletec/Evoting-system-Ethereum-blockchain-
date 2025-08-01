const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  matricNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  department: {
    type: String,
    trim: true
  },
  faculty: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
voterSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to get public profile
voterSchema.methods.toPublicJSON = function() {
  const voter = this.toObject();
  return voter;
};

module.exports = mongoose.model('Voter', voterSchema); 