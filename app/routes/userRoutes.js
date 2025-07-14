const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController.js');
const tokenChecker = require("../tokenChecker.js");

const fs = require('fs');
const yaml = require('js-yaml');

/* swagger imports and setup */
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = yaml.load(fs.readFileSync(__dirname + '/../../swagger/aos3.yaml', 'utf8'));

router.use('/api/docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerDocument));

/* user routes */
router.get('/feedbacks', userController.getAllFeedbacks);
router.get('/:id', userController.getUserData);
router.get('/:id/name', userController.getUserName);
router.get('/', userController.getUsersData);
router.post('/', userController.registerUser);
router.post('/send-feedback', tokenChecker, userController.addFeedback);
router.post('/change-password', tokenChecker, userController.changePassword);
router.post('/change-district', tokenChecker, userController.changeDistrict);
router.post('/change-email', tokenChecker, userController.changeEmail);
router.post('/change-notifications', tokenChecker, userController.changeNotifications);
router.patch('/:id/warn', tokenChecker, userController.warnUser);
router.patch('/:id/ban', tokenChecker, userController.banUser);
router.patch('/:id/reactivate', tokenChecker, userController.reactivateUser);
router.delete('/delete-account', tokenChecker, userController.deleteUser);

module.exports = router;