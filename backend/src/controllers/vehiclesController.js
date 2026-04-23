const { validationResult } = require('express-validator');
const supabase = require('../config/database');

const getVehicles = async (req, res, next) => {
  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*, drivers(id, full_name, phone, license_number, status), children(id, full_name, school_name, pickup_location, dropoff_location, parents(full_name, phone))')
      .eq('operator_id', req.operator.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ vehicles });
  } catch (err) {
    next(err);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { license_plate, model, route, max_capacity } = req.body;

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({
        operator_id: req.operator.id,
        license_plate: license_plate.toUpperCase(),
        model,
        route,
        max_capacity: max_capacity || 7,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'A vehicle with this license plate already exists' });
      }
      throw error;
    }

    supabase.from('activity_logs').insert({
      operator_id: req.operator.id,
      vehicle_id: vehicle.id,
      event_type: 'SYSTEM_EVENT',
      description: `Vehicle ${vehicle.license_plate} (${vehicle.model}) added to fleet`,
    }).then(() => {});

    res.status(201).json({ vehicle });
  } catch (err) {
    next(err);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { license_plate, model, route, max_capacity, status, driver_id } = req.body;

    // Verify ownership
    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .eq('operator_id', req.operator.id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Vehicle not found' });

    const updates = {};
    if (license_plate) updates.license_plate = license_plate.toUpperCase();
    if (model) updates.model = model;
    if (route !== undefined) updates.route = route;
    if (max_capacity) updates.max_capacity = max_capacity;
    if (status) updates.status = status;
    if (driver_id !== undefined) updates.driver_id = driver_id || null;

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select('*, drivers(id, full_name, phone, license_number, status)')
      .single();

    if (error) throw error;

    res.json({ vehicle });
  } catch (err) {
    next(err);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .eq('operator_id', req.operator.id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Vehicle not found' });

    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getVehicles, createVehicle, updateVehicle, deleteVehicle };
