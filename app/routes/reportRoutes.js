const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const voteController = require('../controllers/voteController');
const tokenChecker = require('../tokenChecker.js');

const fs = require('fs');
const yaml = require('js-yaml');

/* swagger imports and setup */
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = yaml.load(fs.readFileSync(__dirname + '/../../swagger/aos3.yaml', 'utf8'));

router.use('/api/docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerDocument));

/** report routes */
router.get('/', reportController.getReports);
router.get('/latest', reportController.getLatestReports);
router.get('/:id', reportController.getSingleReport);
router.post('/', tokenChecker, reportController.createReport);
router.post('/filtered', reportController.getFilteredReports);
router.post('/by-districts', reportController.getReportsByDistricts);

/** voting routes */
router.post('/:id/vote', tokenChecker, voteController.handleVote);
router.get('/:id/user-vote', tokenChecker, voteController.getUserVote);

module.exports = router; 