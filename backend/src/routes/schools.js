const express = require('express');
const auth = require('../middleware/auth');
const { getSchools, createSchool, updateSchool, deleteSchool, getAnalytics } = require('../controllers/schoolsController');

const router = express.Router();
router.use(auth);

router.get('/analytics', getAnalytics);
router.get('/', getSchools);
router.post('/', createSchool);
router.put('/:id', updateSchool);
router.delete('/:id', deleteSchool);

module.exports = router;
