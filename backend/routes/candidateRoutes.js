const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');

// Candidate management routes
router.get('/all', candidateController.getAllCandidates);
router.post('/create', candidateController.createCandidate);
router.put('/update/:candidateId', candidateController.updateCandidate);
router.delete('/delete/:candidateId', candidateController.deleteCandidate);
router.delete('/delete-all', candidateController.deleteAllCandidates);

module.exports = router; 