const { validationResult } = require('express-validator');
const supabase = require('../config/database');

const getParentIds = async (operatorId) => {
  const { data } = await supabase.from('parents').select('id').eq('operator_id', operatorId);
  return (data || []).map((p) => p.id);
};

const getPayments = async (req, res, next) => {
  try {
    const parentIds = await getParentIds(req.operator.id);
    if (!parentIds.length) return res.json({ payments: [] });

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*, parents(id, full_name, phone)')
      .in('parent_id', parentIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ payments });
  } catch (err) {
    next(err);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { parent_id, amount, invoice_month, payment_method } = req.body;

    const { data: parent } = await supabase
      .from('parents').select('id').eq('id', parent_id).eq('operator_id', req.operator.id).single();
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({ parent_id, amount, invoice_month, payment_method: payment_method || null })
      .select('*, parents(id, full_name, phone)')
      .single();

    if (error) throw error;
    res.status(201).json({ payment });
  } catch (err) {
    next(err);
  }
};

const markAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;

    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: 'PAID',
        payment_date: new Date().toISOString(),
        payment_method: payment_method || 'CASH',
      })
      .eq('id', id)
      .select('*, parents(id, full_name, phone)')
      .single();

    if (error) throw error;
    res.json({ payment });
  } catch (err) {
    next(err);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    next(err);
  }
};

// Generate a PENDING invoice for every parent for a given month (e.g. "2026-05")
const generateMonthly = async (req, res, next) => {
  try {
    const { month } = req.params; // format: YYYY-MM
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount is required' });

    const parentIds = await getParentIds(req.operator.id);
    if (!parentIds.length) return res.json({ created: 0, payments: [] });

    // Skip parents that already have an invoice for this month
    const { data: existing } = await supabase
      .from('payments').select('parent_id').in('parent_id', parentIds).eq('invoice_month', month);
    const existingIds = new Set((existing || []).map((p) => p.parent_id));
    const toCreate = parentIds.filter((id) => !existingIds.has(id));

    if (!toCreate.length) return res.json({ created: 0, payments: [] });

    const rows = toCreate.map((parent_id) => ({ parent_id, amount, invoice_month: month, status: 'PENDING' }));
    const { data: payments, error } = await supabase
      .from('payments').insert(rows).select('*, parents(id, full_name, phone)');

    if (error) throw error;
    res.status(201).json({ created: payments.length, payments });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPayments, createPayment, markAsPaid, deletePayment, generateMonthly };
