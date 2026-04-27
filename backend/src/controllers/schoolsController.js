const supabase = require('../config/database');

const getSchools = async (req, res, next) => {
  try {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('*')
      .eq('operator_id', req.operator.id)
      .order('name');
    if (error) throw error;
    res.json({ schools });
  } catch (err) { next(err); }
};

const createSchool = async (req, res, next) => {
  try {
    const { name, location } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'School name is required' });
    const { data: school, error } = await supabase
      .from('schools')
      .insert({ operator_id: req.operator.id, name: name.trim(), location: location?.trim() || null })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ school });
  } catch (err) { next(err); }
};

const updateSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'School name is required' });
    const { data: existing } = await supabase.from('schools').select('id').eq('id', id).eq('operator_id', req.operator.id).single();
    if (!existing) return res.status(404).json({ error: 'School not found' });
    const { data: school, error } = await supabase
      .from('schools')
      .update({ name: name.trim(), location: location?.trim() || null })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ school });
  } catch (err) { next(err); }
};

const deleteSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabase.from('schools').select('id').eq('id', id).eq('operator_id', req.operator.id).single();
    if (!existing) return res.status(404).json({ error: 'School not found' });
    const { error } = await supabase.from('schools').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'School deleted' });
  } catch (err) { next(err); }
};

const getAnalytics = async (req, res, next) => {
  try {
    const { data: schools } = await supabase.from('schools').select('id, name').eq('operator_id', req.operator.id);
    if (!schools?.length) return res.json({ analytics: [] });

    const { data: parents } = await supabase.from('parents').select('id').eq('operator_id', req.operator.id);
    const parentIds = (parents || []).map(p => p.id);

    if (!parentIds.length) {
      return res.json({ analytics: schools.map(s => ({ id: s.id, name: s.name, students: 0, clients: 0, revenue: 0, outstanding: 0 })) });
    }

    const [{ data: children }, { data: payments }] = await Promise.all([
      supabase.from('children').select('id, parent_id, school_id').in('parent_id', parentIds).not('school_id', 'is', null),
      supabase.from('payments').select('parent_id, amount, amount_collected, status').in('parent_id', parentIds),
    ]);

    const parentSchools = {};
    (children || []).forEach(c => {
      if (!parentSchools[c.parent_id]) parentSchools[c.parent_id] = new Set();
      parentSchools[c.parent_id].add(c.school_id);
    });

    const stats = {};
    schools.forEach(s => { stats[s.id] = { id: s.id, name: s.name, students: 0, clients: new Set(), revenue: 0, outstanding: 0 }; });

    (children || []).forEach(c => {
      if (stats[c.school_id]) {
        stats[c.school_id].students++;
        stats[c.school_id].clients.add(c.parent_id);
      }
    });

    (payments || []).forEach(pay => {
      const sids = parentSchools[pay.parent_id];
      if (!sids) return;
      const amt = parseFloat(pay.amount) || 0;
      const col = parseFloat(pay.amount_collected) || 0;
      sids.forEach(sid => {
        if (!stats[sid]) return;
        if (pay.status === 'PAID') { stats[sid].revenue += amt; }
        else if (pay.status === 'PARTIALLY_PAID') { stats[sid].revenue += col; stats[sid].outstanding += amt - col; }
        else { stats[sid].outstanding += amt; }
      });
    });

    res.json({
      analytics: Object.values(stats).map(s => ({
        id: s.id, name: s.name, students: s.students, clients: s.clients.size,
        revenue: Math.round(s.revenue * 100) / 100,
        outstanding: Math.round(s.outstanding * 100) / 100,
      })),
    });
  } catch (err) { next(err); }
};

module.exports = { getSchools, createSchool, updateSchool, deleteSchool, getAnalytics };
