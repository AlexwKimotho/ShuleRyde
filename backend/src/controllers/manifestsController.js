const supabase = require('../config/database');

const todayDate = () => new Date().toISOString().slice(0, 10);

const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return '254' + digits.slice(1);
  if (digits.length === 9) return '254' + digits;
  return digits;
};

const sendCheckinWhatsApp = async (studentId) => {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;
    if (!phoneNumberId || !token) return;

    const { data: student } = await supabase
      .from('children')
      .select('full_name, parents(phone, operators(business_name))')
      .eq('id', studentId)
      .maybeSingle();

    if (!student?.parents?.phone) return;
    const to = normalizePhone(student.parents.phone);
    if (!to) return;

    const bizName = student.parents.operators?.business_name || 'ShuleRyde';
    const time = new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    const body = `✅ ${student.full_name} has boarded and been checked in at ${time}. Safe travels! — ${bizName}`;

    await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    });
  } catch {
    // fire-and-forget — never fail the check-in
  }
};

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

    // Fire-and-forget WhatsApp notification to parent
    sendCheckinWhatsApp(student_id);

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
