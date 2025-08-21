const express = require('express');
const router = express.Router();
const contractUtils = require('../ethereum/contractUtils');
const logger = require('../utils/logger');

// Reset blockchain data
router.post('/blockchain-reset', async (req, res) => {
    try {
        await contractUtils.resetElection();
        res.json({ 
            success: true,
            message: 'Blockchain data reset successfully'
        });
    } catch (error) {
        logger.error('Error resetting blockchain:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

router.get('/blockchain-status', async (req, res) => {
    try {
        const isConnected = await contractUtils.checkConnection();
        if (isConnected) {
            res.json({ 
                status: 'connected',
                error: null 
            });
        } else {
            res.json({ 
                status: 'disconnected',
                error: 'Could not connect to Ethereum network' 
            });
        }
    } catch (error) {
        logger.error('Error checking blockchain status:', error);
        res.json({ 
            status: 'error',
            error: error.message 
        });
    }
});

module.exports = router;
