const supabase = require('../config/database');

const supabaseSignIn = async (email, password) => {
  const res = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ email, password }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error_description || data.msg || 'Invalid credentials');
    err.status = 401;
    throw err;
  }
  return data;
};

const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    let session;
    try {
      session = await supabaseSignIn(email, password);
    } catch {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { data: admin } = await supabase
      .from('super_admins')
      .select('id, email, full_name')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!admin) return res.status(403).json({ error: 'Not authorised as admin' });

    res.json({ token: session.access_token, admin });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  res.json({ admin: req.admin });
};

const getOperators = async (req, res, next) => {
  try {
    const [
      { data: operators, error },
      { data: allVehicles },
      { data: allParents },
    ] = await Promise.all([
      supabase.from('operators')
        .select('id, email, full_name, business_name, phone, subscription_status, suspension_date, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('vehicles').select('operator_id'),
      supabase.from('parents').select('operator_id'),
    ]);

    if (error) throw error;

    const vehicleMap = {};
    (allVehicles || []).forEach((v) => {
      vehicleMap[v.operator_id] = (vehicleMap[v.operator_id] || 0) + 1;
    });

    const parentMap = {};
    (allParents || []).forEach((p) => {
      parentMap[p.operator_id] = (parentMap[p.operator_id] || 0) + 1;
    });

    const enriched = (operators || []).map((op) => ({
      ...op,
      stats: {
        vehicles: vehicleMap[op.id] || 0,
        parents: parentMap[op.id] || 0,
      },
    }));

    res.json({ operators: enriched });
  } catch (err) {
    next(err);
  }
};

const getOperatorDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: operator, error } = await supabase
      .from('operators')
      .select('id, email, full_name, business_name, phone, mpesa_paybill, subscription_status, suspension_date, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!operator) return res.status(404).json({ error: 'Operator not found' });

    const [
      { data: vehicles },
      { data: parents },
      { data: parentRows },
    ] = await Promise.all([
      supabase.from('vehicles')
        .select('id, license_plate, model, route, status, max_capacity')
        .eq('operator_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('parents')
        .select('id, full_name, phone, email, created_at')
        .eq('operator_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('parents').select('id').eq('operator_id', id),
    ]);

    const parentIds = (parentRows || []).map((p) => p.id);
    let payments = [];
    let totalRevenue = 0;
    let pendingAmount = 0;

    if (parentIds.length > 0) {
      const { data: paymentRows } = await supabase
        .from('payments')
        .select('id, amount, amount_collected, status, invoice_month, payment_method, payment_date, parents(full_name)')
        .in('parent_id', parentIds)
        .order('created_at', { ascending: false })
        .limit(20);

      payments = paymentRows || [];
      totalRevenue = payments.reduce((s, p) => s + parseFloat(p.amount_collected || 0), 0);
      pendingAmount = payments
        .filter((p) => p.status !== 'PAID')
        .reduce((s, p) => s + (parseFloat(p.amount) - parseFloat(p.amount_collected || 0)), 0);
    }

    const { count: studentCount } = await supabase
      .from('children')
      .select('*', { count: 'exact', head: true })
      .in('parent_id', parentIds.length > 0 ? parentIds : ['none']);

    res.json({
      operator,
      vehicles: vehicles || [],
      parents: parents || [],
      payments,
      stats: {
        vehicles: (vehicles || []).length,
        parents: (parents || []).length,
        students: studentCount || 0,
        revenue: totalRevenue,
        pending: pendingAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};

const freezeOperator = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: operator, error } = await supabase
      .from('operators')
      .update({ subscription_status: 'SUSPENDED', suspension_date: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, full_name, business_name, subscription_status, suspension_date')
      .single();

    if (error) throw error;
    if (!operator) return res.status(404).json({ error: 'Operator not found' });

    res.json({ operator });
  } catch (err) {
    next(err);
  }
};

const unfreezeOperator = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: operator, error } = await supabase
      .from('operators')
      .update({ subscription_status: 'ACTIVE', suspension_date: null })
      .eq('id', id)
      .select('id, email, full_name, business_name, subscription_status, suspension_date')
      .single();

    if (error) throw error;
    if (!operator) return res.status(404).json({ error: 'Operator not found' });

    res.json({ operator });
  } catch (err) {
    next(err);
  }
};

const deleteOperator = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;

    res.json({ message: 'Operator deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { signin, getMe, getOperators, getOperatorDetail, freezeOperator, unfreezeOperator, deleteOperator };
