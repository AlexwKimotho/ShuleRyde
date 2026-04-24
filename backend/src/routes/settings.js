const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const { getSettings, updateSettings, uploadProfilePicture } = require('../controllers/settingsController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

const router = express.Router();
router.use(auth);

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/profile-picture', upload.single('photo'), uploadProfilePicture);

module.exports = router;
