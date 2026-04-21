const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
  getParents, createParent, updateParent, deleteParent,
  createStudent, updateStudent, deleteStudent,
} = require('../controllers/parentsController');

const router = express.Router();
router.use(auth);

router.get('/', getParents);

router.post('/', [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').optional().isEmail().normalizeEmail(),
], createParent);

router.put('/:id', [
  body('full_name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
], updateParent);

router.delete('/:id', deleteParent);

// Students nested under parents
router.post('/:parent_id/students', [
  body('full_name').trim().notEmpty().withMessage('Student name is required'),
], createStudent);

router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

module.exports = router;
