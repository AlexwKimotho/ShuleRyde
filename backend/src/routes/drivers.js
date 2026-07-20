const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { getAll, create, update, remove } = require('../controllers/driversController');

const router = express.Router();
router.use(authMiddleware);

const driverRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').optional().trim(),
  body('license_number').optional().trim(),
  body('license_expiry').optional().isISO8601().withMessage('Invalid date'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.get('/', getAll);
router.post('/', driverRules, validate, create);
router.put('/:id', driverRules, validate, update);
router.delete('/:id', remove);

module.exports = router;
