const express = require('express');
const { body } = require('express-validator');
const { getPortal, updateContact } = require('../controllers/parentPortalController');

const router = express.Router();

router.get('/:uniqueId', getPortal);
router.put('/:uniqueId/contact', [
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
], updateContact);

module.exports = router;
