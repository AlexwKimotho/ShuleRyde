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
      .select('*, parents(id, full_name, phone), children(id, full_name), payment_transactions(id, amount, payment_method, notes, paid_at)')
      .in('parent_id', parentIds)
      .order('updated_at', { ascending: false });

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

    const { parent_id, child_id, amount, invoice_month, payment_method } = req.body;

    const { data: parent } = await supabase
      .from('parents').select('id').eq('id', parent_id).eq('operator_id', req.operator.id).single();
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        parent_id,
        child_id: child_id || null,
        amount,
        invoice_month,
        payment_method: payment_method || null,
        amount_collected: 0,
      })
      .select('*, parents(id, full_name, phone), children(id, full_name), payment_transactions(id, amount, payment_method, notes, paid_at)')
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

    const parentIds = await getParentIds(req.operator.id);
    if (!parentIds.length) return res.status(404).json({ error: 'Payment not found' });

    const { data: existing } = await supabase
      .from('payments').select('*').eq('id', id).in('parent_id', parentIds).single();
    if (!existing) return res.status(404).json({ error: 'Payment not found' });

    const method = payment_method || 'CASH';
    const paidAt = new Date().toISOString();

    const { data: payment, error } = await supabase
      .from('payments')
      .update({ status: 'PAID', payment_date: paidAt, payment_method: method, amount_collected: existing.amount })
      .eq('id', id)
      .select('*, parents(id, full_name, phone), children(id, full_name), payment_transactions(id, amount, payment_method, notes, paid_at)')
      .single();

    if (error) throw error;
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    // Record final transaction
    const remaining = parseFloat(existing.amount) - parseFloat(existing.amount_collected || 0);
    if (remaining > 0) {
      await supabase.from('payment_transactions').insert({
        payment_id: id,
        amount: remaining,
        payment_method: method,
        paid_at: paidAt,
      });
    }

    supabase.from('activity_logs').insert({
      operator_id: req.operator.id,
      event_type: 'PAYMENT_RECEIVED',
      description: `Full payment of KES ${parseFloat(payment.amount).toLocaleString()} received from ${payment.parents?.full_name} (${payment.invoice_month})`,
    }).then(() => {});

    res.json({ payment });
  } catch (err) {
    next(err);
  }
};

const recordPartialPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount_paid, payment_method, notes } = req.body;

    if (!amount_paid || parseFloat(amount_paid) <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
    }

    const parentIds = await getParentIds(req.operator.id);
    if (!parentIds.length) return res.status(404).json({ error: 'Payment not found' });

    const { data: payment } = await supabase
      .from('payments').select('*').eq('id', id).in('parent_id', parentIds).single();
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const newCollected = (parseFloat(payment.amount_collected || 0) + parseFloat(amount_paid)).toFixed(2);
    const totalDue = parseFloat(payment.amount);
    const newStatus = parseFloat(newCollected) >= totalDue ? 'PAID' : 'PARTIALLY_PAID';
    const method = payment_method || 'CASH';
    const paidAt = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('payments')
      .update({
        amount_collected: newCollected,
        status: newStatus,
        payment_date: newStatus === 'PAID' ? paidAt : payment.payment_date,
        payment_method: method,
      })
      .eq('id', id)
      .select('*, parents(id, full_name, phone), children(id, full_name), payment_transactions(id, amount, payment_method, notes, paid_at)')
      .single();

    if (error) throw error;

    // Record individual transaction
    await supabase.from('payment_transactions').insert({
      payment_id: id,
      amount: parseFloat(amount_paid),
      payment_method: method,
      notes: notes || null,
      paid_at: paidAt,
    });

    supabase.from('activity_logs').insert({
      operator_id: req.operator.id,
      event_type: 'PAYMENT_RECEIVED',
      description: `Partial payment of KES ${parseFloat(amount_paid).toLocaleString()} received from ${updated.parents?.full_name} (${updated.invoice_month})`,
    }).then(() => {});

    res.json({ payment: updated });
  } catch (err) {
    next(err);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parentIds = await getParentIds(req.operator.id);
    if (!parentIds.length) return res.status(404).json({ error: 'Payment not found' });

    const { error } = await supabase.from('payments').delete().eq('id', id).in('parent_id', parentIds);
    if (error) throw error;
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    next(err);
  }
};

const generateMonthly = async (req, res, next) => {
  try {
    const { month } = req.params;
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount is required' });

    const parentIds = await getParentIds(req.operator.id);
    if (!parentIds.length) return res.json({ created: 0, payments: [] });

    const { data: existing } = await supabase
      .from('payments').select('parent_id').in('parent_id', parentIds).eq('invoice_month', month);
    const existingIds = new Set((existing || []).map((p) => p.parent_id));
    const toCreate = parentIds.filter((id) => !existingIds.has(id));

    if (!toCreate.length) return res.json({ created: 0, payments: [] });

    const rows = toCreate.map((parent_id) => ({ parent_id, amount, invoice_month: month, status: 'PENDING', amount_collected: 0 }));
    const { data: payments, error } = await supabase
      .from('payments').insert(rows).select('*, parents(id, full_name, phone), children(id, full_name), payment_transactions(id, amount, payment_method, notes, paid_at)');

    if (error) throw error;
    res.status(201).json({ created: payments.length, payments });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPayments, createPayment, markAsPaid, recordPartialPayment, deletePayment, generateMonthly };
