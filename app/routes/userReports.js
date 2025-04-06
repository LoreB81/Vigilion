/* TODO: check if really needed */
// const express = require('express');
// const router = express.Router();

// const userReportController = require('../controllers/userReportController.js');

// const fs = require('fs');
// const yaml = require('js-yaml');

// /* swagger imports and setup */

// const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = yaml.load(fs.readFileSync(__dirname + '/../../swagger/aos3.yaml', 'utf8'));

// router.use('/api/docs', swaggerUi.serve);
// router.get('/api-docs', swaggerUi.setup(swaggerDocument));

// /* routes */

// router.get('/userreports/:id', userReportController.getReportsFromUser);
// router.post('/userreports', userReportController.createReportRelation);

// module.exports = router;