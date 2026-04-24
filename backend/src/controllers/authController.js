const { validationResult } = require('express-validator');
const supabase = require('../config/database');

// Sign in via the Supabase REST API directly so the service-role client's
// in-memory session is never overwritten by the user's JWT.
const supabaseSignIn = async (email, password) => {
  const res = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ email, password }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error_description || data.msg || 'Invalid email or password';
    const err = new Error(msg);
    err.status = 401;
    throw err;
  }
  return data; // { access_token, refresh_token, user, ... }
};

const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, full_name, business_name, phone } = req.body;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already')) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw authError;
    }

    const { data: operator, error: profileError } = await supabase
      .from('operators')
      .insert({ id: authData.user.id, email, full_name, business_name, phone })
      .select('id, email, full_name, business_name, phone, subscription_status, permissions, created_at, profile_picture_url')
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    const session = await supabaseSignIn(email, password);

    res.status(201).json({ token: session.access_token, operator });
  } catch (err) {
    if (err.status === 401) return res.status(401).json({ error: err.message });
    next(err);
  }
};

const signin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    let session;
    try {
      session = await supabaseSignIn(email, password);
    } catch {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { data: operator, error: profileError } = await supabase
      .from('operators')
      .select('id, email, full_name, business_name, phone, mpesa_paybill, subscription_status, permissions, created_at, profile_picture_url')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!operator) return res.status(404).json({ error: 'Operator profile not found' });

    res.json({ token: session.access_token, operator });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { data: operator, error } = await supabase
      .from('operators')
      .select('id, email, full_name, business_name, phone, mpesa_paybill, subscription_status, permissions, created_at, profile_picture_url')
      .eq('id', req.operator.id)
      .maybeSingle();

    if (error || !operator) return res.status(404).json({ error: 'Operator not found' });

    res.json({ operator });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, signin, getMe };
