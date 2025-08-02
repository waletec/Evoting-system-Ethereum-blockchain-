// routes/voteRoutes.js
const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');

// Register voter
router.post('/register', voteController.registerVoter);

// Cast vote
router.post('/vote', voteController.castVote);

// Get election results
router.get('/results', voteController.getVoteResult);

// View my vote
router.post('/view-vote', voteController.viewMyVote);

// Get matric number by code
router.post('/get-matric-by-code', voteController.getMatricByCode);

// Verify voting code
router.post('/verify-code', voteController.verifyVotingCode);

// Get current election information for voting dashboard
router.get('/election-info', voteController.getCurrentElectionInfo);

// Temporary endpoint to clear all votes (for fixing database constraints)
router.delete('/clear-all', voteController.clearAllVotes);

module.exports = router;