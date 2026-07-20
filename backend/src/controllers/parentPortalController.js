const supabase = require('../config/database');

const getPortal = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;

    const { data: parent, error } = await supabase
      .from('parents')
      .select('id, full_name, phone, email, operator_id, operators(business_name, mpesa_paybill)')
      .eq('unique_url_id', uniqueId)
      .maybeSingle();

    if (error) throw error;
    if (!parent) return res.status(404).json({ error: 'Portal not found' });

    const [
      { data: children },
      { data: payments },
    ] = await Promise.all([
      supabase.from('children')
        .select('id, full_name, school_name, pickup_location, vehicle_id, vehicles(license_plate, model, route)')
        .eq('parent_id', parent.id),
      supabase.from('payments')
        .select('id, invoice_month, amount, amount_collected, status, payment_date, payment_method')
        .eq('parent_id', parent.id)
        .order('invoice_month', { ascending: false })
        .limit(24),
    ]);

    const childIds = (children || []).map(c => c.id);
    let checkins = [];
    if (childIds.length > 0) {
      const { data } = await supabase
        .from('manifests')
        .select('student_id, check_date, arrived_at')
        .in('student_id', childIds)
        .order('check_date', { ascending: false })
        .limit(60);
      checkins = data || [];
    }

    const checkinsByStudent = {};
    for (const c of checkins) {
      if (!checkinsByStudent[c.student_id]) checkinsByStudent[c.student_id] = [];
      checkinsByStudent[c.student_id].push(c);
    }

    const enrichedChildren = (children || []).map(child => ({
      ...child,
      recent_checkins: (checkinsByStudent[child.id] || []).slice(0, 14),
    }));

    const paymentsList = payments || [];
    const totalOutstanding = paymentsList
      .filter(p => p.status !== 'PAID')
      .reduce((sum, p) => sum + (parseFloat(p.amount) - parseFloat(p.amount_collected || 0)), 0);
    const totalPaid = paymentsList
      .reduce((sum, p) => sum + parseFloat(p.amount_collected || 0), 0);

    res.json({
      parent: {
        full_name: parent.full_name,
        phone: parent.phone,
        email: parent.email,
        business_name: parent.operators?.business_name,
        mpesa_paybill: parent.operators?.mpesa_paybill,
      },
      children: enrichedChildren,
      payments: paymentsList,
      summary: {
        total_outstanding: totalOutstanding,
        total_paid: totalPaid,
        children_count: enrichedChildren.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;
    const { phone, email } = req.body;

    const updates = {};
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;

    const { data, error } = await supabase
      .from('parents')
      .update(updates)
      .eq('unique_url_id', uniqueId)
      .select('full_name, phone, email')
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Portal not found' });

    res.json({ parent: data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPortal, updateContact };
