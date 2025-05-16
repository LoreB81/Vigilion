const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const voteController = require('../controllers/voteController');

// Existing routes
router.get('/latest', reportController.getLatestReports);
router.get('/:id', reportController.getSingleReport);
router.post('/', reportController.createReport);

// New vote routes
router.post('/:id/vote', voteController.handleVote);
router.get('/:id/user-vote', voteController.getUserVote);

module.exports = router; 