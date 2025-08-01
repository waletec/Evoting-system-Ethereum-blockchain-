const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  totalVoters: {
    type: Number,
    default: 0
  },
  totalCandidates: {
    type: Number,
    default: 0
  },
  totalVotesCast: {
    type: Number,
    default: 0
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
electionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to get public profile
electionSchema.methods.toPublicJSON = function() {
  const election = this.toObject();
  return election;
};

module.exports = mongoose.model('Election', electionSchema); 