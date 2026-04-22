const supabase = require('../config/database');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { data: operator } = await supabase
    .from('operators')
    .select('subscription_status')
    .eq('id', user.id)
    .maybeSingle();

  if (!operator) return res.status(404).json({ error: 'Operator profile not found' });

  if (operator.subscription_status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
  }

  req.operator = { id: user.id, email: user.email };
  next();
};

module.exports = authMiddleware;
