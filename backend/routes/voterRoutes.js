const express = require('express');
const router = express.Router();
const voterController = require('../controllers/voterController');
const { requireAuth } = require('../middleware/authMiddleware');

// Voter management routes (protected by admin authentication)
router.get('/all', voterController.getAllVoters);
router.post('/create', requireAuth, voterController.createVoter);
router.post('/bulk-create', requireAuth, voterController.bulkCreateVoters);
router.put('/update/:voterId', requireAuth, voterController.updateVoter);
router.delete('/delete/:voterId', requireAuth, voterController.deleteVoter);
router.delete('/delete-all', requireAuth, voterController.deleteAllVoters);

module.exports = router; 