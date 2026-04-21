const express = require('express');
const auth = require('../middleware/auth');
const { getBalanceSheet } = require('../controllers/financeController');

const router = express.Router();
router.use(auth);

router.get('/balance-sheet', getBalanceSheet);

module.exports = router;
