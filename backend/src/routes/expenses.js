const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary } = require('../controllers/expensesController');

const router = express.Router();
router.use(auth);

router.get('/', getExpenses);
router.get('/summary', getExpenseSummary);

router.post('/', [
  body('category').isIn(['FUEL', 'SERVICE', 'FINE', 'SALARY', 'OTHER']).withMessage('Invalid category'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('expense_date').isDate().withMessage('Valid date is required'),
], createExpense);

router.put('/:id', [
  body('category').optional().isIn(['FUEL', 'SERVICE', 'FINE', 'SALARY', 'OTHER']),
  body('amount').optional().isNumeric(),
  body('description').optional().trim().notEmpty(),
  body('expense_date').optional().isDate(),
], updateExpense);

router.delete('/:id', deleteExpense);

module.exports = router;
