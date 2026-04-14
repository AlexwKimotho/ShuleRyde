const express = require('express');
const { body } = require('express-validator');
const {
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
} = require('../controllers/vehiclesController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getVehicles);

router.post(
  '/',
  [
    body('license_plate').trim().notEmpty().withMessage('License plate is required'),
    body('model').trim().notEmpty().withMessage('Vehicle model is required'),
    body('max_capacity').optional().isInt({ min: 1, max: 50 }),
  ],
  createVehicle
);

router.put(
  '/:id',
  [
    body('license_plate').optional().trim().notEmpty(),
    body('model').optional().trim().notEmpty(),
    body('max_capacity').optional().isInt({ min: 1, max: 50 }),
    body('status').optional().isIn(['ACTIVE', 'IDLE', 'MAINTENANCE', 'SUSPENDED']),
  ],
  updateVehicle
);

router.delete('/:id', deleteVehicle);

module.exports = router;
