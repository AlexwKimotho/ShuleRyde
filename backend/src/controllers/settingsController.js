const multer = require('multer');
const supabase = require('../config/database');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const getSettings = async (req, res, next) => {
  try {
    const { data: operator, error } = await supabase
      .from('operators')
      .select('id, email, full_name, business_name, phone, mpesa_paybill, logo_url, subscription_status, created_at')
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
      .select('id, email, full_name, business_name, phone, mpesa_paybill, logo_url, subscription_status, created_at')
      .single();

    if (error) throw error;
    res.json({ operator });
  } catch (err) {
    next(err);
  }
};

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const ext = req.file.mimetype.split('/')[1] || 'png';
    const fileName = `${req.operator.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('operators')
      .update({ logo_url: publicUrl })
      .eq('id', req.operator.id);

    if (updateError) throw updateError;

    res.json({ logo_url: publicUrl });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings, uploadLogo, upload };
