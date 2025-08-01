const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
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
  phone: {
    type: String,
    trim: true
  },
  matricNumber: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  agreedToRules: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
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
candidateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to get public profile
candidateSchema.methods.toPublicJSON = function() {
  const candidate = this.toObject();
  return candidate;
};

module.exports = mongoose.model('Candidate', candidateSchema); 