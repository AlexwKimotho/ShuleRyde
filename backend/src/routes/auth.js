const express = require('express');
const { body } = require('express-validator');
const { signup, signin, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('business_name').trim().notEmpty().withMessage('Business name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
  ],
  signup
);

router.post(
  '/signin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  signin
);

router.get('/me', authMiddleware, getMe);

module.exports = router;
