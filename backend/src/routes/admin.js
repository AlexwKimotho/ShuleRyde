const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
  signin, getMe, getOperators, getOperatorDetail,
  freezeOperator, unfreezeOperator, updatePermissions, deleteOperator,
} = require('../controllers/adminController');

const router = express.Router();

router.post('/signin', signin);
router.get('/me', adminAuth, getMe);
router.get('/operators', adminAuth, getOperators);
router.get('/operators/:id', adminAuth, getOperatorDetail);
router.patch('/operators/:id/freeze', adminAuth, freezeOperator);
router.patch('/operators/:id/unfreeze', adminAuth, unfreezeOperator);
router.patch('/operators/:id/permissions', adminAuth, updatePermissions);
router.delete('/operators/:id', adminAuth, deleteOperator);

module.exports = router;
