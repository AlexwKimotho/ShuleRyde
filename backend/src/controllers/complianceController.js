const { validationResult } = require('express-validator');
const supabase = require('../config/database');

const getDocuments = async (req, res, next) => {
  try {
    const { data: documents, error } = await supabase
      .from('compliance_documents')
      .select('*, vehicles(id, license_plate, model)')
      .eq('operator_id', req.operator.id)
      .order('expiry_date', { ascending: true });

    if (error) throw error;

    // Tag each document with a computed status
    const now = new Date();
    const tagged = (documents || []).map((doc) => {
      const expiry = new Date(doc.expiry_date);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      let status = 'VALID';
      if (daysLeft < 0) status = 'EXPIRED';
      else if (daysLeft <= 30) status = 'EXPIRING_SOON';
      return { ...doc, days_until_expiry: daysLeft, status };
    });

    res.json({ documents: tagged });
  } catch (err) {
    next(err);
  }
};

const createDocument = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { vehicle_id, document_type, issue_date, expiry_date, file_url } = req.body;

    const expiry = new Date(expiry_date);
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    let status = 'VALID';
    if (daysLeft < 0) status = 'EXPIRED';
    else if (daysLeft <= 30) status = 'EXPIRING_SOON';

    const { data: document, error } = await supabase
      .from('compliance_documents')
      .insert({
        operator_id: req.operator.id,
        vehicle_id: vehicle_id || null,
        document_type,
        issue_date,
        expiry_date,
        file_url,
        status,
      })
      .select('*, vehicles(id, license_plate, model)')
      .single();

    if (error) throw error;
    res.status(201).json({ document: { ...document, days_until_expiry: daysLeft } });
  } catch (err) {
    next(err);
  }
};

const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { document_type, issue_date, expiry_date, file_url, vehicle_id } = req.body;

    const expiry = new Date(expiry_date);
    const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
    let status = 'VALID';
    if (daysLeft < 0) status = 'EXPIRED';
    else if (daysLeft <= 30) status = 'EXPIRING_SOON';

    const { data: document, error } = await supabase
      .from('compliance_documents')
      .update({ document_type, issue_date, expiry_date, file_url, vehicle_id: vehicle_id || null, status })
      .eq('id', id)
      .eq('operator_id', req.operator.id)
      .select('*, vehicles(id, license_plate, model)')
      .single();

    if (error) throw error;
    res.json({ document: { ...document, days_until_expiry: daysLeft } });
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('compliance_documents').delete().eq('id', id).eq('operator_id', req.operator.id);
    if (error) throw error;
    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDocuments, createDocument, updateDocument, deleteDocument };
