const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController.js');

const fs = require('fs');
const yaml = require('js-yaml');

/* swagger imports and setup */
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = yaml.load(fs.readFileSync(__dirname + '/../../swagger/aos3.yaml', 'utf8'));

router.use('/api/docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerDocument));

/* user routes */
router.get('/:id', userController.getUserData);
router.get('/', userController.getUsersData);
router.post('/', userController.registerUser);
router.post('/change-password', userController.changePassword);
router.post('/change-district', userController.changeDistrict);
router.post('/change-email', userController.changeEmail);

module.exports = router;