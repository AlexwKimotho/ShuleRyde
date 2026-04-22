const { validationResult } = require('express-validator');
const supabase = require('../config/database');

const getExpenses = async (req, res, next) => {
  try {
    const { category, from, to } = req.query;
    let query = supabase
      .from('expenses')
      .select('*, vehicles(id, license_plate, model)')
      .eq('operator_id', req.operator.id)
      .order('expense_date', { ascending: false });

    if (category) query = query.eq('category', category);
    if (from) query = query.gte('expense_date', from);
    if (to) query = query.lte('expense_date', to);

    const { data: expenses, error } = await query;
    if (error) throw error;
    res.json({ expenses });
  } catch (err) {
    next(err);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { category, amount, description, expense_date, vehicle_id, notes } = req.body;

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        operator_id: req.operator.id,
        category,
        amount,
        description,
        expense_date,
        vehicle_id: vehicle_id || null,
        notes: notes || null,
      })
      .select('*, vehicles(id, license_plate, model)')
      .single();

    if (error) throw error;

    supabase.from('activity_logs').insert({
      operator_id: req.operator.id,
      event_type: 'SYSTEM_EVENT',
      description: `Expense recorded: ${category} — KES ${parseFloat(amount).toLocaleString()} (${description})`,
    }).then(() => {});

    res.status(201).json({ expense });
  } catch (err) {
    next(err);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, amount, description, expense_date, vehicle_id, notes } = req.body;

    const { data: existing } = await supabase
      .from('expenses').select('id').eq('id', id).eq('operator_id', req.operator.id).single();
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    const { data: expense, error } = await supabase
      .from('expenses')
      .update({ category, amount, description, expense_date, vehicle_id: vehicle_id || null, notes: notes || null })
      .eq('id', id)
      .select('*, vehicles(id, license_plate, model)')
      .single();

    if (error) throw error;
    res.json({ expense });
  } catch (err) {
    next(err);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabase
      .from('expenses').select('id').eq('id', id).eq('operator_id', req.operator.id).single();
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
};

const getExpenseSummary = async (req, res, next) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear().toString();
    const from = `${currentYear}-01-01`;
    const to = `${currentYear}-12-31`;

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('category, amount, expense_date')
      .eq('operator_id', req.operator.id)
      .gte('expense_date', from)
      .lte('expense_date', to);

    if (error) throw error;

    const byCategory = {};
    let total = 0;
    for (const e of expenses || []) {
      byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
      total += parseFloat(e.amount);
    }

    res.json({ total, byCategory, year: currentYear });
  } catch (err) {
    next(err);
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary };
