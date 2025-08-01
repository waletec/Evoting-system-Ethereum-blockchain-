const express = require('express');
const router = express.Router();
const electionController = require('../controllers/electionController');

// Election management routes
router.get('/current', electionController.getCurrentElection);
router.post('/create-or-update', electionController.createOrUpdateElection);
router.post('/start', electionController.startElection);
router.post('/end', electionController.endElection);
router.post('/reset', electionController.resetSystem);
router.get('/stats', electionController.getElectionStats);

module.exports = router; 