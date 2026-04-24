const supabase = require('../config/database');

const FIELDS = 'id, email, full_name, business_name, phone, mpesa_paybill, subscription_status, created_at, profile_picture_url';
const BUCKET = 'profile-pictures';

const getSettings = async (req, res, next) => {
  try {
    const { data: operator, error } = await supabase
      .from('operators')
      .select(FIELDS)
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
      .select(FIELDS)
      .single();

    if (error) throw error;
    res.json({ operator });
  } catch (err) {
    next(err);
  }
};

const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Ensure the bucket exists (no-op if already created)
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

    const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `${req.operator.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

    const { data: operator, error } = await supabase
      .from('operators')
      .update({ profile_picture_url: publicUrl })
      .eq('id', req.operator.id)
      .select(FIELDS)
      .single();

    if (error) throw error;
    res.json({ operator });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings, uploadProfilePicture };
