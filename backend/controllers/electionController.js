const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Voter = require('../models/Voter');

// Get current election
exports.getCurrentElection = async (req, res) => {
  try {
    const election = await Election.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    if (!election) {
      return res.json({
        success: true,
        election: null
      });
    }

    res.json({
      success: true,
      election
    });
  } catch (error) {
    console.error('Get current election error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create or update election
exports.createOrUpdateElection = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Election title is required'
      });
    }

    // Check if there's already an active election
    let election = await Election.findOne({ isActive: true });

    if (election) {
      // Update existing election
      election.title = title;
      election.description = description;
      await election.save();
    } else {
      // Create new election
      election = new Election({
        title,
        description,
        status: 'draft'
      });
      await election.save();
    }

    res.json({
      success: true,
      message: 'Election updated successfully',
      election: election.toPublicJSON()
    });

  } catch (error) {
    console.error('Create/update election error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Start election
exports.startElection = async (req, res) => {
  try {
    const election = await Election.findOne({ isActive: true });
    
    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'No active election found'
      });
    }

    // Check if we have voters and candidates
    const voterCount = await Voter.countDocuments({ isActive: true });
    const candidateCount = await Candidate.countDocuments({ isActive: true });

    if (voterCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start election: No voters registered'
      });
    }

    if (candidateCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start election: No candidates registered'
      });
    }

    // Update election status
    election.status = 'active';
    election.startDate = new Date();
    election.totalVoters = voterCount;
    election.totalCandidates = candidateCount;
    await election.save();

    // Get all candidates for the voting system
    const candidates = await Candidate.find({ isActive: true }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Election started successfully',
      election: election.toPublicJSON(),
      candidates: candidates,
      totalVoters: voterCount,
      totalCandidates: candidateCount
    });

  } catch (error) {
    console.error('Start election error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// End election
exports.endElection = async (req, res) => {
  try {
    const election = await Election.findOne({ isActive: true, status: 'active' });
    
    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'No active election found'
      });
    }

    // Update election status
    election.status = 'completed';
    election.endDate = new Date();
    await election.save();

    res.json({
      success: true,
      message: 'Election ended successfully',
      election: election.toPublicJSON()
    });

  } catch (error) {
    console.error('End election error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset system (delete all data)
exports.resetSystem = async (req, res) => {
  try {
    // Deactivate all elections
    await Election.updateMany({}, { isActive: false });
    
    // Deactivate all candidates
    await Candidate.updateMany({}, { isActive: false });
    
    // Deactivate all voters
    await Voter.updateMany({}, { isActive: false });

    res.json({
      success: true,
      message: 'System reset successfully'
    });

  } catch (error) {
    console.error('Reset system error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get election statistics
exports.getElectionStats = async (req, res) => {
  try {
    const election = await Election.findOne({ isActive: true });
    const voterCount = await Voter.countDocuments({ isActive: true });
    const candidateCount = await Candidate.countDocuments({ isActive: true });
    const votedCount = await Voter.countDocuments({ isActive: true, hasVoted: true });

    res.json({
      success: true,
      stats: {
        election: election ? election.toPublicJSON() : null,
        totalVoters: voterCount,
        totalCandidates: candidateCount,
        totalVotesCast: votedCount,
        voterTurnout: voterCount > 0 ? ((votedCount / voterCount) * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Get election stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 