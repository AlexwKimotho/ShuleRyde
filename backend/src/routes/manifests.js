const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getManifest, checkIn, undoCheckIn } = require('../controllers/manifestsController');

const router = express.Router();
router.use(authMiddleware);

router.get('/', getManifest);
router.post('/checkin', checkIn);
router.delete('/checkin/:studentId', undoCheckIn);

module.exports = router;
