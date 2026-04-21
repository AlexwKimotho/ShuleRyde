const express = require('express');
const auth = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();
router.use(auth);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
