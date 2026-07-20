const supabase = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const operatorId = req.operator.id;
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('operator_id', operatorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ drivers: data || [] });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const operatorId = req.operator.id;
    const { name, phone, license_number, license_expiry, vehicle_id, status } = req.body;
    const { data, error } = await supabase
      .from('drivers')
      .insert([{
        operator_id: operatorId,
        name,
        phone: phone || null,
        license_number: license_number || null,
        license_expiry: license_expiry || null,
        vehicle_id: vehicle_id || null,
        status: status || 'ACTIVE',
      }])
      .select();
    if (error) throw error;

    await supabase.from('activity_logs').insert([{
      operator_id: operatorId,
      event_type: 'DRIVER_ADDED',
      description: `Driver ${name} added`,
    }]);

    res.status(201).json({ driver: data[0] });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const operatorId = req.operator.id;
    const { id } = req.params;
    const { name, phone, license_number, license_expiry, vehicle_id, status } = req.body;
    const { data, error } = await supabase
      .from('drivers')
      .update({
        name,
        phone: phone || null,
        license_number: license_number || null,
        license_expiry: license_expiry || null,
        vehicle_id: vehicle_id || null,
        status,
      })
      .eq('id', id)
      .eq('operator_id', operatorId)
      .select();
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ error: 'Driver not found' });
    res.json({ driver: data[0] });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const operatorId = req.operator.id;
    const { id } = req.params;
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
      .eq('operator_id', operatorId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
