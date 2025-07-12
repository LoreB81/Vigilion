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
router.get('/:id/name', userController.getUserName);
router.get('/', userController.getUsersData);
router.post('/', userController.registerUser);
router.post('/change-password', userController.changePassword);
router.post('/change-district', userController.changeDistrict);
router.post('/change-email', userController.changeEmail);
router.post('/change-notifications', userController.changeNotifications);
router.patch('/:id/warn', userController.warnUser);
router.patch('/:id/ban', userController.banUser);
router.patch('/:id/reactivate', userController.reactivateUser);
router.delete('/delete-account', userController.deleteUser);

module.exports = router;