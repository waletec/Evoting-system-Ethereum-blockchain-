const express = require('express');
const router = express.Router();
const electionController = require('../controllers/electionController');
const { requireAuth } = require('../middleware/authMiddleware');
const { fixDatabase } = require('../fix-db-api');

// Election management routes (protected by admin authentication)
router.get('/current', electionController.getCurrentElection);
router.post('/create-or-update', requireAuth, electionController.createOrUpdateElection);
router.post('/start', requireAuth, electionController.startElection);
router.post('/end', requireAuth, electionController.endElection);
router.post('/reset', requireAuth, electionController.resetSystem);
router.get('/stats', requireAuth, electionController.getElectionStats);

// Database fix endpoint
router.post('/fix-db', async (req, res) => {
  try {
    const result = await fixDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 