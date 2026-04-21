const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { getDocuments, createDocument, updateDocument, deleteDocument } = require('../controllers/complianceController');

const router = express.Router();
router.use(auth);

router.get('/', getDocuments);

router.post('/', [
  body('document_type').trim().notEmpty(),
  body('issue_date').isISO8601(),
  body('expiry_date').isISO8601(),
  body('file_url').trim().notEmpty(),
], createDocument);

router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
