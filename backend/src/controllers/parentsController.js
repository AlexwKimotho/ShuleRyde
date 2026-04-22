const { validationResult } = require('express-validator');
const supabase = require('../config/database');

const getParents = async (req, res, next) => {
  try {
    const { data: parents, error } = await supabase
      .from('parents')
      .select('*, children(id, full_name, school_name, pickup_location, dropoff_location, vehicle_id, vehicles(id, license_plate, model, route))')
      .eq('operator_id', req.operator.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ parents });
  } catch (err) {
    next(err);
  }
};

const createParent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { full_name, phone, email } = req.body;

    const { data: parent, error } = await supabase
      .from('parents')
      .insert({ operator_id: req.operator.id, full_name, phone, email: email || null })
      .select()
      .single();

    if (error) throw error;

    supabase.from('activity_logs').insert({
      operator_id: req.operator.id,
      event_type: 'SYSTEM_EVENT',
      description: `Parent ${parent.full_name} registered`,
    }).then(() => {});

    res.status(201).json({ parent: { ...parent, children: [] } });
  } catch (err) {
    next(err);
  }
};

const updateParent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { full_name, phone, email } = req.body;

    const { data: existing } = await supabase
      .from('parents').select('id').eq('id', id).eq('operator_id', req.operator.id).single();
    if (!existing) return res.status(404).json({ error: 'Parent not found' });

    const { data: parent, error } = await supabase
      .from('parents')
      .update({ full_name, phone, email: email || null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ parent });
  } catch (err) {
    next(err);
  }
};

const deleteParent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabase
      .from('parents').select('id').eq('id', id).eq('operator_id', req.operator.id).single();
    if (!existing) return res.status(404).json({ error: 'Parent not found' });

    const { error } = await supabase.from('parents').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Parent deleted' });
  } catch (err) {
    next(err);
  }
};

// --- Students (children) ---

const createStudent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { parent_id } = req.params;
    const { full_name, school_name, pickup_location, dropoff_location, vehicle_id } = req.body;

    const { data: parent } = await supabase
      .from('parents').select('id').eq('id', parent_id).eq('operator_id', req.operator.id).single();
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    const { data: student, error } = await supabase
      .from('children')
      .insert({ parent_id, full_name, school_name, pickup_location, dropoff_location, vehicle_id: vehicle_id || null })
      .select('*, vehicles(id, license_plate, model, route)')
      .single();

    if (error) throw error;
    res.status(201).json({ student });
  } catch (err) {
    next(err);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, school_name, pickup_location, dropoff_location, vehicle_id } = req.body;

    const { data: student, error } = await supabase
      .from('children')
      .update({ full_name, school_name, pickup_location, dropoff_location, vehicle_id: vehicle_id || null })
      .eq('id', id)
      .select('*, vehicles(id, license_plate, model, route)')
      .single();

    if (error) throw error;
    res.json({ student });
  } catch (err) {
    next(err);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('children').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Student deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getParents, createParent, updateParent, deleteParent, createStudent, updateStudent, deleteStudent };
