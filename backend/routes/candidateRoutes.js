const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { requireAuth } = require('../middleware/authMiddleware');

// Candidate management routes (protected by admin authentication)
router.get('/all', candidateController.getAllCandidates);
router.post('/create', requireAuth, candidateController.createCandidate);
router.put('/update/:candidateId', requireAuth, candidateController.updateCandidate);
router.delete('/delete/:candidateId', requireAuth, candidateController.deleteCandidate);
router.delete('/delete-all', requireAuth, candidateController.deleteAllCandidates);

module.exports = router; 