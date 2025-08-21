const logger = require('../utils/logger');

// Mock blockchain utility that always returns success
const contractUtils = {
    // Cast a vote
    async castVote(voter, candidate) {
        try {
            logger.info(`[Mock Blockchain] Vote recorded: ${voter} -> ${candidate}`);
            return true;
        } catch (error) {
            logger.error('[Mock Blockchain] Error:', error);
            return false;
        }
    },

    // Get a voter's vote
    async getVote(voter) {
        try {
            logger.info(`[Mock Blockchain] Getting vote for: ${voter}`);
            return "MOCK_VOTE";
        } catch (error) {
            logger.error('[Mock Blockchain] Error:', error);
            return null;
        }
    },

    // Get all voting results - returns mock data
    async getResults() {
        try {
            logger.info('[Mock Blockchain] Getting results');
            return [];
        } catch (error) {
            logger.error('[Mock Blockchain] Error:', error);
            return [];
        }
    },

    // Get all candidates
    async getCandidates() {
        try {
            logger.info('[Mock Blockchain] Getting candidates');
            return [];
        } catch (error) {
            logger.error('[Mock Blockchain] Error:', error);
            return [];
        }
    },

    // Check connection - always returns true
    async checkConnection() {
        logger.info('[Mock Blockchain] Checking connection (always returns true)');
        return true;
    },

    // Reset election
    async resetElection() {
        try {
            logger.info('[Mock Blockchain] Election reset');
            return true;
        } catch (error) {
            logger.error('[Mock Blockchain] Error:', error);
            return false;
        }
    }
};

module.exports = contractUtils;
