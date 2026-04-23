const express = require('express');
const { body } = require('express-validator');
const { getDrivers, createDriver, updateDriver, deleteDriver } = require('../controllers/driversController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', getDrivers);

router.post('/', [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
], createDriver);

router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);

module.exports = router;
