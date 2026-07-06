const supabase = require('../config/database');

// Cache validated tokens for 60s to avoid 2 DB roundtrips on every request.
const cache = new Map();
const CACHE_TTL = 60_000;

const pruneCache = () => {
  const now = Date.now();
  for (const [k, v] of cache) {
    if (now - v.ts > CACHE_TTL) cache.delete(k);
  }
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  const hit = cache.get(token);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    req.operator = hit.operator;
    return next();
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

  const { data: operator } = await supabase
    .from('operators')
    .select('subscription_status')
    .eq('id', user.id)
    .maybeSingle();

  if (!operator) return res.status(404).json({ error: 'Operator profile not found' });
  if (operator.subscription_status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
  }

  const operatorData = { id: user.id, email: user.email };
  cache.set(token, { operator: operatorData, ts: Date.now() });

  if (cache.size > 500) pruneCache();

  req.operator = operatorData;
  next();
};

module.exports = authMiddleware;
