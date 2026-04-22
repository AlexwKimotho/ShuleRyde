const supabase = require('../config/database');

const adminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { data: admin } = await supabase
    .from('super_admins')
    .select('id, email, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!admin) return res.status(403).json({ error: 'Access denied' });

  req.admin = admin;
  next();
};

module.exports = adminAuth;
