const supabase = require('../config/database');

const getSettings = async (req, res, next) => {
  try {
    const { data: operator, error } = await supabase
      .from('operators')
      .select('id, email, full_name, business_name, phone, mpesa_paybill, subscription_status, created_at')
      .eq('id', req.operator.id)
      .maybeSingle();

    if (error) throw error;
    if (!operator) return res.status(404).json({ error: 'Operator not found' });
    res.json({ operator });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { full_name, business_name, phone, mpesa_paybill } = req.body;

    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (business_name) updates.business_name = business_name;
    if (phone) updates.phone = phone;
    if (mpesa_paybill !== undefined) updates.mpesa_paybill = mpesa_paybill || null;

    const { data: operator, error } = await supabase
      .from('operators')
      .update(updates)
      .eq('id', req.operator.id)
      .select('id, email, full_name, business_name, phone, mpesa_paybill, subscription_status, created_at')
      .single();

    if (error) throw error;
    res.json({ operator });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings };
