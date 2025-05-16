const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController.js');

const fs = require('fs');
const yaml = require('js-yaml');

/* swagger imports and setup */
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = yaml.load(fs.readFileSync(__dirname + '/../../swagger/aos3.yaml', 'utf8'));

router.use('/api/docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerDocument));

/* routes */
router.get('/latest', reportController.getLatestReports);
router.get('/:id', reportController.getSingleReport);
router.get('/', reportController.getReports);
router.post('/', reportController.createReport);

module.exports = router;