const express = require('express');
const auth = require('../middleware/auth');
const { getSettings, updateSettings, uploadLogo, upload } = require('../controllers/settingsController');

const router = express.Router();
router.use(auth);

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/logo', upload.single('logo'), uploadLogo);

module.exports = router;
