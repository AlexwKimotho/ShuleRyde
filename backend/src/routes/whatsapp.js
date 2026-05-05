const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const { sendWhatsAppDocument } = require('../controllers/whatsappController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(auth);
router.post('/send', upload.single('pdf'), sendWhatsAppDocument);

module.exports = router;
