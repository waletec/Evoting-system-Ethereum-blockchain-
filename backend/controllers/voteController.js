// controllers/voteController.js

const { connectToNetwork } = require('../blockchain/fabricUtils');
const Vote = require('../models/Vote'); // (MongoDB model)
const User = require('../models/User'); // (MongoDB model)

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.registerVoter = async (req, res) => {
  try {
    const { matricNumber, surname } = req.body;    

    if (!matricNumber || !surname) {
      return res.status(400).json({ error: 'Matric number and surname are required' });
    }

    // Check for existing registration
    const existingUser = await User.findOne({ matricNumber });
    if (existingUser) {
      return res.status(400).json({ error: 'Voter already registered' });
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
      hasVoted: false
    });

    await newUser.save();

    // In a real-world app: send code via SMS/email
    return res.status(201).json({
      message: 'Voter registered successfully. Use the code to vote.',
      code: code // Return the plain code for testing purposes
    });
  } catch (error) {
    console.error('Error registering voter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.castVote = async (req, res) => {
  try {
    const { matricNumber, code, candidate } = req.body;

    if (!matricNumber || !code || !candidate) {
      return res.status(400).json({ error: 'All fields are required'  });
    }

    // Find the user
    const user = await User.findOne({ matricNumber});
    if (!user) {
      return res.status(401).json({ error: 'Invalid voter credentials' });
    }

    if (user.hasVoted) {
      return res.status(403).json({ error: 'You have already voted' });
    }

    // Check if the code is correct
    const isCodeCorrect = await bcrypt.compare(code, user.code);
    if (!isCodeCorrect) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    try {
      // Connect to Fabric and submit vote
      const network = await connectToNetwork();
      const contract = network.getContract('voting');

      await contract.submitTransaction('castVote', matricNumber, candidate);
      console.log('✅ Vote submitted to blockchain');
    } catch (fabricError) {
      console.error('⚠️ Fabric connection error:', fabricError.message);
      // Continue with MongoDB only if Fabric fails
    }

    // Save vote in MongoDB
    const vote = new Vote({ matricNumber, candidate });
    await vote.save();

    // Mark user as voted
    user.hasVoted = true;
    await user.save();

    return res.status(200).json({ message: 'Vote cast successfully' });
  } catch (error) {
    console.error('Error casting vote:', error);
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
      const vote = await Vote.findOne({ matricNumber });
      if (!vote) {
        return res.status(404).json({ error: 'No vote found for this voter' });
      }
      return res.status(200).json(vote);
    }
  } catch (error) {
    console.error('Error viewing vote:', error);
    res.status(500).json({ error: 'Could not fetch vote' });
  }
};
