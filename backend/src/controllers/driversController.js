const { validationResult } = require('express-validator');
const supabase = require('../config/database');

const getDrivers = async (req, res, next) => {
  try {
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*, vehicles(id, license_plate, model)')
      .eq('operator_id', req.operator.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ drivers });
  } catch (err) {
    next(err);
  }
};

const createDriver = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { full_name, phone, license_number, notes } = req.body;

    const { data: driver, error } = await supabase
      .from('drivers')
      .insert({
        operator_id: req.operator.id,
        full_name,
        phone,
        license_number: license_number || null,
        notes: notes || null,
        status: 'ACTIVE',
      })
      .select('*, vehicles(id, license_plate, model)')
      .single();

    if (error) throw error;
    res.status(201).json({ driver });
  } catch (err) {
    next(err);
  }
};

const updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone, license_number, status, notes } = req.body;

    const { data: existing } = await supabase
      .from('drivers').select('id').eq('id', id).eq('operator_id', req.operator.id).single();
    if (!existing) return res.status(404).json({ error: 'Driver not found' });

    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (license_number !== undefined) updates.license_number = license_number || null;
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes || null;

    const { data: driver, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select('*, vehicles(id, license_plate, model)')
      .single();

    if (error) throw error;
    res.json({ driver });
  } catch (err) {
    next(err);
  }
};

const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('drivers').select('id').eq('id', id).eq('operator_id', req.operator.id).single();
    if (!existing) return res.status(404).json({ error: 'Driver not found' });

    // Unassign driver from any vehicle before deleting
    await supabase.from('vehicles').update({ driver_id: null }).eq('driver_id', id);

    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDrivers, createDriver, updateDriver, deleteDriver };
