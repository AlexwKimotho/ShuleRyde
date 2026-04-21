const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { getPayments, createPayment, markAsPaid, deletePayment, generateMonthly } = require('../controllers/paymentsController');

const router = express.Router();
router.use(auth);

router.get('/', getPayments);

router.post('/', [
  body('parent_id').notEmpty(),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('invoice_month').matches(/^\d{4}-\d{2}$/).withMessage('invoice_month must be YYYY-MM'),
], createPayment);

router.put('/:id/mark-paid', markAsPaid);
router.delete('/:id', deletePayment);
router.post('/generate/:month', [body('amount').isNumeric()], generateMonthly);

module.exports = router;
