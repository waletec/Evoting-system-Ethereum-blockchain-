// controllers/voteController.js

const { connectToNetwork } = require('../blockchain/fabricUtils');
const Vote = require('../models/Vote'); // (MongoDB model)
const User = require('../models/User'); // (MongoDB model)
const Voter = require('../models/Voter'); // (MongoDB model for voter verification)
const Election = require('../models/Election'); // (MongoDB model for election data)

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');

exports.registerVoter = async (req, res) => {
  try {
    const { matricNumber, surname } = req.body;    

    if (!matricNumber || !surname) {
      return res.status(400).json({ error: 'Matric number and surname are required' });
    }

    // First, verify that the voter exists in the uploaded voter database
    const uploadedVoter = await Voter.findOne({ 
      matricNumber: matricNumber, 
      isActive: true 
    });

    if (!uploadedVoter) {
      return res.status(403).json({ 
        error: 'Voter not found in the registered voter list. Please contact the administrator.' 
      });
    }

    // Verify surname matches (case-insensitive)
    const voterSurname = uploadedVoter.surname.toLowerCase();
    const providedSurname = surname.toLowerCase();
    
    if (voterSurname !== providedSurname) {
      return res.status(403).json({ 
        error: 'Surname does not match the registered voter information.' 
      });
    }

    // Check if user already exists and has a code
    let existingUser = await User.findOne({ matricNumber });
    
    if (existingUser) {
      // If user exists, generate a new code for them (for validation purposes)
      const newCode = crypto.randomBytes(3).toString('hex').toUpperCase();
      const hashedNewCode = await bcrypt.hash(newCode, 10);
      
      // Update the user's code
      existingUser.code = hashedNewCode;
      existingUser.codeIssuedAt = new Date();
      await existingUser.save();
      
      return res.status(200).json({
        success: true,
        message: 'Voter validated successfully. Use your new code to vote.',
        code: newCode, // Return the plain code
        voterInfo: {
          firstName: uploadedVoter.firstName,
          surname: uploadedVoter.surname,
          department: uploadedVoter.department,
          faculty: uploadedVoter.faculty
        }
      });
    }

    // Generate secure random code (e.g. 6-digit alphanumeric)
    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. 'A3F2D1'

    // Hash the code
    const hashedCode = await bcrypt.hash(code, 10);

    // Create and save user
    const newUser = new User({
      matricNumber,
      surname,
      code: hashedCode,
      codeIssuedAt: new Date(),
      hasVoted: false,
      voterId: uploadedVoter._id // Link to the uploaded voter record
    });

    await newUser.save();

    // Return the plain code for the voter to use
    return res.status(201).json({
      success: true,
      message: 'Voter validated successfully. Use the code to vote.',
      code: code, // Return the plain code for testing purposes
      voterInfo: {
        firstName: uploadedVoter.firstName,
        surname: uploadedVoter.surname,
        department: uploadedVoter.department,
        faculty: uploadedVoter.faculty
      }
    });
  } catch (error) {
    logger.error('Error validating voter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.castVote = async (req, res) => {
  try {
    const { matricNumber, code, candidate, position } = req.body;

    if (!matricNumber || !code || !candidate || !position) {
      return res.status(400).json({ error: 'All fields are required'  });
    }

    // Find the user
    const user = await User.findOne({ matricNumber});
    if (!user) {
      return res.status(401).json({ error: 'Invalid voter credentials' });
    }

    // Check if the code is correct
    const isCodeCorrect = await bcrypt.compare(code, user.code);
    if (!isCodeCorrect) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Ensure the code was recently issued from landing page
    const CODE_TTL_MINUTES = parseInt(process.env.CODE_TTL_MINUTES || '30', 10); // default 30 minutes
    const issuedAt = user.codeIssuedAt || user.updatedAt || user.createdAt;
    const isExpired = Date.now() - new Date(issuedAt).getTime() > CODE_TTL_MINUTES * 60 * 1000;
    if (isExpired) {
      return res.status(401).json({ error: 'Voting code has expired. Please re-validate on the landing page to get a new code.' });
    }

    // Check if user has already voted for this position
    const existingVote = await Vote.findOne({ matricNumber, position });
    if (existingVote) {
      return res.status(403).json({ error: `You have already voted for ${position}` });
    }

    // Connect to Fabric and submit vote with timeout
    let blockchainSuccess = false;
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Blockchain connection timeout')), 5000)
      );
      
      const fabricPromise = (async () => {
        const network = await connectToNetwork();
        const contract = network.getContract('votecc');
        await contract.submitTransaction('castVote', matricNumber, candidate);
        logger.info('✅ Vote submitted to blockchain');
        blockchainSuccess = true;
      })();

      await Promise.race([fabricPromise, timeoutPromise]);
    } catch (fabricError) {
      logger.error('❌ Fabric connection error:', fabricError.message);
      throw new Error(`Blockchain recording failed: ${fabricError.message}. Please ensure the blockchain network is running and try again.`);
    }

    // Only save to MongoDB if blockchain recording was successful
    if (blockchainSuccess) {
      const vote = new Vote({ matricNumber, candidate, position });
      await vote.save();
      logger.info('✅ Vote saved to MongoDB');
    }

    // Check if user has voted for all positions (optional - for tracking completion)
    const Candidate = require('../models/Candidate');
    const distinctPositions = await Candidate.distinct('position', { isActive: true });
    const totalPositions = distinctPositions.length;
    const userVotes = await Vote.countDocuments({ matricNumber });
    
    if (userVotes >= totalPositions) {
      // Mark user as completed voting for all positions
      user.hasVoted = true;
      await user.save();
    }

    return res.status(200).json({ message: 'Vote cast successfully' });
  } catch (error) {
    logger.error('Error casting vote:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.matricNumber === 1) {
        return res.status(400).json({ 
          error: 'Database constraint error. Please contact administrator to reset votes.' 
        });
      } else {
        return res.status(400).json({ 
          error: `You have already voted for ${position}` 
        });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Temporary endpoint to clear votes and fix database constraints
exports.clearAllVotes = async (req, res) => {
  try {
    // Delete all votes
    const deleteResult = await Vote.deleteMany({});
    
    // Try to fix the database index issue by dropping and recreating collection
    try {
      await Vote.collection.drop();
      console.log('✅ Dropped votes collection to fix indexes');
    } catch (dropError) {
      console.log('ℹ️ Collection drop not needed or failed:', dropError.message);
    }
    
    res.json({ 
      success: true, 
      message: `Cleared ${deleteResult.deletedCount} votes and fixed database constraints`,
      deletedCount: deleteResult.deletedCount 
    });
  } catch (error) {
    logger.error('Error clearing votes:', error);
    res.status(500).json({ error: 'Failed to clear votes' });
  }
};

exports.getMatricByCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Find user by code (we need to compare hashed codes)
    const users = await User.find({});
    let foundUser = null;
    
    for (const user of users) {
      const isCodeCorrect = await bcrypt.compare(code, user.code);
      if (isCodeCorrect) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return res.status(404).json({ error: 'User not found with this code' });
    }

    return res.status(200).json({ 
      matricNumber: foundUser.matricNumber,
      surname: foundUser.surname 
    });
  } catch (error) {
    logger.error('Error getting matric by code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getVoteResult = async (req, res) => {
  try {
    // Skip blockchain for read operations since it's not running
    // This will significantly improve performance
    logger.info('📊 Using MongoDB fallback for results (blockchain disabled)');
    
    // Fallback to MongoDB results with proper aggregation
      
      // Get all votes
      const votes = await Vote.find();
      
      // Get all candidates
      const Candidate = require('../models/Candidate');
      const candidates = await Candidate.find({ isActive: true });
      
          // Get unique voters who have cast votes (not total vote records)
    const uniqueVoters = await Vote.distinct('matricNumber');
    const totalVotes = uniqueVoters.length;
    
    // Get total registered voters
    const totalVoters = await Voter.countDocuments({ isActive: true });
    
    // Calculate voter turnout
    const voterTurnout = totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(1) : 0;
      
      // Group votes by position
      const resultsByPosition = {};
      
      // Initialize results for each position
      candidates.forEach(candidate => {
        if (!resultsByPosition[candidate.position]) {
          resultsByPosition[candidate.position] = {
            positionTitle: candidate.position,
            candidates: []
          };
        }
        
        // Check if candidate already exists in this position
        const existingCandidate = resultsByPosition[candidate.position].candidates.find(
          c => c.fullName === candidate.fullName
        );
        
        if (!existingCandidate) {
          resultsByPosition[candidate.position].candidates.push({
            id: candidate._id,
            fullName: candidate.fullName,
            department: candidate.department,
            votes: 0,
            percentage: 0
          });
        }
      });
      
      // Count votes for each candidate
      votes.forEach(vote => {
        const position = vote.position;
        const candidateName = vote.candidate;
        
        if (resultsByPosition[position]) {
          const candidate = resultsByPosition[position].candidates.find(
            c => c.fullName === candidateName
          );
          
          if (candidate) {
            candidate.votes++;
          }
        }
      });
      
      // Calculate percentages for each position
      Object.keys(resultsByPosition).forEach(position => {
        const positionData = resultsByPosition[position];
        const totalPositionVotes = positionData.candidates.reduce((sum, c) => sum + c.votes, 0);
        
        positionData.candidates.forEach(candidate => {
          candidate.percentage = totalPositionVotes > 0 
            ? ((candidate.votes / totalPositionVotes) * 100).toFixed(1) 
            : 0;
        });
        
        // Sort candidates by votes (descending)
        positionData.candidates.sort((a, b) => b.votes - a.votes);
      });
      
      // Convert to array format
      const results = Object.values(resultsByPosition);
      
      return res.status(200).json({
        success: true,
        results: results,
        totalVotes: totalVotes,
        totalVoters: totalVoters,
        voterTurnout: parseFloat(voterTurnout),
        lastUpdated: new Date().toISOString()
      });
  } catch (error) {
    logger.error('Error fetching results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};            

exports.viewMyVote = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Voting code is required' });
    }

    // Find user by code (we need to compare hashed codes)
    const users = await User.find({});
    let foundUser = null;
    
    for (const user of users) {
      const isCodeCorrect = await bcrypt.compare(code, user.code);
      if (isCodeCorrect) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return res.status(404).json({ error: 'Invalid voting code' });
    }

    try {
      const network = await connectToNetwork();
      const contract = network.getContract('votecc');

      const result = await contract.submitTransaction('queryVote', foundUser.matricNumber);
      const parsedResult = JSON.parse(result.toString());

      return res.status(200).json(parsedResult);
    } catch (fabricError) {
      logger.error('⚠️ Fabric connection error:', fabricError.message);
      // Fallback to MongoDB
      const votes = await Vote.find({ matricNumber: foundUser.matricNumber });
      if (!votes || votes.length === 0) {
        return res.status(404).json({ error: 'No votes found for this voter' });
      }
      return res.status(200).json({ 
        votes: votes, 
        totalVotes: votes.length,
        voterInfo: {
          matricNumber: foundUser.matricNumber,
          surname: foundUser.surname
        }
      });
    }
  } catch (error) {
    logger.error('Error viewing vote:', error);
    res.status(500).json({ error: 'Could not fetch vote' });
  }
};

// Get current election information for voting dashboard
exports.getCurrentElectionInfo = async (req, res) => {
  try {
    // Get the current election (active or draft)
    const election = await Election.findOne({ isActive: true });
    
    if (!election) {
      return res.status(404).json({ 
        error: 'No election found' 
      });
    }

    // Get all candidates for the election
    const Candidate = require('../models/Candidate');
    const candidates = await Candidate.find({ isActive: true }).sort({ createdAt: -1 });

    // Get voter count and unique voters who have cast votes
    const voterCount = await Voter.countDocuments({ isActive: true });
    const uniqueVoters = await Vote.distinct('matricNumber');
    const voteCount = uniqueVoters.length;

    res.json({
      success: true,
      election: {
        title: election.title,
        description: election.description || "",
        startDate: election.startDate,
        endDate: election.endDate,
        status: election.status,
        totalVoters: voterCount,
        totalVotes: voteCount,
        totalCandidates: candidates.length
      },
      candidates: candidates.map(candidate => ({
        id: candidate._id,
        fullName: candidate.fullName,
        position: candidate.position,
        department: candidate.department,
        image: candidate.image
      }))
    });

  } catch (error) {
    logger.error('Error getting election info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify voting code
exports.verifyVotingCode = async (req, res) => {
  try {
    const { code, matricNumber } = req.body;
    
    if (!code || !matricNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code and matric number are required' 
      });
    }

    // Find the user
    const user = await User.findOne({ matricNumber });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Voter not found' 
      });
    }

    // Check if the code is correct
    const isCodeCorrect = await bcrypt.compare(code, user.code);
    if (!isCodeCorrect) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid voting code' 
      });
    }

    // Check code freshness
    const CODE_TTL_MINUTES = parseInt(process.env.CODE_TTL_MINUTES || '30', 10);
    const issuedAt = user.codeIssuedAt || user.updatedAt || user.createdAt;
    const isExpired = Date.now() - new Date(issuedAt).getTime() > CODE_TTL_MINUTES * 60 * 1000;
    if (isExpired) {
      return res.status(401).json({ 
        success: false, 
        error: 'Voting code has expired. Please re-validate on the landing page to get a new code.' 
      });
    }

    // Check if user has already voted
    if (user.hasVoted) {
      return res.status(403).json({ 
        success: false, 
        error: 'You have already voted' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Voting code verified successfully',
      voterInfo: {
        matricNumber: user.matricNumber,
        surname: user.surname
      }
    });
  } catch (error) {
    logger.error('Error verifying voting code:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
