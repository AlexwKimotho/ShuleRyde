const supabase = require('../config/database');

const todayDate = () => new Date().toISOString().slice(0, 10);

// GET /api/manifests?date=YYYY-MM-DD
const getManifest = async (req, res, next) => {
  try {
    const date = req.query.date || todayDate();
    const operatorId = req.operator.id;

    const { data, error } = await supabase
      .from('manifests')
      .select('student_id, arrived_at, notes')
      .eq('operator_id', operatorId)
      .eq('check_date', date);

    if (error) throw error;

    // Return as map: { [student_id]: { arrived: true, time: 'HH:MM' } }
    const checkIns = {};
    for (const row of data || []) {
      const time = new Date(row.arrived_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
      checkIns[row.student_id] = { arrived: true, time };
    }
    res.json({ checkIns, date });
  } catch (err) {
    next(err);
  }
};

// POST /api/manifests/checkin
const checkIn = async (req, res, next) => {
  try {
    const { student_id, notes } = req.body;
    if (!student_id) return res.status(400).json({ error: 'student_id is required' });

    const operatorId = req.operator.id;
    const date = todayDate();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('manifests')
      .upsert(
        { operator_id: operatorId, student_id, check_date: date, arrived_at: now, notes: notes || null },
        { onConflict: 'student_id,check_date' }
      )
      .select()
      .single();

    if (error) throw error;

    const time = new Date(data.arrived_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    res.status(201).json({ student_id: data.student_id, arrived: true, time });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/manifests/checkin/:studentId
const undoCheckIn = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const operatorId = req.operator.id;
    const date = todayDate();

    const { error } = await supabase
      .from('manifests')
      .delete()
      .eq('operator_id', operatorId)
      .eq('student_id', studentId)
      .eq('check_date', date);

    if (error) throw error;
    res.json({ message: 'Check-in removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getManifest, checkIn, undoCheckIn };
