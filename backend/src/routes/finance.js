const express = require('express');
const auth = require('../middleware/auth');
const { getBalanceSheet, getProfitAndLoss, getFinancialSummary, getAll } = require('../controllers/financeController');

const router = express.Router();
router.use(auth);

router.get('/all', getAll);
router.get('/balance-sheet', getBalanceSheet);
router.get('/profit-loss', getProfitAndLoss);
router.get('/summary', getFinancialSummary);

module.exports = router;
