const express = require('express');
const router = express.Router();
const voterController = require('../controllers/voterController');

// Voter management routes
router.get('/all', voterController.getAllVoters);
router.post('/create', voterController.createVoter);
router.post('/bulk-create', voterController.bulkCreateVoters);
router.put('/update/:voterId', voterController.updateVoter);
router.delete('/delete/:voterId', voterController.deleteVoter);
router.delete('/delete-all', voterController.deleteAllVoters);

module.exports = router; 