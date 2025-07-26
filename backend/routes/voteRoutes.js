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

router.post('/view-vote', voteController.viewMyVote);


module.exports = router;