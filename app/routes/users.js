const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController.js');

/* swagger imports and setup */

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../swagger/aos3.yaml');

router.use('/api/docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerDocument));

/* routes */

router.get('/users/:id', userController.getUserData);
router.get('/users', userController.getUsersData);
router.post('/users', userController.registerUser);

module.exports = router;