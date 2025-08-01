// controllers/voteController.js

const { connectToNetwork } = require('../blockchain/fabricUtils');
const Vote = require('../models/Vote'); // (MongoDB model)
const User = require('../models/User'); // (MongoDB model)
const Voter = require('../models/Voter'); // (MongoDB model for voter verification)
const Election = require('../models/Election'); // (MongoDB model for election data)

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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

    // Check for existing registration
    const existingUser = await User.findOne({ matricNumber });
    if (existingUser) {
      return res.status(400).json({ error: 'Voter already registered for voting' });
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
      hasVoted: false,
      voterId: uploadedVoter._id // Link to the uploaded voter record
    });

    await newUser.save();

    // In a real-world app: send code via SMS/email
    return res.status(201).json({
      message: 'Voter registered successfully. Use the code to vote.',
      code: code, // Return the plain code for testing purposes
      voterInfo: {
        firstName: uploadedVoter.firstName,
        surname: uploadedVoter.surname,
        department: uploadedVoter.department,
        faculty: uploadedVoter.faculty
      }
    });
  } catch (error) {
    console.error('Error registering voter:', error);
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

    // Check if user has already voted for this position
    const existingVote = await Vote.findOne({ matricNumber, position });
    if (existingVote) {
      return res.status(403).json({ error: `You have already voted for ${position}` });
    }

    try {
      // Connect to Fabric and submit vote
      const network = await connectToNetwork();
      const contract = network.getContract('voting');

      await contract.submitTransaction('castVote', matricNumber, candidate, position);
      console.log('✅ Vote submitted to blockchain');
    } catch (fabricError) {
      console.error('⚠️ Fabric connection error:', fabricError.message);
      // Continue with MongoDB only if Fabric fails
    }

    // Save vote in MongoDB
    const vote = new Vote({ matricNumber, candidate, position });
    await vote.save();

    // Check if user has voted for all positions (optional - for tracking completion)
    const totalPositions = 10; // We have 10 positions
    const userVotes = await Vote.countDocuments({ matricNumber });
    
    if (userVotes >= totalPositions) {
      // Mark user as completed voting for all positions
      user.hasVoted = true;
      await user.save();
    }

    return res.status(200).json({ message: 'Vote cast successfully' });
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error('Error getting matric by code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getVoteResult = async (req, res) => {
  try {
    try {
      const network = await connectToNetwork();
      const contract = network.getContract('voting');

      const result = await contract.evaluateTransaction('getAllVotes');
      const parsedResult = JSON.parse(result.toString());

      return res.status(200).json(parsedResult);
    } catch (fabricError) {
      console.error('⚠️ Fabric connection error:', fabricError.message);
      // Fallback to MongoDB results
      const votes = await Vote.find().select('matricNumber candidate timestamp');
      return res.status(200).json(votes);
    }
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};            

exports.viewMyVote = async (req, res) => {
  try {
    const { matricNumber } = req.body;

    try {
      const network = await connectToNetwork();
      const contract = network.getContract('voting');

      const result = await contract.evaluateTransaction('viewVote', matricNumber);
      const parsedResult = JSON.parse(result.toString());

      return res.status(200).json(parsedResult);
    } catch (fabricError) {
      console.error('⚠️ Fabric connection error:', fabricError.message);
      // Fallback to MongoDB
      const votes = await Vote.find({ matricNumber });
      if (!votes || votes.length === 0) {
        return res.status(404).json({ error: 'No votes found for this voter' });
      }
      return res.status(200).json({ votes: votes, totalVotes: votes.length });
    }
  } catch (error) {
    console.error('Error viewing vote:', error);
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

    // Get voter count
    const voterCount = await Voter.countDocuments({ isActive: true });

    res.json({
      success: true,
      election: {
        title: election.title,
        description: election.description || "",
        startDate: election.startDate,
        totalVoters: voterCount,
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
    console.error('Error getting election info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
